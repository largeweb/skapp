# SpawnKit: Persistent AI Agents Platform 🧠✨

## 🚀 Recent Updates
- **2024-12-19**: Consolidated app legend structure and comprehensive feature planning
  - **📋 Single Source Documentation**: Consolidated all project documentation into single app-legend.md
  - **🤖 Agent Orchestration**: Established 30-minute cron cycle with EST timezone handling
  - **🏗️ Architecture Design**: Defined clean separation between skapp (management) and skcron (scheduling)
  - **🎯 API Planning**: Comprehensive endpoint design for agent management
  - **🧪 Testing Framework**: Documented test scenarios for all features
  - **🔧 Build Validation**: Integrated npm run build validation workflow

## 🌟 Project Overview
SpawnKit is a revolutionary platform for creating persistent AI agents that think, learn, and evolve autonomously. Unlike traditional chatbots, SpawnKit agents have:
- **30-minute cognitive cycles** that trigger automatically via Cloudflare Workers
- **4-layer memory system** (PMEM/NOTE/THGT/WORK) for true persistence
- **Autonomous tool usage** (Discord, web search, human operator)
- **Real-time dashboard** for agent management and monitoring
- **EST timezone-based scheduling** ensuring consistent agent consciousness

## 🏗️ Technology Stack
- **Frontend**: Next.js 15 with App Router on Cloudflare Pages
- **Backend**: Next.js API routes with edge runtime
- **AI Model**: Groq API integration (flexible model selection)
- **Cron Service**: Cloudflare Worker (skcron) triggering every 30 minutes
- **Storage**: Cloudflare KV for agent data and memory layers
- **Deployment**: Cloudflare Pages (skapp) + Cloudflare Workers (skcron)
- **Environment**: Wrangler.jsonc configuration (no .env files)
- **Validation**: Zod schemas for input validation

## 📁 Project Structure
```
openai-hackathon/
├── skapp/                  # Main Next.js application (THIS PROJECT)
│   ├── app/               # Next.js App Router
│   │   ├── api/          # API routes (edge runtime)
│   │   │   ├── agents/   # Agent CRUD operations
│   │   │   ├── memory/   # Memory layer management
│   │   │   ├── chat/     # AI chat interface
│   │   │   └── orchestrate/ # Cron worker endpoint
│   │   ├── dashboard/    # Agent monitoring UI
│   │   ├── agents/      # Agent management pages
│   │   ├── layout.tsx   # Root layout
│   │   └── page.tsx     # Home page
│   ├── components/      # Reusable React components
│   ├── lib/             # Utilities and configurations
│   ├── app-legend.md    # This file - comprehensive documentation
│   ├── wrangler.jsonc   # Cloudflare Pages config
│   └── package.json
└── skcron/              # Cloudflare Worker for 30-min triggers
    ├── src/index.ts     # Pure scheduler - delegates to skapp/api/orchestrate
    ├── wrangler.jsonc   # Worker configuration with KV bindings
    └── .cursor/rules/app-legend.mdc  # Cron worker documentation
```

## 🎯 High-Level Architecture

### 🤖 Agent Management System (This Project - skapp)
**Overall Status**: Planning Phase
- **Frontend**: Agent dashboard UI, chat interface, memory visualization
- **Backend**: API routes for CRUD operations, memory management, AI integration
- **Storage**: Cloudflare KV for agent data and 4-layer memory system
- **Integration**: Orchestration endpoint for cron worker communication

### ⚡ Scheduling System (skcron project)
**Overall Status**: Complete and Operational
- **30-min Cycles**: EST timezone-based scheduling implemented
- **Mode System**: Wakeup (4:30), Awake (5:00-1:50), Sleep (2:00), Deep Sleep (3:00)
- **API Delegation**: Clean separation - calls skapp/api/orchestrate endpoint
- **Pure Scheduler**: No agent processing, only timing and delegation

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

## 🚨 Critical Success Factors
- **EST Timezone Accuracy**: All agent schedules depend on precise EST calculations (handled by skcron)
- **Build Validation**: Every code change must pass npm run build
- **Memory Consistency**: Agent consciousness requires reliable memory persistence
- **API Reliability**: Cron → skapp orchestration must be bulletproof
- **Testing Coverage**: All features need documented test scenarios

## 🎯 Go Live Readiness
**Current Status**: Foundation Phase
- ✅ Project structure established
- ✅ Cron worker architecture complete (skcron project)
- 🔄 Next.js app setup complete
- ❌ Agent management features not started
- ❌ Memory system not implemented
- ❌ Dashboard UI not created

**MVP Requirements**:
- Basic agent CRUD operations with KV storage
- Memory layer management (4 layers)
- Chat interface with Groq AI integration
- Cron orchestration working end-to-end
- Simple dashboard for monitoring

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

**🎯 Summary**: SpawnKit foundation is established with clean architecture separation. The skcron scheduling system is operational, and skapp is ready for systematic development of agent management features with full testing coverage and build validation.
