import { Injectable } from '@nestjs/common';

export interface DocumentChunkData {
  chunkIndex: number;
  content: string;
  tokenCount: number;
}

@Injectable()
export class ChunkingService {
  private readonly chunkSize = 1200;
  private readonly overlap = 200;

  chunk(content: string): DocumentChunkData[] {
    const text = content.trim();

    if (!text) {
      return [];
    }

    const chunks: DocumentChunkData[] = [];
    let start = 0;
    let index = 0;

    while (start < text.length) {
      let end = Math.min(start + this.chunkSize, text.length);

      if (end < text.length) {
        const paragraphBreak = text.lastIndexOf('\n\n', end);

        if (paragraphBreak > start + this.chunkSize * 0.6) {
          end = paragraphBreak;
        } else {
          const sentenceBreak = Math.max(
            text.lastIndexOf('. ', end),
            text.lastIndexOf('! ', end),
            text.lastIndexOf('? ', end),
          );

          if (sentenceBreak > start + this.chunkSize * 0.6) {
            end = sentenceBreak + 1;
          }
        }
      }

      const chunk = text.slice(start, end).trim();

      if (chunk) {
        chunks.push({
          chunkIndex: index++,
          content: chunk,
          tokenCount: this.estimateTokens(chunk),
        });
      }

      if (end >= text.length) {
        break;
      }

      start = Math.max(end - this.overlap, start + 1);
    }

    return chunks;
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }
}
