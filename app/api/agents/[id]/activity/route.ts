import { NextRequest } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { env } = getRequestContext()
    const { id } = await params
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const days = parseInt(url.searchParams.get('days') || '7')
    
    // Get agent data
    const agentData = await env.SKAPP_AGENTS?.get(`agent:${id}`)
    if (!agentData) {
      return Response.json({ 
        error: 'Agent not found',
        code: 'AGENT_NOT_FOUND'
      }, { status: 404 })
    }
    
    const agent = JSON.parse(agentData)
    
    // Calculate time range
    const now = new Date()
    const startDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000))
    
    const activities: Array<{
      id: string
      timestamp: string
      time: string
      mode: string
      type: 'mode_change' | 'tool_usage' | 'note' | 'thought' | 'system'
      action: string
      detail: string
      fullResponse?: string
      metadata?: any
    }> = []
    
    // Add mode changes
    if (agent.lastActivity && agent.lastActivity !== 'Just created') {
      const activityTime = new Date(agent.lastActivity)
      if (activityTime >= startDate) {
        activities.push({
          id: `mode-${activityTime.getTime()}`,
          timestamp: activityTime.toISOString(),
          time: activityTime.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            timeZone: 'America/New_York'
          }),
          mode: agent.currentMode,
          type: 'mode_change',
          action: `Entered ${agent.currentMode} Mode`,
          detail: agent.currentMode === 'awake' ? 'Processing tasks and pursuing goals' :
                  agent.currentMode === 'sleep' ? 'Reflecting on progress and planning' :
                  agent.currentMode === 'deep_sleep' ? 'Analyzing patterns and optimizing' :
                  'Setting intentions for the new day',
          metadata: {
            previousMode: agent.previousMode || 'unknown',
            duration: agent.modeDuration || 'unknown'
          }
        })
      }
    }
    
    // Process notes
    if (agent.system_notes) {
      agent.system_notes
        .filter((note: any) => {
          if (typeof note === 'string') return true
          const noteDate = new Date(note.created_at)
          return noteDate >= startDate
        })
        .forEach((note: any, index: number) => {
          const content = typeof note === 'string' ? note : note.content
          const timestamp = typeof note === 'string' ? agent.lastActivity : note.created_at
          activities.push({
            id: `note-${index}`,
            timestamp: timestamp,
            time: new Date(timestamp).toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit',
              timeZone: 'America/New_York'
            }),
            mode: agent.currentMode || 'unknown',
            type: 'note',
            action: '📝 Take Note',
            detail: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
            fullResponse: content,
            metadata: {
              expiresAt: typeof note !== 'string' ? note.expires_at : undefined,
              source: 'manual'
            }
          })
        })
    }
    
    // Process thoughts
    if (agent.system_thoughts) {
      agent.system_thoughts
        .filter((thought: any) => {
          if (typeof thought === 'string') return true
          const thoughtDate = new Date(thought.created_at)
          return thoughtDate >= startDate
        })
        .forEach((thought: any, index: number) => {
          const content = typeof thought === 'string' ? thought : thought.content
          const timestamp = typeof thought === 'string' ? agent.lastActivity : thought.created_at
          activities.push({
            id: `thought-${index}`,
            timestamp: timestamp,
            time: new Date(timestamp).toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit',
              timeZone: 'America/New_York'
            }),
            mode: agent.currentMode || 'unknown',
            type: 'thought',
            action: '💭 Take Thought',
            detail: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
            fullResponse: content,
            metadata: {
              context: 'general',
              priority: 'normal'
            }
          })
        })
    }
    
    // Process tools
    if (agent.system_tools) {
      agent.system_tools
        .filter((tool: any) => {
          if (typeof tool === 'string') return true
          const toolDate = new Date(tool.createdAt || tool.timestamp)
          return toolDate >= startDate
        })
        .forEach((tool: any, index: number) => {
          const content = typeof tool === 'string' ? tool : tool.name || tool.content
          const timestamp = typeof tool === 'string' ? agent.lastActivity : (tool.createdAt || tool.timestamp)
          activities.push({
            id: `tool-${index}`,
            timestamp: timestamp,
            time: new Date(timestamp).toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit',
              timeZone: 'America/New_York'
            }),
            mode: agent.currentMode || 'unknown',
            type: 'tool_usage',
            action: '🔧 Tool Usage',
            detail: content,
            fullResponse: content,
            metadata: {
              tool: content,
              success: true
            }
          })
        })
    }
    
    // Sort by timestamp (most recent first) and limit results
    const sortedActivities = activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)
    
    // Group activities by day
    const groupedActivities: Record<string, typeof sortedActivities> = {}
    sortedActivities.forEach(activity => {
      const date = new Date(activity.timestamp).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'America/New_York'
      })
      
      if (!groupedActivities[date]) {
        groupedActivities[date] = []
      }
      groupedActivities[date].push(activity)
    })
    
    return Response.json({
      agent: {
        id: agent.agentId,
        name: agent.name,
        currentMode: agent.currentMode,
        lastActivity: agent.lastActivity
      },
      activities: sortedActivities,
      groupedActivities,
      total: activities.length,
      timeRange: {
        start: startDate.toISOString(),
        end: now.toISOString(),
        days
      },
      systemTime: now.toISOString(),
      timezone: 'EST'
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60'
      }
    })
    
  } catch (error) {
    console.error('🚨 Agent activity API error:', error instanceof Error ? error.message : 'Unknown error')
    
    return Response.json({ 
      error: 'Failed to fetch agent activity',
      code: 'AGENT_ACTIVITY_FAILED'
    }, { status: 500 })
  }
}
