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

  const tabs = [
    { id: 'chat', label: 'Chat', icon: 'Chat' },
    { id: 'memory', label: 'Memory', icon: 'Memory' },
    { id: 'activity', label: 'Activity', icon: 'Activity' },
    { id: 'settings', label: 'Settings', icon: 'Settings' }
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
      case 'awake': return { bg: 'bg-blue-100', text: 'text-blue-600' }
      case 'sleep': return { bg: 'bg-blue-100', text: 'text-blue-600' }
      case 'deep_sleep': return { bg: 'bg-blue-100', text: 'text-blue-600' }
      case 'wakeup': return { bg: 'bg-blue-100', text: 'text-blue-600' }
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
              {agent.currentMode || 'awake'} ({agent.lastActivity || 'Unknown'})
            </div>
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
              <h3 className="text-xl font-semibold">Activity Timeline</h3>
              <div className="text-center py-12 text-gray-500">
                <p>Activity timeline will be implemented with real agent data</p>
                <p className="text-sm mt-2">Shows agent actions, tool usage, and mode changes</p>
              </div>
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
                    Core Knowledge: {agent.coreKnowledge?.length || 0} entries<br/>
                    Available tools: {Object.entries(agent.availableTools || {})
                      .filter(([_, enabled]) => enabled)
                      .map(([tool, _]) => tool)
                      .join(', ')}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Schedule</h4>
                  <div className="bg-gray-50 p-3 rounded border text-gray-600">
                    Timezone: EST<br/>
                    Current Mode: {agent.currentMode || 'awake'}<br/>
                    Last Activity: {agent.lastActivity || 'Unknown'}
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