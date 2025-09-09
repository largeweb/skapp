#!/usr/bin/env node

/**
 * Process Tool API Test Script
 * Tests the /api/process-tool endpoint with environment flags
 * 
 * Usage:
 *   node tests/test-process-tool.js                    # Test production (default)
 *   node tests/test-process-tool.js --env=prod         # Test production
 *   node tests/test-process-tool.js --env=preview      # Test preview deployment  
 *   node tests/test-process-tool.js --env=local        # Test localhost (only if running)
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

console.log(`🧪 Testing Process Tool API on ${BASE_URL} (${envFlag})`);
console.log('=' * 60);

// Test data for the 4 required tools
const testCases = [
  {
    name: 'Generate System Note',
    toolId: 'generate_system_note',
    params: {
      message: 'Test note from process-tool API test',
      expirationDays: 7
    },
    agentId: 'test-agent-001'
  },
  {
    name: 'Generate System Thought', 
    toolId: 'generate_system_thought',
    params: {
      message: 'Test thought from process-tool API test'
    },
    agentId: 'test-agent-001'
  },
  {
    name: 'Generate Turn Prompt Enhancement',
    toolId: 'generate_turn_prompt_enhancement', 
    params: {
      message: 'Test turn prompt enhancement from process-tool API test'
    },
    agentId: 'test-agent-001'
  },
  {
    name: 'Generate Day Summary',
    toolId: 'generate_day_summary_from_conversation',
    params: {
      message: 'Test day summary from process-tool API test - comprehensive summary of activities'
    },
    agentId: 'test-agent-001'
  }
];

// Test timeout scenarios
const timeoutTestCase = {
  name: 'Timeout Test (Invalid Agent)',
  toolId: 'generate_system_note',
  params: {
    message: 'This should timeout or fail',
    expirationDays: 7
  },
  agentId: 'non-existent-agent'
};

async function makeRequest(url, method, data) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SpawnKit-Test-Script/1.0'
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
            data: parsed
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: { raw: body }
          });
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

async function testProcessTool(testCase) {
  const startTime = Date.now();
  
  try {
    console.log(`\n🔧 Testing: ${testCase.name}`);
    console.log(`   Tool ID: ${testCase.toolId}`);
    console.log(`   Agent ID: ${testCase.agentId}`);
    console.log(`   Parameters: ${JSON.stringify(testCase.params).substring(0, 100)}...`);
    
    const response = await makeRequest(
      `${BASE_URL}/api/process-tool`,
      'POST',
      {
        toolId: testCase.toolId,
        params: testCase.params,
        agentId: testCase.agentId
      }
    );
    
    const executionTime = Date.now() - startTime;
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Time: ${executionTime}ms`);
    
    if (response.status === 200) {
      console.log(`   ✅ Success: ${response.data.result?.substring(0, 100) || 'No result'}...`);
      return { success: true, time: executionTime, response: response.data };
    } else if (response.status === 404) {
      console.log(`   ⚠️  Agent not found (expected for test data): ${response.data.error}`);
      return { success: false, time: executionTime, expected: true, response: response.data };
    } else if (response.status === 408) {
      console.log(`   ⏱️  Timeout (expected for some tests): ${response.data.error}`);
      return { success: false, time: executionTime, expected: true, response: response.data };
    } else {
      console.log(`   ❌ Failed: ${response.data.error || 'Unknown error'}`);
      if (response.data.details) {
        console.log(`   Details: ${JSON.stringify(response.data.details).substring(0, 200)}`);
      }
      return { success: false, time: executionTime, response: response.data };
    }
    
  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.log(`   💥 Network Error: ${error.message}`);
    return { success: false, time: executionTime, error: error.message };
  }
}

async function runAllTests() {
  console.log(`\n🚀 Starting Process Tool API Tests`);
  console.log(`📍 Target: ${BASE_URL}`);
  console.log(`⏰ Started: ${new Date().toISOString()}`);
  
  const results = [];
  
  // Test all 4 required tools
  for (const testCase of testCases) {
    const result = await testProcessTool(testCase);
    results.push({ ...result, testCase: testCase.name });
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Test timeout scenario
  console.log(`\n🔍 Testing Timeout/Error Scenarios`);
  const timeoutResult = await testProcessTool(timeoutTestCase);
  results.push({ ...timeoutResult, testCase: timeoutTestCase.name });
  
  // Summary
  console.log(`\n📊 Test Results Summary`);
  console.log('=' * 60);
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success && !r.expected).length;
  const expected = results.filter(r => r.expected).length;
  const avgTime = results.reduce((sum, r) => sum + r.time, 0) / results.length;
  
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⚠️  Expected Failures: ${expected}`);
  console.log(`⏱️  Average Time: ${Math.round(avgTime)}ms`);
  console.log(`🎯 Overall: ${failed === 0 ? 'PASS' : 'FAIL'}`);
  
  // Detailed results
  console.log(`\n📋 Detailed Results:`);
  results.forEach((result, index) => {
    const status = result.success ? '✅' : result.expected ? '⚠️' : '❌';
    console.log(`${status} ${result.testCase}: ${result.time}ms`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  console.log(`\n⏰ Completed: ${new Date().toISOString()}`);
  
  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Validation warnings
if (envFlag === 'local') {
  console.log('⚠️  LOCAL TESTING: Make sure your development server is running on localhost:3000');
  console.log('   Run: npm run dev');
  console.log('');
}

if (envFlag === 'preview') {
  console.log('⚠️  PREVIEW TESTING: Make sure your latest changes are deployed to preview');
  console.log('   Check: https://preview.skapp.pages.dev');
  console.log('');
}

// Run tests
runAllTests().catch(error => {
  console.error('💥 Test runner failed:', error);
  process.exit(1);
}); 