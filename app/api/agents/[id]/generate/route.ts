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
    console.log(`🔍 Generating for agent: ${id}`)
    
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
    console.log(`🔍 Agent found: ${id}`)
    
    const agent = JSON.parse(agentData)
    
    // Handle different modes with optimized paths
    if (validated.mode === 'sleep') {
      // Sleep mode: summarize history first, then generate response
      await handleSleepMode(env, agent, id, validated)
    } else {
      // Awake mode: normal generation flow
      await handleAwakeMode(env, agent, id, validated)
    }
    
    // Get the appropriate content based on mode
    let content: string
    if (validated.mode === 'sleep') {
      // For sleep mode, return the summary content or a message
      const latestTurn = agent.turn_history?.[agent.turn_history.length - 1]
      content = latestTurn?.parts?.[0]?.text || 'History summarized successfully'
    } else {
      // For awake mode, return the generated content
      const latestTurn = agent.turn_history?.[agent.turn_history.length - 1]
      content = latestTurn?.parts?.[0]?.text || 'No response generated'
    }
    
    return Response.json({
      success: true,
      content: content,
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

async function handleAwakeMode(env: any, agent: any, agentId: string, validated: any) {
  // Convert turnHistory to conversation format for Groq API
  const messages = [
    { role: 'system', content: validated.systemPrompt }
  ]
  
  // Add turn history as conversation
  validated.turnHistory.forEach((turn: any) => {
    const content = turn.parts.map((part: any) => part.text).join(' ')
    if (content.trim()) {
      messages.push({
        role: turn.role === 'model' ? 'assistant' : 'user',
        content: content
      })
    }
  })
  
  // Add current turn prompt as user message
  messages.push({ role: 'user', content: validated.turnPrompt })

  console.log(`🔍 Messages 1: ${messages}`)
  
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
  console.log("groqResponse=========>", groqResponse)
  
  if (!groqResponse.ok) {
    const errorData = await groqResponse.text()
    console.error('Groq API error:', errorData)
    throw new Error(`Groq API error: ${groqResponse.status}`)
  }
  
  const response = await groqResponse.json() as any
  const generatedContent = response.choices[0]?.message?.content || 'No response generated'
  console.log(`🔍 Generated content: ${generatedContent}`)
  
  // Extract next turn prompt from the generated content
  const nextTurnPrompt = extractNextTurnPrompt(generatedContent)
  
  // Remove turn_prompt tags from the generated content for storage
  const cleanGeneratedContent = removeTurnPromptTags(generatedContent)
  
  // Add the user prompt (turn_prompt) to agent's turn history
  const userTurn = {
    role: 'user' as const,
    parts: [{ text: validated.turnPrompt }]
  }
  
  // Add the cleaned generated response to agent's turn history
  const modelTurn = {
    role: 'model' as const,
    parts: [{ text: cleanGeneratedContent }]
  }

  console.log(`🔍 User turn: ${JSON.stringify(userTurn)}`)
  console.log(`🔍 Model turn: ${JSON.stringify(modelTurn)}`)
  console.log(`🔍 Next turn prompt: ${nextTurnPrompt}`)
  
  agent.turn_history = agent.turn_history || []
  agent.turn_history.push(userTurn)
  agent.turn_history.push(modelTurn)
  
  // Save the next turn prompt to agent data for next cycle
  if (nextTurnPrompt) {
    agent.turn_prompt = nextTurnPrompt
    console.log(`💾 Saved next turn prompt: ${nextTurnPrompt}`)
  }
  
  // Update agent in KV
  await env.SKAPP_AGENTS.put(`agent:${agentId}`, JSON.stringify(agent))
}

async function handleSleepMode(env: any, agent: any, agentId: string, validated: any) {
  // For sleep mode, just summarize the existing history
  await summarizeHistory(env, agent, agentId)
  
  // Update agent in KV with summarized history
  await env.SKAPP_AGENTS.put(`agent:${agentId}`, JSON.stringify(agent))
}

async function summarizeHistory(env: any, agent: any, agentId: string) {
  try {
    const currentHistory = agent.turn_history || []
    
    if (currentHistory.length <= 10) {
      // If history is already short, no need to summarize
      return
    }
    
    // Create a summary of the full history using Groq API
    const fullHistoryText = currentHistory.map((turn: any) => {
      const content = turn.parts.map((part: any) => part.text).join(' ')
      return `${turn.role}: ${content}`
    }).join('\n\n')
    
    // Call Groq API to create a summary
    const summaryResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: env.GROQ_MODEL || 'openai/gpt-oss-120b',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that creates concise summaries of conversation history. Focus on key insights, important decisions, and notable patterns.'
          },
          {
            role: 'user',
            content: `Please create a concise summary of this conversation history, focusing on the most important points:\n\n${fullHistoryText}`
          }
        ],
        max_tokens: 500,
        temperature: 0.3
      })
    })
    
    if (summaryResponse.ok) {
      const summaryData = await summaryResponse.json() as any
      const summary = summaryData.choices[0]?.message?.content
      
      if (summary) {
        // Keep latest 10 turns and add summary content with user role
        const last10Turns = currentHistory.slice(-10)
        agent.turn_history = [
          ...last10Turns,
          {
            role: 'user' as const,
            parts: [{ text: 'Please summarize the conversation history' }]
          },
          {
            role: 'model' as const,
            parts: [{ text: summary }]
          }
        ]
        
        console.log(`📝 Sleep mode: Summarized ${currentHistory.length} turns, kept last 10 + summary for agent ${agentId}`)
      } else {
        // Skip updating agent data if no summary content, keep original history
        console.log(`⚠️ Sleep mode: No summary content received, keeping original history for agent ${agentId}`)
      }
    } else {
      // Fallback: keep original history unchanged
      console.log(`⚠️ Sleep mode: Summary API failed, keeping original history for agent ${agentId}`)
    }
  } catch (error) {
    console.error(`🚨 Sleep mode summarization error for agent ${agentId}:`, error)
    // Keep existing history on error
  }
}

function extractNextTurnPrompt(content: string): string | null {
  // Look for <turn_prompt>...</turn_prompt> tags in the content
  const turnPromptMatch = content.match(/<turn_prompt>([\s\S]*?)<\/turn_prompt>/i)
  if (turnPromptMatch && turnPromptMatch[1]) {
    return turnPromptMatch[1].trim()
  }
  return null
}

function removeTurnPromptTags(content: string): string {
  // Remove <turn_prompt>...</turn_prompt> tags from the content
  return content.replace(/<turn_prompt>[\s\S]*?<\/turn_prompt>/gi, '').trim()
}


