import { Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import * as fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import { prisma } from '../db.js';
import { resolveSafeStoragePath } from '../../../api/src/documents/storage/storage-boundary.js';

const require = createRequire(import.meta.url);
const pdfModule = require('pdf-parse');
const mammoth = require('mammoth');
const { encode, decode } = require('gpt-tokenizer');

const connection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
  lazyConnect: true,
});

/**
 * Clean & normalize extracted text
 */
function normalizeText(text: string): string {
  return text
    .replace(/\0/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Extract plain text from supported document types
 */
async function extractDocumentBuffer(
  buffer: Buffer,
  mimeType: string,
): Promise<{ text: string; wordCount: number; charCount: number; pageCount?: number }> {
  let rawText = '';
  let pageCount: number | undefined;

  switch (mimeType) {
    case 'application/pdf': {
      if (typeof pdfModule === 'function') {
        const pdf = await pdfModule(buffer);
        rawText = pdf.text || '';
        pageCount = pdf.numpages;
      } else if (pdfModule?.PDFParse) {
        const parser = new pdfModule.PDFParse({ data: buffer });
        try {
          const textResult = await parser.getText();
          rawText = textResult?.text || '';
          pageCount = textResult?.total;
        } finally {
          if (typeof parser.destroy === 'function') {
            await parser.destroy().catch(() => null);
          }
        }
      }
      break;
    }
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
      const res = await mammoth.extractRawText({ buffer });
      rawText = res.value || '';
      break;
    }
    case 'text/plain':
    case 'text/markdown': {
      const decoder = new TextDecoder('utf-8', { fatal: true });
      rawText = decoder.decode(buffer);
      break;
    }
    default:
      throw new Error(`Unsupported MIME type: ${mimeType}`);
  }

  const cleaned = normalizeText(rawText);
  if (!cleaned) {
    throw new Error('Extracted text is empty');
  }

  return {
    text: cleaned,
    charCount: cleaned.length,
    wordCount: cleaned.split(/\s+/).filter(Boolean).length,
    pageCount,
  };
}

/**
 * Token-based chunking with 800 tokens target and 120 tokens overlap
 */
function chunkText(text: string, chunkSize = 800, overlap = 120): Array<{ chunkIndex: number; content: string; tokenCount: number }> {
  const trimmed = text.trim();
  if (!trimmed) return [];

  const allTokens = encode(trimmed);
  if (allTokens.length <= chunkSize) {
    return [{ chunkIndex: 0, content: trimmed, tokenCount: allTokens.length }];
  }

  const chunks: Array<{ chunkIndex: number; content: string; tokenCount: number }> = [];
  let start = 0;
  let index = 0;

  while (start < allTokens.length) {
    const end = Math.min(start + chunkSize, allTokens.length);
    const slice = allTokens.slice(start, end);
    let chunkString = decode(slice).trim();

    if (end < allTokens.length) {
      const minCutoff = Math.floor(chunkString.length * 0.7);
      const pBreak = chunkString.lastIndexOf('\n\n');
      if (pBreak > minCutoff) {
        chunkString = chunkString.slice(0, pBreak).trim();
      } else {
        const sBreak = Math.max(
          chunkString.lastIndexOf('. '),
          chunkString.lastIndexOf('! '),
          chunkString.lastIndexOf('? '),
        );
        if (sBreak > minCutoff) {
          chunkString = chunkString.slice(0, sBreak + 1).trim();
        }
      }
    }

    if (chunkString) {
      const tokenCount = encode(chunkString).length;
      chunks.push({
        chunkIndex: index++,
        content: chunkString,
        tokenCount,
      });

      if (end >= allTokens.length) break;
      const advance = Math.max(1, tokenCount - overlap);
      start += advance;
    } else {
      start += Math.max(1, chunkSize - overlap);
    }
  }

  return chunks;
}

/**
 * Request real OpenAI semantic embeddings. Zero synthetic/sine-wave fallback.
 */
async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured. Clean semantic embedding failure.');
  }

  const model = process.env.AI_EMBEDDING_MODEL || 'text-embedding-3-small';
  const dimension = 1536;
  const batchSize = 100;
  const allResults: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize).map((t) => t.slice(0, 8000));
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, input: batch }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI embedding failed (${response.status}): ${errText}`);
    }

    const data = (await response.json()) as {
      data: Array<{ embedding: number[]; index: number }>;
    };

    if (!data?.data || data.data.length !== batch.length) {
      throw new Error(`Embedding count mismatch: expected ${batch.length}`);
    }

    const sorted = data.data
      .sort((a, b) => a.index - b.index)
      .map((item) => {
        if (item.embedding.length !== dimension) {
          throw new Error(`Invalid embedding dimension: expected ${dimension}, received ${item.embedding.length}`);
        }
        return item.embedding;
      });

    allResults.push(...sorted);
  }

  return allResults;
}

export async function processDocumentJob(
  job: {
    id?: string;
    data: { documentId: string; projectId?: string };
    attemptsMade?: number;
    opts?: any;
  },
  prismaClient: any = prisma,
) {
  const { documentId } = job.data;
  console.log(`[DocumentWorker] Processing document index for job ${job.id}, doc: ${documentId}`);

  const doc = await prismaClient.document.findUnique({
    where: { id: documentId },
  });

  if (!doc) {
    throw new Error(`Document ${documentId} not found`);
  }

  const meta = (doc.metadata as Record<string, any>) || {};

  // Transition to PROCESSING
  await prismaClient.document.update({
    where: { id: doc.id },
    data: {
      metadata: {
        ...meta,
        status: 'PROCESSING',
        processingStartedAt: new Date().toISOString(),
      },
    },
  });

  try {
    let content = doc.content;
    let extractionMeta: Record<string, any> = {};

    // If binary file on disk, extract text using verified storage boundary
    if (meta.storageKey && doc.projectId) {
      const filePath = await resolveSafeStoragePath(meta.storageKey, doc.projectId);
      const buffer = await fs.readFile(filePath);
      const mimeType = meta.mimeType || 'text/plain';
      const extraction = await extractDocumentBuffer(buffer, mimeType);
      content = extraction.text;
      extractionMeta = {
        charCount: extraction.charCount,
        wordCount: extraction.wordCount,
        pageCount: extraction.pageCount,
      };
    }

    const trimmed = (content || '').trim();
    if (!trimmed) {
      throw new Error('Extracted content is empty');
    }

    // Chunking
    const chunks = chunkText(trimmed);
    if (chunks.length === 0) {
      throw new Error('No chunks generated from document content');
    }

    // Embeddings
    const chunkTexts = chunks.map((c) => c.content);
    const embeddings = await generateEmbeddings(chunkTexts);

    const totalTokens = chunks.reduce((acc, c) => acc + c.tokenCount, 0);

    // Transactional chunk persistence & state transition
    const executePersistence = async (tx: any) => {
      // 1. Delete previous chunks
      await tx.documentChunk.deleteMany({
        where: { documentId: doc.id },
      });

      // 2. Persist new chunks with pgvector
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const emb = embeddings[i];
        const vector = `[${emb.join(',')}]`;

        await tx.$executeRawUnsafe(
          `
          INSERT INTO "DocumentChunk"
            (
              id,
              "documentId",
              "chunkIndex",
              content,
              "tokenCount",
              metadata,
              embedding
            )
          VALUES
            (
              gen_random_uuid(),
              $1,
              $2,
              $3,
              $4,
              $5::jsonb,
              $6::vector
            )
          `,
          doc.id,
          chunk.chunkIndex,
          chunk.content,
          chunk.tokenCount,
          JSON.stringify({
            sourceType: doc.sourceType,
            title: doc.title,
            ...extractionMeta,
          }),
          vector,
        );
      }

      // 3. Update document state to INDEXED inside the same transaction
      await tx.document.update({
        where: { id: doc.id },
        data: {
          content: trimmed,
          indexedAt: new Date(),
          metadata: {
            ...meta,
            ...extractionMeta,
            status: 'INDEXED',
            chunkCount: chunks.length,
            tokenCount: totalTokens,
            indexedAt: new Date().toISOString(),
          },
        },
      });

      // 4. Record DOCUMENT_INDEXED activity event inside transaction
      if (doc.projectId) {
        await tx.activity.create({
          data: {
            projectId: doc.projectId,
            userId: meta.uploadedBy || null,
            type: 'DOCUMENT_INDEXED',
            title: `Indexed document: ${doc.title}`.slice(0, 250),
            description: `Document indexed successfully with ${chunks.length} chunks`,
            entityType: 'DOCUMENT',
            entityId: doc.id,
            metadata: {
              documentId: doc.id,
              jobId: job.id,
              chunkCount: chunks.length,
              tokenCount: totalTokens,
            },
          },
        });
      }
    };

    if (typeof prismaClient.$transaction === 'function') {
      await prismaClient.$transaction(executePersistence);
    } else {
      await executePersistence(prismaClient);
    }

    console.log(`[DocumentWorker] Successfully indexed document ${doc.id} (${chunks.length} chunks, ${totalTokens} tokens)`);
    return { success: true, documentId: doc.id, chunksCreated: chunks.length };
  } catch (err: any) {
    console.error(`[DocumentWorker] Failed to index document ${doc.id}:`, err.message);

    await prismaClient.document.update({
      where: { id: doc.id },
      data: {
        metadata: {
          ...meta,
          status: 'FAILED',
          error: err.message,
          failedAt: new Date().toISOString(),
        },
      },
    }).catch(() => null);

    if (doc.projectId) {
      try {
        let existingEvent: any = null;
        const jobId = typeof job?.id === 'string' && job.id.trim() ? job.id.trim() : null;

        if (jobId && typeof prismaClient.activity?.findFirst === 'function') {
          // Exact lookup using Prisma's native JSON path filter for PostgreSQL
          // Eliminates arbitrary in-memory take limits (e.g. take: 50)
          existingEvent = await prismaClient.activity.findFirst({
            where: {
              projectId: doc.projectId,
              entityType: 'DOCUMENT',
              entityId: doc.id,
              type: 'DOCUMENT_INDEXING_FAILED',
              metadata: {
                path: ['jobId'],
                equals: jobId,
              },
            },
            orderBy: { createdAt: 'desc' },
          });
        }

        const attempts = (job?.attemptsMade || 0) + 1;
        const failureMetadata: Record<string, any> = {
          documentId: doc.id,
          attempts,
          error: (err.message || 'Indexing failed').slice(0, 500),
          lastFailedAt: new Date().toISOString(),
        };
        if (jobId) {
          failureMetadata.jobId = jobId;
        }

        if (existingEvent) {
          // Deduplicate: update existing event instead of creating redundant row on retry
          await prismaClient.activity.update({
            where: { id: existingEvent.id },
            data: {
              description: (err.message || 'Indexing failed').slice(0, 500),
              metadata: {
                ...((existingEvent.metadata as Record<string, any>) || {}),
                ...failureMetadata,
              },
            },
          });
        } else {
          // Initial failure for this job attempt: insert new event
          await prismaClient.activity.create({
            data: {
              projectId: doc.projectId,
              userId: meta.uploadedBy || null,
              type: 'DOCUMENT_INDEXING_FAILED',
              title: `Failed to index document: ${doc.title}`.slice(0, 250),
              description: (err.message || 'Indexing failed').slice(0, 500),
              entityType: 'DOCUMENT',
              entityId: doc.id,
              metadata: failureMetadata,
            },
          });
        }
      } catch (activityErr) {
        console.error(
          '[DocumentWorker] Failed to record indexing failure activity event:',
          (activityErr as any)?.message,
        );
      }
    }

    throw err;
  }
}

export function createDocumentWorker() {
  return new Worker(
    'document-indexing',
    async (job: Job<{ documentId: string; projectId?: string }>) => processDocumentJob(job),
    { connection },
  );
}
