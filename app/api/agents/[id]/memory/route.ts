export const runtime = 'edge'

import { getRequestContext } from '@cloudflare/next-on-pages'
import { z } from 'zod'

// Simple validation schema for memory content
const MemoryContentSchema = z.object({
  content: z.string().min(1).max(2000),
  expires_in_days: z.number().int().min(1).max(365).optional().default(7)
})

const MemoryEditSchema = z.object({
  content: z.string().min(1).max(2000),
  index: z.number().int().min(0)
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
    
    // Create memory entry with appropriate structure
    let memoryEntry: any
    
    if (layer === 'note') {
      // Notes get expiration dates
      const now = new Date()
      const expiresAt = new Date(now.getTime() + (validated.expires_in_days * 24 * 60 * 60 * 1000))
      
      memoryEntry = {
        content: validated.content,
        created_at: now.toISOString(),
        expires_at: expiresAt.toISOString()
      }
    } else {
      // Other memory types just get content
      memoryEntry = validated.content
    }
    
    // Add to appropriate memory array
    agent[layer].push(memoryEntry)
    
    // Update agent's last activity
    agent.lastActivity = new Date().toISOString()
    
    // Save updated agent data
    await env.SKAPP_AGENTS.put(`agent:${id}`, JSON.stringify(agent))
    
    return Response.json({ 
      success: true,
      content: memoryEntry,
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

export async function PUT(
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
    const validated = MemoryEditSchema.parse(body)
    
    // Get current agent data
    const agent = JSON.parse(agentData)
    
    // Initialize memory arrays if they don't exist
    if (!agent.pmem) agent.pmem = []
    if (!agent.note) agent.note = []
    if (!agent.thgt) agent.thgt = []
    if (!agent.tools) agent.tools = []
    
    // Check if index is valid
    const memoryArray = agent[layer]
    if (validated.index >= memoryArray.length) {
      return Response.json({ 
        error: 'Memory index out of bounds',
        code: 'INVALID_MEMORY_INDEX'
      }, { status: 400 })
    }
    
    // Update the specific memory entry
    memoryArray[validated.index] = validated.content
    
    // Update agent's last activity
    agent.lastActivity = new Date().toISOString()
    
    // Save updated agent data
    await env.SKAPP_AGENTS.put(`agent:${id}`, JSON.stringify(agent))
    
    return Response.json({ 
      success: true,
      content: validated.content,
      index: validated.index,
      message: 'Memory entry updated successfully' 
    }, {
      headers: {
        'Cache-Control': 'no-store'
      }
    })
    
  } catch (error) {
    console.error('🚨 Memory update error:', error instanceof Error ? error.message?.substring(0, 200) : String(error))
    
    if (error instanceof z.ZodError) {
      return Response.json({ 
        error: 'Validation failed', 
        details: error.errors 
      }, { status: 400 })
    }
    
    return Response.json({ 
      error: 'Failed to update memory entry',
      code: 'MEMORY_UPDATE_FAILED'
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
    const url = new URL(request.url)
    const layer = url.searchParams.get('layer')
    const index = url.searchParams.get('index')
    
    if (!layer || !['pmem', 'note', 'thgt', 'tools'].includes(layer)) {
      return Response.json({ 
        error: 'Invalid memory layer. Must be pmem, note, thgt, or tools',
        code: 'INVALID_MEMORY_LAYER'
      }, { status: 400 })
    }
    
    if (!index || isNaN(parseInt(index))) {
      return Response.json({ 
        error: 'Invalid memory index. Must be a valid number',
        code: 'INVALID_MEMORY_INDEX'
      }, { status: 400 })
    }
    
    const memoryIndex = parseInt(index)
    
    // Check if agent exists
    const agentData = await env.SKAPP_AGENTS.get(`agent:${id}`)
    if (!agentData) {
      return Response.json({ 
        error: 'Agent not found',
        code: 'AGENT_NOT_FOUND'
      }, { status: 404 })
    }
    
    // Get current agent data
    const agent = JSON.parse(agentData)
    
    // Initialize memory arrays if they don't exist
    if (!agent.pmem) agent.pmem = []
    if (!agent.note) agent.note = []
    if (!agent.thgt) agent.thgt = []
    if (!agent.tools) agent.tools = []
    
    // Check if index is valid
    const memoryArray = agent[layer]
    if (memoryIndex >= memoryArray.length) {
      return Response.json({ 
        error: 'Memory index out of bounds',
        code: 'INVALID_MEMORY_INDEX'
      }, { status: 400 })
    }
    
    // Store the content being removed for response
    const removedContent = memoryArray[memoryIndex]
    
    // Remove the specific memory entry
    memoryArray.splice(memoryIndex, 1)
    
    // Update agent's last activity
    agent.lastActivity = new Date().toISOString()
    
    // Save updated agent data
    await env.SKAPP_AGENTS.put(`agent:${id}`, JSON.stringify(agent))
    
    return Response.json({ 
      success: true,
      removedContent,
      index: memoryIndex,
      message: 'Memory entry removed successfully' 
    }, {
      headers: {
        'Cache-Control': 'no-store'
      }
    })
    
  } catch (error) {
    console.error('🚨 Memory deletion error:', error instanceof Error ? error.message?.substring(0, 200) : String(error))
    
    return Response.json({ 
      error: 'Failed to remove memory entry',
      code: 'MEMORY_DELETE_FAILED'
    }, { status: 500 })
  }
}
