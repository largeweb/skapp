'use client';

import { useState, useEffect } from 'react';

interface SimpleContextModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  agentId: string;
  mode: 'awake' | 'sleep' | 'chat';
  turnHistory?: any[];
  chatHistory?: { role: 'user' | 'assistant'; content: string }[];
}

export default function SimpleContextModal({ 
  isOpen, 
  onClose, 
  title, 
  agentId, 
  mode,
  turnHistory = [],
  chatHistory = []
}: SimpleContextModalProps) {
  const [contextData, setContextData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'prompt' | 'history' | 'additional'>('prompt');

  useEffect(() => {
    if (isOpen && !contextData) {
      fetchContext();
    }
  }, [isOpen]);

  const fetchContext = async () => {
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
      
      const data = await response.json();
      setContextData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl"
          >
            ×
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveSection('prompt')}
            className={`px-4 py-2 text-sm font-medium ${
              activeSection === 'prompt'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            System Prompt
          </button>
          <button
            onClick={() => setActiveSection('history')}
            className={`px-4 py-2 text-sm font-medium ${
              activeSection === 'history'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Turn History ({turnHistory.length})
          </button>
          <button
            onClick={() => setActiveSection('additional')}
            className={`px-4 py-2 text-sm font-medium ${
              activeSection === 'additional'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {mode === 'chat' ? 'Chat Context' : mode === 'awake' ? 'Awake Context' : 'Sleep Context'}
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[70vh]">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Loading context...</span>
            </div>
          )}

          {error && (
            <div className="text-red-600 p-4 bg-red-50 rounded">
              Error: {error}
            </div>
          )}

          {/* System Prompt Tab */}
          {activeSection === 'prompt' && contextData && (
            <div>
              <div className="mb-2 text-sm text-gray-500">
                Generated at: {contextData.currentTime}
              </div>
              <pre className="text-sm bg-gray-100 dark:bg-gray-700 p-4 rounded border overflow-x-auto whitespace-pre-wrap">
                {contextData.systemPrompt}
              </pre>
            </div>
          )}

          {/* Turn History Tab */}
          {activeSection === 'history' && (
            <div className="space-y-3">
              {turnHistory.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No conversation history yet.</p>
              ) : (
                turnHistory.slice().reverse().map((turn, index) => (
                  <div key={index} className="border border-gray-200 rounded p-3 bg-gray-50 dark:bg-gray-700">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {turn.role === 'user' ? '👤 User' : '🤖 Assistant'}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {turn.parts?.map((part: any, partIndex: number) => (
                        <span key={partIndex}>{part.text}</span>
                      )) || turn.content || 'No content'}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Additional Context Tab */}
          {activeSection === 'additional' && contextData && (
            <div className="space-y-4">
              {mode === 'chat' && (
                <div>
                  <h4 className="font-medium mb-2">Local Chat History:</h4>
                  {contextData.additionalContext?.localChatHistory?.length > 0 ? (
                    <div className="space-y-2">
                      {contextData.additionalContext.localChatHistory.map((msg: any, index: number) => (
                        <div key={index} className="border-l-4 border-blue-300 pl-3 py-1">
                          <span className="font-medium">{msg.role === 'user' ? 'You' : 'Agent'}:</span>
                          <span className="ml-2">{msg.content}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">
                      Chats are temporary and reset on page reload. Start chatting to see conversation context here.
                    </p>
                  )}
                </div>
              )}
              
              {mode === 'awake' && (
                <div className="space-y-4">
                  {contextData.turnPrompt && (
                    <div>
                      <h4 className="font-medium mb-2">Turn Prompt:</h4>
                      <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded">
                        {contextData.turnPrompt}
                      </div>
                    </div>
                  )}
                  
                  {contextData.additionalContext?.turnPromptEnhancement && (
                    <div>
                      <h4 className="font-medium mb-2">Turn Prompt Enhancement:</h4>
                      <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded">
                        {contextData.additionalContext.turnPromptEnhancement}
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <h4 className="font-medium mb-2">Channel Activity:</h4>
                    <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded">
                      {contextData.additionalContext?.channelActivity}
                    </div>
                  </div>
                </div>
              )}
              
              {mode === 'sleep' && (
                <div className="space-y-4">
                  {contextData.turnPrompt && (
                    <div>
                      <h4 className="font-medium mb-2">Sleep Mode Prompt:</h4>
                      <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded">
                        {contextData.turnPrompt}
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <h4 className="font-medium mb-2">Channel Activity:</h4>
                    <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded">
                      {contextData.additionalContext?.channelActivity}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 