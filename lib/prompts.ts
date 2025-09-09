/**
 * SpawnKit Centralized Prompts System
 * All prompts for system building and turn generation in one place
 */

// ============================================================================
// 🎯 AWAKE MODE TURN PROMPTS (25 Rotating Options)
// ============================================================================

export const AWAKE_MODE_TURN_PROMPTS = [
  "Try to achieve your goals using the tools you have access to or propose new tools that the human should get you, always use tools in the format provided ie. take_note(<note>) or web_search(<query>). After your response, include your next step in <turn_prompt> tags.",
  
  "Focus on making meaningful progress toward your objectives. Use available tools strategically and document important insights. End with your next planned action in <turn_prompt> tags.",
  
  "Analyze your current situation and take concrete actions to advance your goals. Utilize tools when beneficial and capture key learnings. Conclude with <turn_prompt> for your next move.",
  
  "Assess your progress and identify the most impactful next steps. Execute relevant tools and record valuable observations. Finish with your next priority in <turn_prompt> tags.",
  
  "Evaluate your current state and pursue high-value activities aligned with your objectives. Apply tools effectively and note significant findings. End with <turn_prompt> guidance.",
  
  "Review your goals and take decisive action to move forward. Leverage available tools and document important discoveries. Close with your next intended step in <turn_prompt> tags.",
  
  "Consider your mission and execute strategic moves to advance your purpose. Use tools purposefully and capture critical insights. Conclude with <turn_prompt> for continuation.",
  
  "Examine your objectives and implement targeted actions for progress. Deploy tools wisely and record essential learnings. Finish with your next focus in <turn_prompt> tags.",
  
  "Study your current position and initiate meaningful work toward your goals. Utilize tools thoughtfully and document key observations. End with <turn_prompt> direction.",
  
  "Reflect on your aims and pursue concrete steps for advancement. Apply tools strategically and note important findings. Close with your next action in <turn_prompt> tags.",
  
  "Analyze your mission and take purposeful action to achieve results. Use available tools and capture valuable insights. Conclude with <turn_prompt> for next steps.",
  
  "Assess your trajectory and implement focused efforts toward your objectives. Leverage tools effectively and record significant discoveries. End with <turn_prompt> guidance.",
  
  "Review your purpose and execute deliberate moves for progress. Deploy tools meaningfully and document critical learnings. Finish with your next priority in <turn_prompt> tags.",
  
  "Consider your goals and pursue impactful activities for advancement. Utilize tools strategically and note essential observations. Close with <turn_prompt> for continuation.",
  
  "Examine your mission and initiate concrete actions toward success. Apply tools thoughtfully and capture important insights. End with your next move in <turn_prompt> tags.",
  
  "Evaluate your objectives and take targeted steps for meaningful progress. Use tools purposefully and record valuable findings. Conclude with <turn_prompt> direction.",
  
  "Study your current state and implement strategic actions aligned with your goals. Leverage tools effectively and document key discoveries. Finish with <turn_prompt> guidance.",
  
  "Reflect on your purpose and pursue deliberate efforts for advancement. Deploy tools wisely and note significant learnings. End with your next focus in <turn_prompt> tags.",
  
  "Analyze your position and execute focused moves toward your objectives. Utilize tools meaningfully and capture critical insights. Close with <turn_prompt> for next steps.",
  
  "Assess your mission and take concrete action to drive results. Apply tools strategically and record important observations. Conclude with <turn_prompt> continuation.",
  
  "Review your goals and implement purposeful steps for progress. Use available tools and document essential findings. Finish with your next action in <turn_prompt> tags.",
  
  "Consider your trajectory and pursue impactful work toward success. Leverage tools thoughtfully and note valuable discoveries. End with <turn_prompt> guidance.",
  
  "Examine your objectives and initiate strategic moves for advancement. Deploy tools effectively and capture significant learnings. Close with your next priority in <turn_prompt> tags.",
  
  "Evaluate your current focus and take deliberate action for meaningful results. Utilize tools purposefully and record critical insights. Conclude with <turn_prompt> direction.",
  
  "Study your mission and execute targeted efforts aligned with your purpose. Apply tools wisely and document important observations. End with your next step in <turn_prompt> tags."
];

// ============================================================================
// 😴 SLEEP MODE TURN PROMPTS (25 Rotating Options)
// ============================================================================

export const SLEEP_MODE_TURN_PROMPTS = [
  "Summarize your turn history by taking all of your history and pulling out the top key ideas or notes, using take_note or take_thought and end your response with <summary> tag",
  
  "Reflect on your daily activities and extract the most important insights. Use take_note for lasting knowledge and take_thought for current reflections. Conclude with <summary> of the day.",
  
  "Review your recent conversations and identify key learnings worth preserving. Capture essential points with take_note and current thinking with take_thought. End with <summary>.",
  
  "Analyze your turn history to distill valuable knowledge and observations. Record important findings with take_note and thoughts with take_thought. Finish with <summary>.",
  
  "Examine your daily interactions and extract significant insights for future reference. Use take_note for permanent knowledge and take_thought for reflections. Close with <summary>.",
  
  "Process your conversation history to identify crucial learnings and patterns. Capture key points with take_note and current analysis with take_thought. End with <summary>.",
  
  "Consolidate your recent activities into meaningful insights and observations. Record lasting knowledge with take_note and thoughts with take_thought. Conclude with <summary>.",
  
  "Synthesize your turn history to preserve important discoveries and reflections. Use take_note for essential findings and take_thought for analysis. Finish with <summary>.",
  
  "Distill your daily conversations into valuable knowledge and current thinking. Capture insights with take_note and reflections with take_thought. End with <summary>.",
  
  "Extract meaningful patterns and learnings from your recent interactions. Record significant points with take_note and thoughts with take_thought. Close with <summary>.",
  
  "Compress your turn history into essential insights and strategic observations. Use take_note for important knowledge and take_thought for analysis. Conclude with <summary>.",
  
  "Transform your conversation data into lasting knowledge and current reflections. Capture key learnings with take_note and thinking with take_thought. End with <summary>.",
  
  "Process your daily activities to identify valuable insights worth retaining. Record crucial findings with take_note and thoughts with take_thought. Finish with <summary>.",
  
  "Analyze your interaction history to extract important knowledge and patterns. Use take_note for lasting insights and take_thought for reflections. Close with <summary>.",
  
  "Consolidate your recent conversations into meaningful discoveries and observations. Capture essential points with take_note and analysis with take_thought. End with <summary>.",
  
  "Synthesize your turn history to preserve critical learnings and strategic thinking. Record insights with take_note and reflections with take_thought. Conclude with <summary>.",
  
  "Distill your daily interactions into valuable knowledge and current understanding. Use take_note for important findings and take_thought for thoughts. Finish with <summary>.",
  
  "Extract significant insights and patterns from your conversation history. Capture key discoveries with take_note and analysis with take_thought. End with <summary>.",
  
  "Compress your recent activities into essential knowledge and strategic reflections. Record crucial learnings with take_note and thinking with take_thought. Close with <summary>.",
  
  "Transform your turn data into lasting insights and meaningful observations. Use take_note for important knowledge and take_thought for reflections. Conclude with <summary>.",
  
  "Process your interaction history to identify valuable patterns and discoveries. Capture essential findings with take_note and thoughts with take_thought. End with <summary>.",
  
  "Analyze your daily conversations to extract meaningful insights and learnings. Record significant points with take_note and analysis with take_thought. Finish with <summary>.",
  
  "Consolidate your turn history into important knowledge and strategic observations. Use take_note for lasting insights and take_thought for reflections. Close with <summary>.",
  
  "Synthesize your recent activities to preserve valuable discoveries and thinking. Capture key learnings with take_note and thoughts with take_thought. End with <summary>.",
  
  "Distill your conversation history into essential insights and meaningful reflections. Record crucial findings with take_note and analysis with take_thought. Conclude with <summary>."
];

// ============================================================================
// 🧠 SYSTEM PROMPT BUILDING COMPONENTS
// ============================================================================

export const SYSTEM_PROMPT_SECTIONS = {
  AGENT_GOAL_LABEL: "AGENT GOAL",
  PERMANENT_MEMORY_LABEL: "PERMANENT MEMORY (Static Knowledge)",
  WEEKLY_NOTES_LABEL: "WEEKLY NOTES (7-day persistence)",
  URGENT_NOTES_LABEL: "🚨 URGENT - EXPIRING SOON",
  REGULAR_NOTES_LABEL: "📝 REGULAR NOTES",
  DAILY_THOUGHTS_LABEL: "DAILY THOUGHTS (1-day persistence)",
  AVAILABLE_TOOLS_LABEL: "AVAILABLE TOOLS",
  CURRENT_TIME_LABEL: "CURRENT TIME",
  TOOL_CALL_RESULTS_LABEL: "TOOL CALL RESULTS (Recent Activity)",
  TURN_PROMPT_ENHANCEMENT_LABEL: "NEXT TURN GUIDANCE"
};

export const AWAKE_MODE_INSTRUCTIONS = `
IMPORTANT INSTRUCTIONS:
- You are an autonomous AI agent working toward a specific goal
- Each response should show progress made toward the goal
- Use available tools when appropriate (take_note, web_search, take_thought, etc.)
- Always end your response with a <turn_prompt> tag containing the next specific step
- The next step should be concrete and actionable
- If you've achieved the goal, indicate completion in your response
- Be strategic and methodical in your approach`;

export const SLEEP_MODE_INSTRUCTIONS = `
SLEEP MODE - MEMORY CONSOLIDATION:
- Review all your turn history and extract the most important insights
- Use take_note() for knowledge that should persist beyond today (1-14 days)
- Use take_thought() for reflections that help with tomorrow's work
- CRITICAL: Notes and thoughts expiring soon will be deleted - consolidate them!
- Create a comprehensive summary of today's activities and learnings
- End your response with <summary>today's key accomplishments and insights</summary>
- This summary will be prepended to tomorrow's conversation history`;

// ============================================================================
// 🔧 PROMPT BUILDING FUNCTIONS
// ============================================================================

export function buildSystemPrompt(
  agent: any,
  mode: 'awake' | 'sleep',
  currentTime: string
): string {
  const sections: string[] = [];
  
  // 1. Agent Description (Core Goal/Identity)
  if (agent.description && agent.description.trim()) {
    sections.push(`${SYSTEM_PROMPT_SECTIONS.AGENT_GOAL_LABEL}: ${agent.description}`);
  }
  
  // 2. Permanent Memory (Static, user-defined, persistent)
  if (agent.system_permanent_memory && agent.system_permanent_memory.length > 0) {
    sections.push(`${SYSTEM_PROMPT_SECTIONS.PERMANENT_MEMORY_LABEL}:\n${agent.system_permanent_memory.join('\n')}`);
  }
  
  // 3. Weekly Notes (7-day persistence with expiration info)
  if (agent.system_notes && agent.system_notes.length > 0) {
    const now = new Date();
    const notesWithExpiry = agent.system_notes.map((note: any) => {
      if (typeof note === 'string') {
        // Legacy note format - treat as expiring soon
        return { content: note, expires_at: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString() };
      }
      return note;
    });
    
    // Sort notes by expiration (expiring soon first)
    const sortedNotes = notesWithExpiry.sort((a: any, b: any) => {
      const aExpiry = new Date(a.expires_at || 0);
      const bExpiry = new Date(b.expires_at || 0);
      return aExpiry.getTime() - bExpiry.getTime();
    });
    
    // Group notes by urgency
    const urgentNotes = sortedNotes.filter((note: any) => {
      const expiry = new Date(note.expires_at);
      const hoursUntilExpiry = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60);
      return hoursUntilExpiry <= 24; // Expires within 24 hours
    });
    
    const regularNotes = sortedNotes.filter((note: any) => {
      const expiry = new Date(note.expires_at);
      const hoursUntilExpiry = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60);
      return hoursUntilExpiry > 24; // Expires in more than 24 hours
    });
    
    let notesSection = `${SYSTEM_PROMPT_SECTIONS.WEEKLY_NOTES_LABEL}:\n`;
    
    if (urgentNotes.length > 0) {
      notesSection += `${SYSTEM_PROMPT_SECTIONS.URGENT_NOTES_LABEL}:\n`;
      urgentNotes.forEach((note: any) => {
        const expiry = new Date(note.expires_at);
        const hoursUntilExpiry = Math.max(0, (expiry.getTime() - now.getTime()) / (1000 * 60 * 60));
        notesSection += `• ${note.content} (expires in ${Math.round(hoursUntilExpiry)}h)\n`;
      });
      notesSection += '\n';
    }
    
    if (regularNotes.length > 0) {
      notesSection += `${SYSTEM_PROMPT_SECTIONS.REGULAR_NOTES_LABEL}:\n`;
      regularNotes.forEach((note: any) => {
        const expiry = new Date(note.expires_at);
        const daysUntilExpiry = Math.max(0, (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const roundedDays = Math.ceil(daysUntilExpiry);
        const expiryText = roundedDays === 1 ? 'expires in 1d' : `expires in ${roundedDays}d`;
        notesSection += `• ${note.content} (${expiryText})\n`;
      });
    }
    
    sections.push(notesSection);
  }
  
  // 4. Daily Thoughts (1-day persistence, daily goals)
  if (agent.system_thoughts && agent.system_thoughts.length > 0) {
    sections.push(`${SYSTEM_PROMPT_SECTIONS.DAILY_THOUGHTS_LABEL}:\n${agent.system_thoughts.join('\n')}`);
  }
  
  // 5. Available Tools
  if (agent.system_tools && agent.system_tools.length > 0) {
    const toolDescriptions = agent.system_tools.map((tool: any) => 
      typeof tool === 'string' ? tool : tool.description || tool.id
    );
    sections.push(`${SYSTEM_PROMPT_SECTIONS.AVAILABLE_TOOLS_LABEL}:\n${toolDescriptions.join('\n')}`);
  }
  
  // 6. Tool Call Results (Recent Activity)
  if (agent.tool_call_results && agent.tool_call_results.length > 0) {
    // Filter to last 2 hours (TTL)
    const twoHoursAgo = new Date(Date.now() - (2 * 60 * 60 * 1000));
    const recentResults = agent.tool_call_results.filter((result: string) => {
      const timestampMatch = result.match(/\[([^\]]+)\]$/);
      if (!timestampMatch) return false;
      try {
        const timestamp = new Date(timestampMatch[1]);
        return timestamp > twoHoursAgo;
      } catch {
        return false;
      }
    });
    
    if (recentResults.length > 0) {
      sections.push(`${SYSTEM_PROMPT_SECTIONS.TOOL_CALL_RESULTS_LABEL}:\n${recentResults.join('\n')}`);
    }
  }
  
  // 7. Turn Prompt Enhancement (if available)
  if (agent.turn_prompt_enhancement && agent.turn_prompt_enhancement.trim()) {
    sections.push(`${SYSTEM_PROMPT_SECTIONS.TURN_PROMPT_ENHANCEMENT_LABEL}:\n${agent.turn_prompt_enhancement}`);
  }
  
  // 8. Current Time Context
  sections.push(`${SYSTEM_PROMPT_SECTIONS.CURRENT_TIME_LABEL}: ${currentTime}`);
  
  // 9. Mode-specific instructions
  if (mode === 'awake') {
    sections.push(AWAKE_MODE_INSTRUCTIONS);
  } else {
    sections.push(SLEEP_MODE_INSTRUCTIONS);
  }
  
  return sections.join('\n\n');
}

export function getRandomTurnPrompt(mode: 'awake' | 'sleep'): string {
  const prompts = mode === 'awake' ? AWAKE_MODE_TURN_PROMPTS : SLEEP_MODE_TURN_PROMPTS;
  const randomIndex = Math.floor(Math.random() * prompts.length);
  return prompts[randomIndex];
}

export function buildTurnPrompt(
  agent: any,
  mode: 'awake' | 'sleep'
): string {
  // Use existing turn_prompt_enhancement if available, otherwise get random prompt
  if (agent.turn_prompt_enhancement && agent.turn_prompt_enhancement.trim() && mode === 'awake') {
    return agent.turn_prompt_enhancement;
  }
  
  return getRandomTurnPrompt(mode);
}

// ============================================================================
// 🔧 UTILITY FUNCTIONS
// ============================================================================

export function formatNoteExpiration(note: any): string {
  const now = new Date();
  const expires = new Date(note.expires_at);
  const diffMs = expires.getTime() - now.getTime();
  
  if (diffMs <= 0) return "expired";
  
  const diffDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
  return diffDays === 1 ? "expires in 1d" : `expires in ${diffDays}d`;
}

export function isNoteExpired(note: any): boolean {
  const now = new Date();
  const expires = new Date(note.expires_at);
  return now > expires;
}

export function filterExpiredNotes(notes: any[]): any[] {
  return notes.filter(note => !isNoteExpired(note));
} 