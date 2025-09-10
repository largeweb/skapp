'use client';

import { useState } from 'react';
// Using simple SVG icons instead of heroicons for compatibility
const ChevronDownIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const ChevronRightIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

interface ContextData {
  systemPrompt: string;
  turnPrompt?: string;
  currentTime: string;
  additionalContext: any;
}

interface TurnHistoryEntry {
  role: 'user' | 'model';
  parts: { text: string }[];
}

interface AgentContextViewerProps {
  agentId: string;
  mode: 'awake' | 'sleep' | 'chat';
  isOpen: boolean;
  onClose: () => void;
  turnHistory?: TurnHistoryEntry[];
  chatHistory?: { role: 'user' | 'assistant'; content: string }[];
}

export default function AgentContextViewer({ 
  agentId, 
  mode, 
  isOpen, 
  onClose, 
  turnHistory = [],
  chatHistory = []
}: AgentContextViewerProps) {
  const [contextData, setContextData] = useState<ContextData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [systemPromptExpanded, setSystemPromptExpanded] = useState(false);
  const [turnHistoryExpanded, setTurnHistoryExpanded] = useState(false);
  const [additionalExpanded, setAdditionalExpanded] = useState(false);

  const fetchContext = async () => {
    if (contextData) return; // Already loaded
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/agents/${agentId}/context`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          chatHistory: mode === 'chat' ? chatHistory : undefined
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch context');
      }
      
      const data = await response.json() as ContextData;
      setContextData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleSystemPromptToggle = () => {
    if (!systemPromptExpanded) {
      fetchContext();
    }
    setSystemPromptExpanded(!systemPromptExpanded);
  };

  if (!isOpen) return null;

  const modeLabels = {
    awake: 'Awake Mode Context',
    sleep: 'Sleep Mode Context', 
    chat: 'Chat Mode Context'
  };

  const getAdditionalSectionTitle = () => {
    switch (mode) {
      case 'chat': return 'Local Chat History';
      case 'awake': return 'Turn Prompt & Channel Activity';
      case 'sleep': return 'Sleep Mode Context';
      default: return 'Additional Context';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {modeLabels[mode]}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Section 1: System Prompt */}
          <div className="mb-6">
            <button
              onClick={handleSystemPromptToggle}
              className="flex items-center w-full text-left p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            >
              {systemPromptExpanded ? (
                <ChevronDownIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
              ) : (
                <ChevronRightIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
              )}
              <span className="font-medium text-blue-900 dark:text-blue-100">
                System Prompt ({mode} mode)
              </span>
              {loading && (
                <span className="ml-2 text-sm text-blue-600 dark:text-blue-400">Loading...</span>
              )}
            </button>
            
            {systemPromptExpanded && (
              <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                {error ? (
                  <p className="text-red-600 dark:text-red-400">{error}</p>
                ) : contextData ? (
                  <div>
                    <div className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                      Generated at: {contextData.currentTime}
                    </div>
                    <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-mono bg-white dark:bg-gray-800 p-3 rounded border overflow-x-auto">
                      {contextData.systemPrompt}
                    </pre>
                  </div>
                ) : (
                  <p className="text-gray-600 dark:text-gray-400">Click to load system prompt...</p>
                )}
              </div>
            )}
          </div>

          {/* Section 2: Turn History */}
          <div className="mb-6">
            <button
              onClick={() => setTurnHistoryExpanded(!turnHistoryExpanded)}
              className="flex items-center w-full text-left p-3 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
            >
              {turnHistoryExpanded ? (
                <ChevronDownIcon className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
              ) : (
                <ChevronRightIcon className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
              )}
              <span className="font-medium text-green-900 dark:text-green-100">
                Turn History ({turnHistory.length} turns)
              </span>
            </button>
            
            {turnHistoryExpanded && (
              <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg max-h-64 overflow-y-auto">
                {turnHistory.length === 0 ? (
                  <p className="text-gray-600 dark:text-gray-400">No conversation history yet.</p>
                ) : (
                  <div className="space-y-3">
                    {turnHistory.map((turn, index) => (
                      <div key={index} className="border-l-2 border-gray-300 dark:border-gray-600 pl-3">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {turn.role === 'user' ? 'User' : 'Assistant'}:
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {turn.parts.map((part, partIndex) => (
                            <span key={partIndex}>{part.text}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 3: Additional Context (Mode-specific) */}
          <div className="mb-6">
            <button
              onClick={() => setAdditionalExpanded(!additionalExpanded)}
              className="flex items-center w-full text-left p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
            >
              {additionalExpanded ? (
                <ChevronDownIcon className="h-5 w-5 text-purple-600 dark:text-purple-400 mr-2" />
              ) : (
                <ChevronRightIcon className="h-5 w-5 text-purple-600 dark:text-purple-400 mr-2" />
              )}
              <span className="font-medium text-purple-900 dark:text-purple-100">
                {getAdditionalSectionTitle()}
              </span>
            </button>
            
            {additionalExpanded && (
              <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                 {mode === 'chat' && contextData && (
                   <div>
                     {contextData.additionalContext?.localChatHistory?.length > 0 ? (
                      <div className="space-y-2">
                        {contextData.additionalContext.localChatHistory.map((msg: any, index: number) => (
                          <div key={index} className="border-l-2 border-blue-300 dark:border-blue-600 pl-3">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {msg.role === 'user' ? 'You' : 'Agent'}:
                            </span>
                            <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                              {msg.content}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-600 dark:text-gray-400 italic">
                        {contextData?.additionalContext?.chatMessage || 
                         "Chats are temporary and reset on page reload. Start chatting to see conversation context here."}
                      </p>
                    )}
                  </div>
                )}
                
                {mode === 'awake' && contextData && (
                  <div className="space-y-4">
                    {contextData.turnPrompt && (
                      <div>
                        <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Turn Prompt:</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 p-3 rounded border">
                          {contextData.turnPrompt}
                        </p>
                      </div>
                    )}
                    
                    {contextData.additionalContext.turnPromptEnhancement && (
                      <div>
                        <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Turn Prompt Enhancement:</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 p-3 rounded border">
                          {contextData.additionalContext.turnPromptEnhancement}
                        </p>
                      </div>
                    )}
                    
                    <div>
                      <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Channel Activity:</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 p-3 rounded border">
                        {contextData.additionalContext.channelActivity}
                      </p>
                    </div>
                  </div>
                )}
                
                {mode === 'sleep' && contextData && (
                  <div className="space-y-4">
                    {contextData.turnPrompt && (
                      <div>
                        <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Sleep Mode Prompt:</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 p-3 rounded border">
                          {contextData.turnPrompt}
                        </p>
                      </div>
                    )}
                    
                    <div>
                      <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Channel Activity:</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 p-3 rounded border">
                        {contextData.additionalContext.channelActivity}
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Sleep Instructions:</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 p-3 rounded border">
                        {contextData.additionalContext.sleepInstructions}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 