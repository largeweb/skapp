export const runtime = 'edge';

import { getRequestContext } from '@cloudflare/next-on-pages';
import { z } from 'zod';
import { ProcessToolSchema, createExpirationDate } from '@/lib/schemas';

export async function POST(request: Request): Promise<Response> {
  const startTime = Date.now();
  console.log('🛠️ Process Tool API: Start');

  try {
    const { env } = getRequestContext();
    
    // Parse and validate request with 10-second timeout
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Tool execution timeout')), 10000)
    );
    
    const executionPromise = (async () => {
      const body = await request.json();
      const validated = ProcessToolSchema.parse(body);
      
      console.log(`🔧 Processing tool: ${validated.toolId} for agent: ${validated.agentId}`);
      console.log(`📋 Parameters:`, JSON.stringify(validated.params).substring(0, 200));
      
      // Get agent from KV
      const agentKey = `agent:${validated.agentId}`;
      const agentData = await env.SKAPP_AGENTS.get(agentKey);
      
      if (!agentData) {
        return Response.json({ 
          success: false, 
          result: '', 
          error: `Agent ${validated.agentId} not found` 
        }, { status: 404 });
      }
      
      const agent = JSON.parse(agentData);
      
      // Execute the tool based on toolId
      const result = await executeToolFunction(validated.toolId, validated.params, agent);
      
      if (!result.success) {
        return Response.json({
          success: false,
          result: '',
          error: result.error
        }, { status: 400 });
      }
      
      // Create formatted tool call result
      const paramString = Object.entries(validated.params)
        .map(([key, value]) => `${key}: ${String(value)}`)
        .join(', ');
      const timestamp = new Date().toISOString();
      const toolCallResult = `${validated.toolId}(${paramString}): ${result.result} [${timestamp}]`;
      
      // Update agent KV with tool results
      await updateAgentWithToolResult(env, agentKey, agent, toolCallResult);
      
      const executionTime = Date.now() - startTime;
      console.log(`✅ Tool ${validated.toolId} executed successfully in ${executionTime}ms`);
      
      return Response.json({
        success: true,
        result: toolCallResult
      });
    })();
    
    // Race between execution and timeout
    return await Promise.race([executionPromise, timeoutPromise]) as Response;
    
  } catch (error: any) {
    const executionTime = Date.now() - startTime;
    console.error(`🚨 Process Tool Error after ${executionTime}ms:`, error?.message?.substring(0, 200));
    
    if (error instanceof z.ZodError) {
      return Response.json({
        success: false,
        result: '',
        error: 'Invalid request format',
        details: error.issues
      }, { status: 400 });
    }
    
    if (error.message === 'Tool execution timeout') {
      return Response.json({
        success: false,
        result: 'This tool did not finish executing in 10 seconds, please try again later',
        error: 'Timeout'
      }, { status: 408 });
    }
    
    return Response.json({
      success: false,
      result: '',
      error: 'Tool execution failed'
    }, { status: 500 });
  }
}

// ============================================================================
// 🛠️ TOOL EXECUTION FUNCTIONS
// ============================================================================

interface ToolExecutionResult {
  success: boolean;
  result: string;
  error?: string;
}

async function executeToolFunction(
  toolId: string, 
  params: Record<string, any>, 
  agent: any
): Promise<ToolExecutionResult> {
  
  switch (toolId) {
    case 'generate_system_note':
      return await executeGenerateSystemNote(params, agent);
      
    case 'generate_system_thought':
      return await executeGenerateSystemThought(params, agent);
      
    case 'generate_turn_prompt_enhancement':
      return await executeGenerateTurnPromptEnhancement(params, agent);
      
    case 'generate_day_summary_from_conversation':
      return await executeGenerateDaySummary(params, agent);
      
    default:
      return {
        success: false,
        result: '',
        error: `Unknown tool: ${toolId}`
      };
  }
}

async function executeGenerateSystemNote(
  params: Record<string, any>, 
  agent: any
): Promise<ToolExecutionResult> {
  
  try {
    const message = params.message;
    const expirationDays = params.expirationDays || 7;
    
    if (!message || typeof message !== 'string') {
      return {
        success: false,
        result: '',
        error: 'Message is required and must be a string'
      };
    }
    
    if (expirationDays < 1 || expirationDays > 14) {
      return {
        success: false,
        result: '',
        error: 'Expiration days must be between 1 and 14'
      };
    }
    
    // Create note with expiration
    const note = {
      content: message,
      expires_at: createExpirationDate(expirationDays)
    };
    
    // Add to agent's system_notes (will be saved by caller)
    if (!agent.system_notes) agent.system_notes = [];
    agent.system_notes.push(note);
    
    const result = `Note created: "${message}" (expires in ${expirationDays} days)`;
    console.log(`📝 Generated system note: ${result}`);
    
    return {
      success: true,
      result
    };
    
  } catch (error: any) {
    return {
      success: false,
      result: '',
      error: `Note creation failed: ${error.message}`
    };
  }
}

async function executeGenerateSystemThought(
  params: Record<string, any>, 
  agent: any
): Promise<ToolExecutionResult> {
  
  try {
    const message = params.message;
    
    if (!message || typeof message !== 'string') {
      return {
        success: false,
        result: '',
        error: 'Message is required and must be a string'
      };
    }
    
    // Add to agent's system_thoughts (will be saved by caller)
    if (!agent.system_thoughts) agent.system_thoughts = [];
    agent.system_thoughts.push(message);
    
    const result = `Thought recorded: "${message}"`;
    console.log(`💭 Generated system thought: ${result}`);
    
    return {
      success: true,
      result
    };
    
  } catch (error: any) {
    return {
      success: false,
      result: '',
      error: `Thought creation failed: ${error.message}`
    };
  }
}

async function executeGenerateTurnPromptEnhancement(
  params: Record<string, any>, 
  agent: any
): Promise<ToolExecutionResult> {
  
  try {
    const message = params.message;
    
    if (!message || typeof message !== 'string') {
      return {
        success: false,
        result: '',
        error: 'Message is required and must be a string'
      };
    }
    
    // Update agent's turn_prompt_enhancement (will be saved by caller)
    agent.turn_prompt_enhancement = message;
    
    const result = `Turn prompt enhancement set: "${message}"`;
    console.log(`🎯 Generated turn prompt enhancement: ${result}`);
    
    return {
      success: true,
      result
    };
    
  } catch (error: any) {
    return {
      success: false,
      result: '',
      error: `Turn prompt enhancement failed: ${error.message}`
    };
  }
}

async function executeGenerateDaySummary(
  params: Record<string, any>, 
  agent: any
): Promise<ToolExecutionResult> {
  
  try {
    const message = params.message;
    
    if (!message || typeof message !== 'string') {
      return {
        success: false,
        result: '',
        error: 'Message is required and must be a string'
      };
    }
    
    // Update agent's previous_day_summary (will be saved by caller)
    agent.previous_day_summary = message;
    
    // Clear thoughts for new day
    agent.system_thoughts = [];
    
    const result = `Day summary created: "${message}"`;
    console.log(`📊 Generated day summary: ${result}`);
    
    return {
      success: true,
      result
    };
    
  } catch (error: any) {
    return {
      success: false,
      result: '',
      error: `Day summary creation failed: ${error.message}`
    };
  }
}

// ============================================================================
// 🗄️ KV UPDATE FUNCTIONS  
// ============================================================================

async function updateAgentWithToolResult(
  env: any,
  agentKey: string,
  agent: any,
  toolCallResult: string
): Promise<void> {
  
  try {
    // Initialize tool_call_results if it doesn't exist
    if (!agent.tool_call_results) {
      agent.tool_call_results = [];
    }
    
    // Add tool call result to agent's tool_call_results array
    agent.tool_call_results.push(toolCallResult);
    
    // Keep only last 50 results
    if (agent.tool_call_results.length > 50) {
      agent.tool_call_results = agent.tool_call_results.slice(-50);
    }
    
    // Update lastActivity timestamp
    agent.lastActivity = new Date().toISOString();
    
    // Save updated agent to KV
    await env.SKAPP_AGENTS.put(agentKey, JSON.stringify(agent));
    
    console.log(`💾 Updated agent KV: ${agentKey} with tool result`);
    
  } catch (error: any) {
    console.error(`🚨 Failed to update agent KV:`, error?.message?.substring(0, 200));
    throw error;
  }
} 