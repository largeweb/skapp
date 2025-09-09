#!/usr/bin/env node

/**
 * Fun Money-Making Agent Test
 * Creates an entrepreneurial agent focused on generating income ideas
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

console.log('💰 SpawnKit Money-Making Agent Test');
console.log('='.repeat(60));
console.log(`📍 Target: ${BASE_URL} (${envFlag})`);
console.log(`⏰ Started: ${new Date().toISOString()}`);

// Money-making agent configuration
const moneyAgent = {
  agentId: 'fun-guy-money-001',
  name: 'Entrepreneur Agent',
  description: 'AI entrepreneur focused on generating creative income streams and business opportunities. Specializes in identifying market gaps, developing monetization strategies, and creating actionable business plans.',
  permanentMemory: [
    'Primary goal: Identify and develop profitable business opportunities',
    'Focus areas: Digital products, online services, automation solutions',
    'Target market: Small businesses and individual entrepreneurs',
    'Success metrics: Revenue potential, implementation difficulty, time to market',
    'Core strength: Pattern recognition in market trends and consumer behavior'
  ],
  initialNotes: [
    {
      content: 'Market research priority: When web search becomes available, immediately research 10 high-potential business niches with low competition and high profit margins',
      expirationDays: 14
    },
    {
      content: 'Business model focus: SaaS tools, digital courses, affiliate marketing, and automation services show highest ROI potential in current market',
      expirationDays: 10
    },
    {
      content: 'Competitive analysis needed: Research successful entrepreneurs in AI/automation space to identify proven strategies and market gaps',
      expirationDays: 7
    }
  ],
  initialThoughts: [
    'Current priority: Establish systematic approach to opportunity identification and validation',
    'Next milestone: Create framework for evaluating business ideas based on effort vs reward',
    'Strategic focus: Build comprehensive market research plan for when web search tools become available'
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
        'User-Agent': 'SpawnKit-FunGuy-Test/1.0'
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

async function createMoneyMakingAgent() {
  console.log(`\n💰 Creating Money-Making Agent...`);
  
  try {
    // Step 1: Create the agent
    console.log(`📝 Step 1: Creating entrepreneur agent...`);
    const createResponse = await makeRequest(
      `${BASE_URL}/api/agents`,
      'POST',
      {
        agentId: moneyAgent.agentId,
        name: moneyAgent.name,
        description: moneyAgent.description,
        pmem: moneyAgent.permanentMemory
      }
    );
    
    if (createResponse.status !== 201) {
      throw new Error(`Agent creation failed: ${createResponse.status} - ${createResponse.data.error}`);
    }
    
    console.log(`   ✅ Agent created: ${moneyAgent.agentId}`);
    
    // Step 2: Add initial notes
    console.log(`\n📝 Step 2: Adding initial strategic notes...`);
    for (const note of moneyAgent.initialNotes) {
      const noteResponse = await makeRequest(
        `${BASE_URL}/api/process-tool`,
        'POST',
        {
          toolId: 'generate_system_note',
          params: {
            message: note.content,
            expirationDays: note.expirationDays
          },
          agentId: moneyAgent.agentId
        }
      );
      
      if (noteResponse.status === 200) {
        console.log(`   ✅ Note added: ${note.content.substring(0, 50)}... (${note.expirationDays}d)`);
      } else {
        console.log(`   ❌ Note failed: ${noteResponse.data.error}`);
      }
    }
    
    // Step 3: Add initial thoughts
    console.log(`\n💭 Step 3: Adding initial strategic thoughts...`);
    for (const thought of moneyAgent.initialThoughts) {
      const thoughtResponse = await makeRequest(
        `${BASE_URL}/api/process-tool`,
        'POST',
        {
          toolId: 'generate_system_thought',
          params: {
            message: thought
          },
          agentId: moneyAgent.agentId
        }
      );
      
      if (thoughtResponse.status === 200) {
        console.log(`   ✅ Thought added: ${thought.substring(0, 50)}...`);
      } else {
        console.log(`   ❌ Thought failed: ${thoughtResponse.data.error}`);
      }
    }
    
    // Step 4: Set initial turn prompt enhancement
    console.log(`\n🎯 Step 4: Setting initial strategic focus...`);
    const enhancementResponse = await makeRequest(
      `${BASE_URL}/api/process-tool`,
      'POST',
      {
        toolId: 'generate_turn_prompt_enhancement',
        params: {
          message: 'Focus on developing a systematic framework for evaluating business opportunities. Create a scoring system based on: market demand, competition level, startup costs, revenue potential, and time to profitability.'
        },
        agentId: moneyAgent.agentId
      }
    );
    
    if (enhancementResponse.status === 200) {
      console.log(`   ✅ Strategic focus set for next turn`);
    }
    
    return { success: true };
    
  } catch (error) {
    console.error(`💥 Money agent setup failed:`, error.message);
    return { success: false, error: error.message };
  }
}

async function testAgentTurns() {
  console.log(`\n🎭 Testing Agent Turns...`);
  
  try {
    // Run 2 turns to see agent evolution
    for (let turn = 1; turn <= 2; turn++) {
      console.log(`\n🔄 Turn ${turn}: Running orchestration...`);
      
      const orchestrateResponse = await makeRequest(
        `${BASE_URL}/api/orchestrate`,
        'POST',
        {
          agentId: moneyAgent.agentId,
          mode: 'awake',
          estTime: new Date().toISOString()
        }
      );
      
      if (orchestrateResponse.status === 200) {
        const result = orchestrateResponse.data;
        console.log(`   ✅ Turn ${turn} Success: ${result.successful} successful, ${result.failed} failed`);
        
        // Get agent state after turn
        const agentResponse = await makeRequest(`${BASE_URL}/api/agents/${moneyAgent.agentId}`, 'GET');
        const agent = agentResponse.data;
        
        console.log(`   📊 After Turn ${turn}:`);
        console.log(`      Notes: ${agent.system_notes?.length || 0}`);
        console.log(`      Thoughts: ${agent.system_thoughts?.length || 0}`);
        console.log(`      Tool Results: ${agent.tool_call_results?.length || 0}`);
        console.log(`      Turn Count: ${agent.turnsCount || 0}`);
        
        // Show latest tool results
        if (agent.tool_call_results && agent.tool_call_results.length > 0) {
          const latestResult = agent.tool_call_results[agent.tool_call_results.length - 1];
          console.log(`      Latest Tool: ${latestResult.substring(0, 80)}...`);
        }
        
        // Wait between turns
        if (turn < 2) {
          console.log(`   ⏳ Waiting 3 seconds before next turn...`);
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
        
      } else {
        console.log(`   ❌ Turn ${turn} Failed: ${orchestrateResponse.data.error}`);
      }
    }
    
    return { success: true };
    
  } catch (error) {
    console.error(`💥 Turn testing failed:`, error.message);
    return { success: false, error: error.message };
  }
}

async function validateAgentEvolution() {
  console.log(`\n📊 Validating Agent Evolution...`);
  
  try {
    const agentResponse = await makeRequest(`${BASE_URL}/api/agents/${moneyAgent.agentId}`, 'GET');
    const agent = agentResponse.data;
    
    console.log(`\n💰 Final Agent State:`);
    console.log(`   Name: ${agent.name}`);
    console.log(`   Description: ${agent.description}`);
    console.log(`   Turn Count: ${agent.turnsCount || 0}`);
    console.log(`   Permanent Memory: ${agent.system_permanent_memory?.length || 0} items`);
    console.log(`   Notes: ${agent.system_notes?.length || 0} items`);
    console.log(`   Thoughts: ${agent.system_thoughts?.length || 0} items`);
    console.log(`   Tool Results: ${agent.tool_call_results?.length || 0} items`);
    
    // Show turn history with XML tools
    if (agent.turn_history && agent.turn_history.length > 0) {
      console.log(`\n📜 Turn History (${agent.turn_history.length} turns):`);
      agent.turn_history.forEach((turn, index) => {
        const content = turn.content || turn.parts?.[0]?.text || '';
        const hasXmlTools = content.includes('<sktool>');
        console.log(`   Turn ${index + 1} (${turn.role}): ${content.substring(0, 80)}... ${hasXmlTools ? '🛠️ [XML TOOLS]' : ''}`);
      });
    }
    
    // Show recent notes
    if (agent.system_notes && agent.system_notes.length > 0) {
      console.log(`\n📝 Recent Notes:`);
      agent.system_notes.slice(-3).forEach((note, index) => {
        console.log(`   ${index + 1}. ${note.content.substring(0, 80)}...`);
      });
    }
    
    // Show current thoughts
    if (agent.system_thoughts && agent.system_thoughts.length > 0) {
      console.log(`\n💭 Current Thoughts:`);
      agent.system_thoughts.forEach((thought, index) => {
        console.log(`   ${index + 1}. ${thought.substring(0, 80)}...`);
      });
    }
    
    return { success: true, agent };
    
  } catch (error) {
    console.error(`💥 Agent validation failed:`, error.message);
    return { success: false, error: error.message };
  }
}

// Main test runner
async function runMoneyMakingTest() {
  console.log(`\n🚀 Starting Money-Making Agent Test`);
  
  const setupResult = await createMoneyMakingAgent();
  if (!setupResult.success) {
    console.log(`❌ Agent setup failed: ${setupResult.error}`);
    process.exit(1);
  }
  
  const turnResult = await testAgentTurns();
  if (!turnResult.success) {
    console.log(`❌ Turn testing failed: ${turnResult.error}`);
  }
  
  const validationResult = await validateAgentEvolution();
  
  console.log(`\n📊 Final Test Results`);
  console.log('='.repeat(60));
  
  if (validationResult.success) {
    console.log(`🎯 Overall Result: ✅ PASS`);
    console.log(`💰 Money-making agent successfully created and tested`);
    console.log(`🧠 Agent has evolved through ${validationResult.agent.turnsCount || 0} turns`);
    console.log(`📝 Created ${validationResult.agent.system_notes?.length || 0} strategic notes`);
    console.log(`💭 Generated ${validationResult.agent.system_thoughts?.length || 0} business thoughts`);
  } else {
    console.log(`🎯 Overall Result: ❌ FAIL`);
    if (validationResult.error) {
      console.log(`💥 Error: ${validationResult.error}`);
    }
  }
  
  console.log(`\n⏰ Test Completed: ${new Date().toISOString()}`);
  console.log(`💡 Agent ready for manual testing at: ${BASE_URL}/agents/${moneyAgent.agentId}`);
  
  // Don't cleanup - leave agent for manual testing
  process.exit(validationResult.success ? 0 : 1);
}

// Validation warnings
if (envFlag === 'local') {
  console.log('⚠️  LOCAL TESTING: Make sure your development server is running on localhost:3000');
  console.log('   Command: npm run dev');
  console.log('');
}

// Run test
runMoneyMakingTest().catch(error => {
  console.error('💥 Test runner failed:', error);
  process.exit(1);
}); 