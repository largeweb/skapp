'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'

export default function Navigation() {
  const pathname = usePathname()
  
  return (
    <motion.nav 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700/50 sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-8">
          <Link href="/" className="text-xl font-bold flex items-center space-x-2 text-white hover:text-blue-400 transition-colors">
            <motion.span
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
              className="text-2xl"
            >
              🚀
            </motion.span>
            <span>SpawnKit</span>
          </Link>
          
          <div className="flex space-x-1">
            <Link 
              href="/" 
              className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                pathname === '/' 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25' 
                  : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              Dashboard
            </Link>
            <Link 
              href="/agents" 
              className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                pathname === '/agents' 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25' 
                  : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              Agents
            </Link>
          </div>
        </div>
        
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Link 
            href="/create" 
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-all duration-200 shadow-lg shadow-green-600/25 hover:shadow-green-500/30"
          >
            <span className="text-lg">+</span>
            <span>Create</span>
          </Link>
        </motion.div>
      </div>
    </motion.nav>
  )
} 