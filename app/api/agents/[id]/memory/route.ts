export const runtime = 'edge'

import { getRequestContext } from '@cloudflare/next-on-pages'
import { z } from 'zod'

// Simple validation schema for memory content
const MemoryContentSchema = z.object({
  content: z.string().min(1).max(2000)
})

const MemoryQuerySchema = z.object({
  layer: z.enum(['pmem', 'note', 'thgt', 'tools']).optional(),
  limit: z.string().optional().transform(val => parseInt(val || '50')),
  offset: z.string().optional().transform(val => parseInt(val || '0'))
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { env } = getRequestContext()
    const { id } = await params
    const url = new URL(request.url)
    const queryParams = Object.fromEntries(url.searchParams.entries())
    
    // Validate query parameters
    const validated = MemoryQuerySchema.parse(queryParams)
    
    // Check if agent exists
    const agentData = await env.SKAPP_AGENTS.get(`agent:${id}`)
    if (!agentData) {
      return Response.json({ 
        error: 'Agent not found',
        code: 'AGENT_NOT_FOUND'
      }, { status: 404 })
    }
    
    const agent = JSON.parse(agentData)
    
    // Return memory arrays from agent data
    const memory = {
      pmem: agent.pmem || [],
      note: agent.note || [],
      thgt: agent.thgt || [],
      tools: agent.tools || []
    }
    
    // If specific layer requested, only return that layer
    if (validated.layer) {
      return Response.json({
        agentId: id,
        layer: validated.layer,
        memory: memory[validated.layer] || []
      }, {
        headers: {
          'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30'
        }
      })
    }
    
    // Return all memory
    return Response.json({
      agentId: id,
      memory,
      stats: {
        pmem: memory.pmem.length,
        note: memory.note.length,
        thgt: memory.thgt.length,
        tools: memory.tools.length
      }
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30'
      }
    })
    
  } catch (error) {
    console.error('🚨 Memory fetch error:', error instanceof Error ? error.message?.substring(0, 200) : String(error))
    
    if (error instanceof z.ZodError) {
      return Response.json({ 
        error: 'Invalid query parameters', 
        details: error.errors 
      }, { status: 400 })
    }
    
    return Response.json({ 
      error: 'Failed to fetch memory',
      code: 'MEMORY_FETCH_FAILED'
    }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { env } = getRequestContext()
    const { id } = await params
    const url = new URL(request.url)
    const layer = url.searchParams.get('layer')
    
    if (!layer || !['pmem', 'note', 'thgt', 'tools'].includes(layer)) {
      return Response.json({ 
        error: 'Invalid memory layer. Must be pmem, note, thgt, or tools',
        code: 'INVALID_MEMORY_LAYER'
      }, { status: 400 })
    }
    
    // Check if agent exists
    const agentData = await env.SKAPP_AGENTS.get(`agent:${id}`)
    if (!agentData) {
      return Response.json({ 
        error: 'Agent not found',
        code: 'AGENT_NOT_FOUND'
      }, { status: 404 })
    }
    
    // Parse and validate input
    const body = await request.json()
    const validated = MemoryContentSchema.parse(body)
    
    // Get current agent data
    const agent = JSON.parse(agentData)
    
    // Initialize memory arrays if they don't exist
    if (!agent.pmem) agent.pmem = []
    if (!agent.note) agent.note = []
    if (!agent.thgt) agent.thgt = []
    if (!agent.tools) agent.tools = []
    
    // Add content to the appropriate memory array
    agent[layer].push(validated.content)
    
    // Update agent's last activity
    agent.lastActivity = new Date().toISOString()
    
    // Save updated agent data
    await env.SKAPP_AGENTS.put(`agent:${id}`, JSON.stringify(agent))
    
    return Response.json({ 
      success: true,
      content: validated.content,
      message: 'Memory entry added successfully' 
    }, {
      status: 201,
      headers: {
        'Cache-Control': 'no-store'
      }
    })
    
  } catch (error) {
    console.error('🚨 Memory creation error:', error instanceof Error ? error.message?.substring(0, 200) : String(error))
    
    if (error instanceof z.ZodError) {
      return Response.json({ 
        error: 'Validation failed', 
        details: error.errors 
      }, { status: 400 })
    }
    
    return Response.json({ 
      error: 'Failed to create memory entry',
      code: 'MEMORY_CREATE_FAILED'
    }, { status: 500 })
  }
}
