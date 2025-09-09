export const runtime = 'edge'

import { getRequestContext } from '@cloudflare/next-on-pages'
import { z } from 'zod'

// Input validation schema for SERP API requests
const SerpRequestSchema = z.object({
  query: z.string().min(1).max(500),
  location: z.string().optional().default('Austin, Texas, United States'),
  num: z.number().int().min(1).max(100).optional().default(10),
  start: z.number().int().min(0).optional().default(0),
  safe: z.enum(['active', 'off']).optional().default('active'),
  filter: z.enum(['0', '1']).optional().default('0')
})

export async function POST(request: Request) {
  console.log('🔍 SERP API endpoint hit - processing search request')
  
  try {
    const { env } = getRequestContext()
    
    // Parse and validate request body
    const body = await request.json()
    const validated = SerpRequestSchema.parse(body)
    
    console.log(`🔎 Searching for: "${validated.query}" in location: "${validated.location}"`)
    
    // Get API key from environment
    const apiKey = env.SERP_API_KEY
    
    if (!apiKey) {
      console.error('❌ SERP_API_KEY not configured in environment')
      return Response.json(
        { 
          error: 'SERP_API_KEY not configured in environment',
          code: 'MISSING_API_KEY'
        }, 
        { status: 500 }
      )
    }
    
    // Build SerpAPI request parameters
    const searchParams = new URLSearchParams({
      q: validated.query,
      location: validated.location,
      hl: 'en',
      gl: 'us',
      google_domain: 'google.com',
      num: validated.num.toString(),
      start: validated.start.toString(),
      safe: validated.safe,
      filter: validated.filter,
      api_key: apiKey
    })
    
    console.log(`🌐 Making SERP API request with ${searchParams.toString().length} characters`)
    
    // Call SerpAPI with timeout
    const serpResponse = await fetch(`https://serpapi.com/search.json?${searchParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SpawnKit-SERP/1.0'
      },
      signal: AbortSignal.timeout(30000) // 30 second timeout
    })
    
    if (!serpResponse.ok) {
      const errorText = await serpResponse.text().catch(() => 'Unknown error')
      console.error(`❌ SERP API error: ${serpResponse.status} ${serpResponse.statusText} - ${errorText}`)
      
      return Response.json(
        { 
          error: 'SERP API request failed',
          status: serpResponse.status,
          statusText: serpResponse.statusText,
          details: errorText.substring(0, 200)
        }, 
        { status: 500 }
      )
    }
    
    const serpData: any = await serpResponse.json()
    console.log('✅ SERP API success - search results retrieved!')
    
    // Extract and structure the response
    const structuredResponse = {
      success: true,
      query: validated.query,
      location: validated.location,
      searchMetadata: {
        status: serpData.search_metadata?.status || 'unknown',
        created_at: serpData.search_metadata?.created_at,
        processed_at: serpData.search_metadata?.processed_at,
        total_time_taken: serpData.search_metadata?.total_time_taken
      },
      searchParameters: {
        num: validated.num,
        start: validated.start,
        safe: validated.safe,
        filter: validated.filter
      },
      results: {
        organic_results: serpData.organic_results || [],
        related_questions: serpData.related_questions || [],
        related_searches: serpData.related_searches || [],
        knowledge_graph: serpData.knowledge_graph || null,
        answer_box: serpData.answer_box || null
      },
      pagination: {
        has_next: serpData.search_metadata?.has_next || false,
        next_page_token: serpData.search_metadata?.next_page_token || null
      },
      timestamp: new Date().toISOString()
    }
    
    return Response.json(structuredResponse, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Content-Type': 'application/json'
      }
    })
    
  } catch (error) {
    console.error('💥 SERP API error:', error instanceof Error ? error.message : String(error))
    
    if (error instanceof z.ZodError) {
      return Response.json(
        { 
          error: 'Invalid request format',
          code: 'VALIDATION_ERROR',
          details: error.issues 
        }, 
        { status: 400 }
      )
    }
    
    if (error instanceof Error && error.name === 'TimeoutError') {
      return Response.json(
        { 
          error: 'Request timeout - SERP API took too long to respond',
          code: 'TIMEOUT_ERROR'
        }, 
        { status: 408 }
      )
    }
    
    return Response.json(
      { 
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}

export async function GET() {
  return Response.json({
    message: 'SERP API endpoint is ready!',
    description: 'Search Engine Results Page API for web search functionality',
    usage: {
      method: 'POST',
      endpoint: '/api/serp',
      body: {
        query: 'string (required) - Search query',
        location: 'string (optional) - Location for localized results',
        num: 'number (optional) - Number of results (1-100, default: 10)',
        start: 'number (optional) - Starting position (default: 0)',
        safe: 'string (optional) - Safe search: "active" or "off" (default: "active")',
        filter: 'string (optional) - Filter duplicates: "0" or "1" (default: "0")'
      }
    },
    example: {
      method: 'POST',
      body: {
        query: 'latest AI news',
        location: 'San Francisco, CA',
        num: 5,
        safe: 'active'
      }
    },
    features: [
      'Web search with Google SERP',
      'Localized results',
      'Safe search filtering',
      'Duplicate filtering',
      'Structured response format',
      'Error handling and validation',
      'Request timeout protection'
    ]
  }, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600'
    }
  })
}
