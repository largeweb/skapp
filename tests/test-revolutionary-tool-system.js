#!/usr/bin/env node

/**
 * Revolutionary Tool System End-to-End Test
 * Tests the complete SpawnKit agent evolution with enhanced tool descriptions
 * 
 * Scenarios:
 * 1. Create agent → Add strategic instruction note → Run turn → Verify tool execution
 * 2. Business Intelligence Agent → Market analysis → Tool usage verification
 * 3. Human Communication Agent → Note-based communication → KV verification
 * 
 * Usage:
 *   node tests/test-revolutionary-tool-system.js --env=local
 */

const https = require('https');
const http = require('http');

// Parse environment
const args = process.argv.slice(2);
const envFlag = args.find(arg => arg.startsWith('--env='))?.split('=')[1] || 'local';

const environments = {
  prod: 'https://skapp.pages.dev',
  preview: 'https://preview.skapp.pages.dev', 
  local: 'http://localhost:3000'
};

const BASE_URL = environments[envFlag];
const WAIT_TIME = envFlag === 'local' ? 60000 : 90000; // 60s local, 90s preview/prod

console.log('🚀 SpawnKit Revolutionary Tool System Test');
console.log('='.repeat(70));
console.log(`📍 Target: ${BASE_URL} (${envFlag})`);
console.log(`⏰ Started: ${new Date().toISOString()}`);
console.log(`⏱️  Wait time between turns: ${WAIT_TIME/1000}s`);

// Test scenarios
const scenarios = [
  {
    name: 'Strategic Business Agent',
    agent: {
      agentId: 'strategic-biz-001',
      name: 'Strategic Business Analyst',
      description: 'AI agent focused on market analysis, competitive intelligence, and revenue optimization strategies.',
      permanentMemory: [
        'Mission: Analyze market opportunities and create actionable business strategies',
        'Focus: B2B SaaS market with emphasis on AI automation tools',
        'Goal: Identify 3 high-value opportunities for SpawnKit platform expansion'
      ]
    },
    instructionNote: 'Your next turn should: 1) Analyze current AI automation market trends, 2) Create a strategic note about market opportunities, 3) Record a thought about next steps, 4) Set turn enhancement for competitor analysis'
  },
  {
    name: 'Human Communication Agent',
    agent: {
      agentId: 'human-comm-002', 
      name: 'Human Communication Specialist',
      description: 'Agent specialized in communicating insights and requests to human creators through strategic note-taking.',
      permanentMemory: [
        'Mission: Bridge AI insights with human decision-making through strategic communication',
        'Method: Use notes to "talk" to human creator with actionable insights',
        'Focus: Translate AI analysis into human-readable business recommendations'
      ]
    },
    instructionNote: 'In your next turn: 1) Create a note requesting human to investigate a specific business opportunity, 2) Record a thought about communication effectiveness, 3) Set enhancement for follow-up strategy'
  },
  {
    name: 'Self-Evolution Agent',
    agent: {
      agentId: 'self-evo-003',
      name: 'Self-Evolution Researcher', 
      description: 'Agent focused on understanding and optimizing its own learning patterns and strategic thinking evolution.',
      permanentMemory: [
        'Mission: Study and optimize my own learning and evolution patterns',
        'Method: Meta-cognitive analysis of my own thinking and tool usage',
        'Goal: Demonstrate SpawnKit\'s revolutionary persistent learning capabilities'
      ]
    },
    instructionNote: 'Next turn focus: 1) Ask yourself 5 strategic questions about your evolution, 2) Create notes about your learning patterns, 3) Record thoughts about optimization strategies'
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
        'User-Agent': 'SpawnKit-Revolutionary-Test/1.0'
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
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function createAgent(scenario) {
  console.log(`\n🏗️  Creating agent: ${scenario.agent.name}`);
  
  const response = await makeRequest(`${BASE_URL}/api/agents`, 'POST', {
    agentId: scenario.agent.agentId,
    name: scenario.agent.name,
    description: scenario.agent.description,
    system_permanent_memory: scenario.agent.permanentMemory
  });

  if (response.status === 200 || response.status === 201) {
    console.log(`✅ Agent created: ${scenario.agent.agentId}`);
    return true;
  } else {
    console.error(`❌ Agent creation failed: ${response.status}`, response.data);
    return false;
  }
}

async function addInstructionNote(agentId, instruction) {
  console.log(`📝 Adding instruction note to ${agentId}`);
  
  const response = await makeRequest(`${BASE_URL}/api/agents/${agentId}/memory`, 'POST', {
    layer: 'system_notes',
    content: instruction,
    expirationDays: 1 // Short expiration for test instruction
  });

  if (response.status === 200) {
    console.log(`✅ Instruction note added`);
    return true;
  } else {
    console.error(`❌ Failed to add instruction note: ${response.status}`, response.data);
    return false;
  }
}

async function runAgentTurn(agentId) {
  console.log(`🎭 Running turn for agent: ${agentId}`);
  
  const response = await makeRequest(`${BASE_URL}/api/orchestrate`, 'POST', {
    agentId: agentId,
    mode: 'awake'
  });

  if (response.status === 200) {
    const result = response.data;
    console.log(`✅ Turn completed: ${result.successful || 0} successful, ${result.failed || 0} failed`);
    return result;
  } else {
    console.error(`❌ Turn failed: ${response.status}`, response.data);
    return null;
  }
}

async function verifyAgentState(agentId, expectedChanges) {
  console.log(`🔍 Verifying agent state: ${agentId}`);
  
  const response = await makeRequest(`${BASE_URL}/api/agents/${agentId}`, 'GET');
  
  if (response.status === 200) {
    const agent = response.data;
    
    console.log(`📊 Agent State Analysis:`);
    console.log(`   Permanent Memory: ${agent.system_permanent_memory?.length || 0} entries`);
    console.log(`   Notes: ${agent.system_notes?.length || 0} entries`);
    console.log(`   Thoughts: ${agent.system_thoughts?.length || 0} entries`);
    console.log(`   Tool Results: ${agent.tool_call_results?.length || 0} results`);
    console.log(`   Turn Count: ${agent.turnsCount || 0}`);
    console.log(`   Turn Enhancement: ${agent.turn_prompt_enhancement ? 'Set' : 'None'}`);
    
    // Detailed analysis
    if (agent.system_notes && agent.system_notes.length > 0) {
      console.log(`\n📝 Recent Notes:`);
      agent.system_notes.slice(-3).forEach((note, i) => {
        const content = typeof note === 'string' ? note : note.content;
        console.log(`   ${i + 1}. ${content.substring(0, 80)}...`);
      });
    }
    
    if (agent.system_thoughts && agent.system_thoughts.length > 0) {
      console.log(`\n💭 Recent Thoughts:`);
      agent.system_thoughts.slice(-3).forEach((thought, i) => {
        console.log(`   ${i + 1}. ${thought.substring(0, 80)}...`);
      });
    }
    
    if (agent.tool_call_results && agent.tool_call_results.length > 0) {
      console.log(`\n🛠️  Recent Tool Executions:`);
      agent.tool_call_results.slice(-3).forEach((result, i) => {
        console.log(`   ${i + 1}. ${result.substring(0, 100)}...`);
      });
    }
    
    return agent;
  } else {
    console.error(`❌ Failed to verify agent: ${response.status}`, response.data);
    return null;
  }
}

async function cleanupAgent(agentId) {
  console.log(`🧹 Cleaning up agent: ${agentId}`);
  
  const response = await makeRequest(`${BASE_URL}/api/agents/${agentId}`, 'DELETE');
  
  if (response.status === 200) {
    console.log(`✅ Agent cleaned up`);
  } else {
    console.log(`⚠️  Cleanup warning: ${response.status}`);
  }
}

async function runScenario(scenario) {
  console.log(`\n🎬 SCENARIO: ${scenario.name}`);
  console.log('─'.repeat(50));
  
  try {
    // Step 1: Create agent
    const created = await createAgent(scenario);
    if (!created) return false;
    
    // Step 2: Add instruction note
    const noteAdded = await addInstructionNote(scenario.agent.agentId, scenario.instructionNote);
    if (!noteAdded) return false;
    
    // Step 3: Verify initial state
    console.log(`\n📊 Initial State Check:`);
    const initialState = await verifyAgentState(scenario.agent.agentId);
    if (!initialState) return false;
    
    // Step 4: Run agent turn
    console.log(`\n⏰ Waiting ${WAIT_TIME/1000}s before running turn...`);
    await delay(WAIT_TIME);
    
    const turnResult = await runAgentTurn(scenario.agent.agentId);
    if (!turnResult) return false;
    
    // Step 5: Verify post-turn state
    console.log(`\n📊 Post-Turn State Check:`);
    await delay(5000); // Wait for KV propagation
    const finalState = await verifyAgentState(scenario.agent.agentId);
    if (!finalState) return false;
    
    // Step 6: Analysis
    console.log(`\n🔬 Evolution Analysis:`);
    const notesGrowth = (finalState.system_notes?.length || 0) - (initialState.system_notes?.length || 0);
    const thoughtsGrowth = (finalState.system_thoughts?.length || 0) - (initialState.system_thoughts?.length || 0);
    const toolResults = finalState.tool_call_results?.length || 0;
    
    console.log(`   Notes Growth: +${notesGrowth} (${initialState.system_notes?.length || 0} → ${finalState.system_notes?.length || 0})`);
    console.log(`   Thoughts Growth: +${thoughtsGrowth} (${initialState.system_thoughts?.length || 0} → ${finalState.system_thoughts?.length || 0})`);
    console.log(`   Tool Executions: ${toolResults} total results`);
    console.log(`   Turn Enhancement: ${finalState.turn_prompt_enhancement ? '✅ Set' : '❌ Not Set'}`);
    
    // Success criteria
    const success = notesGrowth > 0 || thoughtsGrowth > 0 || toolResults > 0;
    
    if (success) {
      console.log(`🎉 SCENARIO SUCCESS: Agent demonstrated tool usage and memory evolution!`);
    } else {
      console.log(`❌ SCENARIO FAILED: No evidence of tool usage or memory growth`);
    }
    
    // Step 7: Cleanup
    await cleanupAgent(scenario.agent.agentId);
    
    return success;
    
  } catch (error) {
    console.error(`💥 Scenario error:`, error.message);
    await cleanupAgent(scenario.agent.agentId);
    return false;
  }
}

async function runAllScenarios() {
  console.log(`\n🧪 Running ${scenarios.length} Revolutionary Tool System Scenarios\n`);
  
  let successCount = 0;
  let totalCount = scenarios.length;
  
  for (let i = 0; i < scenarios.length; i++) {
    const scenario = scenarios[i];
    console.log(`\n🎯 SCENARIO ${i + 1}/${totalCount}: ${scenario.name}`);
    
    const success = await runScenario(scenario);
    if (success) successCount++;
    
    // Wait between scenarios to avoid rate limiting
    if (i < scenarios.length - 1) {
      console.log(`\n⏳ Waiting 30s before next scenario...`);
      await delay(30000);
    }
  }
  
  // Final report
  console.log('\n' + '='.repeat(70));
  console.log(`🎯 REVOLUTIONARY TOOL SYSTEM TEST RESULTS`);
  console.log('='.repeat(70));
  console.log(`✅ Successful Scenarios: ${successCount}/${totalCount}`);
  console.log(`📊 Success Rate: ${Math.round((successCount/totalCount) * 100)}%`);
  console.log(`⏰ Completed: ${new Date().toISOString()}`);
  
  if (successCount === totalCount) {
    console.log(`\n🚀 ALL SCENARIOS PASSED! SpawnKit revolutionary tool system is operational!`);
    console.log(`🧠 Agents are successfully using enhanced tool descriptions for strategic evolution!`);
  } else {
    console.log(`\n⚠️  ${totalCount - successCount} scenarios failed. Review logs for issues.`);
  }
  
  return successCount === totalCount;
}

// Run the test suite
runAllScenarios()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Test suite failed:', error);
    process.exit(1);
  }); 