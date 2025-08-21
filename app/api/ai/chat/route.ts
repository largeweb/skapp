export const runtime = 'edge';

import { createGroqClient, DEFAULT_CHAT_OPTIONS } from '@/lib/groq';
import { ChatRequest, ChatResponse } from '@/lib/types';
import { z } from 'zod';

const ChatRequestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['system', 'user', 'assistant']),
    content: z.string().min(1).max(10000)
  })).min(1).max(50),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(1).max(4096).optional(),
  reasoningEffort: z.enum(['low', 'medium', 'high']).optional(),
});

export async function POST(request: Request): Promise<Response> {
  try {
    // Parse and validate request
    const body = await request.json();
    const validated = ChatRequestSchema.parse(body);
    
    // Create Groq client
    const groq = createGroqClient();
    
    // Prepare options
    const options = {
      model: DEFAULT_CHAT_OPTIONS.model!,
      messages: validated.messages,
      temperature: validated.temperature ?? DEFAULT_CHAT_OPTIONS.temperature,
      max_completion_tokens: validated.maxTokens ?? DEFAULT_CHAT_OPTIONS.maxTokens,
      reasoning_effort: validated.reasoningEffort ?? DEFAULT_CHAT_OPTIONS.reasoningEffort,
      stream: false as const,
    };

    console.log(`🤖 Groq Chat Request: ${validated.messages.length} messages, model: ${options.model}, reasoning: ${options.reasoning_effort}`);

    // Call Groq API
    const completion = await groq.chat.completions.create(options);
    
    const response: ChatResponse = {
      success: true,
      message: completion.choices[0]?.message?.content || '',
      usage: {
        promptTokens: completion.usage?.prompt_tokens || 0,
        completionTokens: completion.usage?.completion_tokens || 0,
        totalTokens: completion.usage?.total_tokens || 0,
      }
    };

    console.log(`✅ Groq Chat Success: ${response.usage?.totalTokens} tokens used`);

    return Response.json(response, {
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type': 'application/json'
      }
    });

  } catch (error: any) {
    console.error('🚨 Groq Chat Error:', error?.message?.substring(0, 200));
    
    if (error instanceof z.ZodError) {
      return Response.json({ 
        success: false,
        error: 'Invalid request format', 
        details: error.errors 
      }, { status: 400 });
    }
    
    if (error?.message?.includes('API key')) {
      return Response.json({ 
        success: false,
        error: 'API configuration error',
        code: 'GROQ_API_KEY_MISSING'
      }, { status: 500 });
    }
    
    if (error?.message?.includes('rate limit')) {
      return Response.json({ 
        success: false,
        error: 'Rate limit exceeded',
        code: 'GROQ_RATE_LIMIT'
      }, { status: 429 });
    }
    
    return Response.json({ 
      success: false,
      error: 'AI generation failed',
      code: 'GROQ_GENERATION_ERROR'
    }, { status: 500 });
  }
} 