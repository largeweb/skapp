'use client'

import { useState } from 'react'
import Link from 'next/link'

export const runtime = 'edge'

export default async function AgentSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  // HARDCODED DATA - Replace with API calls later
  const [formData, setFormData] = useState({
    name: 'Research Assistant',
    description: 'AI research specialist',
    coreKnowledge: [
      'Expert in research methodology',
      'Can analyze complex topics'
    ],
    availableTools: {
      web_search: true,
      take_note: true,
      discord_msg: true,
      take_thought: true,
      sms_operator: false
    },
    goals: 'Research AI trends and create summaries',
    timezone: 'EST',
    sleepTime: '2:00',
    wakeTime: '5:00'
  })

  const [showDangerZone, setShowDangerZone] = useState(false)

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

  const tools = [
    { id: 'web_search', label: 'Web Search', description: 'Search the internet for information' },
    { id: 'take_note', label: 'Take Note', description: 'Save information to memory' },
    { id: 'discord_msg', label: 'Discord Message', description: 'Send messages to Discord channels' },
    { id: 'take_thought', label: 'Take Thought', description: 'Record internal thoughts and insights' },
    { id: 'sms_operator', label: 'SMS Operator', description: 'Send SMS messages to users' }
  ]

  const timezones = ['EST', 'PST', 'MST', 'CST', 'UTC']
  const timeOptions = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0')
    return `${hour}:00`
  })

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm border mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <span className="mr-3">⚙️</span>
              Agent Settings - {formData.name}
            </h1>
            <p className="text-gray-600 mt-1">Configure your agent's behavior and capabilities</p>
          </div>
          <Link
            href={`/agents/${id}`}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            ← Back to Agent
          </Link>
        </div>
      </div>

      <div className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <span className="mr-2">📝</span>
            Basic Info
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={2}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Permanent Memory (PMEM) */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <span className="mr-2">🧠</span>
            Permanent Memory (PMEM)
          </h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Core Knowledge
            </label>
            <div className="space-y-3">
              {formData.coreKnowledge.map((knowledge, index) => (
                <div key={index} className="flex space-x-2">
                  <input
                    type="text"
                    value={knowledge}
                    onChange={(e) => updateKnowledgeEntry(index, e.target.value)}
                    placeholder="Enter core knowledge..."
                    className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => removeKnowledgeEntry(index)}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition-colors"
                  >
                    Remove
                  </button>
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
        </div>

        {/* Available Tools */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <span className="mr-2">🛠️</span>
            Available Tools
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tools.map((tool) => (
              <div key={tool.id} className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={formData.availableTools[tool.id as keyof typeof formData.availableTools]}
                  onChange={() => handleToolToggle(tool.id)}
                  className="mt-1 w-4 h-4 text-blue-600 rounded"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{tool.label}</div>
                  <div className="text-sm text-gray-600">{tool.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Goals & Priorities */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <span className="mr-2">🎯</span>
            Goals & Priorities
          </h2>
          
          <textarea
            value={formData.goals}
            onChange={(e) => handleInputChange('goals', e.target.value)}
            rows={3}
            placeholder="Define the agent's primary goals and priorities..."
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Schedule */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <span className="mr-2">⏰</span>
            Schedule
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Timezone
              </label>
              <select
                value={formData.timezone}
                onChange={(e) => handleInputChange('timezone', e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {timezones.map(tz => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sleep Time
              </label>
              <select
                value={formData.sleepTime}
                onChange={(e) => handleInputChange('sleepTime', e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {timeOptions.map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wake Time
              </label>
              <select
                value={formData.wakeTime}
                onChange={(e) => handleInputChange('wakeTime', e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {timeOptions.map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Save Changes */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium text-gray-900">Save Changes</h3>
              <p className="text-sm text-gray-600">Apply your configuration changes to the agent</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  // HARDCODED cancel action
                  if (confirm('Discard all changes?')) {
                    window.history.back()
                  }
                }}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // HARDCODED save action
                  alert('Settings saved successfully!\n\nChanges applied:\n• Basic info updated\n• Tools configuration saved\n• Schedule preferences saved')
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-red-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-red-600 flex items-center">
              <span className="mr-2">🚨</span>
              Danger Zone
            </h2>
            <button
              onClick={() => setShowDangerZone(!showDangerZone)}
              className="text-sm text-red-600 hover:text-red-700"
            >
              {showDangerZone ? 'Hide' : 'Show'}
            </button>
          </div>
          
          {showDangerZone && (
            <div className="space-y-4 pt-4 border-t border-red-200">
              <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-red-900">Export Full Data</h4>
                  <p className="text-sm text-red-700">Download all agent data including memory and activity history</p>
                </div>
                <button
                  onClick={() => {
                    // HARDCODED export action
                    alert('Exporting agent data...\n\nThis would download:\n• Agent configuration\n• All memory layers\n• Activity history\n• Conversation logs')
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Export Data
                </button>
              </div>
              
              <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-red-900">Reset Memory</h4>
                  <p className="text-sm text-red-700">Clear all memory layers (PMEM will be preserved)</p>
                </div>
                <button
                  onClick={() => {
                    if (confirm('Are you sure? This will clear all NOTE, THGT, and WORK memory layers.')) {
                      alert('Memory reset completed!\n\n• NOTE layer cleared\n• THGT layer cleared\n• WORK layer cleared\n• PMEM preserved')
                    }
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Reset Memory
                </button>
              </div>
              
              <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-red-900">Delete Agent</h4>
                  <p className="text-sm text-red-700">Permanently delete this agent and all associated data</p>
                </div>
                <button
                  onClick={() => {
                    if (confirm('Are you sure? This action cannot be undone.') && 
                        confirm('This will permanently delete the agent and ALL data. Type "DELETE" to confirm.')) {
                      alert('Agent deletion would be processed...\n\nThis would:\n• Delete agent configuration\n• Clear all memory layers\n• Remove activity history\n• Cancel scheduled operations')
                    }
                  }}
                  className="bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Delete Agent
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 