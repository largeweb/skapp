export const runtime = 'edge'

import { getRequestContext } from '@cloudflare/next-on-pages'
import { z } from 'zod'

// Input validation schemas
const CreateAgentSchema = z.object({
  agentId: z.string().min(1).max(50).regex(/^[a-z0-9_]+$/),
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  coreKnowledge: z.array(z.string().min(1).max(200)),
  availableTools: z.object({
    web_search: z.boolean(),
    take_note: z.boolean(),
    discord_msg: z.boolean(),
    take_thought: z.boolean(),
    sms_operator: z.boolean()
  }),
  goals: z.string().min(1).max(1000)
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
    
    if (!agentKeys.keys.length) {
      return Response.json({
        agents: [],
        pagination: {
          page: validated.page,
          limit: validated.limit,
          total: 0,
          pages: 0
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
          
          agents.push({
            id: agent.agentId,
            name: agent.name,
            description: agent.description,
            status: agent.currentMode || 'awake',
            lastActivity: agent.lastActivity || 'Unknown',
            createdAt: agent.createdAt,
            memoryStats: {
              pmem: agent.memory?.pmem?.length || 0,
              note: agent.memory?.note?.length || 0,
              thgt: agent.memory?.thgt?.length || 0,
              work: agent.memory?.work?.length || 0
            }
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
        details: error.errors 
      }, { status: 400 })
    }
    
    return Response.json({ 
      error: 'Failed to fetch agents',
      code: 'AGENTS_LIST_FAILED'
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
    
    // Create agent data structure
    const agentData = {
      agentId: validated.agentId,
      name: validated.name,
      description: validated.description,
      coreKnowledge: validated.coreKnowledge,
      availableTools: validated.availableTools,
      goals: validated.goals,
      currentMode: 'awake',
      lastActivity: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      memory: {
        pmem: [],
        note: [],
        thgt: [],
        work: []
      },
      modeLastRun: {
        sleep: null,
        deep_sleep: null,
        wakeup: null
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
      return Response.json({ 
        error: 'Validation failed', 
        details: error.errors 
      }, { status: 400 })
    }
    
    return Response.json({ 
      error: 'Failed to create agent',
      code: 'AGENT_CREATE_FAILED'
    }, { status: 500 })
  }
}
