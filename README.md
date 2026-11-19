<<<<<<< HEAD
# DevSync AI — Autonomous AI Collaborative Developer Platform

<p align="center">
  <strong>The Unified Engineering Workspace: GitHub + Slack + Jira + RAG Intelligence</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-22.x-green.svg" alt="Node.js" />
  <img src="https://img.shields.io/badge/React-19.x-blue.svg" alt="React" />
  <img src="https://img.shields.io/badge/NestJS-11.x-red.svg" alt="NestJS" />
  <img src="https://img.shields.io/badge/Prisma-7.x-indigo.svg" alt="Prisma" />
  <img src="https://img.shields.io/badge/PostgreSQL-17%20%2B%20pgvector-blue.svg" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Redis-8.x-orange.svg" alt="Redis" />
  <img src="https://img.shields.io/badge/Tailwind-CSS%204.x-cyan.svg" alt="Tailwind" />
</p>

---

## 🌟 Overview

**DevSync AI** is a collaborative developer platform designed to eliminate context switching by combining repository workflows, team messaging, and agile sprint planning into a single intelligent workspace supercharged with an autonomous AI and RAG engine.

### Core Capabilities:
- 🐙 **GitHub Sync**: Ingests commits, pull requests, and native webhook events (`push`, `pull_request`, `issues`).
- 💬 **Slack-Style Real-Time Chat**: WebSocket channels (`#general`, `#engineering`, `#ai-intelligence`) with direct messaging and in-chat `@devsync` streaming AI assistant.
- 📋 **Jira-Style Agile Kanban**: Interactive HTML5 drag-and-drop 4-stage Kanban board (`To Do`, `In Progress`, `In Review`, `Done`) with real-time database position persistence.
- 🧠 **pgvector RAG & Token Streaming**: 1536-dimensional vector similarity search with deterministic fallbacks, token-by-token Server-Sent Events (SSE) responses.
- ⚡ **Autonomous Engineering Intelligence**:
  - **AI Daily Standups**: Auto-summarizes yesterday's accomplishments, today's focus, and active blockers.
  - **AI Sprint Planner**: Automatically plans and balances sprint iterations, task ordering, and risk alerts.
  - **AI Bug Analyzer**: Diagnoses defect descriptions to hypothesize root causes and suggest immediate fixes.
  - **AI Risk Engine**: Dynamically calculates delivery risk scores from open bugs and sprint deadlines.

---

## 🏛 Architecture

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                     DevSync AI Frontend (React 19)                      │
│   Kanban Board │ Realtime Chat │ AI Insights │ Standups │ Bug Tracking  │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ HTTP / SSE / WebSockets
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       DevSync API Gateway (NestJS)                      │
│   Auth Module  │ AI / RAG Module │ Chat Gateway │ Tasks │ Webhooks      │
└────────────┬───────────────────────┬──────────────────────┬─────────────┘
             │                       │                      │
             ▼                       ▼                      ▼
┌─────────────────────────┐ ┌──────────────────┐ ┌────────────────────────┐
│  PostgreSQL + pgvector  │ │   Redis Server   │ │   Background Worker    │
│  Prisma 7 Relational DB │ │ BullMQ Queues    │ │ Chunking & Embeddings  │
│  1536-dim Vector Store  │ │ WebSocket Pub/Sub│ │ AI Automated Analysis  │
└─────────────────────────┘ └──────────────────┘ └────────────────────────┘
```

---

## 📂 Repository Structure

```text
DEVSYNC_AI/
├── apps/
│   ├── api/                    # NestJS REST & WebSocket API Gateway
│   │   ├── src/ai/             # RAG Engine, LLM Providers, Standup & Sprint AI
│   │   ├── src/auth/           # JWT Guards, Passport strategy, password hashing
│   │   ├── src/chat/           # Socket.io Chat Gateway & room broadcasting
│   │   ├── src/github/         # GitHub webhook parsers & OAuth sync
│   │   └── src/tasks/          # Kanban tasks, status transitions, position move
│   ├── web/                    # React 19 + TypeScript + Tailwind CSS UI
│   │   ├── src/pages/          # Kanban, Chat, Standup, SprintPlanner, BugTracking
│   │   └── src/lib/api.ts      # Centralized typed HTTP and SSE client layer
│   └── worker/                 # BullMQ Background Job Processor
├── prisma/
│   ├── schema.prisma           # 1,477-line relational schema with pgvector
│   └── seed.ts                 # Full database seeder with pre-indexed vectors
├── infrastructure/
│   ├── docker/                 # api.Dockerfile, web.Dockerfile, worker.Dockerfile
│   └── nginx/                  # Production Nginx reverse proxy configuration
├── scripts/
│   ├── verify-launch.ps1       # Windows PowerShell pre-flight validation
│   └── verify-launch.sh        # Linux / macOS / CI pre-flight validation
├── docker-compose.yml          # Multi-container orchestration (PostgreSQL + Redis)
├── turbo.json                  # Turborepo task pipeline definition
└── pnpm-workspace.yaml         # Monorepo workspace package mapping
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v20.x or v22.x
- **pnpm**: v9.x or v10.x (`corepack enable pnpm`)
- **Docker & Docker Compose**: For PostgreSQL (with pgvector) and Redis

### Step 1: Clone & Install Dependencies
```bash
git clone <repository-url>
cd DEVSYNC_AI-main/DEVSYNC_AI-main
pnpm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
*(Optional: If you have an OpenAI API key, set `OPENAI_API_KEY=your_key`. If left empty, DevSync AI automatically uses its built-in deterministic 1536-dimensional vector fallback and local intelligence).*

### Step 3: Start Infrastructure (PostgreSQL + Redis)
```bash
# Start PostgreSQL (port 5440) and Redis (port 6379)
docker compose up -d
```

### Step 4: Run Migrations & Seed Sample Data
```bash
# Push Prisma schema to the database
pnpm db:migrate

# Seed demo users, organizations, sprints, tasks, and 1536-dim vector chunks
pnpm db:seed
```

### Step 5: Start All Services in Development
```bash
pnpm dev
```

- **Web Frontend**: [http://localhost:5173](http://localhost:5173)
- **NestJS API**: [http://localhost:3000](http://localhost:3000)
- **API Swagger Docs**: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
- **WebSocket Gateway**: `ws://localhost:3000/chat`

---

## 🔑 Demo User Accounts

Use any of these pre-seeded accounts to log in immediately:

| Role | Email | Password | Organization |
|---|---|---|---|
| **Lead Developer (Owner)** | `demo@devsync.ai` | `Password123!` | Acme Engineering |
| **Full-Stack Engineer** | `dev@devsync.ai` | `Password123!` | Acme Engineering |
| **Product Manager** | `marcus@devsync.ai` | `Password123!` | Acme Engineering |

---

## 🐳 Full Containerized Deployment (Production)

To launch the entire platform (PostgreSQL, Redis, API, Worker, and Web UI behind Nginx) inside Docker:

```bash
docker compose --profile full up -d --build
```
Access the complete application at: **[http://localhost](http://localhost)**

---

## 🧪 Pre-Flight Launch Verification

To verify that your installation, environment, and configuration are 100% ready for launch:

**On Windows:**
```powershell
powershell -ExecutionPolicy Bypass -File scripts/verify-launch.ps1
```

**On Linux / macOS:**
```bash
chmod +x scripts/verify-launch.sh
./scripts/verify-launch.sh
```

---

## 📄 License
This project is licensed under the MIT License.
=======
# DevSync AI

## AI Collaborative Developer Platform

DevSync AI is an AI-powered collaborative software development platform designed to unify:

- Project management
- GitHub repository activity
- Kanban task management
- Team communication
- Development analytics
- AI-powered project intelligence
- Retrieval-Augmented Generation (RAG)

---

# Architecture

```text
React + TypeScript
        │
        ▼
     NestJS API
        │
 ┌──────┼────────┐
 ▼      ▼        ▼
Prisma Redis   WebSocket
 │
 ▼
PostgreSQL
 │
 ▼
pgvector
 │
 ▼
RAG
 │
 ▼
AI Engine
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
