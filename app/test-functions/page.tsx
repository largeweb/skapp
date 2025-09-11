'use client'

import { useState, useEffect } from 'react'

interface Agent {
  id: string;
  name: string;
  status: string;
}

export default function TestFunctionsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAgentId, setSelectedAgentId] = useState('')
  
  // Required Tools Testing State
  const [noteMessage, setNoteMessage] = useState('')
  const [noteExpiration, setNoteExpiration] = useState(7)
  const [thoughtMessage, setThoughtMessage] = useState('')
  const [enhancementMessage, setEnhancementMessage] = useState('')
  const [summaryMessage, setSummaryMessage] = useState('')
  const [toolResults, setToolResults] = useState<Record<string, any>>({})
  const [toolLoading, setToolLoading] = useState<Record<string, boolean>>({})
  
  // SERP API Testing State
  const [serpQuery, setSerpQuery] = useState('')
  const [serpLocation, setSerpLocation] = useState('Austin, Texas, United States')
  const [serpResults, setSerpResults] = useState<any>(null)
  const [serpLoading, setSerpLoading] = useState(false)
  const [serpError, setSerpError] = useState<string | null>(null)
  const [websiteTexts, setWebsiteTexts] = useState<Record<string, any>>({})
  
  // Discord Testing State
  const [discordMessage, setDiscordMessage] = useState('')
  const [discordResults, setDiscordResults] = useState<any>(null)
  const [discordLoading, setDiscordLoading] = useState(false)
  const [discordActivity, setDiscordActivity] = useState<any>(null)
  const [discordActivityLoading, setDiscordActivityLoading] = useState(false)

  useEffect(() => {
    fetchAgents()
  }, [])

  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/dashboard-metrics')
      if (response.ok) {
        const data = await response.json() as any
        const agentList = data.agents?.map((agent: any) => ({
          id: agent.id,
          name: agent.name,
          status: agent.status
        })) || []
        setAgents(agentList)
        if (agentList.length > 0) {
          setSelectedAgentId(agentList[0].id)
        }
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error)
    }
  }

  const testRequiredTool = async (toolId: string, params: Record<string, any>) => {
    if (!selectedAgentId) {
      alert('Please select an agent first')
      return
    }

    setToolLoading(prev => ({ ...prev, [toolId]: true }))
    setToolResults(prev => ({ ...prev, [toolId]: null }))

    try {
      const response = await fetch('/api/process-tool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolId,
          params,
          agentId: selectedAgentId
        })
      })

      const data = await response.json() as any
      setToolResults(prev => ({ ...prev, [toolId]: data }))
    } catch (error) {
      setToolResults(prev => ({ 
        ...prev, 
        [toolId]: { 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        } 
      }))
    } finally {
      setToolLoading(prev => ({ ...prev, [toolId]: false }))
    }
  }

  const testSerpAPI = async () => {
    if (!serpQuery.trim()) {
      setSerpError('Query is required')
      return
    }

    setSerpLoading(true)
    setSerpError(null)
    setSerpResults(null)
    setWebsiteTexts({})

    try {
      const response = await fetch('/api/serp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: serpQuery, 
          location: serpLocation 
        })
      })

      const data = await response.json() as any

      if (!response.ok) {
        setSerpError(data.error || 'SERP API request failed')
        return
      }

      setSerpResults(data)
    } catch (error) {
      setSerpError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setSerpLoading(false)
    }
  }

  const fetchWebsiteText = async (url: string) => {
    if (websiteTexts[url]) {
      setWebsiteTexts(prev => ({
        ...prev,
        [url]: { ...prev[url], visible: !prev[url].visible }
      }))
      return
    }

    setWebsiteTexts(prev => ({
      ...prev,
      [url]: { loading: true, visible: true }
    }))

    try {
      const response = await fetch('/api/fetch-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      })

      const data = await response.json() as any

      if (!response.ok) {
        setWebsiteTexts(prev => ({
          ...prev,
          [url]: { 
            error: data.error || 'Failed to fetch website text',
            loading: false,
            visible: true
          }
        }))
        return
      }

      setWebsiteTexts(prev => ({
        ...prev,
        [url]: {
          ...data,
          loading: false,
          visible: true
        }
      }))
    } catch (error) {
      setWebsiteTexts(prev => ({
        ...prev,
        [url]: {
          error: error instanceof Error ? error.message : 'Unknown error',
          loading: false,
          visible: true
        }
      }))
    }
  }

  const testDiscordMessage = async () => {
    if (!discordMessage.trim()) {
      alert('Message is required')
      return
    }

    setDiscordLoading(true)
    setDiscordResults(null)

    try {
      const response = await fetch('/api/discord/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: discordMessage })
      })

      const data = await response.json()
      setDiscordResults(data)
    } catch (error) {
      setDiscordResults({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setDiscordLoading(false)
    }
  }

  const fetchDiscordActivity = async (timeRange: '2h' | '1d') => {
    setDiscordActivityLoading(true)
    setDiscordActivity(null)

    try {
      const response = await fetch(`/api/discord/activity?range=${timeRange}`)
      const data = await response.json()
      setDiscordActivity(data)
    } catch (error) {
      setDiscordActivity({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setDiscordActivityLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            🧪 SpawnKit Function Testing Lab
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Test all SpawnKit tools and integrations in isolation
          </p>
        </div>

        {/* Section 1: Required Tools Testing */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            🛠️ Required Tools Testing
          </h2>
          
          {/* Agent Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Agent for Testing
            </label>
            <select
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
            >
              <option value="">Select an agent...</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name} ({agent.id}) - {agent.status}
                </option>
              ))}
            </select>
          </div>

          {selectedAgentId ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Generate System Note */}
              <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Generate System Note</h3>
                <div className="space-y-3">
                  <textarea
                    value={noteMessage}
                    onChange={(e) => setNoteMessage(e.target.value)}
                    placeholder="Strategic note content..."
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-gray-100"
                    rows={3}
                  />
                  <input
                    type="number"
                    value={noteExpiration}
                    onChange={(e) => setNoteExpiration(parseInt(e.target.value))}
                    min={1}
                    max={14}
                    className="w-20 px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-gray-100"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">days</span>
                  <button
                    onClick={() => testRequiredTool('generate_system_note', { message: noteMessage, expirationDays: noteExpiration })}
                    disabled={toolLoading.generate_system_note || !noteMessage.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded transition-colors"
                  >
                    {toolLoading.generate_system_note ? '⏳ Testing...' : '📝 Test Note Creation'}
                  </button>
                </div>
                {toolResults.generate_system_note && (
                  <div className={`mt-3 p-3 rounded text-sm ${
                    toolResults.generate_system_note.success 
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200' 
                      : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                  }`}>
                    {toolResults.generate_system_note.success ? '✅' : '❌'} {toolResults.generate_system_note.result || toolResults.generate_system_note.error}
                  </div>
                )}
              </div>

              {/* Generate System Thought */}
              <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Generate System Thought</h3>
                <div className="space-y-3">
                  <textarea
                    value={thoughtMessage}
                    onChange={(e) => setThoughtMessage(e.target.value)}
                    placeholder="Strategic thought content..."
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-gray-100"
                    rows={3}
                  />
                  <button
                    onClick={() => testRequiredTool('generate_system_thought', { message: thoughtMessage })}
                    disabled={toolLoading.generate_system_thought || !thoughtMessage.trim()}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded transition-colors"
                  >
                    {toolLoading.generate_system_thought ? '⏳ Testing...' : '💭 Test Thought Creation'}
                  </button>
                </div>
                {toolResults.generate_system_thought && (
                  <div className={`mt-3 p-3 rounded text-sm ${
                    toolResults.generate_system_thought.success 
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200' 
                      : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                  }`}>
                    {toolResults.generate_system_thought.success ? '✅' : '❌'} {toolResults.generate_system_thought.result || toolResults.generate_system_thought.error}
                  </div>
                )}
              </div>

              {/* Generate Turn Prompt Enhancement */}
              <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Generate Turn Prompt Enhancement</h3>
                <div className="space-y-3">
                  <textarea
                    value={enhancementMessage}
                    onChange={(e) => setEnhancementMessage(e.target.value)}
                    placeholder="Next turn guidance..."
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-gray-100"
                    rows={3}
                  />
                  <button
                    onClick={() => testRequiredTool('generate_turn_prompt_enhancement', { message: enhancementMessage })}
                    disabled={toolLoading.generate_turn_prompt_enhancement || !enhancementMessage.trim()}
                    className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-2 rounded transition-colors"
                  >
                    {toolLoading.generate_turn_prompt_enhancement ? '⏳ Testing...' : '🎯 Test Enhancement'}
                  </button>
                </div>
                {toolResults.generate_turn_prompt_enhancement && (
                  <div className={`mt-3 p-3 rounded text-sm ${
                    toolResults.generate_turn_prompt_enhancement.success 
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200' 
                      : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                  }`}>
                    {toolResults.generate_turn_prompt_enhancement.success ? '✅' : '❌'} {toolResults.generate_turn_prompt_enhancement.result || toolResults.generate_turn_prompt_enhancement.error}
                  </div>
                )}
              </div>

              {/* Generate Day Summary */}
              <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Generate Day Summary</h3>
                <div className="space-y-3">
                  <textarea
                    value={summaryMessage}
                    onChange={(e) => setSummaryMessage(e.target.value)}
                    placeholder="Day summary content..."
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-gray-100"
                    rows={3}
                  />
                  <button
                    onClick={() => testRequiredTool('generate_day_summary_from_conversation', { message: summaryMessage })}
                    disabled={toolLoading.generate_day_summary_from_conversation || !summaryMessage.trim()}
                    className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white px-4 py-2 rounded transition-colors"
                  >
                    {toolLoading.generate_day_summary_from_conversation ? '⏳ Testing...' : '📊 Test Summary'}
                  </button>
                </div>
                {toolResults.generate_day_summary_from_conversation && (
                  <div className={`mt-3 p-3 rounded text-sm ${
                    toolResults.generate_day_summary_from_conversation.success 
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200' 
                      : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                  }`}>
                    {toolResults.generate_day_summary_from_conversation.success ? '✅' : '❌'} {toolResults.generate_day_summary_from_conversation.result || toolResults.generate_day_summary_from_conversation.error}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Please select an agent to test required tools
            </div>
          )}
        </div>

        {/* Section 2: Optional Tools Testing */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            🔍 Optional Tools Testing
          </h2>

          {/* SERP API Testing */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Web Search (SERP API)</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Search Query
                </label>
                <input
                  type="text"
                  value={serpQuery}
                  onChange={(e) => setSerpQuery(e.target.value)}
                  placeholder="e.g., AI market trends 2025"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={serpLocation}
                  onChange={(e) => setSerpLocation(e.target.value)}
                  placeholder="Austin, Texas, United States"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
            <button
              onClick={testSerpAPI}
              disabled={serpLoading || !serpQuery.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg transition-colors"
            >
              {serpLoading ? '🔄 Searching...' : '🚀 Test Web Search'}
            </button>

            {serpError && (
              <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
                <p className="text-red-800 dark:text-red-200">❌ {serpError}</p>
              </div>
            )}

            {serpResults && (
              <div className="mt-6">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Search Results:</h4>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                  <details className="cursor-pointer">
                    <summary className="font-medium text-gray-900 dark:text-gray-100">
                      📊 Raw API Response ({serpResults.results?.organic_results?.length || 0} results)
                    </summary>
                    <pre className="mt-2 text-xs text-gray-600 dark:text-gray-400 overflow-auto max-h-40">
                      {JSON.stringify(serpResults, null, 2)}
                    </pre>
                  </details>
                </div>

                {serpResults.results?.organic_results && (
                  <div className="space-y-4">
                    <h5 className="font-medium text-gray-900 dark:text-gray-100">🔗 Search Results with Text Extraction:</h5>
                    {serpResults.results.organic_results.slice(0, 5).map((result: any, index: number) => (
                      <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                        <h6 className="font-medium text-gray-900 dark:text-gray-100 mb-1">{result.title}</h6>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{result.snippet}</p>
                        <div className="flex items-center gap-3 mb-2">
                          <a 
                            href={result.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                          >
                            {result.link}
                          </a>
                          <button
                            onClick={() => fetchWebsiteText(result.link)}
                            disabled={websiteTexts[result.link]?.loading}
                            className="text-xs bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-2 py-1 rounded transition-colors"
                          >
                            {websiteTexts[result.link]?.loading ? '⏳' : websiteTexts[result.link]?.visible ? '👁️ Hide Text' : '📄 Extract Text'}
                          </button>
                        </div>
                        
                        {websiteTexts[result.link]?.visible && (
                          <div className="mt-3 border-t border-gray-200 dark:border-gray-600 pt-3">
                            {websiteTexts[result.link]?.error ? (
                              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded p-2">
                                <p className="text-red-800 dark:text-red-200 text-sm">❌ {websiteTexts[result.link].error}</p>
                              </div>
                            ) : websiteTexts[result.link]?.textContent ? (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                  <span>📊 {websiteTexts[result.link].contentLength} characters</span>
                                  <span>🌐 {websiteTexts[result.link].hostname}</span>
                                </div>
                                <div className="bg-gray-100 dark:bg-gray-800 rounded p-3 max-h-40 overflow-y-auto">
                                  <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                    {websiteTexts[result.link].textContent}
                                  </pre>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-gray-100 dark:bg-gray-700 rounded p-2">
                                <p className="text-gray-600 dark:text-gray-400 text-sm">⏳ Extracting website text...</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Discord Message Testing */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Discord Message (Coming Soon)</h3>
            <div className="space-y-3 opacity-50">
              <textarea
                value={discordMessage}
                onChange={(e) => setDiscordMessage(e.target.value)}
                placeholder="Discord message content..."
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-gray-100"
                rows={3}
                disabled
              />
              <button
                onClick={testDiscordMessage}
                disabled={true}
                className="bg-gray-400 text-white px-6 py-2 rounded-lg cursor-not-allowed"
              >
                🔒 Discord Integration Not Implemented
              </button>
            </div>
          </div>
        </div>

        {/* Section 3: Discord Channels */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            💬 Discord Channels
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Channel Activity</h3>
              <div className="space-y-3">
                <button
                  onClick={() => fetchDiscordActivity('2h')}
                  disabled={discordActivityLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded transition-colors"
                >
                  {discordActivityLoading ? '⏳ Loading...' : '📋 Last 2 Hours Activity'}
                </button>
                <button
                  onClick={() => fetchDiscordActivity('1d')}
                  disabled={discordActivityLoading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-4 py-2 rounded transition-colors"
                >
                  {discordActivityLoading ? '⏳ Loading...' : '📅 Last 1 Day Activity'}
                </button>
              </div>
              
              {discordActivity && (
                <div className="mt-4 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  {discordActivity.success ? (
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                        ✅ Discord Activity Retrieved
                      </h4>
                      <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-auto max-h-32">
                        {JSON.stringify(discordActivity, null, 2)}
                      </pre>
                    </div>
                  ) : (
                    <p className="text-red-800 dark:text-red-200">❌ {discordActivity.error}</p>
                  )}
                </div>
              )}
            </div>
            
            <div className="opacity-50">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Send Message</h3>
              <div className="space-y-3">
                <textarea
                  placeholder="Discord message content..."
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-gray-100"
                  rows={3}
                  disabled
                />
                <button
                  disabled={true}
                  className="w-full bg-gray-400 text-white px-4 py-2 rounded cursor-not-allowed"
                >
                  🔒 Discord Integration Not Implemented
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-6">
          <h3 className="text-blue-800 dark:text-blue-200 font-medium mb-3">💡 Testing Instructions</h3>
          <ul className="text-blue-700 dark:text-blue-300 space-y-2 text-sm">
            <li>• <strong>Required Tools</strong>: Select an agent and test individual tool execution</li>
            <li>• <strong>Web Search</strong>: Test SERP API integration and website text extraction</li>
            <li>• <strong>Discord</strong>: View channel activity (when implemented)</li>
            <li>• <strong>Results</strong>: All results show success/failure with detailed output</li>
          </ul>
        </div>
      </div>
    </div>
  )
} 