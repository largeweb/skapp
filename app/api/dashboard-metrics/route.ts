export const runtime = 'edge';

import { getRequestContext } from '@cloudflare/next-on-pages';
import type { DashboardMetrics, AgentDashboardCard } from '@/lib/dashboard-types';
import { getTimeAgo, getAgentStatusColor, extractRecentToolCalls, generateAgentSummary } from '@/lib/dashboard-types';

export async function GET(request: Request): Promise<Response> {
  try {
    const { env } = getRequestContext();
    console.log('📊 Dashboard Metrics API: Start');
    
    // Check if dashboard-metrics exists in KV
    const cachedMetrics = await env.SKAPP_AGENTS.get('dashboard-metrics');
    
    if (cachedMetrics) {
      console.log('✅ Returning cached dashboard metrics');
      const metrics: DashboardMetrics = JSON.parse(cachedMetrics);
      
      return Response.json({
        success: true,
        data: metrics,
        cached: true
      });
    }
    
    // Generate metrics from scratch if not cached
    console.log('🔄 Generating fresh dashboard metrics...');
    
    // Get all agents
    const agentsList = await env.SKAPP_AGENTS.list({ prefix: 'agent:' });
    const agentPromises = agentsList.keys.map(async (key) => {
      const agentData = await env.SKAPP_AGENTS.get(key.name);
      return agentData ? JSON.parse(agentData) : null;
    });
    
    const agents = (await Promise.all(agentPromises)).filter(Boolean);
    console.log(`📊 Processing ${agents.length} agents for dashboard`);
    
    // Calculate global metrics
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    
    let totalTurnsToday = 0;
    let totalToolCallsToday = 0;
    let totalNotesCreated = 0;
    let totalThoughtsGenerated = 0;
    let activeAgents = 0;
    let sleepingAgents = 0;
    
    const agentCards: AgentDashboardCard[] = [];
    
    for (const agent of agents) {
      // Skip dashboard-metrics entry
      if (agent.agentId === 'dashboard-metrics') continue;
      
      // Count today's activity
      const agentTurnsToday = getTurnsToday(agent, today);
      const agentToolCallsToday = getToolCallsToday(agent, today);
      const agentNotesToday = getNotesToday(agent, today);
      const agentThoughtsToday = getThoughtsToday(agent, today);
      
      totalTurnsToday += agentTurnsToday;
      totalToolCallsToday += agentToolCallsToday;
      totalNotesCreated += agentNotesToday;
      totalThoughtsGenerated += agentThoughtsToday;
      
      // Determine current status
      const currentStatus = determineAgentStatus(agent);
      if (currentStatus === 'awake' || currentStatus === 'thinking') {
        activeAgents++;
      } else {
        sleepingAgents++;
      }
      
      // Generate agent card
      const recentToolCalls = extractRecentToolCalls(agent);
      const summary = generateAgentSummary(agent);
      const { statusColor, statusRing } = getAgentStatusColor(currentStatus, agent.lastActivity || agent.createdAt);
      
      const agentCard: AgentDashboardCard = {
        agentId: agent.agentId,
        name: agent.name,
        type: inferAgentType(agent.description),
        status: currentStatus,
        lastActivity: getTimeAgo(agent.lastActivity || agent.createdAt),
        recentToolCalls,
        notesCount: agent.system_notes?.length || 0,
        thoughtsCount: agent.system_thoughts?.length || 0,
        turnsToday: agentTurnsToday,
        statusColor,
        statusRing,
        lastToolCall: summary.lastToolCall,
        lastNote: summary.lastNote,
        nextAction: summary.nextAction
      };
      
      agentCards.push(agentCard);
    }
    
    // Calculate next scheduled cycle (next 30-minute mark)
    const nextCycle = new Date(now);
    nextCycle.setMinutes(Math.ceil(nextCycle.getMinutes() / 30) * 30, 0, 0);
    
    const dashboardMetrics: DashboardMetrics = {
      totalAgents: agents.length,
      activeAgents,
      sleepingAgents,
      turnsToday: totalTurnsToday,
      toolCallsToday: totalToolCallsToday,
      notesCreated: totalNotesCreated,
      thoughtsGenerated: totalThoughtsGenerated,
      lastCycleTime: getTimeAgo(getLastCycleTime(agents)),
      averageResponseTime: calculateAverageResponseTime(agents),
      successRate: calculateSuccessRate(agents),
      agentCards,
      lastUpdated: now.toISOString(),
      nextScheduledCycle: nextCycle.toISOString()
    };
    
    // Cache metrics for 5 minutes
    const expirationTtl = 5 * 60; // 5 minutes
    await env.SKAPP_AGENTS.put('dashboard-metrics', JSON.stringify(dashboardMetrics), { expirationTtl });
    
    console.log(`✅ Dashboard metrics generated and cached: ${agents.length} agents, ${totalTurnsToday} turns today`);
    
    return Response.json({
      success: true,
      data: dashboardMetrics,
      cached: false
    });
    
  } catch (error: any) {
    console.error('🚨 Dashboard Metrics Error:', error?.message?.substring(0, 200));
    
    return Response.json({
      success: false,
      error: 'Failed to generate dashboard metrics',
      code: 'DASHBOARD_METRICS_ERROR'
    }, { status: 500 });
  }
}

// ============================================================================
// 🔧 HELPER FUNCTIONS
// ============================================================================

function getTurnsToday(agent: any, today: string): number {
  if (!agent.lastTurnTriggered) return 0;
  const lastTurnDate = agent.lastTurnTriggered.slice(0, 10);
  return lastTurnDate === today ? (agent.turnsCount || 0) : 0;
}

function getToolCallsToday(agent: any, today: string): number {
  if (!agent.tool_call_results) return 0;
  
  return agent.tool_call_results.filter((result: string) => {
    const timestampMatch = result.match(/\[([^\]]+)\]$/);
    if (!timestampMatch) return false;
    try {
      const timestamp = new Date(timestampMatch[1]);
      return timestamp.toISOString().slice(0, 10) === today;
    } catch {
      return false;
    }
  }).length;
}

function getNotesToday(agent: any, today: string): number {
  if (!agent.system_notes) return 0;
  
  return agent.system_notes.filter((note: any) => {
    if (!note.created_at && !note.expires_at) return false;
    try {
      // Use created_at if available, otherwise estimate from expires_at
      const createdDate = note.created_at || 
        new Date(new Date(note.expires_at).getTime() - (7 * 24 * 60 * 60 * 1000)).toISOString();
      return createdDate.slice(0, 10) === today;
    } catch {
      return false;
    }
  }).length;
}

function getThoughtsToday(agent: any, today: string): number {
  // Thoughts don't have timestamps, so we estimate based on last activity
  if (!agent.system_thoughts || !agent.lastActivity) return 0;
  
  try {
    const lastActivityDate = agent.lastActivity.slice(0, 10);
    return lastActivityDate === today ? agent.system_thoughts.length : 0;
  } catch {
    return 0;
  }
}

function determineAgentStatus(agent: any): 'awake' | 'sleep' | 'thinking' {
  if (agent.currentMode) return agent.currentMode;
  
  // Determine based on recent activity
  if (!agent.lastActivity) return 'sleep';
  
  const lastActivityMs = new Date().getTime() - new Date(agent.lastActivity).getTime();
  const minutesAgo = lastActivityMs / (1000 * 60);
  
  if (minutesAgo < 5) return 'thinking';
  if (minutesAgo < 60) return 'awake';
  return 'sleep';
}

function inferAgentType(description: string): string {
  const desc = description.toLowerCase();
  
  if (desc.includes('research') || desc.includes('analysis')) return 'Research';
  if (desc.includes('content') || desc.includes('writing')) return 'Content';
  if (desc.includes('discord') || desc.includes('community')) return 'Discord';
  if (desc.includes('social') || desc.includes('media')) return 'Social';
  if (desc.includes('data') || desc.includes('analytics')) return 'Analytics';
  if (desc.includes('customer') || desc.includes('support')) return 'Support';
  
  return 'General';
}

function getLastCycleTime(agents: any[]): string {
  let mostRecent = '';
  
  for (const agent of agents) {
    if (agent.lastTurnTriggered && agent.lastTurnTriggered > mostRecent) {
      mostRecent = agent.lastTurnTriggered;
    }
  }
  
  return mostRecent || new Date().toISOString();
}

function calculateAverageResponseTime(agents: any[]): number {
  // For now, return a reasonable estimate
  // In the future, we could track actual response times
  return 1500; // 1.5 seconds average
}

function calculateSuccessRate(agents: any[]): number {
  // For now, return a high success rate
  // In the future, we could track actual success/failure rates
  return 95; // 95% success rate
} 