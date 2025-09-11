#!/usr/bin/env node

/**
 * Simple Tool Execution Check
 * Creates agent and runs one turn to verify tool system is working
 * 
 * Usage: node tests/test-simple-tool-check.js --env=local
 */

const https = require('https');
const http = require('http');

const args = process.argv.slice(2);
const envFlag = args.find(arg => arg.startsWith('--env='))?.split('=')[1] || 'local';

const BASE_URL = envFlag === 'local' ? 'http://localhost:3000' : 
                 envFlag === 'preview' ? 'https://preview.skapp.pages.dev' : 
                 'https://skapp.pages.dev';

console.log('⚡ Simple Tool Execution Check');
console.log('='.repeat(40));
console.log(`📍 Target: ${BASE_URL} (${envFlag})`);
console.log(`⏰ Started: ${new Date().toISOString()}`);

const testAgent = {
  agentId: 'simple-tool-' + Date.now(),
  name: 'Tool Test Agent',
  description: 'Agent designed to test SpawnKit revolutionary tool system with enhanced descriptions and strategic business focus.',
  system_permanent_memory: [
    'Mission: Test SpawnKit tools for strategic business value creation',
    'Goal: Demonstrate persistent memory evolution and tool usage',
    'Focus: Use tools to communicate insights and build institutional knowledge'
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
        'User-Agent': 'SpawnKit-SimpleTest/1.0'
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

async function runTest() {
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
    console.log(`\n🔍 Checking initial state...`);
    const initialResponse = await makeRequest(`${BASE_URL}/api/agents/${testAgent.agentId}`, 'GET');
    const initialAgent = initialResponse.data;
    
    console.log(`📊 Initial State:`);
    console.log(`   Notes: ${initialAgent.system_notes?.length || 0}`);
    console.log(`   Thoughts: ${initialAgent.system_thoughts?.length || 0}`);
    console.log(`   Tool Results: ${initialAgent.tool_call_results?.length || 0}`);
    
    // Step 3: Run agent turn
    console.log(`\n🎭 Running agent turn...`);
    const turnResponse = await makeRequest(`${BASE_URL}/api/orchestrate`, 'POST', {
      agentId: testAgent.agentId,
      mode: 'awake'
    });
    
    if (turnResponse.status !== 200) {
      console.error(`❌ Turn failed:`, turnResponse.data);
      return false;
    }
    
    console.log(`✅ Turn completed successfully`);
    
    // Step 4: Wait and check final state
    console.log(`\n⏱️  Waiting 10s for KV propagation...`);
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    console.log(`🔍 Checking final state...`);
    const finalResponse = await makeRequest(`${BASE_URL}/api/agents/${testAgent.agentId}`, 'GET');
    const finalAgent = finalResponse.data;
    
    console.log(`📊 Final State:`);
    console.log(`   Notes: ${finalAgent.system_notes?.length || 0} (was ${initialAgent.system_notes?.length || 0})`);
    console.log(`   Thoughts: ${finalAgent.system_thoughts?.length || 0} (was ${initialAgent.system_thoughts?.length || 0})`);
    console.log(`   Tool Results: ${finalAgent.tool_call_results?.length || 0} (was ${initialAgent.tool_call_results?.length || 0})`);
    console.log(`   Turn Count: ${finalAgent.turnsCount || 0}`);
    console.log(`   Turn Enhancement: ${finalAgent.turn_prompt_enhancement ? 'SET' : 'NOT SET'}`);
    
    // Analyze changes
    const notesGrowth = (finalAgent.system_notes?.length || 0) - (initialAgent.system_notes?.length || 0);
    const thoughtsGrowth = (finalAgent.system_thoughts?.length || 0) - (initialAgent.system_thoughts?.length || 0);
    const toolResultsGrowth = (finalAgent.tool_call_results?.length || 0) - (initialAgent.tool_call_results?.length || 0);
    
    console.log(`\n🔬 Growth Analysis:`);
    console.log(`   Notes Growth: +${notesGrowth}`);
    console.log(`   Thoughts Growth: +${thoughtsGrowth}`);
    console.log(`   Tool Results Growth: +${toolResultsGrowth}`);
    
    // Show actual content
    if (finalAgent.system_notes && finalAgent.system_notes.length > 0) {
      console.log(`\n📝 Recent Notes:`);
      finalAgent.system_notes.slice(-2).forEach((note, i) => {
        const content = typeof note === 'string' ? note : note.content;
        console.log(`   ${i + 1}. ${content.substring(0, 100)}...`);
      });
    }
    
    if (finalAgent.system_thoughts && finalAgent.system_thoughts.length > 0) {
      console.log(`\n💭 Recent Thoughts:`);
      finalAgent.system_thoughts.slice(-2).forEach((thought, i) => {
        console.log(`   ${i + 1}. ${thought.substring(0, 100)}...`);
      });
    }
    
    if (finalAgent.tool_call_results && finalAgent.tool_call_results.length > 0) {
      console.log(`\n🛠️  Tool Executions:`);
      finalAgent.tool_call_results.slice(-3).forEach((result, i) => {
        console.log(`   ${i + 1}. ${result.substring(0, 120)}...`);
      });
    }
    
    // Success criteria
    const toolsWorking = toolResultsGrowth > 0;
    const memoryEvolution = notesGrowth > 0 || thoughtsGrowth > 0;
    
    console.log(`\n🎯 Success Check:`);
    console.log(`   Tools Executed: ${toolsWorking ? '✅ YES' : '❌ NO'}`);
    console.log(`   Memory Evolution: ${memoryEvolution ? '✅ YES' : '❌ NO'}`);
    
    const success = toolsWorking && memoryEvolution;
    
    // Step 5: Cleanup
    console.log(`\n🧹 Cleaning up...`);
    await makeRequest(`${BASE_URL}/api/agents/${testAgent.agentId}`, 'DELETE');
    
    // Final result
    console.log('\n' + '='.repeat(40));
    if (success) {
      console.log(`🎉 SUCCESS! Tool system is working!`);
      console.log(`🧠 Enhanced descriptions are guiding agents!`);
    } else {
      console.log(`❌ FAILED! Tools not executing or memory not evolving.`);
    }
    console.log(`⏰ Completed: ${new Date().toISOString()}`);
    
    return success;
    
  } catch (error) {
    console.error(`💥 Test error:`, error);
    // Cleanup on error
    await makeRequest(`${BASE_URL}/api/agents/${testAgent.agentId}`, 'DELETE');
    return false;
  }
}

runTest()
  .then(success => process.exit(success ? 0 : 1))
  .catch(error => {
    console.error('💥 Test crashed:', error);
    process.exit(1);
  }); 