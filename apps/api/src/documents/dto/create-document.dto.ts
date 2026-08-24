import { DocumentSourceType } from '../../generated/prisma/client.js';

export class CreateDocumentDto {
  projectId?: string;
  repositoryId?: string;

  sourceType!: DocumentSourceType;

  externalId?: string;
  title!: string;
  content!: string;
  sourceUrl?: string;
  checksum?: string;
  metadata?: Record<string, unknown>;
}