#!/usr/bin/env node

/**
 * Test script for Groq Chat API endpoint
 * Usage: 
 *   node test-chat.js                    # Test prod by default
 *   node test-chat.js --env=prod         # Test production
 *   node test-chat.js --env=preview      # Test preview
 *   node test-chat.js --env=local        # Test localhost:3000
 */

const args = process.argv.slice(2);
const envArg = args.find(arg => arg.startsWith('--env='));
const environment = envArg ? envArg.split('=')[1] : 'prod';

// Environment configurations
const endpoints = {
  prod: 'https://skapp.pages.dev',
  preview: 'https://preview.skapp.pages.dev', 
  local: 'http://localhost:3000'
};

const baseUrl = endpoints[environment];
if (!baseUrl) {
  console.error('❌ Invalid environment. Use: prod, preview, or local');
  process.exit(1);
}

console.log(`🧪 Testing Groq Chat API - Environment: ${environment.toUpperCase()}`);
console.log(`🔗 Endpoint: ${baseUrl}/api/ai/chat`);
console.log('─'.repeat(60));

async function testChatAPI() {
  const testCases = [
    {
      name: 'Basic Chat Test',
      payload: {
        messages: [
          { role: 'system', content: 'You are a helpful AI assistant for SpawnKit agents.' },
          { role: 'user', content: 'Test message - respond with a brief confirmation that you received this.' }
        ]
      }
    },
    {
      name: 'Agent Persona Test',
      payload: {
        messages: [
          { role: 'system', content: 'You are Alice, a research assistant agent. You help users find and analyze information. Your personality is curious, thorough, and friendly.' },
          { role: 'user', content: 'I need help researching AI agent frameworks. Can you help?' }
        ],
        reasoningEffort: 'medium'
      }
    },
    {
      name: 'High Reasoning Test',
      payload: {
        messages: [
          { role: 'system', content: 'You are a problem-solving agent. Use step-by-step reasoning.' },
          { role: 'user', content: 'How would you approach building a persistent memory system for AI agents?' }
        ],
        reasoningEffort: 'high',
        maxTokens: 1000
      }
    }
  ];

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n${i + 1}. ${testCase.name}`);
    
    try {
      const startTime = Date.now();
      
      const response = await fetch(`${baseUrl}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testCase.payload)
      });
      
      const duration = Date.now() - startTime;
      const data = await response.json();
      
      if (response.ok && data.success) {
        console.log(`   ✅ SUCCESS (${duration}ms)`);
        console.log(`   📊 Tokens: ${data.usage?.totalTokens || 'N/A'}`);
        console.log(`   💬 Response: ${data.message?.substring(0, 100)}${data.message?.length > 100 ? '...' : ''}`);
      } else {
        console.log(`   ❌ FAILED (${duration}ms)`);
        console.log(`   🚨 Error: ${data.error || 'Unknown error'}`);
        console.log(`   📝 Code: ${data.code || 'N/A'}`);
      }
      
    } catch (error) {
      console.log(`   💥 NETWORK ERROR: ${error.message}`);
    }
  }
}

// Test error handling
async function testErrorHandling() {
  console.log('\n🚨 Error Handling Tests');
  
  const errorTests = [
    {
      name: 'Empty Messages',
      payload: { messages: [] }
    },
    {
      name: 'Invalid Role',
      payload: { 
        messages: [{ role: 'invalid', content: 'test' }] 
      }
    },
    {
      name: 'Missing Content',
      payload: { 
        messages: [{ role: 'user', content: '' }] 
      }
    }
  ];

  for (const test of errorTests) {
    console.log(`\n   ${test.name}`);
    
    try {
      const response = await fetch(`${baseUrl}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(test.payload)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.log(`   ✅ Correctly rejected (${response.status}): ${data.error}`);
      } else {
        console.log(`   ❌ Should have been rejected but wasn't`);
      }
      
    } catch (error) {
      console.log(`   💥 Network error: ${error.message}`);
    }
  }
}

async function runTests() {
  try {
    await testChatAPI();
    await testErrorHandling();
    
    console.log('\n' + '─'.repeat(60));
    console.log('🎉 Chat API tests completed!');
    
  } catch (error) {
    console.error('💥 Test suite failed:', error.message);
    process.exit(1);
  }
}

runTests(); 