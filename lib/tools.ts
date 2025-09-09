/**
 * SpawnKit Tool Definitions
 * Centralized tool registry for frontend display and backend validation
 */

import type { AgentTool } from './types';

// ============================================================================
// 🛠️ REQUIRED TOOLS REGISTRY
// ============================================================================

export const REQUIRED_TOOLS: AgentTool[] = [
  {
    id: 'generate_system_note',
    required: true,
    description: 'Creates a new note that persists in your system memory for the specified days (1-14, default 7) and then expires. Use this to remember important information, learnings, or observations that should persist across multiple turns but eventually expire.\n\nXML USAGE:\n<sktool><generate_system_note><message>Your note content here</message><expirationDays>7</expirationDays></generate_system_note></sktool>\n\nEXAMPLE:\n<sktool><generate_system_note><message>Market analysis shows 25% growth in AI sector</message><expirationDays>14</expirationDays></generate_system_note></sktool>'
  },
  {
    id: 'generate_system_thought',
    required: true,
    description: 'Records a thought that persists until your next sleep cycle. These thoughts help you maintain context and reasoning across turns within the same day. All thoughts are cleared when you enter sleep mode.\n\nXML USAGE:\n<sktool><generate_system_thought><message>Your thought content here</message></generate_system_thought></sktool>\n\nEXAMPLE:\n<sktool><generate_system_thought><message>Need to focus on competitor analysis next</message></generate_system_thought></sktool>'
  },
  {
    id: 'generate_turn_prompt_enhancement',
    required: true,
    description: 'Generates guidance for your next turn when in awake mode. Use this to set intentions, priorities, or specific goals for your next activation. This helps maintain continuity and purpose across turns.\n\nXML USAGE:\n<sktool><generate_turn_prompt_enhancement><message>Your guidance message here</message></generate_turn_prompt_enhancement></sktool>\n\nEXAMPLE:\n<sktool><generate_turn_prompt_enhancement><message>Research competitor pricing strategies and market positioning</message></generate_turn_prompt_enhancement></sktool>'
  },
  {
    id: 'generate_day_summary_from_conversation',
    required: true,
    description: 'Used in sleep mode to create a comprehensive summary of the day\'s activities and learnings. This summary gets prepended to your conversation history to maintain context while compressing older turns.\n\nXML USAGE:\n<sktool><generate_day_summary_from_conversation><message>Summary of today\'s activities</message></generate_day_summary_from_conversation></sktool>\n\nEXAMPLE:\n<sktool><generate_day_summary_from_conversation><message>Today: researched AI market, identified 3 opportunities, planned competitor analysis</message></generate_day_summary_from_conversation></sktool>'
  }
];

// ============================================================================
// 🔧 OPTIONAL TOOLS REGISTRY (Future Expansion)
// ============================================================================

export const OPTIONAL_TOOLS: AgentTool[] = [
  {
    id: 'web_search',
    required: false,
    description: 'Searches the internet using SERP analysis and returns Google search results from first 2 pages with links and thumbnail descriptions. Use this to gather current market data, research trends, or find specific information.\n\nXML USAGE:\n<sktool><web_search><query>Your search query</query></web_search></sktool>'
  },
  {
    id: 'extract_text',
    required: false,
    description: 'Extracts clean text content from any web page URL by stripping away HTML markup and returning readable content. Use this to analyze articles, documentation, or web content for insights.\n\nXML USAGE:\n<sktool><extract_text><url>https://example.com</url></extract_text></sktool>'
  },
  {
    id: 'discord_message',
    required: false,
    description: 'Sends a message to a specified Discord channel using hardcoded channel configuration. Use this to communicate with team members, share updates, or participate in community discussions.\n\nXML USAGE:\n<sktool><discord_message><message>Your message content</message></discord_message></sktool>'
  }
];

// ============================================================================
// 🎯 TOOL UTILITY FUNCTIONS
// ============================================================================

/**
 * Get all available tools (required + optional)
 */
export function getAllAvailableTools(): AgentTool[] {
  return [...REQUIRED_TOOLS, ...OPTIONAL_TOOLS];
}

/**
 * Get only required tools for new agent creation
 */
export function getRequiredTools(): AgentTool[] {
  return REQUIRED_TOOLS;
}

/**
 * Get only optional tools for agent customization
 */
export function getOptionalTools(): AgentTool[] {
  return OPTIONAL_TOOLS;
}

/**
 * Find tool by ID
 */
export function getToolById(toolId: string): AgentTool | undefined {
  return getAllAvailableTools().find(tool => tool.id === toolId);
}

/**
 * Validate that an agent has all required tools
 */
export function validateAgentTools(agentTools: AgentTool[]): {
  valid: boolean;
  missingRequired: string[];
  hasAllRequired: boolean;
} {
  const agentToolIds = agentTools.map(t => t.id);
  const requiredToolIds = REQUIRED_TOOLS.map(t => t.id);
  const missingRequired = requiredToolIds.filter(id => !agentToolIds.includes(id));
  
  return {
    valid: missingRequired.length === 0,
    missingRequired,
    hasAllRequired: missingRequired.length === 0
  };
}

/**
 * Get tool display name for UI
 */
export function getToolDisplayName(toolId: string): string {
  const tool = getToolById(toolId);
  if (!tool) return toolId;
  
  // Convert snake_case to Title Case
  return toolId
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get tool short description for UI
 */
export function getToolShortDescription(toolId: string): string {
  const tool = getToolById(toolId);
  if (!tool) return 'Unknown tool';
  
  // Extract description before XML USAGE section
  const description = tool.description.split('\n\nXML USAGE:')[0];
  
  // For required tools, extract the main description
  switch (toolId) {
    case 'generate_system_note':
      return 'Creates a new note that persists in your system memory for the specified days (1-14, default 7) and then expires';
    case 'generate_system_thought':
      return 'Records a thought that persists until your next sleep cycle';
    case 'generate_turn_prompt_enhancement':
      return 'Generates guidance for your next turn when in awake mode';
    case 'generate_day_summary_from_conversation':
      return 'Used in sleep mode to create a comprehensive summary of the day\'s activities and learnings';
    default:
      return description || tool.description;
  }
}

/**
 * Format tool for system prompt
 */
export function formatToolForSystemPrompt(tool: AgentTool): string {
  return tool.description;
} 