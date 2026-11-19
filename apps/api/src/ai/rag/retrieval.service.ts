<<<<<<< HEAD
import { BadRequestException, Injectable } from '@nestjs/common';
=======
import { Injectable } from '@nestjs/common';
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
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
<<<<<<< HEAD
    distanceThreshold?: number,
  ): Promise<RetrievedChunk[]> {
    if (!projectId || typeof projectId !== 'string' || !projectId.trim()) {
      throw new BadRequestException('Valid projectId is required for retrieval');
    }

    if (
      distanceThreshold !== undefined &&
      (typeof distanceThreshold !== 'number' ||
        !Number.isFinite(distanceThreshold) ||
        isNaN(distanceThreshold) ||
        distanceThreshold < 0 ||
        distanceThreshold > 2)
    ) {
      throw new BadRequestException(
        'Distance threshold must be a finite number between 0 and 2',
      );
    }

    // Clamp candidate retrieval limit strictly between 1 and 20
    const boundedLimit = Math.min(
      Math.max(Math.floor(Number(limit)) || 8, 1),
      20,
    );

    const vector = `[${embedding.join(',')}]`;

    const results = await this.prisma.$queryRawUnsafe<RetrievedChunk[]>(
=======
  ): Promise<RetrievedChunk[]> {
    const vector = `[${embedding.join(',')}]`;

    const results = await this.prisma.$queryRawUnsafe<
      RetrievedChunk[]
    >(
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
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
<<<<<<< HEAD
      ORDER BY
        dc.embedding <=> $1::vector ASC,
        dc."chunkIndex" ASC,
        dc.id ASC
=======
      ORDER BY dc.embedding <=> $1::vector
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
      LIMIT $3
      `,
      vector,
      projectId,
<<<<<<< HEAD
      boundedLimit,
    );

    // Apply distance threshold filter if specified.
    // pgvector cosine distance: 0 = identical, 2 = opposite.
    if (distanceThreshold !== undefined) {
      return results.filter((r) => r.distance <= distanceThreshold);
    }

=======
      limit,
    );

>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
    return results;
  }
}