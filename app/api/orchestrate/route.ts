export const runtime = 'edge'

import { getRequestContext } from '@cloudflare/next-on-pages'
import { z } from 'zod'

type Mode = 'awake' | 'sleep'

interface AgentRecord {
  agentId?: string
  name?: string
  description?: string
  currentMode?: string
  createdAt?: string
  lastActivity?: string
  modeLastRun?: {
    sleep?: string | null
  }
  turnsCount?: number
  lastTurnTriggered?: string
  pmem?: string[]
  note?: string[]
  thgt?: string[]
  tools?: string[]
  turn_prompt?: string
  turn_history?: Array<{
    role: 'user' | 'model'
    parts: Array<{
      text: string
    }>
  }>
  system_permanent_memory?: string[]
  system_notes?: string[]
  system_thoughts?: string[]
  system_tools?: string[]
}

const OrchestrationRequestSchema = z.object({
  agentId: z.string().min(1).max(100).optional(),
  mode: z.enum(['awake', 'sleep']).optional(),
  estTime: z.string().datetime().optional()
})

export async function POST(request: Request) {
  const started = Date.now()
  console.log('🎭 Orchestration API: Start')

  try {
    const { env } = getRequestContext()
    const raw = await request.json().catch(() => ({}))
    const body = OrchestrationRequestSchema.safeParse(raw)
    if (!body.success) {
      return Response.json({ error: 'Invalid request', details: body.error.flatten() }, { status: 400 })
    }

    // Time handling (EST regardless of PoP)
    const now = body.data.estTime ? new Date(body.data.estTime) : new Date()
    const estTime = convertToEST(now)
    const today = estTime.toISOString().slice(0, 10)
    console.log(`🌍 Orchestration time: UTC ${now.toISOString()} → EST ${estTime.toISOString()}`)

    // Determine mode for all agents (hour = 5 = sleep, otherwise awake)
    const mode = body.data.mode || (estTime.getHours() === 5 ? 'sleep' : 'awake')
    console.log(`🎭 Determined mode: ${mode} for all agents`)

    // Determine agents to process
    let agentKeys: string[] = []
    if (body.data.agentId) {
      agentKeys = [`agent:${body.data.agentId}`]
      console.log(`🎯 Single agent: ${body.data.agentId}`)
    } else {
      const list = await env.SKAPP_AGENTS.list({ prefix: 'agent:' })
      agentKeys = list.keys.map(k => k.name)
      console.log(`🤖 Found ${agentKeys.length} agents`)
    }

    if (agentKeys.length === 0) {
      return Response.json({ success: true, processed: 0, estTime: estTime.toISOString(), message: 'No agents found' })
    }

    let processed = 0, successful = 0, failed = 0, skipped = 0
    const results: any[] = []

    for (const key of agentKeys) {
      const agentId = key.replace(/^agent:/, '')
      console.log(`🎯 Agent: ${agentId}`)
      const loopStart = Date.now()
      try {
        const raw = await env.SKAPP_AGENTS.get(key)
        if (!raw) {
          console.warn(`👻 Agent missing data: ${agentId}`)
          failed++
          results.push({ agentId, status: 'failed', reason: 'Not found' })
          continue
        }

        const agent = JSON.parse(raw) as AgentRecord

        console.log(`⚡ Agent '${agentId}' → mode '${mode}'`)

        // Prepare minimal, mode-aware payload
        const payload = preparePayload(agentId, agent, mode, estTime)
        console.log(`🔍 Payload: ${JSON.stringify(payload)}`)

        const { ok, content } = await callSpawnkitGen(env, agentId, payload, estTime, new URL(request.url).origin)
        if (!ok) {
          failed++
          results.push({ agentId, status: 'failed', mode, ms: Date.now() - loopStart })
          continue
        }

        // Mode-specific post-processing
        try {
          if (mode === 'sleep' && content) {
            const parsed = parseGeneratedOutput(content)
            const origin = new URL(request.url).origin
            // Persist notes
            for (const note of parsed.notes) {
              await postMemoryEntry(origin, agentId, 'note', {
                type: 'learning',
                content: note,
                metadata: { importance: 'high' }
              })
            }
            // Persist thoughts
            for (const thgt of parsed.thoughts) {
              await postMemoryEntry(origin, agentId, 'thgt', {
                type: 'reflection',
                content: thgt,
                metadata: { reasoningLevel: 'medium' }
              })
            }
            // Optionally store summary as a high-importance note
            if (parsed.summary) {
              await postMemoryEntry(origin, agentId, 'note', {
                type: 'insight',
                content: parsed.summary,
                metadata: { importance: 'high', context: 'daily_summary' }
              })
            }
          }
        } catch (persistErr) {
          console.warn(`⚠️ Post-processing/persist failed for '${agentId}':`, persistErr)
        }

        successful++
        results.push({ agentId, status: 'success', mode, ms: Date.now() - loopStart })
        processed++

        if (!body.data.agentId) {
          await new Promise(r => setTimeout(r, 100))
        }
      } catch (err) {
        console.error(`❌ Orchestration error for '${agentId}':`, err)
        failed++
        results.push({ agentId, status: 'failed', reason: (err as Error)?.message || 'Unknown' })
      }
    }

    console.log(`✅ Orchestration complete: ${processed} processed (${successful} ok, ${failed} failed, ${skipped} skipped) in ${Date.now() - started}ms`)
    return Response.json({
      success: true,
      estTime: estTime.toISOString(),
      today,
      processed,
      successful,
      failed,
      skipped,
      results,
      message: `Orchestrated ${processed} agents`
    })
  } catch (error) {
    console.error('🚨 Orchestration API error:', error)
    return Response.json({ error: 'Orchestration failed' }, { status: 500 })
  }
}

function convertToEST(utcDate: Date): Date {
  const isDST = isDaylightSavingTime(utcDate)
  const offset = isDST ? -4 : -5
  return new Date(utcDate.getTime() + offset * 60 * 60 * 1000)
}

function isDaylightSavingTime(date: Date): boolean {
  const year = date.getUTCFullYear()
  const march = new Date(year, 2, 1)
  const dstStart = new Date(year, 2, 14 - march.getDay())
  const november = new Date(year, 10, 1)
  const dstEnd = new Date(year, 10, 7 - november.getDay())
  return date >= dstStart && date < dstEnd
}



function preparePayload(agentId: string, agent: AgentRecord, mode: Mode, estTime: Date) {
  const timeStr = estTime.toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour12: true, hour: 'numeric', minute: '2-digit' })
  
  // Build structured system prompt with clear memory organization
  const systemPromptParts = []
  
  // 1. Agent Description (Core Goal/Identity)
  if (agent.description && agent.description.trim()) {
    systemPromptParts.push(`AGENT GOAL: ${agent.description}`)
  }
  
  // 2. Permanent Memory (Static, user-defined, persistent)
  if (agent.system_permanent_memory && agent.system_permanent_memory.length > 0) {
    systemPromptParts.push(`PERMANENT MEMORY (Static Knowledge):\n${agent.system_permanent_memory.join('\n')}`)
  }
  
  // 3. Weekly Notes (7-day persistence, weekly purpose)
  if (agent.system_notes && agent.system_notes.length > 0) {
    const now = new Date()
    const notesWithExpiry = agent.system_notes.map((note: any) => {
      if (typeof note === 'string') {
        // Legacy note format - treat as expiring soon
        return { content: note, expires_at: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString() }
      }
      return note
    })
    
    // Sort notes by expiration (expiring soon first)
    const sortedNotes = notesWithExpiry.sort((a: any, b: any) => {
      const aExpiry = new Date(a.expires_at || 0)
      const bExpiry = new Date(b.expires_at || 0)
      return aExpiry.getTime() - bExpiry.getTime()
    })
    
    // Group notes by urgency
    const urgentNotes = sortedNotes.filter((note: any) => {
      const expiry = new Date(note.expires_at)
      const hoursUntilExpiry = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60)
      return hoursUntilExpiry <= 24 // Expires within 24 hours
    })
    
    const regularNotes = sortedNotes.filter((note: any) => {
      const expiry = new Date(note.expires_at)
      const hoursUntilExpiry = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60)
      return hoursUntilExpiry > 24 // Expires in more than 24 hours
    })
    
    let notesSection = 'WEEKLY NOTES (7-day persistence):\n'
    
    if (urgentNotes.length > 0) {
      notesSection += '🚨 URGENT - EXPIRING SOON:\n'
      urgentNotes.forEach((note: any) => {
        const expiry = new Date(note.expires_at)
        const hoursUntilExpiry = Math.max(0, (expiry.getTime() - now.getTime()) / (1000 * 60 * 60))
        notesSection += `• ${note.content} (expires in ${Math.round(hoursUntilExpiry)}h)\n`
      })
      notesSection += '\n'
    }
    
    if (regularNotes.length > 0) {
      notesSection += '📝 REGULAR NOTES:\n'
      regularNotes.forEach((note: any) => {
        const expiry = new Date(note.expires_at)
        const daysUntilExpiry = Math.max(0, (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        notesSection += `• ${note.content} (expires in ${Math.round(daysUntilExpiry)}d)\n`
      })
    }
    
    systemPromptParts.push(notesSection)
  }
  
  // 4. Daily Thoughts (1-day persistence, daily goals)
  if (agent.system_thoughts && agent.system_thoughts.length > 0) {
    systemPromptParts.push(`DAILY THOUGHTS (1-day persistence):\n${agent.system_thoughts.join('\n')}`)
  }
  
  // 5. Available Tools
  if (agent.system_tools && agent.system_tools.length > 0) {
    systemPromptParts.push(`AVAILABLE TOOLS: ${agent.system_tools.join(', ')}`)
  }
  
  // 6. Current Time Context
  systemPromptParts.push(`CURRENT TIME: ${timeStr} EST`)
  
  const systemPrompt = systemPromptParts.join('\n\n')

  // Use agent's turn_history directly
  const turnHistory = agent.turn_history || []

  // Determine turn prompt based on existing agent.turn_prompt or generate new one
  let turnPrompt: string
  if (agent.turn_prompt && agent.turn_prompt.trim()) {
    turnPrompt = agent.turn_prompt
  } else {
    turnPrompt = mode === 'awake' 
      ? "Try to achieve your goals using the tools you have access to or propose new tools that the human should get you, always use tools in the format provided ie. take_note(<note>) or web_search(<query>). After your response, include your next step in <turn_prompt> tags."
      : "Summarize your turn history by taking all of your history and pulling out the top key ideas or notes, using take_note or take_thought and end your response with <summary> tag"
  }

  return {
    agentId,
    systemPrompt,
    turnHistory,
    turnPrompt,
    mode
  }
}


async function callSpawnkitGen(env: any, agentId: string, payload: any, estTime: Date, origin: string): Promise<{ ok: boolean; content?: string }> {
  const max = 3
  for (let attempt = 1; attempt <= max; attempt++) {
    try {
      console.log(`🔍 Calling SpawnkitGen for agent: ${agentId}`)
      
      const res = await fetch(`${origin}/api/agents/${agentId}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'SpawnKit-Orchestration/1.0'
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000)
      })

      if (res.ok) {
        // Update agent tracking after successful generation
        try {
          const agentData = await env.SKAPP_AGENTS.get(`agent:${agentId}`)
          if (agentData) {
            const agent = JSON.parse(agentData)
            agent.turnsCount = (agent.turnsCount || 0) + 1
            agent.lastTurnTriggered = estTime.toISOString()
            await env.SKAPP_AGENTS.put(`agent:${agentId}`, JSON.stringify(agent))
          }
        } catch (e) {
          console.warn(`📝 Tracking update failed for '${agentId}':`, e)
        }

        // Accept either JSON {content} or raw text
        const ct = res.headers.get('content-type') || ''
        if (ct.includes('application/json')) {
          const data: any = await res.json().catch(() => ({} as any))
          return { ok: true, content: data.content || data.text || '' }
        } else {
          const text = await res.text().catch(() => '')
          return { ok: true, content: text }
        }
      }
      const text = await res.text().catch(() => 'Unknown error')
      throw new Error(`HTTP ${res.status}: ${text}`)
    } catch (err) {
      if (attempt === max) break
      const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000
      console.warn(`⏳ Retry in ${Math.round(delay)}ms (attempt ${attempt})`)
      await new Promise(r => setTimeout(r, delay))
    }
  }
  return { ok: false }
}

function parseGeneratedOutput(text: string): { notes: string[]; thoughts: string[]; summary?: string; rationale?: string; nextTurnPrompt?: string } {
  const notes: string[] = []
  const thoughts: string[] = []
  const noteRe = /take_note\((?:"|\')([\s\S]*?)(?:"|\')\)/g
  const thgtRe = /take_thought\((?:"|\')([\s\S]*?)(?:"|\')\)/g
  let m: RegExpExecArray | null
  while ((m = noteRe.exec(text)) !== null) {
    const val = (m[1] || '').trim()
    if (val) notes.push(val)
  }
  while ((m = thgtRe.exec(text)) !== null) {
    const val = (m[1] || '').trim()
    if (val) thoughts.push(val)
  }
  const summaryMatch = text.match(/<summary>([\s\S]*?)<\/summary>/i)
  const rationaleMatch = text.match(/<turn-prompt-rationale>([\s\S]*?)<\/turn-prompt-rationale>/i)
  const nextTurnMatch = text.match(/<turn-prompt>([\s\S]*?)<\/turn-prompt>/i)
  return {
    notes,
    thoughts,
    summary: summaryMatch ? summaryMatch[1].trim() : undefined,
    rationale: rationaleMatch ? rationaleMatch[1].trim() : undefined,
    nextTurnPrompt: nextTurnMatch ? nextTurnMatch[1].trim() : undefined
  }
}

async function postMemoryEntry(origin: string, agentId: string, layer: 'note' | 'thgt', body: any) {
  const res = await fetch(`${origin}/api/agents/${agentId}/memory?layer=${layer}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  if (!res.ok) {
    const t = await res.text().catch(() => '')
    throw new Error(`Memory POST failed: ${res.status} ${t}`)
  }
}


