'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getRequiredTools, getOptionalTools, getToolDisplayName, getToolShortDescription } from '@/lib/tools'

type WizardStep = 'id' | 'description' | 'memory' | 'tools' | 'review'

interface AgentData {
  agentId: string
  name: string
  description: string
  system_permanent_memory: string[]
  selectedOptionalTools: string[]
}

export default function CreateAgentPage() {
  const [currentStep, setCurrentStep] = useState<WizardStep>('id')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [idAvailable, setIdAvailable] = useState<boolean | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  // Form data
  const [agentData, setAgentData] = useState<AgentData>({
    agentId: '',
    name: '',
    description: '',
    system_permanent_memory: [],
    selectedOptionalTools: []
  })

  console.log(`🧙‍♂️ Agent creation wizard active - step: ${currentStep}, brewing digital consciousness!`)

  const checkIdAvailability = async (id: string) => {
    if (!id.trim()) {
      setIdAvailable(null)
      return
    }

    try {
      const response = await fetch(`/api/agents/${id}/check-availability`)
      const data = await response.json() as any
      setIdAvailable(!data.exists)
      console.log(`${!data.exists ? "✅" : "❌"} Agent ID '${id}' is ${!data.exists ? "available" : "taken"}`)
    } catch (error) {
      console.error("💥 Error checking ID availability:", error)
      setIdAvailable(null)
    }
  }

  const generateMemory = async () => {
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
              content: `Generate 3-5 permanent memory items for an AI agent. Return ONLY a JSON array of strings. Each item should be concise and specific to the agent's purpose.`
            },
            {
              role: 'user',
              content: `Generate permanent memory for: ${agentData.description}`
            }
          ]
        })
      })

      if (response.ok) {
        const data = await response.json() as any
        try {
          const memoryItems = JSON.parse(data.message)
          if (Array.isArray(memoryItems)) {
            setAgentData(prev => ({ ...prev, system_permanent_memory: memoryItems }))
            console.log('✅ Generated permanent memory:', memoryItems)
          }
        } catch (e) {
          console.error('Failed to parse generated memory:', e)
        }
      }
    } catch (error) {
      console.error('Memory generation failed:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const createAgent = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: agentData.agentId,
          name: agentData.name,
          description: agentData.description,
          pmem: agentData.system_permanent_memory
          // Required tools will be auto-added by the API
        })
      })

      if (response.ok) {
        const result = await response.json() as any
        console.log('✅ Agent created successfully:', result)
        // Redirect to agent detail page
        window.location.href = `/agents/${agentData.agentId}`
      } else {
        const errorData = await response.json() as any
        setError(errorData.error || 'Failed to create agent')
        console.error('❌ Agent creation failed:', errorData)
      }
    } catch (error) {
      console.error('💥 Agent creation error:', error)
      setError('Network error occurred')
    } finally {
      setLoading(false)
    }
  }

  const isStepValid = (step: WizardStep): boolean => {
    switch (step) {
      case 'id':
        return agentData.agentId.trim().length > 0 && idAvailable === true
      case 'description':
        return agentData.description.trim().length >= 10
      case 'memory':
        return true // Optional step
      case 'tools':
        return true // Required tools auto-added
      case 'review':
        return true
      default:
        return false
    }
  }

  const nextStep = () => {
    const steps: WizardStep[] = ['id', 'description', 'memory', 'tools', 'review']
    const currentIndex = steps.indexOf(currentStep)
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1])
    }
  }

  const prevStep = () => {
    const steps: WizardStep[] = ['id', 'description', 'memory', 'tools', 'review']
    const currentIndex = steps.indexOf(currentStep)
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1])
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Agent</h1>
          <p className="text-gray-600">Build your autonomous AI agent step by step</p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            {(['id', 'description', 'memory', 'tools', 'review'] as WizardStep[]).map((step, index) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep === step 
                    ? 'bg-blue-600 text-white' 
                    : isStepValid(step) 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-gray-200 text-gray-500'
                }`}>
                  {index + 1}
                </div>
                {index < 4 && (
                  <div className={`w-16 h-1 mx-2 ${
                    isStepValid(step) ? 'bg-green-200' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <AnimatePresence mode="wait">
            {currentStep === 'id' && (
              <motion.div
                key="id"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h2 className="text-xl font-bold text-gray-900">Agent Identity</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Agent ID
                    </label>
                    <input
                      type="text"
                      value={agentData.agentId}
                      onChange={(e) => {
                        const value = e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '')
                        setAgentData(prev => ({ ...prev, agentId: value }))
                        checkIdAvailability(value)
                      }}
                      placeholder="my-research-agent"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {idAvailable === true && (
                      <p className="text-sm text-green-600 mt-1">✅ Available</p>
                    )}
                    {idAvailable === false && (
                      <p className="text-sm text-red-600 mt-1">❌ Already taken</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Agent Name
                    </label>
                    <input
                      type="text"
                      value={agentData.name}
                      onChange={(e) => setAgentData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Research Assistant"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 'description' && (
              <motion.div
                key="description"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h2 className="text-xl font-bold text-gray-900">Agent Purpose</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={agentData.description}
                    onChange={(e) => setAgentData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what this agent will do, its goals, and how it should behave..."
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Minimum 10 characters. Be specific about the agent's role and objectives.
                  </p>
                </div>
              </motion.div>
            )}

            {currentStep === 'memory' && (
              <motion.div
                key="memory"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-900">Permanent Memory</h2>
                  <button
                    onClick={generateMemory}
                    disabled={!agentData.description.trim() || isGenerating}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    {isGenerating ? 'Generating...' : 'AI Generate'}
                  </button>
                </div>
                
                <div className="space-y-3">
                  {agentData.system_permanent_memory.map((item, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => {
                          const newMemory = [...agentData.system_permanent_memory]
                          newMemory[index] = e.target.value
                          setAgentData(prev => ({ ...prev, system_permanent_memory: newMemory }))
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Permanent memory item..."
                      />
                      <button
                        onClick={() => {
                          const newMemory = agentData.system_permanent_memory.filter((_, i) => i !== index)
                          setAgentData(prev => ({ ...prev, system_permanent_memory: newMemory }))
                        }}
                        className="text-red-600 hover:text-red-700 p-2"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  
                  <button
                    onClick={() => {
                      setAgentData(prev => ({ 
                        ...prev, 
                        system_permanent_memory: [...prev.system_permanent_memory, ''] 
                      }))
                    }}
                    className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-600 transition-colors"
                  >
                    + Add Memory Item
                  </button>
                </div>
              </motion.div>
            )}

            {currentStep === 'tools' && (
              <motion.div
                key="tools"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h2 className="text-xl font-bold text-gray-900">Agent Tools</h2>
                
                {/* Required Tools */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Required Tools (Auto-Added)</h3>
                  <div className="grid gap-3">
                    {getRequiredTools().map((tool) => (
                      <div key={tool.id} className="flex items-center space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <input
                          type="checkbox"
                          checked={true}
                          disabled={true}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{getToolDisplayName(tool.id)}</div>
                          <div className="text-sm text-gray-600">{getToolShortDescription(tool.id)}</div>
                        </div>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Required</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Optional Tools */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Optional Tools</h3>
                  <div className="grid gap-3">
                    {getOptionalTools().map((tool) => (
                      <div key={tool.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:border-gray-300">
                        <input
                          type="checkbox"
                          checked={agentData.selectedOptionalTools.includes(tool.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAgentData(prev => ({ 
                                ...prev, 
                                selectedOptionalTools: [...prev.selectedOptionalTools, tool.id] 
                              }))
                            } else {
                              setAgentData(prev => ({ 
                                ...prev, 
                                selectedOptionalTools: prev.selectedOptionalTools.filter(id => id !== tool.id) 
                              }))
                            }
                          }}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{getToolDisplayName(tool.id)}</div>
                          <div className="text-sm text-gray-600">{getToolShortDescription(tool.id)}</div>
                        </div>
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">Optional</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 'review' && (
              <motion.div
                key="review"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h2 className="text-xl font-bold text-gray-900">Review & Create</h2>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-medium text-gray-900">Agent ID</h3>
                      <p className="text-gray-600">{agentData.agentId}</p>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Name</h3>
                      <p className="text-gray-600">{agentData.name}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-900">Description</h3>
                    <p className="text-gray-600">{agentData.description}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-900">Permanent Memory ({agentData.system_permanent_memory.length} items)</h3>
                    <ul className="list-disc list-inside text-gray-600 space-y-1">
                      {agentData.system_permanent_memory.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-900">Tools ({4 + agentData.selectedOptionalTools.length} total)</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {getRequiredTools().map((tool) => (
                        <span key={tool.id} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                          {getToolDisplayName(tool.id)} (Required)
                        </span>
                      ))}
                      {agentData.selectedOptionalTools.map((toolId) => (
                        <span key={toolId} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                          {getToolDisplayName(toolId)} (Optional)
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-600">{error}</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 'id'}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          
          <div className="flex space-x-4">
            {currentStep !== 'review' ? (
              <button
                onClick={nextStep}
                disabled={!isStepValid(currentStep)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                onClick={createAgent}
                disabled={loading || !isStepValid(currentStep)}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
              >
                {loading ? 'Creating...' : 'Create Agent'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 