/**
 * BullMQ Failed Job Retry & Deduplication Test Suite (F-3)
 * Milestone 4B.7 Phase 3.2
 *
 * Verifies:
 * - Deterministic job ID doc-index-${documentId}
 * - Active, waiting, or delayed jobs are recognized and not duplicated
 * - Completed jobs are not reprocessed
 * - Failed jobs are safely retried using existingJob.retry()
 * - Fallback to clean removal and re-adding if existingJob.retry() fails
 * - Redis timeouts and connection errors fail closed without corrupting queue state
 * - hasActiveOrWaitingJob and isJobCompleted helpers report accurate states
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { DocumentQueueService } from '../../src/documents/queues/document-queue.service.js';

function createMockQueue() {
  const jobs = new Map<string, any>();
  let throwTimeout = false;

  const mockQueue = {
    setThrowTimeout: (val: boolean) => {
      throwTimeout = val;
    },
    getJob: async (jobId: string) => {
      if (throwTimeout) {
        throw new Error('Redis connection timed out');
      }
      return jobs.get(jobId) || null;
    },
    add: async (name: string, data: any, opts: any) => {
      if (throwTimeout) {
        throw new Error('Redis connection timed out');
      }
      const job = {
        id: opts.jobId,
        name,
        data,
        opts,
        state: 'waiting',
        retryCount: 0,
        getState: async () => job.state,
        retry: async () => {
          job.retryCount++;
          job.state = 'waiting';
        },
        remove: async () => {
          jobs.delete(opts.jobId);
        },
      };
      jobs.set(opts.jobId, job);
      return job;
    },
    close: async () => {},
    getJobsMap: () => jobs,
    setJob: (jobId: string, jobData: any) => {
      jobs.set(jobId, jobData);
    },
  };

  return mockQueue;
}

function createService(mockQueue: any): DocumentQueueService {
  const service = Object.create(DocumentQueueService.prototype);
  (service as any).logger = {
    log: () => {},
    warn: () => {},
    error: () => {},
    debug: () => {},
  };
  (service as any).queue = mockQueue;
  return service as DocumentQueueService;
}

test('F-3 [1] - Enqueuing a new document adds job with deterministic ID', async () => {
  const mockQueue = createMockQueue();
  const service = createService(mockQueue);

  const result = await service.enqueueDocumentIndexing('doc-101', 'proj-1');

  assert.equal(result.enqueued, true);
  assert.equal(result.alreadyInState, undefined);

  const job = await mockQueue.getJob('doc-index-doc-101');
  assert.ok(job);
  assert.equal(job.data.documentId, 'doc-101');
  assert.equal(job.data.projectId, 'proj-1');
  assert.equal(job.opts.jobId, 'doc-index-doc-101');
});

test('F-3 [2] - Active, waiting, or delayed job is not duplicated', async () => {
  const mockQueue = createMockQueue();
  const service = createService(mockQueue);

  for (const state of ['waiting', 'active', 'delayed']) {
    const docId = `doc-${state}`;
    const jobId = `doc-index-${docId}`;
    mockQueue.setJob(jobId, {
      id: jobId,
      getState: async () => state,
      data: { documentId: docId },
    });

    const result = await service.enqueueDocumentIndexing(docId, 'proj-1');
    assert.equal(result.enqueued, true);
    assert.equal(result.alreadyInState, state);

    const hasActive = await service.hasActiveOrWaitingJob(docId);
    assert.equal(hasActive, true);
  }
});

test('F-3 [3] - Completed job for INDEXED document is not reprocessed', async () => {
  const mockQueue = createMockQueue();
  const service = createService(mockQueue);

  const docId = 'doc-completed';
  const jobId = `doc-index-${docId}`;
  let removeCalled = false;
  mockQueue.setJob(jobId, {
    id: jobId,
    getState: async () => 'completed',
    data: { documentId: docId },
    remove: async () => {
      removeCalled = true;
    },
  });

  const result = await service.enqueueDocumentIndexing(docId, 'proj-1', 'INDEXED');
  assert.equal(result.enqueued, true);
  assert.equal(result.alreadyInState, 'completed');
  assert.equal(removeCalled, false, 'Completed job for INDEXED document must not be removed');

  const isCompleted = await service.isJobCompleted(docId);
  assert.equal(isCompleted, true);
  const hasActive = await service.hasActiveOrWaitingJob(docId);
  assert.equal(hasActive, false);
});

test('F-3 [3b] - Stale completed job for non-INDEXED document is removed and re-enqueued', async () => {
  const mockQueue = createMockQueue();
  const service = createService(mockQueue);

  const docId = 'doc-stale-completed';
  const jobId = `doc-index-${docId}`;
  let removeCalled = false;

  mockQueue.setJob(jobId, {
    id: jobId,
    getState: async () => 'completed',
    data: { documentId: docId },
    remove: async () => {
      removeCalled = true;
      mockQueue.getJobsMap().delete(jobId);
    },
  });

  // Document status is UPLOADED (not INDEXED)
  const result = await service.enqueueDocumentIndexing(docId, 'proj-1', 'UPLOADED');
  assert.equal(result.enqueued, true);
  assert.equal(result.alreadyInState, undefined, 'Must re-enqueue rather than reporting alreadyInState completed');
  assert.equal(removeCalled, true, 'Stale completed job must be removed');

  const readdedJob = await mockQueue.getJob(jobId);
  assert.ok(readdedJob, 'New job must be enqueued');
  assert.equal(readdedJob.data.documentId, docId);
});

test('F-3 [4] - Failed job is safely retried using existingJob.retry()', async () => {
  const mockQueue = createMockQueue();
  const service = createService(mockQueue);

  const docId = 'doc-failed';
  const jobId = `doc-index-${docId}`;
  let retryCalled = false;

  mockQueue.setJob(jobId, {
    id: jobId,
    getState: async () => 'failed',
    retry: async () => {
      retryCalled = true;
    },
    remove: async () => {},
  });

  const result = await service.enqueueDocumentIndexing(docId, 'proj-1');
  assert.equal(result.enqueued, true);
  assert.equal(result.alreadyInState, 'failed-retried');
  assert.equal(retryCalled, true);
});

test('F-3 [5] - Fallback to clean removal and re-adding if existingJob.retry() throws', async () => {
  const mockQueue = createMockQueue();
  const service = createService(mockQueue);

  const docId = 'doc-retry-err';
  const jobId = `doc-index-${docId}`;
  let removeCalled = false;

  mockQueue.setJob(jobId, {
    id: jobId,
    getState: async () => 'failed',
    retry: async () => {
      throw new Error('BullMQ retry method not available on this job');
    },
    remove: async () => {
      removeCalled = true;
      mockQueue.getJobsMap().delete(jobId);
    },
  });

  const result = await service.enqueueDocumentIndexing(docId, 'proj-1');
  assert.equal(result.enqueued, true);
  assert.equal(removeCalled, true);

  const readdedJob = await mockQueue.getJob(jobId);
  assert.ok(readdedJob);
  assert.equal(readdedJob.data.documentId, docId);
});

test('F-3 [6] - Redis timeout during enqueue returns enqueued: false with error', async () => {
  const mockQueue = createMockQueue();
  mockQueue.setThrowTimeout(true);
  const service = createService(mockQueue);

  const result = await service.enqueueDocumentIndexing('doc-timeout', 'proj-1');
  assert.equal(result.enqueued, false);
  assert.ok(result.error?.includes('timed out') || result.error?.includes('timeout'));
});

test('F-3 [8] - Stale completed job removal failure returns enqueued: false with error', async () => {
  const mockQueue = createMockQueue();
  const service = createService(mockQueue);

  const docId = 'doc-removal-fail';
  const jobId = `doc-index-${docId}`;

  mockQueue.setJob(jobId, {
    id: jobId,
    getState: async () => 'completed',
    data: { documentId: docId },
    remove: async () => {
      throw new Error('Redis connection lost during removal');
    },
  });

  const result = await service.enqueueDocumentIndexing(docId, 'proj-1', 'UPLOADED');
  assert.equal(result.enqueued, false);
  assert.ok(result.error?.includes('Failed to remove stale completed job'));
});

test('F-3 [9] - Job becoming active during recovery is recognized and not replaced', async () => {
  const mockQueue = createMockQueue();
  const service = createService(mockQueue);

  const docId = 'doc-race-active';
  const jobId = `doc-index-${docId}`;

  let stateCallCount = 0;
  mockQueue.setJob(jobId, {
    id: jobId,
    getState: async () => {
      stateCallCount++;
      // First check: completed; recheck after removal: transitioned to active
      return stateCallCount === 1 ? 'completed' : 'active';
    },
    data: { documentId: docId },
    remove: async () => {
      // Mock removal executed, but worker concurrently restarted it
    },
  });

  const result = await service.enqueueDocumentIndexing(docId, 'proj-1', 'UPLOADED');
  assert.equal(result.enqueued, true);
  assert.equal(result.alreadyInState, 'active');
});

test('F-3 [10] - Redis outage followed by subsequent recovery enqueues document safely', async () => {
  const mockQueue = createMockQueue();
  const service = createService(mockQueue);

  const docId = 'doc-redis-recovery';

  // 1. Outage: Redis throws timeout
  mockQueue.setThrowTimeout(true);
  const outageResult = await service.enqueueDocumentIndexing(docId, 'proj-1');
  assert.equal(outageResult.enqueued, false);
  assert.ok(outageResult.error?.includes('timed out'));

  // 2. Recovery: Redis is restored
  mockQueue.setThrowTimeout(false);
  const recoveryResult = await service.enqueueDocumentIndexing(docId, 'proj-1');
  assert.equal(recoveryResult.enqueued, true);

  const job = await mockQueue.getJob(`doc-index-${docId}`);
  assert.ok(job);
  assert.equal(job.data.documentId, docId);
});

test('F-3 [11] - Fast-completed job whose document is not INDEXED fails safely and triggers recovery', async () => {
  const mockQueue = createMockQueue();
  const service = createService(mockQueue);

  const docId = 'doc-completed-res';
  const jobId = `doc-index-${docId}`;

  // Worker completed job immediately before API post-add check
  mockQueue.add = (async (name: string, data: any, opts: any) => ({
    id: opts.jobId,
    getState: async () => 'completed',
  })) as any;

  // Document remains UPLOADED (not INDEXED)
  const result = await service.enqueueDocumentIndexing(docId, 'proj-1', 'UPLOADED');
  assert.equal(result.enqueued, false);
  assert.ok(result.error?.includes('unexpectedly resolved to completed state'));
});

test('F-3 [12] - Fast worker completes job before API post-add check and document IS INDEXED: treated as success', async () => {
  const mockQueue = createMockQueue();
  const service = createService(mockQueue);

  const docId = 'doc-fast-completed-indexed';
  const jobId = `doc-index-${docId}`;

  // Worker completed job immediately
  mockQueue.add = (async (name: string, data: any, opts: any) => ({
    id: opts.jobId,
    getState: async () => 'completed',
  })) as any;

  // Document status or verifier confirms document is INDEXED
  const result = await service.enqueueDocumentIndexing(
    docId,
    'proj-1',
    'UPLOADED',
    async (id) => id === docId, // dynamic check confirms INDEXED
  );
  assert.equal(result.enqueued, true);
  assert.equal(result.alreadyInState, 'completed');
});

test('F-3 [13] - getState() throwing Redis failure fails closed with enqueued: false', async () => {
  const mockQueue = createMockQueue();
  const service = createService(mockQueue);

  const docId = 'doc-getstate-err';
  mockQueue.add = (async (name: string, data: any, opts: any) => ({
    id: opts.jobId,
    getState: async () => {
      throw new Error('Redis connection dropped while checking job state');
    },
  })) as any;

  const result = await service.enqueueDocumentIndexing(docId, 'proj-1', 'UPLOADED');
  assert.equal(result.enqueued, false);
  assert.ok(result.error?.includes('Failed to verify added job state'));
});

test('F-3 [14] - getState() timing out fails closed with enqueued: false', async () => {
  const mockQueue = createMockQueue();
  const service = createService(mockQueue);

  const docId = 'doc-getstate-timeout';
  mockQueue.add = (async (name: string, data: any, opts: any) => ({
    id: opts.jobId,
    getState: async () => new Promise<string>(() => {}), // never resolves -> times out
  })) as any;

  const result = await service.enqueueDocumentIndexing(docId, 'proj-1', 'UPLOADED');
  assert.equal(result.enqueued, false);
  assert.ok(result.error?.includes('timeout') || result.error?.includes('Redis timeout'));
});

test('F-3 [15] - Uncertain document whose enqueue failed is preserved for reconciliation recovery', async () => {
  const mockQueue = createMockQueue();
  const service = createService(mockQueue);

  const docId = 'doc-uncertain-recovery';
  let shouldFail = true;

  mockQueue.add = (async (name: string, data: any, opts: any) => ({
    id: opts.jobId,
    getState: async () => {
      if (shouldFail) {
        throw new Error('Redis blip during state check');
      }
      return 'waiting';
    },
  })) as any;

  // 1. Initial attempt fails during state check
  const failResult = await service.enqueueDocumentIndexing(docId, 'proj-1', 'UPLOADED');
  assert.equal(failResult.enqueued, false);

  // In caller, document status is set to ENQUEUE_FAILED
  const documentRecord = {
    id: docId,
    status: 'UPLOADED',
    queueStatus: 'ENQUEUE_FAILED',
    queueError: failResult.error,
  };
  assert.equal(documentRecord.queueStatus, 'ENQUEUE_FAILED');

  // 2. Reconciliation subsequently retries after Redis stabilizes
  shouldFail = false;
  const recoverResult = await service.enqueueDocumentIndexing(docId, 'proj-1', 'UPLOADED');
  assert.equal(recoverResult.enqueued, true);

  // Document transitions to ENQUEUED
  documentRecord.queueStatus = 'ENQUEUED';
  assert.equal(documentRecord.queueStatus, 'ENQUEUED');
});

test('F-3 [16] - Integration sequence: fast worker persists INDEXED, post-add check queries Prisma and succeeds', async () => {
  const mockQueue = createMockQueue();
  const service = createService(mockQueue);

  const docId = 'doc-fast-worker-integration';
  const mockDatabase: Record<string, { status: string }> = {
    [docId]: { status: 'UPLOADED' },
  };

  // Simulated BullMQ add: worker immediately intercepts and finishes before API post-add check
  mockQueue.add = (async (name: string, data: any, opts: any) => {
    // Worker processes immediately in background
    mockDatabase[docId].status = 'INDEXED';
    return {
      id: opts.jobId,
      getState: async () => 'completed',
    };
  }) as any;

  // Dynamic Prisma checker: reads CURRENT persisted status from DB
  const checkFromDb = async (id: string) => mockDatabase[id]?.status === 'INDEXED';

  // API calls enqueueDocumentIndexing with initial status 'UPLOADED'
  const result = await service.enqueueDocumentIndexing(
    docId,
    'proj-1',
    'UPLOADED', // initial status is UPLOADED
    checkFromDb, // dynamic callback reads updated DB state
  );

  assert.equal(result.enqueued, true);
  assert.equal(result.alreadyInState, 'completed');
  assert.equal(mockDatabase[docId].status, 'INDEXED');
});

test('F-3 [17] - Completed job with genuinely unindexed document fails closed and rejects enqueue', async () => {
  const mockQueue = createMockQueue();
  const service = createService(mockQueue);

  const docId = 'doc-unindexed-persisted';
  const mockDatabase: Record<string, { status: string }> = {
    [docId]: { status: 'UPLOADED' }, // remains UPLOADED (e.g. worker died or chunking failed)
  };

  mockQueue.add = (async (name: string, data: any, opts: any) => ({
    id: opts.jobId,
    getState: async () => 'completed',
  })) as any;

  const checkFromDb = async (id: string) => mockDatabase[id]?.status === 'INDEXED';

  const result = await service.enqueueDocumentIndexing(
    docId,
    'proj-1',
    'UPLOADED',
    checkFromDb,
  );

  assert.equal(result.enqueued, false);
  assert.ok(result.error?.includes('while document is unindexed'));
});
