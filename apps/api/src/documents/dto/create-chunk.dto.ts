export class CreateChunkDto {
  documentId!: string;
  chunkIndex!: number;
  content!: string;
  tokenCount?: number;
  metadata?: Record<string, unknown>;
}