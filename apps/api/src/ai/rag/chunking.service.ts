import { Injectable } from '@nestjs/common';
<<<<<<< HEAD
import { encode, decode } from 'gpt-tokenizer';
=======
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c

export interface DocumentChunkData {
  chunkIndex: number;
  content: string;
  tokenCount: number;
}

@Injectable()
export class ChunkingService {
<<<<<<< HEAD
  private readonly chunkSize = 800;
  private readonly overlap = 120;

  /**
   * Split document content into token-bounded chunks (800 tokens max, 120 overlap)
   * preferring paragraph and sentence boundaries.
   */
  chunk(content: string, customChunkSize?: number, customOverlap?: number): DocumentChunkData[] {
=======
  private readonly chunkSize = 1200;
  private readonly overlap = 200;

  chunk(content: string): DocumentChunkData[] {
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
    const text = content.trim();

    if (!text) {
      return [];
    }

<<<<<<< HEAD
    const effectiveChunkSize = customChunkSize ?? this.chunkSize;
    const effectiveOverlap = customOverlap ?? this.overlap;

    const allTokens = encode(text);

    if (allTokens.length <= effectiveChunkSize) {
      return [
        {
          chunkIndex: 0,
          content: text,
          tokenCount: allTokens.length,
        },
      ];
    }

=======
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
    const chunks: DocumentChunkData[] = [];
    let start = 0;
    let index = 0;

<<<<<<< HEAD
    while (start < allTokens.length) {
      const end = Math.min(start + effectiveChunkSize, allTokens.length);
      const sliceTokens = allTokens.slice(start, end);
      let chunkText = decode(sliceTokens).trim();

      if (end < allTokens.length) {
        const minCutoff = Math.floor(chunkText.length * 0.7);
        const paragraphBreak = chunkText.lastIndexOf('\n\n');

        if (paragraphBreak > minCutoff) {
          chunkText = chunkText.slice(0, paragraphBreak).trim();
        } else {
          const sentenceBreak = Math.max(
            chunkText.lastIndexOf('. '),
            chunkText.lastIndexOf('! '),
            chunkText.lastIndexOf('? '),
          );

          if (sentenceBreak > minCutoff) {
            chunkText = chunkText.slice(0, sentenceBreak + 1).trim();
=======
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
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
          }
        }
      }

<<<<<<< HEAD
      if (chunkText) {
        const actualTokens = encode(chunkText).length;
        chunks.push({
          chunkIndex: index++,
          content: chunkText,
          tokenCount: actualTokens,
        });

        if (end >= allTokens.length) {
          break;
        }

        const advance = Math.max(1, actualTokens - effectiveOverlap);
        start += advance;
      } else {
        // Fallback progress if trimming resulted in empty string
        start += Math.max(1, effectiveChunkSize - effectiveOverlap);
      }
=======
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
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
    }

    return chunks;
  }

<<<<<<< HEAD
  /**
   * Count tokens using GPT tokenizer (cl100k_base / text-embedding-3-small)
   */
  countTokens(text: string): number {
    if (!text || !text.trim()) {
      return 0;
    }
    return encode(text.trim()).length;
=======
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
  }
}
