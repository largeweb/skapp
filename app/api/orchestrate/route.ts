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

        const mode = body.data.mode || determineAgentMode(agentId, agent, estTime, today)
        if (!mode) {
          skipped++
          results.push({ agentId, status: 'skipped', reason: 'No active mode' })
          continue
        }

        console.log(`⚡ Agent '${agentId}' → mode '${mode}'`)

        // Prepare minimal, mode-aware payload
        const payload = preparePayload(agentId, agent, mode, estTime)
        console.log(`🔍 Payload: ${JSON.stringify(payload)}`)

        // Update lightweight tracking (non-critical)
        try {
          agent.turnsCount = (agent.turnsCount || 0) + 1
          agent.lastTurnTriggered = estTime.toISOString()
          await env.SKAPP_AGENTS.put(`agent:${agentId}`, JSON.stringify(agent))
        } catch (e) {
          console.warn(`📝 Tracking update failed for '${agentId}':`, e)
        }

        const { ok, content } = await callSpawnkitGen(payload)
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

        // Update lastActivity via PUT to agent endpoint
        try {
          const origin = new URL(request.url).origin
          await fetch(`${origin}/api/agents/${agentId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
          })
        } catch (putErr) {
          console.warn(`⚠️ Agent PUT lastActivity update failed for '${agentId}':`, putErr)
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

function determineAgentMode(agentId: string, agent: AgentRecord, estTime: Date, today: string): Mode | null {
  const hour = estTime.getHours()
  const minute = estTime.getMinutes()

  const last = agent.modeLastRun || {}
  const lastSleep = last.sleep

  // Awake window 5:00 - 3:00
  if ((hour === 5 && minute >= 0) || (hour >= 6 && hour <= 23) || hour === 0 || hour === 1 || hour === 2 || (hour === 3 && minute === 0)) {
    return 'awake'
  }

  // Sleep once around 4:00
  if (hour === 4 && minute >= 0 && minute < 10) {
    if (lastSleep !== today) return 'sleep'
  }

  return null
}

function preparePayload(agentId: string, agent: AgentRecord, mode: Mode, estTime: Date) {
  const timeStr = estTime.toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour12: true, hour: 'numeric', minute: '2-digit' })
  const systemPrompt = `# Agent Identity: ${agentId}

${agent.description || 'No description provided.'}

## Current Mode: ${mode}
It's ${timeStr} EST.

## Memory Snapshot
PMEM: ${(agent.pmem?.length || 0)} | NOTE: ${(agent.note?.length || 0)} | THGT: ${(agent.thgt?.length || 0)} | TOOLS: ${(agent.tools?.length || 0)}
`

  // Convert turn_history to conversationHistory format for compatibility
  const conversationHistory: { role: 'user' | 'assistant'; content: string; timestamp?: string }[] = []
  if (Array.isArray(agent.turn_history)) {
    agent.turn_history.slice(-20).forEach((turn) => {
      const content = turn.parts?.map(part => part.text).join(' ') || ''
      if (content.trim()) {
        conversationHistory.push({
          role: turn.role === 'model' ? 'assistant' : 'user',
          content: content,
          timestamp: new Date().toISOString()
        })
      }
    })
  }

  // Remove incomplete conversation pairs
  if (conversationHistory.length && conversationHistory[conversationHistory.length - 1].role === 'user') {
    conversationHistory.pop()
  }

  return {
    agentId,
    systemPrompt,
    conversationHistory,
    turnPrompt: generateTurnPrompt(mode, estTime),
    mode
  }
}

function generateTurnPrompt(mode: Mode, estTime: Date): string {
  const hour = estTime.getHours()
  const timeStr = estTime.toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour12: true, hour: 'numeric', minute: '2-digit' })
  switch (mode) {
    case 'awake':
      return `It's ${timeStr} EST. Continue your autonomous operation and pursue your goals.

Generate the next chunk of text that includes:
- Current progress assessment and remaining goals
- Tool usage suggestions (web_search(), write_discord_msg(), etc.)
- Next immediate actions and priorities
- Remember: thoughts in system prompt expire today, prioritize accordingly

Include a <turn-prompt-rationale> explaining your reasoning and a <turn-prompt> for the next turn.`
    case 'sleep':
      return `It's ${timeStr} EST. Reflect on today's activities and prepare for tomorrow.

Generate a comprehensive summary including:
- Key learnings and insights from the day
- Important immediate actions for tomorrow
- Strategic priorities and patterns observed

Use take_note() for important learnings and take_thought() for tomorrow's focus items.
Include a <summary> tag with a concise summary for the next day's conversation history.`
  }
}

async function callSpawnkitGen(payload: any): Promise<{ ok: boolean; content?: string }> {
  const max = 3
  for (let attempt = 1; attempt <= max; attempt++) {
    try {
      const res = await fetch('https://spawnkit-gen-905712754351.us-central1.run.app/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'SpawnKit-Orchestration/1.0'
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000)
      })

      if (res.ok) {
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


