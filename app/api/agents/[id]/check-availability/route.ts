export const runtime = 'edge'

import { getRequestContext } from '@cloudflare/next-on-pages'
import { z } from 'zod'

const CheckAvailabilitySchema = z.object({
  id: z.string().min(1).max(100)
})

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { env } = getRequestContext()
    const { id } = await params
    
    // Validate the ID parameter
    const validated = CheckAvailabilitySchema.safeParse({ id: id })
    if (!validated.success) {
      return Response.json({ error: 'Invalid agent ID' }, { status: 400 })
    }

    const agentId = validated.data.id
    
    // Check if agent exists in KV
    const existingAgent = await env.SKAPP_AGENTS.get(`agent:${agentId}`)
    
    return Response.json({ 
      exists: !!existingAgent,
      available: !existingAgent
    })
    
  } catch (error) {
    console.error('🚨 Check availability error:', error)
    return Response.json({ error: 'Failed to check availability' }, { status: 500 })
  }
}
