export const runtime = 'edge'

import { getRequestContext } from '@cloudflare/next-on-pages'
import { z } from 'zod'

// Input validation schemas
const MemoryEntrySchema = z.object({
  content: z.string().min(1).max(2000),
  metadata: z.record(z.any()).optional(),
  ttl: z.number().min(60).max(2592000).optional() // 1 minute to 30 days
})

const MemoryQuerySchema = z.object({
  layer: z.enum(['pmem', 'note', 'thgt', 'work']).optional(),
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
    
    const memory = {
      pmem: [] as any[],
      note: [] as any[],
      thgt: [] as any[],
      work: [] as any[]
    }
    
    // If specific layer requested, only fetch that layer
    if (validated.layer) {
      const layerKeys = await env.SKAPP_AGENTS.list({ 
        prefix: `memory:${id}:${validated.layer}:`,
        limit: validated.limit,
        cursor: validated.offset > 0 ? `memory:${id}:${validated.layer}:${validated.offset}` : undefined
      })
      
      for (const key of layerKeys.keys) {
        try {
          const entryData = await env.SKAPP_AGENTS.get(key.name)
          if (entryData) {
            const entry = JSON.parse(entryData)
            memory[validated.layer as keyof typeof memory].push(entry)
          }
        } catch (error) {
          console.error(`Failed to parse memory entry ${key.name}:`, error)
          continue
        }
      }
    } else {
      // Fetch all layers
      for (const layer of ['pmem', 'note', 'thgt', 'work'] as const) {
        const layerKeys = await env.SKAPP_AGENTS.list({ 
          prefix: `memory:${id}:${layer}:`,
          limit: validated.limit
        })
        
        for (const key of layerKeys.keys) {
          try {
            const entryData = await env.SKAPP_AGENTS.get(key.name)
            if (entryData) {
              const entry = JSON.parse(entryData)
              memory[layer].push(entry)
            }
          } catch (error) {
            console.error(`Failed to parse memory entry ${key.name}:`, error)
            continue
          }
        }
      }
    }
    
    return Response.json({
      agentId: id,
      memory,
      stats: {
        pmem: memory.pmem.length,
        note: memory.note.length,
        thgt: memory.thgt.length,
        work: memory.work.length
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
    
    if (!layer || !['pmem', 'note', 'thgt', 'work'].includes(layer)) {
      return Response.json({ 
        error: 'Invalid memory layer. Must be pmem, note, thgt, or work',
        code: 'INVALID_MEMORY_LAYER'
      }, { status: 400 })
    }
    
    // Parse and validate input
    const body = await request.json()
    const validated = MemoryEntrySchema.parse(body)
    
    // Check if agent exists
    const agentData = await env.SKAPP_AGENTS.get(`agent:${id}`)
    if (!agentData) {
      return Response.json({ 
        error: 'Agent not found',
        code: 'AGENT_NOT_FOUND'
      }, { status: 404 })
    }
    
    // Create memory entry
    const entryId = crypto.randomUUID()
    const entry = {
      id: entryId,
      content: validated.content,
      metadata: validated.metadata || {},
      createdAt: new Date().toISOString(),
      layer,
      agentId: id
    }
    
    // Store memory entry with TTL if specified
    const ttl = validated.ttl || getDefaultTTL(layer)
    await env.SKAPP_AGENTS.put(
      `memory:${id}:${layer}:${entryId}`, 
      JSON.stringify(entry),
      { expirationTtl: ttl }
    )
    
    // Update agent's last activity
    const agent = JSON.parse(agentData)
    agent.lastActivity = new Date().toISOString()
    await env.SKAPP_AGENTS.put(`agent:${id}`, JSON.stringify(agent))
    
    return Response.json({ 
      success: true,
      entry,
      message: 'Memory entry created successfully' 
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

// Helper function to get default TTL for each memory layer
function getDefaultTTL(layer: string): number {
  switch (layer) {
    case 'pmem': return 0 // Permanent memory - no expiration
    case 'note': return 604800 // 7 days
    case 'thgt': return 259200 // 3 days
    case 'work': return 86400 // 1 day
    default: return 604800 // 7 days default
  }
}
