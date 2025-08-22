'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'

export const runtime = 'edge'

export default function AgentSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string>('')
  const [formData, setFormData] = useState({
    name: 'Research Assistant',
    description: 'AI research specialist',
    // PMEM - Initialize with 5 empty fields for placeholders
    permanentKnowledge: ['', '', '', '', ''] as string[],
    // Notes - Initialize with 5 empty fields for placeholders
    note: ['', '', '', '', ''] as string[],
    thgt: ['', '', '', '', ''] as string[],
    availableTools: {
      web_search: true,
      take_note: true,
      discord_msg: true,
      take_thought: true,
      sms_operator: false
    },
    timezone: 'EST',
    sleepTime: '2:00',
    wakeTime: '5:00'
  })

  const [showDangerZone, setShowDangerZone] = useState(false)

  useEffect(() => {
    const initPage = async () => {
      const resolvedParams = await params
      setId(resolvedParams.id)
    }
    initPage()
  }, [params])

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

  const addArrayEntry = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...(prev[field] as string[]), value]
    }))
  }

  const updateArrayEntry = (field: keyof typeof formData, index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).map((item, i) => i === index ? value : item)
    }))
  }

  const removeArrayEntry = (field: keyof typeof formData, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).filter((_, i) => i !== index)
    }))
  }

  const tools = [
    { id: 'web_search', label: 'Web Search', description: 'Search the internet for information' },
    { id: 'take_note', label: 'Take Note', description: 'Save information to memory' },
    { id: 'discord_msg', label: 'Discord Message', description: 'Send messages to Discord channels' },
    { id: 'take_thought', label: 'Take Thought', description: 'Record internal thoughts and insights' },
    { id: 'sms_operator', label: 'SMS Operator', description: 'Send SMS messages to users' }
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
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

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-4xl mx-auto p-6"
    >
      {/* Header */}
      <motion.div 
        variants={itemVariants}
        className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-6"
      >
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
      </motion.div>

      <div className="space-y-6">
        {/* Basic Info */}
        <motion.div 
          variants={itemVariants}
          className="bg-white rounded-lg p-6 shadow-sm border border-gray-200"
        >
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </motion.div>

        {/* Permanent Knowledge */}
        <motion.div 
          variants={itemVariants}
          className="bg-white rounded-lg p-6 shadow-sm border border-gray-200"
        >
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <span className="mr-2">🧠</span>
            Permanent Knowledge
          </h2>
          <p className="text-sm text-gray-600 mb-4">Core knowledge, skills, and characteristics that define the agent's identity</p>
          
                               <div className="space-y-3">
             {formData.permanentKnowledge.map((knowledge, index) => (
               <motion.div 
                 key={index} 
                 className="flex space-x-2"
                 initial={{ opacity: 0, x: -20 }}
                 animate={{ opacity: 1, x: 0 }}
                 transition={{ delay: index * 0.1 }}
               >
                 <input
                   type="text"
                   value={knowledge}
                   onChange={(e) => updateArrayEntry('permanentKnowledge', index, e.target.value)}
                                       placeholder={index < 5 ? [
                      "e.g., Permanent Goals: This agent should focus on research and analysis",
                      "e.g., Permanent Communication Style: Always professional and clear",
                      "e.g., Permanent Skills: Expert in data analysis and research methodology", 
                      "e.g., Permanent Personality: Detail-oriented and analytical thinker",
                      "e.g., Permanent Learning: Adapts quickly to new information and patterns"
                    ][index] : ""}
                   className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                 />
                 <button
                   onClick={() => removeArrayEntry('permanentKnowledge', index)}
                   className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition-colors"
                 >
                   Remove
                 </button>
               </motion.div>
             ))}
            <motion.button
              onClick={() => addArrayEntry('permanentKnowledge', '')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              + Add Knowledge
            </motion.button>
          </div>
        </motion.div>

        {/* Notes */}
        <motion.div 
          variants={itemVariants}
          className="bg-white rounded-lg p-6 shadow-sm border border-gray-200"
        >
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <span className="mr-2">📝</span>
            Notes (7-day Memory)
          </h2>
          <p className="text-sm text-gray-600 mb-4">Goals, thoughts, priorities, and other notes that expire in 7 days. Agent will update these daily.</p>
          
                               <div className="space-y-3">
             {formData.note.map((note, index) => (
               <motion.div 
                 key={index} 
                 className="flex space-x-2"
                 initial={{ opacity: 0, x: -20 }}
                 animate={{ opacity: 1, x: 0 }}
                 transition={{ delay: index * 0.1 }}
               >
                 <input
                   type="text"
                   value={note}
                   onChange={(e) => updateArrayEntry('note', index, e.target.value)}
                                       placeholder={index < 5 ? [
                      "e.g., Goals: We should establish relationships with others in the discord",
                      "e.g., Temporary Communication Style: More casual for community building",
                      "e.g., Recent Thoughts: AI safety is becoming increasingly important",
                      "e.g., Strategic Priorities: Focus on emerging AI technologies",
                      "e.g., Daily Focus: Analyze current AI research papers"
                    ][index] : ""}
                   className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                 />
                 <button
                   onClick={() => removeArrayEntry('note', index)}
                   className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition-colors"
                 >
                   Remove
                 </button>
               </motion.div>
             ))}
            <motion.button
              onClick={() => addArrayEntry('note', '')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              + Add Note
            </motion.button>
          </div>
          
                     <div className="mt-4 p-3 bg-blue-50 rounded-lg">
             <p className="text-sm text-blue-800">
               <strong>💡 Tip:</strong> Use prefixes like "Goals:", "Temporary Communication Style:", "Recent Thoughts:", "Strategic Priorities:", "Daily Focus:" to help the agent organize and update these notes daily.
             </p>
           </div>
        </motion.div>

        {/* Thoughts */}
        <motion.div 
          variants={itemVariants}
          className="bg-white rounded-lg p-6 shadow-sm border border-gray-200"
        >
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <span className="mr-2">💭</span>
            Thoughts (Sleep Reset)
          </h2>
          
                               <div className="space-y-3">
             {formData.thgt.map((thought, index) => (
               <motion.div 
                 key={index} 
                 className="flex space-x-2"
                 initial={{ opacity: 0, x: -20 }}
                 animate={{ opacity: 1, x: 0 }}
                 transition={{ delay: index * 0.1 }}
               >
                 <input
                   type="text"
                   value={thought}
                   onChange={(e) => updateArrayEntry('thgt', index, e.target.value)}
                                       placeholder={index < 5 ? [
                      "e.g., Current Thought: I should prioritize AI safety research today",
                      "e.g., Temporary Focus: Need to analyze recent developments in LLMs",
                      "e.g., Sleep Reflection: Today's research revealed important patterns",
                      "e.g., Immediate Priority: Review the latest AI ethics papers",
                      "e.g., Evening Planning: Prepare for tomorrow's community discussions"
                    ][index] : ""}
                   className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                 />
                 <button
                   onClick={() => removeArrayEntry('thgt', index)}
                   className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition-colors"
                 >
                   Remove
                 </button>
               </motion.div>
             ))}
            <motion.button
              onClick={() => addArrayEntry('thgt', '')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              + Add Thought
            </motion.button>
          </div>
        </motion.div>

        {/* Available Tools */}
        <motion.div 
          variants={itemVariants}
          className="bg-white rounded-lg p-6 shadow-sm border border-gray-200"
        >
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <span className="mr-2">🔧</span>
            Available Tools
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tools.map((tool, index) => (
              <motion.div 
                key={tool.id} 
                className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
              >
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
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Save Changes */}
        <motion.div 
          variants={itemVariants}
          className="bg-white rounded-lg p-6 shadow-sm border border-gray-200"
        >
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium text-gray-900">Save Changes</h3>
              <p className="text-sm text-gray-600">Apply your configuration changes to the agent</p>
            </div>
            <div className="flex space-x-3">
              <motion.button
                onClick={() => {
                  if (confirm('Discard all changes?')) {
                    window.history.back()
                  }
                }}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Cancel
              </motion.button>
              <motion.button
                onClick={() => {
                  alert('Settings saved successfully!\n\nChanges applied:\n• Basic info updated\n• Memory configuration saved\n• Tools configuration saved')
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Save Changes
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Danger Zone */}
        <motion.div 
          variants={itemVariants}
          className="bg-white rounded-lg p-6 shadow-sm border border-red-200"
        >
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
            <motion.div 
              className="space-y-4 pt-4 border-t border-red-200"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <motion.div 
                className="flex justify-between items-center p-4 bg-red-50 rounded-lg"
                whileHover={{ scale: 1.01 }}
              >
                <div>
                  <h4 className="font-medium text-red-900">Export Full Data</h4>
                  <p className="text-sm text-red-700">Download all agent data including memory and activity history</p>
                </div>
                <button
                  onClick={() => {
                    alert('Exporting agent data...\n\nThis would download:\n• Agent configuration\n• All memory layers\n• Activity history\n• Conversation logs')
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Export Data
                </button>
              </motion.div>
              
              <motion.div 
                className="flex justify-between items-center p-4 bg-red-50 rounded-lg"
                whileHover={{ scale: 1.01 }}
              >
                <div>
                  <h4 className="font-medium text-red-900">Reset Memory</h4>
                  <p className="text-sm text-red-700">Clear all memory layers (PMEM will be preserved)</p>
                </div>
                <button
                  onClick={() => {
                    if (confirm('Are you sure? This will clear all NOTE and THGT memory layers.')) {
                      alert('Memory reset completed!\n\n• NOTE layer cleared\n• THGT layer cleared\n• PMEM preserved')
                    }
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Reset Memory
                </button>
              </motion.div>
              
              <motion.div 
                className="flex justify-between items-center p-4 bg-red-50 rounded-lg"
                whileHover={{ scale: 1.01 }}
              >
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
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
} 