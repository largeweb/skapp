// Memory system types based on sticky note architecture
// PMEM (Permanent Memory) - REQUIRED
// NOTE (Notes) - OPTIONAL  
// THGT (Thoughts) - OPTIONAL
// Participants - REQUIRED

export interface PMEMEntry {
  id: string
  type: 'goals' | 'permanent_knowledge' | 'static_attributes' | 'tools' | 'codes'
  content: string
  metadata?: {
    priority?: 'low' | 'medium' | 'high' | 'critical'
    category?: string
    tags?: string[]
    lastUpdated?: string
  }
  createdAt: string
  updatedAt: string
}

export interface NOTEEntry {
  id: string
  type: 'observation' | 'learning' | 'insight' | 'reminder' | 'reference'
  content: string
  metadata?: {
    source?: string
    context?: string
    importance?: 'low' | 'medium' | 'high'
    relatedGoals?: string[]
    tags?: string[]
  }
  createdAt: string
  expiresAt: string // 7 days from creation
}

export interface THGTEntry {
  id: string
  type: 'reasoning' | 'analysis' | 'hypothesis' | 'reflection' | 'planning'
  content: string
  metadata?: {
    reasoningLevel?: 'low' | 'medium' | 'high'
    confidence?: number // 0-100
    relatedThoughts?: string[]
    context?: string
  }
  createdAt: string
  expiresAt: string // Expires at next sleep cycle
}

export interface ParticipantEntry {
  id: string
  type: 'human_operator' | 'other_agent' | 'external_system' | 'collaborator'
  name: string
  role: string
  contactInfo?: {
    discord?: string
    email?: string
    phone?: string
    other?: string
  }
  permissions: {
    canRead?: boolean
    canWrite?: boolean
    canExecute?: boolean
    canAdmin?: boolean
  }
  schedule?: {
    availableHours?: string
    timezone?: string
    preferredContact?: string
  }
  metadata?: {
    expertise?: string[]
    reliability?: number // 0-100
    responseTime?: string
    notes?: string
  }
  createdAt: string
  lastInteraction: string
}

export interface MemorySystem {
  pmem: PMEMEntry[]
  note: NOTEEntry[]
  thgt: THGTEntry[]
  participants: ParticipantEntry[]
}

// Memory layer configuration
export const MEMORY_CONFIG = {
  pmem: {
    name: 'Permanent Memory',
    description: 'Static, user-updated memory that goes to System Prompt',
    color: 'yellow',
    required: true,
    expiration: 0, // Never expires
    fields: ['goals', 'permanent_knowledge', 'static_attributes', 'tools', 'codes']
  },
  note: {
    name: 'Notes',
    description: '7-day persistent memory that goes to System Prompt',
    color: 'light-blue',
    required: false,
    expiration: 604800, // 7 days
    fields: ['observation', 'learning', 'insight', 'reminder', 'reference']
  },
  thgt: {
    name: 'Thoughts',
    description: 'Memory that expires at sleep, goes to System Prompt',
    color: 'light-blue',
    required: false,
    expiration: 259200, // 3 days
    fields: ['reasoning', 'analysis', 'hypothesis', 'reflection', 'planning']
  },
  participants: {
    name: 'Participants',
    description: 'External entities interacting with the system',
    color: 'orange-pink',
    required: true,
    expiration: 0, // Never expires
    fields: ['human_operator', 'other_agent', 'external_system', 'collaborator']
  }
}

// Validation schemas
export const PMEM_SCHEMA = {
  goals: {
    required: true,
    maxLength: 1000,
    description: 'Primary objectives and desired outcomes'
  },
  permanent_knowledge: {
    required: false,
    maxLength: 2000,
    description: 'Core facts, skills, and knowledge that never change'
  },
  static_attributes: {
    required: false,
    maxLength: 1000,
    description: 'Fixed characteristics, preferences, and settings'
  },
  tools: {
    required: false,
    maxLength: 1000,
    description: 'Available capabilities and functions'
  },
  codes: {
    required: false,
    maxLength: 1000,
    description: 'Access codes, API keys, and credentials'
  }
}

export const PARTICIPANT_SCHEMA = {
  human_operator: {
    required: false,
    description: 'Human users who can interact with the agent'
  },
  other_agent: {
    required: false,
    description: 'Other AI agents in the system'
  },
  external_system: {
    required: false,
    description: 'Third-party services and APIs'
  },
  collaborator: {
    required: false,
    description: 'Team members and partners'
  }
}
