/**
 * SpawnKit XML Tool Parser
 * Parses <sktool> XML format and extracts tool calls with parameters
 */

import type { ParsedToolCall } from './types';

// ============================================================================
// 🔧 XML PARSING FUNCTIONS
// ============================================================================

/**
 * Parse all <sktool> blocks from agent response
 */
export function parseToolCalls(content: string): ParsedToolCall[] {
  const toolCalls: ParsedToolCall[] = [];
  
  // Find all <sktool>...</sktool> blocks
  const sktoolRegex = /<sktool>([\s\S]*?)<\/sktool>/g;
  let match;
  
  while ((match = sktoolRegex.exec(content)) !== null) {
    const toolXml = match[1];
    const parsedTool = parseIndividualTool(toolXml, match[0]);
    
    if (parsedTool) {
      toolCalls.push(parsedTool);
    }
  }
  
  console.log(`🔧 Parsed ${toolCalls.length} tool calls from response`);
  return toolCalls;
}

/**
 * Parse individual tool XML content
 */
function parseIndividualTool(toolXml: string, rawXml: string): ParsedToolCall | null {
  try {
    // Extract tool name (first XML tag)
    const toolNameMatch = toolXml.match(/<([^>]+)>/);
    if (!toolNameMatch) {
      console.warn('❌ Could not extract tool name from XML');
      return null;
    }
    
    const toolId = toolNameMatch[1];
    
    // Extract all parameters
    const params: Record<string, any> = {};
    
    // Extract message parameter
    const messageMatch = toolXml.match(/<message>([\s\S]*?)<\/message>/);
    if (messageMatch) {
      params.message = messageMatch[1].trim();
      console.log(`🔧 Extracted message: ${params.message.substring(0, 50)}...`);
    }
    
    // Extract expirationDays parameter
    const expirationMatch = toolXml.match(/<expirationDays>([\s\S]*?)<\/expirationDays>/);
    if (expirationMatch) {
      params.expirationDays = convertParameterValue('expirationDays', expirationMatch[1].trim());
      console.log(`🔧 Extracted expirationDays: ${params.expirationDays}`);
    }
    
    // Extract any other common parameters
    const otherParams = ['query', 'channel', 'phone', 'to', 'subject', 'filename', 'content'];
    for (const paramName of otherParams) {
      const paramMatch = toolXml.match(new RegExp(`<${paramName}>([\\s\\S]*?)<\\/${paramName}>`, 'g'));
      if (paramMatch) {
        params[paramName] = paramMatch[1].trim();
        console.log(`🔧 Extracted ${paramName}: ${params[paramName]}`);
      }
    }
    
    console.log(`🔧 Parsed tool: ${toolId} with params:`, JSON.stringify(params).substring(0, 100));
    
    return {
      toolId,
      params,
      rawXml
    };
    
  } catch (error) {
    console.error('❌ Failed to parse tool XML:', error);
    return null;
  }
}

/**
 * Convert parameter values to appropriate types
 */
function convertParameterValue(paramName: string, paramValue: string): any {
  // Handle specific parameter types
  if (paramName === 'expirationDays') {
    const num = parseInt(paramValue, 10);
    return isNaN(num) ? 7 : Math.max(1, Math.min(14, num)); // Clamp to 1-14 range
  }
  
  // Handle boolean parameters
  if (paramValue.toLowerCase() === 'true') return true;
  if (paramValue.toLowerCase() === 'false') return false;
  
  // Handle numeric parameters
  const numValue = Number(paramValue);
  if (!isNaN(numValue) && isFinite(numValue)) {
    return numValue;
  }
  
  // Default to string, trim whitespace
  return paramValue.trim();
}

/**
 * Validate tool call against available tools
 */
export function validateToolCall(toolCall: ParsedToolCall, availableToolIds: string[]): {
  valid: boolean;
  error?: string;
} {
  // Check if tool is available
  if (!availableToolIds.includes(toolCall.toolId)) {
    return {
      valid: false,
      error: `Tool '${toolCall.toolId}' is not available for this agent`
    };
  }
  
  // Validate required parameters based on tool
  switch (toolCall.toolId) {
    case 'generate_system_note':
      if (!toolCall.params.message) {
        return { valid: false, error: 'generate_system_note requires message parameter' };
      }
      break;
      
    case 'generate_system_thought':
      if (!toolCall.params.message) {
        return { valid: false, error: 'generate_system_thought requires message parameter' };
      }
      break;
      
    case 'generate_turn_prompt_enhancement':
      if (!toolCall.params.message) {
        return { valid: false, error: 'generate_turn_prompt_enhancement requires message parameter' };
      }
      break;
      
    case 'generate_day_summary_from_conversation':
      if (!toolCall.params.message) {
        return { valid: false, error: 'generate_day_summary_from_conversation requires message parameter' };
      }
      break;
  }
  
  return { valid: true };
}

/**
 * Execute tool calls via process-tool API
 */
export async function executeToolCalls(
  toolCalls: ParsedToolCall[],
  agentId: string,
  origin: string
): Promise<string[]> {
  const results: string[] = [];
  
  if (toolCalls.length === 0) {
    console.log('📝 No tool calls to execute');
    return results;
  }
  
  console.log(`🛠️ Executing ${toolCalls.length} tool calls for agent: ${agentId}`);
  
  // Execute all tool calls in parallel with 10s timeout
  const toolPromises = toolCalls.map(async (toolCall, index) => {
    try {
      console.log(`🔧 Executing tool ${index + 1}/${toolCalls.length}: ${toolCall.toolId}`);
      
      const response = await fetch(`${origin}/api/process-tool`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'SpawnKit-Generate/1.0'
        },
        body: JSON.stringify({
          toolId: toolCall.toolId,
          params: toolCall.params,
          agentId: agentId
        }),
        signal: AbortSignal.timeout(10000) // 10s timeout per tool
      });
      
      if (response.ok) {
        const result = await response.json() as any;
        console.log(`✅ Tool ${toolCall.toolId} executed successfully`);
        return result.result || 'Tool executed successfully';
      } else {
        const error = await response.json() as any;
        console.error(`❌ Tool ${toolCall.toolId} failed: ${error.error}`);
        return `Error: ${error.error}`;
      }
      
    } catch (error: any) {
      console.error(`💥 Tool ${toolCall.toolId} execution failed:`, error?.message);
      return `Error: ${error?.message || 'Tool execution failed'}`;
    }
  });
  
  // Wait for all tools to complete (or timeout)
  const toolResults = await Promise.all(toolPromises);
  
  console.log(`✅ Tool execution complete: ${toolResults.length} results`);
  return toolResults;
} 