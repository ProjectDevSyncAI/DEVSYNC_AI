import { Injectable } from '@nestjs/common';
import { RetrievedChunk } from './retrieval.service.js';

@Injectable()
export class ContextService {
  buildContext(chunks: RetrievedChunk[]): string {
    if (chunks.length === 0) {
      return '';
    }

    return chunks
      .map(
        (chunk, index) =>
          `[Source ${index + 1}]\n${chunk.content}`,
      )
      .join('\n\n---\n\n');
  }
}