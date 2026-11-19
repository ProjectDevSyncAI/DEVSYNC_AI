<<<<<<< HEAD
import { Injectable, Logger, Optional } from '@nestjs/common';
=======
import { Injectable } from '@nestjs/common';
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
import { PrismaService } from '../../database/prisma.service.js';
import { ChunkingService } from './chunking.service.js';
import { EmbeddingService } from './embedding.service.js';
import { RetrievalService } from './retrieval.service.js';
import { RerankingService } from './reranking.service.js';
import { ContextService } from './context.service.js';
<<<<<<< HEAD
import { DocumentExtractionService } from '../../documents/extraction/document-extraction.service.js';
import { StorageService } from '../../documents/storage/storage.service.js';

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);

=======

@Injectable()
export class RagService {
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
  constructor(
    private readonly prisma: PrismaService,
    private readonly chunkingService: ChunkingService,
    private readonly embeddingService: EmbeddingService,
    private readonly retrievalService: RetrievalService,
    private readonly rerankingService: RerankingService,
    private readonly contextService: ContextService,
<<<<<<< HEAD
    @Optional() private readonly extractionService?: DocumentExtractionService,
    @Optional() private readonly storageService?: StorageService,
  ) {}

  /**
   * Complete end-to-end document indexing lifecycle:
   * 1. Retrieve document
   * 2. Transition state to PROCESSING
   * 3. Extract text from disk file if binary uploaded document
   * 4. Token-bounded chunking
   * 5. Generate semantic embeddings (zero sine-wave fallback)
   * 6. Transactionally persist chunks in DocumentChunk with pgvector and set INDEXED
   * 7. Transition state to FAILED on any error (with automatic rollback of partial chunks)
   */
=======
  ) {}

>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
  async indexDocument(documentId: string) {
    const document = await this.prisma.document.findUnique({
      where: {
        id: documentId,
      },
    });

    if (!document) {
<<<<<<< HEAD
      throw new Error(`Document ${documentId} not found`);
    }

    const currentMeta = (document.metadata as Record<string, any>) || {};

    // 1. Mark status as PROCESSING
    await this.prisma.document.update({
      where: { id: documentId },
      data: {
        metadata: {
          ...currentMeta,
          status: 'PROCESSING',
          processingStartedAt: new Date().toISOString(),
        },
      },
    });

    try {
      let contentToIndex = document.content;
      let extractionMeta: Record<string, any> = {};

      // 2. Extract text if binary file stored on disk
      const storageKey = currentMeta.storageKey;
      if (storageKey && document.projectId && this.extractionService && this.storageService) {
        try {
          const filePath = await this.storageService.getPhysicalPath(storageKey, document.projectId);
          const mimeType = currentMeta.mimeType || 'text/plain';
          const extraction = await this.extractionService.extractDocument(filePath, mimeType);
          contentToIndex = extraction.text;
          extractionMeta = {
            charCount: extraction.metadata.charCount,
            wordCount: extraction.metadata.wordCount,
            pageCount: extraction.metadata.pageCount,
          };
        } catch (extractionErr: any) {
          this.logger.error(`Text extraction failed for document ${documentId}: ${extractionErr.message}`);
          await this.markDocumentFailed(documentId, currentMeta, `Extraction failed: ${extractionErr.message}`);
          throw extractionErr;
        }
      }

      const trimmedContent = (contentToIndex || '').trim();
      if (!trimmedContent) {
        const errMsg = 'Extracted document content is empty (0 characters)';
        await this.markDocumentFailed(documentId, currentMeta, errMsg);
        throw new Error(errMsg);
      }

      // 3. Chunk text using token chunking service
      const chunks = this.chunkingService.chunk(trimmedContent);

      if (chunks.length === 0) {
        const errMsg = 'Chunking yielded 0 chunks for document content';
        await this.markDocumentFailed(documentId, currentMeta, errMsg);
        throw new Error(errMsg);
      }

      // 4. Generate real semantic embeddings
      const chunkTexts = chunks.map((chunk) => chunk.content);
      const embeddings = await this.embeddingService.embedMany(chunkTexts);

      if (embeddings.length !== chunks.length) {
        const errMsg = `Embedding count mismatch: expected ${chunks.length}, received ${embeddings.length}`;
        await this.markDocumentFailed(documentId, currentMeta, errMsg);
        throw new Error(errMsg);
      }

      const totalTokens = chunks.reduce((acc, c) => acc + c.tokenCount, 0);

      // 5, 6, 7. Atomic transaction: delete old chunks, insert new pgvector chunks, update status to INDEXED
      await this.prisma.$transaction(async (tx) => {
        // Delete previous chunks for idempotent re-indexing
        await tx.documentChunk.deleteMany({
          where: {
            documentId,
          },
        });

        // Persist chunks with pgvector
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          const embedding = embeddings[i];
          const vector = `[${embedding.join(',')}]`;

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
            documentId,
            chunk.chunkIndex,
            chunk.content,
            chunk.tokenCount,
            JSON.stringify({
              sourceType: document.sourceType,
              title: document.title,
              ...extractionMeta,
            }),
            vector,
          );
        }

        // Transition state to INDEXED within the same transaction
        await tx.document.update({
          where: {
            id: documentId,
          },
          data: {
            content: trimmedContent, // Store the extracted plain text
            indexedAt: new Date(),
            metadata: {
              ...currentMeta,
              ...extractionMeta,
              status: 'INDEXED',
              chunkCount: chunks.length,
              tokenCount: totalTokens,
              indexedAt: new Date().toISOString(),
            },
          },
        });
      });

      this.logger.log(`Document ${documentId} indexed successfully with ${chunks.length} chunks (${totalTokens} tokens)`);

      return {
        documentId,
        chunksCreated: chunks.length,
        totalTokens,
        status: 'INDEXED',
      };
    } catch (err: any) {
      await this.markDocumentFailed(documentId, currentMeta, err.message).catch(() => null);
      throw err;
    }
  }

  private async markDocumentFailed(documentId: string, currentMeta: Record<string, any>, errorMsg: string) {
    try {
      await this.prisma.document.update({
        where: { id: documentId },
        data: {
          metadata: {
            ...currentMeta,
            status: 'FAILED',
            error: errorMsg,
            failedAt: new Date().toISOString(),
          },
        },
      });
    } catch (updateErr: any) {
      this.logger.error(`Could not record FAILED status for document ${documentId}: ${updateErr.message}`);
    }
=======
      throw new Error('Document not found');
    }

    const chunks = this.chunkingService.chunk(document.content);

    if (chunks.length === 0) {
      return {
        documentId,
        chunksCreated: 0,
      };
    }

    const embeddings =
      await this.embeddingService.embedMany(
        chunks.map((chunk) => chunk.content),
      );

    await this.prisma.documentChunk.deleteMany({
      where: {
        documentId,
      },
    });

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = embeddings[i];

      const vector = `[${embedding.join(',')}]`;

      await this.prisma.$executeRawUnsafe(
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
        documentId,
        chunk.chunkIndex,
        chunk.content,
        chunk.tokenCount,
        JSON.stringify({
          sourceType: document.sourceType,
          title: document.title,
        }),
        vector,
      );
    }

    await this.prisma.document.update({
      where: {
        id: documentId,
      },
      data: {
        indexedAt: new Date(),
      },
    });

    return {
      documentId,
      chunksCreated: chunks.length,
    };
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
  }

  async search(
    projectId: string,
    query: string,
    limit = 5,
<<<<<<< HEAD
    distanceThreshold?: number,
=======
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
  ) {
    const embedding =
      await this.embeddingService.embed(query);

    const retrieved =
      await this.retrievalService.search(
        projectId,
        embedding,
        Math.max(limit * 2, 8),
<<<<<<< HEAD
        distanceThreshold,
=======
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
      );

    const reranked =
      this.rerankingService.rerank(
        retrieved,
        limit,
      );

    return {
      query,
      chunks: reranked,
      context:
        this.contextService.buildContext(reranked),
    };
  }
<<<<<<< HEAD
}
=======
}
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
