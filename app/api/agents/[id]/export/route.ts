import { NextRequest } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { env } = getRequestContext()
    const { id } = await params
    
    // Get agent data
    const agentData = await env.SKAPP_AGENTS?.get(`agent:${id}`)
    if (!agentData) {
      return Response.json({ 
        error: 'Agent not found',
        code: 'AGENT_NOT_FOUND'
      }, { status: 404 })
    }
    
    const agent = JSON.parse(agentData)
    
    // Get memory data for each layer
    const pmemData = await env.SKAPP_AGENTS?.get(`memory:${id}:pmem`) || '[]'
    const noteData = await env.SKAPP_AGENTS?.get(`memory:${id}:note`) || '[]'
    const thgtData = await env.SKAPP_AGENTS?.get(`memory:${id}:thgt`) || '[]'
    const workData = await env.SKAPP_AGENTS?.get(`memory:${id}:work`) || '[]'
    
    const pmem = JSON.parse(pmemData)
    const notes = JSON.parse(noteData)
    const thoughts = JSON.parse(thgtData)
    const work = JSON.parse(workData)
    
    // Create Excel-like CSV structure
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `${agent.name || agent.agentId}-export-${timestamp}.csv`
    
    // Build CSV content with multiple sheets
    let csvContent = ''
    
    // Sheet 1: Agent Context
    csvContent += '=== AGENT CONTEXT ===\n'
    csvContent += 'Agent ID,Value\n'
    csvContent += `ID,${agent.agentId}\n`
    csvContent += `Name,${agent.name}\n`
    csvContent += `Description,${agent.description || ''}\n`
    csvContent += `Current Mode,${agent.currentMode}\n`
    csvContent += `Last Activity,${agent.lastActivity}\n`
    csvContent += `Created At,${agent.createdAt}\n`
    csvContent += `Updated At,${agent.updatedAt}\n`
    csvContent += `Goals,${agent.pmem?.goals || ''}\n`
    csvContent += `Notes,${agent.notes || ''}\n`
    csvContent += `Thoughts,${agent.thoughts || ''}\n`
    csvContent += '\n'
    
    // Available Tools
    csvContent += 'Available Tools\n'
    csvContent += 'Tool,Enabled\n'
    Object.entries(agent.availableTools || {}).forEach(([tool, enabled]) => {
      csvContent += `${tool},${enabled ? 'Yes' : 'No'}\n`
    })
    csvContent += '\n'
    
    // Core Knowledge
    csvContent += 'Core Knowledge\n'
    csvContent += 'Knowledge Item\n'
    agent.pmem?.permanent_knowledge?.forEach((knowledge: string) => {
      csvContent += `${knowledge}\n`
    })
    csvContent += '\n'
    
    // System Prompt
    csvContent += 'System Prompt\n'
    csvContent += 'Content\n'
    const systemPrompt = `You are ${agent.name}, ${agent.description || ''}.

Goals:
${agent.pmem?.goals || ''}

Core Knowledge:
${agent.pmem?.permanent_knowledge?.map((k: string) => `• ${k}`).join('\n') || ''}

Static Attributes:
${agent.pmem?.static_attributes?.map((attr: string) => `• ${attr}`).join('\n') || ''}

Permanent Tools:
${agent.pmem?.tools?.map((tool: string) => `• ${tool}`).join('\n') || ''}

Available Tools: ${Object.entries(agent.availableTools || {})
  .filter(([_, enabled]) => enabled)
  .map(([tool, _]) => tool)
  .join(', ')}`
    csvContent += `${systemPrompt}\n`
    csvContent += '\n\n'
    
    // Sheet 2: PMEM (Permanent Memory)
    csvContent += '=== PMEM (PERMANENT MEMORY) ===\n'
    csvContent += 'Content,Source,Created At,Updated At\n'
    if (Array.isArray(pmem)) {
      pmem.forEach((item: any) => {
        const content = (item.content || item).replace(/"/g, '""')
        csvContent += `"${content}","${item.source || 'core'}","${item.createdAt || ''}","${item.updatedAt || ''}"\n`
      })
    }
    csvContent += '\n\n'
    
    // Sheet 3: NOTE (7-day persistence)
    csvContent += '=== NOTE (7-DAY PERSISTENCE) ===\n'
    csvContent += 'Content,Source,Created At,Expires At,Tags\n'
    if (Array.isArray(notes)) {
      notes.forEach((note: any) => {
        const content = (note.content || note).replace(/"/g, '""')
        const expiresAt = note.expiresAt ? new Date(note.expiresAt).toISOString() : ''
        const tags = Array.isArray(note.tags) ? note.tags.join(';') : ''
        csvContent += `"${content}","${note.source || 'manual'}","${note.createdAt || note.timestamp || ''}","${expiresAt}","${tags}"\n`
      })
    }
    csvContent += '\n\n'
    
    // Sheet 4: THGT (Today only)
    csvContent += '=== THGT (TODAY ONLY) ===\n'
    csvContent += 'Content,Context,Priority,Created At,Expires At\n'
    if (Array.isArray(thoughts)) {
      thoughts.forEach((thought: any) => {
        const content = (thought.content || thought).replace(/"/g, '""')
        const expiresAt = thought.expiresAt ? new Date(thought.expiresAt).toISOString() : ''
        csvContent += `"${content}","${thought.context || 'general'}","${thought.priority || 'normal'}","${thought.createdAt || thought.timestamp || ''}","${expiresAt}"\n`
      })
    }
    csvContent += '\n\n'
    
    // Sheet 5: WORK (Current turn)
    csvContent += '=== WORK (CURRENT TURN) ===\n'
    csvContent += 'Tool,Action,Detail,Result,Success,Duration,Created At,Parameters\n'
    if (Array.isArray(work)) {
      work.forEach((item: any) => {
        const result = (item.result || item.response || '').replace(/"/g, '""')
        const parameters = JSON.stringify(item.parameters || {}).replace(/"/g, '""')
        csvContent += `"${item.tool || 'unknown'}","${item.action || ''}","${(item.detail || '').replace(/"/g, '""')}","${result}","${item.success !== false ? 'Yes' : 'No'}","${item.duration || ''}","${item.createdAt || item.timestamp || ''}","${parameters}"\n`
      })
    }
    csvContent += '\n\n'
    
    // Sheet 6: Conversation History (if available)
    csvContent += '=== CONVERSATION HISTORY ===\n'
    csvContent += 'Role,Content,Timestamp\n'
    
    // Get conversation history from memory or create placeholder
    const conversationHistory = agent.conversationHistory || []
    if (Array.isArray(conversationHistory)) {
      conversationHistory.forEach((msg: any) => {
        const role = msg.role || 'unknown'
        const content = (msg.content || '').replace(/"/g, '""')
        const timestamp = msg.timestamp || ''
        csvContent += `"${role}","${content}","${timestamp}"\n`
      })
    } else {
      csvContent += '"system","No conversation history available",""\n'
    }
    csvContent += '\n\n'
    
    // Sheet 7: Activity Timeline
    csvContent += '=== ACTIVITY TIMELINE ===\n'
    csvContent += 'Timestamp,Mode,Type,Action,Detail,Full Response\n'
    
    // Combine all activities in chronological order
    const allActivities: Array<{
      timestamp: string
      mode: string
      type: string
      action: string
      detail: string
      fullResponse: string
    }> = []
    
    // Add mode changes
    if (agent.lastActivity && agent.lastActivity !== 'Just created') {
      allActivities.push({
        timestamp: agent.lastActivity,
        mode: agent.currentMode,
        type: 'mode_change',
        action: `Entered ${agent.currentMode} Mode`,
        detail: agent.currentMode === 'awake' ? 'Processing tasks' : 'Resting and planning',
        fullResponse: ''
      })
    }
    
    // Add notes
    if (Array.isArray(notes)) {
      notes.forEach((note: any) => {
        allActivities.push({
          timestamp: note.createdAt || note.timestamp || '',
          mode: agent.currentMode,
          type: 'note',
          action: 'Take Note',
          detail: note.content?.substring(0, 100) || '',
          fullResponse: note.content || ''
        })
      })
    }
    
    // Add thoughts
    if (Array.isArray(thoughts)) {
      thoughts.forEach((thought: any) => {
        allActivities.push({
          timestamp: thought.createdAt || thought.timestamp || '',
          mode: agent.currentMode,
          type: 'thought',
          action: 'Take Thought',
          detail: thought.content?.substring(0, 100) || '',
          fullResponse: thought.content || ''
        })
      })
    }
    
    // Add work items
    if (Array.isArray(work)) {
      work.forEach((item: any) => {
        allActivities.push({
          timestamp: item.createdAt || item.timestamp || '',
          mode: agent.currentMode,
          type: 'tool_usage',
          action: item.tool || 'Unknown Tool',
          detail: item.detail || '',
          fullResponse: item.result || item.response || ''
        })
      })
    }
    
    // Sort by timestamp and add to CSV
    allActivities
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .forEach(activity => {
        const detail = activity.detail.replace(/"/g, '""')
        const fullResponse = activity.fullResponse.replace(/"/g, '""')
        csvContent += `"${activity.timestamp}","${activity.mode}","${activity.type}","${activity.action}","${detail}","${fullResponse}"\n`
      })
    
    // Create response with CSV content
    const response = new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store'
      }
    })
    
    return response
    
  } catch (error) {
    console.error('🚨 Agent export API error:', error instanceof Error ? error.message : 'Unknown error')
    
    return Response.json({ 
      error: 'Failed to export agent data',
      code: 'AGENT_EXPORT_FAILED'
    }, { status: 500 })
  }
}
