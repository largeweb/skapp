'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface MemoryEntry {
  id?: string
  content: string
  createdAt?: string
  expiresAt?: string
  metadata?: any
}

interface NoteEntry {
  content: string
  created_at: string
  expires_at: string
}

interface MemoryData {
  system_permanent_memory: string[]
  system_notes: NoteEntry[]
  system_thoughts: string[]
  system_tools: string[]
}

interface MemoryViewerProps {
  agentId: string
  className?: string
}

export default function MemoryViewer({ agentId, className = '' }: MemoryViewerProps) {
  const [memory, setMemory] = useState<MemoryData>({ system_permanent_memory: [], system_notes: [], system_thoughts: [], system_tools: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeLayer, setActiveLayer] = useState<'system_permanent_memory' | 'system_notes' | 'system_thoughts' | 'system_tools'>('system_permanent_memory')
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editContent, setEditContent] = useState('')

  const fetchMemory = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/agents/${agentId}?t=${Date.now()}`, {
        cache: 'no-store'
      })
      if (!response.ok) {
        throw new Error('Failed to fetch agent data')
      }
      const data = await response.json() as any
      
      // Use the new flat data structure
      setMemory({
        system_permanent_memory: data.system_permanent_memory || [],
        system_notes: data.system_notes || [],
        system_thoughts: data.system_thoughts || [],
        system_tools: data.system_tools || []
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      // Set empty memory structure on error
      setMemory({ system_permanent_memory: [], system_notes: [], system_thoughts: [], system_tools: [] })
    } finally {
      setLoading(false)
    }
  }, [agentId])

  useEffect(() => {
    fetchMemory()
  }, [fetchMemory, refreshTrigger])

  const addMemoryEntry = async (layer: string, content: string) => {
    try {
      const response = await fetch(`/api/agents/${agentId}/memory?layer=${layer}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      })
      
      if (!response.ok) {
        throw new Error('Failed to add memory entry')
      }
      
      // Trigger refresh by incrementing the trigger
      setRefreshTrigger(prev => prev + 1)
      setShowAddForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add memory entry')
    }
  }

  const addToolToAgent = async (toolId: string) => {
    try {
      const response = await fetch(`/api/agents/${agentId}/memory?layer=system_tools`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: toolId })
      })
      
      if (!response.ok) {
        throw new Error('Failed to add tool')
      }
      
      // Trigger refresh by incrementing the trigger
      setRefreshTrigger(prev => prev + 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add tool')
    }
  }





  const editMemoryEntry = async (layer: string, index: number, newContent: string) => {
    try {
      const response = await fetch(`/api/agents/${agentId}/memory?layer=${layer}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent, index })
      })
      
      if (!response.ok) {
        throw new Error('Failed to update memory entry')
      }
      
      // Trigger refresh by incrementing the trigger
      setRefreshTrigger(prev => prev + 1)
      setEditingIndex(null)
      setEditContent('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update memory entry')
    }
  }

  const removeMemoryEntry = async (layer: string, index: number) => {
    try {
      const response = await fetch(`/api/agents/${agentId}/memory?layer=${layer}&index=${index}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('Failed to remove memory entry')
      }
      
      // Trigger refresh by incrementing the trigger
      setRefreshTrigger(prev => prev + 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove memory entry')
    }
  }

  const startEditing = (index: number, entry: any) => {
    setEditingIndex(index)
    const content = typeof entry === 'string' ? entry : entry.content || ''
    setEditContent(content)
  }

  const cancelEditing = () => {
    setEditingIndex(null)
    setEditContent('')
  }

  const availableTools = [
    { id: 'web_search', name: 'Web Search', description: 'Search the internet for current information' },
    { id: 'take_note', name: 'Take Notes', description: 'Save important information to memory' },
    { id: 'take_thought', name: 'Take Thoughts', description: 'Record insights and reflections' },
    { id: 'discord_msg', name: 'Discord Messages', description: 'Send messages to Discord channels' },
    { id: 'sms_operator', name: 'SMS Operator', description: 'Send SMS messages' }
  ]

  const filteredMemory = (memory[activeLayer] || []).filter((entry: any) => {
    if (typeof entry === 'string') {
      return entry.toLowerCase().includes(searchTerm.toLowerCase())
    }
    if (entry.content) {
      return entry.content.toLowerCase().includes(searchTerm.toLowerCase())
    }
    return false
  })

  const layerConfig = {
    system_permanent_memory: {
      title: 'Permanent Memory',
      description: 'Core knowledge and persistent information',
      color: 'from-blue-500 to-blue-700',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      icon: '🧠'
    },
    system_notes: {
      title: 'Notes',
      description: 'Temporary notes and observations (7-day retention)',
      color: 'from-green-500 to-green-700',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      icon: '📝'
    },
    system_thoughts: {
      title: 'Thoughts',
      description: 'Internal thoughts and insights (sleep reset)',
      color: 'from-purple-500 to-purple-700',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      icon: '💭'
    },
    system_tools: {
      title: 'Tools',
      description: 'Available tools and capabilities',
      color: 'from-orange-500 to-orange-700',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      icon: '⚡'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  const getTimeUntilExpiry = (expiryDateString: string) => {
    const now = new Date()
    const expiry = new Date(expiryDateString)
    const diffInMinutes = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 0) return 'Expired'
    if (diffInMinutes < 60) return `${diffInMinutes}m left`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h left`
    return `${Math.floor(diffInMinutes / 1440)}d left`
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`text-center p-6 ${className}`}>
        <div className="text-red-600 mb-2">Error loading memory</div>
        <button 
          onClick={fetchMemory}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 focus:bg-blue-700 text-white rounded transition-colors focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Layer Selector */}
      <div className="flex flex-wrap gap-2">
        {(['system_permanent_memory', 'system_notes', 'system_thoughts', 'system_tools'] as const).map((layer) => (
          <motion.button
            key={layer}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveLayer(layer)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeLayer === layer
                ? `bg-gradient-to-r ${layerConfig[layer].color} text-white shadow-lg`
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span className="mr-2">{layerConfig[layer].icon}</span>
            {layerConfig[layer].title}
            <span className="ml-2 bg-white/20 px-2 py-1 rounded text-sm">
              {(memory[layer] || []).length}
            </span>
          </motion.button>
        ))}
      </div>

      {/* Active Layer Info */}
      <div className={`p-4 rounded-lg ${layerConfig[activeLayer].bgColor} ${layerConfig[activeLayer].borderColor} border`}>
        <h3 className="text-lg font-semibold mb-1 text-gray-900">{layerConfig[activeLayer].title}</h3>
        <p className="text-gray-600 text-sm">{layerConfig[activeLayer].description}</p>
      </div>

      {/* Search and Add */}
      <div className="flex gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search memory..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          />
        </div>
        <motion.button
          onClick={() => setShowAddForm(!showAddForm)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`px-6 py-2 rounded-lg font-medium transition-all ${
            showAddForm
              ? 'bg-gray-600 text-white'
              : `bg-gradient-to-r ${layerConfig[activeLayer].color} text-white hover:shadow-lg`
          }`}
        >
          {showAddForm ? 'Cancel' : 'Add Memory'}
        </motion.button>
      </div>

      {/* Add Memory Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            {activeLayer === 'system_tools' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Available Tools
                  </label>
                  <p className="text-sm text-gray-600 mb-4">
                    Choose which tools your agent can use. You can modify this selection at any time.
                  </p>
                </div>
                
                <div className="space-y-3">
                  {availableTools.map((tool) => {
                    const isSelected = (memory.system_tools || []).includes(tool.id)
                    
                    return (
                      <div 
                        key={tool.id} 
                        className={`border rounded-lg p-4 transition-all cursor-pointer ${
                          isSelected 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-300 bg-white hover:border-gray-400'
                        }`}
                        onClick={() => {
                          if (isSelected) {
                            // Find the index of the tool in the memory array
                            const toolIndex = (memory.system_tools || []).indexOf(tool.id)
                            if (toolIndex !== -1) {
                              removeMemoryEntry('system_tools', toolIndex)
                            }
                          } else {
                            addToolToAgent(tool.id)
                          }
                        }}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="mt-1">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                if (isSelected) {
                                  // Find the index of the tool in the memory array
                                  const toolIndex = (memory.system_tools || []).indexOf(tool.id)
                                  if (toolIndex !== -1) {
                                    removeMemoryEntry('system_tools', toolIndex)
                                  }
                                } else {
                                  addToolToAgent(tool.id)
                                }
                              }}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                            />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-gray-900 font-medium">{tool.name}</h3>
                            <p className="text-gray-600 text-sm">{tool.description}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <AddMemoryEntry 
                layer={activeLayer} 
                onAdd={addMemoryEntry}
                layerConfig={layerConfig[activeLayer]}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Memory Entries */}
      <div className="space-y-4">
        <AnimatePresence mode="wait">
          {filteredMemory.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-12 text-gray-500"
            >
              <div className="text-4xl mb-4">{layerConfig[activeLayer].icon}</div>
              <p>No {activeLayer} entries found</p>
              {searchTerm && <p className="text-sm mt-2">Try adjusting your search</p>}
            </motion.div>
          ) : (
            <div className="space-y-3">
              {activeLayer === 'system_tools' ? (
                // Special display for tools
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredMemory.map((toolId, index) => {
                    const tool = availableTools.find(t => t.id === toolId)
                    return tool ? (
                      <motion.div
                        key={toolId as string}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.1 }}
                        className={`p-4 rounded-lg border ${layerConfig[activeLayer].borderColor} bg-white shadow-sm hover:shadow-md transition-shadow`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{tool.name}</h4>
                            <p className="text-sm text-gray-600 mt-1">{tool.description}</p>
                          </div>
                          <button
                            onClick={() => {
                              // Find the index of the tool in the memory array
                              const toolIndex = (memory.system_tools || []).indexOf(toolId as string)
                              if (toolIndex !== -1) {
                                removeMemoryEntry('system_tools', toolIndex)
                              }
                            }}
                            className="ml-2 text-red-500 hover:text-red-700 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      </motion.div>
                    ) : null
                  })}
                </div>
              ) : (
                filteredMemory.map((entry, index) => {
                  const entryContent = typeof entry === 'string' ? entry : entry.content
                  const entryKey = typeof entry === 'string' ? `${index}-${entry}` : `${index}-${entry.content}`
                  
                  return (
                    <motion.div
                      key={entryKey}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-4 rounded-lg border ${layerConfig[activeLayer].borderColor} bg-white shadow-sm hover:shadow-md transition-shadow`}
                    >
                      <div className="text-gray-800 whitespace-pre-wrap">
                        {editingIndex === index ? (
                          <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            rows={4}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 resize-none"
                          />
                        ) : (
                          <div>
                            <div className="mb-2">{entryContent}</div>
                            {activeLayer === 'system_notes' && typeof entry !== 'string' && entry.expires_at && (
                              <div className="text-sm text-gray-500">
                                Expires: {formatDate(entry.expires_at)} ({getTimeUntilExpiry(entry.expires_at)})
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex justify-end space-x-3 mt-2">
                        {editingIndex === index && (
                          <>
                            <button
                              onClick={() => editMemoryEntry(activeLayer, index, editContent)}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-blue-500"
                            >
                              Save
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg transition-colors hover:bg-gray-400 focus-visible:ring-2 focus-visible:ring-gray-500"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {editingIndex !== index && (
                          <>
                            <button
                              onClick={() => startEditing(index, entry)}
                              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-yellow-500"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => removeMemoryEntry(activeLayer, index)}
                              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-red-500"
                            >
                              Remove
                            </button>
                          </>
                        )}
                      </div>
                    </motion.div>
                  )
                })
              )}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

interface AddMemoryEntryProps {
  layer: string
  onAdd: (layer: string, content: string) => Promise<void>
  layerConfig: any
}

function AddMemoryEntry({ layer, onAdd, layerConfig }: AddMemoryEntryProps) {
  const [content, setContent] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    
    setIsAdding(true)
    try {
      await onAdd(layer, content.trim())
      setContent('')
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Add {layerConfig.title}
        </label>
        <textarea
          placeholder={`Enter ${layer.toLowerCase()} content...`}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 resize-none"
          disabled={isAdding}
        />
      </div>
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => setContent('')}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          disabled={isAdding}
        >
          Clear
        </button>
        <button
          type="submit"
          disabled={!content.trim() || isAdding}
          className={`px-6 py-2 rounded-lg font-medium transition-all ${
            content.trim() && !isAdding
              ? `bg-gradient-to-r ${layerConfig.color} text-white hover:shadow-lg focus-visible:ring-2 focus-visible:ring-blue-500`
              : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-60'
          }`}
        >
          {isAdding ? 'Adding...' : 'Add Memory'}
        </button>
      </div>
    </form>
  )
}
