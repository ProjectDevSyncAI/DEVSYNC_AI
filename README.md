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