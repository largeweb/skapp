export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  reasoningEffort?: 'low' | 'medium' | 'high';
  stream?: boolean;
}

export interface ChatResponse {
  success: boolean;
  message?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  error?: string;
  code?: string;
}

export interface StreamChunk {
  content: string;
  done: boolean;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface APIError {
  error: string;
  code?: string;
  details?: any;
}

// ============================================================================
// 🤖 SIMPLIFIED AGENT SYSTEM - MVP FOCUSED
// ============================================================================

/**
 * Agent operating modes
 */
export type AgentMode = 'awake' | 'sleep';

/**
 * Required tool IDs that every agent must have
 */
export type RequiredToolId = 
  | 'generate_system_note' 
  | 'generate_system_thought' 
  | 'generate_turn_prompt_enhancement' 
  | 'generate_day_summary_from_conversation';

/**
 * Simplified tool definition
 */
export interface AgentTool {
  id: string;
  required: boolean;
  description: string;
}

/**
 * Simplified note with expiration
 */
export interface SystemNote {
  content: string;
  expires_at: string;
}

/**
 * Simplified turn history entry
 */
export interface TurnHistoryEntry {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

/**
 * SIMPLIFIED AGENT RECORD - Exact KV Structure
 * This matches the user's exact requirements for MVP
 */
export interface AgentRecord {
  // Core identity
  agentId: string;
  name: string;
  description: string;
  
  // Timing & mode
  lastCycle: string;          // ISO timestamp
  lastSlept: string;          // YYYY-MM-DD for once-per-day sleep
  turnsCount: number;
  
  // Memory (4 layers - keep simple)
  system_permanent_memory: string[];
  system_notes: SystemNote[];
  system_thoughts: string[];
  system_tools: AgentTool[];
  
  // Turn data
  turn_history: TurnHistoryEntry[];
  turn_prompt_enhancement?: string;
  previous_day_summary?: string;
  tool_call_results: string[];  // Simple array of "toolId(params): result" strings with 2h TTL
}

/**
 * Agent summary for list views and dashboard
 */
export interface Agent {
  id: string;
  name: string;
  description: string;
  status: AgentMode;
  lastActivity: string;
  createdAt: string;
  memoryStats: {
    pmem: number;    // Count of permanent memory entries
    note: number;    // Count of active notes (not expired)
    thgt: number;    // Count of current thoughts
    tools: number;   // Count of available tools
  };
}

/**
 * Agent creation payload
 */
export interface CreateAgentRequest {
  name: string;
  description: string;
  system_permanent_memory?: string[];
  system_notes?: SystemNote[];
  system_thoughts?: string[];
}

/**
 * Agents list response with pagination
 */
export interface AgentsResponse {
  agents: Agent[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// ============================================================================
// 🛠️ TOOL SYSTEM TYPES - SIMPLIFIED
// ============================================================================

/**
 * Tool execution request for /api/process-tool
 */
export interface ProcessToolRequest {
  toolId: string;
  params: Record<string, any>;
  agentId: string;
}

/**
 * Tool execution response
 */
export interface ProcessToolResponse {
  success: boolean;
  result: string;
  error?: string;
}

/**
 * XML tool call parsed from agent response
 */
export interface ParsedToolCall {
  toolId: string;
  params: Record<string, any>;
  rawXml: string;
}

// ============================================================================
// 🎭 ORCHESTRATION TYPES - SIMPLIFIED
// ============================================================================

/**
 * Orchestration request payload
 */
export interface OrchestrationRequest {
  agentId?: string;      // Optional: target specific agent
  mode?: AgentMode;      // Optional: force specific mode
  estTime?: string;      // Optional: override current time
}

/**
 * Generation request for /api/agents/[id]/generate
 */
export interface GenerationRequest {
  agentId: string;
  systemPrompt: string;
  turnHistory: TurnHistoryEntry[];
  turnPrompt: string;
  mode: AgentMode;
}

/**
 * Generation response
 */
export interface GenerationResponse {
  success: boolean;
  content?: string;
  toolCalls?: ParsedToolCall[];
  error?: string;
} 