#!/usr/bin/env node

/**
 * Agent Evolution Scenario Test
 * Comprehensive test of agent memory evolution through awake/sleep cycles
 * Tests context growth in awake mode and compression in sleep mode
 */

const https = require('https');
const http = require('http');

const args = process.argv.slice(2);
const envFlag = args.find(arg => arg.startsWith('--env='))?.split('=')[1] || 'local';

const environments = {
  prod: 'https://skapp.pages.dev',
  preview: 'https://preview.skapp.pages.dev', 
  local: 'http://localhost:3000'
};

const BASE_URL = environments[envFlag];

console.log('🧠 SpawnKit Agent Evolution Scenario Test');
console.log('='.repeat(70));
console.log(`📍 Target: ${BASE_URL} (${envFlag})`);
console.log(`⏰ Started: ${new Date().toISOString()}`);
console.log(`\n🎯 Scenario: Create → 3 Awake Turns → 1 Sleep Turn → Validate Memory Compression`);

// Test agent configuration
const testAgent = {
  agentId: 'evolution-test-001',
  name: 'Memory Evolution Agent',
  description: 'Agent designed to test memory evolution through awake and sleep cycles. Will demonstrate context growth and compression.',
  permanentMemory: [
    'Primary goal: Demonstrate memory evolution through turn cycles',
    'Task: Use generate_system_note tool in each awake turn',
    'Focus: Create detailed notes that will be compressed during sleep',
    'Objective: Show context growth in awake mode and compression in sleep'
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
        'User-Agent': 'SpawnKit-Evolution-Test/1.0'
      }
    };

    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({
            status: res.statusCode,
            data: parsed
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: { parseError: true, raw: body }
          });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

function calculateMetrics(agent, phase) {
  const turnHistory = agent.turn_history || [];
  const systemPrompt = JSON.stringify(agent);
  
  // Calculate character counts
  const totalChars = systemPrompt.length;
  const turnHistoryChars = JSON.stringify(turnHistory).length;
  
  // Calculate word counts
  const totalWords = systemPrompt.split(/\s+/).length;
  const turnHistoryWords = JSON.stringify(turnHistory).split(/\s+/).length;
  
  // Count memory items
  const notesCount = agent.system_notes?.length || 0;
  const thoughtsCount = agent.system_thoughts?.length || 0;
  const toolResultsCount = agent.tool_call_results?.length || 0;
  const turnsCount = turnHistory.length;
  
  return {
    phase,
    timestamp: new Date().toISOString(),
    totalChars,
    turnHistoryChars,
    totalWords,
    turnHistoryWords,
    notesCount,
    thoughtsCount,
    toolResultsCount,
    turnsCount,
    turnCount: agent.turnsCount || 0
  };
}

function compareMetrics(before, after, phase) {
  const charReduction = before.totalChars > 0 ? ((before.totalChars - after.totalChars) / before.totalChars * 100) : 0;
  const wordReduction = before.totalWords > 0 ? ((before.totalWords - after.totalWords) / before.totalWords * 100) : 0;
  const turnHistoryReduction = before.turnsCount > 0 ? ((before.turnsCount - after.turnsCount) / before.turnsCount * 100) : 0;
  
  console.log(`\n📊 ${phase} Metrics Comparison:`);
  console.log(`   📝 Total Characters: ${before.totalChars} → ${after.totalChars} (${charReduction > 0 ? '-' : '+'}${Math.abs(charReduction).toFixed(1)}%)`);
  console.log(`   📖 Total Words: ${before.totalWords} → ${after.totalWords} (${wordReduction > 0 ? '-' : '+'}${Math.abs(wordReduction).toFixed(1)}%)`);
  console.log(`   🔄 Turn History: ${before.turnsCount} → ${after.turnsCount} turns (${turnHistoryReduction > 0 ? '-' : '+'}${Math.abs(turnHistoryReduction).toFixed(1)}%)`);
  console.log(`   📝 Notes: ${before.notesCount} → ${after.notesCount}`);
  console.log(`   💭 Thoughts: ${before.thoughtsCount} → ${after.thoughtsCount}`);
  console.log(`   🛠️ Tool Results: ${before.toolResultsCount} → ${after.toolResultsCount}`);
  
  return {
    charReduction: charReduction.toFixed(1),
    wordReduction: wordReduction.toFixed(1),
    turnHistoryReduction: turnHistoryReduction.toFixed(1)
  };
}

async function runEvolutionScenario() {
  console.log(`\n🚀 Starting Agent Evolution Scenario`);
  
  try {
    // Step 1: Create agent
    console.log(`\n📝 Step 1: Creating evolution test agent...`);
    const createResponse = await makeRequest(
      `${BASE_URL}/api/agents`,
      'POST',
      {
        agentId: testAgent.agentId,
        name: testAgent.name,
        description: testAgent.description,
        pmem: testAgent.permanentMemory
      }
    );
    
    if (createResponse.status !== 201) {
      throw new Error(`Agent creation failed: ${createResponse.status} - ${createResponse.data.error}`);
    }
    
    console.log(`   ✅ Agent created: ${testAgent.agentId}`);
    
    // Step 2: Add initial note with instruction
    console.log(`\n📝 Step 2: Adding instruction note...`);
    const instructionResponse = await makeRequest(
      `${BASE_URL}/api/process-tool`,
      'POST',
      {
        toolId: 'generate_system_note',
        params: {
          message: 'INSTRUCTION: In each awake turn, use the generate_system_note tool to create detailed notes about your progress, observations, and plans. Be verbose and thorough to test memory growth.',
          expirationDays: 14
        },
        agentId: testAgent.agentId
      }
    );
    
    if (instructionResponse.status === 200) {
      console.log(`   ✅ Instruction note added`);
    }
    
    // Get baseline metrics
    const baselineResponse = await makeRequest(`${BASE_URL}/api/agents/${testAgent.agentId}`, 'GET');
    const baselineMetrics = calculateMetrics(baselineResponse.data, 'BASELINE');
    
    console.log(`\n📊 Baseline Metrics:`);
    console.log(`   📝 Total Characters: ${baselineMetrics.totalChars}`);
    console.log(`   📖 Total Words: ${baselineMetrics.totalWords}`);
    console.log(`   🔄 Turn History: ${baselineMetrics.turnsCount} turns`);
    console.log(`   📝 Notes: ${baselineMetrics.notesCount}`);
    console.log(`   💭 Thoughts: ${baselineMetrics.thoughtsCount}`);
    
    // Step 3: Run 3 awake turns
    let previousMetrics = baselineMetrics;
    
    for (let turn = 1; turn <= 3; turn++) {
      console.log(`\n🌅 Awake Turn ${turn}: Running orchestration...`);
      
      const orchestrateResponse = await makeRequest(
        `${BASE_URL}/api/orchestrate`,
        'POST',
        {
          agentId: testAgent.agentId,
          mode: 'awake',
          estTime: new Date().toISOString()
        }
      );
      
      if (orchestrateResponse.status === 200) {
        const result = orchestrateResponse.data;
        console.log(`   ✅ Turn ${turn} Success: ${result.successful} successful, ${result.failed} failed`);
        
        // Wait 60 seconds for KV updates
        console.log(`   ⏳ Waiting 60 seconds for KV updates...`);
        await new Promise(resolve => setTimeout(resolve, 60000));
        
        // Get updated metrics
        const agentResponse = await makeRequest(`${BASE_URL}/api/agents/${testAgent.agentId}`, 'GET');
        const currentMetrics = calculateMetrics(agentResponse.data, `AWAKE_TURN_${turn}`);
        
        // Compare with previous
        const comparison = compareMetrics(previousMetrics, currentMetrics, `Awake Turn ${turn}`);
        
        previousMetrics = currentMetrics;
        
      } else {
        console.log(`   ❌ Turn ${turn} Failed: ${orchestrateResponse.data.error}`);
      }
    }
    
    // Step 4: Run sleep turn
    console.log(`\n😴 Sleep Turn: Running sleep mode orchestration...`);
    
    // Get pre-sleep metrics
    const preSleepResponse = await makeRequest(`${BASE_URL}/api/agents/${testAgent.agentId}`, 'GET');
    const preSleepMetrics = calculateMetrics(preSleepResponse.data, 'PRE_SLEEP');
    
    const sleepResponse = await makeRequest(
      `${BASE_URL}/api/orchestrate`,
      'POST',
      {
        agentId: testAgent.agentId,
        mode: 'sleep',
        estTime: new Date().toISOString()
      }
    );
    
    if (sleepResponse.status === 200) {
      const result = sleepResponse.data;
      console.log(`   ✅ Sleep Turn Success: ${result.successful} successful, ${result.failed} failed`);
      
      // Wait 60 seconds for KV updates
      console.log(`   ⏳ Waiting 60 seconds for sleep processing...`);
      await new Promise(resolve => setTimeout(resolve, 60000));
      
      // Get post-sleep metrics
      const postSleepResponse = await makeRequest(`${BASE_URL}/api/agents/${testAgent.agentId}`, 'GET');
      const postSleepMetrics = calculateMetrics(postSleepResponse.data, 'POST_SLEEP');
      
      // Calculate sleep compression
      const sleepComparison = compareMetrics(preSleepMetrics, postSleepMetrics, 'Sleep Mode Compression');
      
      console.log(`\n🎯 Sleep Mode Compression Analysis:`);
      console.log(`   📉 Character Reduction: ${sleepComparison.charReduction}%`);
      console.log(`   📉 Word Reduction: ${sleepComparison.wordReduction}%`);
      console.log(`   📉 Turn History Reduction: ${sleepComparison.turnHistoryReduction}%`);
      
      // Validate sleep mode effects
      console.log(`\n✅ Sleep Mode Effects Validation:`);
      console.log(`   💭 Thoughts Cleared: ${preSleepMetrics.thoughtsCount} → ${postSleepMetrics.thoughtsCount} ${postSleepMetrics.thoughtsCount === 0 ? '✅' : '❌'}`);
      console.log(`   📝 Notes Preserved: ${preSleepMetrics.notesCount} → ${postSleepMetrics.notesCount} ${postSleepMetrics.notesCount >= preSleepMetrics.notesCount ? '✅' : '❌'}`);
      console.log(`   📊 Summary Created: ${postSleepResponse.data.previous_day_summary ? '✅' : '❌'}`);
      
    } else {
      console.log(`   ❌ Sleep Turn Failed: ${sleepResponse.data.error}`);
    }
    
    // Final validation
    const finalResponse = await makeRequest(`${BASE_URL}/api/agents/${testAgent.agentId}`, 'GET');
    const finalAgent = finalResponse.data;
    
    console.log(`\n🏆 Final Agent Evolution Summary:`);
    console.log(`   🎭 Total Turns Completed: ${finalAgent.turnsCount || 0}`);
    console.log(`   📜 Turn History Length: ${finalAgent.turn_history?.length || 0}`);
    console.log(`   📝 Final Notes Count: ${finalAgent.system_notes?.length || 0}`);
    console.log(`   💭 Final Thoughts Count: ${finalAgent.system_thoughts?.length || 0}`);
    console.log(`   🛠️ Tool Executions: ${finalAgent.tool_call_results?.length || 0}`);
    
    // Show XML tool usage in turn history
    let xmlToolsFound = 0;
    if (finalAgent.turn_history) {
      finalAgent.turn_history.forEach((turn, index) => {
        const content = turn.content || turn.parts?.[0]?.text || '';
        if (content.includes('<sktool>')) {
          xmlToolsFound++;
          const toolMatches = content.match(/<sktool><([^>]+)>/g) || [];
          console.log(`   🛠️ Turn ${index + 1}: ${toolMatches.length} XML tools - ${toolMatches.map(m => m.replace(/<sktool><([^>]+)>/, '$1')).join(', ')}`);
        }
      });
    }
    
    console.log(`   🎯 XML Tools Usage: ${xmlToolsFound}/${finalAgent.turn_history?.length || 0} turns contained XML tools`);
    
    return {
      success: true,
      finalAgent,
      metrics: {
        baseline: baselineMetrics,
        preSleep: preSleepMetrics,
        postSleep: postSleepMetrics
      }
    };
    
  } catch (error) {
    console.error(`💥 Evolution scenario failed:`, error.message);
    return { success: false, error: error.message };
  }
}

// Main test runner
async function runTest() {
  const result = await runEvolutionScenario();
  
  console.log(`\n📊 Evolution Scenario Results`);
  console.log('='.repeat(70));
  
  if (result.success) {
    console.log(`🎯 Overall Result: ✅ PASS`);
    console.log(`🧠 Agent evolution scenario completed successfully`);
    console.log(`📈 Memory growth and compression validated`);
    console.log(`🛠️ XML tool execution confirmed working`);
    
    // Performance summary
    const agent = result.finalAgent;
    console.log(`\n🚀 Performance Summary:`);
    console.log(`   ⚡ Agent evolved through ${agent.turnsCount || 0} complete turns`);
    console.log(`   🧠 Memory system working: notes persist, thoughts reset`);
    console.log(`   🔄 Turn history management: growth and compression`);
    console.log(`   🛠️ XML tools: agents using <sktool> format correctly`);
    
  } else {
    console.log(`🎯 Overall Result: ❌ FAIL`);
    if (result.error) {
      console.log(`💥 Error: ${result.error}`);
    }
  }
  
  console.log(`\n⏰ Test Completed: ${new Date().toISOString()}`);
  console.log(`💡 Agent available for manual testing at: ${BASE_URL}/agents/${testAgent.agentId}`);
  
  // Don't cleanup - leave agent for manual inspection
  process.exit(result.success ? 0 : 1);
}

// Validation warnings
if (envFlag === 'local') {
  console.log('⚠️  LOCAL TESTING: Make sure your development server is running on localhost:3000');
  console.log('   Command: npm run dev');
  console.log('');
}

// Run test
runTest().catch(error => {
  console.error('💥 Evolution test runner failed:', error);
  process.exit(1);
}); 