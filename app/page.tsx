import Image from "next/image";

import Link from 'next/link'

export default function Dashboard() {
  // HARDCODED DATA - Replace with API calls later
  const systemStats = {
    activeAgents: 4,
    notesToday: 23,
    lastCycle: '2m',
    toolsExecuted: 8
  };

  const agents = [
    {
      id: 'research_bot',
      name: 'Agent1',
      type: 'Research',
      status: 'awake',
      lastActivity: '2m ago',
      statusColor: 'bg-green-500'
    },
    {
      id: 'content_creator',
      name: 'Agent2', 
      type: 'Content',
      status: 'Sleep',
      lastActivity: '15m ago',
      statusColor: 'bg-blue-500'
    },
    {
      id: 'discord_bot',
      name: 'Agent3',
      type: 'Discord',
      status: 'Thinking',
      lastActivity: '30s ago',
      statusColor: 'bg-yellow-500'
    }
  ];

  const recentActivity = [
    { time: '2m ago', agent: 'Agent1', action: 'used web_search()', detail: 'Researching AI trends' },
    { time: '15m ago', agent: 'Agent2', action: 'entered sleep mode', detail: 'Processing daily memories' },
    { time: '18m ago', agent: 'Agent3', action: 'posted to Discord', detail: '#general channel' },
    { time: '25m ago', agent: 'Agent1', action: 'took note', detail: '"Market trends show 25% growth..."' }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🚀 SpawnKit - Persistent AI Agents</h1>
        <p className="text-gray-600">"Digital workers that think, learn & act"</p>
      </div>

      {/* System Stats */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <span className="mr-2">📊</span>
          System Stats
        </h2>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{systemStats.activeAgents}</div>
            <div className="text-sm text-gray-600">Active Agents</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{systemStats.notesToday}</div>
            <div className="text-sm text-gray-600">Notes Today</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{systemStats.lastCycle}</div>
            <div className="text-sm text-gray-600">Last Cycle</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{systemStats.toolsExecuted}</div>
            <div className="text-sm text-gray-600">Tools Executed</div>
          </div>
        </div>
      </div>

      {/* Your Agents */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center">
            <span className="mr-2">🤖</span>
            Your Agents
          </h2>
          <Link href="/create" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center space-x-2 transition-colors">
            <span>+</span>
            <span>New</span>
          </Link>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          {agents.map((agent) => (
            <div key={agent.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center mb-2">
                <div className={`w-3 h-3 rounded-full ${agent.statusColor} mr-2`}></div>
                <span className="font-semibold">{agent.name}</span>
              </div>
              <div className="text-sm text-gray-600 mb-1">{agent.type}</div>
              <div className="text-sm text-gray-500 mb-3">{agent.lastActivity}</div>
              <div className="flex space-x-2">
                <Link href={`/agents/${agent.id}`} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors">
                  Chat
                </Link>
                <Link href={`/agents/${agent.id}`} className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm transition-colors">
                  View
                </Link>
                <Link href={`/agents/${agent.id}`} className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm transition-colors">
                  Monitor
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <span className="mr-2">📝</span>
          Recent Activity (Live Feed)
        </h2>
        <div className="space-y-3">
          {recentActivity.map((activity, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500 min-w-16">{activity.time}</div>
              <div className="flex-1">
                <span className="font-medium text-gray-900">{activity.agent}</span>
                <span className="text-gray-700 mx-1">{activity.action}</span>
                {activity.detail && (
                  <span className="text-gray-600 text-sm">- {activity.detail}</span>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Live indicator - HARDCODED */}
        <div className="mt-4 flex items-center justify-center space-x-2 text-sm text-gray-500">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Live feed - Updates every 30 seconds</span>
        </div>
      </div>
    </div>
  );
}
