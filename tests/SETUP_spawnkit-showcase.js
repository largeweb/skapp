#!/usr/bin/env node

/**
 * SETUP: SpawnKit Showcase Agents
 * Creates and evolves specialized agents for manual review and testing
 * Does NOT delete agents after creation - preserves for frontend analysis
 * 
 * Usage: 
 *   node tests/SETUP_spawnkit-showcase.js --env=local
 *   node tests/SETUP_spawnkit-showcase.js --env=preview  
 * 
 * Agent IDs can be customized:
 *   node tests/SETUP_spawnkit-showcase.js --env=local --suffix=v2
 */

const https = require('https');
const http = require('http');

// Parse command line arguments
const args = process.argv.slice(2);
const envFlag = args.find(arg => arg.startsWith('--env='))?.split('=')[1] || 'local';
const suffixFlag = args.find(arg => arg.startsWith('--suffix='))?.split('=')[1] || '';

const environments = {
  local: 'http://localhost:3000',
  preview: 'https://preview.skapp.pages.dev',
  prod: 'https://skapp.pages.dev'
};

const BASE_URL = environments[envFlag];
// Enhanced timing: 60s local, 120s preview/prod (90s + 30s buffer for Cloudflare KV)
const TURN_WAIT = envFlag === 'local' ? 60000 : 120000;
const KV_WAIT = envFlag === 'local' ? 10000 : 30000; // Additional KV propagation wait

const suffix = suffixFlag ? `-${suffixFlag}` : '';

console.log('🚀 SETUP: SpawnKit Showcase Agents');
console.log('='.repeat(70));
console.log(`📍 Target: ${BASE_URL} (${envFlag})`);
console.log(`⏰ Started: ${new Date().toISOString()}`);
console.log(`⏱️  Turn wait: ${TURN_WAIT/1000}s, KV wait: ${KV_WAIT/1000}s`);
console.log(`🏷️  Agent suffix: ${suffix || 'none'}`);

// Showcase agents with parametrized IDs
const showcaseAgents = [
  {
    agentId: `showcase-paper-trader${suffix}`,
    name: `[SHOWCASE] Paper Trading Strategist${suffix}`,
    description: 'AI agent specialized in paper trading implementation, market analysis, and investment strategy development. Demonstrates SpawnKit\'s capability for financial intelligence and strategic trading decisions.',
    permanentMemory: [
      'Mission: Develop profitable trading strategies using SpawnKit persistent memory',
      'Method: Market analysis, risk assessment, performance tracking with evolving intelligence',
      'Focus: Paper trading with real-time data, position sizing, and strategic evolution',
      'Goal: Demonstrate how SpawnKit agents can become sophisticated financial advisors'
    ],
    evolutionPlan: [
      { turn: 1, mode: 'awake', focus: 'Initial market analysis and trading strategy framework development' },
      { turn: 2, mode: 'awake', focus: 'Portfolio position planning and comprehensive risk assessment' },
      { turn: 3, mode: 'awake', focus: 'Advanced strategy refinement and backtesting methodology' },
      { turn: 4, mode: 'sleep', focus: 'Trading strategy consolidation and performance review' },
      { turn: 5, mode: 'awake', focus: 'Strategic trading recommendations and human communication' }
    ]
  },
  {
    agentId: `showcase-competitive-intel${suffix}`,
    name: `[SHOWCASE] Competitive Intelligence Analyst${suffix}`,
    description: 'AI agent focused on competitive intelligence, market landscape analysis, and strategic positioning research. Builds comprehensive competitor profiles using SpawnKit\'s persistent memory.',
    permanentMemory: [
      'Mission: Build comprehensive competitive intelligence for strategic market advantage',
      'Method: Systematic competitor tracking, market analysis, and strategic positioning',
      'Focus: AI/SaaS market with emphasis on agent platforms and automation tools',
      'Goal: Create persistent competitive knowledge that evolves and improves over time'
    ],
    evolutionPlan: [
      { turn: 1, mode: 'awake', focus: 'Competitor landscape mapping and market positioning analysis' },
      { turn: 2, mode: 'awake', focus: 'Deep dive into top 3 competitors and strategic positioning' },
      { turn: 3, mode: 'awake', focus: 'Market gap analysis and opportunity identification' },
      { turn: 4, mode: 'awake', focus: 'Strategic recommendations and competitive advantage planning' },
      { turn: 5, mode: 'sleep', focus: 'Intelligence consolidation and strategic synthesis' }
    ]
  },
  {
    agentId: `showcase-bizdev-strategist${suffix}`,
    name: `[SHOWCASE] Business Development Strategist${suffix}`,
    description: 'AI agent specialized in business development, strategic partnerships, and revenue optimization. Focuses on $1B revenue roadmap development using SpawnKit\'s strategic intelligence.',
    permanentMemory: [
      'Mission: Drive business growth through strategic analysis and partnership development',
      'Method: Market research, revenue modeling, and strategic planning with persistent insights',
      'Focus: $1B revenue roadmap through strategic business development and partnerships',
      'Goal: Demonstrate SpawnKit\'s capability for strategic business transformation'
    ],
    evolutionPlan: [
      { turn: 1, mode: 'awake', focus: 'Market opportunity analysis and revenue modeling framework' },
      { turn: 2, mode: 'awake', focus: 'Partnership strategy development and channel analysis' },
      { turn: 3, mode: 'awake', focus: 'Go-to-market strategy and competitive positioning' },
      { turn: 4, mode: 'sleep', focus: 'Strategic consolidation and business plan synthesis' },
      { turn: 5, mode: 'awake', focus: 'Implementation roadmap and success metrics development' },
      { turn: 6, mode: 'awake', focus: 'Human communication and strategic recommendations' }
    ]
  }
];

async function makeRequest(url, method, data) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SpawnKit-Setup/1.0'
      }
    };

    const client = urlObj.protocol === 'https:' ? https : http;
    const req = client.request(options, (res) => {
      let responseBody = '';
      res.on('data', chunk => responseBody += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseBody);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseBody });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function checkAgentExists(agentId) {
  try {
    const response = await makeRequest(`${BASE_URL}/api/agents/${agentId}`, 'GET');
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

async function createAgent(agentDef) {
  console.log(`\n🏗️  Creating: ${agentDef.name}`);
  
  const response = await makeRequest(`${BASE_URL}/api/agents`, 'POST', {
    agentId: agentDef.agentId,
    name: agentDef.name,
    description: agentDef.description,
    system_permanent_memory: agentDef.permanentMemory
  });

  if (response.status === 200 || response.status === 201) {
    console.log(`✅ Agent created: ${agentDef.agentId}`);
    return true;
  } else if (response.status === 409) {
    console.log(`ℹ️  Agent already exists: ${agentDef.agentId} - skipping evolution`);
    return 'exists';
  } else {
    console.error(`❌ Agent creation failed: ${response.status}`, response.data);
    return false;
  }
}

async function runAgentTurn(agentId, turnNumber, mode, focus) {
  console.log(`\n🎭 Turn ${turnNumber} (${mode}): ${focus}`);
  
  const response = await makeRequest(`${BASE_URL}/api/orchestrate`, 'POST', {
    agentId: agentId,
    mode: mode
  });

  if (response.status === 200) {
    const result = response.data;
    console.log(`   ✅ Orchestration: ${result.successful || 0} successful, ${result.failed || 0} failed`);
    
    // Enhanced wait for complete tool execution and KV propagation
    console.log(`   ⏱️  Waiting ${KV_WAIT/1000}s for tool execution and KV propagation...`);
    await delay(KV_WAIT);
    
    // Verify tool execution happened
    const agentCheck = await makeRequest(`${BASE_URL}/api/agents/${agentId}`, 'GET');
    if (agentCheck.status === 200) {
      const agent = agentCheck.data;
      console.log(`   📊 Post-turn: Notes: ${agent.system_notes?.length || 0}, Thoughts: ${agent.system_thoughts?.length || 0}, Tools: ${agent.tool_call_results?.length || 0}`);
    }
    
    return result;
  } else {
    console.error(`   ❌ Turn failed: ${response.status}`, response.data);
    return null;
  }
}

async function evolveAgent(agentDef) {
  console.log(`\n🧬 EVOLVING: ${agentDef.name}`);
  console.log('─'.repeat(60));
  
  // Check if agent exists
  const exists = await checkAgentExists(agentDef.agentId);
  if (exists) {
    console.log(`ℹ️  Agent exists - analyzing current evolution state...`);
    return await analyzeExistingAgent(agentDef);
  }
  
  // Create new agent
  const created = await createAgent(agentDef);
  if (created !== true) return { success: created === 'exists', skipped: created === 'exists' };
  
  // Execute evolution plan with enhanced timing
  for (let i = 0; i < agentDef.evolutionPlan.length; i++) {
    const plan = agentDef.evolutionPlan[i];
    
    // Wait before each turn (except first)
    if (i > 0) {
      console.log(`\n⏰ Waiting ${TURN_WAIT/1000}s before turn ${plan.turn}...`);
      await delay(TURN_WAIT);
    }
    
    const turnResult = await runAgentTurn(agentDef.agentId, plan.turn, plan.mode, plan.focus);
    if (!turnResult) {
      console.error(`❌ Turn ${plan.turn} failed - stopping evolution`);
      break;
    }
  }
  
  // Final analysis with extended wait
  console.log(`\n🔬 Final evolution analysis (waiting ${KV_WAIT/1000}s for complete KV sync)...`);
  await delay(KV_WAIT);
  
  return await analyzeAgentEvolution(agentDef);
}

async function analyzeExistingAgent(agentDef) {
  const response = await makeRequest(`${BASE_URL}/api/agents/${agentDef.agentId}`, 'GET');
  
  if (response.status === 200) {
    const agent = response.data;
    console.log(`📊 Existing Agent State:`);
    console.log(`   Turns: ${agent.turnsCount || 0}`);
    console.log(`   Notes: ${agent.system_notes?.length || 0}`);
    console.log(`   Thoughts: ${agent.system_thoughts?.length || 0}`);
    console.log(`   Tool Results: ${agent.tool_call_results?.length || 0}`);
    
    return { success: true, skipped: true, existing: true };
  }
  
  return { success: false, skipped: false };
}

async function analyzeAgentEvolution(agentDef) {
  const response = await makeRequest(`${BASE_URL}/api/agents/${agentDef.agentId}`, 'GET');
  
  if (response.status === 200) {
    const agent = response.data;
    
    console.log(`📊 Evolution Results:`);
    console.log(`   Total Turns: ${agent.turnsCount || 0}`);
    console.log(`   Notes Created: ${agent.system_notes?.length || 0}`);
    console.log(`   Thoughts Recorded: ${agent.system_thoughts?.length || 0}`);
    console.log(`   Tool Executions: ${agent.tool_call_results?.length || 0}`);
    console.log(`   Turn Enhancement: ${agent.turn_prompt_enhancement ? '✅ Set' : '❌ Not Set'}`);
    
    // Calculate evolution score
    const memoryScore = (agent.system_notes?.length || 0) * 20 + (agent.system_thoughts?.length || 0) * 10;
    const toolScore = (agent.tool_call_results?.length || 0) * 15;
    const evolutionScore = Math.min(100, memoryScore + toolScore);
    
    console.log(`🎯 Evolution Score: ${evolutionScore}/100`);
    
    return { success: evolutionScore >= 60, score: evolutionScore };
  }
  
  return { success: false, score: 0 };
}

async function runSetup() {
  console.log(`\n🧪 Setting up ${showcaseAgents.length} SpawnKit showcase agents...\n`);
  
  let createdCount = 0;
  let existingCount = 0;
  let failedCount = 0;
  
  for (let i = 0; i < showcaseAgents.length; i++) {
    const agentDef = showcaseAgents[i];
    
    console.log(`\n🎯 AGENT ${i + 1}/${showcaseAgents.length}: ${agentDef.name}`);
    
    const result = await evolveAgent(agentDef);
    
    if (result.skipped) {
      existingCount++;
      console.log(`ℹ️  Agent already exists - evolution skipped`);
    } else if (result.success) {
      createdCount++;
      console.log(`🎉 Agent evolution completed successfully!`);
    } else {
      failedCount++;
      console.log(`❌ Agent evolution failed`);
    }
    
    // Wait between agents to avoid system overload
    if (i < showcaseAgents.length - 1) {
      console.log(`\n⏳ Waiting 30s before next agent...`);
      await delay(30000);
    }
  }
  
  // Final setup report
  console.log('\n' + '='.repeat(70));
  console.log(`🎯 SPAWNKIT SHOWCASE SETUP COMPLETE`);
  console.log('='.repeat(70));
  console.log(`🏗️  Agents Created: ${createdCount}`);
  console.log(`ℹ️  Agents Existing: ${existingCount}`);
  console.log(`❌ Agents Failed: ${failedCount}`);
  console.log(`📊 Total Agents: ${createdCount + existingCount} operational`);
  
  console.log(`\n🌐 Agent Management URLs:`);
  showcaseAgents.forEach((agent, i) => {
    const baseUrl = BASE_URL.replace('/api', '');
    console.log(`   ${i + 1}. ${agent.name}: ${baseUrl}/agents/${agent.agentId}`);
  });
  
  console.log(`\n📝 SETUP STATUS: Agents preserved for manual review and testing`);
  console.log(`🔍 Review agents in frontend to validate SpawnKit revolutionary capabilities`);
  console.log(`⏰ Setup completed: ${new Date().toISOString()}`);
  
  const success = (createdCount + existingCount) >= showcaseAgents.length;
  return success;
}

// Run the setup
runSetup()
  .then(success => {
    console.log(`\n🎯 Setup Result: ${success ? 'COMPLETE' : 'PARTIAL'}`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Setup failed:', error);
    process.exit(1);
  }); 