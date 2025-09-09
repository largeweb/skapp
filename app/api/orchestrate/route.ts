export const runtime = 'edge';

import { getRequestContext } from '@cloudflare/next-on-pages';
import { z } from 'zod';
import { OrchestrationRequestSchema } from '@/lib/schemas';
import { buildSystemPrompt, buildTurnPrompt } from '@/lib/prompts';

type Mode = 'awake' | 'sleep';

export async function POST(request: Request) {
  const started = Date.now();
  console.log('🎭 Orchestration API: Start');

  try {
    const { env } = getRequestContext();
    const raw = await request.json().catch(() => ({}));
    const body = OrchestrationRequestSchema.safeParse(raw);
    
    if (!body.success) {
      return Response.json({ error: 'Invalid request', details: body.error.flatten() }, { status: 400 });
    }

    // Time handling (EST regardless of PoP)
    const now = body.data.estTime ? new Date(body.data.estTime) : new Date();
    const estTime = convertToEST(now);
    const today = estTime.toISOString().slice(0, 10);
    console.log(`🌍 Orchestration time: UTC ${now.toISOString()} → EST ${estTime.toISOString()}`);

    // Determine mode for all agents (hour >= 3 && hour < 5 = sleep, otherwise awake)
    const hour = estTime.getHours();
    const mode: Mode = body.data.mode || ((hour >= 3 && hour < 5) ? 'sleep' : 'awake');
    console.log(`🎭 Determined mode: ${mode} for all agents`);

    // Determine agents to process
    let agentKeys: string[] = [];
    if (body.data.agentId) {
      agentKeys = [`agent:${body.data.agentId}`];
      console.log(`🎯 Single agent: ${body.data.agentId}`);
    } else {
      const list = await env.SKAPP_AGENTS.list({ prefix: 'agent:' });
      agentKeys = list.keys.map(k => k.name);
      console.log(`🤖 Found ${agentKeys.length} agents`);
    }

    if (agentKeys.length === 0) {
      return Response.json({ success: true, processed: 0, estTime: estTime.toISOString(), message: 'No agents found' });
    }

    let processed = 0, successful = 0, failed = 0, skipped = 0;
    const results: any[] = [];

    for (const key of agentKeys) {
      const agentId = key.replace(/^agent:/, '');
      console.log(`🎯 Agent: ${agentId}`);
      const loopStart = Date.now();
      
      try {
        const raw = await env.SKAPP_AGENTS.get(key);
        if (!raw) {
          console.warn(`👻 Agent missing data: ${agentId}`);
          failed++;
          results.push({ agentId, status: 'failed', reason: 'Not found' });
          continue;
        }

        const agent = JSON.parse(raw);

        // Skip sleep mode if already slept today
        if (mode === 'sleep' && agent.lastSlept === today) {
          console.log(`😴 Agent ${agentId} already slept today, skipping`);
          skipped++;
          results.push({ agentId, status: 'skipped', reason: 'Already slept today' });
          continue;
        }

        console.log(`⚡ Agent '${agentId}' → mode '${mode}'`);

        // Prepare payload using centralized prompts
        const payload = preparePayload(agentId, agent, mode, estTime);
        console.log(`🔍 Payload prepared for ${agentId}`);

        const { ok, content } = await callSpawnkitGen(env, agentId, payload, estTime, new URL(request.url).origin);
        if (!ok) {
          failed++;
          results.push({ agentId, status: 'failed', mode, ms: Date.now() - loopStart });
          continue;
        }

        // Update agent tracking after successful generation
        try {
          const agentData = await env.SKAPP_AGENTS.get(`agent:${agentId}`);
          if (agentData) {
            const agentUpdate = JSON.parse(agentData);
            agentUpdate.turnsCount = (agentUpdate.turnsCount || 0) + 1;
            agentUpdate.lastTurnTriggered = estTime.toISOString();
            
            // Update lastSlept for sleep mode
            if (mode === 'sleep') {
              agentUpdate.lastSlept = today;
            }
            
            await env.SKAPP_AGENTS.put(`agent:${agentId}`, JSON.stringify(agentUpdate));
          }
        } catch (e) {
          console.warn(`📝 Tracking update failed for '${agentId}':`, e);
        }

        successful++;
        results.push({ agentId, status: 'success', mode, ms: Date.now() - loopStart });
        processed++;

        if (!body.data.agentId) {
          await new Promise(r => setTimeout(r, 100));
        }
      } catch (err) {
        console.error(`❌ Orchestration error for '${agentId}':`, err);
        failed++;
        results.push({ agentId, status: 'failed', reason: (err as Error)?.message || 'Unknown' });
      }
    }

    console.log(`✅ Orchestration complete: ${processed} processed (${successful} ok, ${failed} failed, ${skipped} skipped) in ${Date.now() - started}ms`);
    return Response.json({
      success: true,
      estTime: estTime.toISOString(),
      today,
      processed,
      successful,
      failed,
      skipped,
      results,
      message: `Orchestrated ${processed} agents`
    });
  } catch (error) {
    console.error('🚨 Orchestration API error:', error);
    return Response.json({ error: 'Orchestration failed' }, { status: 500 });
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

function preparePayload(agentId: string, agent: any, mode: Mode, estTime: Date) {
  const timeStr = estTime.toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour12: true, hour: 'numeric', minute: '2-digit' });
  
  // Build system prompt using centralized prompts system
  const systemPrompt = buildSystemPrompt(agent, mode, timeStr);
  
  console.log(`🧠 System Prompt Built (${systemPrompt.length} chars):`);
  console.log(systemPrompt.substring(0, 500) + '...');
  
  // Use agent's turn_history directly
  const turnHistory = agent.turn_history || [];

  // Build turn prompt using centralized prompts system
  const turnPrompt = buildTurnPrompt(agent, mode);

  return {
    agentId,
    systemPrompt,
    turnHistory,
    turnPrompt,
    mode
  };
}

async function callSpawnkitGen(env: any, agentId: string, payload: any, estTime: Date, origin: string): Promise<{ ok: boolean; content?: string }> {
  const max = 3;
  for (let attempt = 1; attempt <= max; attempt++) {
    try {
      console.log(`🔍 Calling SpawnkitGen for agent: ${agentId}`);
      
      const res = await fetch(`${origin}/api/agents/${agentId}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'SpawnKit-Orchestration/1.0'
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000)
      });

      if (res.ok) {
        // Accept either JSON {content} or raw text
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          const data: any = await res.json().catch(() => ({} as any));
          return { ok: true, content: data.content || data.text || '' };
        } else {
          const text = await res.text().catch(() => '');
          return { ok: true, content: text };
        }
      }
      const text = await res.text().catch(() => 'Unknown error');
      throw new Error(`HTTP ${res.status}: ${text}`);
    } catch (err) {
      if (attempt === max) break;
      const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
      console.warn(`⏳ Retry in ${Math.round(delay)}ms (attempt ${attempt})`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  return { ok: false };
} 