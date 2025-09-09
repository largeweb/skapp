'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import ChatInterface from '../../../components/ChatInterface'
import MemoryViewer from '../../../components/MemoryViewer'

export const runtime = 'edge'

export default function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string>('')
  const [activeTab, setActiveTab] = useState('chat')
  const [agent, setAgent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [orchestrating, setOrchestrating] = useState(false)
  const [orchestrateResult, setOrchestrateResult] = useState<string | null>(null)

  useEffect(() => {
    const initPage = async () => {
      const resolvedParams = await params
      setId(resolvedParams.id)
      await fetchAgent(resolvedParams.id)
    }
    initPage()
  }, [params])

  const fetchAgent = async (agentId: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/agents/${agentId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch agent')
      }
      const data = await response.json()
      setAgent(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      const response = await fetch(`/api/agents/${id}/export`)
      if (!response.ok) {
        throw new Error('Failed to export data')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${agent?.name || 'agent'}-export-${new Date().toISOString().split('T')[0]}.zip`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    }
  }

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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (error || !agent) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center p-6">
          <div className="text-red-600 mb-2">Error loading agent</div>
          <button 
            onClick={() => fetchAgent(id)}
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
            
            <Link href={`/agents/${agent.agentId}/settings`} className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded transition-colors">
              Settings
            </Link>
            <button 
              onClick={handleExport}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
            >
              Export
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
            <div className="h-96">
              <ChatInterface 
                agentId={agent.agentId} 
                agentName={agent.name}
                className="h-full"
              />
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
                <button
                  onClick={() => fetchAgent(id)}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  🔄 Refresh
                </button>
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
                      {agent.turn_history.map((turn: any, index: number) => (
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
                          const parts = result.split(': ');
                          const toolCall = parts[0] || '';
                          const resultText = parts.slice(1).join(': ') || '';
                          const timestampMatch = result.match(/\[([^\]]+)\]$/);
                          const timestamp = timestampMatch ? timestampMatch[1] : '';
                          
                          return (
                            <div key={index} className="border border-gray-200 rounded p-2 bg-white">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="text-xs font-medium text-blue-600">{toolCall}</div>
                                  <div className="text-xs text-gray-700 mt-1">
                                    {resultText.replace(/\s*\[[^\]]*\]$/, '')}
                                  </div>
                                </div>
                                <div className="text-xs text-gray-500">
                                  {timestamp ? new Date(timestamp).toLocaleTimeString() : ''}
                                </div>
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
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold">Agent Settings</h3>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-blue-800">
                  <strong>Note:</strong> Settings functionality is available in the dedicated settings page.
                </div>
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