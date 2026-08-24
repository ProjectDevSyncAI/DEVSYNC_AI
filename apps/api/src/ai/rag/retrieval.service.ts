import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';

export interface RetrievedChunk {
  id: string;
  documentId: string;
  chunkIndex: number;
  content: string;
  tokenCount: number | null;
  metadata: unknown;
  distance: number;
}

@Injectable()
export class RetrievalService {
  constructor(private readonly prisma: PrismaService) {}

  async search(
    projectId: string,
    embedding: number[],
    limit = 8,
  ): Promise<RetrievedChunk[]> {
    const vector = `[${embedding.join(',')}]`;

    const results = await this.prisma.$queryRawUnsafe<
      RetrievedChunk[]
    >(
      `
      SELECT
        dc.id,
        dc."documentId",
        dc."chunkIndex",
        dc.content,
        dc."tokenCount",
        dc.metadata,
        (dc.embedding <=> $1::vector) AS distance
      FROM "DocumentChunk" dc
      INNER JOIN "Document" d
        ON d.id = dc."documentId"
      WHERE d."projectId" = $2
        AND dc.embedding IS NOT NULL
      ORDER BY dc.embedding <=> $1::vector
      LIMIT $3
      `,
      vector,
      projectId,
      limit,
    );

    return results;
  }
}