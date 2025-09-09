#!/usr/bin/env node

/**
 * Memory CRUD & Expiration Test Script
 * Tests note expiration, thought persistence, and KV memory management
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

console.log('🧠 SpawnKit Memory CRUD & Expiration Test');
console.log('='.repeat(60));
console.log(`📍 Target: ${BASE_URL} (${envFlag})`);
console.log(`⏰ Started: ${new Date().toISOString()}`);

const testAgent = {
  name: 'Memory Test Agent',
  agentId: 'memory-test-001',
  description: 'Agent for testing memory CRUD operations, note expiration, and thought persistence'
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
        'User-Agent': 'SpawnKit-Memory-Test/1.0'
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
            data: parsed,
            rawBody: body
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: { parseError: true, raw: body },
            rawBody: body
          });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

function calculateDaysFromNow(isoDate) {
  const now = new Date();
  const target = new Date(isoDate);
  const diffMs = target.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
  return diffDays;
}

async function runMemoryTests() {
  console.log(`\n🚀 Starting Memory CRUD Tests`);
  
  try {
    // Step 1: Create test agent
    console.log(`\n📝 Step 1: Creating memory test agent...`);
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
      throw new Error(`Failed to create agent: ${createResponse.status}`);
    }

    // Step 2: Test note creation with different expiration days
    console.log(`\n📝 Step 2: Testing note creation with expiration...`);
    
    const noteTests = [
      { message: 'Short-term note for testing', days: 1 },
      { message: 'Medium-term note for validation', days: 7 },
      { message: 'Long-term note for persistence', days: 14 }
    ];
    
    for (const noteTest of noteTests) {
      const response = await makeRequest(
        `${BASE_URL}/api/process-tool`,
        'POST',
        {
          toolId: 'generate_system_note',
          params: {
            message: noteTest.message,
            expirationDays: noteTest.days
          },
          agentId: testAgent.agentId
        }
      );
      
      if (response.status === 200) {
        console.log(`   ✅ Note created (${noteTest.days}d): ${noteTest.message.substring(0, 30)}...`);
      } else {
        console.log(`   ❌ Note failed (${noteTest.days}d): ${response.data.error}`);
      }
    }

    // Step 3: Test thought creation
    console.log(`\n💭 Step 3: Testing thought creation...`);
    
    const thoughtTests = [
      'Current focus: Testing memory persistence',
      'Strategy: Validate expiration logic',
      'Goal: Ensure CRUD operations work correctly'
    ];
    
    for (const thought of thoughtTests) {
      const response = await makeRequest(
        `${BASE_URL}/api/process-tool`,
        'POST',
        {
          toolId: 'generate_system_thought',
          params: { message: thought },
          agentId: testAgent.agentId
        }
      );
      
      if (response.status === 200) {
        console.log(`   ✅ Thought created: ${thought.substring(0, 40)}...`);
      } else {
        console.log(`   ❌ Thought failed: ${response.data.error}`);
      }
    }

    // Step 4: Validate agent memory structure
    console.log(`\n🔍 Step 4: Validating memory structure and expiration...`);
    
    const agentResponse = await makeRequest(`${BASE_URL}/api/agents/${testAgent.agentId}`, 'GET');
    
    if (agentResponse.status !== 200) {
      throw new Error(`Failed to fetch agent: ${agentResponse.status}`);
    }
    
    const agentData = agentResponse.data;
    
    console.log(`   📊 Memory Summary:`);
    console.log(`      Permanent Memory: ${agentData.system_permanent_memory?.length || 0} entries`);
    console.log(`      Notes: ${agentData.system_notes?.length || 0} entries`);
    console.log(`      Thoughts: ${agentData.system_thoughts?.length || 0} entries`);
    console.log(`      Tool Results: ${agentData.tool_call_results?.length || 0} entries`);
    
    // Validate note expiration format
    if (agentData.system_notes && agentData.system_notes.length > 0) {
      console.log(`\n   📝 Note Expiration Analysis:`);
      agentData.system_notes.forEach((note, index) => {
        const daysRemaining = calculateDaysFromNow(note.expires_at);
        const expectedFormat = daysRemaining === 1 ? 'expires in 1d' : `expires in ${daysRemaining}d`;
        console.log(`      Note ${index + 1}: "${note.content.substring(0, 30)}..." → ${expectedFormat}`);
        console.log(`         Expires: ${note.expires_at}`);
        console.log(`         Days remaining: ${daysRemaining}`);
      });
    }

    // Step 5: Test turn prompt enhancement
    console.log(`\n🎯 Step 5: Testing turn prompt enhancement...`);
    
    const enhancementResponse = await makeRequest(
      `${BASE_URL}/api/process-tool`,
      'POST',
      {
        toolId: 'generate_turn_prompt_enhancement',
        params: {
          message: 'Focus on validating memory persistence and expiration logic in next turn'
        },
        agentId: testAgent.agentId
      }
    );
    
    if (enhancementResponse.status === 200) {
      console.log(`   ✅ Turn prompt enhancement set`);
      
      // Verify it was saved
      const updatedAgent = await makeRequest(`${BASE_URL}/api/agents/${testAgent.agentId}`, 'GET');
      if (updatedAgent.data.turn_prompt_enhancement) {
        console.log(`   ✅ Enhancement persisted: ${updatedAgent.data.turn_prompt_enhancement.substring(0, 50)}...`);
      }
    }

    // Step 6: Test day summary (sleep mode simulation)
    console.log(`\n📊 Step 6: Testing day summary (sleep mode simulation)...`);
    
    const summaryResponse = await makeRequest(
      `${BASE_URL}/api/process-tool`,
      'POST',
      {
        toolId: 'generate_day_summary_from_conversation',
        params: {
          message: 'Comprehensive summary: Successfully tested memory CRUD operations, note expiration system working, thoughts persisting correctly. All 4 tools operational.'
        },
        agentId: testAgent.agentId
      }
    );
    
    if (summaryResponse.status === 200) {
      console.log(`   ✅ Day summary created`);
      
      // Verify thoughts were cleared and summary saved
      const finalAgent = await makeRequest(`${BASE_URL}/api/agents/${testAgent.agentId}`, 'GET');
      console.log(`   📊 After sleep simulation:`);
      console.log(`      Thoughts cleared: ${finalAgent.data.system_thoughts?.length || 0} (should be 0)`);
      console.log(`      Summary saved: ${!!finalAgent.data.previous_day_summary}`);
      if (finalAgent.data.previous_day_summary) {
        console.log(`      Summary: ${finalAgent.data.previous_day_summary.substring(0, 80)}...`);
      }
    }

    // Step 7: Validation Summary
    console.log(`\n📋 Step 7: Final Validation Summary`);
    
    const finalAgent = await makeRequest(`${BASE_URL}/api/agents/${testAgent.agentId}`, 'GET');
    const agent = finalAgent.data;
    
    const validation = {
      notesWorking: agent.system_notes?.length > 0,
      thoughtsCleared: (agent.system_thoughts?.length || 0) === 0,
      toolResultsPersist: agent.tool_call_results?.length > 0,
      enhancementSaved: !!agent.turn_prompt_enhancement,
      summarySaved: !!agent.previous_day_summary,
      expirationDatesValid: agent.system_notes?.every(note => 
        note.expires_at && new Date(note.expires_at) > new Date()
      ) || false
    };
    
    console.log(`   ✅ Notes working: ${validation.notesWorking}`);
    console.log(`   ✅ Thoughts cleared (sleep): ${validation.thoughtsCleared}`);
    console.log(`   ✅ Tool results persist: ${validation.toolResultsPersist}`);
    console.log(`   ✅ Enhancement saved: ${validation.enhancementSaved}`);
    console.log(`   ✅ Summary saved: ${validation.summarySaved}`);
    console.log(`   ✅ Expiration dates valid: ${validation.expirationDatesValid}`);
    
    const allValid = Object.values(validation).every(v => v === true);
    console.log(`\n🎯 Overall Memory CRUD: ${allValid ? '✅ PASS' : '❌ FAIL'}`);
    
    return { success: allValid, validation, agent };
    
  } catch (error) {
    console.error(`💥 Memory test failed:`, error.message);
    return { success: false, error: error.message };
  }
}

// Cleanup
async function cleanup() {
  try {
    console.log(`\n🧹 Cleaning up test agent: ${testAgent.agentId}`);
    const deleteResponse = await makeRequest(`${BASE_URL}/api/agents/${testAgent.agentId}`, 'DELETE');
    if (deleteResponse.status === 200) {
      console.log(`   ✅ Test agent deleted successfully`);
    }
  } catch (err) {
    console.log(`   ⚠️  Cleanup failed: ${err.message}`);
  }
}

// Run tests
runMemoryTests()
  .then(async (result) => {
    console.log(`\n⏰ Test Completed: ${new Date().toISOString()}`);
    await cleanup();
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Test runner failed:', error);
    process.exit(1);
  }); 