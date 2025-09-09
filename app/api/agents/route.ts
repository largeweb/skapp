export const runtime = 'edge'

import { getRequestContext } from '@cloudflare/next-on-pages'
import { z } from 'zod'

// Input validation schemas
const CreateAgentSchema = z.object({
  agentId: z.string()
    .min(1, "Agent ID is required")
    .max(50, "Agent ID must be 50 characters or less")
    .regex(/^[a-zA-Z0-9_-]+$/, "Agent ID can only contain letters, numbers, underscores, and hyphens")
    .transform(val => val.toLowerCase().trim()),
  name: z.string().min(1, "Name is required").max(100, "Name must be 100 characters or less").transform(val => val.trim()),
  description: z.string().min(1, "Description is required").max(500, "Description must be 500 characters or less").transform(val => val.trim()),
  pmem: z.array(z.string().min(1).max(1000)).optional().default([]),
  note: z.array(z.string().min(1).max(1000)).optional().default([]),
  thgt: z.array(z.string().min(1).max(1000)).optional().default([]),
  tools: z.array(z.string().min(1).max(200)).optional().default([]),
  turn_prompt: z.string().optional().default(""),
  turn_history: z.array(z.object({
    role: z.enum(['user', 'model']),
    parts: z.array(z.object({
      text: z.string().min(1)
    }))
  })).optional().default([]),
  participants: z.array(z.object({
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
  })).optional().default([]),
})

const ListAgentsSchema = z.object({
  page: z.string().optional().transform(val => parseInt(val || '1')),
  limit: z.string().optional().transform(val => parseInt(val || '10')),
  status: z.enum(['all', 'awake', 'sleep', 'deep_sleep', 'wakeup']).optional(),
  search: z.string().optional()
})

export async function GET(request: Request) {
  try {
    const { env } = getRequestContext()
    const url = new URL(request.url)
    const queryParams = Object.fromEntries(url.searchParams.entries())
    
    // Validate query parameters
    const validated = ListAgentsSchema.parse(queryParams)
    
    // Get all agent keys from KV
    const agentKeys = await env.SKAPP_AGENTS.list({ prefix: 'agent:' })
    
    // Check if we have real agents in KV store
    if (!agentKeys.keys.length) {
      // Return sample agents for demonstration when no agents exist
      const sampleAgents = [
        {
          id: 'research_bot',
          name: 'Research Assistant',
          description: 'AI research assistant that analyzes trends and creates summaries',
          status: 'awake',
          lastActivity: new Date().toISOString(),
          createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          memoryStats: {
            pmem: 5,
            note: 12,
            thgt: 8,
            work: 3
          }
        },
        {
          id: 'content_writer',
          name: 'Content Writer',
          description: 'Creative content writer for blogs and social media',
          status: 'sleep',
          lastActivity: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          memoryStats: {
            pmem: 3,
            note: 7,
            thgt: 15,
            work: 6
          }
        },
        {
          id: 'data_analyst',
          name: 'Data Analyst',
          description: 'Data analysis and visualization specialist',
          status: 'awake',
          lastActivity: new Date().toISOString(),
          createdAt: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
          memoryStats: {
            pmem: 8,
            note: 20,
            thgt: 4,
            work: 12
          }
        }
      ]
      
      return Response.json({
        agents: sampleAgents,
        pagination: {
          page: validated.page,
          limit: validated.limit,
          total: sampleAgents.length,
          pages: 1
        }
      })
    }
    
    // Fetch agent data in batches
    const agents = []
    const startIndex = (validated.page - 1) * validated.limit
    const endIndex = startIndex + validated.limit
    const pageKeys = agentKeys.keys.slice(startIndex, endIndex)
    
    for (const key of pageKeys) {
      try {
        const agentData = await env.SKAPP_AGENTS.get(key.name)
        if (agentData) {
          const agent = JSON.parse(agentData)
          
          // Apply filters
          if (validated.status && validated.status !== 'all' && agent.currentMode !== validated.status) {
            continue
          }
          
          if (validated.search) {
            const searchLower = validated.search.toLowerCase()
            const matchesSearch = 
              agent.name.toLowerCase().includes(searchLower) ||
              agent.description.toLowerCase().includes(searchLower) ||
              agent.agentId.toLowerCase().includes(searchLower)
            
            if (!matchesSearch) continue
          }
          
          // Calculate memory statistics
          const memoryStats = {
            system_permanent_memory: agent.system_permanent_memory?.length || 0,
            system_notes: agent.system_notes?.length || 0,
            system_thoughts: agent.system_thoughts?.length || 0,
            system_tools: agent.system_tools?.length || 0
          }
          
          agents.push({
            id: agent.agentId,
            name: agent.name,
            description: agent.description,
            status: agent.currentMode || 'awake',
            lastActivity: agent.lastActivity || 'Unknown',
            createdAt: agent.createdAt,
            memoryStats: memoryStats
          })
        }
      } catch (error) {
        console.error(`Failed to parse agent data for key ${key.name}:`, error)
        continue
      }
    }
    
    return Response.json({
      agents,
      pagination: {
        page: validated.page,
        limit: validated.limit,
        total: agentKeys.keys.length,
        pages: Math.ceil(agentKeys.keys.length / validated.limit)
      }
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60'
      }
    })
    
  } catch (error) {
    console.error('🚨 Agents list error:', error instanceof Error ? error.message?.substring(0, 200) : String(error))
    
    if (error instanceof z.ZodError) {
      return Response.json({ 
        error: 'Invalid query parameters', 
        details: error.issues 
      }, { status: 400 })
    }
    
    return Response.json({ 
      error: 'Failed to fetch agents',
      code: 'AGENTS_LIST_FAILED'
    }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { env } = getRequestContext()
    
    // Clear all agents from KV store
    const agentKeys = await env.SKAPP_AGENTS.list({ prefix: 'agent:' })
    
    for (const key of agentKeys.keys) {
      await env.SKAPP_AGENTS.delete(key.name)
    }
    
    // Also clear agent list entries
    const listKeys = await env.SKAPP_AGENTS.list({ prefix: 'agents:list:' })
    for (const key of listKeys.keys) {
      await env.SKAPP_AGENTS.delete(key.name)
    }
    
    return Response.json({ 
      success: true, 
      message: 'All agents cleared',
      deletedCount: agentKeys.keys.length
    })
    
  } catch (error) {
    console.error('🚨 Agent cleanup error:', error instanceof Error ? error.message?.substring(0, 200) : String(error))
    
    return Response.json({ 
      error: 'Failed to clear agents',
      code: 'AGENT_CLEANUP_FAILED'
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { env } = getRequestContext()
    
    // Parse and validate input
    const body = await request.json()
    const validated = CreateAgentSchema.parse(body)
    
    // Check if agent ID already exists
    const existingAgent = await env.SKAPP_AGENTS.get(`agent:${validated.agentId}`)
    if (existingAgent) {
      return Response.json({ 
        error: 'Agent ID already exists',
        code: 'AGENT_ID_CONFLICT'
      }, { status: 409 })
    }
    
    // Create agent data structure with new simplified format
    const agentData = {
      agentId: validated.agentId,
      name: validated.name,
      description: validated.description,
      system_permanent_memory: validated.pmem || [],
      system_notes: validated.note || [],
      system_thoughts: validated.thgt || [],
      system_tools: validated.tools || [],
      turn_prompt: validated.turn_prompt || "",
      turn_history: validated.turn_history || [],
      participants: validated.participants || [],
      currentMode: 'awake',
      lastActivity: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      modeLastRun: {
        sleep: null,
        awake: null
      }
    }
    
    // Store agent in KV
    await env.SKAPP_AGENTS.put(`agent:${validated.agentId}`, JSON.stringify(agentData))
    
    // Store agent ID in list for easy enumeration
    await env.SKAPP_AGENTS.put(`agents:list:${validated.agentId}`, '1')
    
    return Response.json({ 
      success: true, 
      agentId: validated.agentId,
      message: 'Agent created successfully' 
    }, {
      status: 201,
      headers: {
        'Cache-Control': 'no-store'
      }
    })
    
  } catch (error) {
    console.error('🚨 Agent creation error:', error instanceof Error ? error.message?.substring(0, 200) : String(error))
    
    if (error instanceof z.ZodError) {
      // Create a more user-friendly error message
      const fieldErrors = error.issues.reduce((acc, err) => {
        const field = err.path.join('.')
        acc[field] = err.message
        return acc
      }, {} as Record<string, string>)
      
      // Create a simple error message for the user
      const errorMessage = Object.entries(fieldErrors)
        .map(([field, message]) => `${field}: ${message}`)
        .join(', ')
      
      return Response.json({ 
        error: 'Validation failed', 
        message: errorMessage,
        fieldErrors,
        details: error.issues 
      }, { status: 400 })
    }
    
    return Response.json({ 
      error: 'Failed to create agent',
      code: 'AGENT_CREATE_FAILED'
    }, { status: 500 })
  }
}
