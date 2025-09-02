export const runtime = 'edge'

import { getRequestContext } from '@cloudflare/next-on-pages'
import { z } from 'zod'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { env } = await getRequestContext()
    const { id } = await params
    
    console.log(`🔄 Initializing operational data for agent: ${id}`)
    
    // Check if agent exists
    const agentData = await env.SKAPP_AGENTS.get(`agent:${id}`)
    if (!agentData) {
      return Response.json({ 
        error: 'Agent not found',
        code: 'AGENT_NOT_FOUND'
      }, { status: 404 })
    }
    
    const agent = JSON.parse(agentData)
    
    // Store original values for response
    const originalData = {
      turn_prompt: agent.turn_prompt,
      turn_history_length: agent.turn_history?.length || 0,
      turnsCount: agent.turnsCount || 0,
      lastTurnTriggered: agent.lastTurnTriggered
    }
    
    agent.turn_history = []
    agent.turn_prompt = ""
    agent.turnsCount = 0
    agent.lastTurnTriggered = null
    agent.lastActivity = new Date().toISOString()
    
    // Save updated agent
    await env.SKAPP_AGENTS.put(`agent:${id}`, JSON.stringify(agent))
    
    console.log(`✅ Successfully initialized operational data for agent: ${id}`)
    
    return Response.json({
      success: true,
      message: 'Agent operational data initialized successfully',
      agentId: id,
      originalData,
      newData: {
        turn_prompt: agent.turn_prompt,
        turn_history_length: agent.turn_history?.length || 0,
        turnsCount: agent.turnsCount || 0,
        lastTurnTriggered: agent.lastTurnTriggered
      },
      preservedData: {
        pmem_count: agent.pmem?.length || 0,
        note_count: agent.note?.length || 0,
        thgt_count: agent.thgt?.length || 0,
        tools_count: agent.tools?.length || 0
      }
    }, {
      headers: {
        'Cache-Control': 'no-store'
      }
    })
    
  } catch (error) {
    console.error('🚨 Initialize API error:', error instanceof Error ? error.message?.substring(0, 200) : String(error))
    
    if (error instanceof z.ZodError) {
      return Response.json({ 
        error: 'Invalid request format', 
        details: error.errors 
      }, { status: 400 })
    }
    
    return Response.json({ 
      error: 'Failed to initialize agent operational data',
      code: 'INITIALIZE_FAILED'
    }, { status: 500 })
  }
}
