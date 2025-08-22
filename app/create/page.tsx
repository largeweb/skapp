'use client'

import { useState } from 'react'

export const runtime = 'edge'

export default function CreateAgentPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    agentId: '',
    name: '',
    description: '',
    coreKnowledge: [''],
    availableTools: {
      web_search: true,
      take_note: true,
      discord_msg: true,
      take_thought: true,
      sms_operator: false
    },
    goals: ''
  })

  // HARDCODED validation state
  const [validation, setValidation] = useState({
    agentIdAvailable: true,
    agentIdChecked: false
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleToolToggle = (tool: string) => {
    setFormData(prev => ({
      ...prev,
      availableTools: {
        ...prev.availableTools,
        [tool]: !prev.availableTools[tool as keyof typeof prev.availableTools]
      }
    }))
  }

  const addKnowledgeEntry = () => {
    setFormData(prev => ({
      ...prev,
      coreKnowledge: [...prev.coreKnowledge, '']
    }))
  }

  const updateKnowledgeEntry = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      coreKnowledge: prev.coreKnowledge.map((item, i) => i === index ? value : item)
    }))
  }

  const removeKnowledgeEntry = (index: number) => {
    setFormData(prev => ({
      ...prev,
      coreKnowledge: prev.coreKnowledge.filter((_, i) => i !== index)
    }))
  }

  // Real ID check function
  const checkAgentId = async () => {
    if (!formData.agentId.trim()) return
    
    try {
      const response = await fetch(`/api/agents?search=${formData.agentId}`)
      if (response.ok) {
        const data = await response.json() as { agents: Array<{ id: string }> }
        const exists = data.agents.some((agent) => agent.id === formData.agentId)
        setValidation(prev => ({
          ...prev,
          agentIdChecked: true,
          agentIdAvailable: !exists
        }))
      }
    } catch (error) {
      console.error('Failed to check agent ID:', error)
      setValidation(prev => ({
        ...prev,
        agentIdChecked: true,
        agentIdAvailable: true // Assume available on error
      }))
    }
  }

  const tools = [
    { id: 'web_search', label: 'Web Search', description: 'Search the internet for information' },
    { id: 'take_note', label: 'Take Note', description: 'Save information to memory' },
    { id: 'discord_msg', label: 'Discord Message', description: 'Send messages to Discord channels' },
    { id: 'take_thought', label: 'Take Thought', description: 'Record internal thoughts and insights' },
    { id: 'sms_operator', label: 'SMS Operator', description: 'Send SMS messages to users' }
  ]

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Create Your Agent</h1>
        <div className="flex items-center space-x-4">
          <div className={`px-3 py-1 rounded-full text-sm ${
            currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
          }`}>
            1. Basic Info
          </div>
          <div className="w-8 h-px bg-gray-300 dark:bg-gray-600"></div>
          <div className={`px-3 py-1 rounded-full text-sm ${
            currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
          }`}>
            2. Configuration
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        {/* Step 1: Basic Info */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-gray-100">Step 1: Basic Information</h2>
            
            {/* Agent ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Agent ID <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={formData.agentId}
                  onChange={(e) => handleInputChange('agentId', e.target.value)}
                  placeholder="research_bot"
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                />
                <button
                  onClick={checkAgentId}
                  disabled={!formData.agentId}
                  className="bg-blue-600 hover:bg-blue-700 focus:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  Check
                </button>
              </div>
              {validation.agentIdChecked && (
                <div className={`mt-2 text-sm ${
                  validation.agentIdAvailable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {validation.agentIdAvailable 
                    ? '✅ Agent ID is available!' 
                    : '❌ Agent ID already exists. Please choose another.'
                  }
                </div>
              )}
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Name <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Research Assistant"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="A helpful agent that researches topics and summarizes findings"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              />
            </div>

            {/* Navigation */}
            <div className="flex justify-between pt-6">
              <button
                onClick={() => window.history.back()}
                className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 px-6 py-2 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                ← Back
              </button>
              <button
                onClick={() => setCurrentStep(2)}
                disabled={!formData.agentId || !formData.name || !validation.agentIdAvailable}
                className="bg-blue-600 hover:bg-blue-700 focus:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: PMEM Configuration */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-gray-100">Step 2: Permanent Memory (PMEM)</h2>
            
            {/* Core Knowledge */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Core Knowledge
              </label>
              <div className="space-y-3">
                {formData.coreKnowledge.map((knowledge, index) => (
                  <div key={index} className="flex space-x-2">
                    <input
                      type="text"
                      value={knowledge}
                      onChange={(e) => updateKnowledgeEntry(index, e.target.value)}
                      placeholder="• Expert in research methodology"
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                    />
                    {formData.coreKnowledge.length > 1 && (
                      <button
                        onClick={() => removeKnowledgeEntry(index)}
                        className="bg-red-600 hover:bg-red-700 focus:bg-red-700 text-white px-3 py-2 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-blue-500"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addKnowledgeEntry}
                  className="bg-green-600 hover:bg-green-700 focus:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  + Add Knowledge
                </button>
              </div>
            </div>

            {/* Available Tools */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                Available Tools
              </label>
              <div className="grid grid-cols-2 gap-4">
                {tools.map((tool) => (
                  <div key={tool.id} className="flex items-start space-x-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                    <input
                      type="checkbox"
                      checked={formData.availableTools[tool.id as keyof typeof formData.availableTools]}
                      onChange={() => handleToolToggle(tool.id)}
                      className="mt-1 w-4 h-4 text-blue-600 dark:text-blue-400 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">{tool.label}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{tool.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Goals & Priorities */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Goals & Priorities
              </label>
              <textarea
                value={formData.goals}
                onChange={(e) => handleInputChange('goals', e.target.value)}
                placeholder="Research AI trends, create summaries, post insights to Discord"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              />
            </div>

            {/* Preview System Prompt - HARDCODED */}
            <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">System Prompt Preview:</h3>
              <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                {`You are ${formData.name || '[Agent Name]'}, ${formData.description || '[description]'}.

Core Knowledge:
${formData.coreKnowledge.filter(k => k).map(k => `• ${k}`).join('\n')}

Available Tools: ${Object.entries(formData.availableTools).filter(([_, enabled]) => enabled).map(([tool, _]) => tool).join(', ')}

Goals: ${formData.goals || '[Goals will be listed here]'}`}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between pt-6">
              <button
                onClick={() => setCurrentStep(1)}
                className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 px-6 py-2 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                ← Back
              </button>
              <button
                onClick={async () => {
                  if (!formData.agentId || !formData.name) {
                    alert('Please fill in all required fields')
                    return
                  }
                  
                  setIsSubmitting(true)
                  try {
                    const response = await fetch('/api/agents', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        ...formData,
                        coreKnowledge: formData.coreKnowledge.filter(k => k.trim())
                      })
                    })
                    
                    if (!response.ok) {
                      const errorData = await response.json() as { error?: string }
                      throw new Error(errorData.error || 'Failed to create agent')
                    }
                    
                    const result = await response.json()
                    alert(`Agent created successfully!\n\nAgent: ${formData.name} (${formData.agentId})\n\nRedirecting to agent dashboard...`)
                    // In a real app, redirect to the agent page
                    window.location.href = `/agents/${formData.agentId}`
                  } catch (error) {
                    alert(`Failed to create agent: ${error instanceof Error ? error.message : 'Unknown error'}`)
                  } finally {
                    setIsSubmitting(false)
                  }
                }}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700 focus:bg-green-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                {isSubmitting ? 'Creating...' : 'Create Agent →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 