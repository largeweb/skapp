'use client'

import { useState } from 'react'

export default async function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [activeTab, setActiveTab] = useState('chat')
  
  // HARDCODED DATA - Replace with API calls later
  const agent = {
    id: id,
    name: 'ResearchBot',
    description: 'AI research specialist',
    status: 'awake',
    statusColor: 'text-green-600',
    statusBg: 'bg-green-100',
    lastActivity: '2m ago',
    memory: {
      notes: 8,
      thoughts: 3,
      workItems: 2
    }
  }

  // HARDCODED conversation history
  const conversation = [
    { role: 'user', content: 'Research AI agents', time: '10:30 AM' },
    { role: 'agent', content: "I'll search for the latest information on AI agents and their applications.", time: '10:30 AM' },
    { role: 'agent', content: '[Thinking 30s]', time: '10:31 AM', isThinking: true }
  ]

  // HARDCODED memory data
  const memoryData = {
    pmem: [
      'Expert in research methodology',
      'Can analyze complex topics', 
      'Tools: web_search, take_note, discord'
    ],
    note: [
      { content: 'AI market growing 25%', expires: '5d left' },
      { content: 'GPT-4 adoption accelerating', expires: '3d left' },
      { content: 'Need to research agents', expires: '6d left' }
    ],
    thgt: [
      'Focus on enterprise AI trends',
      'User wants detailed analysis'
    ],
    work: [
      'Tool Results:',
      '• web_search: "Found 15 articles..."',
      'Discord: "3 new messages in #research"'
    ]
  }

  // HARDCODED activity timeline
  const activities = [
    { time: '3:00 PM', mode: 'Awake Mode', actions: ['🔍 web_search("AI agent frameworks")', '📝 take_note("Found 12 relevant papers")', '💭 take_thought("Need to analyze trends")'] },
    { time: '2:30 PM', mode: 'Sleep Mode Completed', actions: ['📚 Summarized 8 conversation messages', '🧠 Generated 3 insights for tomorrow', '💾 Archived 2 expired thoughts'] },
    { time: '2:00 PM', mode: 'Tool Usage', actions: ['📱 discord_msg("Research update ready")', '📊 Exported progress to Excel'] }
  ]

  const tabs = [
    { id: 'chat', label: '💬 Chat', icon: '💬' },
    { id: 'memory', label: '🧠 Memory', icon: '🧠' },
    { id: 'activity', label: '📈 Activity', icon: '📈' },
    { id: 'settings', label: '⚙️ Settings', icon: '⚙️' }
  ]

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm border mb-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="text-3xl">🤖</div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{agent.name}</h1>
              <p className="text-gray-600">{agent.description}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className={`px-4 py-2 rounded-full text-sm font-medium ${agent.statusBg} ${agent.statusColor}`}>
              🟢 Awake ({agent.lastActivity})
            </div>
            <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded transition-colors">
              ⚙️
            </button>
            <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors">
              📊 Export
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="flex border-b">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Chat Tab */}
          {activeTab === 'chat' && (
            <div className="grid grid-cols-3 gap-6 h-96">
              {/* Conversation */}
              <div className="col-span-2 border rounded-lg">
                <div className="p-4 border-b bg-gray-50">
                  <h3 className="font-semibold">Conversation</h3>
                </div>
                <div className="p-4 h-64 overflow-y-auto space-y-3">
                  {conversation.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs px-4 py-2 rounded-lg ${
                        msg.role === 'user' 
                          ? 'bg-blue-600 text-white' 
                          : msg.isThinking 
                            ? 'bg-yellow-100 text-yellow-800 italic'
                            : 'bg-gray-100 text-gray-900'
                      }`}>
                        <div className="text-sm">{msg.content}</div>
                        <div className="text-xs opacity-75 mt-1">{msg.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t">
                  <div className="flex space-x-2">
                    <input 
                      type="text" 
                      placeholder="Type message..."
                      className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                      Send
                    </button>
                  </div>
                </div>
              </div>

              {/* Live Context */}
              <div className="border rounded-lg">
                <div className="p-4 border-b bg-gray-50">
                  <h3 className="font-semibold">Live Context</h3>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">🧠 Active Memory</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>• {agent.memory.notes} notes (7-day)</div>
                      <div>• {agent.memory.thoughts} thoughts (today)</div>
                      <div>• {agent.memory.workItems} tool results</div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">🎯 Current Goals</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>• Research AI trends</div>
                      <div>• Create summary</div>
                      <div>• Post to Discord</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Memory Tab */}
          {activeTab === 'memory' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">🧠 Memory Layers</h3>
                <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors">
                  Export
                </button>
              </div>

              {/* PMEM */}
              <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
                <h4 className="font-bold text-blue-900 mb-3">PMEM (Permanent)</h4>
                <div className="space-y-2">
                  {memoryData.pmem.map((item, index) => (
                    <div key={index} className="text-blue-800">• {item}</div>
                  ))}
                </div>
              </div>

              {/* NOTE */}
              <div className="border-2 border-green-200 rounded-lg p-4 bg-green-50">
                <h4 className="font-bold text-green-900 mb-3">NOTE (7-day persistence)</h4>
                <div className="space-y-2">
                  {memoryData.note.map((item, index) => (
                    <div key={index} className="text-green-800">
                      • "{item.content}" ({item.expires})
                    </div>
                  ))}
                </div>
              </div>

              {/* THGT */}
              <div className="border-2 border-yellow-200 rounded-lg p-4 bg-yellow-50">
                <h4 className="font-bold text-yellow-900 mb-3">THGT (Today only)</h4>
                <div className="space-y-2">
                  {memoryData.thgt.map((item, index) => (
                    <div key={index} className="text-yellow-800">• "{item}"</div>
                  ))}
                </div>
              </div>

              {/* WORK */}
              <div className="border-2 border-purple-200 rounded-lg p-4 bg-purple-50">
                <h4 className="font-bold text-purple-900 mb-3">WORK (Current turn)</h4>
                <div className="space-y-2">
                  {memoryData.work.map((item, index) => (
                    <div key={index} className="text-purple-800">{item}</div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Activity Tab */}
          {activeTab === 'activity' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold">📈 Activity Timeline</h3>
              
              {activities.map((activity, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4 pb-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-lg">🕐</span>
                    <span className="font-semibold">{activity.time} - {activity.mode}</span>
                  </div>
                  <div className="space-y-1 ml-6">
                    {activity.actions.map((action, actionIndex) => (
                      <div key={actionIndex} className="text-gray-700">{action}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold">⚙️ Agent Settings</h3>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="text-yellow-800">
                  <strong>Note:</strong> Settings functionality will be implemented in a dedicated settings page.
                  This tab shows preview of available configuration options.
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">📝 Basic Info</h4>
                  <div className="bg-gray-50 p-3 rounded border text-gray-600">
                    Name: {agent.name}<br/>
                    Description: {agent.description}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">🧠 Memory Configuration</h4>
                  <div className="bg-gray-50 p-3 rounded border text-gray-600">
                    PMEM entries: {memoryData.pmem.length}<br/>
                    Available tools: web_search, take_note, discord
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">⏰ Schedule</h4>
                  <div className="bg-gray-50 p-3 rounded border text-gray-600">
                    Timezone: EST<br/>
                    Sleep: 2:00 AM | Wake: 5:00 AM
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 