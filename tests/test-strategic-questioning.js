#!/usr/bin/env node

/**
 * Strategic Self-Questioning Test
 * Tests the new strategic turn prompt that encourages agents to ask themselves 5 questions
 * 
 * Flow: Create business-focused agent → Run multiple turns → Verify strategic evolution
 * 
 * Usage: node tests/test-strategic-questioning.js --env=local
 */

const https = require('https');
const http = require('http');

const args = process.argv.slice(2);
const envFlag = args.find(arg => arg.startsWith('--env='))?.split('=')[1] || 'local';

const BASE_URL = envFlag === 'local' ? 'http://localhost:3000' : 
                 envFlag === 'preview' ? 'https://preview.skapp.pages.dev' : 
                 'https://skapp.pages.dev';

console.log('🧠 Strategic Self-Questioning Agent Test');
console.log('='.repeat(60));
console.log(`📍 Target: ${BASE_URL} (${envFlag})`);
console.log(`⏰ Started: ${new Date().toISOString()}`);

const strategicAgent = {
  agentId: 'strategic-q-' + Date.now(),
  name: 'Strategic Business Analyst',
  description: 'AI agent focused on strategic business analysis, market opportunities, and revenue optimization through self-questioning and deep analysis.',
  system_permanent_memory: [
    'Mission: Demonstrate strategic thinking through systematic self-questioning',
    'Method: Ask strategic questions and provide optimal answers for business growth',
    'Focus: Market analysis, competitive intelligence, and revenue opportunities',
    'Goal: Show how SpawnKit agents can become strategic business assets'
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
        'User-Agent': 'SpawnKit-StrategicTest/1.0'
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

async function createStrategicAgent() {
  console.log(`\n🏗️  Creating strategic business agent...`);
  
  const response = await makeRequest(`${BASE_URL}/api/agents`, 'POST', strategicAgent);
  
  if (response.status === 200 || response.status === 201) {
    console.log(`✅ Strategic agent created: ${strategicAgent.agentId}`);
    return true;
  } else {
    console.error(`❌ Failed to create agent:`, response.data);
    return false;
  }
}

async function runStrategicTurns(numTurns = 2) {
  console.log(`\n🎭 Running ${numTurns} strategic turns...`);
  
  for (let i = 1; i <= numTurns; i++) {
    console.log(`\n🔄 Turn ${i}/${numTurns}:`);
    
    const response = await makeRequest(`${BASE_URL}/api/orchestrate`, 'POST', {
      agentId: strategicAgent.agentId,
      mode: 'awake'
    });
    
    if (response.status === 200) {
      const result = response.data;
      console.log(`   ✅ Turn ${i} completed: ${result.successful || 0} successful, ${result.failed || 0} failed`);
    } else {
      console.error(`   ❌ Turn ${i} failed:`, response.data);
      return false;
    }
    
    // Wait between turns (shorter for testing)
    if (i < numTurns) {
      console.log(`   ⏱️  Waiting 30s before next turn...`);
      await new Promise(resolve => setTimeout(resolve, 30000));
    }
  }
  
  return true;
}

async function analyzeStrategicEvolution() {
  console.log(`\n🔬 Analyzing strategic evolution...`);
  
  // Wait for final KV propagation
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  const response = await makeRequest(`${BASE_URL}/api/agents/${strategicAgent.agentId}`, 'GET');
  
  if (response.status === 200) {
    const agent = response.data;
    
    console.log(`📊 Strategic Evolution Analysis:`);
    console.log(`   Total Turns: ${agent.turnsCount || 0}`);
    console.log(`   Notes Created: ${agent.system_notes?.length || 0}`);
    console.log(`   Thoughts Recorded: ${agent.system_thoughts?.length || 0}`);
    console.log(`   Tool Executions: ${agent.tool_call_results?.length || 0}`);
    console.log(`   Turn Enhancement: ${agent.turn_prompt_enhancement ? '✅ Set' : '❌ Not Set'}`);
    
    // Analyze note content for strategic thinking
    if (agent.system_notes && agent.system_notes.length > 1) {
      console.log(`\n📝 Strategic Notes Analysis:`);
      agent.system_notes.slice(1).forEach((note, i) => { // Skip instruction note
        const content = typeof note === 'string' ? note : note.content;
        const isStrategic = content.toLowerCase().includes('strategic') || 
                           content.toLowerCase().includes('market') ||
                           content.toLowerCase().includes('opportunity') ||
                           content.toLowerCase().includes('business') ||
                           content.toLowerCase().includes('revenue');
        console.log(`   ${i + 1}. ${isStrategic ? '🎯 STRATEGIC' : '📝 Regular'}: ${content.substring(0, 80)}...`);
      });
    }
    
    // Analyze thoughts for strategic patterns
    if (agent.system_thoughts && agent.system_thoughts.length > 0) {
      console.log(`\n💭 Strategic Thoughts Analysis:`);
      agent.system_thoughts.forEach((thought, i) => {
        const isStrategic = thought.toLowerCase().includes('strategic') || 
                           thought.toLowerCase().includes('question') ||
                           thought.toLowerCase().includes('analysis') ||
                           thought.toLowerCase().includes('next');
        console.log(`   ${i + 1}. ${isStrategic ? '🧠 STRATEGIC' : '💭 Regular'}: ${thought.substring(0, 80)}...`);
      });
    }
    
    // Check for strategic evolution indicators
    const hasStrategicNotes = agent.system_notes?.some(note => {
      const content = typeof note === 'string' ? note : note.content;
      return content.toLowerCase().includes('strategic') || content.toLowerCase().includes('market');
    });
    
    const hasStrategicThoughts = agent.system_thoughts?.some(thought => 
      thought.toLowerCase().includes('strategic') || thought.toLowerCase().includes('question')
    );
    
    const hasToolExecution = agent.tool_call_results?.length > 0;
    
    console.log(`\n🎯 Strategic Evolution Indicators:`);
    console.log(`   Strategic Notes: ${hasStrategicNotes ? '✅ YES' : '❌ NO'}`);
    console.log(`   Strategic Thoughts: ${hasStrategicThoughts ? '✅ YES' : '❌ NO'}`);
    console.log(`   Tool Usage: ${hasToolExecution ? '✅ YES' : '❌ NO'}`);
    
    const success = hasToolExecution && (hasStrategicNotes || hasStrategicThoughts);
    
    return { success, agent };
  } else {
    console.error(`❌ Failed to analyze evolution:`, response.data);
    return { success: false, agent: null };
  }
}

async function cleanup() {
  console.log(`\n🧹 Cleaning up test agent...`);
  
  const response = await makeRequest(`${BASE_URL}/api/agents/${strategicAgent.agentId}`, 'DELETE');
  
  if (response.status === 200) {
    console.log(`✅ Test agent cleaned up`);
  } else {
    console.log(`⚠️  Cleanup warning: ${response.status}`);
  }
}

async function runTest() {
  try {
    console.log(`\n🧪 Strategic Self-Questioning Test Starting...\n`);
    
    // Step 1: Create strategic agent
    const created = await createStrategicAgent();
    if (!created) return false;
    
    // Step 2: Run strategic turns
    const turnsCompleted = await runStrategicTurns(2);
    if (!turnsCompleted) return false;
    
    // Step 3: Analyze strategic evolution
    const analysis = await analyzeStrategicEvolution();
    
    // Step 4: Cleanup
    await cleanup();
    
    // Final report
    console.log('\n' + '='.repeat(60));
    console.log(`🎯 STRATEGIC QUESTIONING TEST RESULTS`);
    console.log('='.repeat(60));
    
    if (analysis.success) {
      console.log(`🚀 SUCCESS! Agent demonstrated strategic self-questioning and evolution!`);
      console.log(`🧠 Enhanced tool descriptions are working effectively!`);
      console.log(`📈 SpawnKit revolutionary philosophy is guiding agent behavior!`);
    } else {
      console.log(`❌ FAILED! Agent did not demonstrate strategic evolution patterns.`);
      console.log(`🔍 Review tool descriptions and system prompt effectiveness.`);
    }
    
    console.log(`⏰ Completed: ${new Date().toISOString()}`);
    
    return analysis.success;
    
  } catch (error) {
    console.error('💥 Test failed:', error);
    await cleanup();
    return false;
  }
}

// Run the test
runTest()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Test crashed:', error);
    process.exit(1);
  }); 