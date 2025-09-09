'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function Dashboard() {
  const [orchestrating, setOrchestrating] = useState(false);
  const [orchestrateResult, setOrchestrateResult] = useState<string | null>(null);

  // Orchestrate all agents
  const handleOrchestrateAll = async () => {
    setOrchestrating(true);
    setOrchestrateResult(null);
    
    try {
      console.log('🎭 Orchestrating all agents...');
      const response = await fetch('/api/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'awake', // Force awake for manual testing
          estTime: new Date().toISOString()
        })
      });
      
      if (response.ok) {
        const data = await response.json() as any;
        setOrchestrateResult(`✅ Success: ${data.successful} agents processed, ${data.failed} failed`);
        console.log('✅ Orchestration result:', data);
      } else {
        const error = await response.json() as any;
        setOrchestrateResult(`❌ Failed: ${error.error}`);
      }
    } catch (error) {
      console.error('💥 Orchestration failed:', error);
      setOrchestrateResult('❌ Network error occurred');
    } finally {
      setOrchestrating(false);
      // Clear result after 5 seconds
      setTimeout(() => setOrchestrateResult(null), 5000);
    }
  };

  // HARDCODED DATA - Replace with API calls later
  const systemStats = {
    activeAgents: 4,
    notesToday: 23,
    lastCycle: '2m',
    toolsExecuted: 8
  };

  const agents = [
    {
      id: 'research_bot',
      name: 'Agent1',
      type: 'Research',
      status: 'awake',
      lastActivity: '2m ago',
      statusColor: 'bg-blue-500',
      statusRing: 'ring-blue-500/20'
    },
    {
      id: 'content_creator',
      name: 'Agent2', 
      type: 'Content',
      status: 'Sleep',
      lastActivity: '15m ago',
      statusColor: 'bg-blue-400',
      statusRing: 'ring-blue-400/20'
    },
    {
      id: 'discord_bot',
      name: 'Agent3',
      type: 'Discord',
      status: 'Thinking',
      lastActivity: '30s ago',
      statusColor: 'bg-blue-600',
      statusRing: 'ring-blue-600/20'
    }
  ];

  const recentActivity = [
    { time: '2m ago', agent: 'Agent1', action: 'used web_search()', detail: 'Researching AI trends' },
    { time: '15m ago', agent: 'Agent2', action: 'entered sleep mode', detail: 'Processing daily memories' },
    { time: '18m ago', agent: 'Agent3', action: 'posted to Discord', detail: '#general channel' },
    { time: '25m ago', agent: 'Agent1', action: 'took note', detail: '"Market trends show 25% growth..."' }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  const cardVariants = {
    hidden: { y: 20, opacity: 0, scale: 0.95 },
    visible: {
      y: 0,
      opacity: 1,
      scale: 1
    },
    hover: {
      y: -8,
      scale: 1.02
    }
  };

  const pulseVariants = {
    initial: { scale: 1, opacity: 1 },
    pulse: {
      scale: [1, 1.1, 1],
      opacity: [1, 0.8, 1]
    }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-7xl mx-auto px-6 py-8 space-y-8"
    >
      {/* Header */}
      <motion.div 
        variants={itemVariants}
        className="text-center space-y-4"
      >
        <motion.h1 
          className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-600 to-blue-800 bg-clip-text text-transparent"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          SpawnKit - Persistent AI Agents
        </motion.h1>
        <motion.p 
          className="text-xl text-gray-600 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        >
          Digital workers that think, learn & act autonomously
        </motion.p>
      </motion.div>

      {/* System Stats */}
      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-2 md:grid-cols-4 gap-6"
      >
        {[
          { value: systemStats.activeAgents, label: 'Active Agents', color: 'blue' },
          { value: systemStats.notesToday, label: 'Notes Today', color: 'blue' },
          { value: systemStats.lastCycle, label: 'Last Cycle', color: 'blue' },
          { value: systemStats.toolsExecuted, label: 'Tools Executed', color: 'blue' }
        ].map((stat, index) => (
          <motion.div 
            key={stat.label}
            variants={cardVariants}
            whileHover="hover"
            className="bg-white border border-gray-200 rounded-xl p-6 text-center hover:border-blue-500 transition-all duration-300 shadow-sm hover:shadow-lg"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <motion.div 
              className={`text-3xl font-bold text-blue-600 mb-2`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                duration: 0.5, 
                delay: 0.3 + index * 0.1,
                type: "spring",
                stiffness: 200
              }}
            >
              {stat.value}
            </motion.div>
            <div className="text-gray-600 text-sm">{stat.label}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Your Agents */}
      <motion.div variants={itemVariants} className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">
            Your Agents
          </h2>
          <div className="flex items-center space-x-4">
            {/* Orchestrate Result */}
            {orchestrateResult && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-sm px-3 py-1 rounded-lg bg-gray-100 text-gray-700"
              >
                {orchestrateResult}
              </motion.div>
            )}
            
            {/* Orchestrate All Button */}
            <motion.button
              onClick={handleOrchestrateAll}
              disabled={orchestrating}
              whileHover={{ scale: orchestrating ? 1 : 1.05 }}
              whileTap={{ scale: orchestrating ? 1 : 0.95 }}
              className={`px-6 py-3 rounded-lg flex items-center space-x-2 transition-all duration-200 shadow-lg focus-visible:ring-2 focus-visible:ring-blue-500 ${
                orchestrating 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-700 focus:bg-green-700 text-white shadow-green-600/25 hover:shadow-green-500/30'
              }`}
            >
              {orchestrating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  <span>Orchestrating...</span>
                </>
              ) : (
                <>
                  <span>🎭</span>
                  <span>Orchestrate All</span>
                </>
              )}
            </motion.button>
            
            {/* New Agent Button */}
            <motion.div 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
              className="relative"
            >
              <Link 
                href="/create" 
                className="bg-blue-600 hover:bg-blue-700 focus:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-all duration-200 shadow-lg shadow-blue-600/25 hover:shadow-blue-500/30 focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <motion.span 
                  className="text-lg"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                >
                  +
                </motion.span>
                <span>New Agent</span>
              </Link>
            </motion.div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {agents.map((agent, index) => (
            <motion.div 
              key={agent.id}
              variants={cardVariants}
              whileHover="hover"
              className="bg-white border border-gray-200 rounded-xl p-6 hover:border-gray-300 transition-all duration-300 group shadow-sm hover:shadow-lg"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              <div className="flex items-center mb-4">
                <motion.div 
                  className={`w-3 h-3 rounded-full ${agent.statusColor} mr-3 ring-4 ${agent.statusRing}`}
                  variants={pulseVariants}
                  initial="initial"
                  animate="pulse"
                />
                <span className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{agent.name}</span>
              </div>
              <div className="text-gray-600 mb-2">{agent.type}</div>
              <div className="text-gray-500 text-sm mb-6">{agent.lastActivity}</div>
              <div className="flex space-x-3">
                {[
                  { label: 'Chat', href: `/agents/${agent.id}`, icon: '▶️', color: 'blue', title: 'Chat with agent' },
                  { label: 'View', href: `/agents/${agent.id}`, icon: '👁️', color: 'blue', title: 'View details' },
                  { label: 'Monitor', href: `/agents/${agent.id}`, icon: '📊', color: 'blue', title: 'Monitor activity' }
                ].map((button, btnIndex) => (
                  <motion.div
                    key={button.label}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title={button.title}
                  >
                    <Link 
                      href={button.href}
                      className="w-12 h-12 rounded-lg text-lg transition-all duration-200 border-2 flex items-center justify-center text-blue-600 hover:text-blue-700 border-blue-300 hover:border-blue-400 hover:bg-blue-50"
                    >
                      {button.icon}
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div variants={itemVariants} className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-3">
          <span>Recent Activity</span>
          <div className="flex items-center space-x-2 ml-4">
            <motion.div 
              className="w-2 h-2 bg-blue-500 rounded-full"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [1, 0.7, 1]
              }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <span className="text-sm text-gray-600">Live feed</span>
          </div>
        </h2>
        <motion.div 
          className="bg-white border border-gray-200 rounded-xl p-6 space-y-4 shadow-sm"
          variants={cardVariants}
        >
          {recentActivity.map((activity, index) => (
            <motion.div 
              key={index}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all duration-200"
              whileHover={{ 
                x: 5,
                backgroundColor: "#f8fafc"
              }}
            >
              <div className="text-sm text-gray-500 min-w-16 font-mono">{activity.time}</div>
              <div className="flex-1">
                <span className="font-medium text-gray-900">{activity.agent}</span>
                <span className="text-gray-600 mx-2">{activity.action}</span>
                {activity.detail && (
                  <span className="text-gray-500 text-sm">- {activity.detail}</span>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
        
        <motion.div 
          className="text-center text-sm text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          Updates every 30 seconds
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
