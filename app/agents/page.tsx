'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function AgentsPage() {
  const [agents, setAgents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedAgents, setSelectedAgents] = useState<string[]>([])

  useEffect(() => {
    fetchAgents()
  }, [])

  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/agents')
      if (response.ok) {
        const data = await response.json() as any
        setAgents(data.agents || [])
      } else {
        setError('Failed to load agents')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const deleteAgent = async (agentId: string) => {
    try {
      const response = await fetch(`/api/agents/${agentId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        // Remove from local state
        setAgents(prev => prev.filter(agent => agent.id !== agentId))
        // Remove from selected if it was selected
        setSelectedAgents(prev => prev.filter(id => id !== agentId))
      } else {
        const errorData = await response.json() as any
        alert(`Failed to delete agent: ${errorData.error || 'Unknown error'}`)
      }
    } catch (err) {
      console.error('Error deleting agent:', err)
      alert('Failed to delete agent')
    }
  }

  const exportAgent = async (agentId: string) => {
    try {
      const response = await fetch(`/api/agents/${agentId}/export`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `agent-${agentId}-export.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        alert('Failed to export agent')
      }
    } catch (err) {
      console.error('Error exporting agent:', err)
      alert('Failed to export agent')
    }
  }

  const bulkExport = async () => {
    for (const agentId of selectedAgents) {
      await exportAgent(agentId)
    }
  }

  const bulkPause = async () => {
    try {
      // Update all selected agents to 'sleep' status
      const updatePromises = selectedAgents.map(agentId =>
        fetch(`/api/agents/${agentId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentMode: 'sleep' })
        })
      )
      
      await Promise.all(updatePromises)
      fetchAgents() // Refresh the list
      setSelectedAgents([]) // Clear selection
    } catch (err) {
      console.error('Error pausing agents:', err)
      alert('Failed to pause agents')
    }
  }

  const bulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedAgents.length} agents? This cannot be undone.`)) {
      return
    }
    
    try {
      const deletePromises = selectedAgents.map(agentId => deleteAgent(agentId))
      await Promise.all(deletePromises)
      setSelectedAgents([]) // Clear selection
    } catch (err) {
      console.error('Error deleting agents:', err)
      alert('Failed to delete some agents')
    }
  }

  const toggleAgentSelection = (agentId: string) => {
    setSelectedAgents(prev => 
      prev.includes(agentId) 
        ? prev.filter(id => id !== agentId)
        : [...prev, agentId]
    )
  }

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || agent.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-4">Error loading agents</div>
          <button 
            onClick={fetchAgents}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            My Agents ({agents.length})
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your AI agents and their configurations
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={fetchAgents}
            disabled={loading}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-all duration-200 disabled:opacity-50"
          >
            Refresh
          </button>
          <Link 
            href="/create" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-all duration-200"
          >
            + New
          </Link>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search agents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">Filter: All</option>
          <option value="awake">Awake</option>
          <option value="sleep">Sleep</option>
          <option value="deep_sleep">Deep Sleep</option>
          <option value="wakeup">Wakeup</option>
        </select>
      </div>

      {/* Agents List */}
      <div className="space-y-4">
        {filteredAgents.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No agents found</p>
          </div>
        ) : (
          filteredAgents.map((agent, index) => (
            <div
              key={agent.id || index}
              className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-center space-x-4">
                <input
                  type="checkbox"
                  checked={selectedAgents.includes(agent.id)}
                  onChange={() => toggleAgentSelection(agent.id)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-semibold text-gray-900">{agent.id || 'No ID'}</h3>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600">
                      {agent.status || 'unknown'}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">{agent.description || agent.name || 'No description'}</p>
                  <div className="text-gray-500 text-sm">
                    Memory: {agent.memoryStats?.pmem || 0} PMEM, {agent.memoryStats?.note || 0} notes
                  </div>
                  <div className="text-gray-400 text-xs mt-1">
                    {new Date(agent.createdAt || agent.lastActivity || Date.now()).toISOString()}
                  </div>
                </div>

                <div className="flex space-x-3">
                  <Link
                    href={`/agents/${agent.id}`}
                    className="w-12 h-12 rounded-lg text-lg transition-all duration-200 border-2 flex items-center justify-center text-blue-600 hover:text-blue-700 border-blue-300 hover:border-blue-400 hover:bg-blue-50"
                    title="Chat with agent"
                  >
                    ▶️
                  </Link>
                  <Link
                    href={`/agents/${agent.id}`}
                    className="w-12 h-12 rounded-lg text-lg transition-all duration-200 border-2 flex items-center justify-center text-blue-600 hover:text-blue-700 border-blue-300 hover:border-blue-400 hover:bg-blue-50"
                    title="View agent details"
                  >
                    👁️
                  </Link>
                  <Link
                    href={`/agents/${agent.id}/settings`}
                    className="w-12 h-12 rounded-lg text-lg transition-all duration-200 border-2 flex items-center justify-center text-gray-600 hover:text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                    title="Agent settings"
                  >
                    ⚙️
                  </Link>
                  <button
                    onClick={() => exportAgent(agent.id)}
                    className="w-12 h-12 rounded-lg text-lg transition-all duration-200 border-2 flex items-center justify-center text-gray-600 hover:text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                    title="Export agent data"
                  >
                    📥
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this agent?')) {
                        deleteAgent(agent.id)
                      }
                    }}
                    className="w-12 h-12 rounded-lg text-lg transition-all duration-200 border-2 flex items-center justify-center text-red-600 hover:text-red-700 border-red-300 hover:border-red-400 hover:bg-red-50"
                    title="Delete agent"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bulk Actions */}
      {selectedAgents.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 shadow-lg">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <span className="text-gray-700">Selected: {selectedAgents.length} agents</span>
            <div className="flex space-x-4">
              <button 
                onClick={bulkExport}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Export All
              </button>
              <button 
                onClick={bulkPause}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Pause All
              </button>
              <button 
                onClick={bulkDelete}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Delete Selected
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 