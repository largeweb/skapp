#!/usr/bin/env node

/**
 * Universal Agent Creation Test Script
 * Works on Mac/Linux/Windows via Node.js - no external dependencies
 * 
 * Usage:
 *   node tests/test-create-agent.js                    # Test production (default)
 *   node tests/test-create-agent.js --env=prod         # Test production
 *   node tests/test-create-agent.js --env=preview      # Test preview deployment  
 *   node tests/test-create-agent.js --env=local        # Test localhost (only if running)
 */

const https = require('https');
const http = require('http');

// Parse command line arguments
const args = process.argv.slice(2);
const envFlag = args.find(arg => arg.startsWith('--env='))?.split('=')[1] || 'prod';

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

console.log('🧪 SpawnKit Agent Creation Test Suite');
console.log('='.repeat(50));
console.log(`📍 Target: ${BASE_URL} (${envFlag})`);
console.log(`⏰ Started: ${new Date().toISOString()}`);

// Realistic test agents with different configurations
const testAgents = [
  {
    name: 'Research Assistant Alpha',
    agentId: 'research-alpha-001',
    description: 'AI research specialist focused on technology trends and market analysis. Monitors industry developments and provides strategic insights.',
    expectedTools: 4,
    expectedFields: ['agentId', 'name', 'description', 'system_permanent_memory', 'system_notes', 'system_thoughts', 'system_tools']
  },
  {
    name: 'Content Creator Beta',
    agentId: 'content-beta-002', 
    description: 'Creative writing and content generation specialist. Develops engaging content across multiple platforms with brand consistency.',
    expectedTools: 4,
    expectedFields: ['agentId', 'name', 'description', 'system_permanent_memory', 'system_notes', 'system_thoughts', 'system_tools']
  },
  {
    name: 'Discord Community Manager',
    agentId: 'discord-manager-003',
    description: 'Community engagement specialist for Discord servers. Manages conversations, moderates content, and facilitates community growth.',
    expectedTools: 4,
    expectedFields: ['agentId', 'name', 'description', 'system_permanent_memory', 'system_notes', 'system_thoughts', 'system_tools']
  }
];

// Universal HTTP request function (works on all platforms)
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
        'User-Agent': 'SpawnKit-Test-Suite/1.0'
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

// Deterministic validation function
function validateAgentStructure(agent, expectedFields, testCase) {
  const results = {
    valid: true,
    errors: [],
    warnings: [],
    details: {}
  };

  // Check required fields exist
  for (const field of expectedFields) {
    if (!(field in agent)) {
      results.valid = false;
      results.errors.push(`Missing required field: ${field}`);
    } else {
      results.details[field] = typeof agent[field];
    }
  }

  // Validate field types and structure
  if (agent.agentId !== testCase.agentId) {
    results.valid = false;
    results.errors.push(`Agent ID mismatch: expected ${testCase.agentId}, got ${agent.agentId}`);
  }

  if (agent.name !== testCase.name) {
    results.valid = false;
    results.errors.push(`Name mismatch: expected "${testCase.name}", got "${agent.name}"`);
  }

  // Check system_tools array
  if (!Array.isArray(agent.system_tools)) {
    results.valid = false;
    results.errors.push('system_tools must be an array');
  } else {
    results.details.toolsCount = agent.system_tools.length;
    if (agent.system_tools.length === 0) {
      results.warnings.push('system_tools array is empty (should have 4 required tools)');
    } else if (agent.system_tools.length < 4) {
      results.warnings.push(`Only ${agent.system_tools.length} tools, expected 4 required tools`);
    }
  }

  // Check memory arrays
  const memoryFields = ['system_permanent_memory', 'system_notes', 'system_thoughts'];
  for (const field of memoryFields) {
    if (agent[field] && !Array.isArray(agent[field])) {
      results.errors.push(`${field} must be an array`);
      results.valid = false;
    }
  }

  return results;
}

// Test agent creation
async function testCreateAgent(testCase) {
  const startTime = Date.now();
  
  try {
    console.log(`\n🤖 Creating Agent: ${testCase.name}`);
    console.log(`   ID: ${testCase.agentId}`);
    console.log(`   Description: ${testCase.description.substring(0, 80)}...`);
    
    const response = await makeRequest(
      `${BASE_URL}/api/agents`,
      'POST',
      {
        agentId: testCase.agentId,
        name: testCase.name,
        description: testCase.description
      }
    );
    
    const executionTime = Date.now() - startTime;
    
    console.log(`   Status: ${response.status} (${executionTime}ms)`);
    
    if (response.status === 201) {
      console.log(`   ✅ Creation Success: ${response.data.message || 'Agent created'}`);
      
      // Now fetch the created agent to validate structure
      console.log(`   🔍 Validating agent structure...`);
      
      const fetchResponse = await makeRequest(`${BASE_URL}/api/agents/${testCase.agentId}`, 'GET');
      
      if (fetchResponse.status === 200) {
        const validation = validateAgentStructure(fetchResponse.data, testCase.expectedFields, testCase);
        
        console.log(`   📊 Structure Validation: ${validation.valid ? '✅ PASS' : '❌ FAIL'}`);
        
        if (validation.errors.length > 0) {
          console.log(`   ❌ Errors:`);
          validation.errors.forEach(err => console.log(`      - ${err}`));
        }
        
        if (validation.warnings.length > 0) {
          console.log(`   ⚠️  Warnings:`);
          validation.warnings.forEach(warn => console.log(`      - ${warn}`));
        }
        
        console.log(`   📋 Field Details:`);
        Object.entries(validation.details).forEach(([field, type]) => {
          console.log(`      ${field}: ${type}`);
        });
        
        return {
          success: true,
          time: executionTime,
          validation,
          agent: fetchResponse.data,
          testCase: testCase.name
        };
      } else {
        console.log(`   ❌ Failed to fetch created agent: ${fetchResponse.status}`);
        return {
          success: false,
          time: executionTime,
          error: 'Failed to fetch created agent',
          testCase: testCase.name
        };
      }
      
    } else if (response.status === 409) {
      console.log(`   ⚠️  Agent already exists (expected for repeat tests)`);
      return {
        success: false,
        time: executionTime,
        expected: true,
        error: 'Agent already exists',
        testCase: testCase.name
      };
    } else {
      console.log(`   ❌ Creation Failed: ${response.data.error || 'Unknown error'}`);
      if (response.data.details) {
        console.log(`   📋 Details:`, JSON.stringify(response.data.details).substring(0, 300));
      }
      if (response.data.fieldErrors) {
        console.log(`   🔍 Field Errors:`, JSON.stringify(response.data.fieldErrors).substring(0, 300));
      }
      return {
        success: false,
        time: executionTime,
        response: response.data,
        testCase: testCase.name
      };
    }
    
  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.log(`   💥 Network Error: ${error.message || error.error || 'Unknown error'}`);
    return {
      success: false,
      time: executionTime,
      error: error.message || error.error || 'Network error',
      testCase: testCase.name
    };
  }
}

// Main test runner
async function runAllTests() {
  console.log(`\n🚀 Starting Agent Creation Tests`);
  
  const results = [];
  
  // Test creating all agents
  for (const testCase of testAgents) {
    const result = await testCreateAgent(testCase);
    results.push(result);
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Test error scenarios
  console.log(`\n🔍 Testing Error Scenarios`);
  
  // Test invalid agent ID
  const invalidIdResult = await testCreateAgent({
    name: 'Invalid Agent',
    agentId: 'invalid@agent!',
    description: 'This should fail due to invalid agent ID format',
    expectedFields: [],
    expectedTools: 0
  });
  results.push(invalidIdResult);
  
  // Summary
  console.log(`\n📊 Test Results Summary`);
  console.log('='.repeat(50));
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success && !r.expected).length;
  const expected = results.filter(r => r.expected).length;
  const avgTime = results.reduce((sum, r) => sum + r.time, 0) / results.length;
  
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⚠️  Expected Failures: ${expected}`);
  console.log(`⏱️  Average Time: ${Math.round(avgTime)}ms`);
  console.log(`🎯 Overall: ${failed === 0 ? 'PASS' : 'FAIL'}`);
  
  // Detailed validation results
  console.log(`\n📋 Validation Details:`);
  results.forEach((result) => {
    const status = result.success ? '✅' : result.expected ? '⚠️' : '❌';
    console.log(`${status} ${result.testCase}: ${result.time}ms`);
    
    if (result.validation) {
      if (result.validation.errors.length > 0) {
        console.log(`   Errors: ${result.validation.errors.join(', ')}`);
      }
      if (result.validation.warnings.length > 0) {
        console.log(`   Warnings: ${result.validation.warnings.join(', ')}`);
      }
    }
    
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  console.log(`\n⏰ Completed: ${new Date().toISOString()}`);
  
  // Clean up test data (optional - comment out to keep test agents)
  console.log(`\n🧹 Cleaning up test agents...`);
  for (const testCase of testAgents) {
    try {
      const deleteResponse = await makeRequest(`${BASE_URL}/api/agents/${testCase.agentId}`, 'DELETE');
      if (deleteResponse.status === 200) {
        console.log(`   ✅ Deleted: ${testCase.agentId}`);
      } else {
        console.log(`   ⚠️  Could not delete: ${testCase.agentId} (${deleteResponse.status})`);
      }
    } catch (err) {
      console.log(`   ⚠️  Cleanup failed: ${testCase.agentId}`);
    }
  }
  
  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Validation warnings
if (envFlag === 'local') {
  console.log('⚠️  LOCAL TESTING: Make sure your development server is running on localhost:3000');
  console.log('   Command: npm run dev');
  console.log('');
}

if (envFlag === 'preview') {
  console.log('⚠️  PREVIEW TESTING: Make sure your latest changes are deployed to preview');
  console.log('   Check: https://preview.skapp.pages.dev');
  console.log('');
}

// Run tests
runAllTests().catch(error => {
  console.error('💥 Test suite failed:', error);
  process.exit(1);
}); 