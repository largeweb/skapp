export const runtime = 'edge'

import { getRequestContext } from '@cloudflare/next-on-pages'
import { z } from 'zod'

// Input validation schema for generate request
const GenerateRequestSchema = z.object({
  agentId: z.string().min(1).max(100),
  systemPrompt: z.string().min(1),
  turnHistory: z.array(z.object({
    role: z.enum(['user', 'model']),
    parts: z.array(z.object({
      text: z.string().min(1)
    }))
  })).optional().default([]),
  turnPrompt: z.string().min(1),
  mode: z.enum(['awake', 'sleep'])
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
    const validated = GenerateRequestSchema.parse(body)
    
    // Check if agent exists
    const agentData = await env.SKAPP_AGENTS.get(`agent:${id}`)
    if (!agentData) {
      return Response.json({ 
        error: 'Agent not found',
        code: 'AGENT_NOT_FOUND'
      }, { status: 404 })
    }
    
    const agent = JSON.parse(agentData)
    
    // Convert turnHistory to conversation format for Groq API
    const messages = [
      { role: 'system', content: validated.systemPrompt }
    ]
    
    // Add turn history as conversation
    validated.turnHistory.forEach((turn) => {
      const content = turn.parts.map(part => part.text).join(' ')
      if (content.trim()) {
        messages.push({
          role: turn.role === 'model' ? 'assistant' : 'user',
          content: content
        })
      }
    })
    
    // Add current turn prompt as user message
    messages.push({ role: 'user', content: validated.turnPrompt })
    
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
        max_tokens: 2000,
        temperature: 0.7
      })
    })
    
    if (!groqResponse.ok) {
      const errorData = await groqResponse.text()
      console.error('Groq API error:', errorData)
      throw new Error(`Groq API error: ${groqResponse.status}`)
    }
    
    const response = await groqResponse.json() as any
    const generatedContent = response.choices[0]?.message?.content || 'No response generated'
    
    // Add the generated response to agent's turn history
    const newTurn = {
      role: 'model' as const,
      parts: [{ text: generatedContent }]
    }
    
    agent.turn_history = agent.turn_history || []
    agent.turn_history.push(newTurn)
    
    // Update agent in KV
    await env.SKAPP_AGENTS.put(`agent:${id}`, JSON.stringify(agent))
    
    return Response.json({
      success: true,
      content: generatedContent,
      agentId: id,
      mode: validated.mode
    }, {
      headers: {
        'Cache-Control': 'no-store'
      }
    })
    
  } catch (error) {
    console.error('🚨 Generate error:', error instanceof Error ? error.message?.substring(0, 200) : String(error))
    
    if (error instanceof z.ZodError) {
      return Response.json({ 
        error: 'Invalid request format', 
        details: error.errors 
      }, { status: 400 })
    }
    
    return Response.json({ 
      error: 'Failed to generate response',
      code: 'GENERATE_FAILED'
    }, { status: 500 })
  }
}
