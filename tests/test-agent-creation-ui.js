#!/usr/bin/env node

/**
 * Agent Creation UI Integration Test
 * Validates agents created via UI are compatible with backend test scripts
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

console.log('🧙‍♂️ SpawnKit Agent Creation UI Test');
console.log('='.repeat(60));
console.log(`📍 Target: ${BASE_URL} (${envFlag})`);
console.log(`⏰ Started: ${new Date().toISOString()}`);

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
        'User-Agent': 'SpawnKit-UI-Test/1.0'
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

async function testAgentCreationFlow() {
  console.log(`\n🚀 Testing Agent Creation Flow`);
  
  const testAgent = {
    agentId: 'ui-test-agent-001',
    name: 'UI Test Agent',
    description: 'Agent created to test the UI creation flow and validate compatibility with backend test scripts'
  };

  try {
    // Step 1: Test agent creation via API (simulating UI form submission)
    console.log(`\n📝 Step 1: Creating agent via API (simulating UI)...`);
    
    const createResponse = await makeRequest(
      `${BASE_URL}/api/agents`,
      'POST',
      {
        agentId: testAgent.agentId,
        name: testAgent.name,
        description: testAgent.description,
        pmem: ['Test permanent memory item 1', 'Test permanent memory item 2']
      }
    );
    
    if (createResponse.status !== 201) {
      throw new Error(`Agent creation failed: ${createResponse.status} - ${createResponse.data.error}`);
    }
    
    console.log(`   ✅ Agent created successfully: ${testAgent.agentId}`);
    
    // Step 2: Validate agent structure matches our backend expectations
    console.log(`\n🔍 Step 2: Validating agent structure...`);
    
    const agentResponse = await makeRequest(`${BASE_URL}/api/agents/${testAgent.agentId}`, 'GET');
    
    if (agentResponse.status !== 200) {
      throw new Error(`Failed to fetch created agent: ${agentResponse.status}`);
    }
    
    const agent = agentResponse.data;
    
    // Validate required fields for our test scripts
    const requiredFields = [
      'agentId', 'name', 'description', 'system_permanent_memory', 
      'system_notes', 'system_thoughts', 'system_tools', 'tool_call_results'
    ];
    
    const validation = {
      valid: true,
      errors: [],
      details: {}
    };
    
    for (const field of requiredFields) {
      if (!(field in agent)) {
        validation.valid = false;
        validation.errors.push(`Missing field: ${field}`);
      } else {
        validation.details[field] = typeof agent[field];
      }
    }
    
    // Validate required tools were auto-added
    if (!Array.isArray(agent.system_tools)) {
      validation.valid = false;
      validation.errors.push('system_tools must be an array');
    } else {
      const requiredToolIds = [
        'generate_system_note',
        'generate_system_thought', 
        'generate_turn_prompt_enhancement',
        'generate_day_summary_from_conversation'
      ];
      
      const agentToolIds = agent.system_tools.map(tool => typeof tool === 'string' ? tool : tool.id);
      const missingTools = requiredToolIds.filter(id => !agentToolIds.includes(id));
      
      if (missingTools.length > 0) {
        validation.valid = false;
        validation.errors.push(`Missing required tools: ${missingTools.join(', ')}`);
      } else {
        validation.details.requiredToolsCount = requiredToolIds.length;
        validation.details.totalToolsCount = agent.system_tools.length;
      }
    }
    
    console.log(`   📊 Structure Validation: ${validation.valid ? '✅ PASS' : '❌ FAIL'}`);
    
    if (validation.errors.length > 0) {
      console.log(`   ❌ Validation Errors:`);
      validation.errors.forEach(error => console.log(`      - ${error}`));
    }
    
    console.log(`   📋 Field Details:`);
    Object.entries(validation.details).forEach(([field, value]) => {
      console.log(`      ${field}: ${value}`);
    });
    
    // Step 3: Test compatibility with our test scripts
    console.log(`\n🛠️ Step 3: Testing compatibility with process-tool API...`);
    
    const toolTestResponse = await makeRequest(
      `${BASE_URL}/api/process-tool`,
      'POST',
      {
        toolId: 'generate_system_note',
        params: {
          message: 'UI creation test note - validating backend compatibility',
          expirationDays: 7
        },
        agentId: testAgent.agentId
      }
    );
    
    if (toolTestResponse.status === 200) {
      console.log(`   ✅ Process-tool compatibility: PASS`);
      console.log(`   📝 Tool result: ${toolTestResponse.data.result.substring(0, 80)}...`);
    } else {
      console.log(`   ❌ Process-tool compatibility: FAIL (${toolTestResponse.status})`);
      validation.valid = false;
    }
    
    // Step 4: Test orchestration compatibility
    console.log(`\n🎭 Step 4: Testing orchestration compatibility...`);
    
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
      console.log(`   ✅ Orchestration compatibility: PASS`);
      console.log(`   📊 Result: ${result.successful} successful, ${result.failed} failed`);
    } else {
      console.log(`   ❌ Orchestration compatibility: FAIL (${orchestrateResponse.status})`);
      validation.valid = false;
    }
    
    return {
      success: validation.valid,
      agent: agent,
      validation: validation
    };
    
  } catch (error) {
    console.error(`💥 Agent creation test failed:`, error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Cleanup function
async function cleanup() {
  try {
    console.log(`\n🧹 Cleaning up test agent: ui-test-agent-001`);
    const deleteResponse = await makeRequest(`${BASE_URL}/api/agents/ui-test-agent-001`, 'DELETE');
    
    if (deleteResponse.status === 200) {
      console.log(`   ✅ Test agent deleted successfully`);
    } else {
      console.log(`   ⚠️ Could not delete test agent: ${deleteResponse.status}`);
    }
  } catch (err) {
    console.log(`   ⚠️ Cleanup failed: ${err.message}`);
  }
}

// Main test runner
async function runTest() {
  const result = await testAgentCreationFlow();
  
  console.log(`\n📊 Final Test Results`);
  console.log('='.repeat(60));
  
  if (result.success) {
    console.log(`🎯 Overall Result: ✅ PASS`);
    console.log(`📈 Agent creation UI is compatible with backend test scripts`);
    console.log(`🛠️ All required tools auto-added correctly`);
    console.log(`🔧 Process-tool and orchestration APIs working with UI-created agents`);
  } else {
    console.log(`🎯 Overall Result: ❌ FAIL`);
    if (result.error) {
      console.log(`💥 Error: ${result.error}`);
    }
    if (result.validation && result.validation.errors.length > 0) {
      console.log(`📋 Validation Issues: ${result.validation.errors.join(', ')}`);
    }
  }
  
  await cleanup();
  
  console.log(`\n⏰ Test Completed: ${new Date().toISOString()}`);
  process.exit(result.success ? 0 : 1);
}

// Run test
runTest().catch(error => {
  console.error('💥 Test runner failed:', error);
  process.exit(1);
}); 