'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

export default function Dashboard() {
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
      statusColor: 'bg-emerald-500',
      statusRing: 'ring-emerald-500/20'
    },
    {
      id: 'content_creator',
      name: 'Agent2', 
      type: 'Content',
      status: 'Sleep',
      lastActivity: '15m ago',
      statusColor: 'bg-blue-500',
      statusRing: 'ring-blue-500/20'
    },
    {
      id: 'discord_bot',
      name: 'Agent3',
      type: 'Discord',
      status: 'Thinking',
      lastActivity: '30s ago',
      statusColor: 'bg-amber-500',
      statusRing: 'ring-amber-500/20'
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
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut" as const
      }
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
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex justify-center mb-6"
        >
          <div className="text-6xl">🚀</div>
        </motion.div>
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-600 to-blue-800 dark:from-white dark:via-blue-100 dark:to-blue-200 bg-clip-text text-transparent">
          SpawnKit - Persistent AI Agents
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Digital workers that think, learn & act autonomously
        </p>
      </motion.div>

      {/* System Stats */}
      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-2 md:grid-cols-4 gap-6"
      >
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center hover:border-blue-500 dark:hover:border-blue-500 transition-all duration-300"
        >
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">{systemStats.activeAgents}</div>
          <div className="text-gray-600 dark:text-gray-400 text-sm">Active Agents</div>
        </motion.div>
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center hover:border-green-500 dark:hover:border-green-500 transition-all duration-300"
        >
          <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">{systemStats.notesToday}</div>
          <div className="text-gray-600 dark:text-gray-400 text-sm">Notes Today</div>
        </motion.div>
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center hover:border-blue-500 dark:hover:border-blue-500 transition-all duration-300"
        >
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">{systemStats.lastCycle}</div>
          <div className="text-gray-600 dark:text-gray-400 text-sm">Last Cycle</div>
        </motion.div>
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center hover:border-amber-500 dark:hover:border-amber-500 transition-all duration-300"
        >
          <div className="text-3xl font-bold text-amber-600 dark:text-amber-400 mb-2">{systemStats.toolsExecuted}</div>
          <div className="text-gray-600 dark:text-gray-400 text-sm">Tools Executed</div>
        </motion.div>
      </motion.div>

      {/* Your Agents */}
      <motion.div variants={itemVariants} className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center space-x-3">
            <span className="text-3xl">🤖</span>
            <span>Your Agents</span>
          </h2>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link 
              href="/create" 
              className="bg-blue-600 hover:bg-blue-700 focus:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-all duration-200 shadow-lg shadow-blue-600/25 hover:shadow-blue-500/30 focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <span className="text-lg">+</span>
              <span>New Agent</span>
            </Link>
          </motion.div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {agents.map((agent, index) => (
            <motion.div 
              key={agent.id}
              variants={itemVariants}
              whileHover={{ y: -5, scale: 1.02 }}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-300 group"
            >
              <div className="flex items-center mb-4">
                <div className={`w-3 h-3 rounded-full ${agent.statusColor} mr-3 ring-4 ${agent.statusRing}`}></div>
                <span className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{agent.name}</span>
              </div>
              <div className="text-gray-600 dark:text-gray-400 mb-2">{agent.type}</div>
              <div className="text-gray-500 dark:text-gray-500 text-sm mb-6">{agent.lastActivity}</div>
              <div className="flex space-x-2">
                <Link 
                  href={`/agents/${agent.id}`} 
                  className="flex-1 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 px-3 py-2 rounded-lg text-sm transition-all duration-200 text-center border border-blue-200 dark:border-blue-700 hover:border-blue-300 dark:hover:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  Chat
                </Link>
                <Link 
                  href={`/agents/${agent.id}`} 
                  className="flex-1 bg-gray-50 dark:bg-gray-700/20 hover:bg-gray-100 dark:hover:bg-gray-700/30 text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 px-3 py-2 rounded-lg text-sm transition-all duration-200 text-center border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  View
                </Link>
                <Link 
                  href={`/agents/${agent.id}`} 
                  className="flex-1 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 px-3 py-2 rounded-lg text-sm transition-all duration-200 text-center border border-blue-200 dark:border-blue-700 hover:border-blue-300 dark:hover:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  Monitor
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div variants={itemVariants} className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center space-x-3">
          <span className="text-3xl">📝</span>
          <span>Recent Activity</span>
          <div className="flex items-center space-x-2 ml-4">
            <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Live feed</span>
          </div>
        </h2>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 space-y-4">
          {recentActivity.map((activity, index) => (
            <motion.div 
              key={index}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all duration-200"
            >
              <div className="text-sm text-gray-500 dark:text-gray-500 min-w-16 font-mono">{activity.time}</div>
              <div className="flex-1">
                <span className="font-medium text-gray-900 dark:text-white">{activity.agent}</span>
                <span className="text-gray-600 dark:text-gray-300 mx-2">{activity.action}</span>
                {activity.detail && (
                  <span className="text-gray-500 dark:text-gray-400 text-sm">- {activity.detail}</span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
        
        <div className="text-center text-sm text-gray-500 dark:text-gray-500">
          Updates every 30 seconds
        </div>
      </motion.div>
    </motion.div>
  );
}
