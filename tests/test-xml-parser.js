#!/usr/bin/env node

/**
 * XML Parser Debug Test
 * Tests parameter extraction from sktool XML format
 */

// Sample XML from your logs
const testXml = `<sktool><generate_system_note><message>Current state (2025‑09‑09 01:15 AM): Research plan ready, 2020 sources identified. Next step – retrieve and verify September 9, 2020 event(s) via web search.</message><expirationDays>7</expirationDays></generate_system_note></sktool>

<sktool><generate_system_thought><message>Will confirm the most notable September 9, 2020 event using at least two independent reputable sources before finalizing the summary.</message></generate_system_thought></sktool>`;

console.log('🔧 XML Parser Debug Test');
console.log('='.repeat(50));
console.log('Testing XML parameter extraction...\n');

// Simulate the parsing logic
function debugParseToolCalls(content) {
  const toolCalls = [];
  
  // Find all <sktool>...</sktool> blocks
  const sktoolRegex = /<sktool>([\s\S]*?)<\/sktool>/g;
  let match;
  
  while ((match = sktoolRegex.exec(content)) !== null) {
    const toolXml = match[1];
    console.log(`📋 Raw tool XML: ${toolXml}`);
    
    const parsedTool = debugParseIndividualTool(toolXml, match[0]);
    
    if (parsedTool) {
      toolCalls.push(parsedTool);
    }
  }
  
  return toolCalls;
}

function debugParseIndividualTool(toolXml, rawXml) {
  console.log(`\n🔍 Parsing tool XML: ${toolXml.substring(0, 100)}...`);
  
  // Extract tool name (first XML tag)
  const toolNameMatch = toolXml.match(/<([^>]+)>/);
  if (!toolNameMatch) {
    console.log('❌ Could not extract tool name');
    return null;
  }
  
  const toolId = toolNameMatch[1];
  console.log(`🏷️  Tool ID: ${toolId}`);
  
  // Extract parameters directly from toolXml
  const params = {};
  
  // Extract message parameter
  const messageMatch = toolXml.match(/<message>([\s\S]*?)<\/message>/);
  if (messageMatch) {
    params.message = messageMatch[1].trim();
    console.log(`🔧 Extracted message: ${params.message.substring(0, 50)}...`);
  }
  
  // Extract expirationDays parameter
  const expirationMatch = toolXml.match(/<expirationDays>([\s\S]*?)<\/expirationDays>/);
  if (expirationMatch) {
    params.expirationDays = parseInt(expirationMatch[1].trim(), 10) || 7;
    console.log(`🔧 Extracted expirationDays: ${params.expirationDays}`);
  }
  
  console.log(`📊 Final params object:`, params);
  
  return {
    toolId,
    params,
    rawXml
  };
}

// Run the test
const results = debugParseToolCalls(testXml);

console.log(`\n📊 Final Results:`);
console.log(`Found ${results.length} tool calls:`);

results.forEach((tool, index) => {
  console.log(`\n${index + 1}. Tool: ${tool.toolId}`);
  console.log(`   Params: ${JSON.stringify(tool.params)}`);
  console.log(`   Message: "${tool.params.message || 'MISSING'}"`);
  console.log(`   ExpirationDays: ${tool.params.expirationDays || 'MISSING'}`);
});

console.log('\n✅ XML Parser Debug Test Complete'); 