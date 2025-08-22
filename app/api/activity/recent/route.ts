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
          
          // Add recent notes
          if (agent.memory?.note) {
            const recentNotes = agent.memory.note
              .filter((note: any) => {
                const noteTime = new Date(note.createdAt || note.timestamp)
                const timeDiff = now.getTime() - noteTime.getTime()
                return timeDiff < 60 * 60 * 1000 // Last hour
              })
              .slice(0, 3) // Limit to 3 most recent notes
            
            recentNotes.forEach((note: any, index: number) => {
              const noteTime = new Date(note.createdAt || note.timestamp)
              const timeDiff = now.getTime() - noteTime.getTime()
              const timeDiffMins = Math.floor(timeDiff / (1000 * 60))
              
              allActivities.push({
                id: `${agentId}-note-${noteTime.getTime()}-${index}`,
                time: `${timeDiffMins}m ago`,
                agent: agent.name,
                agentId,
                action: 'took note',
                detail: `"${note.content?.substring(0, 50)}${note.content?.length > 50 ? '...' : ''}"`,
                type: 'note',
                timestamp: noteTime.getTime()
              })
            })
          }
          
          // Add recent thoughts
          if (agent.memory?.thgt) {
            const recentThoughts = agent.memory.thgt
              .filter((thought: any) => {
                const thoughtTime = new Date(thought.createdAt || thought.timestamp)
                const timeDiff = now.getTime() - thoughtTime.getTime()
                return timeDiff < 60 * 60 * 1000 // Last hour
              })
              .slice(0, 2) // Limit to 2 most recent thoughts
            
            recentThoughts.forEach((thought: any, index: number) => {
              const thoughtTime = new Date(thought.createdAt || thought.timestamp)
              const timeDiff = now.getTime() - thoughtTime.getTime()
              const timeDiffMins = Math.floor(timeDiff / (1000 * 60))
              
              allActivities.push({
                id: `${agentId}-thought-${thoughtTime.getTime()}-${index}`,
                time: `${timeDiffMins}m ago`,
                agent: agent.name,
                agentId,
                action: 'had thought',
                detail: `"${thought.content?.substring(0, 50)}${thought.content?.length > 50 ? '...' : ''}"`,
                type: 'thought',
                timestamp: thoughtTime.getTime()
              })
            })
          }
          
          // Add recent tool usage
          if (agent.memory?.work) {
            const recentWork = agent.memory.work
              .filter((work: any) => {
                const workTime = new Date(work.createdAt || work.timestamp)
                const timeDiff = now.getTime() - workTime.getTime()
                return timeDiff < 60 * 60 * 1000 // Last hour
              })
              .slice(0, 3) // Limit to 3 most recent work items
            
            recentWork.forEach((work: any, index: number) => {
              const workTime = new Date(work.createdAt || work.timestamp)
              const timeDiff = now.getTime() - workTime.getTime()
              const timeDiffMins = Math.floor(timeDiff / (1000 * 60))
              
              let action = 'used tool'
              let detail = work.tool || 'Unknown tool'
              
              if (work.tool === 'web_search') {
                action = 'used web_search()'
                detail = work.query || 'Searched for information'
              } else if (work.tool === 'discord_msg') {
                action = 'posted to Discord'
                detail = work.channel || '#general'
              } else if (work.tool === 'take_note') {
                action = 'took note'
                detail = `"${work.content?.substring(0, 50)}${work.content?.length > 50 ? '...' : ''}"`
              } else if (work.tool === 'take_thought') {
                action = 'had thought'
                detail = `"${work.content?.substring(0, 50)}${work.content?.length > 50 ? '...' : ''}"`
              }
              
              allActivities.push({
                id: `${agentId}-work-${workTime.getTime()}-${index}`,
                time: `${timeDiffMins}m ago`,
                agent: agent.name,
                agentId,
                action,
                detail,
                type: 'tool',
                timestamp: workTime.getTime()
              })
            })
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
