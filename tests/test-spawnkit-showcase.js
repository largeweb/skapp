#!/usr/bin/env node

/**
 * SpawnKit Showcase: Real-World Agent Evolution Test
 * Creates specialized agents based on real use cases and evolves them over multiple turns
 * Demonstrates the power of persistent memory and strategic evolution
 * 
 * Agents Created:
 * 1. Paper Trading Agent - Market analysis and investment strategy
 * 2. Competitive Intelligence Agent - Market research and competitor tracking  
 * 3. Business Development Agent - Strategic planning and opportunity identification
 * 4. Personal Assistant Agent - Information gathering and relationship management
 * 5. Academic Research Agent - Literature synthesis and knowledge building
 * 
 * Usage: node tests/test-spawnkit-showcase.js --env=local|preview
 */

const https = require('https');
const http = require('http');

// Environment setup
const args = process.argv.slice(2);
const envFlag = args.find(arg => arg.startsWith('--env='))?.split('=')[1] || 'local';

const environments = {
  local: 'http://localhost:3000',
  preview: 'https://preview.skapp.pages.dev',
  prod: 'https://skapp.pages.dev'
};

const BASE_URL = environments[envFlag];
const WAIT_TIME = envFlag === 'local' ? 60000 : 90000; // 60s local, 90s preview/prod

console.log('🚀 SpawnKit Showcase: Real-World Agent Evolution');
console.log('='.repeat(80));
console.log(`📍 Target: ${BASE_URL} (${envFlag})`);
console.log(`⏰ Started: ${new Date().toISOString()}`);
console.log(`⏱️  Turn wait time: ${WAIT_TIME/1000}s`);
console.log(`🎯 Demonstrating: Paper trading, competitive intelligence, business development, personal assistance, academic research`);

// Showcase agent definitions
const showcaseAgents = [
  {
    agentId: 'showcase-paper-trader',
    name: '[SHOWCASE] Paper Trading Strategist',
    description: 'AI agent specialized in paper trading implementation, market analysis, and investment strategy development. Tracks portfolio positions, analyzes market trends, and develops trading strategies.',
    permanentMemory: [
      'Mission: Develop and backtest profitable trading strategies using persistent memory',
      'Method: Track market data, analyze patterns, maintain detailed trading journal',
      'Focus: Risk management, position sizing, and long-term performance tracking',
      'Tools: Web search for market data, note-taking for trade rationale, memory for performance tracking'
    ],
    evolutionPlan: [
      { turn: 1, mode: 'awake', focus: 'Market analysis and initial strategy development' },
      { turn: 2, mode: 'awake', focus: 'Portfolio position planning and risk assessment' },
      { turn: 3, mode: 'sleep', focus: 'Strategy consolidation and performance review' },
      { turn: 4, mode: 'awake', focus: 'Advanced strategy refinement and backtesting' }
    ]
  },
  {
    agentId: 'showcase-competitive-intel',
    name: '[SHOWCASE] Competitive Intelligence Analyst', 
    description: 'AI agent focused on competitive intelligence, market landscape analysis, and strategic positioning research. Builds comprehensive competitor profiles and market insights.',
    permanentMemory: [
      'Mission: Build comprehensive competitive intelligence for strategic advantage',
      'Method: Systematic competitor tracking, market analysis, and trend identification',
      'Focus: Market positioning, competitive gaps, and strategic opportunities',
      'Scope: AI/SaaS market with emphasis on agent platforms and automation tools'
    ],
    evolutionPlan: [
      { turn: 1, mode: 'awake', focus: 'Competitor landscape mapping and initial analysis' },
      { turn: 2, mode: 'awake', focus: 'Deep dive into top 3 competitors and positioning' },
      { turn: 3, mode: 'awake', focus: 'Market gap analysis and opportunity identification' },
      { turn: 4, mode: 'sleep', focus: 'Intelligence consolidation and strategic recommendations' }
    ]
  },
  {
    agentId: 'showcase-bizdev-strategist',
    name: '[SHOWCASE] Business Development Strategist',
    description: 'AI agent specialized in business development, strategic partnerships, and revenue optimization. Focuses on market research, trend analysis, and strategic recommendations.',
    permanentMemory: [
      'Mission: Drive business growth through strategic analysis and partnership development',
      'Method: Market research, trend analysis, and strategic planning with persistent insights',
      'Focus: Revenue optimization, partnership opportunities, and market expansion',
      'Target: $1B revenue roadmap through strategic business development'
    ],
    evolutionPlan: [
      { turn: 1, mode: 'awake', focus: 'Market opportunity analysis and revenue modeling' },
      { turn: 2, mode: 'awake', focus: 'Partnership strategy and channel development' },
      { turn: 3, mode: 'awake', focus: 'Go-to-market strategy and competitive positioning' },
      { turn: 4, mode: 'sleep', focus: 'Strategic consolidation and business plan synthesis' },
      { turn: 5, mode: 'awake', focus: 'Implementation roadmap and success metrics' }
    ]
  },
  {
    agentId: 'showcase-personal-assistant',
    name: '[SHOWCASE] Executive Personal Assistant',
    description: 'AI agent for personal assistance, information gathering, task tracking, and relationship management. Demonstrates SpawnKit\'s capability for personal productivity and organization.',
    permanentMemory: [
      'Mission: Provide comprehensive personal assistance with persistent memory',
      'Method: Information gathering, task tracking, and relationship management',
      'Focus: Productivity optimization, relationship building, and strategic personal development',
      'Capabilities: Research, planning, communication facilitation, and knowledge management'
    ],
    evolutionPlan: [
      { turn: 1, mode: 'awake', focus: 'Personal productivity analysis and optimization recommendations' },
      { turn: 2, mode: 'awake', focus: 'Relationship mapping and communication strategy development' },
      { turn: 3, mode: 'sleep', focus: 'Personal development consolidation and priority setting' }
    ]
  },
  {
    agentId: 'showcase-academic-researcher',
    name: '[SHOWCASE] Academic Research Specialist',
    description: 'AI agent focused on academic research, literature synthesis, and knowledge graph building. Demonstrates SpawnKit\'s capability for continuous learning and knowledge accumulation.',
    permanentMemory: [
      'Mission: Conduct systematic academic research with persistent knowledge building',
      'Method: Literature search, note synthesis, and knowledge graph development',
      'Focus: AI/ML research trends, methodology analysis, and research gap identification',
      'Goal: Build comprehensive knowledge base for research advancement'
    ],
    evolutionPlan: [
      { turn: 1, mode: 'awake', focus: 'Literature review and research trend analysis' },
      { turn: 2, mode: 'awake', focus: 'Methodology synthesis and knowledge gap identification' },
      { turn: 3, mode: 'awake', focus: 'Research hypothesis development and validation planning' },
      { turn: 4, mode: 'sleep', focus: 'Knowledge consolidation and research roadmap creation' }
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
        'User-Agent': 'SpawnKit-Showcase/1.0'
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
  console.log(`\n🏗️  Creating agent: ${agentDef.name}`);
  
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
    console.log(`ℹ️  Agent already exists: ${agentDef.agentId}`);
    return true; // Consider existing agent as success
  } else {
    console.error(`❌ Agent creation failed: ${response.status}`, response.data);
    return false;
  }
}

async function runAgentTurn(agentId, turnNumber, mode, focus) {
  console.log(`\n🎭 Turn ${turnNumber} (${mode} mode): ${focus}`);
  
  const response = await makeRequest(`${BASE_URL}/api/orchestrate`, 'POST', {
    agentId: agentId,
    mode: mode
  });

  if (response.status === 200) {
    const result = response.data;
    console.log(`   ✅ Turn completed: ${result.successful || 0} successful, ${result.failed || 0} failed`);
    return result;
  } else {
    console.error(`   ❌ Turn failed: ${response.status}`, response.data);
    return null;
  }
}

async function analyzeAgentEvolution(agentId, agentName) {
  console.log(`\n🔬 Analyzing evolution: ${agentName}`);
  
  const response = await makeRequest(`${BASE_URL}/api/agents/${agentId}`, 'GET');
  
  if (response.status === 200) {
    const agent = response.data;
    
    console.log(`📊 Evolution Metrics:`);
    console.log(`   Total Turns: ${agent.turnsCount || 0}`);
    console.log(`   Notes: ${agent.system_notes?.length || 0} entries`);
    console.log(`   Thoughts: ${agent.system_thoughts?.length || 0} entries`);
    console.log(`   Tool Results: ${agent.tool_call_results?.length || 0} executions`);
    console.log(`   Turn Enhancement: ${agent.turn_prompt_enhancement ? '✅ Set' : '❌ Not Set'}`);
    console.log(`   Previous Day Summary: ${agent.previous_day_summary ? '✅ Created' : '❌ None'}`);
    
    // Analyze content quality
    let strategicContent = 0;
    let businessContent = 0;
    let humanCommunication = 0;
    
    if (agent.system_notes && agent.system_notes.length > 0) {
      console.log(`\n📝 Strategic Notes Analysis:`);
      agent.system_notes.forEach((note, i) => {
        const content = typeof note === 'string' ? note : note.content;
        const isStrategic = content.toLowerCase().includes('strategic') || content.toLowerCase().includes('market');
        const isBusiness = content.toLowerCase().includes('business') || content.toLowerCase().includes('revenue');
        const isHumanComm = content.toLowerCase().includes('human') || content.toLowerCase().includes('request');
        
        if (isStrategic) strategicContent++;
        if (isBusiness) businessContent++;
        if (isHumanComm) humanCommunication++;
        
        console.log(`   ${i + 1}. ${content.substring(0, 120)}...`);
      });
    }
    
    if (agent.system_thoughts && agent.system_thoughts.length > 0) {
      console.log(`\n💭 Evolution Thoughts:`);
      agent.system_thoughts.forEach((thought, i) => {
        console.log(`   ${i + 1}. ${thought.substring(0, 120)}...`);
      });
    }
    
    if (agent.tool_call_results && agent.tool_call_results.length > 0) {
      console.log(`\n🛠️  Tool Evolution Pattern:`);
      agent.tool_call_results.slice(-3).forEach((result, i) => {
        console.log(`   ${i + 1}. ${result.substring(0, 100)}...`);
      });
    }
    
    // Evolution quality score
    const memoryEvolution = (agent.system_notes?.length || 0) + (agent.system_thoughts?.length || 0);
    const toolUsage = agent.tool_call_results?.length || 0;
    const evolutionScore = Math.min(100, (memoryEvolution * 20) + (toolUsage * 10) + (strategicContent * 15));
    
    console.log(`\n🎯 Evolution Quality Score: ${evolutionScore}/100`);
    console.log(`   Memory Evolution: ${memoryEvolution} entries`);
    console.log(`   Tool Usage: ${toolUsage} executions`);
    console.log(`   Strategic Content: ${strategicContent} notes`);
    console.log(`   Business Focus: ${businessContent} notes`);
    console.log(`   Human Communication: ${humanCommunication} notes`);
    
    return {
      success: evolutionScore >= 50,
      score: evolutionScore,
      agent: agent
    };
  } else {
    console.error(`❌ Failed to analyze agent: ${response.status}`, response.data);
    return { success: false, score: 0, agent: null };
  }
}

async function evolveAgent(agentDef) {
  console.log(`\n🧬 EVOLVING AGENT: ${agentDef.name}`);
  console.log('─'.repeat(60));
  
  // Check if agent already exists
  const exists = await checkAgentExists(agentDef.agentId);
  if (exists) {
    console.log(`ℹ️  Agent already exists, analyzing current state...`);
    return await analyzeAgentEvolution(agentDef.agentId, agentDef.name);
  }
  
  // Create agent
  const created = await createAgent(agentDef);
  if (!created) return { success: false, score: 0 };
  
  // Execute evolution plan
  for (let i = 0; i < agentDef.evolutionPlan.length; i++) {
    const plan = agentDef.evolutionPlan[i];
    
    console.log(`\n⏰ Waiting ${WAIT_TIME/1000}s before turn ${plan.turn}...`);
    await delay(WAIT_TIME);
    
    const turnResult = await runAgentTurn(agentDef.agentId, plan.turn, plan.mode, plan.focus);
    if (!turnResult) {
      console.error(`❌ Turn ${plan.turn} failed, stopping evolution`);
      break;
    }
    
    // Brief analysis after each turn
    if (i < agentDef.evolutionPlan.length - 1) {
      console.log(`   📊 Quick check after turn ${plan.turn}...`);
      await delay(5000); // Brief wait for KV
      const quickCheck = await makeRequest(`${BASE_URL}/api/agents/${agentDef.agentId}`, 'GET');
      if (quickCheck.status === 200) {
        const agent = quickCheck.data;
        console.log(`      Notes: ${agent.system_notes?.length || 0}, Thoughts: ${agent.system_thoughts?.length || 0}, Tools: ${agent.tool_call_results?.length || 0}`);
      }
    }
  }
  
  // Final evolution analysis
  console.log(`\n🔬 Final Evolution Analysis:`);
  await delay(10000); // Wait for final KV propagation
  return await analyzeAgentEvolution(agentDef.agentId, agentDef.name);
}

async function runShowcase() {
  console.log(`\n🧪 SpawnKit Showcase: Evolving ${showcaseAgents.length} specialized agents\n`);
  
  let successCount = 0;
  let totalScore = 0;
  const results = [];
  
  for (let i = 0; i < showcaseAgents.length; i++) {
    const agentDef = showcaseAgents[i];
    
    console.log(`\n🎯 AGENT ${i + 1}/${showcaseAgents.length}: ${agentDef.name}`);
    console.log(`📋 Use Case: ${agentDef.description.split('.')[0]}`);
    
    const result = await evolveAgent(agentDef);
    results.push(result);
    
    if (result.success) {
      successCount++;
      totalScore += result.score;
      console.log(`🎉 Agent evolution successful! Score: ${result.score}/100`);
    } else {
      console.log(`❌ Agent evolution failed. Score: ${result.score}/100`);
    }
    
    // Wait between agents to avoid overwhelming the system
    if (i < showcaseAgents.length - 1) {
      console.log(`\n⏳ Waiting 30s before next agent evolution...`);
      await delay(30000);
    }
  }
  
  // Final showcase report
  console.log('\n' + '='.repeat(80));
  console.log(`🎯 SPAWNKIT SHOWCASE RESULTS`);
  console.log('='.repeat(80));
  console.log(`✅ Successful Evolutions: ${successCount}/${showcaseAgents.length}`);
  console.log(`📊 Average Evolution Score: ${Math.round(totalScore / showcaseAgents.length)}/100`);
  console.log(`🚀 Success Rate: ${Math.round((successCount/showcaseAgents.length) * 100)}%`);
  
  console.log(`\n🎨 Use Case Demonstrations:`);
  results.forEach((result, i) => {
    const agent = showcaseAgents[i];
    console.log(`   ${i + 1}. ${agent.name}: ${result.success ? '✅ SUCCESS' : '❌ FAILED'} (${result.score}/100)`);
  });
  
  if (successCount === showcaseAgents.length) {
    console.log(`\n🚀 SHOWCASE COMPLETE! SpawnKit revolutionary agent system fully operational!`);
    console.log(`🧠 All agents demonstrate persistent memory, strategic thinking, and business value creation!`);
    console.log(`💎 Ready for real-world deployment and use case implementation!`);
  } else {
    console.log(`\n⚠️  ${showcaseAgents.length - successCount} agents need optimization. Review individual results.`);
  }
  
  console.log(`\n🌐 Agent Management URLs:`);
  showcaseAgents.forEach((agent, i) => {
    const baseUrl = BASE_URL.replace('/api', '');
    console.log(`   ${i + 1}. ${agent.name}: ${baseUrl}/agents/${agent.agentId}`);
  });
  
  console.log(`\n⏰ Showcase Completed: ${new Date().toISOString()}`);
  console.log(`📝 Agents preserved for manual review and testing`);
  
  return successCount === showcaseAgents.length;
}

// Run the showcase
runShowcase()
  .then(success => {
    console.log(`\n🎯 SpawnKit Showcase: ${success ? 'MISSION ACCOMPLISHED' : 'NEEDS OPTIMIZATION'}`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Showcase failed:', error);
    process.exit(1);
  }); 