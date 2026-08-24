import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);

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