import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Queue, ConnectionOptions, Job } from 'bullmq';

@Injectable()
export class DocumentQueueService implements OnModuleDestroy {
  private readonly logger = new Logger(DocumentQueueService.name);
  private queue: Queue | null = null;

  constructor() {
    this.initializeQueue();
  }

  private initializeQueue() {
    try {
      const host = process.env.REDIS_HOST || 'localhost';
      const port = parseInt(process.env.REDIS_PORT || '6379', 10);
      const password = process.env.REDIS_PASSWORD || undefined;

      const connection: ConnectionOptions = {
        host,
        port,
        password,
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
        connectTimeout: 1000,
        retryStrategy: () => null, // Fail fast if Redis is offline
      };

      this.queue = new Queue('document-indexing', {
        connection,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: 100,
          removeOnFail: 500,
        },
      });
    } catch (err: any) {
      this.logger.warn(`Failed to initialize document queue: ${err.message}`);
      this.queue = null;
    }
  }

  getQueue(): Queue | null {
    return this.queue;
  }

  /**
   * Retrieve a job by ID from BullMQ.
   * Wraps in a 1500ms timeout to avoid hanging if Redis is offline.
   */
  async getJob(jobId: string): Promise<Job | null | undefined> {
    if (!this.queue) {
      return null;
    }

    try {
      const getPromise = this.queue.getJob(jobId);
      const timeoutPromise = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('Redis timeout')), 1500),
      );
      const job = await Promise.race([getPromise, timeoutPromise]);
      return job ?? null;
    } catch {
      return null;
    }
  }

  /**
   * Checks whether a job with the deterministic ID doc-index-${documentId}
   * is currently active, waiting, or delayed in the queue.
   */
  async hasActiveOrWaitingJob(documentId: string): Promise<boolean> {
    const jobId = `doc-index-${documentId}`;
    const job = await this.getJob(jobId);
    if (!job) {
      return false;
    }

    try {
      const state = await job.getState();
      return state === 'active' || state === 'waiting' || state === 'delayed';
    } catch {
      return false;
    }
  }

  /**
   * Checks whether a job with the deterministic ID doc-index-${documentId}
   * is completed in the queue.
   */
  async isJobCompleted(documentId: string): Promise<boolean> {
    const jobId = `doc-index-${documentId}`;
    const job = await this.getJob(jobId);
    if (!job) {
      return false;
    }

    try {
      const state = await job.getState();
      return state === 'completed';
    } catch {
      return false;
    }
  }

  /**
   * Add a document indexing job to the queue.
   * Deterministic job ID: doc-index-${documentId}
   *
   * Handles:
   * - active / waiting / delayed: skips duplicate insertion
   * - completed: avoids accidental re-processing
   * - failed: safely retries the failed job or replaces it cleanly
   * - Redis timeout: returns enqueued: false with error
   */
  async enqueueDocumentIndexing(
    documentId: string,
    projectId: string,
    documentStatus?: string,
    checkDocumentIndexed?: (docId: string) => Promise<boolean> | boolean,
  ): Promise<{ enqueued: boolean; error?: string; alreadyInState?: string }> {
    if (!this.queue) {
      return {
        enqueued: false,
        error: 'Document queue is not initialized',
      };
    }

    const jobId = `doc-index-${documentId}`;

    try {
      // 1. Inspect existing job state in BullMQ with timeout
      const existingJob = await this.getJob(jobId);
      if (existingJob) {
        let state: string = 'unknown';
        try {
          state = await existingJob.getState();
        } catch {
          state = 'unknown';
        }

        // 2. Waiting, active and delayed jobs must not be duplicated
        if (state === 'active' || state === 'waiting' || state === 'delayed') {
          this.logger.log(
            `Document ${documentId} already has ${state} job in queue (${jobId})`,
          );
          return { enqueued: true, alreadyInState: state };
        }

        // 3. Completed jobs:
        // If document is confirmed INDEXED, skip re-processing.
        // If document is NOT INDEXED (e.g. UPLOADED, FAILED, PROCESSING), recover by
        // removing stale completed job and re-enqueuing fresh indexing job.
        if (state === 'completed') {
          if (documentStatus === 'INDEXED') {
            this.logger.log(
              `Document ${documentId} is already INDEXED and has completed indexing job in queue (${jobId})`,
            );
            return { enqueued: true, alreadyInState: 'completed' };
          }

          this.logger.warn(
            `Document ${documentId} has completed job (${jobId}) but document status is '${documentStatus || 'unindexed'}'. Removing stale job and re-enqueuing.`,
          );
          try {
            if (typeof existingJob.remove !== 'function') {
              this.logger.error(`Cannot remove stale completed job ${jobId}: remove method unavailable`);
              return {
                enqueued: false,
                error: `Failed to remove stale completed job ${jobId}: remove method unavailable`,
              };
            }
            const removePromise = existingJob.remove();
            const timeoutPromise = new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('Redis timeout during stale completed job removal')), 1500),
            );
            await Promise.race([removePromise, timeoutPromise]);
          } catch (removeErr: any) {
            this.logger.error(`Could not remove stale completed job ${jobId}: ${removeErr.message}`);
            return {
              enqueued: false,
              error: `Failed to remove stale completed job ${jobId}: ${removeErr.message}`,
            };
          }

          // Race check: Re-verify if another worker picked up or transitioned the job
          try {
            const recheckJob = await this.getJob(jobId);
            if (recheckJob) {
              const recheckState = await recheckJob.getState().catch(() => 'unknown');
              if (recheckState === 'active' || recheckState === 'waiting' || recheckState === 'delayed') {
                this.logger.log(`Document ${documentId} job transitioned to ${recheckState} during recovery`);
                return { enqueued: true, alreadyInState: recheckState };
              }
              if (recheckState === 'completed') {
                this.logger.error(`Stale completed job ${jobId} persists after removal attempt`);
                return {
                  enqueued: false,
                  error: `Stale completed job ${jobId} could not be cleared from queue`,
                };
              }
            }
          } catch {
            // Ignore recheck errors and proceed to add replacement
          }
        }

        // 4. Failed jobs: safe retry strategy
        if (state === 'failed') {
          try {
            if (typeof existingJob.retry === 'function') {
              const retryPromise = existingJob.retry();
              const timeoutPromise = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('Redis timeout during job retry')), 1500),
              );
              await Promise.race([retryPromise, timeoutPromise]);
              this.logger.log(`Document ${documentId} retried existing failed job in BullMQ (${jobId})`);
              return { enqueued: true, alreadyInState: 'failed-retried' };
            }
          } catch (retryErr: any) {
            this.logger.warn(`Failed job.retry() for ${jobId}: ${retryErr.message}. Removing and re-adding.`);
          }

          // If retry was not supported or failed, safely remove old failed job before adding
          try {
            if (typeof existingJob.remove === 'function') {
              await existingJob.remove();
            }
          } catch {
            // Ignore removal errors
          }
        }
      }

      // 5. Add deterministic job with 1500ms timeout
      const addPromise = this.queue.add(
        'index-document',
        { documentId, projectId },
        {
          jobId,
        },
      );

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Redis connection timed out')), 1500),
      );

      const addedJob = await Promise.race([addPromise, timeoutPromise]);

      // Ensure deterministic job ID cannot silently resolve to a stale completed job
      // and verify that the added job is in an executable state
      if (addedJob && typeof addedJob.getState === 'function') {
        let finalState: string;
        try {
          const statePromise = addedJob.getState();
          const stateTimeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Redis timeout during added job state verification')), 1500),
          );
          finalState = await Promise.race([statePromise, stateTimeoutPromise]);
        } catch (stateErr: any) {
          const msg = stateErr?.message || 'Redis error during job state check';
          this.logger.warn(
            `Failed to verify state of added job ${jobId} for document ${documentId}: ${msg}. Failing closed to preserve recoverability.`,
          );
          return {
            enqueued: false,
            error: `Failed to verify added job state: ${msg}`,
          };
        }

        if (finalState === 'completed') {
          // Fast-completion check: if document status is confirmed INDEXED via callback,
          // worker completed processing before this check ran; treat as success.
          const isConfirmedIndexed = checkDocumentIndexed
            ? await checkDocumentIndexed(documentId)
            : documentStatus === 'INDEXED';

          if (isConfirmedIndexed) {
            this.logger.log(
              `Job for document ${documentId} completed immediately by worker and document is confirmed INDEXED`,
            );
            return { enqueued: true, alreadyInState: 'completed' };
          }

          this.logger.error(
            `Job addition for ${documentId} unexpectedly resolved to completed state (${jobId}) while document is not INDEXED`,
          );
          return {
            enqueued: false,
            error: `Job addition unexpectedly resolved to completed state (${jobId}) while document is unindexed`,
          };
        }

        if (finalState !== 'active' && finalState !== 'waiting' && finalState !== 'delayed') {
          this.logger.warn(
            `Job ${jobId} for document ${documentId} in unexpected state '${finalState}' after add. Failing closed.`,
          );
          return {
            enqueued: false,
            error: `Added job ${jobId} in unexpected state '${finalState}'`,
          };
        }
      }

      this.logger.log(`Document ${documentId} enqueued for indexing (jobId: ${jobId})`);
      return { enqueued: true };
    } catch (err: any) {
      const errorMsg = err?.message || 'Redis connection unavailable';
      this.logger.warn(
        `Failed to enqueue document ${documentId} for indexing (Redis may be offline): ${errorMsg}`,
      );
      return {
        enqueued: false,
        error: errorMsg,
      };
    }
  }

  async onModuleDestroy() {
    try {
      if (this.queue) {
        await this.queue.close().catch(() => null);
      }
    } catch (err: any) {
      this.logger.warn(`Error closing document queue: ${err.message}`);
    }
  }
}
