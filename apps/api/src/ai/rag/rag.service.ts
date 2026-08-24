import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { ChunkingService } from './chunking.service.js';
import { EmbeddingService } from './embedding.service.js';
import { RetrievalService } from './retrieval.service.js';
import { RerankingService } from './reranking.service.js';
import { ContextService } from './context.service.js';

@Injectable()
export class RagService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chunkingService: ChunkingService,
    private readonly embeddingService: EmbeddingService,
    private readonly retrievalService: RetrievalService,
    private readonly rerankingService: RerankingService,
    private readonly contextService: ContextService,
  ) {}

  async indexDocument(documentId: string) {
    const document = await this.prisma.document.findUnique({
      where: {
        id: documentId,
      },
    });

    if (!document) {
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
  }

  async search(
    projectId: string,
    query: string,
    limit = 5,
  ) {
    const embedding =
      await this.embeddingService.embed(query);

    const retrieved =
      await this.retrievalService.search(
        projectId,
        embedding,
        Math.max(limit * 2, 8),
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
}