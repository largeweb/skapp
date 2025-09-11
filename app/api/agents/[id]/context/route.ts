export const runtime = 'edge';

import { getRequestContext } from '@cloudflare/next-on-pages';
import { z } from 'zod';
import { buildSystemPrompt, buildTurnPrompt, getRandomTurnPrompt } from '@/lib/prompts';
import { convertToEST, getCurrentAgentMode, formatESTTime, createAPIResponse, createAPIError } from '@/lib/utils';

const ContextRequestSchema = z.object({
  mode: z.enum(['awake', 'sleep', 'chat']),
  chatHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string()
  })).optional()
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { env } = getRequestContext();
    const { id } = await params;
    
    console.log(`🔍 Building context for agent: ${id}`);
    
    // Parse request
    const body = await request.json();
    const validated = ContextRequestSchema.parse(body);
    
    // Get agent data
    const agentData = await env.SKAPP_AGENTS.get(`agent:${id}`);
    if (!agentData) {
      return Response.json({ 
        error: 'Agent not found',
        code: 'AGENT_NOT_FOUND'
      }, { status: 404 });
    }
    
    const agent = JSON.parse(agentData);
    
    // Get current time in EST (using centralized utilities)
    const now = new Date();
    const currentMode = getCurrentAgentMode(now);
    const timeStr = formatESTTime(now);
    
    console.log(`🕐 Context API: Mode: ${currentMode}, Time: ${timeStr}`);
    
    // Build system prompt based on mode
    let systemPrompt: string;
    let turnPrompt: string | null = null;
    let additionalContext: any = {};
    
    // Use actual current mode for accurate context (override requested mode for accuracy)
    const actualMode = validated.mode === 'chat' ? 'chat' : currentMode;
    
    if (actualMode === 'chat') {
      // Chat mode: similar to current actual mode but with chat-specific instructions
      systemPrompt = buildChatSystemPrompt(agent, timeStr);
      additionalContext.chatInstructions = "This is an interactive chat session. Respond naturally and helpfully to the user's messages while staying true to your agent goals and personality.";
      additionalContext.actualMode = currentMode; // Show what mode agent is actually in
      
      // Include chat history if provided
      if (validated.chatHistory && validated.chatHistory.length > 0) {
        additionalContext.localChatHistory = validated.chatHistory;
      } else {
        additionalContext.localChatHistory = [];
        additionalContext.chatMessage = "Chats are temporary and reset on page reload. You currently don't have any message history. Start chatting to see conversation context here.";
      }
    } else {
      // Awake or sleep mode - use actual current mode
      systemPrompt = buildSystemPrompt(agent, actualMode, timeStr);
      turnPrompt = buildTurnPrompt(agent, actualMode);
      
      if (actualMode === 'awake') {
        additionalContext.turnPromptEnhancement = agent.turn_prompt_enhancement || null;
        additionalContext.channelActivity = await fetchChannelActivity('discord-channel-1');
      } else if (actualMode === 'sleep') {
        additionalContext.sleepInstructions = "Memory consolidation mode - reviewing and summarizing daily activities.";
        additionalContext.channelActivity = await fetchChannelActivity('discord-channel-1');
      }
    }
    
    return Response.json({
      success: true,
      agentId: id,
      mode: validated.mode,
      systemPrompt,
      turnPrompt,
      currentTime: timeStr,
      additionalContext
    });
    
  } catch (error) {
    console.error('🚨 Context API error:', error);
    
    if (error instanceof z.ZodError) {
      return Response.json({ 
        error: 'Invalid request format', 
        details: error.issues 
      }, { status: 400 });
    }
    
    return Response.json({ 
      error: 'Failed to build context',
      code: 'CONTEXT_BUILD_FAILED'
    }, { status: 500 });
  }
}

// Timezone functions moved to @/lib/utils

function buildChatSystemPrompt(agent: any, currentTime: string): string {
  const sections: string[] = [];
  
  // Use same structure as buildSystemPrompt but with chat-specific instructions
  if (agent.description && agent.description.trim()) {
    sections.push(`AGENT IDENTITY: ${agent.description}`);
  }
  
  if (agent.system_permanent_memory && agent.system_permanent_memory.length > 0) {
    sections.push(`PERMANENT MEMORY (Core Knowledge):\n${agent.system_permanent_memory.join('\n')}`);
  }
  
  if (agent.system_notes && agent.system_notes.length > 0) {
    const now = new Date();
    const notesWithExpiry = agent.system_notes.map((note: any) => {
      if (typeof note === 'string') {
        return { content: note, expires_at: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString() };
      }
      return note;
    });
    
    const activeNotes = notesWithExpiry.filter((note: any) => {
      const expiry = new Date(note.expires_at);
      return expiry > now;
    });
    
    if (activeNotes.length > 0) {
      const notesList = activeNotes.map((note: any) => {
        const expiry = new Date(note.expires_at);
        const daysUntilExpiry = Math.max(0, (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const roundedDays = Math.ceil(daysUntilExpiry);
        const expiryText = roundedDays === 1 ? 'expires in 1d' : `expires in ${roundedDays}d`;
        return `• ${note.content} (${expiryText})`;
      }).join('\n');
      
      sections.push(`RECENT NOTES (Temporary Knowledge):\n${notesList}`);
    }
  }
  
  if (agent.system_thoughts && agent.system_thoughts.length > 0) {
    sections.push(`CURRENT THOUGHTS (Today's Reflections):\n${agent.system_thoughts.join('\n')}`);
  }
  
  sections.push(`CURRENT TIME: ${currentTime}`);
  
  sections.push(`
CHAT MODE INSTRUCTIONS:
- You are having an interactive conversation with a user
- Stay true to your agent identity and goals while being helpful and engaging
- Draw from your permanent memory, notes, and thoughts to provide informed responses
- Be natural and conversational while maintaining your unique personality
- If the user asks about your capabilities, mention your available tools and knowledge areas
- This is a real-time chat - respond directly to what the user is saying`);
  
  return sections.join('\n\n');
}

async function fetchChannelActivity(channelId: string): Promise<string> {
  // Placeholder function for Discord channel activity
  return "This channel integration has not been configured yet. Please contact SpawnKit administration to enable Discord channel monitoring for enhanced agent context.";
} 