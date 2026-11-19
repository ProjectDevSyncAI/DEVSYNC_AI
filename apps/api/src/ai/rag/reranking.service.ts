import { Injectable } from '@nestjs/common';
import { RetrievedChunk } from './retrieval.service.js';

@Injectable()
export class RerankingService {
<<<<<<< HEAD
  /**
   * Distance-based ranking: orders candidate chunks ascending by cosine distance,
   * breaking ties deterministically with chunkIndex ASC and id ASC.
   * Note: This is an exact distance-based ranker, not a cross-encoder ML model.
   */
=======
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
  rerank(
    chunks: RetrievedChunk[],
    limit = 5,
  ): RetrievedChunk[] {
<<<<<<< HEAD
    const boundedLimit = Math.min(
      Math.max(Math.floor(Number(limit)) || 5, 1),
      20,
    );

    return [...chunks]
      .sort((a, b) => {
        // Primary criterion: cosine distance ASC
        if (a.distance !== b.distance) {
          return a.distance - b.distance;
        }
        // Secondary criterion: chunkIndex ASC
        if (a.chunkIndex !== b.chunkIndex) {
          return a.chunkIndex - b.chunkIndex;
        }
        // Final unique tie-breaker: id ASC
        return a.id.localeCompare(b.id);
      })
      .slice(0, boundedLimit);
=======
    return [...chunks]
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
  }
}