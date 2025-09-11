'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import ChatInterface from '../../../components/ChatInterface'
import MemoryViewer from '../../../components/MemoryViewer'
import { 
  getCurrentAgentMode, 
  fetchAgentContext, 
  fetchAgent, 
  orchestrateAgent, 
  downloadFile, 
  generateFilename,
  getAgentStatusColors,
  getLoadingSpinnerClasses,
  getTextClasses
} from '@/lib/utils'

export const runtime = 'edge'

export default function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string>('')
  const [activeTab, setActiveTab] = useState('chat')
  const [agent, setAgent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [orchestrating, setOrchestrating] = useState(false)
  const [orchestrateResult, setOrchestrateResult] = useState<string | null>(null)
  
  // Expandable sections states
  const [chatContextExpanded, setChatContextExpanded] = useState(false)
  const [awakeContextExpanded, setAwakeContextExpanded] = useState(false)
  const [sleepContextExpanded, setSleepContextExpanded] = useState(false)
  
  // Context data states
  const [chatContextData, setChatContextData] = useState<any>(null)
  const [awakeContextData, setAwakeContextData] = useState<any>(null)
  const [sleepContextData, setSleepContextData] = useState<any>(null)
  
  // Loading states
  const [chatContextLoading, setChatContextLoading] = useState(false)
  const [awakeContextLoading, setAwakeContextLoading] = useState(false)
  const [sleepContextLoading, setSleepContextLoading] = useState(false)

  // Get current mode using centralized utility
  const getCurrentMode = () => getCurrentAgentMode()

  // Fetch context data functions using centralized utilities
  const fetchChatContextData = async () => {
    if (chatContextData) return // Already loaded
    setChatContextLoading(true)
    
    const result = await fetchAgentContext(id, 'chat')
    if (result.success) {
      setChatContextData(result.data)
    } else {
      console.error('Failed to fetch chat context:', result.error)
    }
    
    setChatContextLoading(false)
  }

  const fetchAwakeContextData = async () => {
    if (awakeContextData) return // Already loaded
    setAwakeContextLoading(true)
    
    const result = await fetchAgentContext(id, 'awake')
    if (result.success) {
      setAwakeContextData(result.data)
    } else {
      console.error('Failed to fetch awake context:', result.error)
    }
    
    setAwakeContextLoading(false)
  }

  const fetchSleepContextData = async () => {
    if (sleepContextData) return // Already loaded
    setSleepContextLoading(true)
    
    const result = await fetchAgentContext(id, 'sleep')
    if (result.success) {
      setSleepContextData(result.data)
    } else {
      console.error('Failed to fetch sleep context:', result.error)
    }
    
    setSleepContextLoading(false)
  }

  useEffect(() => {
    const initPage = async () => {
      const resolvedParams = await params
      setId(resolvedParams.id)
      await fetchAgentData(resolvedParams.id)
    }
    initPage()
  }, [params])

  const fetchAgentData = async (agentId: string) => {
    setLoading(true)
    const result = await fetchAgent(agentId)
    
    if (result.success) {
      setAgent(result.data)
      setError(null)
    } else {
      setError(result.error || 'Failed to fetch agent')
    }
    
    setLoading(false)
  }

  const handleExport = async () => {
    try {
      const response = await fetch(`/api/agents/${id}/export-csv`)
      if (!response.ok) {
        throw new Error('Failed to export CSV data')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${agent?.name || 'agent'}-export-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'CSV export failed')
    }
  }

  const handleDeleteAgent = async (agentId: string) => {
    try {
      const response = await fetch(`/api/agents/${agentId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        console.log(`✅ Agent ${agentId} deleted successfully`);
        // Redirect to dashboard
        window.location.href = '/';
      } else {
        const error = await response.json() as any;
        alert(`Failed to delete agent: ${error.error}`);
      }
    } catch (error) {
      console.error('💥 Delete agent failed:', error);
      alert('Failed to delete agent');
    }
  };

  const handleOrchestrateAgent = async () => {
    setOrchestrating(true)
    setOrchestrateResult(null)
    
    try {
      console.log(`🎭 Orchestrating agent: ${id}`)
      const response = await fetch('/api/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: id,
          mode: 'awake',
          estTime: new Date().toISOString()
        })
      })
      
      if (response.ok) {
        const data = await response.json() as any
        setOrchestrateResult(`✅ Turn completed successfully`)
        console.log('✅ Agent orchestration result:', data)
        
        // Refresh agent data after orchestration
        setTimeout(() => {
          fetchAgent(id)
        }, 2000)
      } else {
        const error = await response.json() as any
        setOrchestrateResult(`❌ Failed: ${error.error}`)
      }
    } catch (error) {
      console.error('💥 Agent orchestration failed:', error)
      setOrchestrateResult('❌ Network error occurred')
    } finally {
      setOrchestrating(false)
      setTimeout(() => setOrchestrateResult(null), 5000)
    }
  }

  const tabs = [
    { id: 'chat', label: 'Chat', icon: '💬' },
    { id: 'memory', label: 'Memory', icon: '🧠' },
    { id: 'activity', label: 'Activity', icon: '📊' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ]

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600">        </div>
      </div>
      
      {/* No modal needed - using inline expandable sections */}
    </div>
  )
}

  if (error || !agent) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center p-6">
          <div className="text-red-600 mb-2">Error loading agent</div>
          <button 
            onClick={() => fetchAgentData(id)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'awake': return { bg: 'bg-green-100', text: 'text-green-600' }
      case 'sleep': return { bg: 'bg-blue-100', text: 'text-blue-600' }
      default: return { bg: 'bg-gray-100', text: 'text-gray-600' }
    }
  }

  const statusColors = getStatusColor(agent.currentMode || 'awake')

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{agent.name}</h1>
              <p className="text-gray-600">{agent.description}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className={`px-4 py-2 rounded-full text-sm font-medium ${statusColors.bg} ${statusColors.text}`}>
              {agent.currentMode || 'awake'} mode
            </div>
            
            {/* Orchestrate Result */}
            {orchestrateResult && (
              <div className="text-sm px-3 py-1 rounded-lg bg-gray-100 text-gray-700">
                {orchestrateResult}
              </div>
            )}
            
            {/* Run Agent Turn Button */}
            <button
              onClick={handleOrchestrateAgent}
              disabled={orchestrating}
              className={`px-6 py-2 rounded-lg flex items-center space-x-2 transition-all duration-200 ${
                orchestrating 
                  ? 'bg-gray-400 cursor-not-allowed text-white' 
                  : 'bg-green-600 hover:bg-green-700 text-white shadow-sm hover:shadow-md'
              }`}
            >
              {orchestrating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  <span>Running Turn...</span>
                </>
              ) : (
                <>
                  <span>🎭</span>
                  <span>Run Agent Turn</span>
                </>
              )}
            </button>
            

            <button 
              onClick={handleExport}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
            >
              Export Agent (CSV)
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-4 text-sm font-medium transition-colors flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'chat' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Chat with {agent.name}</h3>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Currently in <span className="font-medium">{getCurrentMode()}</span> mode
                  </div>
                </div>
                <button
                  onClick={() => {
                    console.log('Chat context button clicked');
                    setChatContextExpanded(!chatContextExpanded);
                    if (!chatContextExpanded) {
                      fetchChatContextData();
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm flex items-center space-x-2"
                >
                  <span>🔍</span>
                  <span>{chatContextExpanded ? 'Hide' : 'View'} Agent Context</span>
                </button>
              </div>
              <div className="h-96">
                <ChatInterface 
                  agentId={agent.agentId} 
                  agentName={agent.name}
                  className="h-full"
                />
              </div>
              
              {/* Chat Context Expandable Section */}
              {chatContextExpanded && (
                <div className="mt-6 border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
                  <h4 className="font-medium mb-3 text-blue-800 dark:text-blue-200">💬 Chat Mode System Prompt</h4>
                  {chatContextLoading ? (
                    <div className="flex items-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 dark:border-blue-400 mr-2"></div>
                      <span className="text-gray-600 dark:text-gray-400">Loading chat context...</span>
                    </div>
                  ) : chatContextData ? (
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                        Generated at: {chatContextData.currentTime}
                      </div>
                      <pre className="text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-3 rounded border border-gray-200 dark:border-gray-600 overflow-x-auto whitespace-pre-wrap max-h-96 overflow-y-auto">
                        {chatContextData.systemPrompt}
                      </pre>
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-500">Failed to load context data.</p>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'memory' && (
            <div>
              <MemoryViewer agentId={agent.agentId} />
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Activity Timeline</h3>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => {
                      console.log('Awake context button clicked');
                      setAwakeContextExpanded(!awakeContextExpanded);
                      if (!awakeContextExpanded) {
                        fetchAwakeContextData();
                      }
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm flex items-center space-x-1"
                  >
                    <span>🌅</span>
                    <span>{awakeContextExpanded ? 'Hide' : 'Show'} Awake Context</span>
                  </button>
                  <button
                    onClick={() => {
                      console.log('Sleep context button clicked');
                      setSleepContextExpanded(!sleepContextExpanded);
                      if (!sleepContextExpanded) {
                        fetchSleepContextData();
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm flex items-center space-x-1"
                  >
                    <span>😴</span>
                    <span>{sleepContextExpanded ? 'Hide' : 'Show'} Sleep Context</span>
                  </button>
                  <button
                    onClick={() => fetchAgentData(id)}
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    🔄 Refresh
                  </button>
                </div>
              </div>
              
              {/* Turn History Section */}
              {agent.turn_history && agent.turn_history.length > 0 ? (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">
                      Turn History ({agent.turn_history.length} turns)
                    </h4>
                    <div className="text-sm text-gray-600 mb-3">
                      Complete conversation history with timestamps
                    </div>
                    
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {agent.turn_history.slice().reverse().map((turn: any, index: number) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-3 bg-white">
                          <div className="flex justify-between items-start mb-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              turn.role === 'user' 
                                ? 'bg-blue-100 text-blue-700' 
                                : 'bg-green-100 text-green-700'
                            }`}>
                              {turn.role === 'user' ? '👤 User' : '🤖 Agent'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {turn.timestamp ? new Date(turn.timestamp).toLocaleString() : `Turn ${index + 1}`}
                            </span>
                          </div>
                          
                          <div className="text-sm text-gray-800">
                            {turn.content || turn.parts?.[0]?.text || 'No content'}
                          </div>
                          
                          {/* Extract tool calls from turn content */}
                          {turn.content && turn.content.includes('<sktool>') && (
                            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                              <div className="text-xs text-yellow-700 font-medium mb-1">🛠️ Tool Calls Detected:</div>
                              <div className="text-xs text-yellow-600">
                                {(turn.content.match(/<sktool><([^>]+)>/g) || [])
                                  .map((match: string) => match.replace(/<sktool><([^>]+)>/, '$1'))
                                  .join(', ')}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Tool Call Results Section */}
                  {agent.tool_call_results && agent.tool_call_results.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">
                        Recent Tool Executions ({agent.tool_call_results.length} results)
                      </h4>
                      <div className="text-sm text-gray-600 mb-3">
                        Tool calls executed in the last 2 hours
                      </div>
                      
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {agent.tool_call_results.slice(-10).reverse().map((result: string, index: number) => {
                          // Enhanced parsing for new format: toolId(params) → result [timestamp]
                          const arrowSplit = result.split(' → ');
                          const toolCallPart = arrowSplit[0] || '';
                          const resultPart = arrowSplit[1] || '';
                          
                          // Extract tool name and parameters
                          const toolMatch = toolCallPart.match(/^([^(]+)\((.+)\)$/);
                          const toolName = toolMatch ? toolMatch[1] : toolCallPart;
                          const params = toolMatch ? toolMatch[2] : '';
                          
                          // Extract result and timestamp
                          const timestampMatch = resultPart.match(/^(.+?)\s*\[([^\]]+)\]$/);
                          const resultText = timestampMatch ? timestampMatch[1] : resultPart;
                          const timestamp = timestampMatch ? timestampMatch[2] : '';
                          
                          return (
                            <div key={index} className="border border-gray-200 dark:border-gray-600 rounded p-3 bg-white dark:bg-gray-800">
                              <div className="flex justify-between items-start mb-2">
                                <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                  🛠️ {toolName}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-500">
                                  {timestamp ? new Date(timestamp).toLocaleTimeString() : ''}
                                </div>
                              </div>
                              {params && (
                                <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 bg-gray-50 dark:bg-gray-700 p-2 rounded">
                                  Parameters: {params}
                                </div>
                              )}
                              <div className="text-sm text-gray-800 dark:text-gray-200">
                                {resultText}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* Agent Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-blue-600">{agent.turnsCount || 0}</div>
                      <div className="text-xs text-gray-600">Total Turns</div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-green-600">{agent.system_notes?.length || 0}</div>
                      <div className="text-xs text-gray-600">Active Notes</div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-purple-600">{agent.system_thoughts?.length || 0}</div>
                      <div className="text-xs text-gray-600">Current Thoughts</div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-orange-600">{agent.tool_call_results?.length || 0}</div>
                      <div className="text-xs text-gray-600">Tool Results</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p>No activity yet</p>
                  <p className="text-sm mt-2">Turn history and tool executions will appear here</p>
                </div>
              )}
              
              {/* Awake Context Expandable Section */}
              {awakeContextExpanded && (
                <div className="mt-6 border border-green-200 dark:border-green-700 rounded-lg p-4 bg-green-50 dark:bg-green-900/20">
                  <h4 className="font-medium mb-3 text-green-700 dark:text-green-300">🌅 Awake Mode System Prompt</h4>
                  {awakeContextLoading ? (
                    <div className="flex items-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 dark:border-green-400 mr-2"></div>
                      <span className="text-gray-600 dark:text-gray-400">Loading awake context...</span>
                    </div>
                  ) : awakeContextData ? (
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                        Generated at: {awakeContextData.currentTime}
                      </div>
                      <pre className="text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-3 rounded border border-gray-200 dark:border-gray-600 overflow-x-auto whitespace-pre-wrap max-h-96 overflow-y-auto">
                        {awakeContextData.systemPrompt}
                      </pre>
                      {awakeContextData.turnPrompt && (
                        <div className="mt-4">
                          <h5 className="font-medium mb-2 text-green-700 dark:text-green-300">Turn Prompt:</h5>
                          <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-3 rounded border border-gray-200 dark:border-gray-600 text-sm">
                            {awakeContextData.turnPrompt}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-500">Failed to load awake context data.</p>
                  )}
                </div>
              )}
              
              {/* Sleep Context Expandable Section */}
              {sleepContextExpanded && (
                <div className="mt-6 border border-blue-200 dark:border-blue-700 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
                  <h4 className="font-medium mb-3 text-blue-700 dark:text-blue-300">😴 Sleep Mode System Prompt</h4>
                  {sleepContextLoading ? (
                    <div className="flex items-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 dark:border-blue-400 mr-2"></div>
                      <span className="text-gray-600 dark:text-gray-400">Loading sleep context...</span>
                    </div>
                  ) : sleepContextData ? (
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                        Generated at: {sleepContextData.currentTime}
                      </div>
                      <pre className="text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-3 rounded border border-gray-200 dark:border-gray-600 overflow-x-auto whitespace-pre-wrap max-h-96 overflow-y-auto">
                        {sleepContextData.systemPrompt}
                      </pre>
                      {sleepContextData.turnPrompt && (
                        <div className="mt-4">
                          <h5 className="font-medium mb-2 text-blue-700 dark:text-blue-300">Sleep Mode Prompt:</h5>
                          <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-3 rounded border border-gray-200 dark:border-gray-600 text-sm">
                            {sleepContextData.turnPrompt}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-500">Failed to load sleep context data.</p>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold">Agent Configuration</h3>
              
              {/* Basic Info */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium mb-3">Basic Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Agent ID:</span>
                    <span className="ml-2 font-mono">{agent.agentId}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Name:</span>
                    <span className="ml-2">{agent.name}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-600">Description:</span>
                    <div className="ml-2 mt-1">{agent.description}</div>
                  </div>
                </div>
              </div>

              {/* Memory Stats */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium mb-3">Memory Statistics</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{agent.system_permanent_memory?.length || 0}</div>
                    <div className="text-xs text-gray-600">Permanent Memory</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{agent.system_notes?.length || 0}</div>
                    <div className="text-xs text-gray-600">Active Notes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{agent.system_thoughts?.length || 0}</div>
                    <div className="text-xs text-gray-600">Current Thoughts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{agent.turnsCount || 0}</div>
                    <div className="text-xs text-gray-600">Total Turns</div>
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-medium text-red-800 mb-3">⚠️ Danger Zone</h4>
                <p className="text-sm text-red-700 mb-4">
                  Permanent actions that cannot be undone. Use with extreme caution.
                </p>
                <button
                  onClick={() => {
                    if (confirm(`Are you sure you want to delete "${agent.name}"? This action cannot be undone and will permanently remove all agent data, memories, and conversation history.`)) {
                      handleDeleteAgent(agent.agentId);
                    }
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  🗑️ Delete Agent Permanently
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Basic Info</h4>
                  <div className="bg-gray-50 p-3 rounded border text-gray-600">
                    Name: {agent.name}<br/>
                    Description: {agent.description}<br/>
                    Agent ID: {agent.agentId}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Memory Configuration</h4>
                  <div className="bg-gray-50 p-3 rounded border text-gray-600">
                    PMEM: {agent.pmem?.length || 0} entries<br/>
                    Notes: {agent.note?.length || 0} entries<br/>
                    Thoughts: {agent.thgt?.length || 0} entries<br/>
                    Tools: {agent.tools?.length || 0} entries<br/>
                    Available tools: {agent.tools?.join(', ') || 'None'}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Schedule</h4>
                  <div className="bg-gray-50 p-3 rounded border text-gray-600">
                    Timezone: EST<br/>
                    Current Mode: {agent.currentMode || 'awake'}<br/>
                    Last Activity: {agent.lastActivity || 'Unknown'}<br/>
                    Turns Count: {agent.turnsCount || 0}
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