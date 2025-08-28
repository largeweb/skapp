'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface MemoryEntry {
  id?: string
  content: string
  createdAt?: string
  expiresAt?: string
  metadata?: any
}

interface MemoryData {
  pmem: string[]
  note: string[]
  thgt: string[]
  tools: string[]
}

interface MemoryViewerProps {
  agentId: string
  className?: string
}

export default function MemoryViewer({ agentId, className = '' }: MemoryViewerProps) {
  const [memory, setMemory] = useState<MemoryData>({ pmem: [], note: [], thgt: [], tools: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeLayer, setActiveLayer] = useState<'pmem' | 'note' | 'thgt' | 'tools'>('pmem')
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)

  useEffect(() => {
    fetchMemory()
  }, [agentId])

  const fetchMemory = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/agents/${agentId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch agent data')
      }
      const data = await response.json() as any
      
      // Use the new flat data structure
      setMemory({
        pmem: data.pmem || [],
        note: data.note || [],
        thgt: data.thgt || [],
        tools: data.tools || []
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      // Set empty memory structure on error
      setMemory({ pmem: [], note: [], thgt: [], tools: [] })
    } finally {
      setLoading(false)
    }
  }

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
      
      // Refresh memory data
      await fetchMemory()
      setShowAddForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add memory entry')
    }
  }

  const filteredMemory = (memory[activeLayer] || []).filter(entry =>
    entry.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const layerConfig = {
    pmem: {
      title: 'Permanent Memory',
      description: 'Core knowledge and persistent information',
      color: 'from-blue-500 to-blue-700',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      icon: '🧠'
    },
    note: {
      title: 'Notes',
      description: 'Temporary notes and observations (7-day retention)',
      color: 'from-green-500 to-green-700',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      icon: '📝'
    },
    thgt: {
      title: 'Thoughts',
      description: 'Internal thoughts and insights (sleep reset)',
      color: 'from-purple-500 to-purple-700',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      icon: '💭'
    },
    tools: {
      title: 'Tools',
      description: 'Available tools and capabilities',
      color: 'from-orange-500 to-orange-700',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      icon: '⚡'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
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
        {(['pmem', 'note', 'thgt', 'tools'] as const).map((layer) => (
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
            <AddMemoryEntry 
              layer={activeLayer} 
              onAdd={addMemoryEntry}
              layerConfig={layerConfig[activeLayer]}
            />
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
              {filteredMemory.map((entry, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-lg border ${layerConfig[activeLayer].borderColor} bg-white shadow-sm hover:shadow-md transition-shadow`}
                >
                  <div className="text-gray-800 whitespace-pre-wrap">
                    {entry}
                  </div>
                </motion.div>
              ))}
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
