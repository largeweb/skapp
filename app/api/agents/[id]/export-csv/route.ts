export const runtime = 'edge';

import { getRequestContext } from '@cloudflare/next-on-pages';
import { buildSystemPrompt, buildTurnPrompt } from '@/lib/prompts';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { env } = getRequestContext();
    const { id } = await params;
    
    console.log(`📊 CSV Export for agent: ${id}`);
    
    // Get agent data
    const agentData = await env.SKAPP_AGENTS.get(`agent:${id}`);
    if (!agentData) {
      return Response.json({ 
        error: 'Agent not found',
        code: 'AGENT_NOT_FOUND'
      }, { status: 404 });
    }
    
    const agent = JSON.parse(agentData);
    
    // Determine current mode using orchestrate logic
    const now = new Date();
    const estTime = convertToEST(now);
    const hour = estTime.getHours();
    const currentMode = (hour >= 3 && hour < 5) ? 'sleep' : 'awake';
    
    // Build current system prompt
    const timeStr = estTime.toLocaleTimeString('en-US', { 
      timeZone: 'America/New_York', 
      hour12: true, 
      hour: 'numeric', 
      minute: '2-digit' 
    });
    const systemPrompt = buildSystemPrompt(agent, currentMode, timeStr);
    const turnPrompt = buildTurnPrompt(agent, currentMode);
    
    // Build CSV content
    const csvRows: string[] = [];
    
    // Header row
    csvRows.push([
      'Permanent Memory',
      'Notes', 
      'Thoughts',
      'Tool Call Results',
      'Discord Channel 1 Activity',
      'Current Agent Turn Context'
    ].map(escapeCSV).join(','));
    
    // Find the maximum number of rows needed
    const maxRows = Math.max(
      agent.system_permanent_memory?.length || 0,
      agent.system_notes?.length || 0,
      agent.system_thoughts?.length || 0,
      agent.tool_call_results?.length || 0,
      1, // Discord activity (placeholder)
      2 + (agent.turn_history?.length * 2 || 0) + 1 // System prompt + turn history + turn prompt
    );
    
    // Build data rows
    for (let i = 0; i < maxRows; i++) {
      const row: string[] = [];
      
      // Column A: Permanent Memory
      const pmemItem = agent.system_permanent_memory?.[i];
      row.push(escapeCSV(pmemItem || ''));
      
      // Column B: Notes (sorted by expiration, earliest first)
      let notesItem = '';
      if (agent.system_notes && agent.system_notes.length > 0) {
        const now = new Date();
        const sortedNotes = [...agent.system_notes].sort((a: any, b: any) => {
          const aExpiry = new Date(a.expires_at || 0);
          const bExpiry = new Date(b.expires_at || 0);
          return aExpiry.getTime() - bExpiry.getTime();
        });
        
        const note = sortedNotes[i];
        if (note) {
          const expiry = new Date(note.expires_at);
          const daysUntilExpiry = Math.max(0, (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          const roundedDays = Math.ceil(daysUntilExpiry);
          const expiryText = roundedDays === 1 ? 'Expires in 1d' : `Expires in ${roundedDays}d`;
          notesItem = `${note.content}. ${expiryText}`;
        }
      }
      row.push(escapeCSV(notesItem));
      
      // Column C: Thoughts
      const thoughtItem = agent.system_thoughts?.[i];
      row.push(escapeCSV(thoughtItem || ''));
      
      // Column D: Tool Call Results
      const toolResultItem = agent.tool_call_results?.[i];
      row.push(escapeCSV(toolResultItem || ''));
      
      // Column E: Discord Channel 1 Activity (placeholder)
      row.push(escapeCSV(''));
      
      // Column F: Current Agent Turn Context
      let turnContextItem = '';
      if (i === 0) {
        // Row 2: System prompt
        turnContextItem = systemPrompt;
      } else if (agent.turn_history && agent.turn_history.length > 0) {
        const turnIndex = Math.floor((i - 1) / 2);
        const isUserTurn = (i - 1) % 2 === 0;
        const turn = agent.turn_history[turnIndex];
        
        if (turn) {
          if (isUserTurn) {
            const content = turn.parts?.map((part: any) => part.text).join(' ') || turn.content || '';
            turnContextItem = `User: ${content}`;
          } else {
            const content = turn.parts?.map((part: any) => part.text).join(' ') || turn.content || '';
            turnContextItem = `Assistant: ${content}`;
          }
        }
      } else if (i === 1 + (agent.turn_history?.length * 2 || 0)) {
        // Last row: Turn prompt
        turnContextItem = turnPrompt || '';
      }
      row.push(escapeCSV(turnContextItem));
      
      csvRows.push(row.join(','));
    }
    
    const csvContent = csvRows.join('\n');
    const filename = `${agent.name.replace(/[^a-zA-Z0-9]/g, '_')}-export-${new Date().toISOString().split('T')[0]}.csv`;
    
    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache'
      }
    });
    
  } catch (error) {
    console.error('🚨 CSV Export error:', error);
    return Response.json({ 
      error: 'Failed to export CSV',
      code: 'CSV_EXPORT_FAILED'
    }, { status: 500 });
  }
}

function convertToEST(utcDate: Date): Date {
  const isDST = isDaylightSavingTime(utcDate);
  const offset = isDST ? -4 : -5;
  return new Date(utcDate.getTime() + offset * 60 * 60 * 1000);
}

function isDaylightSavingTime(date: Date): boolean {
  const year = date.getUTCFullYear();
  const march = new Date(year, 2, 1);
  const dstStart = new Date(year, 2, 14 - march.getDay());
  const november = new Date(year, 10, 1);
  const dstEnd = new Date(year, 10, 7 - november.getDay());
  return date >= dstStart && date < dstEnd;
}

function escapeCSV(value: string): string {
  if (!value) return '';
  
  // If the value contains commas, quotes, or newlines, wrap it in quotes and escape internal quotes
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  
  return value;
} 