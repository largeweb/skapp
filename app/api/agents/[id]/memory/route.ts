export const runtime = 'edge'

import { getRequestContext } from '@cloudflare/next-on-pages'
import { z } from 'zod'
import { 
  PMEMEntry, 
  NOTEEntry, 
  THGTEntry, 
  ParticipantEntry,
  MEMORY_CONFIG,
  PMEM_SCHEMA,
  PARTICIPANT_SCHEMA
} from '@/lib/memory-types'

// Input validation schemas
const PMEMEntrySchema = z.object({
  type: z.enum(['goals', 'permanent_knowledge', 'static_attributes', 'tools', 'codes']),
  content: z.string().min(1).max(2000),
  metadata: z.object({
    priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    lastUpdated: z.string().optional()
  }).optional()
})

const NOTEEntrySchema = z.object({
  type: z.enum(['observation', 'learning', 'insight', 'reminder', 'reference']),
  content: z.string().min(1).max(2000),
  metadata: z.object({
    source: z.string().optional(),
    context: z.string().optional(),
    importance: z.enum(['low', 'medium', 'high']).optional(),
    relatedGoals: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional()
  }).optional()
})

const THGTEntrySchema = z.object({
  type: z.enum(['reasoning', 'analysis', 'hypothesis', 'reflection', 'planning']),
  content: z.string().min(1).max(2000),
  metadata: z.object({
    reasoningLevel: z.enum(['low', 'medium', 'high']).optional(),
    confidence: z.number().min(0).max(100).optional(),
    relatedThoughts: z.array(z.string()).optional(),
    context: z.string().optional()
  }).optional()
})

const ParticipantEntrySchema = z.object({
  type: z.enum(['human_operator', 'other_agent', 'external_system', 'collaborator']),
  name: z.string().min(1).max(100),
  role: z.string().min(1).max(200),
  contactInfo: z.object({
    discord: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    other: z.string().optional()
  }).optional(),
  permissions: z.object({
    canRead: z.boolean().optional(),
    canWrite: z.boolean().optional(),
    canExecute: z.boolean().optional(),
    canAdmin: z.boolean().optional()
  }),
  schedule: z.object({
    availableHours: z.string().optional(),
    timezone: z.string().optional(),
    preferredContact: z.string().optional()
  }).optional(),
  metadata: z.object({
    expertise: z.array(z.string()).optional(),
    reliability: z.number().min(0).max(100).optional(),
    responseTime: z.string().optional(),
    notes: z.string().optional()
  }).optional()
})

const MemoryQuerySchema = z.object({
  layer: z.enum(['pmem', 'note', 'thgt', 'participants']).optional(),
  type: z.string().optional(),
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
      pmem: [] as PMEMEntry[],
      note: [] as NOTEEntry[],
      thgt: [] as THGTEntry[],
      participants: [] as ParticipantEntry[]
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
            
            // Filter by type if specified
            if (validated.type && entry.type !== validated.type) {
              continue
            }
            
            memory[validated.layer as keyof typeof memory].push(entry)
          }
        } catch (error) {
          console.error(`Failed to parse memory entry ${key.name}:`, error)
          continue
        }
      }
    } else {
      // Fetch all layers
      for (const layer of ['pmem', 'note', 'thgt', 'participants'] as const) {
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
      config: MEMORY_CONFIG,
      stats: {
        pmem: memory.pmem.length,
        note: memory.note.length,
        thgt: memory.thgt.length,
        participants: memory.participants.length
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
    
    if (!layer || !['pmem', 'note', 'thgt', 'participants'].includes(layer)) {
      return Response.json({ 
        error: 'Invalid memory layer. Must be pmem, note, thgt, or participants',
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
    
    // Parse and validate input based on layer
    const body = await request.json()
    let validated: any
    let entry: any
    
    switch (layer) {
      case 'pmem':
        validated = PMEMEntrySchema.parse(body)
        entry = {
          id: crypto.randomUUID(),
          ...validated,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        break
        
      case 'note':
        validated = NOTEEntrySchema.parse(body)
        const noteExpiry = new Date()
        noteExpiry.setDate(noteExpiry.getDate() + 7)
        entry = {
          id: crypto.randomUUID(),
          ...validated,
          createdAt: new Date().toISOString(),
          expiresAt: noteExpiry.toISOString()
        }
        break
        
      case 'thgt':
        validated = THGTEntrySchema.parse(body)
        const thgtExpiry = new Date()
        thgtExpiry.setDate(thgtExpiry.getDate() + 3)
        entry = {
          id: crypto.randomUUID(),
          ...validated,
          createdAt: new Date().toISOString(),
          expiresAt: thgtExpiry.toISOString()
        }
        break
        
      case 'participants':
        validated = ParticipantEntrySchema.parse(body)
        entry = {
          id: crypto.randomUUID(),
          ...validated,
          createdAt: new Date().toISOString(),
          lastInteraction: new Date().toISOString()
        }
        break
        
      default:
        return Response.json({ 
          error: 'Invalid memory layer',
          code: 'INVALID_MEMORY_LAYER'
        }, { status: 400 })
    }
    
    // Store memory entry with appropriate TTL
    const ttl = MEMORY_CONFIG[layer as keyof typeof MEMORY_CONFIG].expiration
    await env.SKAPP_AGENTS.put(
      `memory:${id}:${layer}:${entry.id}`, 
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
