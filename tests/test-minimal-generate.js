#!/usr/bin/env node

/**
 * Minimal Generate API Test
 * Tests just the generate API to see what's happening
 */

const https = require('https');
const http = require('http');

console.log('🔬 Minimal Generate API Test');
console.log('='.repeat(40));

const testAgent = {
  agentId: 'minimal-test-' + Date.now(),
  name: 'Minimal Test Agent',
  description: 'Test agent to debug generate API',
  system_permanent_memory: ['Mission: Test generate API']
};

async function makeRequest(url, method, data) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 3000,
      path: urlObj.pathname,
      method: method,
      headers: { 'Content-Type': 'application/json' }
    };

    const req = http.request(options, (res) => {
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
    // Create agent
    console.log('🏗️  Creating agent...');
    const createResponse = await makeRequest('http://localhost:3000/api/agents', 'POST', testAgent);
    
    if (createResponse.status !== 200 && createResponse.status !== 201) {
      console.error('❌ Agent creation failed:', createResponse.data);
      return false;
    }
    
    console.log(`✅ Agent created: ${testAgent.agentId}`);
    
    // Test generate API with explicit tool instruction
    console.log('🎭 Testing generate API...');
    
    const generatePayload = {
      agentId: testAgent.agentId,
      systemPrompt: `You are a SpawnKit agent. Your available tools:
**GENERATE_SYSTEM_NOTE**: <sktool><generate_system_note><message>Your note</message><expirationDays>7</expirationDays></generate_system_note></sktool>
**GENERATE_SYSTEM_THOUGHT**: <sktool><generate_system_thought><message>Your thought</message></generate_system_thought></sktool>

Use these tools to create a business note and a strategic thought.`,
      turnHistory: [],
      turnPrompt: "Create a strategic business note about AI opportunities and record a thought about next steps. Use the XML tool format exactly as shown.",
      mode: 'awake'
    };
    
    const generateResponse = await makeRequest(`http://localhost:3000/api/agents/${testAgent.agentId}/generate`, 'POST', generatePayload);
    
    console.log('📊 Generate Response Status:', generateResponse.status);
    console.log('📝 Generate Response:', JSON.stringify(generateResponse.data, null, 2));
    
    // Check agent state
    console.log('🔍 Checking final agent state...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const agentResponse = await makeRequest(`http://localhost:3000/api/agents/${testAgent.agentId}`, 'GET');
    const agent = agentResponse.data;
    
    console.log('📊 Final Agent State:');
    console.log(`   Notes: ${agent.system_notes?.length || 0}`);
    console.log(`   Thoughts: ${agent.system_thoughts?.length || 0}`);
    console.log(`   Tool Results: ${agent.tool_call_results?.length || 0}`);
    
    // Cleanup
    await makeRequest(`http://localhost:3000/api/agents/${testAgent.agentId}`, 'DELETE');
    
    const success = (agent.tool_call_results?.length || 0) > 0;
    console.log(`\n🎯 Result: ${success ? 'SUCCESS' : 'FAILED'}`);
    
    return success;
    
  } catch (error) {
    console.error('💥 Test error:', error);
    return false;
  }
}

runTest()
  .then(success => process.exit(success ? 0 : 1))
  .catch(error => {
    console.error('💥 Test crashed:', error);
    process.exit(1);
  }); 