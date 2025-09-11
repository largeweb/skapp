#!/usr/bin/env node

/**
 * Debug Agent Response Test
 * Creates agent and calls generate API directly to see what response is generated
 * 
 * Usage: node tests/test-debug-agent-response.js --env=local
 */

const https = require('https');
const http = require('http');

const args = process.argv.slice(2);
const envFlag = args.find(arg => arg.startsWith('--env='))?.split('=')[1] || 'local';

const BASE_URL = envFlag === 'local' ? 'http://localhost:3000' : 
                 envFlag === 'preview' ? 'https://preview.skapp.pages.dev' : 
                 'https://skapp.pages.dev';

console.log('🔍 Debug Agent Response Test');
console.log('='.repeat(50));
console.log(`📍 Target: ${BASE_URL} (${envFlag})`);

const testAgent = {
  agentId: 'debug-agent-' + Date.now(),
  name: 'Debug Test Agent',
  description: 'Agent for debugging SpawnKit tool generation and parsing.',
  system_permanent_memory: [
    'Mission: Generate tool calls for debugging purposes',
    'Goal: Test the enhanced SpawnKit tool descriptions'
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
        'User-Agent': 'SpawnKit-Debug/1.0'
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

async function runDebugTest() {
  try {
    // Step 1: Create agent
    console.log(`\n🏗️  Creating debug agent...`);
    const createResponse = await makeRequest(`${BASE_URL}/api/agents`, 'POST', testAgent);
    
    if (createResponse.status !== 200 && createResponse.status !== 201) {
      console.error(`❌ Agent creation failed:`, createResponse.data);
      return false;
    }
    
    console.log(`✅ Agent created: ${testAgent.agentId}`);
    
    // Step 2: Get agent context to see system prompt
    console.log(`\n🔍 Getting agent context to see system prompt...`);
    const contextResponse = await makeRequest(`${BASE_URL}/api/agents/${testAgent.agentId}/context`, 'POST', {
      mode: 'awake'
    });
    
    if (contextResponse.status === 200) {
      console.log(`📋 System Prompt Preview (first 500 chars):`);
      console.log(contextResponse.data.systemPrompt.substring(0, 500) + '...');
      
      // Check if tool descriptions are present
      const hasToolDescriptions = contextResponse.data.systemPrompt.includes('GENERATE_SYSTEM_NOTE');
      console.log(`🛠️  Enhanced Tool Descriptions Present: ${hasToolDescriptions ? '✅ YES' : '❌ NO'}`);
    }
    
    // Step 3: Call generate API directly to see response
    console.log(`\n🎭 Calling generate API directly...`);
    
    // Build a simple payload like orchestrate does
    const generatePayload = {
      agentId: testAgent.agentId,
      systemPrompt: contextResponse.data.systemPrompt,
      turnHistory: [],
      turnPrompt: "Use your SpawnKit tools to create a strategic note about AI market opportunities and record a thought about your next steps. Demonstrate the revolutionary tool system.",
      mode: 'awake'
    };
    
    const generateResponse = await makeRequest(`${BASE_URL}/api/agents/${testAgent.agentId}/generate`, 'POST', generatePayload);
    
    if (generateResponse.status === 200) {
      console.log(`✅ Generate API completed successfully`);
      console.log(`📝 Generated Content (first 800 chars):`);
      console.log(generateResponse.data.content.substring(0, 800) + '...');
      
      // Check for tool calls in response
      const hasSktools = generateResponse.data.content.includes('<sktool>');
      const hasToolCalls = generateResponse.data.content.includes('generate_system_note') || 
                          generateResponse.data.content.includes('generate_system_thought');
      
      console.log(`\n🔬 Tool Call Analysis:`);
      console.log(`   Contains <sktool> tags: ${hasSktools ? '✅ YES' : '❌ NO'}`);
      console.log(`   Contains tool names: ${hasToolCalls ? '✅ YES' : '❌ NO'}`);
      
      if (hasSktools) {
        // Extract tool calls for analysis
        const sktoolMatches = generateResponse.data.content.match(/<sktool>[\s\S]*?<\/sktool>/g);
        if (sktoolMatches) {
          console.log(`\n🛠️  Found ${sktoolMatches.length} tool call(s):`);
          sktoolMatches.forEach((match, i) => {
            console.log(`   ${i + 1}. ${match}`);
          });
        }
      }
      
    } else {
      console.error(`❌ Generate API failed:`, generateResponse.data);
    }
    
    // Step 4: Check final agent state after generate
    console.log(`\n⏱️  Waiting 5s then checking final agent state...`);
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const finalResponse = await makeRequest(`${BASE_URL}/api/agents/${testAgent.agentId}`, 'GET');
    const finalAgent = finalResponse.data;
    
         console.log(`📊 Final Agent State:`);
     console.log(`   Notes: ${finalAgent.system_notes?.length || 0}`);
     console.log(`   Thoughts: ${finalAgent.system_thoughts?.length || 0}`);
     console.log(`   Tool Results: ${finalAgent.tool_call_results?.length || 0}`);
     console.log(`   Turn History: ${finalAgent.turn_history?.length || 0} entries`);
     console.log(`   System Tools: ${finalAgent.system_tools?.length || 0} tools`);
     
     // Show system tools
     if (finalAgent.system_tools && finalAgent.system_tools.length > 0) {
       console.log(`\n🛠️  Available Tools:`);
       finalAgent.system_tools.forEach((tool, i) => {
         const toolId = typeof tool === 'string' ? tool : tool.id;
         console.log(`   ${i + 1}. ${toolId}`);
       });
     }
    
    // Show tool results if any
    if (finalAgent.tool_call_results && finalAgent.tool_call_results.length > 0) {
      console.log(`\n🛠️  Tool Results:`);
      finalAgent.tool_call_results.forEach((result, i) => {
        console.log(`   ${i + 1}. ${result}`);
      });
    }
    
    // Step 5: Cleanup
    console.log(`\n🧹 Cleaning up...`);
    await makeRequest(`${BASE_URL}/api/agents/${testAgent.agentId}`, 'DELETE');
    
    const success = finalAgent.tool_call_results?.length > 0;
    
    console.log('\n' + '='.repeat(50));
    console.log(`🎯 DEBUG RESULTS: ${success ? 'TOOLS WORKING' : 'TOOLS NOT EXECUTING'}`);
    console.log('='.repeat(50));
    
    return success;
    
  } catch (error) {
    console.error(`💥 Debug test error:`, error);
    await makeRequest(`${BASE_URL}/api/agents/${testAgent.agentId}`, 'DELETE');
    return false;
  }
}

runDebugTest()
  .then(success => process.exit(success ? 0 : 1))
  .catch(error => {
    console.error('💥 Debug test crashed:', error);
    process.exit(1);
  }); 