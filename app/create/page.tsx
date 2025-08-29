'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type WizardStep = 'id' | 'description' | 'pmem' | 'tools' | 'review'

interface AgentData {
  agentId: string
  name: string
  description: string
  pmem: string[]
  note: string[]
  thgt: string[]
  tools: string[]
  turn_prompt: string
  turn_history: Array<{
    role: 'user' | 'model'
    parts: Array<{
      text: string
    }>
  }>
}

export default function CreateAgentPage() {
  const [currentStep, setCurrentStep] = useState<WizardStep>('id')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationAlert, setValidationAlert] = useState<string | null>(null)
  const [idAvailable, setIdAvailable] = useState<boolean | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedPmem, setGeneratedPmem] = useState<string[]>([])

  // Form data
  const [agentData, setAgentData] = useState<AgentData>({
    agentId: '',
    name: '',
    description: '',
    pmem: [],
    note: [],
    thgt: [],
    tools: [],
    turn_prompt: '',
    turn_history: []
  })

  const [validation, setValidation] = useState({
    errors: {} as Record<string, string>,
    isValid: false
  })

  console.log(`🧙‍♂️ Agent creation wizard active - step: ${currentStep}, brewing digital consciousness!`)

  const checkIdAvailability = async (id: string) => {
    if (!id.trim()) {
      setIdAvailable(null)
      return
    }

    console.log(`🔍 Checking availability for agent ID: ${id}`)
    
    try {
      const response = await fetch(`/api/agents/${id}/check-availability`)
      const data: { exists: boolean } = await response.json()
      setIdAvailable(!data.exists)
      console.log(`${!data.exists ? "✅" : "❌"} Agent ID '${id}' is ${!data.exists ? "available" : "taken"}`)
    } catch (error) {
      console.error("💥 Error checking ID availability:", error)
      setIdAvailable(null)
    }
  }

  const generatePmem = async () => {
    if (!agentData.description.trim()) return
    
    setIsGenerating(true)
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `You are an AI memory system architect. Generate permanent memory items for an AI agent based on the user's description. Return ONLY a JSON array of strings with 3-5 relevant permanent memory items.

Each item should be a concise, actionable statement that defines the agent's core knowledge, goals, or capabilities. Make the content specific and relevant to the agent's described purpose.

Example format:
["Core knowledge item 1", "Core knowledge item 2", "Core knowledge item 3"]`
            },
            {
              role: 'user',
              content: `Generate permanent memory items for this agent: ${agentData.description}`
            }
          ]
        })
      })

      if (response.ok) {
        const data = await response.json() as any
        try {
          const pmemData = JSON.parse(data.message)
          setGeneratedPmem(pmemData)
          setAgentData(prev => ({ ...prev, pmem: pmemData }))
        } catch (e) {
          console.error('Failed to parse pmem data:', e)
          setGeneratedPmem(['Failed to generate permanent memory'])
        }
      }
    } catch (error) {
      console.error('Failed to generate pmem:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}
    
    if (!agentData.name.trim()) {
      errors.name = 'Agent name is required'
    }
    
    if (!agentData.agentId.trim()) {
      errors.agentId = 'Agent ID is required'
    } else if (!/^[a-zA-Z0-9_-]+$/.test(agentData.agentId)) {
      errors.agentId = 'Agent ID can only contain letters, numbers, underscores, and hyphens'
    }
    
    if (!agentData.description.trim()) {
      errors.description = 'Description is required'
    }
    
    setValidation({ errors, isValid: Object.keys(errors).length === 0 })
    
    // Show validation alert if there are errors
    if (Object.keys(errors).length > 0) {
      const errorMessages = Object.values(errors).join('\n')
      setValidationAlert(`Please fix the following errors:\n\n${errorMessages}`)
      // Auto-hide after 5 seconds
      setTimeout(() => setValidationAlert(null), 5000)
    } else {
      setValidationAlert(null)
    }
    
    return Object.keys(errors).length === 0
  }

  const handleInputChange = (field: keyof AgentData, value: string | string[]) => {
    setAgentData(prev => ({ ...prev, [field]: value }))
    if (validation.errors[field as string]) {
      setValidation(prev => ({
        ...prev,
        errors: { ...prev.errors, [field]: '' }
      }))
    }
    // Run validation in real-time
    setTimeout(() => validateForm(), 100)
  }

  const createAgent = async () => {
    if (!validateForm()) return
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agentData)
      })

      if (response.ok) {
        const data = await response.json() as any
        alert(`Agent "${agentData.name}" created successfully!\n\nAgent ID: ${data.agentId}\n\nRedirecting to agents page...`)
        // Navigate to agents page
        window.location.href = '/agents'
      } else {
        const errorData = await response.json() as any
        setError(errorData.error || 'Unknown error')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => {
    const steps: WizardStep[] = ['id', 'description', 'pmem', 'tools', 'review']
    const currentIndex = steps.indexOf(currentStep)
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1])
    }
  }

  const prevStep = () => {
    const steps: WizardStep[] = ['id', 'description', 'pmem', 'tools', 'review']
    const currentIndex = steps.indexOf(currentStep)
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1])
    }
  }

  const canProceedFromId = agentData.name.trim() && agentData.agentId.trim() && idAvailable === true
  const canProceedFromDescription = agentData.description.trim().length > 10
  const canProceedFromPmem = agentData.pmem.length > 0
  const canProceedFromTools = true // Tools are optional

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
      className="max-w-4xl mx-auto px-6 py-8"
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
          Build your autonomous AI agent in 5 simple steps
        </motion.p>
      </motion.div>

      {/* Progress Steps */}
      <motion.div 
        variants={itemVariants}
        className="flex items-center justify-between mb-8"
      >
        {['id', 'description', 'pmem', 'tools', 'review'].map((step, index) => {
          const isActive = step === currentStep
          const isCompleted = ['id', 'description', 'pmem', 'tools', 'review'].indexOf(currentStep) > index
          
          return (
            <div key={step} className="flex items-center">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                ${isActive ? 'bg-blue-600 text-white' : 
                  isCompleted ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'}
              `}>
                {isCompleted ? '✓' : index + 1}
              </div>
              {index < 4 && <div className="flex-1 h-px bg-gray-300 mx-2" />}
            </div>
          )
        })}
      </motion.div>

      <motion.div
        variants={cardVariants}
        className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm"
      >
        {error && (
          <motion.div 
            className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            {error}
          </motion.div>
        )}

        {/* Step 1: Agent ID & Name */}
        {currentStep === 'id' && (
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
          >
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Step 1: Agent Identity</h2>
            <p className="text-gray-600 mb-6">
              Set your agent's unique identifier and display name.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Agent ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={agentData.agentId}
                  onChange={(e) => {
                    const value = e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '')
                    handleInputChange('agentId', value)
                    checkIdAvailability(value)
                  }}
                  className={`w-full px-4 py-2 border rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-opacity-50 ${
                    validation.errors.agentId
                      ? 'border-red-400 focus:border-red-400 focus:ring-red-500'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                  }`}
                  placeholder="e.g., research_bot, ai_assistant"
                />
                {agentData.agentId && (
                  <div className="mt-2">
                    {idAvailable === true && (
                      <p className="text-green-600 text-sm">✅ ID available</p>
                    )}
                    {idAvailable === false && (
                      <p className="text-red-600 text-sm">❌ ID already taken</p>
                    )}
                    {idAvailable === null && agentData.agentId && (
                      <p className="text-gray-500 text-sm">🔍 Checking availability...</p>
                    )}
                  </div>
                )}
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Agent Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={agentData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-opacity-50 ${
                    validation.errors.name
                      ? 'border-red-400 focus:border-red-400 focus:ring-red-500'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                  }`}
                  placeholder="e.g., Research Bot, AI Assistant"
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
            </div>

            <div className="flex justify-end mt-8">
              <motion.button
                onClick={nextStep}
                disabled={!canProceedFromId}
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
              >
                Next
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Description */}
        {currentStep === 'description' && (
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
          >
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Step 2: Agent Description</h2>
            <p className="text-gray-600 mb-6">
              Describe your agent's purpose, capabilities, and goals. This will be used to generate their permanent memory.
            </p>
            
            {/* Quick Start Examples */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">🚀 Quick Start Examples</h3>
              <p className="text-gray-600 text-sm mb-4">Click any example to auto-fill the description field:</p>
              <div className="grid md:grid-cols-2 gap-3">
                {[
                  {
                    title: "📚 BookWriter Agent",
                    description: "A creative and analytical agent focused on writing and publishing profitable books on Amazon KDP. Skilled in market research, identifying trending topics, creating compelling outlines, and writing engaging content."
                  },
                  {
                    title: "🎬 YouTube Creator",
                    description: "An entertaining and trend-savvy agent dedicated to creating viral YouTube content. Expert at identifying emerging trends, crafting engaging video concepts, and understanding audience psychology."
                  },
                  {
                    title: "📈 Stock Researcher",
                    description: "A highly analytical and data-driven agent specializing in financial market research and investment strategies. Excellent at analyzing market trends, evaluating company fundamentals, and identifying profitable investment opportunities."
                  },
                  {
                    title: "💼 Business Consultant",
                    description: "A strategic and solutions-oriented agent focused on helping businesses optimize operations and achieve growth. Expert in analyzing business processes, identifying inefficiencies, and developing actionable improvement plans."
                  }
                ].map((example, index) => (
                  <button
                    key={index}
                    onClick={() => handleInputChange('description', example.description)}
                    className="text-left p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-blue-300 rounded-lg transition-colors"
                  >
                    <h4 className="text-blue-600 font-medium text-sm mb-1">{example.title}</h4>
                    <p className="text-gray-600 text-xs line-clamp-2">{example.description.slice(0, 120)}...</p>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={agentData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe what your agent should do, its capabilities, goals, and any specific requirements..."
                  rows={6}
                  className={`w-full px-4 py-2 border rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-opacity-50 ${
                    validation.errors.description
                      ? 'border-red-400 focus:border-red-400 focus:ring-red-500'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                  }`}
                />
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-gray-500">
                    {agentData.description.length}/500 characters (minimum 10)
                  </p>
                  {agentData.description.length > 0 && (
                    <button
                      onClick={() => handleInputChange('description', '')}
                      className="text-xs text-gray-400 hover:text-gray-600"
                    >
                      Clear
                    </button>
                  )}
                </div>
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
            </div>

            <div className="flex justify-between mt-8">
              <motion.button
                onClick={prevStep}
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Previous
              </motion.button>
              <motion.button
                onClick={nextStep}
                disabled={!canProceedFromDescription}
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
              >
                Next
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Step 3: PMEM */}
        {currentStep === 'pmem' && (
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
          >
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Step 3: Permanent Memory</h2>
            <p className="text-gray-600 mb-6">
              Define your agent's permanent memory - core knowledge and capabilities that will always be available.
            </p>
            
            <div className="space-y-6">
              {/* Generate PMEM Button */}
              <motion.button
                type="button"
                onClick={generatePmem}
                disabled={isGenerating || !agentData.description.trim()}
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
                    <span>Generating PMEM...</span>
                  </motion.div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <motion.span
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                    >
                      ✨
                    </motion.span>
                    <span>Generate Permanent Memory</span>
                  </div>
                )}
              </motion.button>

              {/* PMEM Items */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Permanent Memory Items
                </label>
                <div className="space-y-2">
                  {agentData.pmem.map((item, index) => (
                    <motion.div 
                      key={index}
                      className="flex items-center space-x-2"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => {
                          const newPmem = [...agentData.pmem]
                          newPmem[index] = e.target.value
                          handleInputChange('pmem', newPmem)
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter permanent memory item..."
                      />
                      <button
                        onClick={() => {
                          const newPmem = agentData.pmem.filter((_, i) => i !== index)
                          handleInputChange('pmem', newPmem)
                        }}
                        className="px-2 py-2 text-red-600 hover:text-red-800"
                      >
                        ×
                      </button>
                    </motion.div>
                  ))}
                </div>
                <button
                  onClick={() => {
                    const newPmem = [...agentData.pmem, '']
                    handleInputChange('pmem', newPmem)
                  }}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                >
                  + Add Memory Item
                </button>
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <motion.button
                onClick={prevStep}
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Previous
              </motion.button>
              <motion.button
                onClick={nextStep}
                disabled={!canProceedFromPmem}
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
              >
                Next
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Step 4: Tools */}
        {currentStep === 'tools' && (
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
          >
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Step 4: Agent Tools</h2>
            <p className="text-gray-600 mb-6">
              Select the tools your agent can use to accomplish tasks. You can modify this later.
            </p>

            <div className="space-y-4 mb-6">
              {[
                { id: 'web_search', name: 'Web Search', description: 'Search the internet for current information' },
                { id: 'take_note', name: 'Take Notes', description: 'Save important information to memory' },
                { id: 'take_thought', name: 'Take Thoughts', description: 'Record insights and reflections' },
                { id: 'discord_msg', name: 'Discord Messages', description: 'Send messages to Discord channels' },
                { id: 'sms_operator', name: 'SMS Operator', description: 'Send SMS messages' }
              ].map((tool) => {
                const isSelected = agentData.tools.includes(tool.id)
                
                return (
                  <div 
                    key={tool.id} 
                    className={`border rounded-lg p-4 transition-all cursor-pointer ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-300 bg-white hover:border-gray-400'
                    }`}
                    onClick={() => {
                      const newTools = isSelected
                        ? agentData.tools.filter(id => id !== tool.id)
                        : [...agentData.tools, tool.id]
                      handleInputChange('tools', newTools)
                    }}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="mt-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            const newTools = isSelected
                              ? agentData.tools.filter(id => id !== tool.id)
                              : [...agentData.tools, tool.id]
                            handleInputChange('tools', newTools)
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

            <div className="flex justify-between mt-8">
              <motion.button
                onClick={prevStep}
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Previous
              </motion.button>
              <motion.button
                onClick={nextStep}
                disabled={!canProceedFromTools}
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
              >
                Next
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Step 5: Review */}
        {currentStep === 'review' && (
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
          >
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Step 5: Review & Create</h2>
            <p className="text-gray-600 mb-6">
              Review your agent configuration before creating it.
            </p>
            
            <div className="space-y-6 mb-8">
              {/* Agent Name */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Agent Name</h3>
                <p className="text-gray-700">{agentData.name}</p>
              </div>

              {/* Agent ID */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Agent ID</h3>
                <p className="text-gray-700">{agentData.agentId}</p>
              </div>

              {/* Description */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
                <p className="text-gray-700">{agentData.description}</p>
              </div>

              {/* PMEM */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-blue-900 mb-2">Permanent Memory</h3>
                <div className="space-y-2">
                  {agentData.pmem.map((item, index) => (
                    <div key={index} className="text-blue-800 text-sm bg-white p-2 rounded border-l-4 border-blue-500">
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* Tools */}
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-green-900 mb-2">Selected Tools</h3>
                <div className="flex flex-wrap gap-2">
                  {agentData.tools.map((tool) => (
                    <span key={tool} className="px-2 py-1 bg-green-200 text-green-800 rounded text-sm">
                      {tool}
                    </span>
                  ))}
                  {agentData.tools.length === 0 && (
                    <span className="text-green-700 text-sm">No tools selected</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <motion.button
                onClick={prevStep}
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Previous
              </motion.button>
              <motion.button
                onClick={createAgent}
                disabled={loading}
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                className="px-6 py-2 bg-green-600 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-green-700 transition-colors"
              >
                {loading ? (
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
            </div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  )
} 