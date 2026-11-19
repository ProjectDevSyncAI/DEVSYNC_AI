import { createDocumentWorker } from './processors/document.processor.js';
import { createAIWorker } from './processors/ai.processor.js';

console.log('🚀 DevSync AI Background Worker initializing...');

const docWorker = createDocumentWorker();
const aiWorker = createAIWorker();

docWorker.on('completed', (job) => {
  console.log(`✅ [DocumentWorker] Job ${job.id} completed successfully.`);
});

docWorker.on('failed', (job, err) => {
  console.error(`❌ [DocumentWorker] Job ${job?.id} failed:`, err);
});

aiWorker.on('completed', (job) => {
  console.log(`✅ [AIWorker] Job ${job.id} completed successfully.`);
});

aiWorker.on('failed', (job, err) => {
  console.error(`❌ [AIWorker] Job ${job?.id} failed:`, err);
});

console.log('⚡ All DevSync AI BullMQ workers active and listening on Redis queues.');

process.on('SIGINT', async () => {
  console.log('Shutting down background workers...');
  await docWorker.close();
  await aiWorker.close();
  process.exit(0);
});
