# SpawnKit App: Agent Management Platform 📱🤖

## 🚀 Recent Updates
- **2024-12-19**: Initial skapp setup and comprehensive feature planning
  - **📋 App Legend Creation**: Detailed feature specifications with testing requirements
  - **🏗️ Next.js 15 Setup**: App router with Cloudflare Pages configuration
  - **🎯 API Planning**: Comprehensive endpoint design for agent management
  - **🧪 Testing Framework**: Documented test scenarios for all features
  - **🔧 Build Validation**: Integrated npm run build validation workflow

## 🌟 Project Overview
The SpawnKit App (skapp) is the main Next.js application that provides:
- **Agent Management**: CRUD operations for persistent AI agents
- **Memory System**: 4-layer memory management (PMEM/NOTE/THGT/WORK)
- **Chat Interface**: Direct communication with agents via AI models
- **Dashboard**: Real-time monitoring and agent status visualization
- **Orchestration API**: Endpoint for cron worker to trigger agent cycles

## 🏗️ Technology Stack
- **Framework**: Next.js 15 with App Router
- **Runtime**: Cloudflare Pages with edge runtime
- **Styling**: Tailwind CSS (planned)
- **AI Integration**: Groq API for agent generation
- **Storage**: Cloudflare KV for agent data and memory
- **Environment**: Wrangler.jsonc configuration
- **Validation**: Zod schemas for input validation

## 📁 Project Structure
```
skapp/
├── app/                    # Next.js App Router
│   ├── api/               # API routes (edge runtime)
│   │   ├── agents/        # Agent CRUD operations
│   │   ├── memory/        # Memory layer management
│   │   ├── chat/          # AI chat interface
│   │   └── orchestrate/   # Cron worker endpoint
│   ├── dashboard/         # Agent monitoring UI
│   ├── agents/           # Agent management pages
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page
├── components/           # Reusable React components
├── lib/                  # Utilities and configurations
├── app-legend.md         # This file
├── wrangler.jsonc        # Cloudflare Pages config
└── package.json
```

## 🎯 Features

### 🤖 Agent Management - Readiness Status
**Development**: Not Started | **Manual Testing**: Not Tested | **Automated Testing**: Not Implemented | **Deployment Ready**: No

**Description**: Core agent CRUD operations and lifecycle management with KV storage

### Test Scenarios:
1. **Happy Path**: Create agent → Validate data → Store in KV → Retrieve agent → Update agent → Delete agent
2. **Edge Cases**: Duplicate agent IDs, invalid inputs, concurrent operations, large agent data
3. **Error Handling**: Network failures, validation errors, KV storage issues, malformed data

### Manual Testing:
- [ ] Create agent with valid data via API
- [ ] Retrieve agent and verify all fields
- [ ] Update agent attributes and confirm changes
- [ ] Delete agent and verify removal
- [ ] Test with invalid/missing required fields
- Status: Not Tested

### Automated Testing:
- **Script**: `npm test -- agents.test.ts`
- **Coverage**: CRUD operations, validation, error handling
- Status: Not Implemented

---

### 💬 Chat Interface - Readiness Status  
**Development**: Not Started | **Manual Testing**: Not Tested | **Automated Testing**: Not Implemented | **Deployment Ready**: No

**Description**: Direct communication with agents using Groq API with memory context

### Test Scenarios:
1. **Happy Path**: Send message → Build agent context → Call Groq API → Update memory → Return response
2. **Edge Cases**: Long conversations, rapid messages, streaming responses, context limits
3. **Error Handling**: Groq API failures, timeout errors, rate limits, malformed responses

### Manual Testing:
- [ ] Send message to agent and receive response
- [ ] Verify memory context is included in API call
- [ ] Test conversation continuity across multiple messages
- [ ] Handle API errors gracefully with user feedback
- Status: Not Tested

### Automated Testing:
- **Script**: `npm test -- chat.test.ts`
- **Coverage**: Message handling, API integration, memory updates
- Status: Not Implemented

---

### 🧠 Memory System - Readiness Status
**Development**: Not Started | **Manual Testing**: Not Tested | **Automated Testing**: Not Implemented | **Deployment Ready**: No

**Description**: 4-layer memory (PMEM/NOTE/THGT/WORK) with automatic expiration and KV storage

### Test Scenarios:
1. **Happy Path**: Store memory → Retrieve by layer → Update existing → Expire on TTL
2. **Edge Cases**: Memory conflicts, rapid operations, storage limits, concurrent access
3. **Error Handling**: Storage failures, corruption, expiration errors, invalid data

### Manual Testing:
- [ ] Create memory entries in each layer (PMEM/NOTE/THGT/WORK)
- [ ] Verify TTL expiration works correctly
- [ ] Test memory retrieval and filtering by layer
- [ ] Handle memory size limits and cleanup
- Status: Not Tested

### Automated Testing:
- **Script**: `npm test -- memory.test.ts`
- **Coverage**: Layer operations, TTL handling, storage limits
- Status: Not Implemented

---

### 🎭 Orchestration API - Readiness Status
**Development**: Not Started | **Manual Testing**: Not Tested | **Automated Testing**: Not Implemented | **Deployment Ready**: No

**Description**: Endpoint for skcron worker to trigger agent cycles with mode determination

### Test Scenarios:
1. **Happy Path**: Receive cron call → List agents → Determine modes → Process active agents → Return status
2. **Edge Cases**: No agents, all agents skipped, partial failures, large agent counts
3. **Error Handling**: KV failures, AI API errors, timeout handling, invalid payloads

### Manual Testing:
- [ ] Call orchestration API with EST time
- [ ] Verify correct mode determination for each agent
- [ ] Test with various times (awake/sleep/deep_sleep/wakeup)
- [ ] Handle partial failures gracefully
- Status: Not Tested

### Automated Testing:
- **Script**: `npm test -- orchestration.test.ts`
- **Coverage**: Mode logic, agent processing, error handling
- Status: Not Implemented

---

### 📊 Dashboard - Readiness Status
**Development**: Not Started | **Manual Testing**: Not Tested | **Automated Testing**: Not Implemented | **Deployment Ready**: No

**Description**: Real-time agent monitoring with status visualization and memory insights

### Test Scenarios:
1. **Happy Path**: Load dashboard → Display agents → Show status → Real-time updates
2. **Edge Cases**: Many agents, slow loading, network issues, missing data
3. **Error Handling**: API failures, rendering errors, data inconsistencies

### Manual Testing:
- [ ] Dashboard loads and displays all agents
- [ ] Agent status updates in real-time
- [ ] Memory usage and layer information visible
- [ ] Interactive elements work correctly
- Status: Not Tested

### Automated Testing:
- **Script**: `npm test -- dashboard.test.ts`
- **Coverage**: Component rendering, data fetching, user interactions
- Status: Not Implemented

## 🔗 API Endpoints

### Core Agent Management
- `GET /api/agents` - List all agents with pagination
- `POST /api/agents` - Create new agent with validation
- `GET /api/agents/[id]` - Get agent details and status
- `PUT /api/agents/[id]` - Update agent attributes
- `DELETE /api/agents/[id]` - Delete agent and cleanup memory

### Memory Management
- `GET /api/agents/[id]/memory` - Get all memory layers
- `GET /api/agents/[id]/memory/[layer]` - Get specific layer (pmem/note/thgt/work)
- `POST /api/agents/[id]/memory/[layer]` - Add memory entry
- `DELETE /api/agents/[id]/memory/[layer]/[entryId]` - Remove memory entry

### AI Integration
- `POST /api/chat` - Chat with agent (includes memory context)
- `POST /api/orchestrate` - Cron worker endpoint for agent cycles
- `GET /api/health` - Service health check

### Dashboard Data
- `GET /api/dashboard/stats` - Agent statistics and system status
- `GET /api/dashboard/activity` - Recent agent activity feed

## 🛠️ Environment Configuration

### Wrangler.jsonc
```json
{
  "name": "spawnkit-app",
  "compatibility_date": "2025-01-15",
  "compatibility_flags": ["nodejs_compat"],
  "pages_build_output_dir": ".vercel/output/static",
  "kv_namespaces": [
    {
      "binding": "AGENT_KV",
      "id": "agent-data-namespace-id",
      "preview_id": "agent-preview-id"
    }
  ],
  "vars": {
    "GROQ_API_KEY": "your-groq-api-key",
    "GROQ_MODEL": "mixtral-8x7b-32768",
    "ENVIRONMENT": "production"
  }
}
```

### Key Environment Variables
- `GROQ_API_KEY`: Required for AI generation
- `GROQ_MODEL`: AI model selection (default: mixtral-8x7b-32768)
- `AGENT_KV`: Cloudflare KV binding for agent storage

## 🧪 Testing Commands
```bash
npm run build              # Build validation (MANDATORY after changes)
npm test                   # Unit tests (when implemented)
npm run test:api           # API endpoint tests
npm run test:e2e           # End-to-end tests
npm run dev                # Development server
npm run deploy             # Deploy to Cloudflare Pages
```

## 🎯 Go Live Checklist

### Essential Features for MVP:
- [ ] Basic API routes with Groq integration
- [ ] Agent CRUD operations with KV storage
- [ ] Simple chat interface
- [ ] Memory storage system (4 layers)
- [ ] Dashboard UI with agent list
- [ ] Orchestration endpoint for cron worker
- [ ] Build validation passing
- [ ] Basic error handling implemented

### Current Status: Not implemented - Ready for development

### Next Steps:
1. Set up basic Next.js API routes with edge runtime
2. Implement agent CRUD operations with KV storage
3. Create memory management system
4. Build chat interface with Groq integration
5. Develop dashboard UI
6. Test orchestration endpoint with skcron

---

**🎯 Summary**: Comprehensive feature planning complete. Ready for systematic development of agent management platform with full testing coverage and build validation.
