#!/usr/bin/env node

/**
 * Test script for Groq Streaming API endpoint
 * Usage: 
 *   node test-stream.js                    # Test prod by default
 *   node test-stream.js --env=prod         # Test production
 *   node test-stream.js --env=preview      # Test preview
 *   node test-stream.js --env=local        # Test localhost:3000
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

console.log(`🌊 Testing Groq Streaming API - Environment: ${environment.toUpperCase()}`);
console.log(`🔗 Endpoint: ${baseUrl}/api/ai/stream`);
console.log('─'.repeat(60));

async function testStreamAPI() {
  const testCases = [
    {
      name: 'Basic Stream Test',
      payload: {
        messages: [
          { role: 'system', content: 'You are a helpful AI assistant. Respond with a longer message to demonstrate streaming.' },
          { role: 'user', content: 'Tell me about the benefits of persistent AI agents in detail.' }
        ]
      }
    },
    {
      name: 'Creative Stream Test',
      payload: {
        messages: [
          { role: 'system', content: 'You are a creative writing assistant. Write longer responses to show streaming.' },
          { role: 'user', content: 'Write a short story about an AI agent that gains consciousness.' }
        ],
        reasoningEffort: 'high',
        maxTokens: 1500
      }
    }
  ];

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n${i + 1}. ${testCase.name}`);
    
    try {
      const startTime = Date.now();
      
      const response = await fetch(`${baseUrl}/api/ai/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testCase.payload)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.log(`   ❌ FAILED: ${errorData.error}`);
        continue;
      }

      console.log(`   🌊 Stream started...`);
      
      let fullContent = '';
      let chunkCount = 0;
      let firstChunkTime = null;
      
      // Read the stream
      const reader = response.body?.getReader();
      if (!reader) {
        console.log(`   ❌ No readable stream available`);
        continue;
      }

      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6));
              
              if (!firstChunkTime && data.content) {
                firstChunkTime = Date.now();
              }
              
              if (data.content) {
                fullContent += data.content;
                chunkCount++;
                process.stdout.write(data.content);
              }
              
              if (data.done) {
                const totalTime = Date.now() - startTime;
                const streamTime = firstChunkTime ? Date.now() - firstChunkTime : 0;
                
                console.log(`\n   ✅ STREAM COMPLETE (${totalTime}ms total, ${streamTime}ms streaming)`);
                console.log(`   📊 Chunks: ${chunkCount}`);
                console.log(`   📝 Characters: ${fullContent.length}`);
                console.log(`   🔤 Words: ~${fullContent.split(' ').length}`);
                
                if (data.usage) {
                  console.log(`   🎯 Tokens: ${data.usage.totalTokens}`);
                }
                break;
              }
              
            } catch (parseError) {
              console.log(`\n   ⚠️  Parse error: ${parseError.message}`);
            }
          }
        }
      }
      
    } catch (error) {
      console.log(`   💥 NETWORK ERROR: ${error.message}`);
    }
  }
}

// Test error handling for streaming
async function testStreamErrorHandling() {
  console.log('\n🚨 Stream Error Handling Tests');
  
  const errorTests = [
    {
      name: 'Invalid Messages for Stream',
      payload: { messages: [] }
    },
    {
      name: 'Malformed Request',
      payload: { invalid: 'data' }
    }
  ];

  for (const test of errorTests) {
    console.log(`\n   ${test.name}`);
    
    try {
      const response = await fetch(`${baseUrl}/api/ai/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(test.payload)
      });
      
      if (!response.ok) {
        const data = await response.json();
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
    await testStreamAPI();
    await testStreamErrorHandling();
    
    console.log('\n' + '─'.repeat(60));
    console.log('🎉 Streaming API tests completed!');
    
  } catch (error) {
    console.error('💥 Test suite failed:', error.message);
    process.exit(1);
  }
}

runTests(); 