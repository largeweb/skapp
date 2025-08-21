'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navigation() {
  const pathname = usePathname()
  
  return (
    <nav className="bg-gray-900 text-white p-4 shadow-lg">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link href="/" className="text-xl font-bold flex items-center space-x-2">
            <span>🚀</span>
            <span>SpawnKit</span>
          </Link>
          
          <div className="flex space-x-6">
            <Link 
              href="/" 
              className={`px-3 py-2 rounded transition-colors ${
                pathname === '/' ? 'bg-blue-600' : 'hover:bg-gray-700'
              }`}
            >
              Dashboard
            </Link>
            <Link 
              href="/agents" 
              className={`px-3 py-2 rounded transition-colors ${
                pathname === '/agents' ? 'bg-blue-600' : 'hover:bg-gray-700'
              }`}
            >
              Agents
            </Link>
          </div>
        </div>
        
        <Link 
          href="/create" 
          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded flex items-center space-x-2 transition-colors"
        >
          <span>+</span>
          <span>Create</span>
        </Link>
      </div>
    </nav>
  )
} 