#!/usr/bin/env node

/**
 * Universal Single Agent Orchestration Test Script
 * Tests the orchestrate → generate flow for a single agent
 * Works on Mac/Linux/Windows via Node.js - no external dependencies
 * 
 * Usage:
 *   node tests/test-orchestrate-single.js --env=local        # Test localhost
 *   node tests/test-orchestrate-single.js --env=preview      # Test preview
 *   node tests/test-orchestrate-single.js --env=prod         # Test production
 */

const https = require('https');
const http = require('http');

// Parse command line arguments
const args = process.argv.slice(2);
const envFlag = args.find(arg => arg.startsWith('--env='))?.split('=')[1] || 'local';

// Environment configuration
const environments = {
  prod: 'https://skapp.pages.dev',
  preview: 'https://preview.skapp.pages.dev', 
  local: 'http://localhost:3000'
};

const BASE_URL = environments[envFlag];

if (!BASE_URL) {
  console.error('❌ Invalid environment. Use: prod, preview, or local');
  process.exit(1);
}

console.log('🎭 SpawnKit Single Agent Orchestration Test');
console.log('='.repeat(60));
console.log(`📍 Target: ${BASE_URL} (${envFlag})`);
console.log(`⏰ Started: ${new Date().toISOString()}`);

// Test agent for orchestration
const testAgent = {
  name: 'Orchestration Test Agent',
  agentId: 'orchestration-test-001',
  description: 'Test agent for validating orchestrate → generate → process-tool flow. This agent will be used to test the complete turn cycle including tool execution and KV updates.'
};

// Universal HTTP request function
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
        'User-Agent': 'SpawnKit-Orchestration-Test/1.0'
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
            headers: res.headers,
            data: parsed,
            rawBody: body
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: { parseError: true, raw: body },
            rawBody: body
          });
        }
      });
    });

    req.on('error', (err) => {
      reject({
        error: err.message,
        code: err.code,
        errno: err.errno
      });
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Test orchestration for single agent
async function testSingleAgentOrchestration() {
  console.log(`\n🚀 Testing Single Agent Orchestration Flow`);
  
  try {
    // Step 1: Create test agent
    console.log(`\n📝 Step 1: Creating test agent...`);
    const createResponse = await makeRequest(
      `${BASE_URL}/api/agents`,
      'POST',
      {
        agentId: testAgent.agentId,
        name: testAgent.name,
        description: testAgent.description
      }
    );
    
    if (createResponse.status === 201) {
      console.log(`   ✅ Agent created: ${testAgent.agentId}`);
    } else if (createResponse.status === 409) {
      console.log(`   ✅ Agent already exists: ${testAgent.agentId} (using existing)`);
    } else {
      throw new Error(`Failed to create agent: ${createResponse.status} - ${createResponse.data.error}`);
    }
    
    // Step 2: Get agent state before orchestration
    console.log(`\n🔍 Step 2: Getting agent state before orchestration...`);
    const beforeResponse = await makeRequest(`${BASE_URL}/api/agents/${testAgent.agentId}`, 'GET');
    
    if (beforeResponse.status !== 200) {
      throw new Error(`Failed to fetch agent: ${beforeResponse.status}`);
    }
    
    const agentBefore = beforeResponse.data;
    console.log(`   📊 Before - Tools: ${agentBefore.system_tools?.length || 0}, Notes: ${agentBefore.system_notes?.length || 0}, Thoughts: ${agentBefore.system_thoughts?.length || 0}`);
    console.log(`   📊 Before - Tool Results: ${agentBefore.tool_call_results?.length || 0}`);
    console.log(`   📊 Before - Turn Count: ${agentBefore.turnsCount || 0}`);
    
    // Step 3: Test orchestrate API for this single agent
    console.log(`\n🎭 Step 3: Running orchestration for single agent...`);
    const orchestrateResponse = await makeRequest(
      `${BASE_URL}/api/orchestrate`,
      'POST',
      {
        agentId: testAgent.agentId,
        mode: 'awake',  // Force awake mode for testing
        estTime: new Date().toISOString()
      }
    );
    
    if (orchestrateResponse.status !== 200) {
      throw new Error(`Orchestration failed: ${orchestrateResponse.status} - ${orchestrateResponse.data.error}`);
    }
    
    const orchestrateResult = orchestrateResponse.data;
    console.log(`   ✅ Orchestration Success: ${orchestrateResult.message}`);
    console.log(`   📊 Processed: ${orchestrateResult.processed}, Successful: ${orchestrateResult.successful}, Failed: ${orchestrateResult.failed}`);
    
    if (orchestrateResult.results && orchestrateResult.results.length > 0) {
      const agentResult = orchestrateResult.results.find(r => r.agentId === testAgent.agentId);
      if (agentResult) {
        console.log(`   🎯 Agent Result: ${agentResult.status} (${agentResult.ms}ms)`);
      }
    }
    
    // Step 4: Get agent state after orchestration
    console.log(`\n🔍 Step 4: Getting agent state after orchestration...`);
    
    // Wait a moment for KV updates to propagate
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const afterResponse = await makeRequest(`${BASE_URL}/api/agents/${testAgent.agentId}`, 'GET');
    
    if (afterResponse.status !== 200) {
      throw new Error(`Failed to fetch agent after orchestration: ${afterResponse.status}`);
    }
    
    const agentAfter = afterResponse.data;
    console.log(`   📊 After - Tools: ${agentAfter.system_tools?.length || 0}, Notes: ${agentAfter.system_notes?.length || 0}, Thoughts: ${agentAfter.system_thoughts?.length || 0}`);
    console.log(`   📊 After - Tool Results: ${agentAfter.tool_call_results?.length || 0}`);
    console.log(`   📊 After - Turn Count: ${agentAfter.turnsCount || 0}`);
    
    // Step 5: Validate changes
    console.log(`\n📊 Step 5: Validating orchestration effects...`);
    
    const validation = {
      valid: true,
      changes: [],
      issues: []
    };
    
    // Check if turn count increased
    const beforeTurns = agentBefore.turnsCount || 0;
    const afterTurns = agentAfter.turnsCount || 0;
    if (afterTurns > beforeTurns) {
      validation.changes.push(`Turn count increased: ${beforeTurns} → ${afterTurns}`);
    } else {
      validation.issues.push(`Turn count did not increase: ${beforeTurns} → ${afterTurns}`);
    }
    
    // Check if lastActivity was updated
    if (agentAfter.lastActivity !== agentBefore.lastActivity) {
      validation.changes.push(`Last activity updated: ${agentBefore.lastActivity} → ${agentAfter.lastActivity}`);
    } else {
      validation.issues.push('Last activity was not updated');
    }
    
    // Check if turn history was updated (if generate API is working)
    const beforeHistory = agentBefore.turn_history?.length || 0;
    const afterHistory = agentAfter.turn_history?.length || 0;
    if (afterHistory > beforeHistory) {
      validation.changes.push(`Turn history expanded: ${beforeHistory} → ${afterHistory} turns`);
    } else {
      validation.issues.push(`Turn history unchanged: ${beforeHistory} turns`);
    }
    
    console.log(`   📈 Changes Detected: ${validation.changes.length}`);
    validation.changes.forEach(change => console.log(`      ✅ ${change}`));
    
    console.log(`   ⚠️  Issues Found: ${validation.issues.length}`);
    validation.issues.forEach(issue => console.log(`      ❌ ${issue}`));
    
    // Step 6: Test process-tool API directly with this agent
    console.log(`\n🛠️  Step 6: Testing process-tool API with orchestrated agent...`);
    
    const toolTestResponse = await makeRequest(
      `${BASE_URL}/api/process-tool`,
      'POST',
      {
        toolId: 'generate_system_note',
        params: {
          message: 'Post-orchestration test note to validate tool system',
          expirationDays: 3
        },
        agentId: testAgent.agentId
      }
    );
    
    if (toolTestResponse.status === 200) {
      console.log(`   ✅ Process-Tool Success: ${toolTestResponse.data.result.substring(0, 100)}...`);
      
      // Verify the note was added
      const finalResponse = await makeRequest(`${BASE_URL}/api/agents/${testAgent.agentId}`, 'GET');
      const finalAgent = finalResponse.data;
      const notesAfterTool = finalAgent.system_notes?.length || 0;
      console.log(`   📝 Notes after tool execution: ${notesAfterTool}`);
      
    } else {
      console.log(`   ❌ Process-Tool Failed: ${toolTestResponse.status} - ${toolTestResponse.data.error}`);
    }
    
    return {
      success: validation.issues.length === 0,
      validation,
      agentBefore,
      agentAfter,
      orchestrateResult
    };
    
  } catch (error) {
    console.error(`💥 Orchestration test failed:`, error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Cleanup function
async function cleanupTestAgent() {
  try {
    console.log(`\n🧹 Cleaning up test agent: ${testAgent.agentId}`);
    const deleteResponse = await makeRequest(`${BASE_URL}/api/agents/${testAgent.agentId}`, 'DELETE');
    
    if (deleteResponse.status === 200) {
      console.log(`   ✅ Test agent deleted successfully`);
    } else {
      console.log(`   ⚠️  Could not delete test agent: ${deleteResponse.status}`);
    }
  } catch (err) {
    console.log(`   ⚠️  Cleanup failed: ${err.message}`);
  }
}

// Main test runner
async function runOrchestrationTest() {
  console.log(`\n🚀 Starting Single Agent Orchestration Test`);
  
  const result = await testSingleAgentOrchestration();
  
  console.log(`\n📊 Final Test Results`);
  console.log('='.repeat(60));
  
  if (result.success) {
    console.log(`🎯 Overall Result: ✅ PASS`);
    console.log(`📈 Detected Changes: ${result.validation.changes.length}`);
    console.log(`⚠️  Issues Found: ${result.validation.issues.length}`);
  } else {
    console.log(`🎯 Overall Result: ❌ FAIL`);
    if (result.error) {
      console.log(`💥 Error: ${result.error}`);
    }
  }
  
  // Cleanup
  await cleanupTestAgent();
  
  console.log(`\n⏰ Test Completed: ${new Date().toISOString()}`);
  
  // Exit with appropriate code
  process.exit(result.success ? 0 : 1);
}

// Validation warnings
if (envFlag === 'local') {
  console.log('⚠️  LOCAL TESTING: Make sure your development server is running on localhost:3000');
  console.log('   Command: npm run dev');
  console.log('');
}

// Run test
runOrchestrationTest().catch(error => {
  console.error('💥 Test runner failed:', error);
  process.exit(1);
}); 