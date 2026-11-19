import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
<<<<<<< HEAD
  private readonly dimension = 1536;
  private readonly defaultModel = 'text-embedding-3-small';

  /**
   * Generate semantic embedding vector for a single text input using OpenAI API.
   * Throws an error if API key is not configured or if the embedding request fails.
   * NO synthetic, polynomial, trigonometric, or sine-wave fallbacks are allowed.
   */
  async embed(text: string): Promise<number[]> {
    const results = await this.embedMany([text]);
    if (!results[0] || results[0].length !== this.dimension) {
      throw new Error(`Embedding generation returned invalid vector dimensions (expected ${this.dimension})`);
    }
    return results[0];
  }

  /**
   * Generate semantic embedding vectors for multiple texts in batch using OpenAI API.
   * Throws an error if API key is not configured or if any request fails.
   */
  async embedMany(texts: string[]): Promise<number[][]> {
    if (!texts || texts.length === 0) {
      return [];
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      this.logger.error('OPENAI_API_KEY is not configured. Clean semantic embedding failure.');
      throw new Error('OPENAI_API_KEY is required for semantic embeddings. Ingestion aborted.');
    }

    const model = process.env.AI_EMBEDDING_MODEL || this.defaultModel;
    const batchSize = 100;
    const allEmbeddings: number[][] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize).map((t) => t.slice(0, 8000));

      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          input: batch,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => 'Unknown error');
        this.logger.error(`OpenAI embedding request failed (${response.status}): ${errorBody}`);
        throw new Error(`OpenAI embedding failed with status ${response.status}: ${errorBody}`);
      }

      const data = (await response.json()) as {
        data: Array<{ embedding: number[]; index: number }>;
      };

      if (!data?.data || data.data.length !== batch.length) {
        throw new Error(
          `OpenAI embedding returned unexpected data count: expected ${batch.length}, received ${data?.data?.length ?? 0}`,
        );
      }

      const sortedEmbeddings = data.data
        .sort((a, b) => a.index - b.index)
        .map((item) => {
          if (item.embedding.length !== this.dimension) {
            throw new Error(
              `Embedding vector dimension mismatch: expected ${this.dimension}, received ${item.embedding.length}`,
            );
          }
          return item.embedding;
        });

      allEmbeddings.push(...sortedEmbeddings);
    }

    return allEmbeddings;
  }
}
=======

  async embed(text: string): Promise<number[]> {
    this.logger.warn(
      'OpenAI API key not configured. Returning empty embedding.',
    );

    return [];
  }

  async embedMany(texts: string[]): Promise<number[][]> {
    this.logger.warn(
      'OpenAI API key not configured. Returning empty embeddings.',
    );

    return texts.map(() => []);
  }
}
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
