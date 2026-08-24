import { Injectable } from '@nestjs/common';
import { RetrievedChunk } from './retrieval.service.js';

@Injectable()
export class RerankingService {
  rerank(
    chunks: RetrievedChunk[],
    limit = 5,
  ): RetrievedChunk[] {
    return [...chunks]
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);
  }
}