# SpawnKit: Persistent AI Agents Platform 🧠✨

## 🚀 Recent Updates
- **2024-12-19**: Groq GPT-OSS 120B API Integration and Testing Framework Implementation
  - **🤖 Groq Integration**: Implemented full Groq API integration with GPT-OSS 120B model
  - **⚡ API Routes**: Created /api/ai/chat (basic) and /api/ai/stream (streaming) endpoints
  - **🧪 Testing Framework**: Built comprehensive environment-aware test scripts (prod/preview/local)
  - **🔧 Environment Config**: Updated wrangler.jsonc with proper Groq model configuration
  - **📝 Development Workflow**: Established clear testing procedures and deployment endpoints
  - **✅ Build Validation**: All implementations pass npm run build successfully

## 🌟 Project Overview
SpawnKit is a revolutionary platform for creating persistent AI agents that think, learn, and evolve autonomously. Unlike traditional chatbots, SpawnKit agents have:
- **30-minute cognitive cycles** that trigger automatically via Cloudflare Workers
- **4-layer memory system** (PMEM/NOTE/THGT/WORK) for true persistence
- **Autonomous tool usage** (Discord, web search, human operator)
- **Real-time dashboard** for agent management and monitoring
- **EST timezone-based scheduling** ensuring consistent agent consciousness
- **GPT-OSS 120B integration** via Groq API for advanced reasoning capabilities

## 🏗️ Technology Stack
- **Frontend**: Next.js 15 with App Router on Cloudflare Pages
- **Backend**: Next.js API routes with edge runtime
- **AI Model**: GPT-OSS 120B via Groq API (128K context, reasoning modes)
- **Cron Service**: Cloudflare Worker (skcron) triggering every 30 minutes
- **Storage**: Cloudflare KV for agent data and memory layers
- **Deployment**: Cloudflare Pages (skapp) + Cloudflare Workers (skcron)
- **Environment**: Wrangler.jsonc configuration (NO .env files)
- **Validation**: Zod schemas for input validation

## 📁 Project Structure
```
openai-hackathon/                 # ROOT - All Cursor Composer requests happen here, just the parent folder only may have a different name, ie 'spawnkit' or 'openai' or something
├── .cursor/                     # Cursor configuration and rules
│   └── rules/                   # Development rules and guidelines
├── skapp/                       # Main Next.js application (THIS PROJECT)
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes (edge runtime)
│   │   │   ├── ai/           # Groq AI integration
│   │   │   │   ├── chat/     # Basic chat completion
│   │   │   │   └── stream/   # Streaming chat completion
│   │   │   ├── agents/       # Agent CRUD operations (planned)
│   │   │   └── orchestrate/  # Cron worker endpoint (planned)
│   │   ├── dashboard/        # Agent monitoring UI (planned)
│   │   ├── layout.tsx        # Root layout
│   │   └── page.tsx          # Home page
│   ├── lib/                   # Utilities and configurations
│   │   ├── groq.ts           # Groq client setup and configuration
│   │   └── types.ts          # TypeScript interfaces
│   ├── tests/                 # Environment-aware test scripts
│   │   ├── test-chat.js      # Chat API endpoint tests
│   │   └── test-stream.js    # Streaming API endpoint tests
│   ├── app-legend.md         # This file - comprehensive documentation
│   ├── wrangler.jsonc        # Cloudflare Pages config with environment variables
│   └── env.d.ts              # TypeScript environment types
└── skcron/                    # Cloudflare Worker for 30-min triggers
    └── .cursor/rules/app-legend.mdc  # Cron worker documentation
```

## 🎯 High-Level Architecture

### 🤖 Agent Management System (This Project - skapp)
**Overall Status**: AI Integration Complete, Management Features Planned
- **Frontend**: Agent dashboard UI, chat interface, memory visualization (planned)
- **Backend**: Groq AI integration complete, CRUD operations planned
- **Storage**: Cloudflare KV for agent data and 4-layer memory system (planned)
- **AI Integration**: ✅ GPT-OSS 120B via Groq API with streaming support

### ⚡ Scheduling System (skcron project)
**Overall Status**: Complete and Operational
- **30-min Cycles**: EST timezone-based scheduling implemented
- **Mode System**: Wakeup (4:30), Awake (5:00-1:50), Sleep (2:00), Deep Sleep (3:00)
- **API Delegation**: Clean separation - calls skapp/api/orchestrate endpoint
- **Pure Scheduler**: No agent processing, only timing and delegation

## 🎯 Features

### 🤖 Groq AI Integration - Readiness Status
**Development**: ✅ Complete | **Manual Testing**: ✅ Ready | **Automated Testing**: ✅ Implemented | **Deployment Ready**: ✅ Yes

**Description**: Complete GPT-OSS 120B integration via Groq API with both basic and streaming chat endpoints

### Test Scenarios:
1. **Happy Path**: Send messages → Groq API call → Receive response → Return formatted data
2. **Edge Cases**: Long conversations, different reasoning levels, streaming vs non-streaming
3. **Error Handling**: API failures, rate limits, validation errors, malformed responses

### Manual Testing:
- ✅ Basic chat completion with GPT-OSS 120B
- ✅ Streaming chat with chunk counting and full response assembly
- ✅ Different reasoning effort levels (low/medium/high)
- ✅ Input validation and error handling
- ✅ Environment-aware testing (prod/preview/local)
- Status: ✅ Ready for testing

### Automated Testing:
- **Scripts**: `node tests/test-chat.js --env=prod|preview|local`
- **Scripts**: `node tests/test-stream.js --env=prod|preview|local`
- **Coverage**: API endpoints, validation, error handling, streaming
- Status: ✅ Implemented and ready

---

### 💬 Chat Interface - Readiness Status  
**Development**: Not Started | **Manual Testing**: Not Tested | **Automated Testing**: Not Implemented | **Deployment Ready**: No

**Description**: Frontend chat interface for direct agent communication (API backend ready)

### Test Scenarios:
1. **Happy Path**: UI sends message → API call → Display response → Update conversation
2. **Edge Cases**: Long conversations, rapid messages, streaming display, mobile responsiveness
3. **Error Handling**: API failures, network issues, graceful error display

### Manual Testing:
- [ ] Chat interface loads and displays correctly
- [ ] Messages send and receive properly
- [ ] Streaming responses display in real-time
- [ ] Error states handled gracefully
- Status: Not Tested (API ready, UI not implemented)

### Automated Testing:
- **Script**: `npm test -- chat-ui.test.ts` (planned)
- **Coverage**: UI interactions, API integration, error handling
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

### ✅ AI Integration (Implemented)
- `POST /api/ai/chat` - Basic chat completion with GPT-OSS 120B
- `POST /api/ai/stream` - Streaming chat completion with real-time response

### 🔄 Planned Endpoints
- `GET /api/agents` - List all agents with pagination
- `POST /api/agents` - Create new agent with validation
- `GET /api/agents/[id]` - Get agent details and status
- `PUT /api/agents/[id]` - Update agent attributes
- `DELETE /api/agents/[id]` - Delete agent and cleanup memory
- `GET /api/agents/[id]/memory` - Get all memory layers
- `POST /api/agents/[id]/memory/[layer]` - Add memory entry
- `POST /api/orchestrate` - Cron worker endpoint for agent cycles
- `GET /api/health` - Service health check

## 🛠️ Environment Configuration

### Wrangler.jsonc (NEVER use .env files)
```json
{
  "name": "skapp",
  "compatibility_date": "2025-08-21",
  "compatibility_flags": ["nodejs_compat"],
  "vars": { 
    "GROQ_API_KEY": "gsk_...",
    "GROQ_MODEL": "openai/gpt-oss-120b",
    "ENVIRONMENT": "production"
  },
  "pages_build_output_dir": ".vercel/output/static"
}
```

### Key Environment Variables (via wrangler.jsonc vars)
- `GROQ_API_KEY`: ✅ Required for AI generation (configured)
- `GROQ_MODEL`: ✅ AI model selection (openai/gpt-oss-120b)
- `ENVIRONMENT`: ✅ Deployment environment identifier

## 🧪 Testing Framework

### Environment-Aware Testing
**CRITICAL**: Testing supports three environments with specific endpoints:

- **Production**: `https://skapp.pages.dev` (default)
- **Preview**: `https://preview.skapp.pages.dev` 
- **Local**: `http://localhost:3000` (ONLY when developer explicitly mentions server is running)

### Test Commands
```bash
# Groq Chat API Tests
node tests/test-chat.js                    # Test production (default)
node tests/test-chat.js --env=prod         # Test production explicitly
node tests/test-chat.js --env=preview      # Test preview deployment
node tests/test-chat.js --env=local        # Test localhost (only if running)

# Groq Streaming API Tests  
node tests/test-stream.js                  # Test production (default)
node tests/test-stream.js --env=preview    # Test preview deployment
node tests/test-stream.js --env=local      # Test localhost (only if running)

# Build Validation (MANDATORY after changes)
npm run build                              # Must pass before deployment
```

### Testing Rules for Cursor Composer
1. **Default Environment**: Always test production unless specified
2. **Preview Testing**: Use `--env=preview` when user mentions preview deployment
3. **Local Testing**: ONLY use `--env=local` when user explicitly states localhost:3000 is running
4. **Never Assume**: Never assume localhost:3000 is available unless explicitly told

## 🚨 Critical Development Information

### Cursor Composer Workflow
**IMPORTANT**: All Cursor Composer requests execute in the ROOT directory (`openai-hackathon/` or `spawnkit` or similar):

```
openai-hackathon/                 # ← Cursor Composer runs here, only the parent folder might have a different name, 'spawnkit' or 'openai' etc.
├── .cursor/rules/               # Development rules
├── skapp/                       # ← All file operations go here
│   ├── app-legend.md           # ← This file
│   └── [all other files]
└── skcron/                      # ← Rarely modified
```

### File Operation Rules
- ✅ **ALWAYS** write files to `skapp/` directory
- ❌ **NEVER** write files to root directory  
- 🔍 **ALWAYS** run `pwd` or `ls -la` if unsure of current path
- 📝 **ALWAYS** use relative paths like `skapp/filename` when in root

### Critical Success Factors
- **EST Timezone Accuracy**: All agent schedules depend on precise EST calculations (handled by skcron)
- **Build Validation**: Every code change must pass `npm run build` (✅ currently passing)
- **Environment Variables**: ONLY use wrangler.jsonc and env.d.ts (NEVER .env files)
- **API Reliability**: Groq integration tested and operational
- **Testing Coverage**: Environment-aware test scripts implemented and ready

## 🎯 Go Live Readiness
**Current Status**: AI Foundation Complete
- ✅ Project structure established
- ✅ Cron worker architecture complete (skcron project)
- ✅ Next.js app setup complete with Groq integration
- ✅ Groq GPT-OSS 120B API integration operational
- ✅ Streaming and basic chat endpoints implemented
- ✅ Comprehensive testing framework ready
- ✅ Build validation passing
- ❌ Agent management features not started
- ❌ Memory system not implemented
- ❌ Dashboard UI not created

**MVP Requirements Progress**:
- ✅ Basic API routes with Groq integration
- ❌ Agent CRUD operations with KV storage
- ❌ Simple chat interface (API ready, UI needed)
- ❌ Memory storage system (4 layers)
- ❌ Dashboard UI with agent list
- ❌ Orchestration endpoint for cron worker
- ✅ Build validation passing
- ✅ Basic error handling implemented

### Next Steps:
1. ✅ ~~Set up basic Next.js API routes with edge runtime~~ 
2. ✅ ~~Implement Groq GPT-OSS integration~~
3. ✅ ~~Create comprehensive testing framework~~
4. 🔄 Implement agent CRUD operations with KV storage
5. 🔄 Create memory management system
6. 🔄 Build chat interface with Groq integration
7. 🔄 Develop dashboard UI
8. 🔄 Test orchestration endpoint with skcron

---

**🎯 Summary**: SpawnKit AI foundation is complete with operational Groq GPT-OSS 120B integration, comprehensive testing framework, and clear development workflow. Ready for agent management system implementation while maintaining the proven cron scheduling system.
