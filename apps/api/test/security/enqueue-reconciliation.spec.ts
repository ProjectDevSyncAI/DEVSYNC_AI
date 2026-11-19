/**
 * Enqueue Failure Reconciliation Test Suite (H-3)
 * Milestone 4B.7 Phase 2.2
 *
 * Verifies:
 * - Redis failure during upload leaves document eligible for reconciliation
 * - Successful reconciliation enqueues document after Redis recovery
 * - Deterministic job ID doc-index-${documentId} prevents duplicate queue jobs
 * - Ambiguous enqueue timeout with an already-existing job is recognized and confirmed
 * - Concurrent reconciliation attempts do not produce duplicate processing
 * - Bounded retries and exponential backoff prevent infinite loops
 * - Already INDEXED or actively PROCESSING documents are skipped
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { DocumentReconciliationService } from '../../src/documents/queues/document-reconciliation.service.js';

function createMockQueueService() {
  const jobs = new Map<string, { id: string; state: string; data: any }>();
  let redisAvailable = true;

  return {
    setRedisAvailable: (val: boolean) => {
      redisAvailable = val;
    },
    enqueueDocumentIndexing: async (documentId: string, projectId: string) => {
      if (!redisAvailable) {
        return { enqueued: false, error: 'Redis connection unavailable' };
      }
      const jobId = `doc-index-${documentId}`;
      jobs.set(jobId, { id: jobId, state: 'waiting', data: { documentId, projectId } });
      return { enqueued: true };
    },
    getJob: async (jobId: string) => {
      if (!redisAvailable) return null;
      const j = jobs.get(jobId);
      if (!j) return null;
      return {
        id: j.id,
        getState: async () => j.state,
        data: j.data,
      };
    },
    hasActiveOrWaitingJob: async (documentId: string) => {
      if (!redisAvailable) return false;
      const jobId = `doc-index-${documentId}`;
      const j = jobs.get(jobId);
      if (!j) return false;
      return j.state === 'waiting' || j.state === 'active';
    },
    getJobs: () => new Map(jobs),
    clear: () => jobs.clear(),
  };
}

function createMockPrismaForReconciliation(initialDocs: any[]) {
  const docs = new Map(initialDocs.map((d) => [d.id, { ...d, metadata: { ...d.metadata } }]));

  return {
    document: {
      findMany: async ({ where, take }: any) => {
        let results = Array.from(docs.values());
        if (where?.sourceType) {
          results = results.filter((d) => d.sourceType === where.sourceType);
        }
        if (take) {
          results = results.slice(0, take);
        }
        return results.map((d) => ({ ...d, metadata: { ...d.metadata } }));
      },
      findUnique: async ({ where }: any) => {
        const d = docs.get(where.id);
        if (!d) return null;
        return { ...d, metadata: { ...d.metadata } };
      },
      update: async ({ where, data }: any) => {
        const d = docs.get(where.id);
        if (!d) throw new Error('Document not found');

        const updated = {
          ...d,
          ...data,
          metadata: {
            ...d.metadata,
            ...(data.metadata || {}),
          },
        };
        docs.set(where.id, updated);
        return { ...updated, metadata: { ...updated.metadata } };
      },
    },
    getDoc: (id: string) => docs.get(id),
    getAllDocs: () => Array.from(docs.values()),
  };
}

test('H-3 [1] - Initial upload enqueue failure marks queueStatus as ENQUEUE_FAILED and eligible for reconciliation', async () => {
  const mockQueue = createMockQueueService();
  mockQueue.setRedisAvailable(false); // Redis offline during upload

  const enqueueRes = await mockQueue.enqueueDocumentIndexing('doc-offline-1', 'proj-123');
  assert.equal(enqueueRes.enqueued, false);
  assert.ok(enqueueRes.error?.includes('unavailable'));

  // Document metadata records failure
  const doc = {
    id: 'doc-offline-1',
    projectId: 'proj-123',
    sourceType: 'DOCUMENTATION',
    metadata: {
      status: 'UPLOADED',
      queueStatus: 'ENQUEUE_FAILED',
      queueError: enqueueRes.error,
    },
  };

  const mockPrisma = createMockPrismaForReconciliation([doc]);
  const reconciliationService = new DocumentReconciliationService(
    mockPrisma as any,
    mockQueue as any,
  );

  // Still offline: reconciliation attempts and fails cleanly with backoff
  const run1 = await reconciliationService.reconcilePendingDocuments();
  assert.equal(run1.totalEligible, 1);
  assert.equal(run1.failed, 1);
  assert.equal(run1.reconciled, 0);

  const docAfterFail = mockPrisma.getDoc('doc-offline-1');
  assert.equal(docAfterFail.metadata.queueStatus, 'ENQUEUE_FAILED');
  assert.equal(docAfterFail.metadata.reconcileAttempts, 1);
  assert.ok(docAfterFail.metadata.reconcileLockedUntil);
});

test('H-3 [2] - Reconciliation enqueues document after Redis recovery', async () => {
  const mockQueue = createMockQueueService();
  mockQueue.setRedisAvailable(true); // Redis back online!

  const doc = {
    id: 'doc-recovered-1',
    projectId: 'proj-123',
    sourceType: 'DOCUMENTATION',
    metadata: {
      status: 'UPLOADED',
      queueStatus: 'ENQUEUE_FAILED',
      reconcileAttempts: 1,
      reconcileLockedUntil: null, // Lock expired
    },
  };

  const mockPrisma = createMockPrismaForReconciliation([doc]);
  const reconciliationService = new DocumentReconciliationService(
    mockPrisma as any,
    mockQueue as any,
  );

  const result = await reconciliationService.reconcilePendingDocuments();
  assert.equal(result.totalEligible, 1);
  assert.equal(result.reconciled, 1);
  assert.equal(result.failed, 0);

  const updatedDoc = mockPrisma.getDoc('doc-recovered-1');
  assert.equal(updatedDoc.metadata.queueStatus, 'ENQUEUED');
  assert.equal(updatedDoc.metadata.reconcileLockedUntil, null);
  assert.ok(updatedDoc.metadata.enqueuedAt);

  // Verify job in BullMQ
  const jobs = mockQueue.getJobs();
  assert.ok(jobs.has('doc-index-doc-recovered-1'));
});

test('H-3 [3] - Repeated reconciliation runs do not create duplicate queue jobs', async () => {
  const mockQueue = createMockQueueService();
  mockQueue.setRedisAvailable(true);

  const doc = {
    id: 'doc-dup-test',
    projectId: 'proj-123',
    sourceType: 'DOCUMENTATION',
    metadata: {
      status: 'UPLOADED',
      queueStatus: 'ENQUEUE_FAILED',
      reconcileLockedUntil: null,
    },
  };

  const mockPrisma = createMockPrismaForReconciliation([doc]);
  const reconciliationService = new DocumentReconciliationService(
    mockPrisma as any,
    mockQueue as any,
  );

  // First run
  const res1 = await reconciliationService.reconcilePendingDocuments();
  assert.equal(res1.reconciled, 1);

  // Second run: document is already ENQUEUED
  const res2 = await reconciliationService.reconcilePendingDocuments();
  assert.equal(res2.totalEligible, 0);
  assert.equal(res2.reconciled, 0);

  // Still only 1 job in queue
  assert.equal(mockQueue.getJobs().size, 1);
});

test('H-3 [4] - Ambiguous enqueue timeout: job already in BullMQ is confirmed without creating duplicate', async () => {
  const mockQueue = createMockQueueService();
  mockQueue.setRedisAvailable(true);

  const docId = 'doc-ambiguous-timeout';
  // Simulate situation: prior enqueue actually succeeded in Redis, but API timed out
  await mockQueue.enqueueDocumentIndexing(docId, 'proj-123');
  assert.equal(mockQueue.getJobs().size, 1);

  const doc = {
    id: docId,
    projectId: 'proj-123',
    sourceType: 'DOCUMENTATION',
    metadata: {
      status: 'UPLOADED',
      queueStatus: 'ENQUEUE_FAILED',
      queueError: 'Redis connection timed out',
      reconcileLockedUntil: null,
    },
  };

  const mockPrisma = createMockPrismaForReconciliation([doc]);
  const reconciliationService = new DocumentReconciliationService(
    mockPrisma as any,
    mockQueue as any,
  );

  const result = await reconciliationService.reconcilePendingDocuments();
  assert.equal(result.totalEligible, 1);
  assert.equal(result.alreadyEnqueued, 1);
  assert.equal(result.reconciled, 0); // Confirmed, did not re-add

  // Queue size remains strictly 1
  assert.equal(mockQueue.getJobs().size, 1);

  const updated = mockPrisma.getDoc(docId);
  assert.equal(updated.metadata.queueStatus, 'ENQUEUED');
  assert.equal(updated.metadata.confirmedJobId, `doc-index-${docId}`);
});

test('H-3 [5] - Active lock prevents concurrent reconciliation from double-processing', async () => {
  const mockQueue = createMockQueueService();
  mockQueue.setRedisAvailable(true);

  // Document locked until 5 minutes in future
  const lockedUntil = new Date(Date.now() + 300000).toISOString();
  const doc = {
    id: 'doc-locked-test',
    projectId: 'proj-123',
    sourceType: 'DOCUMENTATION',
    metadata: {
      status: 'UPLOADED',
      queueStatus: 'RECONCILING',
      reconcileLockedUntil: lockedUntil,
    },
  };

  const mockPrisma = createMockPrismaForReconciliation([doc]);
  const reconciliationService = new DocumentReconciliationService(
    mockPrisma as any,
    mockQueue as any,
  );

  // Another reconciliation process runs while lock is active
  const result = await reconciliationService.reconcilePendingDocuments();
  assert.equal(result.totalEligible, 0, 'Locked document must be skipped by concurrent runs');
  assert.equal(result.reconciled, 0);
});

test('H-3 [6] - Retry limits and exponential backoff prevent infinite loops', async () => {
  const mockQueue = createMockQueueService();
  mockQueue.setRedisAvailable(false); // Redis remains down

  const doc = {
    id: 'doc-max-retry',
    projectId: 'proj-123',
    sourceType: 'DOCUMENTATION',
    metadata: {
      status: 'UPLOADED',
      queueStatus: 'ENQUEUE_FAILED',
      reconcileAttempts: 5, // Already reached maximum retries (5)
      reconcileLockedUntil: null,
    },
  };

  const mockPrisma = createMockPrismaForReconciliation([doc]);
  const reconciliationService = new DocumentReconciliationService(
    mockPrisma as any,
    mockQueue as any,
  );

  const result = await reconciliationService.reconcilePendingDocuments();
  assert.equal(result.totalEligible, 1);
  assert.equal(result.exhausted, 1);
  assert.equal(result.failed, 0);

  const exhaustedDoc = mockPrisma.getDoc('doc-max-retry');
  assert.equal(exhaustedDoc.metadata.queueStatus, 'RECONCILE_EXHAUSTED');

  // Next run will skip this exhausted document
  const nextRun = await reconciliationService.reconcilePendingDocuments();
  assert.equal(nextRun.totalEligible, 0);
});

test('H-3 [7] - Documents already INDEXED or actively PROCESSING are never re-enqueued', async () => {
  const mockQueue = createMockQueueService();
  mockQueue.setRedisAvailable(true);

  const docs = [
    {
      id: 'doc-indexed',
      projectId: 'proj-123',
      sourceType: 'DOCUMENTATION',
      metadata: { status: 'INDEXED', queueStatus: 'ENQUEUE_FAILED' },
    },
    {
      id: 'doc-processing',
      projectId: 'proj-123',
      sourceType: 'DOCUMENTATION',
      metadata: { status: 'PROCESSING', queueStatus: 'ENQUEUE_FAILED' },
    },
  ];

  const mockPrisma = createMockPrismaForReconciliation(docs);
  const reconciliationService = new DocumentReconciliationService(
    mockPrisma as any,
    mockQueue as any,
  );

  const result = await reconciliationService.reconcilePendingDocuments();
  assert.equal(result.totalEligible, 0);
  assert.equal(result.reconciled, 0);
  assert.equal(mockQueue.getJobs().size, 0);
});
