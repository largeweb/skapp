#!/usr/bin/env node

/**
 * Direct Tool Call Test
 * Directly tests the process-tool API to verify it's working
 * 
 * Usage: node tests/test-direct-tool-call.js --env=local
 */

const https = require('https');
const http = require('http');

const args = process.argv.slice(2);
const envFlag = args.find(arg => arg.startsWith('--env='))?.split('=')[1] || 'local';

const BASE_URL = envFlag === 'local' ? 'http://localhost:3000' : 
                 envFlag === 'preview' ? 'https://preview.skapp.pages.dev' : 
                 'https://skapp.pages.dev';

console.log('🔧 Direct Tool Call Test');
console.log('='.repeat(40));
console.log(`📍 Target: ${BASE_URL} (${envFlag})`);

const testAgent = {
  agentId: 'direct-tool-' + Date.now(),
  name: 'Direct Tool Test Agent',
  description: 'Agent for testing direct tool API calls.',
  system_permanent_memory: ['Mission: Test direct tool execution']
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
        'User-Agent': 'SpawnKit-DirectTest/1.0'
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

async function runDirectToolTest() {
  try {
    // Step 1: Create agent
    console.log(`\n🏗️  Creating test agent...`);
    const createResponse = await makeRequest(`${BASE_URL}/api/agents`, 'POST', testAgent);
    
    if (createResponse.status !== 200 && createResponse.status !== 201) {
      console.error(`❌ Agent creation failed:`, createResponse.data);
      return false;
    }
    
    console.log(`✅ Agent created: ${testAgent.agentId}`);
    
    // Step 2: Get initial state
    const initialResponse = await makeRequest(`${BASE_URL}/api/agents/${testAgent.agentId}`, 'GET');
    const initialAgent = initialResponse.data;
    
    console.log(`📊 Initial State:`);
    console.log(`   Notes: ${initialAgent.system_notes?.length || 0}`);
    console.log(`   Thoughts: ${initialAgent.system_thoughts?.length || 0}`);
    console.log(`   Tool Results: ${initialAgent.tool_call_results?.length || 0}`);
    
    // Step 3: Test each required tool directly
    const toolTests = [
      {
        name: 'Generate System Note',
        toolId: 'generate_system_note',
        params: {
          message: 'Direct API test note - verifying SpawnKit tool execution works correctly',
          expirationDays: 7
        }
      },
      {
        name: 'Generate System Thought',
        toolId: 'generate_system_thought', 
        params: {
          message: 'Direct API test thought - checking if thoughts are recorded properly'
        }
      },
      {
        name: 'Generate Turn Prompt Enhancement',
        toolId: 'generate_turn_prompt_enhancement',
        params: {
          message: 'Next turn should focus on validating the complete tool execution pipeline'
        }
      }
    ];
    
    console.log(`\n🛠️  Testing ${toolTests.length} tools directly...`);
    
    for (let i = 0; i < toolTests.length; i++) {
      const test = toolTests[i];
      console.log(`\n🔧 Testing: ${test.name}`);
      
      const toolResponse = await makeRequest(`${BASE_URL}/api/process-tool`, 'POST', {
        toolId: test.toolId,
        params: test.params,
        agentId: testAgent.agentId
      });
      
      if (toolResponse.status === 200) {
        console.log(`   ✅ ${test.name}: ${toolResponse.data.result}`);
      } else {
        console.error(`   ❌ ${test.name} failed:`, toolResponse.data);
      }
    }
    
    // Step 4: Check final state after direct tool calls
    console.log(`\n⏱️  Waiting 5s then checking final state...`);
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const finalResponse = await makeRequest(`${BASE_URL}/api/agents/${testAgent.agentId}`, 'GET');
    const finalAgent = finalResponse.data;
    
    console.log(`📊 Final State After Direct Tool Calls:`);
    console.log(`   Notes: ${finalAgent.system_notes?.length || 0} (was ${initialAgent.system_notes?.length || 0})`);
    console.log(`   Thoughts: ${finalAgent.system_thoughts?.length || 0} (was ${initialAgent.system_thoughts?.length || 0})`);
    console.log(`   Tool Results: ${finalAgent.tool_call_results?.length || 0} (was ${initialAgent.tool_call_results?.length || 0})`);
    console.log(`   Turn Enhancement: ${finalAgent.turn_prompt_enhancement ? 'SET' : 'NOT SET'}`);
    
    // Show new content
    if (finalAgent.system_notes && finalAgent.system_notes.length > initialAgent.system_notes?.length) {
      console.log(`\n📝 New Notes:`);
      const newNotes = finalAgent.system_notes.slice(initialAgent.system_notes?.length || 0);
      newNotes.forEach((note, i) => {
        const content = typeof note === 'string' ? note : note.content;
        console.log(`   ${i + 1}. ${content}`);
      });
    }
    
    if (finalAgent.system_thoughts && finalAgent.system_thoughts.length > initialAgent.system_thoughts?.length) {
      console.log(`\n💭 New Thoughts:`);
      const newThoughts = finalAgent.system_thoughts.slice(initialAgent.system_thoughts?.length || 0);
      newThoughts.forEach((thought, i) => {
        console.log(`   ${i + 1}. ${thought}`);
      });
    }
    
    if (finalAgent.tool_call_results && finalAgent.tool_call_results.length > 0) {
      console.log(`\n🛠️  Tool Results:`);
      finalAgent.tool_call_results.forEach((result, i) => {
        console.log(`   ${i + 1}. ${result}`);
      });
    }
    
    // Step 5: Cleanup
    console.log(`\n🧹 Cleaning up...`);
    await makeRequest(`${BASE_URL}/api/agents/${testAgent.agentId}`, 'DELETE');
    
    const toolsWorked = finalAgent.tool_call_results?.length > 0;
    const memoryGrew = (finalAgent.system_notes?.length || 0) > (initialAgent.system_notes?.length || 0) ||
                       (finalAgent.system_thoughts?.length || 0) > (initialAgent.system_thoughts?.length || 0);
    
    console.log('\n' + '='.repeat(40));
    console.log(`🎯 DIRECT TOOL TEST RESULTS:`);
    console.log(`   Tools Executed: ${toolsWorked ? '✅ YES' : '❌ NO'}`);
    console.log(`   Memory Updated: ${memoryGrew ? '✅ YES' : '❌ NO'}`);
    console.log('='.repeat(40));
    
    return toolsWorked && memoryGrew;
    
  } catch (error) {
    console.error(`💥 Direct tool test error:`, error);
    await makeRequest(`${BASE_URL}/api/agents/${testAgent.agentId}`, 'DELETE');
    return false;
  }
}

runDirectToolTest()
  .then(success => process.exit(success ? 0 : 1))
  .catch(error => {
    console.error('💥 Test crashed:', error);
    process.exit(1);
  }); 