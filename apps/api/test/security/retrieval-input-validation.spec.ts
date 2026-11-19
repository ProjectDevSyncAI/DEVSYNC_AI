/**
 * Retrieval Input Validation & Deterministic Ordering Test Suite (F-5, F-6, F-7)
 * Milestone 4B.7 Phase 3.2
 *
 * Verifies:
 * - F-5: distanceThreshold input validation ([0, 2] finite, rejects NaN/negative/>2 with HTTP 400)
 * - F-6: limit input validation ([1, 20] positive integer, clamped and bounds-checked)
 * - F-7: Deterministic ordering across RetrievalService (SQL ORDER BY) and RerankingService
 *        (distance ASC -> chunkIndex ASC -> id ASC)
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { BadRequestException } from '@nestjs/common';
import { RetrievalService } from '../../src/ai/rag/retrieval.service.js';
import { RerankingService } from '../../src/ai/rag/reranking.service.js';
import { AIController } from '../../src/ai/ai.controller.js';

function makeMockPrisma(sqlCapture?: { sql: string; params: any[] }) {
  return {
    $queryRawUnsafe: async (sql: string, ...params: any[]) => {
      if (sqlCapture) {
        sqlCapture.sql = sql;
        sqlCapture.params = params;
      }
      return [];
    },
    project: {
      findUnique: async () => ({
        id: 'proj-1',
        organizationId: 'org-1',
        organization: { id: 'org-1', ownerId: 'other-user' },
        members: [{ id: 'mem-1' }],
      }),
    },
    projectMember: {
      findFirst: async () => ({ id: 'mem-1' }),
    },
  } as any;
}

test('F-5 [1] - RetrievalService rejects invalid distanceThreshold values', async () => {
  const prisma = makeMockPrisma();
  const service = new RetrievalService(prisma);
  const dummyEmbedding = Array(1536).fill(0.1);

  // Negative threshold
  await assert.rejects(
    async () => service.search('proj-1', dummyEmbedding, 5, -0.1),
    (err: any) => err instanceof BadRequestException && err.message.includes('between 0 and 2'),
  );

  // Threshold > 2
  await assert.rejects(
    async () => service.search('proj-1', dummyEmbedding, 5, 2.01),
    (err: any) => err instanceof BadRequestException && err.message.includes('between 0 and 2'),
  );

  // NaN threshold
  await assert.rejects(
    async () => service.search('proj-1', dummyEmbedding, 5, NaN),
    (err: any) => err instanceof BadRequestException && err.message.includes('between 0 and 2'),
  );

  // Infinity threshold
  await assert.rejects(
    async () => service.search('proj-1', dummyEmbedding, 5, Infinity),
    (err: any) => err instanceof BadRequestException && err.message.includes('between 0 and 2'),
  );
});

test('F-5 [2] - RetrievalService accepts valid distanceThreshold boundary values (0 and 2)', async () => {
  const prisma = makeMockPrisma();
  const service = new RetrievalService(prisma);
  const dummyEmbedding = Array(1536).fill(0.1);

  // 0, 1, 2, and undefined are valid
  await assert.doesNotReject(async () => service.search('proj-1', dummyEmbedding, 5, 0));
  await assert.doesNotReject(async () => service.search('proj-1', dummyEmbedding, 5, 1.0));
  await assert.doesNotReject(async () => service.search('proj-1', dummyEmbedding, 5, 2.0));
  await assert.doesNotReject(async () => service.search('proj-1', dummyEmbedding, 5, undefined));
});

test('F-6 [1] - RetrievalService clamps limit parameter to [1, 20]', async () => {
  const capture: { sql: string; params: any[] } = { sql: '', params: [] };
  const prisma = makeMockPrisma(capture);
  const service = new RetrievalService(prisma);
  const dummyEmbedding = Array(1536).fill(0.1);

  // Excessive limit (>20) clamped to 20
  await service.search('proj-1', dummyEmbedding, 100);
  assert.equal(capture.params[2], 20);

  // Negative or 0 limit clamped to 1
  await service.search('proj-1', dummyEmbedding, -5);
  assert.equal(capture.params[2], 1);

  // Normal limit preserved
  await service.search('proj-1', dummyEmbedding, 12);
  assert.equal(capture.params[2], 12);
});

test('F-7 [1] - RetrievalService SQL contains deterministic multi-column ORDER BY', async () => {
  const capture: { sql: string; params: any[] } = { sql: '', params: [] };
  const prisma = makeMockPrisma(capture);
  const service = new RetrievalService(prisma);
  const dummyEmbedding = Array(1536).fill(0.1);

  await service.search('proj-1', dummyEmbedding, 5);

  assert.ok(capture.sql.includes('dc.embedding <=> $1::vector ASC'), 'Missing primary distance sort');
  assert.ok(capture.sql.includes('dc."chunkIndex" ASC'), 'Missing secondary chunkIndex sort');
  assert.ok(capture.sql.includes('dc.id ASC'), 'Missing tertiary id tie-breaker sort');
});

test('F-7 [2] - RerankingService breaks ties deterministically with chunkIndex ASC and id ASC', () => {
  const reranker = new RerankingService();

  const chunks = [
    { id: 'chunk-z', documentId: 'd1', chunkIndex: 2, content: 'Z', tokenCount: 10, distance: 0.3 },
    { id: 'chunk-b', documentId: 'd1', chunkIndex: 1, content: 'B', tokenCount: 10, distance: 0.3 },
    { id: 'chunk-a', documentId: 'd1', chunkIndex: 1, content: 'A', tokenCount: 10, distance: 0.3 },
    { id: 'chunk-first', documentId: 'd1', chunkIndex: 5, content: 'First', tokenCount: 10, distance: 0.1 },
    { id: 'chunk-last', documentId: 'd1', chunkIndex: 0, content: 'Last', tokenCount: 10, distance: 0.8 },
  ];

  const reranked = reranker.rerank(chunks as any, 10);

  assert.equal(reranked.length, 5);
  // 1st: lowest distance 0.1
  assert.equal(reranked[0].id, 'chunk-first');

  // Next 3 items have equal distance 0.3:
  // chunkIndex 1 comes before chunkIndex 2
  // Between chunk-a and chunk-b (both chunkIndex 1), chunk-a comes before chunk-b
  assert.equal(reranked[1].id, 'chunk-a');
  assert.equal(reranked[2].id, 'chunk-b');
  assert.equal(reranked[3].id, 'chunk-z');

  // Last item has highest distance 0.8
  assert.equal(reranked[4].id, 'chunk-last');
});

test('F-5 & F-6 [2] - AIController.searchKnowledge validates query, projectId, distanceThreshold and limit', async () => {
  const prisma = makeMockPrisma();
  let aiServiceCalled = false;
  const aiService = {
    searchKnowledge: async (projId: string, q: string, lim: number, thresh?: number) => {
      aiServiceCalled = true;
      return { query: q, chunks: [], limit: lim, threshold: thresh };
    },
  };

  const controller = new AIController(aiService as any, prisma);
  const req = { user: { id: 'user-1' } };

  // Empty projectId throws 400
  await assert.rejects(
    async () => controller.searchKnowledge(req, '', 'test query'),
    (err: any) => err instanceof BadRequestException && err.message.includes('Project ID is required'),
  );

  // Empty query throws 400
  await assert.rejects(
    async () => controller.searchKnowledge(req, 'proj-1', '   '),
    (err: any) => err instanceof BadRequestException && err.message.includes('Query string is required'),
  );

  // Invalid distanceThreshold throws 400
  await assert.rejects(
    async () => controller.searchKnowledge(req, 'proj-1', 'test query', undefined, '-0.5'),
    (err: any) => err instanceof BadRequestException && err.message.includes('between 0 and 2'),
  );
  await assert.rejects(
    async () => controller.searchKnowledge(req, 'proj-1', 'test query', undefined, '2.5'),
    (err: any) => err instanceof BadRequestException && err.message.includes('between 0 and 2'),
  );
  // Non-numeric input throws 400
  await assert.rejects(
    async () => controller.searchKnowledge(req, 'proj-1', 'test query', undefined, 'invalid-num'),
    (err: any) => err instanceof BadRequestException && err.message.includes('between 0 and 2'),
  );
  await assert.rejects(
    async () => controller.searchKnowledge(req, 'proj-1', 'test query', 'not-a-number'),
    (err: any) => err instanceof BadRequestException && err.message.includes('between 1 and 20'),
  );

  // Infinity and NaN strings throw 400
  await assert.rejects(
    async () => controller.searchKnowledge(req, 'proj-1', 'test query', undefined, 'Infinity'),
    (err: any) => err instanceof BadRequestException && err.message.includes('between 0 and 2'),
  );
  await assert.rejects(
    async () => controller.searchKnowledge(req, 'proj-1', 'test query', undefined, '-Infinity'),
    (err: any) => err instanceof BadRequestException && err.message.includes('between 0 and 2'),
  );
  await assert.rejects(
    async () => controller.searchKnowledge(req, 'proj-1', 'test query', undefined, 'NaN'),
    (err: any) => err instanceof BadRequestException && err.message.includes('between 0 and 2'),
  );
  await assert.rejects(
    async () => controller.searchKnowledge(req, 'proj-1', 'test query', 'Infinity'),
    (err: any) => err instanceof BadRequestException && err.message.includes('between 1 and 20'),
  );
  await assert.rejects(
    async () => controller.searchKnowledge(req, 'proj-1', 'test query', 'NaN'),
    (err: any) => err instanceof BadRequestException && err.message.includes('between 1 and 20'),
  );

  // Numeric prefix strings (e.g. 5abc, 2xyz) throw 400
  await assert.rejects(
    async () => controller.searchKnowledge(req, 'proj-1', 'test query', undefined, '2xyz'),
    (err: any) => err instanceof BadRequestException && err.message.includes('between 0 and 2'),
  );
  await assert.rejects(
    async () => controller.searchKnowledge(req, 'proj-1', 'test query', '5abc'),
    (err: any) => err instanceof BadRequestException && err.message.includes('between 1 and 20'),
  );

  // Invalid limit throws 400
  await assert.rejects(
    async () => controller.searchKnowledge(req, 'proj-1', 'test query', '0'),
    (err: any) => err instanceof BadRequestException && err.message.includes('between 1 and 20'),
  );
  await assert.rejects(
    async () => controller.searchKnowledge(req, 'proj-1', 'test query', '25'),
    (err: any) => err instanceof BadRequestException && err.message.includes('Limit cannot exceed 20'),
  );
  await assert.rejects(
    async () => controller.searchKnowledge(req, 'proj-1', 'test query', '1.5'),
    (err: any) => err instanceof BadRequestException && err.message.includes('between 1 and 20'),
  );

  // Explicit empty distanceThreshold throws 400 (F-5)
  await assert.rejects(
    async () => controller.searchKnowledge(req, 'proj-1', 'test query', undefined, ''),
    (err: any) => err instanceof BadRequestException && err.message.includes('Distance threshold cannot be empty'),
  );
  await assert.rejects(
    async () => controller.searchKnowledge(req, 'proj-1', 'test query', undefined, '   '),
    (err: any) => err instanceof BadRequestException && err.message.includes('Distance threshold cannot be empty'),
  );

  // Explicit empty limit throws 400 (F-6)
  await assert.rejects(
    async () => controller.searchKnowledge(req, 'proj-1', 'test query', '', undefined),
    (err: any) => err instanceof BadRequestException && err.message.includes('Limit cannot be empty'),
  );
  await assert.rejects(
    async () => controller.searchKnowledge(req, 'proj-1', 'test query', '   ', undefined),
    (err: any) => err instanceof BadRequestException && err.message.includes('Limit cannot be empty'),
  );

  // Omitted params default to limit: 5 and threshold: undefined
  const defaultResult: any = await controller.searchKnowledge(req, 'proj-1', 'test query');
  assert.equal(defaultResult.limit, 5);
  assert.equal(defaultResult.threshold, undefined);

  // Valid params succeed
  const result: any = await controller.searchKnowledge(req, 'proj-1', 'test query', '10', '0.75');
  assert.equal(aiServiceCalled, true);
  assert.equal(result.limit, 10);
  assert.equal(result.threshold, 0.75);
});
