#!/usr/bin/env node

/**
 * Tool Execution Validation Test
 * Validates complete tool execution flow with parametrized agent ID
 * Creates agent → Runs turn → Validates tool execution → Cleans up
 * 
 * Usage:
 *   node tests/test-tool-execution-validation.js --env=local --agentId=custom-test-001
 *   node tests/test-tool-execution-validation.js --env=preview
 */

const https = require('https');
const http = require('http');

// Parse command line arguments
const args = process.argv.slice(2);
const envFlag = args.find(arg => arg.startsWith('--env='))?.split('=')[1] || 'local';
const agentIdFlag = args.find(arg => arg.startsWith('--agentId='))?.split('=')[1];

const environments = {
  local: 'http://localhost:3000',
  preview: 'https://preview.skapp.pages.dev',
  prod: 'https://skapp.pages.dev'
};

const BASE_URL = environments[envFlag];
// Enhanced timing for complete flow validation
const TURN_WAIT = envFlag === 'local' ? 60000 : 120000; // 60s local, 120s preview/prod
const KV_WAIT = envFlag === 'local' ? 15000 : 45000; // 15s local, 45s preview/prod

// Parametrized agent ID
const testAgentId = agentIdFlag || `validation-test-${Date.now()}`;

console.log('✅ Tool Execution Validation Test');
console.log('='.repeat(60));
console.log(`📍 Target: ${BASE_URL} (${envFlag})`);
console.log(`🆔 Agent ID: ${testAgentId}`);
console.log(`⏱️  Turn wait: ${TURN_WAIT/1000}s, KV wait: ${KV_WAIT/1000}s`);

const testAgent = {
  agentId: testAgentId,
  name: `Tool Validation Agent`,
  description: 'Agent designed to validate complete SpawnKit tool execution flow with enhanced timing and comprehensive analysis.',
  system_permanent_memory: [
    'Mission: Validate all 4 SpawnKit required tools execute correctly',
    'Method: Strategic business analysis with tool usage demonstration',
    'Focus: Market opportunities, competitive intelligence, and strategic planning',
    'Goal: Prove SpawnKit revolutionary tool system works end-to-end'
  ]
};

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
        'User-Agent': 'SpawnKit-Validation/1.0'
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

async function runValidationTest() {
  try {
    console.log(`\n🧪 Starting tool execution validation...\n`);
    
    // Step 1: Create test agent
    console.log(`🏗️  Creating validation agent: ${testAgent.name}`);
    const createResponse = await makeRequest(`${BASE_URL}/api/agents`, 'POST', testAgent);
    
    if (createResponse.status !== 200 && createResponse.status !== 201) {
      console.error(`❌ Agent creation failed: ${createResponse.status}`, createResponse.data);
      return false;
    }
    
    console.log(`✅ Agent created: ${testAgentId}`);
    
    // Step 2: Get initial state
    console.log(`\n🔍 Checking initial agent state...`);
    const initialResponse = await makeRequest(`${BASE_URL}/api/agents/${testAgentId}`, 'GET');
    const initialAgent = initialResponse.data;
    
    console.log(`📊 Initial State:`);
    console.log(`   Notes: ${initialAgent.system_notes?.length || 0}`);
    console.log(`   Thoughts: ${initialAgent.system_thoughts?.length || 0}`);
    console.log(`   Tool Results: ${initialAgent.tool_call_results?.length || 0}`);
    console.log(`   Turn Count: ${initialAgent.turnsCount || 0}`);
    
    // Step 3: Run orchestration with enhanced timing
    console.log(`\n🎭 Running orchestration (awake mode)...`);
    const orchestrateResponse = await makeRequest(`${BASE_URL}/api/orchestrate`, 'POST', {
      agentId: testAgentId,
      mode: 'awake'
    });
    
    if (orchestrateResponse.status !== 200) {
      console.error(`❌ Orchestration failed: ${orchestrateResponse.status}`, orchestrateResponse.data);
      return false;
    }
    
    const orchestrateResult = orchestrateResponse.data;
    console.log(`✅ Orchestration completed: ${orchestrateResult.successful || 0} successful, ${orchestrateResult.failed || 0} failed`);
    
    // Step 4: Enhanced wait for complete tool execution flow
    console.log(`\n⏱️  Waiting ${KV_WAIT/1000}s for complete tool execution and KV propagation...`);
    await delay(KV_WAIT);
    
    // Step 5: Comprehensive final state analysis
    console.log(`\n🔬 Comprehensive tool execution analysis...`);
    const finalResponse = await makeRequest(`${BASE_URL}/api/agents/${testAgentId}`, 'GET');
    const finalAgent = finalResponse.data;
    
    console.log(`📊 Final State Analysis:`);
    console.log(`   Turn Count: ${finalAgent.turnsCount || 0} (was ${initialAgent.turnsCount || 0})`);
    console.log(`   Notes: ${finalAgent.system_notes?.length || 0} (was ${initialAgent.system_notes?.length || 0})`);
    console.log(`   Thoughts: ${finalAgent.system_thoughts?.length || 0} (was ${initialAgent.system_thoughts?.length || 0})`);
    console.log(`   Tool Results: ${finalAgent.tool_call_results?.length || 0} (was ${initialAgent.tool_call_results?.length || 0})`);
    console.log(`   Turn Enhancement: ${finalAgent.turn_prompt_enhancement ? '✅ Set' : '❌ Not Set'}`);
    
    // Detailed content analysis
    if (finalAgent.system_notes && finalAgent.system_notes.length > initialAgent.system_notes?.length) {
      console.log(`\n📝 New Notes Created:`);
      const newNotes = finalAgent.system_notes.slice(initialAgent.system_notes?.length || 0);
      newNotes.forEach((note, i) => {
        const content = typeof note === 'string' ? note : note.content;
        console.log(`   ${i + 1}. ${content.substring(0, 120)}...`);
      });
    }
    
    if (finalAgent.system_thoughts && finalAgent.system_thoughts.length > initialAgent.system_thoughts?.length) {
      console.log(`\n💭 New Thoughts Recorded:`);
      const newThoughts = finalAgent.system_thoughts.slice(initialAgent.system_thoughts?.length || 0);
      newThoughts.forEach((thought, i) => {
        console.log(`   ${i + 1}. ${thought.substring(0, 120)}...`);
      });
    }
    
    if (finalAgent.tool_call_results && finalAgent.tool_call_results.length > 0) {
      console.log(`\n🛠️  Tool Execution Results:`);
      finalAgent.tool_call_results.forEach((result, i) => {
        console.log(`   ${i + 1}. ${result.substring(0, 150)}...`);
      });
    }
    
    // Calculate success metrics
    const memoryGrowth = (finalAgent.system_notes?.length || 0) - (initialAgent.system_notes?.length || 0) +
                        (finalAgent.system_thoughts?.length || 0) - (initialAgent.system_thoughts?.length || 0);
    const toolExecution = finalAgent.tool_call_results?.length || 0;
    const turnProgress = (finalAgent.turnsCount || 0) > (initialAgent.turnsCount || 0);
    
    console.log(`\n🎯 Validation Metrics:`);
    console.log(`   Memory Growth: ${memoryGrowth > 0 ? '✅ YES' : '❌ NO'} (+${memoryGrowth} entries)`);
    console.log(`   Tool Execution: ${toolExecution > 0 ? '✅ YES' : '❌ NO'} (${toolExecution} tools)`);
    console.log(`   Turn Progress: ${turnProgress ? '✅ YES' : '❌ NO'}`);
    
    const overallSuccess = memoryGrowth > 0 && toolExecution > 0 && turnProgress;
    
    // Step 6: Cleanup
    console.log(`\n🧹 Cleaning up validation agent...`);
    await makeRequest(`${BASE_URL}/api/agents/${testAgentId}`, 'DELETE');
    console.log(`✅ Agent ${testAgentId} cleaned up`);
    
    return {
      success: overallSuccess,
      metrics: {
        memoryGrowth,
        toolExecution,
        turnProgress
      }
    };
    
  } catch (error) {
    console.error(`💥 Validation test error:`, error);
    // Cleanup on error
    try {
      await makeRequest(`${BASE_URL}/api/agents/${testAgentId}`, 'DELETE');
      console.log(`🧹 Emergency cleanup completed`);
    } catch (cleanupError) {
      console.error(`⚠️ Cleanup failed:`, cleanupError);
    }
    return { success: false, metrics: null };
  }
}

// Run validation
runValidationTest()
  .then(result => {
    console.log('\n' + '='.repeat(60));
    console.log(`🎯 TOOL EXECUTION VALIDATION RESULTS`);
    console.log('='.repeat(60));
    
    if (result.success) {
      console.log(`🎉 VALIDATION SUCCESS! SpawnKit tool system is operational!`);
      console.log(`🧠 Complete orchestrate → generate → process-tool flow working!`);
      console.log(`📈 Memory evolution and tool execution confirmed!`);
    } else {
      console.log(`❌ VALIDATION FAILED! Tool execution or memory evolution issues detected.`);
      console.log(`🔍 Review timing, KV propagation, or tool execution logic.`);
    }
    
    console.log(`⏰ Validation completed: ${new Date().toISOString()}`);
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Validation crashed:', error);
    process.exit(1);
  }); 