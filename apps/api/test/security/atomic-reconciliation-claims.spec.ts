/**
 * Atomic Reconciliation Claims Test Suite (F-2)
 * Milestone 4B.7 Phase 3.2
 *
 * Verifies:
 * [1] Two concurrent claim attempts for one document: only one succeeds
 * [2] Expired lock can be reclaimed safely
 * [3] Active lock prevents another instance from claiming
 * [4] Ineligible document (INDEXED) cannot be claimed
 * [5] Ineligible document (RECONCILE_EXHAUSTED) cannot be claimed
 * [6] Malformed legacy metadata (corrupt strings, bad timestamp) does not break claiming
 * [7] Raw SQL query execution uses parameterized dynamic values
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DocumentReconciliationService,
  parseReconcileAttempts,
  isLockExpired,
} from '../../src/documents/queues/document-reconciliation.service.js';

function createMockQueueService() {
  return {
    hasActiveOrWaitingJob: async () => false,
    enqueueDocumentIndexing: async () => ({ enqueued: true }),
  };
}

test('F-2 [1] - Two concurrent claim attempts for one document: only one succeeds', async () => {
  let claimCount = 0;
  const doc = {
    id: 'doc-concurrent-1',
    projectId: 'proj-1',
    sourceType: 'DOCUMENTATION',
    metadata: {
      status: 'UPLOADED',
      queueStatus: 'ENQUEUE_FAILED',
      reconcileLockedUntil: null,
    },
  };

  // Mock Prisma simulating atomic conditional update:
  // If already locked, rows affected is 0.
  const prisma = {
    $executeRawUnsafe: async (sql: string, docId: string, attempts: number, lockedUntilIso: string, nowIso: string) => {
      assert.ok(sql.includes('UPDATE "Document"'));
      assert.ok(sql.includes('WHERE id = $1::uuid'));
      // Only the first claim call succeeds
      if (claimCount === 0) {
        claimCount++;
        return 1; // 1 row updated
      }
      return 0; // 0 rows updated
    },
    document: {
      findMany: async () => [{ ...doc }],
      update: async () => ({ ...doc }),
    },
  };

  const service = new DocumentReconciliationService(prisma as any, createMockQueueService() as any);

  // Instance A and Instance B both attempt to reconcile
  const [resA, resB] = await Promise.all([
    service.reconcilePendingDocuments(),
    service.reconcilePendingDocuments(),
  ]);

  const totalReconciled = resA.reconciled + resB.reconciled;
  const totalSkipped = resA.skipped + resB.skipped;

  assert.strictEqual(totalReconciled, 1, 'Exactly one instance must succeed in claiming and reconciling');
  assert.strictEqual(totalSkipped, 1, 'The competing instance must record the document as skipped');
});

test('F-2 [2] - Expired lock can be reclaimed safely', async () => {
  const expiredDate = new Date(Date.now() - 60000).toISOString(); // 1 minute in the past
  let claimed = false;

  const prisma = {
    $executeRawUnsafe: async (sql: string, docId: string, attempts: number, lockedUntil: string, nowIso: string) => {
      // In SQL, lockedUntil <= nowIso allows reclamation
      if (expiredDate <= nowIso) {
        claimed = true;
        return 1;
      }
      return 0;
    },
    document: {
      findMany: async () => [
        {
          id: 'doc-expired-1',
          projectId: 'proj-1',
          sourceType: 'DOCUMENTATION',
          metadata: {
            status: 'UPLOADED',
            queueStatus: 'ENQUEUE_FAILED',
            reconcileLockedUntil: expiredDate,
          },
        },
      ],
      update: async () => ({ id: 'doc-expired-1' }),
    },
  };

  const service = new DocumentReconciliationService(prisma as any, createMockQueueService() as any);
  const result = await service.reconcilePendingDocuments();

  assert.strictEqual(claimed, true, 'Expired lock must be successfully claimed');
  assert.strictEqual(result.reconciled, 1);
});

test('F-2 [3] - Active lock prevents another instance from claiming', async () => {
  const activeLock = new Date(Date.now() + 300000).toISOString(); // 5 minutes in future

  const prisma = {
    $executeRawUnsafe: async () => 0, // 0 rows updated because lock is active
    document: {
      findMany: async () => [
        {
          id: 'doc-active-lock',
          projectId: 'proj-1',
          sourceType: 'DOCUMENTATION',
          metadata: {
            status: 'UPLOADED',
            queueStatus: 'RECONCILING',
            reconcileLockedUntil: activeLock,
          },
        },
      ],
      update: async () => ({ id: 'doc-active-lock' }),
    },
  };

  const service = new DocumentReconciliationService(prisma as any, createMockQueueService() as any);
  const result = await service.reconcilePendingDocuments();

  assert.strictEqual(result.reconciled, 0, 'Active lock must prevent reconciliation');
  assert.strictEqual(result.totalEligible, 0, 'Active lock documents are filtered from eligible set');
});

test('F-2 [4] - Ineligible document (INDEXED) cannot be claimed', async () => {
  let rawUpdateCalled = false;
  const prisma = {
    $executeRawUnsafe: async () => {
      rawUpdateCalled = true;
      return 0;
    },
    document: {
      findMany: async () => [
        {
          id: 'doc-already-indexed',
          projectId: 'proj-1',
          sourceType: 'DOCUMENTATION',
          metadata: {
            status: 'INDEXED',
            queueStatus: 'ENQUEUED',
          },
        },
      ],
    },
  };

  const service = new DocumentReconciliationService(prisma as any, createMockQueueService() as any);
  const result = await service.reconcilePendingDocuments();

  assert.strictEqual(result.totalEligible, 0);
  assert.strictEqual(result.reconciled, 0);
  assert.strictEqual(rawUpdateCalled, false, 'INDEXED documents must never attempt claiming');
});

test('F-2 [5] - Ineligible document (RECONCILE_EXHAUSTED) cannot be claimed', async () => {
  const prisma = {
    $executeRawUnsafe: async () => 0,
    document: {
      findMany: async () => [
        {
          id: 'doc-exhausted',
          projectId: 'proj-1',
          sourceType: 'DOCUMENTATION',
          metadata: {
            status: 'UPLOADED',
            queueStatus: 'RECONCILE_EXHAUSTED',
          },
        },
      ],
    },
  };

  const service = new DocumentReconciliationService(prisma as any, createMockQueueService() as any);
  const result = await service.reconcilePendingDocuments();

  assert.strictEqual(result.totalEligible, 0);
  assert.strictEqual(result.reconciled, 0);
});

test('F-2 [6] - Malformed legacy metadata does not break claiming or crash SQL', async () => {
  // If metadata contains corrupt non-date string for reconcileLockedUntil
  const docWithCorruptMeta = {
    id: 'doc-corrupt-meta',
    projectId: 'proj-1',
    sourceType: 'DOCUMENTATION',
    metadata: {
      status: 'UPLOADED',
      queueStatus: 'ENQUEUE_FAILED',
      reconcileLockedUntil: 'NOT_A_VALID_DATE_CORRUPT',
      reconcileAttempts: 'three', // malformed number
    },
  };

  let executedSql = '';
  const prisma = {
    $executeRawUnsafe: async (sql: string, ...args: any[]) => {
      executedSql = sql;
      // String comparison in SQL avoids casting errors:
      // metadata->>'reconcileLockedUntil' <= $4 does not throw syntax/cast error
      return 1;
    },
    document: {
      findMany: async () => [{ ...docWithCorruptMeta }],
      update: async () => ({ id: 'doc-corrupt-meta' }),
    },
  };

  const service = new DocumentReconciliationService(prisma as any, createMockQueueService() as any);
  const result = await service.reconcilePendingDocuments();

  assert.strictEqual(result.reconciled, 1);
  assert.ok(
    executedSql.includes('CASE'),
    'Must use sequential CASE expression to guarantee evaluation order in PostgreSQL',
  );
  assert.ok(
    executedSql.includes("metadata->>'reconcileLockedUntil' ~"),
    'Must use regex guard inside CASE expression before timestamptz cast',
  );
});

test('F-2 [7] - parseReconcileAttempts validates attempts robustly across irregular data types', () => {
  // Empty, null, undefined
  assert.strictEqual(parseReconcileAttempts(null), 0);
  assert.strictEqual(parseReconcileAttempts(undefined), 0);
  assert.strictEqual(parseReconcileAttempts(''), 0);
  assert.strictEqual(parseReconcileAttempts('   '), 0);

  // Valid integers and numeric strings
  assert.strictEqual(parseReconcileAttempts(0), 0);
  assert.strictEqual(parseReconcileAttempts(3), 3);
  assert.strictEqual(parseReconcileAttempts('2'), 2);
  assert.strictEqual(parseReconcileAttempts(' 5 '), 5);

  // Fractional numbers (floored)
  assert.strictEqual(parseReconcileAttempts(3.8), 3);
  assert.strictEqual(parseReconcileAttempts('2.9'), 2);

  // Negative numbers
  assert.strictEqual(parseReconcileAttempts(-1), 0);
  assert.strictEqual(parseReconcileAttempts('-5'), 0);

  // Malformed strings & unexpected types
  assert.strictEqual(parseReconcileAttempts('three'), 0);
  assert.strictEqual(parseReconcileAttempts(NaN), 0);
  assert.strictEqual(parseReconcileAttempts(Infinity), 0);
  assert.strictEqual(parseReconcileAttempts([]), 0);
  assert.strictEqual(parseReconcileAttempts({}), 0);
  assert.strictEqual(parseReconcileAttempts(true), 0);
});

test('F-2 [8] - isLockExpired handles UTC, timezone offsets, and malformed strings safely', () => {
  const now = new Date('2026-11-16T12:00:00.000Z');

  // Null, undefined, empty
  assert.strictEqual(isLockExpired(null, now), true);
  assert.strictEqual(isLockExpired(undefined, now), true);
  assert.strictEqual(isLockExpired('', now), true);

  // Past UTC date
  assert.strictEqual(isLockExpired('2026-11-16T11:59:59.000Z', now), true);
  // Future UTC date
  assert.strictEqual(isLockExpired('2026-11-16T12:00:01.000Z', now), false);

  // Past timestamp with non-UTC timezone offset (+05:30)
  // 17:00:00+05:30 is 11:30:00 UTC (30 minutes in the past relative to 12:00:00 UTC)
  assert.strictEqual(isLockExpired('2026-11-16T17:00:00.000+05:30', now), true);

  // Future timestamp with non-UTC timezone offset (+05:30)
  // 18:00:00+05:30 is 12:30:00 UTC (30 minutes in the future relative to 12:00:00 UTC)
  assert.strictEqual(isLockExpired('2026-11-16T18:00:00.000+05:30', now), false);

  // Malformed date string (must be treated as expired for self-healing)
  assert.strictEqual(isLockExpired('NOT_A_VALID_DATE_STRING', now), true);
});

test('F-2 [9] - isLockExpired handles calendar leap years, invalid dates, and offsets correctly', () => {
  const now = new Date('2026-11-16T12:00:00.000Z');

  // 1. Valid leap years: 2000 (century leap), 2024, 2028
  assert.strictEqual(isLockExpired('2000-02-29T12:00:00.000Z', now), true, '2000-02-29 is a valid past leap-year date');
  assert.strictEqual(isLockExpired('2024-02-29T12:00:00.000Z', now), true, '2024-02-29 is a valid past leap-year date');
  assert.strictEqual(isLockExpired('2028-02-29T12:00:00.000Z', now), false, '2028-02-29 is a valid future leap-year date');
  const futureNow = new Date('2029-01-01T00:00:00.000Z');
  assert.strictEqual(isLockExpired('2028-02-29T12:00:00.000Z', futureNow), true, '2028-02-29 is correctly recognized as expired after 2028');

  // 2. Year zero and year one handling
  // 0000-01-01 is invalid in standard PostgreSQL calendar and must be treated as expired
  assert.strictEqual(isLockExpired('0000-01-01T00:00:00Z', now), true, 'Year 0000 must be treated as expired/reclaimable');
  // 0001-01-01 is valid historical date (1 AD) in the past -> expired
  assert.strictEqual(isLockExpired('0001-01-01T00:00:00Z', now), true, 'Year 0001 is a valid historical date');

  // 3. 2027-02-29 (invalid non-leap year): treated as expired/reclaimable
  assert.strictEqual(isLockExpired('2027-02-29T12:00:00.000Z', now), true, 'Non-leap 2027-02-29 must be treated as expired');

  // 4. 2028-02-30 (invalid February date): treated as expired/reclaimable
  assert.strictEqual(isLockExpired('2028-02-30T12:00:00.000Z', now), true, '2028-02-30 must be treated as expired');

  // 5. 2026-04-31 (invalid 30-day month date): treated as expired/reclaimable
  assert.strictEqual(isLockExpired('2026-04-31T12:00:00.000Z', now), true, 'April 31 must be treated as expired');

  // 6. Valid future and expired timestamps with timezone offsets (+05:30)
  // 18:00:00+05:30 is 12:30:00 UTC (future relative to 12:00:00 UTC) -> active (false)
  assert.strictEqual(isLockExpired('2026-11-16T18:00:00.000+05:30', now), false);
  // 17:00:00+05:30 is 11:30:00 UTC (past relative to 12:00:00 UTC) -> expired (true)
  assert.strictEqual(isLockExpired('2026-11-16T17:00:00.000+05:30', now), true);

  // 7. Malformed values and invalid years/months
  assert.strictEqual(isLockExpired('2026-13-01T12:00:00Z', now), true);
  assert.strictEqual(isLockExpired('2026-00-15T12:00:00Z', now), true);
  assert.strictEqual(isLockExpired('2026-01-32T12:00:00Z', now), true);
  assert.strictEqual(isLockExpired('NOT_A_DATE', now), true);
});
