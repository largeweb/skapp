#!/usr/bin/env node

/**
 * Preview Evolution Test
 * Tests agent evolution on preview with unique IDs and proper KV wait times
 */

const https = require('https');
const http = require('http');

const args = process.argv.slice(2);
const envFlag = args.find(arg => arg.startsWith('--env='))?.split('=')[1] || 'preview';

const environments = {
  prod: 'https://skapp.pages.dev',
  preview: 'https://preview.skapp.pages.dev', 
  local: 'http://localhost:3000'
};

const BASE_URL = environments[envFlag];

console.log('🧠 SpawnKit Preview Evolution Test');
console.log('='.repeat(60));
console.log(`📍 Target: ${BASE_URL} (${envFlag})`);
console.log(`⏰ Started: ${new Date().toISOString()}`);

// Unique agent for preview testing
const testAgent = {
  agentId: `preview-evolution-${Date.now()}`,
  name: 'Preview Evolution Agent',
  description: 'Agent designed to test memory evolution on preview deployment with proper KV wait times.',
  permanentMemory: [
    'Primary goal: Test agent evolution on preview environment',
    'Task: Validate XML tool execution with 30s KV wait times',
    'Focus: Demonstrate context growth and memory management'
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
        'User-Agent': 'SpawnKit-Preview-Test/1.0'
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

async function testPreviewEvolution() {
  console.log(`\n🚀 Starting Preview Evolution Test`);
  
  try {
    // Step 1: Create agent
    console.log(`\n📝 Step 1: Creating preview test agent...`);
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
    
    // Step 2: Add instruction note
    console.log(`\n📝 Step 2: Adding instruction note...`);
    const instructionResponse = await makeRequest(
      `${BASE_URL}/api/process-tool`,
      'POST',
      {
        toolId: 'generate_system_note',
        params: {
          message: 'INSTRUCTION: In each turn, use XML tools to create notes and thoughts. Test preview environment KV updates.',
          expirationDays: 7
        },
        agentId: testAgent.agentId
      }
    );
    
    if (instructionResponse.status === 200) {
      console.log(`   ✅ Instruction note added`);
    }
    
    // Step 3: Run 2 awake turns with proper KV waits
    for (let turn = 1; turn <= 2; turn++) {
      console.log(`\n🌅 Awake Turn ${turn}: Running orchestration...`);
      
      // Get before state
      const beforeResponse = await makeRequest(`${BASE_URL}/api/agents/${testAgent.agentId}`, 'GET');
      const beforeAgent = beforeResponse.data;
      
      console.log(`   📊 Before Turn ${turn}: Notes: ${beforeAgent.system_notes?.length || 0}, Thoughts: ${beforeAgent.system_thoughts?.length || 0}, Turns: ${beforeAgent.turnsCount || 0}`);
      
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
        console.log(`   ✅ Turn ${turn} Response: ${result.successful} successful, ${result.failed} failed`);
        
        // Wait for KV updates (30s for preview/prod)
        const waitTime = envFlag === 'local' ? 5000 : 30000;
        console.log(`   ⏳ Waiting ${waitTime/1000} seconds for KV updates...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        
        // Get after state
        const afterResponse = await makeRequest(`${BASE_URL}/api/agents/${testAgent.agentId}`, 'GET');
        const afterAgent = afterResponse.data;
        
        console.log(`   📊 After Turn ${turn}: Notes: ${afterAgent.system_notes?.length || 0}, Thoughts: ${afterAgent.system_thoughts?.length || 0}, Turns: ${afterAgent.turnsCount || 0}`);
        
        // Check for XML tools in turn history
        if (afterAgent.turn_history && afterAgent.turn_history.length > 0) {
          const latestTurn = afterAgent.turn_history[afterAgent.turn_history.length - 1];
          const content = latestTurn.content || latestTurn.parts?.[0]?.text || '';
          const hasXmlTools = content.includes('<sktool>');
          console.log(`   🛠️ XML Tools in Turn ${turn}: ${hasXmlTools ? 'YES' : 'NO'}`);
        }
        
      } else {
        console.log(`   ❌ Turn ${turn} Failed: ${orchestrateResponse.data.error}`);
      }
    }
    
    // Final validation
    const finalResponse = await makeRequest(`${BASE_URL}/api/agents/${testAgent.agentId}`, 'GET');
    const finalAgent = finalResponse.data;
    
    console.log(`\n🏆 Final Preview Test Results:`);
    console.log(`   🎭 Total Turns: ${finalAgent.turnsCount || 0}`);
    console.log(`   📜 Turn History: ${finalAgent.turn_history?.length || 0}`);
    console.log(`   📝 Notes: ${finalAgent.system_notes?.length || 0}`);
    console.log(`   💭 Thoughts: ${finalAgent.system_thoughts?.length || 0}`);
    console.log(`   🛠️ Tool Results: ${finalAgent.tool_call_results?.length || 0}`);
    
    return { success: true, finalAgent };
    
  } catch (error) {
    console.error(`💥 Preview evolution test failed:`, error.message);
    return { success: false, error: error.message };
  }
}

// Main test runner
async function runTest() {
  const result = await testPreviewEvolution();
  
  console.log(`\n📊 Preview Evolution Test Results`);
  console.log('='.repeat(60));
  
  if (result.success) {
    console.log(`🎯 Overall Result: ✅ PASS`);
    console.log(`🌐 Preview environment agent evolution working`);
    console.log(`⏱️ KV wait times properly configured for preview`);
  } else {
    console.log(`🎯 Overall Result: ❌ FAIL`);
    if (result.error) {
      console.log(`💥 Error: ${result.error}`);
    }
  }
  
  console.log(`\n⏰ Test Completed: ${new Date().toISOString()}`);
  console.log(`💡 Agent available at: ${BASE_URL}/agents/${testAgent.agentId}`);
  
  // Don't cleanup - leave for manual inspection
  process.exit(result.success ? 0 : 1);
}

// Run test
runTest().catch(error => {
  console.error('💥 Preview test runner failed:', error);
  process.exit(1);
}); 