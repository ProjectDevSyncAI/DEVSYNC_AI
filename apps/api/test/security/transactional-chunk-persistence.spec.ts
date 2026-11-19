/**
 * Transactional Chunk Persistence & Rollback Test Suite (H-2)
 * Milestone 4B.7 Phase 2.2
 *
 * Verifies:
 * - Successful complete replacement of document chunks inside a transaction
 * - Failure during mid-chunk insertion rolls back all chunk modifications
 * - Rollback preserves the previous complete chunk set intact
 * - No partial chunk set is ever reported as INDEXED
 * - Empty extraction or zero chunks is rejected safely
 * - Retry after failed persistence succeeds cleanly
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { RagService } from '../../src/ai/rag/rag.service.js';
import { ChunkingService } from '../../src/ai/rag/chunking.service.js';
import { RetrievalService } from '../../src/ai/rag/retrieval.service.js';
import { RerankingService } from '../../src/ai/rag/reranking.service.js';
import { ContextService } from '../../src/ai/rag/context.service.js';

interface MockChunkRecord {
  documentId: string;
  chunkIndex: number;
  content: string;
  tokenCount: number;
  metadata: any;
  vector: string;
}

function createTransactionalMockPrisma(options?: { failOnChunkIndex?: number }) {
  let doc: any = {
    id: 'doc-trans-1234',
    projectId: 'proj-trans-999',
    title: 'Transactional Specification Doc',
    content: 'Initial document content prior to re-indexing',
    sourceType: 'DOCUMENTATION',
    metadata: {
      status: 'INDEXED',
      chunkCount: 2,
    },
  };

  // Initial chunks in DB
  const committedChunks: MockChunkRecord[] = [
    {
      documentId: doc.id,
      chunkIndex: 0,
      content: 'Original chunk 0',
      tokenCount: 10,
      metadata: {},
      vector: '[0.01,0.02]',
    },
    {
      documentId: doc.id,
      chunkIndex: 1,
      content: 'Original chunk 1',
      tokenCount: 12,
      metadata: {},
      vector: '[0.03,0.04]',
    },
  ];

  let rawExecutionCount = 0;

  return {
    document: {
      findUnique: async ({ where }: any) => {
        if (where.id === doc.id) return { ...doc };
        return null;
      },
      update: async ({ where, data }: any) => {
        if (where.id === doc.id) {
          doc = { ...doc, ...data };
          return { ...doc };
        }
        throw new Error('Document not found');
      },
    },
    $transaction: async (txCallback: (tx: any) => Promise<any>) => {
      // Simulate transaction staging
      let stagedChunks = [...committedChunks];
      let stagedDoc = { ...doc };

      const txClient = {
        document: {
          update: async ({ where, data }: any) => {
            if (where.id === stagedDoc.id) {
              stagedDoc = { ...stagedDoc, ...data };
              return { ...stagedDoc };
            }
            throw new Error('Document not found');
          },
        },
        documentChunk: {
          deleteMany: async ({ where }: any) => {
            const before = stagedChunks.length;
            stagedChunks = stagedChunks.filter((c) => c.documentId !== where.documentId);
            return { count: before - stagedChunks.length };
          },
        },
        $executeRawUnsafe: async (sql: string, ...params: any[]) => {
          rawExecutionCount++;
          const chunkIndex = params[1];

          // Simulate database or network failure on specified chunk index
          if (options?.failOnChunkIndex !== undefined && chunkIndex === options.failOnChunkIndex) {
            throw new Error(`Database transaction aborted at chunk index ${chunkIndex}`);
          }

          stagedChunks.push({
            documentId: params[0],
            chunkIndex: params[1],
            content: params[2],
            tokenCount: params[3],
            metadata: JSON.parse(params[4]),
            vector: params[5],
          });
          return 1;
        },
      };

      try {
        const result = await txCallback(txClient);
        // Transaction committed successfully: apply staged changes
        committedChunks.length = 0;
        committedChunks.push(...stagedChunks);
        doc = stagedDoc;
        return result;
      } catch (txError) {
        // Rollback: staged changes discarded; committed state preserved intact
        throw txError;
      }
    },
    getCommittedChunks: () => [...committedChunks],
    getDoc: () => ({ ...doc }),
    getRawExecutionCount: () => rawExecutionCount,
    setFailOnChunkIndex: (idx?: number) => {
      if (options) options.failOnChunkIndex = idx;
    },
  };
}

test('H-2 [1] - Successful chunk replacement persists all chunks and transitions document to INDEXED', async () => {
  const mockPrisma = createTransactionalMockPrisma();
  const chunkingService = new ChunkingService();

  const mockEmbeddingService = {
    embedMany: async (texts: string[]) => texts.map(() => new Array(1536).fill(0.05)),
    embed: async () => new Array(1536).fill(0.05),
  } as any;

  const ragService = new RagService(
    mockPrisma as any,
    chunkingService,
    mockEmbeddingService,
    new RetrievalService(mockPrisma as any),
    new RerankingService(),
    new ContextService(),
  );

  const initialDoc = mockPrisma.getDoc();
  // Provide content that yields multiple chunks
  initialDoc.content = 'First section outlining architecture.\n\nSecond section outlining database persistence.';
  await mockPrisma.document.update({ where: { id: initialDoc.id }, data: { content: initialDoc.content } });

  const result = await ragService.indexDocument(initialDoc.id);

  assert.equal(result.status, 'INDEXED');
  assert.ok(result.chunksCreated >= 1);

  const updatedDoc = mockPrisma.getDoc();
  assert.equal(updatedDoc.metadata.status, 'INDEXED');
  assert.equal(updatedDoc.metadata.chunkCount, result.chunksCreated);

  const chunks = mockPrisma.getCommittedChunks();
  assert.equal(chunks.length, result.chunksCreated);
  // Verify previous chunks were replaced by the new transaction
  assert.ok(!chunks.some((c) => c.content.includes('Original chunk')));
});

test('H-2 [2] - Failure during middle chunk insertion rolls back transaction and preserves original chunks', async () => {
  // Configure transaction to fail on chunk index 1 (middle of insertion)
  const mockPrisma = createTransactionalMockPrisma({ failOnChunkIndex: 1 });
  const chunkingService = new ChunkingService();

  const mockEmbeddingService = {
    embedMany: async (texts: string[]) => texts.map(() => new Array(1536).fill(0.05)),
    embed: async () => new Array(1536).fill(0.05),
  } as any;

  const ragService = new RagService(
    mockPrisma as any,
    chunkingService,
    mockEmbeddingService,
    new RetrievalService(mockPrisma as any),
    new RerankingService(),
    new ContextService(),
  );

  // Content that splits into multiple chunks (exceeding 800 tokens)
  const longText = 'Architecture component description paragraph outlining core persistence invariants.\n\n'.repeat(120);
  await mockPrisma.document.update({ where: { id: 'doc-trans-1234' }, data: { content: longText } });

  await assert.rejects(
    () => ragService.indexDocument('doc-trans-1234'),
    (err: any) => {
      assert.ok(err.message.includes('Database transaction aborted at chunk index 1'));
      return true;
    },
  );

  // Verify rollback: original chunks must remain completely untouched!
  const chunksAfterRollback = mockPrisma.getCommittedChunks();
  assert.equal(chunksAfterRollback.length, 2, 'Must retain original 2 chunks after rollback');
  assert.equal(chunksAfterRollback[0].content, 'Original chunk 0');
  assert.equal(chunksAfterRollback[1].content, 'Original chunk 1');

  // Verify document is marked FAILED, NEVER INDEXED
  const docAfterRollback = mockPrisma.getDoc();
  assert.equal(docAfterRollback.metadata.status, 'FAILED');
  assert.ok(docAfterRollback.metadata.error.includes('aborted at chunk index 1'));
});

test('H-2 [3] - Partial chunk set is never reported as INDEXED', async () => {
  const mockPrisma = createTransactionalMockPrisma({ failOnChunkIndex: 0 });
  const chunkingService = new ChunkingService();

  const mockEmbeddingService = {
    embedMany: async (texts: string[]) => texts.map(() => new Array(1536).fill(0.05)),
    embed: async () => new Array(1536).fill(0.05),
  } as any;

  const ragService = new RagService(
    mockPrisma as any,
    chunkingService,
    mockEmbeddingService,
    new RetrievalService(mockPrisma as any),
    new RerankingService(),
    new ContextService(),
  );

  await assert.rejects(() => ragService.indexDocument('doc-trans-1234'));

  const doc = mockPrisma.getDoc();
  assert.notEqual(doc.metadata.status, 'INDEXED');
  assert.equal(doc.metadata.status, 'FAILED');
});

test('H-2 [4] - Empty extraction or zero chunks is rejected before transaction opens', async () => {
  const mockPrisma = createTransactionalMockPrisma();
  const chunkingService = new ChunkingService();
  const mockEmbeddingService = { embedMany: async () => [] } as any;

  const ragService = new RagService(
    mockPrisma as any,
    chunkingService,
    mockEmbeddingService,
    new RetrievalService(mockPrisma as any),
    new RerankingService(),
    new ContextService(),
  );

  await mockPrisma.document.update({ where: { id: 'doc-trans-1234' }, data: { content: '   \n\n  ' } });

  await assert.rejects(
    () => ragService.indexDocument('doc-trans-1234'),
    (err: any) => {
      assert.ok(err.message.includes('empty'));
      return true;
    },
  );

  // Original chunks remain untouched
  const chunks = mockPrisma.getCommittedChunks();
  assert.equal(chunks.length, 2);
});

test('H-2 [5] - Subsequent retry after failed persistence succeeds cleanly', async () => {
  const mockPrisma = createTransactionalMockPrisma({ failOnChunkIndex: 0 });
  const chunkingService = new ChunkingService();

  const mockEmbeddingService = {
    embedMany: async (texts: string[]) => texts.map(() => new Array(1536).fill(0.05)),
    embed: async () => new Array(1536).fill(0.05),
  } as any;

  const ragService = new RagService(
    mockPrisma as any,
    chunkingService,
    mockEmbeddingService,
    new RetrievalService(mockPrisma as any),
    new RerankingService(),
    new ContextService(),
  );

  // First attempt fails
  await assert.rejects(() => ragService.indexDocument('doc-trans-1234'));
  assert.equal(mockPrisma.getDoc().metadata.status, 'FAILED');

  // Fix database transient error (clear failure trigger)
  mockPrisma.setFailOnChunkIndex(undefined);

  // Retry attempt succeeds
  const retryResult = await ragService.indexDocument('doc-trans-1234');
  assert.equal(retryResult.status, 'INDEXED');
  assert.equal(mockPrisma.getDoc().metadata.status, 'INDEXED');
  assert.ok(mockPrisma.getCommittedChunks().length >= 1);
});
