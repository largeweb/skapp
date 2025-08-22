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
    
    // Add notes with full content
    if (agent.memory?.note) {
      agent.memory.note
        .filter((note: any) => {
          const noteTime = new Date(note.createdAt || note.timestamp)
          return noteTime >= startDate
        })
        .forEach((note: any, index: number) => {
          const noteTime = new Date(note.createdAt || note.timestamp)
          activities.push({
            id: `note-${noteTime.getTime()}-${index}`,
            timestamp: noteTime.toISOString(),
            time: noteTime.toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit',
              timeZone: 'America/New_York'
            }),
            mode: agent.currentMode,
            type: 'note',
            action: '📝 Take Note',
            detail: note.content?.substring(0, 100) + (note.content?.length > 100 ? '...' : ''),
            fullResponse: note.content,
            metadata: {
              expiresAt: note.expiresAt,
              tags: note.tags || [],
              source: note.source || 'manual'
            }
          })
        })
    }
    
    // Add thoughts with full content
    if (agent.memory?.thgt) {
      agent.memory.thgt
        .filter((thought: any) => {
          const thoughtTime = new Date(thought.createdAt || thought.timestamp)
          return thoughtTime >= startDate
        })
        .forEach((thought: any, index: number) => {
          const thoughtTime = new Date(thought.createdAt || thought.timestamp)
          activities.push({
            id: `thought-${thoughtTime.getTime()}-${index}`,
            timestamp: thoughtTime.toISOString(),
            time: thoughtTime.toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit',
              timeZone: 'America/New_York'
            }),
            mode: agent.currentMode,
            type: 'thought',
            action: '💭 Take Thought',
            detail: thought.content?.substring(0, 100) + (thought.content?.length > 100 ? '...' : ''),
            fullResponse: thought.content,
            metadata: {
              expiresAt: thought.expiresAt,
              context: thought.context || 'general',
              priority: thought.priority || 'normal'
            }
          })
        })
    }
    
    // Add tool usage with full responses
    if (agent.memory?.work) {
      agent.memory.work
        .filter((work: any) => {
          const workTime = new Date(work.createdAt || work.timestamp)
          return workTime >= startDate
        })
        .forEach((work: any, index: number) => {
          const workTime = new Date(work.createdAt || work.timestamp)
          
          let action = '🔧 Tool Usage'
          let detail = work.tool || 'Unknown tool'
          let fullResponse = work.result || work.response || 'No response available'
          
          if (work.tool === 'web_search') {
            action = '🔍 Web Search'
            detail = `Searched for: "${work.query || 'unknown query'}"`
            fullResponse = work.results || work.response || 'No search results available'
          } else if (work.tool === 'discord_msg') {
            action = '📱 Discord Message'
            detail = `Posted to ${work.channel || '#general'}`
            fullResponse = work.message || work.content || 'No message content available'
          } else if (work.tool === 'take_note') {
            action = '📝 Take Note'
            detail = work.content?.substring(0, 100) + (work.content?.length > 100 ? '...' : '')
            fullResponse = work.content || 'No note content available'
          } else if (work.tool === 'take_thought') {
            action = '💭 Take Thought'
            detail = work.content?.substring(0, 100) + (work.content?.length > 100 ? '...' : '')
            fullResponse = work.content || 'No thought content available'
          } else if (work.tool === 'sms_operator') {
            action = '📞 SMS Operator'
            detail = `Sent SMS to ${work.recipient || 'unknown'}`
            fullResponse = work.message || work.content || 'No SMS content available'
          }
          
          activities.push({
            id: `work-${workTime.getTime()}-${index}`,
            timestamp: workTime.toISOString(),
            time: workTime.toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit',
              timeZone: 'America/New_York'
            }),
            mode: agent.currentMode,
            type: 'tool_usage',
            action,
            detail,
            fullResponse,
            metadata: {
              tool: work.tool,
              success: work.success !== false,
              duration: work.duration,
              parameters: work.parameters || {}
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
