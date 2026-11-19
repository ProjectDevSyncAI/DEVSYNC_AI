/**
 * Phase 3 — RAG Retrieval Project Isolation Security Tests
 *
 * Verifies that:
 * [1] RetrievalService always scopes the pgvector query to the caller's projectId.
 * [2] Chunks belonging to a different project are never returned.
 * [3] RagService.search() propagates the projectId to RetrievalService unchanged.
 * [4] AIController.searchKnowledge() enforces project membership before calling RagService.
 * [5] A user with no project membership cannot reach the retrieval layer.
 * [6] Chunks without embeddings (NULL) are excluded from results.
 * [7] RerankingService never re-orders chunks beyond the requested limit, maintaining isolation.
 * [8] ContextService builds context only from the chunks it receives (no extra DB access).
 * [9] Cross-tenant: querying with a foreign projectId returns empty even if chunks exist.
 * [10] RagService.search() returns empty chunks when RetrievalService returns nothing.
 */

import test from 'node:test';
import assert from 'node:assert';
import { RetrievalService } from '../../src/ai/rag/retrieval.service.js';
import { RerankingService } from '../../src/ai/rag/reranking.service.js';
import { ContextService } from '../../src/ai/rag/context.service.js';
import { RagService } from '../../src/ai/rag/rag.service.js';
import { AIController } from '../../src/ai/ai.controller.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const PROJECT_A = 'project-alpha-uuid';
const PROJECT_B = 'project-beta-uuid';
const FOREIGN_PROJECT = 'foreign-tenant-project-uuid';

function makeChunk(id: string, projectId: string, distance: number) {
  return {
    id,
    documentId: `doc-${projectId}-1`,
    chunkIndex: 0,
    content: `Content for project ${projectId}`,
    tokenCount: 50,
    metadata: { projectId },
    distance,
  };
}

// Mock Prisma that respects the projectId WHERE clause in $queryRawUnsafe
function makeMockPrismaRetrieval(allChunks: ReturnType<typeof makeChunk>[]) {
  return {
    $queryRawUnsafe: async <T>(sql: string, _vector: string, projectId: string, _limit: number): Promise<T> => {
      // The real SQL JOINs on Document.projectId = $2 — simulate that filter here
      const filtered = allChunks.filter(
        (c) => (c.metadata as any).projectId === projectId,
      );
      return filtered as unknown as T;
    },
  } as any;
}

function makeMockEmbeddingService(embedding: number[] = Array(1536).fill(0.1)) {
  return {
    embed: async (_query: string) => embedding,
    embedMany: async (texts: string[]) => texts.map(() => embedding),
  } as any;
}

// ---------------------------------------------------------------------------
// [1] RetrievalService scopes query to projectId
// ---------------------------------------------------------------------------
test('RAG Isolation [1] - RetrievalService returns only chunks for the requested projectId', async () => {
  const chunks = [
    makeChunk('chunk-a1', PROJECT_A, 0.1),
    makeChunk('chunk-a2', PROJECT_A, 0.2),
    makeChunk('chunk-b1', PROJECT_B, 0.15),
  ];

  const prisma = makeMockPrismaRetrieval(chunks);
  const service = new RetrievalService(prisma);
  const result = await service.search(PROJECT_A, Array(1536).fill(0.1), 10);

  assert.strictEqual(result.length, 2, 'Only 2 chunks belong to PROJECT_A');
  assert.ok(result.every((c: any) => c.metadata.projectId === PROJECT_A),
    'All returned chunks must belong to PROJECT_A');
});

// ---------------------------------------------------------------------------
// [2] Cross-tenant: chunks belonging to PROJECT_B not returned for PROJECT_A query
// ---------------------------------------------------------------------------
test('RAG Isolation [2] - Chunks from a different project are never returned', async () => {
  const chunks = [
    makeChunk('chunk-b1', PROJECT_B, 0.05),
    makeChunk('chunk-b2', PROJECT_B, 0.08),
  ];

  const prisma = makeMockPrismaRetrieval(chunks);
  const service = new RetrievalService(prisma);
  const result = await service.search(PROJECT_A, Array(1536).fill(0.1), 10);

  assert.strictEqual(result.length, 0,
    'No chunks from PROJECT_B should be returned when querying PROJECT_A');
});

// ---------------------------------------------------------------------------
// [3] RagService.search() propagates projectId to RetrievalService
// ---------------------------------------------------------------------------
test('RAG Isolation [3] - RagService.search() passes projectId through to RetrievalService unchanged', async () => {
  const capturedProjectIds: string[] = [];

  const mockRetrieval = {
    search: async (projectId: string, _embedding: number[], _limit: number) => {
      capturedProjectIds.push(projectId);
      return [];
    },
  } as any;

  const ragService = new RagService(
    {} as any,                       // prisma (not used in search path)
    {} as any,                       // chunking (not used in search)
    makeMockEmbeddingService(),       // embedding
    mockRetrieval,                   // retrieval
    new RerankingService(),          // reranking
    new ContextService(),            // context
  );

  await ragService.search(PROJECT_A, 'What is auth?', 5);

  assert.strictEqual(capturedProjectIds.length, 1);
  assert.strictEqual(capturedProjectIds[0], PROJECT_A,
    'RagService must pass the original projectId to RetrievalService');
});

// ---------------------------------------------------------------------------
// [4] AIController.searchKnowledge() enforces project membership
// ---------------------------------------------------------------------------
test('RAG Isolation [4] - searchKnowledge blocks a user who is not a project member (403)', async () => {
  const prisma = {
    user: {
      findUnique: async () => ({ id: 'user-no-access', status: 'ACTIVE' }),
    },
    project: {
      findUnique: async ({ where }: any) => ({
        id: where.id,
        organizationId: 'org-other',
        organization: { id: 'org-other', ownerId: 'other-owner' },
        members: [],
      }),
    },
    projectMember: {
      findMany: async () => [],
    },
    organizationMember: {
      findUnique: async () => null,
    },
  } as any;

  const mockAiService = {
    searchKnowledge: async () => {
      throw new Error('Should never reach here');
    },
  } as any;

  const controller = new AIController(mockAiService, prisma);
  const req = { user: { userId: 'user-no-access' } };

  await assert.rejects(
    () => controller.searchKnowledge(req, FOREIGN_PROJECT, 'auth tokens', '5'),
    (err: any) => err.status === 403,
    'Non-member searchKnowledge must throw 403 Forbidden',
  );
});

// ---------------------------------------------------------------------------
// [5] AIController.searchKnowledge() allows a project member
// ---------------------------------------------------------------------------
test('RAG Isolation [5] - searchKnowledge allows a verified project member', async () => {
  const prisma = {
    user: {
      findUnique: async () => ({ id: 'user-member', status: 'ACTIVE' }),
    },
    project: {
      findUnique: async ({ where }: any) => ({
        id: where.id,
        organizationId: 'org-mine',
        organization: { id: 'org-mine', ownerId: 'user-member' },
        members: [{ id: 'pm-1' }],
      }),
    },
    projectMember: {
      findMany: async () => [{ projectId: PROJECT_A }],
    },
    organizationMember: {
      findUnique: async () => null,
    },
  } as any;

  const mockAiService = {
    searchKnowledge: async (projectId: string, _query: string, _limit: number) => ({
      query: 'auth tokens',
      chunks: [makeChunk('chunk-a1', projectId, 0.1)],
      context: 'Content for project project-alpha-uuid',
    }),
  } as any;

  const controller = new AIController(mockAiService, prisma);
  const req = { user: { userId: 'user-member' } };

  const result = await controller.searchKnowledge(req, PROJECT_A, 'auth tokens', '5');
  assert.strictEqual((result as any).chunks.length, 1);
});

// ---------------------------------------------------------------------------
// [6] NULL-embedding chunks excluded: RetrievalService mock mirrors SQL WHERE
// ---------------------------------------------------------------------------
test('RAG Isolation [6] - Chunks with NULL embeddings are excluded from retrieval results', async () => {
  // The real SQL has: AND dc.embedding IS NOT NULL
  // Our mock $queryRawUnsafe simulates the projectId filter but not the NULL filter.
  // This test verifies the SQL string contains the IS NOT NULL guard.
  let capturedSql = '';
  const prisma = {
    $queryRawUnsafe: async <T>(sql: string, ..._args: any[]): Promise<T> => {
      capturedSql = sql;
      return [] as unknown as T;
    },
  } as any;

  const service = new RetrievalService(prisma);
  await service.search(PROJECT_A, Array(1536).fill(0.1), 5);

  assert.ok(capturedSql.includes('IS NOT NULL'),
    'SQL must exclude chunks where embedding IS NULL');
});

// ---------------------------------------------------------------------------
// [7] RerankingService never re-expands beyond requested limit
// ---------------------------------------------------------------------------
test('RAG Isolation [7] - RerankingService never returns more chunks than the requested limit', () => {
  const service = new RerankingService();
  const inputChunks = [0.1, 0.3, 0.2, 0.4, 0.15, 0.25, 0.05].map((d, i) =>
    makeChunk(`chunk-${i}`, PROJECT_A, d),
  );

  const reranked = service.rerank(inputChunks, 3);
  assert.strictEqual(reranked.length, 3,
    'Reranker must respect the limit even when more chunks are available');
});

// ---------------------------------------------------------------------------
// [8] RerankingService returns chunks in ascending distance order (closest first)
// ---------------------------------------------------------------------------
test('RAG Isolation [8] - RerankingService returns chunks sorted by distance ascending', () => {
  const service = new RerankingService();
  const chunks = [
    makeChunk('c1', PROJECT_A, 0.9),
    makeChunk('c2', PROJECT_A, 0.1),
    makeChunk('c3', PROJECT_A, 0.5),
  ];

  const reranked = service.rerank(chunks, 3);
  assert.strictEqual(reranked[0].id, 'c2');
  assert.strictEqual(reranked[1].id, 'c3');
  assert.strictEqual(reranked[2].id, 'c1');
});

// ---------------------------------------------------------------------------
// [9] ContextService — no extra DB access, only uses provided chunks
// ---------------------------------------------------------------------------
test('RAG Isolation [9] - ContextService.buildContext() only uses the provided chunks (no DB access)', () => {
  const service = new ContextService();
  const chunks = [
    makeChunk('c1', PROJECT_A, 0.1),
    makeChunk('c2', PROJECT_A, 0.2),
  ];

  const context = service.buildContext(chunks);
  assert.ok(context.includes('[Source 1]'), 'First source label present');
  assert.ok(context.includes('[Source 2]'), 'Second source label present');
  assert.ok(context.includes(`Content for project ${PROJECT_A}`), 'Content included');
  assert.ok(!context.includes(PROJECT_B), 'No cross-project content in context');
});

// ---------------------------------------------------------------------------
// [10] RagService.search() returns empty result when RetrievalService returns nothing
// ---------------------------------------------------------------------------
test('RAG Isolation [10] - RagService.search() returns empty chunks when retrieval is empty', async () => {
  const mockRetrieval = {
    search: async () => [],
  } as any;

  const ragService = new RagService(
    {} as any,
    {} as any,
    makeMockEmbeddingService(),
    mockRetrieval,
    new RerankingService(),
    new ContextService(),
  );

  const result = await ragService.search(FOREIGN_PROJECT, 'some query', 5);
  assert.strictEqual(result.chunks.length, 0,
    'Empty retrieval must produce empty chunks');
  assert.strictEqual(result.context, '',
    'Empty retrieval must produce empty context string');
});

// ---------------------------------------------------------------------------
// [11] RetrievalService distanceThreshold filters out distant chunks
// ---------------------------------------------------------------------------
test('RAG Isolation [11] - RetrievalService distanceThreshold filters out chunks above threshold', async () => {
  const chunks = [
    makeChunk('chunk-close-1', PROJECT_A, 0.15),
    makeChunk('chunk-close-2', PROJECT_A, 0.35),
    makeChunk('chunk-distant', PROJECT_A, 0.85),
  ];

  const prisma = makeMockPrismaRetrieval(chunks);
  const service = new RetrievalService(prisma);
  const result = await service.search(PROJECT_A, Array(1536).fill(0.1), 10, 0.5);

  assert.strictEqual(result.length, 2, 'Should only keep chunks with distance <= 0.5');
  assert.ok(result.every((c) => c.distance <= 0.5));
});

// ---------------------------------------------------------------------------
// [12] RagService.search() propagates distanceThreshold to RetrievalService
// ---------------------------------------------------------------------------
test('RAG Isolation [12] - RagService.search() passes distanceThreshold through to RetrievalService', async () => {
  let passedThreshold: number | undefined;

  const mockRetrieval = {
    search: async (_projectId: string, _embedding: number[], _limit: number, distanceThreshold?: number) => {
      passedThreshold = distanceThreshold;
      return [];
    },
  } as any;

  const ragService = new RagService(
    {} as any,
    {} as any,
    makeMockEmbeddingService(),
    mockRetrieval,
    new RerankingService(),
    new ContextService(),
  );

  await ragService.search(PROJECT_A, 'Security architecture', 5, 0.42);

  assert.strictEqual(passedThreshold, 0.42, 'RagService must pass distanceThreshold to RetrievalService');
});
