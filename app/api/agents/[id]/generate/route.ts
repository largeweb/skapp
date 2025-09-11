export const runtime = 'edge'

import { getRequestContext } from '@cloudflare/next-on-pages'
import { z } from 'zod'
import { parseToolCalls, executeToolCalls, validateToolCall } from '@/lib/xml-parser'

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
    let generatedContent: string;
    const requestOrigin = new URL(request.url).origin;
    
    if (validated.mode === 'sleep') {
      // Sleep mode: summarize history first, then generate response
      generatedContent = await handleSleepMode(env, agent, id, validated)
    } else {
      // Awake mode: normal generation flow with tool execution
      generatedContent = await handleAwakeMode(env, agent, id, validated, requestOrigin)
    }
    
    // Use the content returned from mode handlers
    const content = generatedContent
    
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
        details: error.issues 
      }, { status: 400 })
    }
    
    return Response.json({ 
      error: 'Failed to generate response',
      code: 'GENERATE_FAILED'
    }, { status: 500 })
  }
}

async function handleAwakeMode(env: any, agent: any, agentId: string, validated: any, origin: string): Promise<string> {
  // Check if agent just woke up from sleep mode
  const justWokeUp = agent.currentMode === 'sleep' && validated.mode === 'awake'
  
  // Update agent's current mode
  agent.previousMode = agent.currentMode
  agent.currentMode = validated.mode
  agent.lastActivity = new Date().toISOString()
  
  // Convert turnHistory to conversation format for Groq API
  const messages = [
    { 
      role: 'system', 
      content: `${validated.systemPrompt}

IMPORTANT INSTRUCTIONS:
- You are an autonomous AI agent working toward a specific goal
- Each response should show progress made toward the goal
- Use available tools when appropriate (take_note, web_search, take_thought, etc.)
- Always end your response with a <turn_prompt> tag containing the next specific step
- The next step should be concrete and actionable
- If you've achieved the goal, indicate completion in your response
- Be strategic and methodical in your approach${justWokeUp ? `

MEMORY STATUS UPDATE:
- You have just woken up from sleep mode
- Expired notes have been automatically removed from your memory
- All previous thoughts have been cleared for the new day
- Your permanent memory and tools remain intact
- You can now start fresh with new notes and thoughts for today
- Focus on current priorities and immediate next steps` : ''}`
    }
  ]
  
  // Add turn history as conversation context
  if (validated.turnHistory && validated.turnHistory.length > 0) {
    messages.push({
      role: 'user',
      content: `Previous conversation context:\n${validated.turnHistory.map((turn: any) => {
        const content = turn.parts.map((part: any) => part.text).join(' ')
        return `${turn.role}: ${content}`
      }).join('\n')}`
    })
  }
  
  // Add current turn prompt as user message
  messages.push({ 
    role: 'user', 
    content: `Current task: ${validated.turnPrompt}

Please proceed with this task and show your progress toward the goal.` 
  })

  console.log(`🔍 Messages for Groq: ${JSON.stringify(messages, null, 2)}`)
  console.log(`🌅 Agent ${agentId} mode: ${validated.mode}${justWokeUp ? ' (just woke up)' : ''}`)
  
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
  console.log(`🔍 Generated content: ${generatedContent}`)
  
    // Parse and execute tool calls from the generated content
  console.log(`🔍 Checking for tool calls in generated content (${generatedContent.length} chars)`)
  console.log(`🔍 Content preview: ${generatedContent.substring(0, 200)}...`)
  
  const toolCalls = parseToolCalls(generatedContent)
  console.log(`🔧 parseToolCalls returned: ${toolCalls.length} tool calls`)
  
  let toolResults: string[] = []
  
  if (toolCalls.length > 0) {
    console.log(`🛠️ Found ${toolCalls.length} tool calls, executing...`)
    
    // Get available tool IDs from agent
    const availableToolIds = agent.system_tools?.map((tool: any) => 
      typeof tool === 'string' ? tool : tool.id
    ) || []
    console.log(`🔍 Available tool IDs: ${JSON.stringify(availableToolIds)}`)
    
    // Validate all tool calls
    const validToolCalls = toolCalls.filter(toolCall => {
      console.log(`🔍 Validating tool call: ${toolCall.toolId}`)
      const validation = validateToolCall(toolCall, availableToolIds)
      if (!validation.valid) {
        console.warn(`❌ Invalid tool call: ${toolCall.toolId} - ${validation.error}`)
        return false
      }
      console.log(`✅ Valid tool call: ${toolCall.toolId}`)
      return true
    })
    
    console.log(`🔍 Valid tool calls: ${validToolCalls.length}/${toolCalls.length}`)
    
    if (validToolCalls.length > 0) {
      // Execute all valid tool calls via process-tool API
      console.log(`🔧 Tool execution origin: ${origin}`)
      console.log(`🔧 Executing ${validToolCalls.length} valid tool calls...`)
      toolResults = await executeToolCalls(validToolCalls, agentId, origin)
      console.log(`✅ Tool execution results: ${toolResults.length} tools processed`)
      
      // CRITICAL FIX: Reload agent data after tool execution to get tool results
      try {
        console.log(`🔄 Reloading agent data after tool execution...`)
        const updatedAgentData = await env.SKAPP_AGENTS.get(`agent:${agentId}`)
        if (updatedAgentData) {
          const updatedAgent = JSON.parse(updatedAgentData)
          // Merge the updated agent data back into our agent object
          agent.system_notes = updatedAgent.system_notes || agent.system_notes
          agent.system_thoughts = updatedAgent.system_thoughts || agent.system_thoughts
          agent.turn_prompt_enhancement = updatedAgent.turn_prompt_enhancement || agent.turn_prompt_enhancement
          agent.previous_day_summary = updatedAgent.previous_day_summary || agent.previous_day_summary
          agent.tool_call_results = updatedAgent.tool_call_results || agent.tool_call_results
          console.log(`🔄 Agent data reloaded: ${updatedAgent.tool_call_results?.length || 0} tool results`)
        }
      } catch (reloadError) {
        console.error(`⚠️ Failed to reload agent data:`, reloadError)
        // Continue without reloading - tool execution still happened
      }
    } else {
      console.warn(`⚠️ No valid tool calls to execute`)
    }
  } else {
    console.log(`📝 No tool calls found in response`)
    console.log(`🔍 Checking if response contains <sktool>: ${generatedContent.includes('<sktool>')}`)
  }
  
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
  
  // Return the generated content for the main function
  return generatedContent
}

async function handleSleepMode(env: any, agent: any, agentId: string, validated: any): Promise<string> {
  console.log(`😴 Sleep mode activated for agent: ${agentId}`)
  
  // Update agent's current mode
  agent.previousMode = agent.currentMode
  agent.currentMode = validated.mode
  agent.lastActivity = new Date().toISOString()
  
  // Clean up expired notes and thoughts
  await cleanupMemory(agent, agentId)
  
  // Summarize the existing history
  await summarizeHistory(env, agent, agentId)
  
  // Update agent in KV with cleaned memory and summarized history
  await env.SKAPP_AGENTS.put(`agent:${agentId}`, JSON.stringify(agent))
  
  console.log(`✅ Sleep mode cleanup completed for agent: ${agentId}`)
  
  // Return sleep mode completion message
  return 'Sleep mode: Memory consolidated and history summarized'
}

async function cleanupMemory(agent: any, agentId: string) {
  try {
    const now = new Date()
    let notesRemoved = 0
    let thoughtsRemoved = 0
    
    // Clean up expired notes
    if (agent.system_notes && Array.isArray(agent.system_notes)) {
      const originalNotesCount = agent.system_notes.length
      
      // Filter out expired notes
      agent.system_notes = agent.system_notes.filter((note: any) => {
        if (typeof note === 'string') {
          // Legacy note format - remove it (treat as expired)
          notesRemoved++
          return false
        }
        
        if (note.expires_at) {
          const expiryDate = new Date(note.expires_at)
          if (expiryDate <= now) {
            // Note has expired
            notesRemoved++
            return false
          }
        }
        
        // Keep valid, non-expired notes
        return true
      })
      
      console.log(`🗑️ Removed ${notesRemoved} expired notes from agent ${agentId} (kept ${agent.system_notes.length}/${originalNotesCount})`)
    }
    
    // Clear all thoughts (daily reset)
    if (agent.system_thoughts && Array.isArray(agent.system_thoughts)) {
      thoughtsRemoved = agent.system_thoughts.length
      agent.system_thoughts = []
      console.log(`🧹 Cleared ${thoughtsRemoved} thoughts from agent ${agentId} (daily reset)`)
    }
    
    // Update agent's last activity
    agent.lastActivity = now.toISOString()
    
    console.log(`🧽 Memory cleanup for agent ${agentId}: ${notesRemoved} expired notes removed, ${thoughtsRemoved} thoughts cleared`)
    
  } catch (error) {
    console.error(`🚨 Memory cleanup error for agent ${agentId}:`, error)
    // Continue with sleep mode even if cleanup fails
  }
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
  const turnPromptMatch = content.match(/<turn_prompt>([\s\S]*?)<\/turn_prompt>/i)
  if (turnPromptMatch && turnPromptMatch[1]) {
    const nextTurnPrompt = turnPromptMatch[1].trim()
    console.log(`🔍 Found turn prompt: ${nextTurnPrompt}`)
    return nextTurnPrompt
  }
  console.log(`❌ No turn prompt found in content`)
  return null
}

function removeTurnPromptTags(content: string): string {
  // Remove <turn_prompt>...</turn_prompt> tags from the content
  return content.replace(/<turn_prompt>[\s\S]*?<\/turn_prompt>/gi, '').trim()
}


