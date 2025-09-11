/**
 * SpawnKit Utilities - Centralized Logic
 * All commonly used functions across the application
 */

import type { AgentRecord, AgentMode } from './types';

// ============================================================================
// 🕐 TIMEZONE & MODE UTILITIES
// ============================================================================

/**
 * Convert UTC date to EST/EDT with proper DST handling
 */
export function convertToEST(utcDate: Date): Date {
  const isDST = isDaylightSavingTime(utcDate);
  const offset = isDST ? -4 : -5; // EDT vs EST
  return new Date(utcDate.getTime() + (offset * 60 * 60 * 1000));
}

/**
 * Check if date falls within Daylight Saving Time
 */
export function isDaylightSavingTime(date: Date): boolean {
  const year = date.getUTCFullYear();
  
  // Find 2nd Sunday in March
  const march = new Date(year, 2, 1);
  const dstStart = new Date(year, 2, 14 - march.getDay());
  
  // Find 1st Sunday in November  
  const november = new Date(year, 10, 1);
  const dstEnd = new Date(year, 10, 7 - november.getDay());
  
  return date >= dstStart && date < dstEnd;
}

/**
 * Get current agent mode based on EST time
 */
export function getCurrentAgentMode(date?: Date): AgentMode {
  const now = date || new Date();
  const estTime = convertToEST(now);
  const hour = estTime.getHours();
  return (hour >= 3 && hour < 5) ? 'sleep' : 'awake';
}

/**
 * Format time for display in EST
 */
export function formatESTTime(date?: Date): string {
  const estTime = convertToEST(date || new Date());
  return estTime.toLocaleTimeString('en-US', { 
    timeZone: 'America/New_York', 
    hour12: true, 
    hour: 'numeric', 
    minute: '2-digit' 
  });
}

/**
 * Get today's date in YYYY-MM-DD format for EST
 */
export function getESTDateString(date?: Date): string {
  const estTime = convertToEST(date || new Date());
  return estTime.toISOString().slice(0, 10);
}

// ============================================================================
// 📁 FILE HANDLING UTILITIES
// ============================================================================

/**
 * Escape CSV field value with proper quote handling
 */
export function escapeCSV(value: string): string {
  if (!value) return '';
  
  // If the value contains commas, quotes, or newlines, wrap it in quotes and escape internal quotes
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  
  return value;
}

/**
 * Trigger file download in browser
 */
export function downloadFile(content: string | Blob, filename: string, mimeType: string = 'text/plain'): void {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

/**
 * Generate filename with date suffix
 */
export function generateFilename(baseName: string, extension: string, date?: Date): string {
  const dateStr = (date || new Date()).toISOString().split('T')[0];
  const safeName = baseName.replace(/[^a-zA-Z0-9]/g, '_');
  return `${safeName}-export-${dateStr}.${extension}`;
}

// ============================================================================
// 🔧 API UTILITIES
// ============================================================================

/**
 * Standard API response wrapper with error handling
 */
export function createAPIResponse<T>(
  data: T, 
  options: { status?: number; headers?: Record<string, string> } = {}
): Response {
  return Response.json(data, {
    status: options.status || 200,
    headers: {
      'Cache-Control': 'no-store',
      ...options.headers
    }
  });
}

/**
 * Standard API error response
 */
export function createAPIError(
  message: string, 
  code?: string, 
  status: number = 500,
  details?: any
): Response {
  return Response.json({
    error: message,
    code,
    details
  }, { status });
}

/**
 * Fetch with timeout and error handling
 */
export async function fetchWithTimeout(
  url: string, 
  options: RequestInit & { timeout?: number } = {}
): Promise<Response> {
  const { timeout = 10000, ...fetchOptions } = options;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// ============================================================================
// 🧠 AGENT UTILITIES
// ============================================================================

/**
 * Check if agent should sleep (once per day enforcement)
 */
export function shouldAgentSleep(agent: AgentRecord, currentMode: AgentMode, todayDateString: string): boolean {
  if (currentMode !== 'sleep') return false;
  return agent.lastSlept !== todayDateString; // Only sleep if haven't slept today
}

/**
 * Get agent status color classes for UI
 */
export function getAgentStatusColors(status: AgentMode): { bg: string; text: string } {
  switch (status) {
    case 'awake': return { bg: 'bg-green-100 dark:bg-green-900/20', text: 'text-green-600 dark:text-green-400' };
    case 'sleep': return { bg: 'bg-blue-100 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400' };
    default: return { bg: 'bg-gray-100 dark:bg-gray-900/20', text: 'text-gray-600 dark:text-gray-400' };
  }
}

/**
 * Calculate note expiration display text
 */
export function formatNoteExpiration(expiresAt: string): string {
  const now = new Date();
  const expires = new Date(expiresAt);
  const diffMs = expires.getTime() - now.getTime();
  
  if (diffMs <= 0) return "expired";
  
  const diffDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
  return diffDays === 1 ? "expires in 1d" : `expires in ${diffDays}d`;
}

/**
 * Filter out expired notes from agent data
 */
export function filterActiveNotes(notes: any[]): any[] {
  if (!notes || !Array.isArray(notes)) return [];
  
  const now = new Date();
  return notes.filter(note => {
    if (typeof note === 'string') return true; // Legacy format, keep
    if (!note.expires_at) return true; // No expiration, keep
    
    const expires = new Date(note.expires_at);
    return expires > now; // Keep if not expired
  });
}

// ============================================================================
// 🎨 UI UTILITIES
// ============================================================================

/**
 * Standard loading spinner component props
 */
export function getLoadingSpinnerClasses(color: 'blue' | 'green' | 'red' = 'blue'): string {
  const colorMap = {
    blue: 'border-blue-600 dark:border-blue-400',
    green: 'border-green-600 dark:border-green-400', 
    red: 'border-red-600 dark:border-red-400'
  };
  
  return `animate-spin rounded-full h-6 w-6 border-b-2 ${colorMap[color]}`;
}

/**
 * Standard button classes with theme support
 */
export function getButtonClasses(
  variant: 'primary' | 'secondary' | 'danger' | 'success' = 'primary',
  size: 'sm' | 'md' | 'lg' = 'md'
): string {
  const baseClasses = 'font-medium rounded-lg transition-colors flex items-center justify-center';
  
  const sizeClasses = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2 text-sm', 
    lg: 'px-6 py-3 text-base'
  };
  
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white'
  };
  
  return `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]}`;
}

/**
 * Standard card/container classes with dark mode
 */
export function getCardClasses(elevated: boolean = false): string {
  const base = 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg';
  return elevated ? `${base} shadow-lg` : `${base} shadow-sm`;
}

// ============================================================================
// 🔍 CONTEXT FETCHING UTILITIES
// ============================================================================

/**
 * Fetch agent context for any mode with standardized error handling
 */
export async function fetchAgentContext(
  agentId: string, 
  mode: AgentMode | 'chat',
  chatHistory?: { role: 'user' | 'assistant'; content: string }[]
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const response = await fetchWithTimeout(`/api/agents/${agentId}/context`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode,
        chatHistory: mode === 'chat' ? chatHistory : undefined
      }),
      timeout: 15000
    });
    
    if (!response.ok) {
      return { 
        success: false, 
        error: `Failed to fetch context: ${response.status} ${response.statusText}` 
      };
    }
    
    const data = await response.json();
    return { success: true, data };
    
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Fetch agent data from KV with error handling
 */
export async function fetchAgent(agentId: string): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const response = await fetchWithTimeout(`/api/agents/${agentId}`, { timeout: 10000 });
    
    if (!response.ok) {
      return { 
        success: false, 
        error: `Failed to fetch agent: ${response.status} ${response.statusText}` 
      };
    }
    
    const data = await response.json();
    return { success: true, data };
    
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// ============================================================================
// 🎯 ORCHESTRATION UTILITIES
// ============================================================================

/**
 * Trigger orchestration for specific agent or all agents
 */
export async function orchestrateAgent(
  agentId?: string,
  mode?: AgentMode,
  estTime?: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const response = await fetchWithTimeout('/api/orchestrate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agentId,
        mode,
        estTime: estTime || new Date().toISOString()
      }),
      timeout: 30000
    });
    
    if (!response.ok) {
      return { 
        success: false, 
        error: `Orchestration failed: ${response.status} ${response.statusText}` 
      };
    }
    
    const data = await response.json();
    return { success: true, data };
    
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Orchestration timeout' 
    };
  }
}

// ============================================================================
// 📊 DATA FORMATTING UTILITIES
// ============================================================================

/**
 * Format agent memory stats for display
 */
export function formatMemoryStats(agent: AgentRecord): {
  pmem: number;
  notes: number;
  thoughts: number;
  tools: number;
  toolResults: number;
} {
  return {
    pmem: agent.system_permanent_memory?.length || 0,
    notes: filterActiveNotes(agent.system_notes || []).length,
    thoughts: agent.system_thoughts?.length || 0,
    tools: agent.system_tools?.length || 0,
    toolResults: agent.tool_call_results?.length || 0
  };
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Format timestamp for display
 */
export function formatTimestamp(timestamp: string, format: 'short' | 'long' = 'short'): string {
  const date = new Date(timestamp);
  
  if (format === 'short') {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  }
  
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short', 
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

// ============================================================================
// 🛡️ VALIDATION UTILITIES
// ============================================================================

/**
 * Validate agent ID format
 */
export function isValidAgentId(agentId: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(agentId) && agentId.length >= 3 && agentId.length <= 50;
}

/**
 * Sanitize agent ID for safe usage
 */
export function sanitizeAgentId(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .substring(0, 50);
}

// ============================================================================
// 🎨 THEME UTILITIES
// ============================================================================

/**
 * Get theme-aware text classes
 */
export function getTextClasses(variant: 'primary' | 'secondary' | 'muted' = 'primary'): string {
  const variants = {
    primary: 'text-gray-900 dark:text-gray-100',
    secondary: 'text-gray-600 dark:text-gray-400',
    muted: 'text-gray-500 dark:text-gray-500'
  };
  
  return variants[variant];
}

/**
 * Get theme-aware background classes for containers
 */
export function getContainerClasses(elevated: boolean = false): string {
  const base = 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700';
  return elevated ? `${base} shadow-lg` : `${base} shadow-sm`;
}

// ============================================================================
// 🔄 ASYNC UTILITIES
// ============================================================================

/**
 * Delay execution for specified milliseconds
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      const delayMs = baseDelayMs * Math.pow(2, attempt - 1) + Math.random() * 1000;
      await delay(delayMs);
    }
  }
  
  throw lastError!;
}

// ============================================================================
// 🧪 TESTING UTILITIES
// ============================================================================

/**
 * Get base URL for different environments
 */
export function getBaseURL(environment: 'localhost' | 'preview' | 'production' = 'production'): string {
  switch (environment) {
    case 'localhost': return 'http://localhost:3000';
    case 'preview': return 'https://preview.spawnkit.pro';
    case 'production': return 'https://spawnkit.pro';
    default: return 'https://spawnkit.pro';
  }
}

/**
 * Parse command line environment flag
 */
export function parseEnvironmentFlag(args: string[]): 'localhost' | 'preview' | 'production' {
  const envFlag = args.find(arg => arg.startsWith('--env='));
  if (!envFlag) return 'production';
  
  const env = envFlag.split('=')[1];
  if (env === 'local' || env === 'localhost') return 'localhost';
  if (env === 'preview') return 'preview';
  return 'production';
} 