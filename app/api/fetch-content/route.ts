export const runtime = 'edge'

import { z } from 'zod'

// Input validation schema for content fetching requests
const FetchContentSchema = z.object({
  url: z.string().url('Invalid URL format'),
  extractMode: z.enum(['text', 'html', 'both']).optional().default('text'),
  maxLength: z.number().int().min(100).max(50000).optional().default(10000),
  includeMetadata: z.boolean().optional().default(true),
  timeout: z.number().int().min(5000).max(30000).optional().default(15000)
})

export async function POST(request: Request) {
  console.log('🌐 Website content fetcher activated - extracting digital wisdom!')
  
  try {
    // Parse and validate request body
    const body = await request.json()
    const validated = FetchContentSchema.parse(body)
    
    console.log(`📄 Fetching content from: ${validated.url}`)
    
    // Fetch the website content with timeout
    const response = await fetch(validated.url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SpawnKit/1.0; +https://spawnkit.ai)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache',
      },
      signal: AbortSignal.timeout(validated.timeout)
    })
    
    if (!response.ok) {
      console.log(`❌ Website fetch error: ${response.status} ${response.statusText}`)
      return Response.json(
        { 
          error: 'Failed to fetch website',
          code: 'FETCH_FAILED',
          status: response.status,
          statusText: response.statusText,
          url: validated.url
        },
        { status: 500 }
      )
    }
    
    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('text/html')) {
      return Response.json(
        { 
          error: 'URL does not contain HTML content',
          code: 'INVALID_CONTENT_TYPE',
          contentType: contentType
        },
        { status: 400 }
      )
    }
    
    const html = await response.text()
    
    // Extract text content from HTML
    const extractedContent = extractContentFromHTML(html, validated.extractMode, validated.maxLength)
    
    // Extract metadata if requested
    const metadata = validated.includeMetadata ? extractMetadataFromHTML(html, validated.url) : null
    
    console.log(`📊 Extracted ${extractedContent.text.length} characters from ${new URL(validated.url).hostname}`)
    
    const responseData: any = {
      success: true,
      url: validated.url,
      hostname: new URL(validated.url).hostname,
      contentLength: extractedContent.text.length,
      extractMode: validated.extractMode,
      timestamp: new Date().toISOString()
    }
    
    // Add content based on mode
    if (validated.extractMode === 'text' || validated.extractMode === 'both') {
      responseData.textContent = extractedContent.text
      responseData.firstChars = extractedContent.text.substring(0, 500)
      responseData.lastChars = extractedContent.text.substring(Math.max(0, extractedContent.text.length - 500))
    }
    
    if (validated.extractMode === 'html' || validated.extractMode === 'both') {
      responseData.htmlContent = extractedContent.html
    }
    
    if (metadata) {
      responseData.metadata = metadata
    }
    
    return Response.json(responseData, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Content-Type': 'application/json'
      }
    })
    
  } catch (error) {
    console.error('💥 Website content extraction error:', error)
    
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
          error: 'Request timeout - website took too long to respond',
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

function extractContentFromHTML(html: string, mode: string, maxLength: number) {
  let text = ''
  let cleanHtml = ''
  
  if (mode === 'text' || mode === 'both') {
    // Remove script and style content completely
    text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')
      .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')
      .replace(/<object[^>]*>[\s\S]*?<\/object>/gi, '')
      .replace(/<embed[^>]*>[\s\S]*?<\/embed>/gi, '')
    
    // Remove HTML tags
    text = text.replace(/<[^>]*>/g, ' ')
    
    // Decode common HTML entities
    text = text
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&mdash;/g, '—')
      .replace(/&ndash;/g, '–')
      .replace(/&hellip;/g, '...')
    
    // Clean up whitespace
    text = text
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim()
    
    // Truncate if exceeds max length
    if (text.length > maxLength) {
      text = text.substring(0, maxLength) + '... [truncated]'
    }
  }
  
  if (mode === 'html' || mode === 'both') {
    // Clean HTML for storage (remove scripts, styles, etc.)
    cleanHtml = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')
      .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')
      .replace(/<object[^>]*>[\s\S]*?<\/object>/gi, '')
      .replace(/<embed[^>]*>[\s\S]*?<\/embed>/gi, '')
      .trim()
    
    // Truncate if exceeds max length
    if (cleanHtml.length > maxLength) {
      cleanHtml = cleanHtml.substring(0, maxLength) + '... [truncated]'
    }
  }
  
  return { text, html: cleanHtml }
}

function extractMetadataFromHTML(html: string, url: string) {
  const metadata: any = {
    title: '',
    description: '',
    keywords: '',
    author: '',
    language: '',
    robots: '',
    ogTags: {},
    twitterTags: {}
  }
  
  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i)
  if (titleMatch) {
    metadata.title = titleMatch[1].trim()
  }
  
  // Extract meta tags
  const metaTags = html.match(/<meta[^>]+>/gi) || []
  metaTags.forEach(tag => {
    const nameMatch = tag.match(/name=["']([^"']+)["']/i)
    const contentMatch = tag.match(/content=["']([^"']+)["']/i)
    const propertyMatch = tag.match(/property=["']([^"']+)["']/i)
    
    if (nameMatch && contentMatch) {
      const name = nameMatch[1].toLowerCase()
      const content = contentMatch[1]
      
      switch (name) {
        case 'description':
          metadata.description = content
          break
        case 'keywords':
          metadata.keywords = content
          break
        case 'author':
          metadata.author = content
          break
        case 'robots':
          metadata.robots = content
          break
      }
    }
    
    // Extract Open Graph tags
    if (propertyMatch && contentMatch) {
      const property = propertyMatch[1]
      if (property.startsWith('og:')) {
        metadata.ogTags[property] = contentMatch[1]
      }
    }
  })
  
  // Extract language
  const langMatch = html.match(/<html[^>]*lang=["']([^"']+)["']/i)
  if (langMatch) {
    metadata.language = langMatch[1]
  }
  
  return metadata
}

export async function GET() {
  return Response.json({
    message: 'Website content fetcher endpoint is ready!',
    description: 'Extract text content and metadata from websites',
    usage: {
      method: 'POST',
      endpoint: '/api/fetch-content',
      body: {
        url: 'string (required) - Website URL to fetch',
        extractMode: 'string (optional) - "text", "html", or "both" (default: "text")',
        maxLength: 'number (optional) - Maximum content length (100-50000, default: 10000)',
        includeMetadata: 'boolean (optional) - Include metadata extraction (default: true)',
        timeout: 'number (optional) - Request timeout in ms (5000-30000, default: 15000)'
      }
    },
    example: {
      method: 'POST',
      body: {
        url: 'https://example.com',
        extractMode: 'both',
        maxLength: 5000,
        includeMetadata: true,
        timeout: 10000
      }
    },
    features: [
      'Text content extraction from HTML',
      'HTML content cleaning and storage',
      'Metadata extraction (title, description, keywords, etc.)',
      'Open Graph and Twitter tag parsing',
      'Content length limiting',
      'Request timeout protection',
      'Response caching',
      'Comprehensive error handling'
    ]
  }, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600'
    }
  })
}
