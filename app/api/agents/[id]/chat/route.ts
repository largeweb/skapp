export const runtime = 'edge'

import { getRequestContext } from '@cloudflare/next-on-pages'
import { z } from 'zod'

// Input validation schemas
const ChatMessageSchema = z.object({
  message: z.string().min(1).max(2000),
  stream: z.boolean().optional().default(false)
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { env } = await getRequestContext()
    const { id } = await params
    
    // Parse and validate input
    const body = await request.json()
    const validated = ChatMessageSchema.parse(body)
    
    // Check if agent exists
    const agentData = await env.SKAPP_AGENTS.get(`agent:${id}`)
    if (!agentData) {
      return Response.json({ 
        error: 'Agent not found',
        code: 'AGENT_NOT_FOUND'
      }, { status: 404 })
    }
    
    const agent = JSON.parse(agentData)
    
    // Fetch recent memory context
    const memoryContext = await buildMemoryContext(env, id)

    console.log("env=========>", env.GROQ_API_KEY)
    
    // Build system prompt with agent context
    console.log('memoryContext', memoryContext)
    const systemPrompt = buildSystemPrompt(agent, memoryContext)
    console.log('systemPrompt', systemPrompt)
    
    // Prepare conversation for Groq API
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: validated.message }
    ]
    
    // Call Groq API
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: env.GROQ_MODEL || 'openai/gpt-oss-120b',
        messages,
        stream: validated.stream,
        max_tokens: 1000,
        temperature: 0.7
      })
    })
    
    if (!groqResponse.ok) {
      const errorData = await groqResponse.text()
      console.error('Groq API error:', errorData)
      throw new Error(`Groq API error: ${groqResponse.status}`)
    }
    
    // Handle streaming response
    if (validated.stream) {
      const stream = groqResponse.body
      if (!stream) {
        throw new Error('No stream available')
      }
      
      // Create a transform stream to add agent context
      const transformStream = new TransformStream({
        transform(chunk, controller) {
          // Pass through the chunk
          controller.enqueue(chunk)
        }
      })
      
      // Store the conversation in memory
      const conversationEntry = {
        id: crypto.randomUUID(),
        role: 'user',
        content: validated.message,
        timestamp: new Date().toISOString(),
        agentId: id
      }
      
      // Store in work memory (temporary conversation storage)
      env.SKAPP_AGENTS.put(
        `memory:${id}:work:${conversationEntry.id}`,
        JSON.stringify(conversationEntry),
        { expirationTtl: 3600 } // 1 hour
      )
      
      return new Response(stream.pipeThrough(transformStream), {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      })
    }
    
    // Handle non-streaming response
    const response = await groqResponse.json() as any
    const assistantMessage = response.choices[0]?.message?.content || 'No response generated'
    
    // Store the conversation
    const userEntry = {
      id: crypto.randomUUID(),
      role: 'user',
      content: validated.message,
      timestamp: new Date().toISOString(),
      agentId: id
    }
    
    const assistantEntry = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: assistantMessage,
      timestamp: new Date().toISOString(),
      agentId: id
    }
    
    // Store both messages in work memory
    await Promise.all([
      env.SKAPP_AGENTS.put(
        `memory:${id}:work:${userEntry.id}`,
        JSON.stringify(userEntry),
        { expirationTtl: 3600 }
      ),
      env.SKAPP_AGENTS.put(
        `memory:${id}:work:${assistantEntry.id}`,
        JSON.stringify(assistantEntry),
        { expirationTtl: 3600 }
      )
    ])
    
    // Update agent's last activity
    agent.lastActivity = new Date().toISOString()
    await env.SKAPP_AGENTS.put(`agent:${id}`, JSON.stringify(agent))
    
    return Response.json({
      success: true,
      message: assistantMessage,
      conversation: [userEntry, assistantEntry]
    }, {
      headers: {
        'Cache-Control': 'no-store'
      }
    })
    
  } catch (error) {
    console.error('🚨 Chat error:', error instanceof Error ? error.message?.substring(0, 200) : String(error))
    
    if (error instanceof z.ZodError) {
      return Response.json({ 
        error: 'Invalid message format', 
        details: error.errors 
      }, { status: 400 })
    }
    
    return Response.json({ 
      error: 'Failed to process chat message',
      code: 'CHAT_FAILED'
    }, { status: 500 })
  }
}

async function buildMemoryContext(env: any, agentId: string): Promise<string> {
  const context: string[] = []
  
  // Get recent memory from each layer
  for (const layer of ['pmem', 'note', 'thgt', 'work'] as const) {
    const layerKeys = await env.SKAPP_AGENTS.list({ 
      prefix: `memory:${agentId}:${layer}:`,
      limit: 5 // Get 5 most recent entries
    })
    
    const layerEntries = []
    for (const key of layerKeys.keys) {
      try {
        const entryData = await env.SKAPP_AGENTS.get(key.name)
        if (entryData) {
          const entry = JSON.parse(entryData)
          layerEntries.push(entry.content)
        }
      } catch (error) {
        console.error(`Failed to parse memory entry ${key.name}:`, error)
        continue
      }
    }
    
    if (layerEntries.length > 0) {
      context.push(`${layer.toUpperCase()} Memory:\n${layerEntries.join('\n')}`)
    }
  }
  
  return context.join('\n\n')
}

function buildSystemPrompt(agent: any, memoryContext: string): string {
  console.log("agent", agent)
  
  // Extract goals from pmem object
  const goals = agent.pmem?.goals || 'No specific goals defined'
  
  // Extract permanent knowledge from pmem object
  const permanentKnowledge = agent.pmem?.permanent_knowledge || []
  const coreKnowledgeText = permanentKnowledge.length > 0 
    ? permanentKnowledge.map((k: string) => `- ${k}`).join('\n')
    : 'No core knowledge defined'
  
  // Extract static attributes from pmem object
  const staticAttributes = agent.pmem?.static_attributes || []
  const attributesText = staticAttributes.length > 0
    ? staticAttributes.map((attr: string) => `- ${attr}`).join('\n')
    : 'No specific attributes defined'
  
  // Extract tools from pmem object
  const pmemTools = agent.pmem?.tools || []
  const pmemToolsText = pmemTools.length > 0
    ? pmemTools.map((tool: string) => `- ${tool}`).join('\n')
    : 'No permanent tools defined'
  
  // Get available tools from top-level availableTools object
  const availableToolsText = Object.entries(agent.availableTools || {})
    .filter(([_, enabled]) => enabled)
    .map(([tool, _]) => `- ${tool}`)
    .join('\n') || 'No tools available'
  
  // Extract participants information
  const participants = agent.participants || []
  const participantsText = participants.length > 0
    ? participants.map((p: any) => `- ${p.name} (${p.role}): ${p.type}`).join('\n')
    : 'No participants defined'
  
  return `You are ${agent.name}, a ${agent.description}.

Goals:
${goals}

Core Knowledge:
${coreKnowledgeText}

Static Attributes:
${attributesText}

Permanent Tools:
${pmemToolsText}

Available Tools:
${availableToolsText}

Participants:
${participantsText}

Recent Memory Context:
${memoryContext}

Current Status: ${agent.currentMode}

Instructions:
- Respond as ${agent.name} would, using your core knowledge and goals
- Be helpful, informative, and engaging
- Reference your memory context when relevant
- If you need to use tools, mention them but don't execute them
- Keep responses concise but thorough
- Maintain your personality and expertise`
}
