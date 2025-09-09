export const runtime = 'edge';

import { getRequestContext } from '@cloudflare/next-on-pages';

export async function DELETE(request: Request): Promise<Response> {
  try {
    const { env } = getRequestContext();
    console.log('🧹 Development KV Cleanup: Start');
    
    // Only allow in development/localhost
    const url = new URL(request.url);
    if (!url.hostname.includes('localhost') && !url.hostname.includes('127.0.0.1')) {
      return Response.json({ 
        error: 'Cleanup only allowed on localhost' 
      }, { status: 403 });
    }
    
    // Get all keys with agent prefix
    const agentsList = await env.SKAPP_AGENTS.list({ prefix: 'agent:' });
    console.log(`🔍 Found ${agentsList.keys.length} agent keys to delete`);
    
    // Delete all agent keys
    const deletePromises = agentsList.keys.map(key => 
      env.SKAPP_AGENTS.delete(key.name)
    );
    
    // Also delete dashboard-metrics
    deletePromises.push(env.SKAPP_AGENTS.delete('dashboard-metrics'));
    
    await Promise.all(deletePromises);
    
    console.log(`✅ Cleanup complete: ${agentsList.keys.length} agents + dashboard-metrics deleted`);
    
    return Response.json({
      success: true,
      message: `Cleaned up ${agentsList.keys.length} agents and dashboard-metrics`,
      deletedKeys: agentsList.keys.length + 1
    });
    
  } catch (error: any) {
    console.error('🚨 Cleanup error:', error?.message?.substring(0, 200));
    
    return Response.json({
      success: false,
      error: 'Cleanup failed',
      code: 'CLEANUP_ERROR'
    }, { status: 500 });
  }
} 