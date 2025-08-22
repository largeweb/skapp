'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface MemoryEntry {
  id: string
  content: string
  createdAt: string
  expiresAt?: string
  metadata?: any
}

interface MemoryData {
  pmem: MemoryEntry[]
  note: MemoryEntry[]
  thgt: MemoryEntry[]
  work: MemoryEntry[]
}

interface MemoryViewerProps {
  agentId: string
  className?: string
}

export default function MemoryViewer({ agentId, className = '' }: MemoryViewerProps) {
  const [memory, setMemory] = useState<MemoryData>({ pmem: [], note: [], thgt: [], work: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeLayer, setActiveLayer] = useState<'pmem' | 'note' | 'thgt' | 'work'>('pmem')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchMemory()
  }, [agentId])

  const fetchMemory = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/agents/${agentId}/memory`)
      if (!response.ok) {
        throw new Error('Failed to fetch memory')
      }
      const data = await response.json() as any
      
      // Ensure we have the correct memory structure with fallbacks
      const memoryData = data.memory || {}
      setMemory({
        pmem: memoryData.pmem || [],
        note: memoryData.note || [],
        thgt: memoryData.thgt || [],
        work: memoryData.work || []
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      // Set empty memory structure on error
      setMemory({ pmem: [], note: [], thgt: [], work: [] })
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add memory entry')
    }
  }

  const filteredMemory = (memory[activeLayer] || []).filter(entry =>
    entry.content.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const layerConfig = {
    pmem: {
      title: '🧠 Permanent Memory',
      description: 'Core knowledge and persistent information',
      color: 'from-blue-500 to-blue-700',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      icon: '🧠'
    },
    note: {
      title: '📝 Notes',
      description: 'Temporary notes and observations',
      color: 'from-blue-500 to-blue-700',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      icon: '📝'
    },
    thgt: {
      title: '💭 Thoughts',
      description: 'Internal thoughts and insights',
      color: 'from-blue-500 to-blue-700',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      icon: '💭'
    },
    work: {
      title: '⚡ Work Items',
      description: 'Active work and conversations',
      color: 'from-blue-500 to-blue-700',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
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
        {(['pmem', 'note', 'thgt', 'work'] as const).map((layer) => (
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
        <AddMemoryEntry 
          layer={activeLayer} 
          onAdd={addMemoryEntry}
          layerConfig={layerConfig[activeLayer]}
        />
      </div>

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
                  key={entry.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-lg border ${layerConfig[activeLayer].borderColor} bg-white shadow-sm hover:shadow-md transition-shadow`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{layerConfig[activeLayer].icon}</span>
                      <span className="text-xs text-gray-500 font-mono">{entry.id?.slice(0, 8) || 'unknown'}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {entry.createdAt ? getTimeAgo(entry.createdAt) : 'Unknown'}
                    </div>
                  </div>
                  
                  <div className="text-gray-800 mb-3 whitespace-pre-wrap">
                    {entry.content || 'No content'}
                  </div>
                  
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>Created: {entry.createdAt ? formatDate(entry.createdAt) : 'Unknown'}</span>
                    {entry.expiresAt && (
                      <span>Expires: {formatDate(entry.expiresAt)}</span>
                    )}
                  </div>
                  
                  {entry.metadata && typeof entry.metadata === 'object' && Object.keys(entry.metadata).length > 0 && (
                    <details className="mt-2">
                      <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                        Metadata
                      </summary>
                      <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-x-auto text-gray-900">
                        {JSON.stringify(entry.metadata, null, 2)}
                      </pre>
                    </details>
                  )}
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
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        placeholder={`Add ${layer}...`}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        disabled={isAdding}
      />
      <button
        type="submit"
        disabled={!content.trim() || isAdding}
        className={`px-4 py-2 rounded-lg font-medium transition-all ${
          content.trim() && !isAdding
            ? `bg-gradient-to-r ${layerConfig.color} text-white hover:shadow-lg focus-visible:ring-2 focus-visible:ring-blue-500`
            : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-60'
        }`}
      >
        {isAdding ? 'Adding...' : 'Add'}
      </button>
    </form>
  )
}
