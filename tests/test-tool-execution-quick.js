#!/usr/bin/env node

/**
 * Quick Tool Execution Test
 * Fast verification that our 4 required tools are working with enhanced descriptions
 * 
 * Flow: Create agent → Add instruction → Run turn → Check KV changes → Cleanup
 * 
 * Usage: node tests/test-tool-execution-quick.js --env=local
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

console.log('⚡ Quick Tool Execution Test');
console.log('='.repeat(50));
console.log(`📍 Target: ${BASE_URL} (${envFlag})`);
console.log(`⏰ Started: ${new Date().toISOString()}`);

const testAgent = {
  agentId: 'tool-test-' + Date.now(),
  name: 'Tool Test Agent',
  description: 'Agent designed to test the 4 required tools with enhanced SpawnKit descriptions.',
  system_permanent_memory: [
    'Mission: Test all 4 required SpawnKit tools',
    'Goal: Demonstrate strategic tool usage for business value creation'
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
        'User-Agent': 'SpawnKit-QuickTest/1.0'
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

async function step1_CreateAgent() {
  console.log(`\n🏗️  STEP 1: Creating test agent`);
  
  const response = await makeRequest(`${BASE_URL}/api/agents`, 'POST', testAgent);
  
  if (response.status === 200 || response.status === 201) {
    console.log(`✅ Agent created: ${testAgent.agentId}`);
    return true;
  } else {
    console.error(`❌ Agent creation failed:`, response.data);
    return false;
  }
}

async function step2_AddInstructionNote() {
  console.log(`\n📝 STEP 2: Adding strategic instruction note`);
  
  const instruction = `Your next turn should demonstrate SpawnKit's revolutionary tool system: 1) Create a strategic business note using generate_system_note, 2) Record a thought about your progress using generate_system_thought, 3) Set your next turn goal using generate_turn_prompt_enhancement. Focus on business value creation and human communication.`;
  
  const response = await makeRequest(`${BASE_URL}/api/agents/${testAgent.agentId}/memory?layer=system_notes`, 'POST', {
    content: instruction,
    expires_in_days: 1
  });
  
  if (response.status === 200) {
    console.log(`✅ Instruction note added`);
    return true;
  } else {
    console.error(`❌ Failed to add instruction:`, response.data);
    return false;
  }
}

async function step3_VerifyInitialState() {
  console.log(`\n🔍 STEP 3: Checking initial agent state`);
  
  const response = await makeRequest(`${BASE_URL}/api/agents/${testAgent.agentId}`, 'GET');
  
  if (response.status === 200) {
    const agent = response.data;
    console.log(`📊 Initial State:`);
    console.log(`   Notes: ${agent.system_notes?.length || 0}`);
    console.log(`   Thoughts: ${agent.system_thoughts?.length || 0}`);
    console.log(`   Tool Results: ${agent.tool_call_results?.length || 0}`);
    console.log(`   Turn Count: ${agent.turnsCount || 0}`);
    return agent;
  } else {
    console.error(`❌ Failed to get initial state:`, response.data);
    return null;
  }
}

async function step4_RunAgentTurn() {
  console.log(`\n🎭 STEP 4: Running agent turn with enhanced tool descriptions`);
  
  const response = await makeRequest(`${BASE_URL}/api/orchestrate`, 'POST', {
    agentId: testAgent.agentId,
    mode: 'awake'
  });
  
  if (response.status === 200) {
    const result = response.data;
    console.log(`✅ Turn completed: ${result.successful || 0} successful, ${result.failed || 0} failed`);
    console.log(`📋 Results: ${JSON.stringify(result.results || [], null, 2)}`);
    return result;
  } else {
    console.error(`❌ Turn failed:`, response.data);
    return null;
  }
}

async function step5_VerifyToolExecution() {
  console.log(`\n🔍 STEP 5: Verifying tool execution and KV changes`);
  
  // Wait for KV propagation
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  const response = await makeRequest(`${BASE_URL}/api/agents/${testAgent.agentId}`, 'GET');
  
  if (response.status === 200) {
    const agent = response.data;
    
    console.log(`📊 Final State Analysis:`);
    console.log(`   Notes: ${agent.system_notes?.length || 0} entries`);
    console.log(`   Thoughts: ${agent.system_thoughts?.length || 0} entries`);
    console.log(`   Tool Results: ${agent.tool_call_results?.length || 0} results`);
    console.log(`   Turn Count: ${agent.turnsCount || 0}`);
    console.log(`   Turn Enhancement: ${agent.turn_prompt_enhancement ? '✅ Set' : '❌ Not Set'}`);
    
    // Detailed analysis
    console.log(`\n📝 Notes Analysis:`);
    if (agent.system_notes && agent.system_notes.length > 0) {
      agent.system_notes.forEach((note, i) => {
        const content = typeof note === 'string' ? note : note.content;
        const expires = typeof note === 'object' && note.expires_at ? 
          ` (expires: ${new Date(note.expires_at).toLocaleDateString()})` : '';
        console.log(`   ${i + 1}. ${content.substring(0, 100)}...${expires}`);
      });
    } else {
      console.log(`   No notes found`);
    }
    
    console.log(`\n💭 Thoughts Analysis:`);
    if (agent.system_thoughts && agent.system_thoughts.length > 0) {
      agent.system_thoughts.forEach((thought, i) => {
        console.log(`   ${i + 1}. ${thought.substring(0, 100)}...`);
      });
    } else {
      console.log(`   No thoughts found`);
    }
    
    console.log(`\n🛠️  Tool Execution Analysis:`);
    if (agent.tool_call_results && agent.tool_call_results.length > 0) {
      agent.tool_call_results.forEach((result, i) => {
        console.log(`   ${i + 1}. ${result.substring(0, 120)}...`);
      });
    } else {
      console.log(`   No tool executions found`);
    }
    
    // Success criteria
    const hasNewNotes = agent.system_notes && agent.system_notes.length > 1; // Original instruction + new notes
    const hasNewThoughts = agent.system_thoughts && agent.system_thoughts.length > 0;
    const hasToolResults = agent.tool_call_results && agent.tool_call_results.length > 0;
    const hasTurnEnhancement = !!agent.turn_prompt_enhancement;
    
    console.log(`\n🎯 Success Criteria Check:`);
    console.log(`   ✅ New Notes Created: ${hasNewNotes ? 'YES' : 'NO'}`);
    console.log(`   ✅ Thoughts Recorded: ${hasNewThoughts ? 'YES' : 'NO'}`);
    console.log(`   ✅ Tools Executed: ${hasToolResults ? 'YES' : 'NO'}`);
    console.log(`   ✅ Turn Enhancement Set: ${hasTurnEnhancement ? 'YES' : 'NO'}`);
    
    const overallSuccess = hasToolResults && (hasNewNotes || hasNewThoughts);
    
    return { success: overallSuccess, agent };
  } else {
    console.error(`❌ Failed to verify final state:`, response.data);
    return { success: false, agent: null };
  }
}

async function step6_Cleanup() {
  console.log(`\n🧹 STEP 6: Cleaning up test agent`);
  
  const response = await makeRequest(`${BASE_URL}/api/agents/${testAgent.agentId}`, 'DELETE');
  
  if (response.status === 200) {
    console.log(`✅ Test agent cleaned up`);
  } else {
    console.log(`⚠️  Cleanup warning: ${response.status}`);
  }
}

async function runQuickTest() {
  try {
    console.log(`\n🧪 Quick Tool Execution Test Starting...\n`);
    
    // Execute test steps
    const step1 = await step1_CreateAgent();
    if (!step1) return false;
    
    const step2 = await step2_AddInstructionNote();
    if (!step2) return false;
    
    const initialState = await step3_VerifyInitialState();
    if (!initialState) return false;
    
    const turnResult = await step4_RunAgentTurn();
    if (!turnResult) return false;
    
    const verification = await step5_VerifyToolExecution();
    
    await step6_Cleanup();
    
    // Final report
    console.log('\n' + '='.repeat(50));
    console.log(`🎯 QUICK TOOL TEST RESULTS`);
    console.log('='.repeat(50));
    
    if (verification.success) {
      console.log(`🎉 SUCCESS! Revolutionary tool system is working!`);
      console.log(`🧠 Agent successfully used SpawnKit tools for strategic evolution!`);
      console.log(`📈 Enhanced tool descriptions are guiding agents effectively!`);
    } else {
      console.log(`❌ FAILED! Tool execution or memory evolution not detected.`);
      console.log(`🔍 Check logs above for specific issues.`);
    }
    
    console.log(`⏰ Completed: ${new Date().toISOString()}`);
    
    return verification.success;
    
  } catch (error) {
    console.error('💥 Test failed with error:', error);
    await step6_Cleanup();
    return false;
  }
}

// Run the test
runQuickTest()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Test suite crashed:', error);
    process.exit(1);
  }); 