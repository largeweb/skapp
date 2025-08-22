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

  // HARDCODED ID check function
  const checkAgentId = () => {
    // Simulate API call
    setValidation(prev => ({
      ...prev,
      agentIdChecked: true,
      agentIdAvailable: !['research_bot', 'content_creator', 'discord_bot'].includes(formData.agentId)
    }))
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
      <div className="bg-white rounded-lg p-6 shadow-sm border mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Your Agent</h1>
        <div className="flex items-center space-x-4">
          <div className={`px-3 py-1 rounded-full text-sm ${
            currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            1. Basic Info
          </div>
          <div className="w-8 h-px bg-gray-300"></div>
          <div className={`px-3 py-1 rounded-full text-sm ${
            currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            2. Configuration
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm border">
        {/* Step 1: Basic Info */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold mb-6">Step 1: Basic Information</h2>
            
            {/* Agent ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Agent ID <span className="text-red-500">*</span>
              </label>
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={formData.agentId}
                  onChange={(e) => handleInputChange('agentId', e.target.value)}
                  placeholder="research_bot"
                  className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={checkAgentId}
                  disabled={!formData.agentId}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Check
                </button>
              </div>
              {validation.agentIdChecked && (
                <div className={`mt-2 text-sm ${
                  validation.agentIdAvailable ? 'text-green-600' : 'text-red-600'
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Research Assistant"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="A helpful agent that researches topics and summarizes findings"
                rows={3}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Navigation */}
            <div className="flex justify-between pt-6">
              <button
                onClick={() => window.history.back()}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={() => setCurrentStep(2)}
                disabled={!formData.agentId || !formData.name || !validation.agentIdAvailable}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: PMEM Configuration */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold mb-6">Step 2: Permanent Memory (PMEM)</h2>
            
            {/* Core Knowledge */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
                      className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {formData.coreKnowledge.length > 1 && (
                      <button
                        onClick={() => removeKnowledgeEntry(index)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addKnowledgeEntry}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  + Add Knowledge
                </button>
              </div>
            </div>

            {/* Available Tools */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Available Tools
              </label>
              <div className="grid grid-cols-2 gap-4">
                {tools.map((tool) => (
                  <div key={tool.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <input
                      type="checkbox"
                      checked={formData.availableTools[tool.id as keyof typeof formData.availableTools]}
                      onChange={() => handleToolToggle(tool.id)}
                      className="mt-1 w-4 h-4 text-blue-600 rounded"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{tool.label}</div>
                      <div className="text-sm text-gray-600">{tool.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Goals & Priorities */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Goals & Priorities
              </label>
              <textarea
                value={formData.goals}
                onChange={(e) => handleInputChange('goals', e.target.value)}
                placeholder="Research AI trends, create summaries, post insights to Discord"
                rows={3}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Preview System Prompt - HARDCODED */}
            <div className="bg-gray-50 border rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">System Prompt Preview:</h3>
              <div className="text-sm text-gray-700 whitespace-pre-line">
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
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={() => {
                  // HARDCODED success action
                  alert(`Agent "${formData.name}" would be created with:\n- ID: ${formData.agentId}\n- Tools: ${Object.entries(formData.availableTools).filter(([_, enabled]) => enabled).length}\n- Knowledge entries: ${formData.coreKnowledge.filter(k => k).length}`)
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Create Agent →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 