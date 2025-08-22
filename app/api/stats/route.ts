import { NextRequest } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    const { env } = getRequestContext()
    
    // Get current EST time
    const now = new Date()
    const estTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}))
    const today = estTime.toISOString().split('T')[0]
    
    // Get all agents
    const agentKeys = await env.SKAPP_AGENTS?.list({ prefix: 'agent:' }) || { keys: [] }
    
    // Calculate active agents (awake mode)
    let activeAgents = 0
    let notesToday = 0
    let toolsExecuted = 0
    let lastCycleTime = 'Unknown'
    
    // If no agents exist, return sample stats for demonstration
    if (!agentKeys.keys.length) {
      const sampleStats = {
        activeAgents: 2,
        notesToday: 8,
        lastCycle: '5m ago',
        toolsExecuted: 12,
        totalAgents: 3,
        systemTime: estTime.toISOString(),
        timezone: 'EST'
      }
      
      return Response.json(sampleStats, {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60'
        }
      })
    }
    
    // Process each agent to gather stats
    for (const key of agentKeys.keys) {
      try {
        const agentData = await env.SKAPP_AGENTS?.get(key.name)
        if (agentData) {
          const agent = JSON.parse(agentData)
          
          // Count active agents
          if (agent.currentMode === 'awake') {
            activeAgents++
          }
          
          // Count notes from today
          if (agent.memory?.note) {
            const todayNotes = agent.memory.note.filter((note: any) => {
              const noteDate = new Date(note.createdAt || note.timestamp).toISOString().split('T')[0]
              return noteDate === today
            })
            notesToday += todayNotes.length
          }
          
          // Count tools executed today
          if (agent.memory?.work) {
            const todayWork = agent.memory.work.filter((work: any) => {
              const workDate = new Date(work.createdAt || work.timestamp).toISOString().split('T')[0]
              return workDate === today
            })
            toolsExecuted += todayWork.length
          }
          
          // Track last activity time
          if (agent.lastActivity && agent.lastActivity !== 'Just created') {
            const activityTime = new Date(agent.lastActivity)
            if (!lastCycleTime || lastCycleTime === 'Unknown' || activityTime > new Date(lastCycleTime)) {
              lastCycleTime = agent.lastActivity
            }
          }
        }
      } catch (error) {
        console.error(`Failed to process agent ${key.name}:`, error)
        // Continue processing other agents
      }
    }
    
    // Calculate time since last cycle
    let lastCycle = 'Unknown'
    if (lastCycleTime && lastCycleTime !== 'Unknown') {
      const lastCycleDate = new Date(lastCycleTime)
      const diffMs = now.getTime() - lastCycleDate.getTime()
      const diffMins = Math.floor(diffMs / (1000 * 60))
      
      if (diffMins < 1) {
        lastCycle = 'Just now'
      } else if (diffMins < 60) {
        lastCycle = `${diffMins}m ago`
      } else {
        const diffHours = Math.floor(diffMins / 60)
        lastCycle = `${diffHours}h ago`
      }
    }
    
    const stats = {
      activeAgents,
      notesToday,
      lastCycle,
      toolsExecuted,
      totalAgents: agentKeys.keys.length,
      systemTime: estTime.toISOString(),
      timezone: 'EST'
    }
    
    return Response.json(stats, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60'
      }
    })
    
  } catch (error) {
    console.error('🚨 Stats API error:', error instanceof Error ? error.message : 'Unknown error')
    
    // Return fallback stats on error
    return Response.json({
      activeAgents: 0,
      notesToday: 0,
      lastCycle: 'Unknown',
      toolsExecuted: 0,
      totalAgents: 0,
      systemTime: new Date().toISOString(),
      timezone: 'EST',
      error: 'Failed to fetch stats'
    }, { status: 500 })
  }
}
