import { Groq } from 'groq-sdk';
import { getRequestContext } from '@cloudflare/next-on-pages';

export function createGroqClient() {
  const { env } = getRequestContext();
  
  if (!env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY environment variable is required');
  }

  return new Groq({
    apiKey: env.GROQ_API_KEY,
  });
}

export const DEFAULT_MODEL = 'openai/gpt-oss-120b';
export const REASONING_LEVELS = ['low', 'medium', 'high'] as const;
export type ReasoningLevel = typeof REASONING_LEVELS[number];

export interface GroqChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  reasoningEffort?: ReasoningLevel;
  stream?: boolean;
}

export const DEFAULT_CHAT_OPTIONS: GroqChatOptions = {
  model: DEFAULT_MODEL,
  temperature: 0.7,
  maxTokens: 2048,
  reasoningEffort: 'medium',
  stream: false,
}; 