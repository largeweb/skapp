export const runtime = 'edge';

import { createGroqClient, DEFAULT_CHAT_OPTIONS } from '@/lib/groq';
import { ChatRequest, StreamChunk } from '@/lib/types';
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
    
    // Prepare options for streaming
    const options = {
      model: DEFAULT_CHAT_OPTIONS.model!,
      messages: validated.messages,
      temperature: validated.temperature ?? DEFAULT_CHAT_OPTIONS.temperature,
      max_completion_tokens: validated.maxTokens ?? DEFAULT_CHAT_OPTIONS.maxTokens,
      reasoning_effort: validated.reasoningEffort ?? DEFAULT_CHAT_OPTIONS.reasoningEffort,
      stream: true as const,
    };

    console.log(`🌊 Groq Stream Request: ${validated.messages.length} messages, model: ${options.model}, reasoning: ${options.reasoning_effort}`);

    // Call Groq API for streaming
    const stream = await groq.chat.completions.create(options);
    
    // Create a readable stream to send chunks to client
    const readableStream = new ReadableStream({
      async start(controller) {
        let fullContent = '';
        let chunkCount = 0;
        
        try {
          for await (const chunk of stream) {
            chunkCount++;
            const content = chunk.choices[0]?.delta?.content || '';
            fullContent += content;
            
            const streamChunk: StreamChunk = {
              content,
              done: false,
            };
            
            // Send chunk to client
            controller.enqueue(`data: ${JSON.stringify(streamChunk)}\n\n`);
            
            // Optional: Add small delay to make streaming visible
            if (content) {
              await new Promise(resolve => setTimeout(resolve, 50));
            }
          }
          
          // Send final chunk with usage info
          const finalChunk: StreamChunk = {
            content: '',
            done: true,
            usage: {
              promptTokens: 0, // Groq streaming doesn't provide token counts
              completionTokens: 0,
              totalTokens: 0,
            }
          };
          
          controller.enqueue(`data: ${JSON.stringify(finalChunk)}\n\n`);
          console.log(`✅ Groq Stream Success: ${chunkCount} chunks, ${fullContent.length} chars total`);
          
        } catch (error: any) {
          console.error('🚨 Groq Stream Error:', error?.message?.substring(0, 200));
          
          const errorChunk = {
            content: '',
            done: true,
            error: 'Stream processing failed'
          };
          
          controller.enqueue(`data: ${JSON.stringify(errorChunk)}\n\n`);
        } finally {
          controller.close();
        }
      }
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    });

  } catch (error: any) {
    console.error('🚨 Groq Stream Setup Error:', error?.message?.substring(0, 200));
    
    if (error instanceof z.ZodError) {
      return Response.json({ 
        success: false,
        error: 'Invalid request format', 
        details: error.issues 
      }, { status: 400 });
    }
    
    if (error?.message?.includes('API key')) {
      return Response.json({ 
        success: false,
        error: 'API configuration error',
        code: 'GROQ_API_KEY_MISSING'
      }, { status: 500 });
    }
    
    return Response.json({ 
      success: false,
      error: 'Stream setup failed',
      code: 'GROQ_STREAM_ERROR'
    }, { status: 500 });
  }
} 