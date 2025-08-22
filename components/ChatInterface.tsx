'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  isStreaming?: boolean
}

interface MemoryContext {
  pmem: string[]
  note: string[]
  thgt: string[]
  work: string[]
}

interface ChatInterfaceProps {
  agentId: string
  agentName: string
  className?: string
}

export default function ChatInterface({ agentId, agentName, className = '' }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [memoryContext, setMemoryContext] = useState<MemoryContext>({ pmem: [], note: [], thgt: [], work: [] })
  const [showMemorySidebar, setShowMemorySidebar] = useState(true)
  const [streamingMessage, setStreamingMessage] = useState<string>('')
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    fetchMemoryContext()
    scrollToBottom()
  }, [agentId])

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingMessage])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchMemoryContext = async () => {
    try {
      const response = await fetch(`/api/agents/${agentId}/memory?limit=3`)
      if (response.ok) {
        const data = await response.json() as any
        
        // Add comprehensive null checks and fallbacks
        const memoryData = data?.memory || {}
        const pmem = memoryData.pmem || []
        const note = memoryData.note || []
        const thgt = memoryData.thgt || []
        const work = memoryData.work || []
        
        setMemoryContext({
          pmem: Array.isArray(pmem) ? pmem.slice(0, 3).map((entry: any) => entry?.content || '').filter(Boolean) : [],
          note: Array.isArray(note) ? note.slice(0, 3).map((entry: any) => entry?.content || '').filter(Boolean) : [],
          thgt: Array.isArray(thgt) ? thgt.slice(0, 3).map((entry: any) => entry?.content || '').filter(Boolean) : [],
          work: Array.isArray(work) ? work.slice(0, 3).map((entry: any) => entry?.content || '').filter(Boolean) : []
        })
      }
    } catch (error) {
      console.error('Failed to fetch memory context:', error)
      // Set empty memory context on error
      setMemoryContext({ pmem: [], note: [], thgt: [], work: [] })
    }
  }

  const sendMessage = async (message: string, stream: boolean = false) => {
    if (!message.trim()) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)
    setError(null)

    try {
      if (stream) {
        await sendStreamingMessage(message)
      } else {
        await sendRegularMessage(message)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message')
    } finally {
      setIsLoading(false)
      setStreamingMessage('')
    }
  }

  const sendRegularMessage = async (message: string) => {
    const response = await fetch(`/api/agents/${agentId}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, stream: false })
    })

    if (!response.ok) {
      throw new Error('Failed to send message')
    }

    const data = await response.json() as any
    
    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: data.message,
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, assistantMessage])
    await fetchMemoryContext() // Refresh memory context
  }

  const sendStreamingMessage = async (message: string) => {
    const response = await fetch(`/api/agents/${agentId}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, stream: true })
    })

    if (!response.ok) {
      throw new Error('Failed to send message')
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('No response stream available')
    }

    let fullContent = ''
    const assistantMessageId = crypto.randomUUID()

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = new TextDecoder().decode(value)
        const lines = chunk.split('\n')
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') {
              // Streaming complete
              const finalMessage: Message = {
                id: assistantMessageId,
                role: 'assistant',
                content: fullContent,
                timestamp: new Date().toISOString()
              }
              setMessages(prev => [...prev, finalMessage])
              await fetchMemoryContext()
              return
            }
            
            try {
              const parsed = JSON.parse(data)
              if (parsed.choices?.[0]?.delta?.content) {
                const content = parsed.choices[0].delta.content
                fullContent += content
                setStreamingMessage(fullContent)
              }
            } catch (e) {
              // Ignore parsing errors for incomplete chunks
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputMessage.trim() && !isLoading) {
      sendMessage(inputMessage, true) // Use streaming by default
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  return (
    <div className={`flex h-full ${className}`}>
      {/* Main Chat Area */}
      <div className={`flex flex-col ${showMemorySidebar ? 'flex-1' : 'w-full'}`}>
        {/* Chat Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white font-bold">
              {agentName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">{agentName}</h2>
              <p className="text-sm text-gray-500">AI Agent</p>
            </div>
          </div>
          <button
            onClick={() => setShowMemorySidebar(!showMemorySidebar)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            {showMemorySidebar ? '📋' : '🧠'}
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] p-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  <div className={`text-xs mt-1 ${
                    message.role === 'user' ? 'text-blue-200' : 'text-gray-500'
                  }`}>
                    {formatTime(message.timestamp)}
                  </div>
                </div>
              </motion.div>
            ))}
            
            {/* Streaming Message */}
            {streamingMessage && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="max-w-[70%] p-3 rounded-lg bg-gray-100 text-gray-900">
                  <div className="whitespace-pre-wrap">
                    {streamingMessage}
                    <span className="animate-pulse">▋</span>
                  </div>
                  <div className="text-xs mt-1 text-gray-500">
                    {formatTime(new Date().toISOString())}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {isLoading && !streamingMessage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="max-w-[70%] p-3 rounded-lg bg-gray-100">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-4 p-3 bg-red-50 border border-red-300 rounded-lg"
          >
            <p className="text-red-600 text-sm">{error}</p>
          </motion.div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <form onSubmit={handleSubmit} className="flex space-x-3">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 p-3 border border-gray-300 rounded-lg resize-none bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              rows={1}
              disabled={isLoading}
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 focus:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg disabled:opacity-60 disabled:cursor-not-allowed transition-colors focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              Send
            </button>
          </form>
        </div>
      </div>

      {/* Memory Context Sidebar */}
      <AnimatePresence>
        {showMemorySidebar && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 300, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="border-l border-gray-200 bg-gray-50 overflow-hidden"
          >
            <div className="p-4 h-full overflow-y-auto">
              <h3 className="font-semibold text-gray-900 mb-4">Memory Context</h3>
              
              <div className="space-y-4">
                {/* Permanent Memory */}
                <div className="bg-white p-3 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-700 mb-2">🧠 Permanent Memory</h4>
                  {memoryContext.pmem.length > 0 ? (
                    <div className="space-y-2">
                      {memoryContext.pmem.map((content, index) => (
                        <div key={index} className="text-sm text-gray-600 bg-blue-50 p-2 rounded">
                          {content}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No permanent memory</p>
                  )}
                </div>

                {/* Notes */}
                <div className="bg-white p-3 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-700 mb-2">📝 Recent Notes</h4>
                  {memoryContext.note.length > 0 ? (
                    <div className="space-y-2">
                      {memoryContext.note.map((content, index) => (
                        <div key={index} className="text-sm text-gray-600 bg-blue-50 p-2 rounded">
                          {content}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No recent notes</p>
                  )}
                </div>

                {/* Thoughts */}
                <div className="bg-white p-3 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-700 mb-2">💭 Recent Thoughts</h4>
                  {memoryContext.thgt.length > 0 ? (
                    <div className="space-y-2">
                      {memoryContext.thgt.map((content, index) => (
                        <div key={index} className="text-sm text-gray-600 bg-blue-50 p-2 rounded">
                          {content}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No recent thoughts</p>
                  )}
                </div>

                {/* Work Items */}
                <div className="bg-white p-3 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-700 mb-2">⚡ Recent Work</h4>
                  {memoryContext.work.length > 0 ? (
                    <div className="space-y-2">
                      {memoryContext.work.map((content, index) => (
                        <div key={index} className="text-sm text-gray-600 bg-blue-50 p-2 rounded">
                          {content}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No recent work</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
