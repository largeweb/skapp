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
    description: 'generate_system_note(message: string, expirationDays: int) - Creates a new note that persists in your system memory for the specified days (1-14, default 7) and then expires. Use this to remember important information, learnings, or observations that should persist across multiple turns but eventually expire.'
  },
  {
    id: 'generate_system_thought',
    required: true,
    description: 'generate_system_thought(message: string) - Records a thought that persists until your next sleep cycle. These thoughts help you maintain context and reasoning across turns within the same day. All thoughts are cleared when you enter sleep mode.'
  },
  {
    id: 'generate_turn_prompt_enhancement',
    required: true,
    description: 'generate_turn_prompt_enhancement(message: string) - Generates guidance for your next turn when in awake mode. Use this to set intentions, priorities, or specific goals for your next activation. This helps maintain continuity and purpose across turns.'
  },
  {
    id: 'generate_day_summary_from_conversation',
    required: true,
    description: 'generate_day_summary_from_conversation(message: string) - Used in sleep mode to create a comprehensive summary of the day\'s activities and learnings. This summary gets prepended to your conversation history to maintain context while compressing older turns.'
  }
];

// ============================================================================
// 🔧 OPTIONAL TOOLS REGISTRY (Future Expansion)
// ============================================================================

export const OPTIONAL_TOOLS: AgentTool[] = [
  {
    id: 'web_search',
    required: false,
    description: 'web_search(query: string) - Searches the internet for current information and returns results. Use this to gather up-to-date information, research topics, or find specific data that isn\'t in your existing knowledge.'
  },
  {
    id: 'discord_message',
    required: false,
    description: 'discord_message(channel: string, message: string) - Sends a message to a specified Discord channel. Use this to communicate with team members, share updates, or participate in community discussions.'
  },
  {
    id: 'sms_operator',
    required: false,
    description: 'sms_operator(phone: string, message: string) - Sends an SMS message to a human operator. Use this for urgent communications or when human intervention is needed for critical decisions.'
  },
  {
    id: 'email_send',
    required: false,
    description: 'email_send(to: string, subject: string, message: string) - Sends an email to specified recipients. Use this for formal communications, detailed reports, or structured information sharing.'
  },
  {
    id: 'file_create',
    required: false,
    description: 'file_create(filename: string, content: string) - Creates a file with specified content. Use this to generate reports, save data, or create documentation that needs to persist beyond memory.'
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
  
  // Extract first sentence of description
  const firstSentence = tool.description.split('.')[0];
  return firstSentence.substring(firstSentence.indexOf(') - ') + 4) || tool.description;
}

/**
 * Format tool for system prompt
 */
export function formatToolForSystemPrompt(tool: AgentTool): string {
  return tool.description;
} 