export const runtime = 'edge'

import { getRequestContext } from '@cloudflare/next-on-pages'
import { z } from 'zod'

// Input validation schemas
const UpdateAgentSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().min(1).max(500).optional(),
  coreKnowledge: z.array(z.string().min(1).max(200)).optional(),
  availableTools: z.object({
    web_search: z.boolean(),
    take_note: z.boolean(),
    discord_msg: z.boolean(),
    take_thought: z.boolean(),
    sms_operator: z.boolean()
  }).optional(),
  goals: z.string().min(1).max(1000).optional()
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { env } = getRequestContext()
    const { id } = await params
    
    // Fetch agent data
    const agentData = await env.SKAPP_AGENTS.get(`agent:${id}`)
    
    if (!agentData) {
      return Response.json({ 
        error: 'Agent not found',
        code: 'AGENT_NOT_FOUND'
      }, { status: 404 })
    }
    
    const agent = JSON.parse(agentData)
    
    return Response.json(agent, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60'
      }
    })
    
  } catch (error) {
    console.error('🚨 Agent fetch error:', error instanceof Error ? error.message?.substring(0, 200) : String(error))
    
    return Response.json({ 
      error: 'Failed to fetch agent',
      code: 'AGENT_FETCH_FAILED'
    }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { env } = getRequestContext()
    const { id } = await params
    
    // Parse and validate input
    const body = await request.json()
    const validated = UpdateAgentSchema.parse(body)
    
    // Fetch existing agent data
    const existingData = await env.SKAPP_AGENTS.get(`agent:${id}`)
    
    if (!existingData) {
      return Response.json({ 
        error: 'Agent not found',
        code: 'AGENT_NOT_FOUND'
      }, { status: 404 })
    }
    
    const agent = JSON.parse(existingData)
    
    // Update only provided fields
    const updatedAgent = {
      ...agent,
      ...validated,
      lastActivity: new Date().toISOString()
    }
    
    // Store updated agent
    await env.SKAPP_AGENTS.put(`agent:${id}`, JSON.stringify(updatedAgent))
    
    return Response.json({ 
      success: true,
      agent: updatedAgent,
      message: 'Agent updated successfully' 
    }, {
      headers: {
        'Cache-Control': 'no-store'
      }
    })
    
  } catch (error) {
    console.error('🚨 Agent update error:', error instanceof Error ? error.message?.substring(0, 200) : String(error))
    
    if (error instanceof z.ZodError) {
      return Response.json({ 
        error: 'Validation failed', 
        details: error.issues 
      }, { status: 400 })
    }
    
    return Response.json({ 
      error: 'Failed to update agent',
      code: 'AGENT_UPDATE_FAILED'
    }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { env } = getRequestContext()
    const { id } = await params
    
    // Check if agent exists
    const existingData = await env.SKAPP_AGENTS.get(`agent:${id}`)
    
    if (!existingData) {
      return Response.json({ 
        error: 'Agent not found',
        code: 'AGENT_NOT_FOUND'
      }, { status: 404 })
    }
    
    // Delete agent data
    await env.SKAPP_AGENTS.delete(`agent:${id}`)
    
    // Remove from agents list
    await env.SKAPP_AGENTS.delete(`agents:list:${id}`)
    
    // Clean up memory entries
    const memoryKeys = await env.SKAPP_AGENTS.list({ prefix: `memory:${id}:` })
    for (const key of memoryKeys.keys) {
      await env.SKAPP_AGENTS.delete(key.name)
    }
    
    return Response.json({ 
      success: true,
      message: 'Agent deleted successfully' 
    }, {
      headers: {
        'Cache-Control': 'no-store'
      }
    })
    
  } catch (error) {
    console.error('🚨 Agent deletion error:', error instanceof Error ? error.message?.substring(0, 200) : String(error))
    
    return Response.json({ 
      error: 'Failed to delete agent',
      code: 'AGENT_DELETE_FAILED'
    }, { status: 500 })
  }
}
