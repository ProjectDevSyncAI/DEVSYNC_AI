import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { DocumentQueueService } from './document-queue.service.js';

export interface ReconciliationResult {
  totalEligible: number;
  reconciled: number;
  alreadyEnqueued: number;
  failed: number;
  exhausted: number;
  skipped: number;
}

/**
 * Safely parse reconcileAttempts metadata into a non-negative integer.
 * Handles null, undefined, empty strings, malformed strings, negative numbers,
 * fractional numbers, and unexpected JSON types (objects, arrays, booleans).
 */
export function parseReconcileAttempts(value: unknown): number {
  if (value === null || value === undefined || value === '') {
    return 0;
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || Number.isNaN(value) || value < 0) {
      return 0;
    }
    return Math.floor(value);
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return 0;
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed) || Number.isNaN(parsed) || parsed < 0) {
      return 0;
    }
    return Math.floor(parsed);
  }
  // Unexpected JSON types (objects, arrays, booleans)
  return 0;
}

/**
 * Determine whether a lock has expired.
 * Normalizes UTC ISO-8601 strings, handles non-UTC timestamps with timezone offsets,
 * and safely treats missing or unparseable timestamps as expired.
 */
export function isLockExpired(reconcileLockedUntil: unknown, now: Date): boolean {
  if (reconcileLockedUntil === null || reconcileLockedUntil === undefined || reconcileLockedUntil === '') {
    return true;
  }
  if (typeof reconcileLockedUntil === 'string') {
    const trimmed = reconcileLockedUntil.trim();
    if (!trimmed) return true;

    // Explicitly handle year 0000 as malformed/reclaimable (invalid in PostgreSQL/Gregorian)
    if (/^0000/.test(trimmed)) return true;

    // Calendar check: February 30 and 31 are always invalid
    if (/^\d{4}-02-3[01]/.test(trimmed)) return true;
    // 30-day month day 31 is always invalid
    if (/^\d{4}-(04|06|09|11)-31/.test(trimmed)) return true;
    // February 29 on non-leap year is invalid
    if (/^\d{4}-02-29/.test(trimmed)) {
      const year = parseInt(trimmed.substring(0, 4), 10);
      const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
      if (!isLeap) return true;
    }

    const parsedDate = new Date(trimmed);
    const time = parsedDate.getTime();
    if (isNaN(time)) {
      // Malformed date string: treat as expired to allow self-healing
      return true;
    }
    return time <= now.getTime();
  }
  return true;
}

@Injectable()
export class DocumentReconciliationService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DocumentReconciliationService.name);
  private timer: NodeJS.Timeout | null = null;
  private readonly maxRetries = 5;
  private readonly lockDurationMs = 120000; // 2 minutes lock per attempt

  constructor(
    private readonly prisma: PrismaService,
    private readonly queueService: DocumentQueueService,
  ) {}

  onModuleInit() {
    // Start periodic background timer unless explicitly disabled (e.g. in test suites)
    if (process.env.DISABLE_RECONCILIATION_TIMER !== 'true') {
      const intervalMs = parseInt(process.env.RECONCILIATION_INTERVAL_MS || '60000', 10);
      this.timer = setInterval(() => {
        this.reconcilePendingDocuments().catch((err) => {
          this.logger.error(`Periodic reconciliation run encountered error: ${err.message}`);
        });
      }, intervalMs);
      this.logger.log(`Document enqueue reconciliation worker active (interval: ${intervalMs}ms)`);
    }
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /**
   * Main reconciliation routine.
   * Discovers documents with ENQUEUE_FAILED or stale UPLOADED status,
   * atomically claims them to prevent multi-instance race conditions,
   * verifies if an ambiguous BullMQ job already exists, and re-enqueues as appropriate.
   */
  async reconcilePendingDocuments(batchSize = 25): Promise<ReconciliationResult> {
    const result: ReconciliationResult = {
      totalEligible: 0,
      reconciled: 0,
      alreadyEnqueued: 0,
      failed: 0,
      exhausted: 0,
      skipped: 0,
    };

    try {
      // Find eligible documents
      const candidateDocs = await this.prisma.document.findMany({
        where: {
          sourceType: 'DOCUMENTATION',
        },
        take: batchSize,
        orderBy: {
          updatedAt: 'asc',
        },
      });

      const now = new Date();

      // Filter for documents needing reconciliation
      const eligible = candidateDocs.filter((doc) => {
        const meta = (doc.metadata as Record<string, any>) || {};
        const status = meta.status;
        const queueStatus = meta.queueStatus;

        // Skip documents already indexed or actively processing
        if (status === 'INDEXED' || status === 'PROCESSING') {
          return false;
        }

        // Skip documents whose reconciliation retries are exhausted
        if (queueStatus === 'RECONCILE_EXHAUSTED') {
          return false;
        }

        // Check lock expiration
        if (!isLockExpired(meta.reconcileLockedUntil, now)) {
          return false; // Still locked by another run
        }

        // Eligible if explicit enqueue failure or un-enqueued UPLOADED
        return (
          queueStatus === 'ENQUEUE_FAILED' ||
          (status === 'UPLOADED' && (!queueStatus || queueStatus === 'RECONCILE_FAILED'))
        );
      });

      result.totalEligible = eligible.length;

      for (const doc of eligible) {
        const meta = (doc.metadata as Record<string, any>) || {};
        const currentAttempts = parseReconcileAttempts(meta.reconcileAttempts);
        const attempts = currentAttempts + 1;

        // Check if retry limit reached
        if (attempts > this.maxRetries) {
          await this.prisma.document.update({
            where: { id: doc.id },
            data: {
              metadata: {
                ...meta,
                queueStatus: 'RECONCILE_EXHAUSTED',
                reconciledAt: now.toISOString(),
              },
            },
          });
          this.logger.warn(`Document ${doc.id} exceeded maximum enqueue reconciliation retries (${this.maxRetries})`);
          result.exhausted++;
          continue;
        }

        // Atomically claim document for reconciliation
        const lockedUntil = new Date(now.getTime() + this.lockDurationMs);
        const claimed = await this.claimDocument(doc.id, attempts, lockedUntil, meta, now);
        if (!claimed) {
          result.skipped++;
          continue;
        }

        // Step 1: Check if an ambiguous job already exists in BullMQ (e.g. from prior timeout)
        const jobAlreadyActive = await this.queueService.hasActiveOrWaitingJob(doc.id);
        if (jobAlreadyActive) {
          await this.prisma.document.update({
            where: { id: doc.id },
            data: {
              metadata: {
                ...meta,
                queueStatus: 'ENQUEUED',
                reconcileLockedUntil: null,
                confirmedJobId: `doc-index-${doc.id}`,
                reconciledAt: new Date().toISOString(),
              },
            },
          });
          this.logger.log(`Document ${doc.id} verified as already enqueued in BullMQ (jobId: doc-index-${doc.id})`);
          result.alreadyEnqueued++;
          continue;
        }

        // Step 2: Attempt re-enqueuing into BullMQ
        if (!doc.projectId) {
          this.logger.error(`Document ${doc.id} missing projectId; cannot enqueue`);
          result.failed++;
          continue;
        }

        const docStatus = meta.status || (doc as any).status;
        const enqueueRes = await this.queueService.enqueueDocumentIndexing(
          doc.id,
          doc.projectId,
          docStatus,
          async (docId: string) => {
            const fresh = await this.prisma.document.findUnique({
              where: { id: docId },
              select: { metadata: true },
            });
            return ((fresh?.metadata as any)?.status === 'INDEXED');
          },
        );

        if (enqueueRes.enqueued) {
          await this.prisma.document.update({
            where: { id: doc.id },
            data: {
              metadata: {
                ...meta,
                queueStatus: 'ENQUEUED',
                reconcileLockedUntil: null,
                enqueuedAt: new Date().toISOString(),
                reconciledAt: new Date().toISOString(),
              },
            },
          });
          this.logger.log(`Document ${doc.id} successfully reconciled and enqueued for indexing (attempt ${attempts})`);
          result.reconciled++;
        } else {
          // Calculate exponential backoff
          const backoffDelay = Math.min(1000 * Math.pow(2, attempts) * 15, 3600000); // 30s, 60s, 120s... max 1hr
          const nextRetry = new Date(Date.now() + backoffDelay);

          await this.prisma.document.update({
            where: { id: doc.id },
            data: {
              metadata: {
                ...meta,
                queueStatus: 'ENQUEUE_FAILED',
                reconcileAttempts: attempts,
                reconcileLockedUntil: nextRetry.toISOString(),
                lastReconcileError: enqueueRes.error,
              },
            },
          });
          this.logger.warn(
            `Failed to re-enqueue document ${doc.id} during reconciliation (attempt ${attempts}): ${enqueueRes.error}`,
          );
          result.failed++;
        }
      }
    } catch (err: any) {
      this.logger.error(`Document reconciliation failed: ${err.message}`);
    }

    return result;
  }

  /**
   * Atomically claim a document for reconciliation.
   * Returns true if the lock was acquired, false if another instance claimed it
   * or the document is no longer eligible.
   */
  private async claimDocument(
    docId: string,
    attempts: number,
    lockedUntil: Date,
    _currentMeta: Record<string, any>,
    now: Date,
  ): Promise<boolean> {
    const nowIso = now.toISOString();
    const lockedUntilIso = lockedUntil.toISOString();

    // 1. If raw SQL execution is available (PostgreSQL with pgvector / adapter-pg):
    if (typeof (this.prisma as any).$executeRawUnsafe === 'function') {
      try {
        const rowsAffected = await (this.prisma as any).$executeRawUnsafe(
          `
          UPDATE "Document"
          SET metadata = jsonb_set(
            jsonb_set(
              jsonb_set(
                COALESCE(metadata, '{}'::jsonb),
                '{queueStatus}',
                '"RECONCILING"'
              ),
              '{reconcileAttempts}',
              to_jsonb($2::int)
            ),
            '{reconcileLockedUntil}',
            to_jsonb($3::text)
          ),
          "updatedAt" = NOW()
          WHERE id = $1::uuid
            AND (
              CASE
                WHEN metadata->>'reconcileLockedUntil' IS NULL
                  OR metadata->>'reconcileLockedUntil' = ''
                  OR metadata->>'reconcileLockedUntil' ~ '^0000'
                  THEN true
                WHEN metadata->>'reconcileLockedUntil' ~ '^\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])(([T ](0\\d|1\\d|2[0-3]):[0-5]\\d:[0-5]\\d(\\.\\d+)?)(Z|[+-](0\\d|1\\d|2[0-3]):?[0-5]\\d)?)?$'
                  THEN (
                    CASE
                      -- Year 0000 is invalid in PostgreSQL
                      WHEN metadata->>'reconcileLockedUntil' ~ '^0000' THEN true
                      -- Feb 30 and 31 are always invalid
                      WHEN metadata->>'reconcileLockedUntil' ~ '^\\d{4}-02-3[01]' THEN true
                      -- Feb 29 on non-leap years is invalid
                      WHEN metadata->>'reconcileLockedUntil' ~ '^\\d{4}-02-29'
                        AND metadata->>'reconcileLockedUntil' !~ '^(\\d{2}([02468][48]|[2468]0|[13579][26])|([02468][048]|[13579][26])00)-02-29'
                        THEN true
                      -- 30-day months cannot have day 31
                      WHEN metadata->>'reconcileLockedUntil' ~ '^\\d{4}-(04|06|09|11)-31' THEN true
                      -- Valid calendar date: safe to cast to timestamptz
                      ELSE (metadata->>'reconcileLockedUntil')::timestamptz <= NOW()
                    END
                  )
                ELSE true
              END
            )
            AND (metadata->>'status' IS NULL OR (metadata->>'status' != 'INDEXED' AND metadata->>'status' != 'PROCESSING'))
            AND (metadata->>'queueStatus' IS NULL OR metadata->>'queueStatus' != 'RECONCILE_EXHAUSTED')
          `,
          docId,
          attempts,
          lockedUntilIso,
          nowIso,
        );

        return rowsAffected === 1;
      } catch (err: any) {
        this.logger.debug(`Raw claim query fallback: ${err.message}`);
      }
    }

    // 2. Safe transactional fallback for environments/mocks without raw SQL:
    try {
      const freshDoc = await this.prisma.document.findUnique({
        where: { id: docId },
      });
      if (!freshDoc) return false;

      const freshMeta = (freshDoc.metadata as Record<string, any>) || {};
      if (freshMeta.status === 'INDEXED' || freshMeta.status === 'PROCESSING') return false;
      if (freshMeta.queueStatus === 'RECONCILE_EXHAUSTED') return false;

      if (!isLockExpired(freshMeta.reconcileLockedUntil, now)) {
        return false; // Still locked by another run
      }

      await this.prisma.document.update({
        where: { id: docId },
        data: {
          metadata: {
            ...freshMeta,
            queueStatus: 'RECONCILING',
            reconcileAttempts: attempts,
            reconcileLockedUntil: lockedUntilIso,
          },
        },
      });
      return true;
    } catch {
      return false;
    }
  }
}
