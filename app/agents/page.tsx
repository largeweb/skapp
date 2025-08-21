export default function AgentsPage() {
  // HARDCODED DATA - Replace with API calls later
  const agents = [
    {
      id: 'research_bot',
      name: 'ResearchBot',
      description: 'AI research specialist',
      status: 'awake',
      statusColor: 'text-green-600',
      statusBg: 'bg-green-100',
      lastActivity: '2m ago',
      memory: {
        notes: 8,
        thoughts: 3
      }
    },
    {
      id: 'content_creator',
      name: 'ContentCreator',
      description: 'Social media assistant',
      status: 'sleep',
      statusColor: 'text-blue-600',
      statusBg: 'bg-blue-100',
      lastActivity: '15m ago',
      memory: {
        notes: 12,
        thoughts: 0
      }
    },
    {
      id: 'discord_bot',
      name: 'DiscordBot',
      description: 'Community manager',
      status: 'thinking',
      statusColor: 'text-yellow-600',
      statusBg: 'bg-yellow-100',
      lastActivity: '30s ago',
      memory: {
        notes: 5,
        thoughts: 2
      }
    },
    {
      id: 'data_analyst',
      name: 'DataAnalyst',
      description: 'Analytics and reporting',
      status: 'paused',
      statusColor: 'text-gray-600',
      statusBg: 'bg-gray-100',
      lastActivity: '2h ago',
      memory: {
        notes: 15,
        thoughts: 1
      }
    }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm border mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <span className="mr-3">🤖</span>
              My Agents ({agents.length})
            </h1>
          </div>
          <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors">
            <span>+</span>
            <span>New</span>
          </button>
        </div>
        
        {/* Search and Filters - HARDCODED UI */}
        <div className="flex space-x-4 mt-4">
          <input 
            type="text" 
            placeholder="🔍 Search agents..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>Filter: All</option>
            <option>Active</option>
            <option>Sleep</option>
            <option>Paused</option>
          </select>
          <select className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>Sort: Recent</option>
            <option>Name A-Z</option>
            <option>Status</option>
          </select>
        </div>
      </div>

      {/* Agents List */}
      <div className="space-y-4">
        {agents.map((agent) => (
          <div key={agent.id} className="bg-white rounded-lg p-6 shadow-sm border hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Checkbox - HARDCODED */}
                <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" />
                
                {/* Agent Icon and Info */}
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">🤖</div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{agent.name}</h3>
                    <p className="text-gray-600">{agent.description}</p>
                    <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                      <span>Memory: {agent.memory.notes} notes, {agent.memory.thoughts} thoughts</span>
                      <span>•</span>
                      <span>{agent.lastActivity}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status and Actions */}
              <div className="flex items-center space-x-4">
                {/* Status Badge */}
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${agent.statusBg} ${agent.statusColor}`}>
                  {agent.status === 'awake' && '🟢'}
                  {agent.status === 'sleep' && '🔵'}
                  {agent.status === 'thinking' && '🟡'}
                  {agent.status === 'paused' && '⚪'}
                  <span className="ml-1 capitalize">{agent.status}</span>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors">
                    Chat
                  </button>
                  <button className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm transition-colors">
                    View
                  </button>
                  <button className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm transition-colors">
                    ⚙️
                  </button>
                  <button className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors">
                    📊
                  </button>
                  <button className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors">
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bulk Actions - HARDCODED */}
      <div className="bg-white rounded-lg p-4 shadow-sm border mt-6">
        <div className="flex items-center justify-between">
          <div className="text-gray-600">
            Selected: 2 agents {/* HARDCODED count */}
          </div>
          <div className="flex space-x-3">
            <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors">
              Export All
            </button>
            <button className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded transition-colors">
              Pause All
            </button>
            <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors">
              Delete Selected
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 