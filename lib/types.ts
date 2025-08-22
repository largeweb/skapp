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

export interface Agent {
  id: string;
  name: string;
  description: string;
  status: 'awake' | 'sleep' | 'deep_sleep' | 'wakeup';
  lastActivity: string;
  createdAt: string;
  memoryStats: {
    pmem: number;
    note: number;
    thgt: number;
    work: number;
  };
}

export interface AgentsResponse {
  agents: Agent[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
} 