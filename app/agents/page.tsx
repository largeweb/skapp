'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Agent, AgentsResponse } from '@/lib/types'

export const runtime = 'edge'

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetchAgents()
  }, [])

  const fetchAgents = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/agents')
      if (!response.ok) {
        throw new Error('Failed to fetch agents')
      }
      const data = await response.json() as AgentsResponse
      setAgents(data.agents || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'awake': return { text: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' }
      case 'sleep': return { text: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' }
      case 'deep_sleep': return { text: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' }
      case 'wakeup': return { text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' }
      default: return { text: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-gray-700/20' }
    }
  }

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || agent.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
              <span className="mr-3">🤖</span>
              My Agents ({agents.length})
            </h1>
          </div>
          <Link href="/create" className="bg-blue-600 hover:bg-blue-700 focus:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500">
            <span>+</span>
            <span>New</span>
          </Link>
        </div>
        
        {/* Search and Filters */}
        <div className="flex space-x-4 mt-4">
          <input 
            type="text" 
            placeholder="🔍 Search agents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          />
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            <option value="all">Filter: All</option>
            <option value="awake">Awake</option>
            <option value="sleep">Sleep</option>
            <option value="deep_sleep">Deep Sleep</option>
            <option value="wakeup">Wakeup</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading agents...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-12">
          <div className="text-red-600 dark:text-red-400 mb-4">Error loading agents</div>
          <button 
            onClick={fetchAgents}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 focus:bg-blue-700 text-white rounded transition-colors focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Retry
          </button>
        </div>
      )}

      {/* Agents List */}
      {!loading && !error && (
        <>
          {filteredAgents.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🤖</div>
              <p className="text-gray-600 dark:text-gray-400">No agents found</p>
              {searchTerm && <p className="text-sm mt-2 text-gray-500 dark:text-gray-500">Try adjusting your search</p>}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAgents.map((agent) => {
                const statusColors = getStatusColor(agent.status)
                return (
          <div key={agent.id} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Checkbox - HARDCODED */}
                <input type="checkbox" className="w-4 h-4 text-blue-600 dark:text-blue-400 rounded focus:ring-2 focus:ring-blue-500" />
                
                {/* Agent Icon and Info */}
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">🤖</div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{agent.name}</h3>
                    <p className="text-gray-600 dark:text-gray-400">{agent.description}</p>
                    <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500 dark:text-gray-500">
                      <span>Memory: {agent.memoryStats?.pmem || 0} PMEM, {agent.memoryStats?.note || 0} notes</span>
                      <span>•</span>
                      <span>{agent.lastActivity || 'Unknown'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status and Actions */}
              <div className="flex items-center space-x-4">
                {/* Status Badge */}
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors.bg} ${statusColors.text}`}>
                  {agent.status === 'awake' && '🟢'}
                  {agent.status === 'sleep' && '🔵'}
                  {agent.status === 'deep_sleep' && '🟣'}
                  {agent.status === 'wakeup' && '🟠'}
                  <span className="ml-1 capitalize">{agent.status}</span>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <Link href={`/agents/${agent.id}`} className="bg-blue-600 hover:bg-blue-700 focus:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors focus-visible:ring-2 focus-visible:ring-blue-500">
                    Chat
                  </Link>
                  <Link href={`/agents/${agent.id}`} className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 px-3 py-1 rounded text-sm transition-colors focus-visible:ring-2 focus-visible:ring-blue-500">
                    View
                  </Link>
                  <Link href={`/agents/${agent.id}/settings`} className="bg-blue-600 hover:bg-blue-700 focus:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors focus-visible:ring-2 focus-visible:ring-blue-500">
                    ⚙️
                  </Link>
                  <button 
                    onClick={() => alert(`Exporting data for ${agent.name}...`)}
                    className="bg-green-600 hover:bg-green-700 focus:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    📊
                  </button>
                  <button 
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete ${agent.name}?`)) {
                        alert(`${agent.name} would be deleted (HARDCODED)`)
                      }
                    }}
                    className="bg-red-600 hover:bg-red-700 focus:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Bulk Actions - HARDCODED */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 mt-6">
        <div className="flex items-center justify-between">
          <div className="text-gray-600 dark:text-gray-400">
            Selected: 2 agents {/* HARDCODED count */}
          </div>
          <div className="flex space-x-3">
            <button className="bg-green-600 hover:bg-green-700 focus:bg-green-700 text-white px-4 py-2 rounded transition-colors focus-visible:ring-2 focus-visible:ring-blue-500">
              Export All
            </button>
            <button className="bg-amber-600 hover:bg-amber-700 focus:bg-amber-700 text-white px-4 py-2 rounded transition-colors focus-visible:ring-2 focus-visible:ring-blue-500">
              Pause All
            </button>
            <button className="bg-red-600 hover:bg-red-700 focus:bg-red-700 text-white px-4 py-2 rounded transition-colors focus-visible:ring-2 focus-visible:ring-blue-500">
              Delete Selected
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 