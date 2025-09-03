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
    
    // Get memory data from agent object
    const pmem = agent.system_permanent_memory || []
    const notes = agent.system_notes || []
    const thoughts = agent.system_thoughts || []
    const tools = agent.system_tools || []
    
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
    csvContent += `Goals,${agent.system_permanent_memory?.join('; ') || ''}\n`
    csvContent += `Notes,${agent.system_notes?.map((note: any) => typeof note === 'string' ? note : note.content).join('; ') || ''}\n`
    csvContent += `Thoughts,${agent.system_thoughts?.join('; ') || ''}\n`
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
${agent.system_permanent_memory?.join('\n') || ''}

Core Knowledge:
${agent.system_permanent_memory?.map((k: string) => `• ${k}`).join('\n') || ''}

Available Tools:
${agent.system_tools?.map((tool: string) => `• ${tool}`).join('\n') || ''}

Available Tools: ${Object.entries(agent.availableTools || {})
  .filter(([_, enabled]) => enabled)
  .map(([tool, _]) => tool)
  .join(', ')}`
    csvContent += `${systemPrompt}\n`
    csvContent += '\n\n'
    
    // Sheet 2: System Permanent Memory
    csvContent += '=== SYSTEM PERMANENT MEMORY ===\n'
    csvContent += 'Content\n'
    if (Array.isArray(pmem)) {
      pmem.forEach((item: any) => {
        const content = (typeof item === 'string' ? item : item.content || '').replace(/"/g, '""')
        csvContent += `"${content}"\n`
      })
    }
    csvContent += '\n\n'
    
    // Sheet 3: System Notes (7-day persistence)
    csvContent += '=== SYSTEM NOTES (7-DAY PERSISTENCE) ===\n'
    csvContent += 'Content,Created At,Expires At\n'
    if (Array.isArray(notes)) {
      notes.forEach((note: any) => {
        const content = (typeof note === 'string' ? note : note.content || '').replace(/"/g, '""')
        const created_at = typeof note === 'string' ? '' : (note.created_at || '')
        const expires_at = typeof note === 'string' ? '' : (note.expires_at || '')
        csvContent += `"${content}","${created_at}","${expires_at}"\n`
      })
    }
    csvContent += '\n\n'
    
    // Sheet 4: System Thoughts (Today only)
    csvContent += '=== SYSTEM THOUGHTS (TODAY ONLY) ===\n'
    csvContent += 'Content\n'
    if (Array.isArray(thoughts)) {
      thoughts.forEach((thought: any) => {
        const content = (typeof thought === 'string' ? thought : thought.content || '').replace(/"/g, '""')
        csvContent += `"${content}"\n`
      })
    }
    csvContent += '\n\n'
    
    // Sheet 5: System Tools
    csvContent += '=== SYSTEM TOOLS ===\n'
    csvContent += 'Tool\n'
    if (Array.isArray(tools)) {
      tools.forEach((tool: any) => {
        const toolName = (typeof tool === 'string' ? tool : tool.name || tool.content || '').replace(/"/g, '""')
        csvContent += `"${toolName}"\n`
      })
    }
    csvContent += '\n\n'
    
    // Sheet 6: Conversation History (if available)
    csvContent += '=== CONVERSATION HISTORY ===\n'
    csvContent += 'Role,Content,Timestamp\n'
    
    // Get conversation history from turn_history or create placeholder
    const turnHistory = agent.turn_history || []
    if (Array.isArray(turnHistory)) {
      turnHistory.forEach((turn: any) => {
        const role = turn.role === 'model' ? 'assistant' : turn.role || 'unknown'
        const content = turn.parts?.map((part: any) => part.text).join(' ') || ''
        const timestamp = new Date().toISOString() // Use current timestamp as fallback
        csvContent += `"${role}","${content.replace(/"/g, '""')}","${timestamp}"\n`
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
