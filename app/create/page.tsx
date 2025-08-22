'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function CreateAgentPage() {
  const [formData, setFormData] = useState({
    agentId: '',
    name: '',
    description: ''
  })

  const [validation, setValidation] = useState({
    errors: {} as Record<string, string>,
    isValid: false
  })

  const [isGenerating, setIsGenerating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [generatedMemory, setGeneratedMemory] = useState<any>(null)

  const validateForm = () => {
    const errors: Record<string, string> = {}
    
    if (!formData.agentId.trim()) {
      errors.agentId = 'Agent ID is required'
    } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.agentId)) {
      errors.agentId = 'Agent ID can only contain letters, numbers, underscores, and hyphens'
    }
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required'
    }
    
    if (!formData.description.trim()) {
      errors.description = 'Description is required'
    }
    
    setValidation({ errors, isValid: Object.keys(errors).length === 0 })
    return Object.keys(errors).length === 0
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (validation.errors[field]) {
      setValidation(prev => ({
        ...prev,
        errors: { ...prev.errors, [field]: '' }
      }))
    }
    // Run validation in real-time
    setTimeout(() => validateForm(), 100)
  }

  const generateMemory = async () => {
    if (!formData.description.trim()) return
    
    setIsGenerating(true)
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `You are an AI memory system architect. Generate a complete memory system for an AI agent based on the user's description. Return ONLY a JSON object with this exact structure:

{
  "pmem": ["Core knowledge item 1", "Core knowledge item 2", "Core knowledge item 3"],
  "participants": [
    {
      "type": "human_operator",
      "name": "Primary User",
      "role": "Main operator and user of this agent",
      "permissions": {
        "canRead": true,
        "canWrite": true,
        "canExecute": true,
        "canAdmin": true
      }
    },
    {
      "type": "collaborator", 
      "name": "Secondary User",
      "role": "Collaborator who works with this agent",
      "permissions": {
        "canRead": true,
        "canWrite": false,
        "canExecute": false,
        "canAdmin": false
      }
    }
  ]
}

Generate 3-5 relevant pmem items and 1-2 participants based on the agent's described purpose. Make the content specific and actionable.`
            },
            {
              role: 'user',
              content: `Generate memory system for this agent: ${formData.description}`
            }
          ]
        })
      })

      if (response.ok) {
        const data = await response.json() as any
        try {
          const memoryData = JSON.parse(data.message)
          setGeneratedMemory(memoryData)
        } catch (e) {
          console.error('Failed to parse memory data:', e)
          setGeneratedMemory({
            pmem: ['Failed to generate memory system'],
            note: [],
            thgt: [],
            work: [],
            participants: []
          })
        }
      }
    } catch (error) {
      console.error('Failed to generate memory:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    
    setIsSubmitting(true)
    try {
      // Transform the form data to match API expectations
      const agentData = {
        agentId: formData.agentId,
        name: formData.name,
        description: formData.description,
        pmem: {
          goals: formData.description,
          permanent_knowledge: generatedMemory?.pmem || ['Core knowledge will be developed during operation'],
          static_attributes: ['Helpful', 'Accurate', 'Reliable'],
          tools: ['web_search', 'take_note', 'take_thought'],
          codes: []
        },
        participants: generatedMemory?.participants || [
          {
            type: 'human_operator' as const,
            name: 'User',
            role: 'Primary operator',
            permissions: {
              canRead: true,
              canWrite: true,
              canExecute: true,
              canAdmin: true
            }
          }
        ],
        availableTools: {
          web_search: true,
          take_note: true,
          discord_msg: false,
          take_thought: true,
          sms_operator: false
        }
      }

      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agentData)
      })

      if (response.ok) {
        const data = await response.json() as any
        alert(`Agent "${formData.name}" created successfully!\n\nAgent ID: ${data.agentId}\n\nYou can now chat with your agent and configure its settings.`)
        // Reset form
        setFormData({
          agentId: '',
          name: '',
          description: ''
        })
        setGeneratedMemory(null)
      } else {
        const errorData = await response.json() as any
        alert(`Failed to create agent: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      alert('Network error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  }

  const cardVariants = {
    hidden: { y: 20, opacity: 0, scale: 0.95 },
    visible: {
      y: 0,
      opacity: 1,
      scale: 1
    },
    hover: {
      y: -4,
      scale: 1.01
    }
  }

  const buttonVariants = {
    hover: { scale: 1.02 },
    tap: { scale: 0.98 }
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-7xl mx-auto px-6 py-8"
    >
      {/* Header */}
      <motion.div
        variants={itemVariants}
        className="text-center mb-8"
      >
        <motion.h1 
          className="text-4xl font-bold text-gray-900 mb-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Create Your Agent
        </motion.h1>
        <motion.p 
          className="text-xl text-gray-600 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Describe your agent and let AI generate all memory attributes automatically
        </motion.p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Agent Description */}
        <motion.div variants={itemVariants} className="space-y-6">
          <motion.div
            variants={cardVariants}
            whileHover="hover"
            className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm"
          >
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Agent Description</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Agent ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Agent ID <span className="text-red-500">*</span>
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={formData.agentId}
                    onChange={(e) => handleInputChange('agentId', e.target.value)}
                    className={`flex-1 px-4 py-2 border rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-opacity-50 ${
                      validation.errors.agentId
                        ? 'border-red-400 focus:border-red-400 focus:ring-red-500'
                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                    }`}
                    placeholder="e.g., research_bot"
                  />
                  <motion.button
                    type="button"
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                  >
                    Check
                  </motion.button>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Use letters, numbers, underscores, and hyphens only (e.g., research_bot, ai-assistant)
                </p>
                {validation.errors.agentId && (
                  <motion.p 
                    className="text-red-600 text-sm mt-1"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    {validation.errors.agentId}
                  </motion.p>
                )}
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-opacity-50 ${
                    validation.errors.name
                      ? 'border-red-400 focus:border-red-400 focus:ring-red-500'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                  }`}
                  placeholder="e.g., Research Assistant"
                />
                {validation.errors.name && (
                  <motion.p 
                    className="text-red-600 text-sm mt-1"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    {validation.errors.name}
                  </motion.p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={6}
                  className={`w-full px-4 py-2 border rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-opacity-50 ${
                    validation.errors.description
                      ? 'border-red-400 focus:border-red-400 focus:ring-red-500'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                  }`}
                  placeholder="Describe what your agent should do, its capabilities, goals, and any specific requirements..."
                />
                {validation.errors.description && (
                  <motion.p 
                    className="text-red-600 text-sm mt-1"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    {validation.errors.description}
                  </motion.p>
                )}
              </div>

              {/* Generate Memory Button */}
              <motion.button
                type="button"
                onClick={generateMemory}
                disabled={isGenerating || !formData.description.trim()}
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                className="w-full bg-blue-600 hover:bg-blue-700 focus:bg-blue-700 disabled:bg-gray-300 text-white px-6 py-3 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 font-medium"
              >
                {isGenerating ? (
                  <motion.div 
                    className="flex items-center justify-center space-x-2"
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <motion.div 
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    <span>Generating Memory...</span>
                  </motion.div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <motion.span
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                    >
                      ✨
                    </motion.span>
                    <span>Generate Memory Attributes</span>
                  </div>
                )}
              </motion.button>

              {/* Create Agent Button - Always visible when form is valid */}
              <motion.button
                type="submit"
                disabled={isSubmitting || !validation.isValid}
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                className="w-full bg-green-600 hover:bg-green-700 focus:bg-green-700 disabled:bg-gray-300 text-white px-6 py-3 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-green-500 font-medium"
              >
                {isSubmitting ? (
                  <motion.div 
                    className="flex items-center justify-center space-x-2"
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <motion.div 
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    <span>Creating Agent...</span>
                  </motion.div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <span>🚀</span>
                    <span>Create Agent</span>
                  </div>
                )}
              </motion.button>
            </form>
          </motion.div>
        </motion.div>

        {/* Right Column - Generated Memory System */}
        <motion.div variants={itemVariants} className="space-y-6">
          <motion.div
            variants={cardVariants}
            whileHover="hover"
            className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm"
          >
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Generated Memory System</h2>
            
            <AnimatePresence>
              {!generatedMemory ? (
                <motion.div 
                  className="text-center py-12"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div
                    className="text-4xl mb-4"
                    animate={{ 
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    ✨
                  </motion.div>
                  <p className="text-gray-600">
                    Enter a description and click 'Generate Memory Attributes' to see the AI-generated memory system
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* PMEM */}
                  <motion.div 
                    className="bg-blue-50 border border-blue-200 rounded-lg p-4"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <h3 className="text-lg font-semibold text-blue-700 mb-3">🧠 PMEM (Permanent Memory)</h3>
                    <div className="space-y-2">
                      {generatedMemory.pmem.map((item: string, i: number) => (
                        <motion.div 
                          key={i}
                          className="text-gray-700 text-sm bg-white p-2 rounded border-l-4 border-blue-500"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 + i * 0.1 }}
                        >
                          {item}
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Memory System Info */}
                  <motion.div 
                    className="bg-gray-50 rounded-lg p-4"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Memory System Architecture:</h4>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>• <span className="text-blue-600">PMEM</span>: Static, user-updated memory that goes to System Prompt</div>
                      <div>• <span className="text-blue-600">NOTE</span>: Memory that persists for 7 days only, goes to system prompt</div>
                      <div>• <span className="text-blue-600">THGT</span>: Memory that goes away at sleep, goes to the system prompt</div>
                      <div>• <span className="text-blue-600">WORK</span>: Memory that updates every turn</div>
                    </div>
                  </motion.div>

                  {/* Participants */}
                  <motion.div 
                    className="bg-blue-50 border border-blue-200 rounded-lg p-4"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <h3 className="text-lg font-semibold text-blue-700 mb-3">👥 Participants</h3>
                    <div className="space-y-2">
                      {generatedMemory.participants.map((participant: any, i: number) => (
                        <motion.div 
                          key={i}
                          className="text-gray-700 text-sm bg-white p-2 rounded border-l-4 border-blue-500"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + i * 0.1 }}
                        >
                          <strong>{participant.name}</strong> - {participant.role}
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Create Agent Button */}
                  <motion.button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !validation.isValid}
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                    className="w-full bg-blue-600 hover:bg-blue-700 focus:bg-blue-700 disabled:bg-gray-300 text-white px-6 py-3 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 font-medium"
                  >
                    {isSubmitting ? (
                      <motion.div 
                        className="flex items-center justify-center space-x-2"
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        <motion.div 
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        <span>Creating Agent...</span>
                      </motion.div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <span>🚀</span>
                        <span>Create Agent</span>
                      </div>
                    )}
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  )
} 