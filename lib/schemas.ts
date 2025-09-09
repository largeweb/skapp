import { z } from 'zod';
import type { 
  AgentMode, 
  RequiredToolId,
  AgentTool,
  SystemNote,
  TurnHistoryEntry,
  AgentRecord,
  CreateAgentRequest,
  ProcessToolRequest,
  OrchestrationRequest,
  GenerationRequest 
} from './types';

// ============================================================================
// 🔧 SIMPLIFIED SCHEMAS - MVP FOCUSED
// ============================================================================

export const AgentModeSchema = z.enum(['awake', 'sleep']);

export const RequiredToolIdSchema = z.enum([
  'generate_system_note',
  'generate_system_thought', 
  'generate_turn_prompt_enhancement',
  'generate_day_summary_from_conversation'
]);

export const AgentToolSchema = z.object({
  id: z.string().min(1).max(100),
  required: z.boolean(),
  description: z.string().min(10).max(2000),
});

export const SystemNoteSchema = z.object({
  content: z.string().min(1).max(2000),
  expires_at: z.string().datetime(),
});

export const TurnHistoryEntrySchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(50000),
  timestamp: z.string().datetime(),
});

export const ProcessToolSchema = z.object({
  toolId: z.string().min(1).max(100),
  params: z.record(z.string(), z.any()),
  agentId: z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/),
});

export const OrchestrationRequestSchema = z.object({
  agentId: z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/).optional(),
  mode: AgentModeSchema.optional(),
  estTime: z.string().datetime().optional(),
});

export const GenerationRequestSchema = z.object({
  agentId: z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/),
  systemPrompt: z.string().min(10).max(50000),
  turnHistory: z.array(TurnHistoryEntrySchema).max(100),
  turnPrompt: z.string().min(1).max(5000),
  mode: AgentModeSchema,
});

// Tool-specific parameter schemas
export const GenerateSystemNoteParamsSchema = z.object({
  message: z.string().min(1).max(2000),
  expirationDays: z.number().int().min(1).max(14).default(7),
});

export const GenerateSystemThoughtParamsSchema = z.object({
  message: z.string().min(1).max(1000),
});

export const GenerateTurnPromptEnhancementParamsSchema = z.object({
  message: z.string().min(1).max(1000),
});

export const GenerateDaySummaryParamsSchema = z.object({
  message: z.string().min(1).max(5000),
});

// ============================================================================
// 🔧 UTILITY FUNCTIONS - SIMPLIFIED
// ============================================================================

/**
 * Gets default required tools for new agents
 */
export function getDefaultRequiredTools(): AgentTool[] {
  return [
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
}

/**
 * Validates that an agent has all required tools
 */
export function validateRequiredTools(tools: AgentTool[]): boolean {
  const requiredToolIds: RequiredToolId[] = [
    'generate_system_note',
    'generate_system_thought',
    'generate_turn_prompt_enhancement', 
    'generate_day_summary_from_conversation'
  ];
  
  const toolIds = tools.map(t => t.id);
  return requiredToolIds.every(id => toolIds.includes(id));
}

/**
 * Creates expiration date for notes (1-14 days from now)
 */
export function createExpirationDate(days: number): string {
  if (days < 1 || days > 14) {
    days = 7; // Default to 7 days
  }
  const now = new Date();
  const expiration = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));
  return expiration.toISOString();
} 