/**
 * Dashboard Metrics & Agent Telemetry Types
 * Optimized for fast dashboard loading with essential agent info
 */

// ============================================================================
// 📊 DASHBOARD METRICS TYPES
// ============================================================================

/**
 * Agent card data for dashboard display (100-200 chars max)
 */
export interface AgentDashboardCard {
  agentId: string;
  name: string;
  type: string;                    // Research, Content, Discord, etc.
  status: 'awake' | 'sleep' | 'thinking';
  lastActivity: string;            // "2m ago", "15m ago"
  
  // Engaging metrics (100-200 chars total)
  recentToolCalls: string[];       // Last 3 tool IDs only ["web_search", "take_note", "discord_msg"]
  notesCount: number;              // Active notes count
  thoughtsCount: number;           // Current thoughts count
  turnsToday: number;              // Turn count for today
  
  // Visual indicators
  statusColor: string;             // "bg-blue-500", "bg-green-500"
  statusRing: string;              // "ring-blue-500/20"
  
  // Compact activity summary (50-100 chars)
  lastToolCall?: string;           // "used web_search(AI trends)"
  lastNote?: string;               // "Market analysis shows..."
  nextAction?: string;             // "Research competitor pricing"
}

/**
 * Global dashboard metrics
 */
export interface DashboardMetrics {
  // System stats
  totalAgents: number;
  activeAgents: number;            // Currently awake
  sleepingAgents: number;          // Currently sleeping
  
  // Activity stats
  turnsToday: number;              // Total turns across all agents today
  toolCallsToday: number;          // Total tool executions today
  notesCreated: number;            // Notes created today
  thoughtsGenerated: number;       // Thoughts generated today
  
  // Performance stats
  lastCycleTime: string;           // "2m ago"
  averageResponseTime: number;     // Average generation time in ms
  successRate: number;             // Percentage of successful turns
  
  // Agent cards for dashboard display
  agentCards: AgentDashboardCard[];
  
  // Metadata
  lastUpdated: string;             // ISO timestamp
  nextScheduledCycle: string;      // Next 30min cycle time
}

/**
 * Tool call summary for dashboard
 */
export interface ToolCallSummary {
  toolId: string;
  count: number;                   // How many times used today
  lastUsed: string;                // ISO timestamp
  avgExecutionTime: number;        // Average execution time in ms
}

/**
 * Recent activity item for dashboard feed
 */
export interface RecentActivityItem {
  timestamp: string;               // ISO timestamp
  agentId: string;
  agentName: string;
  action: string;                  // "used web_search()", "took note", "entered sleep"
  detail: string;                  // "Researching AI trends", "Market analysis..."
  toolId?: string;                 // For filtering by tool type
}

// ============================================================================
// 🔧 DASHBOARD UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate time ago string from ISO timestamp
 */
export function getTimeAgo(isoTimestamp: string): string {
  const now = new Date();
  const timestamp = new Date(isoTimestamp);
  const diffMs = now.getTime() - timestamp.getTime();
  
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

/**
 * Get agent status color based on current state
 */
export function getAgentStatusColor(status: string, lastActivity: string): {
  statusColor: string;
  statusRing: string;
} {
  const lastActivityMs = new Date().getTime() - new Date(lastActivity).getTime();
  const minutesAgo = lastActivityMs / (1000 * 60);
  
  if (status === 'sleep') {
    return { statusColor: 'bg-purple-500', statusRing: 'ring-purple-500/20' };
  }
  
  if (minutesAgo < 5) {
    return { statusColor: 'bg-green-500', statusRing: 'ring-green-500/20' }; // Very active
  }
  
  if (minutesAgo < 30) {
    return { statusColor: 'bg-blue-500', statusRing: 'ring-blue-500/20' }; // Active
  }
  
  return { statusColor: 'bg-gray-400', statusRing: 'ring-gray-400/20' }; // Inactive
}

/**
 * Extract recent tool calls from agent data
 */
export function extractRecentToolCalls(agent: any): string[] {
  if (!agent.tool_call_results || !Array.isArray(agent.tool_call_results)) {
    return [];
  }
  
  // Extract tool IDs from recent tool call results (last 3)
  return agent.tool_call_results
    .slice(-3)
    .map((result: string) => {
      const match = result.match(/^([^(]+)/);
      return match ? match[1] : 'unknown';
    })
    .reverse(); // Most recent first
}

/**
 * Generate engaging agent summary (100-200 chars)
 */
export function generateAgentSummary(agent: any): {
  lastToolCall?: string;
  lastNote?: string;
  nextAction?: string;
} {
  const summary: any = {};
  
  // Last tool call with context
  if (agent.tool_call_results && agent.tool_call_results.length > 0) {
    const lastResult = agent.tool_call_results[agent.tool_call_results.length - 1];
    const match = lastResult.match(/^([^(]+)\([^)]*\): (.+?) \[/);
    if (match) {
      const toolId = match[1];
      const result = match[2].substring(0, 50);
      summary.lastToolCall = `used ${toolId}(${result}...)`;
    }
  }
  
  // Last note created
  if (agent.system_notes && agent.system_notes.length > 0) {
    const lastNote = agent.system_notes[agent.system_notes.length - 1];
    if (lastNote && lastNote.content) {
      summary.lastNote = lastNote.content.substring(0, 60) + '...';
    }
  }
  
  // Next action from turn prompt enhancement
  if (agent.turn_prompt_enhancement) {
    summary.nextAction = agent.turn_prompt_enhancement.substring(0, 60) + '...';
  }
  
  return summary;
} 