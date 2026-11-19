import { PrismaClient } from '../apps/api/src/generated/prisma/index.js';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Deterministic 1536-dim vector generator for seed document chunks
function generatePseudoEmbedding(seedText: string): number[] {
  const vector: number[] = new Array(1536).fill(0);
  let hash = 0;
  for (let i = 0; i < seedText.length; i++) {
    hash = (hash << 5) - hash + seedText.charCodeAt(i);
    hash |= 0;
  }
  for (let i = 0; i < 1536; i++) {
    const val = Math.sin(hash + i) * 0.1;
    vector[i] = parseFloat(val.toFixed(6));
  }
  // Normalize vector
  const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0)) || 1;
  return vector.map((v) => parseFloat((v / norm).toFixed(6)));
}

async function main() {
  console.log('🌱 Starting DevSync AI database seed...');

  // 1. Clean existing records in correct foreign-key dependency order
  await prisma.aIMessageCitation.deleteMany({});
  await prisma.aIMessage.deleteMany({});
  await prisma.aIConversation.deleteMany({});
  await prisma.aIInsight.deleteMany({});
  await prisma.documentChunk.deleteMany({});
  await prisma.document.deleteMany({});
  await prisma.chatMessage.deleteMany({});
  await prisma.chatChannelMember.deleteMany({});
  await prisma.chatChannel.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.issue.deleteMany({});
  await prisma.sprint.deleteMany({});
  await prisma.projectMember.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.organizationMember.deleteMany({});
  await prisma.organization.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('🧹 Cleaned existing database records.');

  // 2. Hash passwords
  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 3. Create Users
  const userAlex = await prisma.user.create({
    data: {
      email: 'demo@devsync.ai',
      username: 'alexchen',
      passwordHash,
      firstName: 'Alex',
      lastName: 'Chen',
      status: 'ACTIVE',
      platformRole: 'USER',
      tokenVersion: 1,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    },
  });

  const userSarah = await prisma.user.create({
    data: {
      email: 'dev@devsync.ai',
      username: 'sarahconnor',
      passwordHash,
      firstName: 'Sarah',
      lastName: 'Connor',
      status: 'ACTIVE',
      platformRole: 'USER',
      tokenVersion: 1,
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    },
  });

  const userMarcus = await prisma.user.create({
    data: {
      email: 'marcus@devsync.ai',
      username: 'marcusv',
      passwordHash,
      firstName: 'Marcus',
      lastName: 'Vance',
      status: 'ACTIVE',
      platformRole: 'USER',
      tokenVersion: 1,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    },
  });

  console.log('👤 Created users: Alex Chen, Sarah Connor, Marcus Vance');

  // 4. Create Organization
  const org = await prisma.organization.create({
    data: {
      name: 'Acme Engineering',
      slug: 'acme-engineering',
      description: 'Unified engineering org leveraging DevSync AI for code, tasks, and discussions.',
      ownerId: userAlex.id,
      members: {
        create: [
          { userId: userAlex.id, role: 'OWNER' },
          { userId: userSarah.id, role: 'ENGINEER' },
          { userId: userMarcus.id, role: 'ADMIN' },
        ],
      },
    },
  });

  console.log('🏢 Created organization: Acme Engineering');

  // 5. Create Project
  const project = await prisma.project.create({
    data: {
      name: 'DevSync AI Platform',
      key: 'DEV',
      description: 'Unified AI-powered developer collaboration platform integrating GitHub, Slack, and Jira.',
      status: 'ACTIVE',
      organizationId: org.id,
      createdById: userAlex.id,
      startDate: new Date(),
      targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      members: {
        create: [
          { userId: userAlex.id },
          { userId: userSarah.id },
          { userId: userMarcus.id },
        ],
      },
    },
  });

  console.log('🚀 Created project: DevSync AI Platform (DEV)');

  // 6. Create Sprints
  const sprint1 = await prisma.sprint.create({
    data: {
      projectId: project.id,
      name: 'Sprint 1 - Foundation & Authentication',
      goal: 'Deliver JWT authentication, organization tenancy, and basic database persistence.',
      status: 'COMPLETED',
      startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  const sprint2 = await prisma.sprint.create({
    data: {
      projectId: project.id,
      name: 'Sprint 2 - RAG Engine & Realtime Kanban',
      goal: 'Complete vector search retrieval, realtime chat gateway, and Kanban board interactions.',
      status: 'ACTIVE',
      startDate: new Date(),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  });

  // 7. Create Kanban Tasks
  const tasksData = [
    {
      title: 'Design database schema with pgvector',
      description: 'Define relational schema in Prisma with vector embeddings and multi-tenancy.',
      status: 'DONE',
      priority: 'HIGH',
      storyPoints: 5,
      assigneeId: userAlex.id,
      sprintId: sprint1.id,
    },
    {
      title: 'Implement JWT authentication and guards',
      description: 'Set up NestJS passport-jwt strategy, password hashing, and login/register endpoints.',
      status: 'DONE',
      priority: 'URGENT',
      storyPoints: 8,
      assigneeId: userSarah.id,
      sprintId: sprint1.id,
    },
    {
      title: 'Implement pgvector cosine similarity search',
      description: 'Create raw SQL query using <=> distance operator for sub-second chunk retrieval.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      storyPoints: 5,
      assigneeId: userMarcus.id,
      sprintId: sprint2.id,
    },
    {
      title: 'Build interactive Kanban board UI',
      description: 'Enable drag-and-drop task movements with immediate state persistence to API.',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      storyPoints: 5,
      assigneeId: userSarah.id,
      sprintId: sprint2.id,
    },
    {
      title: 'Real-time WebSocket chat channels',
      description: 'Support channel-based messaging with Socket.io and Redis pub/sub adapter.',
      status: 'TODO',
      priority: 'HIGH',
      storyPoints: 8,
      assigneeId: userAlex.id,
      sprintId: sprint2.id,
    },
    {
      title: 'GitHub OAuth and repository synchronization',
      description: 'Connect GitHub app to sync commits, pull requests, and branch activity into DevSync.',
      status: 'TODO',
      priority: 'MEDIUM',
      storyPoints: 8,
      assigneeId: userMarcus.id,
      sprintId: sprint2.id,
    },
  ];

  for (const t of tasksData) {
    await prisma.task.create({
      data: {
        projectId: project.id,
        creatorId: userAlex.id,
        title: t.title,
        description: t.description,
        status: t.status as any,
        priority: t.priority as any,
        storyPoints: t.storyPoints,
        assigneeId: t.assigneeId,
        sprintId: t.sprintId,
      },
    });
  }

  console.log(`📋 Created ${tasksData.length} Kanban tasks across sprints.`);

  // 8. Create Issues (Bugs & Improvements)
  const issuesData = [
    {
      title: 'Authentication token expiry on WebSocket handshake',
      description: 'When JWT access token expires after 15m, websocket fails reconnect without auto-refresh.',
      status: 'OPEN',
      priority: 'HIGH',
      type: 'BUG',
      authorId: userSarah.id,
      assigneeId: userAlex.id,
    },
    {
      title: 'Kanban drag-and-drop optimistic UI update delay',
      description: 'Tasks occasionally jump back to the previous column on high-latency mobile networks.',
      status: 'OPEN',
      priority: 'MEDIUM',
      type: 'BUG',
      authorId: userMarcus.id,
      assigneeId: userSarah.id,
    },
    {
      title: 'Optimize RAG document chunk reranking',
      description: 'Integrate cross-encoder or BM25 hybrid ranking for higher precision search results.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      type: 'PERFORMANCE',
      authorId: userAlex.id,
      assigneeId: userMarcus.id,
    },
  ];

  for (const issue of issuesData) {
    await prisma.issue.create({
      data: {
        projectId: project.id,
        authorId: issue.authorId,
        assigneeId: issue.assigneeId,
        title: issue.title,
        description: issue.description,
        status: issue.status as any,
        priority: issue.priority as any,
        type: issue.type as any,
      },
    });
  }

  console.log(`🐛 Created ${issuesData.length} project issues & bugs.`);

  // 9. Create Chat Channels & Initial Messages
  const channelGeneral = await prisma.chatChannel.create({
    data: {
      projectId: project.id,
      name: 'general',
      type: 'PROJECT',
      isPrivate: false,
      members: {
        create: [
          { userId: userAlex.id },
          { userId: userSarah.id },
          { userId: userMarcus.id },
        ],
      },
    },
  });

  const channelEngineering = await prisma.chatChannel.create({
    data: {
      projectId: project.id,
      name: 'engineering',
      type: 'PROJECT',
      isPrivate: false,
      members: {
        create: [
          { userId: userAlex.id },
          { userId: userSarah.id },
          { userId: userMarcus.id },
        ],
      },
    },
  });

  await prisma.chatMessage.createMany({
    data: [
      {
        channelId: channelGeneral.id,
        senderId: userAlex.id,
        content: 'Welcome everyone to DevSync AI! Our unified platform is now live.',
      },
      {
        channelId: channelGeneral.id,
        senderId: userSarah.id,
        content: 'Awesome! I am working on the real-time Kanban board updates today.',
      },
      {
        channelId: channelEngineering.id,
        senderId: userMarcus.id,
        content: 'pgvector extension is verified on PostgreSQL 17. Similarity search is ready for testing.',
      },
      {
        channelId: channelEngineering.id,
        senderId: userAlex.id,
        content: 'Great work! Let us wire the `/ai/ask` endpoint to answer natural language questions about our codebase.',
      },
    ],
  });

  console.log('💬 Created chat channels (#general, #engineering) with initial messages.');

  // 10. Create RAG Documents and pgvector chunks
  const authDocContent = `
# DevSync AI Authentication Architecture
DevSync AI uses JSON Web Tokens (JWT) for stateless REST authentication and WebSocket handshakes.
- Access Token: Short-lived (15 minutes), signed with HS256 using JWT_ACCESS_SECRET.
- Refresh Token: Long-lived (7 days), stored securely in httpOnly cookies or local storage.
- Password Security: Passwords are encrypted using bcrypt with a salt cost factor of 12.
- Multi-tenancy Isolation: Every project and organization query enforces user membership checks in the service layer.
Recent Changes This Week:
- Added bearer token extraction from socket.io auth handshake query.
- Fixed token expiry refresh interceptor in the web frontend client.
`;

  const docAuth = await prisma.document.create({
    data: {
      projectId: project.id,
      sourceType: 'WIKI',
      title: 'Authentication & Security Specification',
      content: authDocContent,
      checksum: 'sha256-auth-v1',
      indexedAt: new Date(),
    },
  });

  const authEmbedding = generatePseudoEmbedding(authDocContent);
  const authVector = `[${authEmbedding.join(',')}]`;

  await prisma.$executeRawUnsafe(
    `
    INSERT INTO "DocumentChunk"
      (id, "documentId", "chunkIndex", content, "tokenCount", metadata, embedding)
    VALUES
      (gen_random_uuid(), $1, 0, $2, 120, $3::jsonb, $4::vector)
    `,
    docAuth.id,
    authDocContent,
    JSON.stringify({ projectId: project.id, title: docAuth.title, sourceType: 'WIKI' }),
    authVector,
  );

  const ragDocContent = `
# DevSync AI Retrieval-Augmented Generation (RAG) Architecture
The DevSync AI RAG pipeline indexes project documentation, GitHub pull requests, commits, and issues.
- Text Chunking: Recursive chunking with 500-token chunks and 50-token overlap.
- Embedding Model: OpenAI text-embedding-3-small (1536 dimensions).
- Vector Storage: PostgreSQL 17 with the pgvector extension using cosine distance (<=>).
- Retrieval: Hybrid semantic retrieval combining vector distance with metadata filtering by projectId.
- Answering Engine: OpenAI gpt-4o-mini with project context injection and source citations.
`;

  const docRag = await prisma.document.create({
    data: {
      projectId: project.id,
      sourceType: 'WIKI',
      title: 'RAG Pipeline & AI Architecture',
      content: ragDocContent,
      checksum: 'sha256-rag-v1',
      indexedAt: new Date(),
    },
  });

  const ragEmbedding = generatePseudoEmbedding(ragDocContent);
  const ragVector = `[${ragEmbedding.join(',')}]`;

  await prisma.$executeRawUnsafe(
    `
    INSERT INTO "DocumentChunk"
      (id, "documentId", "chunkIndex", content, "tokenCount", metadata, embedding)
    VALUES
      (gen_random_uuid(), $1, 0, $2, 110, $3::jsonb, $4::vector)
    `,
    docRag.id,
    ragDocContent,
    JSON.stringify({ projectId: project.id, title: docRag.title, sourceType: 'WIKI' }),
    ragVector,
  );

  console.log('🧠 Created RAG documents and pgvector chunks with 1536-dim embeddings.');

  console.log('✅ DevSync AI database seeded successfully!');
  console.log('----------------------------------------------------');
  console.log('Demo Credentials:');
  console.log('  Demo User:      demo@devsync.ai  / Password123!');
  console.log('  Developer User: dev@devsync.ai   / Password123!');
  console.log('----------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
