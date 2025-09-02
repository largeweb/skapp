import { NextRequest } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    const { env } = getRequestContext()
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '10')
    
    // Get current EST time
    const now = new Date()
    const estTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}))
    
    // Get all agents
    const agentKeys = await env.SKAPP_AGENTS?.list({ prefix: 'agent:' }) || { keys: [] }
    
    // If no agents exist, return sample activities for demonstration
    if (!agentKeys.keys.length) {
      const sampleActivities = [
        {
          id: 'research_bot-mode-1',
          time: '2m ago',
          agent: 'Research Assistant',
          agentId: 'research_bot',
          action: 'entered awake mode',
          detail: 'Processing tasks',
          type: 'mode' as const,
          timestamp: Date.now() - 120000
        },
        {
          id: 'research_bot-note-1',
          time: '5m ago',
          agent: 'Research Assistant',
          agentId: 'research_bot',
          action: 'took note',
          detail: '"AI trends show increasing adoption of multimodal models..."',
          type: 'note' as const,
          timestamp: Date.now() - 300000
        },
        {
          id: 'content_writer-work-1',
          time: '8m ago',
          agent: 'Content Writer',
          agentId: 'content_writer',
          action: 'posted to Discord',
          detail: '#content-ideas',
          type: 'tool' as const,
          timestamp: Date.now() - 480000
        },
        {
          id: 'data_analyst-thought-1',
          time: '12m ago',
          agent: 'Data Analyst',
          agentId: 'data_analyst',
          action: 'had thought',
          detail: '"The dataset shows clear correlation between..."',
          type: 'thought' as const,
          timestamp: Date.now() - 720000
        },
        {
          id: 'research_bot-work-1',
          time: '15m ago',
          agent: 'Research Assistant',
          agentId: 'research_bot',
          action: 'used web_search()',
          detail: 'Latest AI research papers',
          type: 'tool' as const,
          timestamp: Date.now() - 900000
        }
      ]
      
      return Response.json({
        activities: sampleActivities.slice(0, limit),
        total: sampleActivities.length,
        systemTime: estTime.toISOString(),
        timezone: 'EST'
      }, {
        headers: {
          'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30'
        }
      })
    }
    
    const allActivities: Array<{
      id: string
      time: string
      agent: string
      agentId: string
      action: string
      detail: string
      type: 'tool' | 'mode' | 'note' | 'thought'
      timestamp: number
    }> = []
    
    // Process each agent to gather activities
    for (const key of agentKeys.keys) {
      try {
        const agentData = await env.SKAPP_AGENTS?.get(key.name)
        if (agentData) {
          const agent = JSON.parse(agentData)
          const agentId = key.name.replace('agent:', '')
          
          // Add mode changes
          if (agent.lastActivity && agent.lastActivity !== 'Just created') {
            const activityTime = new Date(agent.lastActivity)
            const timeDiff = now.getTime() - activityTime.getTime()
            const timeDiffMins = Math.floor(timeDiff / (1000 * 60))
            
            if (timeDiffMins < 60) { // Only show activities from last hour
              let timeAgo = ''
              if (timeDiffMins < 1) {
                timeAgo = 'Just now'
              } else if (timeDiffMins < 60) {
                timeAgo = `${timeDiffMins}m ago`
              }
              
              allActivities.push({
                id: `${agentId}-mode-${activityTime.getTime()}`,
                time: timeAgo,
                agent: agent.name,
                agentId,
                action: `entered ${agent.currentMode} mode`,
                detail: agent.currentMode === 'awake' ? 'Processing tasks' : 'Resting and planning',
                type: 'mode',
                timestamp: activityTime.getTime()
              })
            }
          }
          
                  // Process notes
        if (agent.system_notes) {
          const recentNotes = agent.system_notes
            .filter((note: any) => {
              if (typeof note === 'string') return true
              const noteDate = new Date(note.created_at)
              const timeDiff = now.getTime() - noteDate.getTime()
              return timeDiff < 60 * 60 * 1000 // Last hour
            })
            .slice(0, 3)
            .map((note: any) => {
              const noteTime = new Date(typeof note === 'string' ? agent.lastActivity : note.created_at)
              const timeDiff = now.getTime() - noteTime.getTime()
              const timeDiffMins = Math.floor(timeDiff / (1000 * 60))
              
              return {
                id: `${agentId}-note-${noteTime.getTime()}`,
                time: `${timeDiffMins}m ago`,
                agent: agent.name,
                agentId,
                action: 'took note',
                detail: `"${(typeof note === 'string' ? note : note.content)?.substring(0, 50)}${(typeof note === 'string' ? note : note.content)?.length > 50 ? '...' : ''}"`,
                type: 'note' as const,
                timestamp: noteTime.getTime()
              }
            })
          
          allActivities.push(...recentNotes)
        }
          
                  // Process thoughts
        if (agent.system_thoughts) {
          const recentThoughts = agent.system_thoughts
            .filter((thought: any) => {
              if (typeof thought === 'string') return true
              const thoughtDate = new Date(thought.created_at)
              const timeDiff = now.getTime() - thoughtDate.getTime()
              return timeDiff < 60 * 60 * 1000 // Last hour
            })
            .slice(0, 2)
            .map((thought: any) => {
              const thoughtTime = new Date(typeof thought === 'string' ? agent.lastActivity : thought.created_at)
              const timeDiff = now.getTime() - thoughtTime.getTime()
              const timeDiffMins = Math.floor(timeDiff / (1000 * 60))
              
              return {
                id: `${agentId}-thought-${thoughtTime.getTime()}`,
                time: `${timeDiffMins}m ago`,
                agent: agent.name,
                agentId,
                action: 'had thought',
                detail: `"${(typeof thought === 'string' ? thought : thought.content)?.substring(0, 50)}${(typeof thought === 'string' ? thought : thought.content)?.length > 50 ? '...' : ''}"`,
                type: 'thought' as const,
                timestamp: thoughtTime.getTime()
              }
            })
          
          allActivities.push(...recentThoughts)
        }
        
        // Process tools
        if (agent.system_tools) {
          const recentTools = agent.system_tools
            .filter((tool: any) => {
              if (typeof tool === 'string') return true
              const toolDate = new Date(tool.createdAt || tool.timestamp)
              const timeDiff = now.getTime() - toolDate.getTime()
              return timeDiff < 60 * 60 * 1000 // Last hour
            })
            .slice(0, 3)
            .map((tool: any) => {
              const toolTime = new Date(typeof tool === 'string' ? agent.lastActivity : (tool.createdAt || tool.timestamp))
              const timeDiff = now.getTime() - toolTime.getTime()
              const timeDiffMins = Math.floor(timeDiff / (1000 * 60))
              
              return {
                id: `${agentId}-work-${toolTime.getTime()}`,
                time: `${timeDiffMins}m ago`,
                agent: agent.name,
                agentId,
                action: 'used tool',
                detail: typeof tool === 'string' ? tool : (tool.name || tool.content || 'Unknown tool'),
                type: 'tool' as const,
                timestamp: toolTime.getTime()
              }
            })
          
          allActivities.push(...recentTools)
        }
        }
      } catch (error) {
        console.error(`Failed to process agent ${key.name}:`, error)
        // Continue processing other agents
      }
    }
    
    // Sort by timestamp (most recent first) and limit results
    const sortedActivities = allActivities
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
    
    return Response.json({
      activities: sortedActivities,
      total: allActivities.length,
      systemTime: estTime.toISOString(),
      timezone: 'EST'
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30'
      }
    })
    
  } catch (error) {
    console.error('🚨 Recent activity API error:', error instanceof Error ? error.message : 'Unknown error')
    
    // Return fallback activities on error
    return Response.json({
      activities: [],
      total: 0,
      systemTime: new Date().toISOString(),
      timezone: 'EST',
      error: 'Failed to fetch recent activity'
    }, { status: 500 })
  }
}
