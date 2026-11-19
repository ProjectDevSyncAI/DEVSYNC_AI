import { Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import { prisma } from '../db.js';

const connection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
});

export function createAIWorker() {
  return new Worker(
    'ai-processing',
    async (job: Job<{ projectId: string; taskType: 'INSIGHT' | 'RISK_DETECTION' | 'STANDUP' }>) => {
      console.log(`[AIWorker] Processing AI task ${job.data.taskType} for project ${job.data.projectId}`);

      if (job.data.taskType === 'INSIGHT') {
        await prisma.aIInsight.create({
          data: {
            projectId: job.data.projectId,
            type: 'PRODUCTIVITY',
            title: 'Automated Velocity Insight',
            summary: 'Active sprint throughput has reached 90% completion rate.',
          },
        });
      }

      console.log(`[AIWorker] Completed AI job ${job.id}`);
      return { success: true };
    },
    { connection },
  );
}
