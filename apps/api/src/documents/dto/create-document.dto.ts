<<<<<<< HEAD
import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { DocumentSourceType } from '../../generated/prisma/client.js';

export class CreateDocumentDto {
  @IsNotEmpty({ message: 'Project ID is required' })
  @IsUUID('all', { message: 'Project ID must be a valid UUID' })
  projectId!: string;

  @IsOptional()
  @IsUUID('all', { message: 'Repository ID must be a valid UUID' })
=======
import { DocumentSourceType } from '../../generated/prisma/client.js';

export class CreateDocumentDto {
  projectId?: string;
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
  repositoryId?: string;

  sourceType!: DocumentSourceType;

<<<<<<< HEAD
  @IsOptional()
  @IsString()
  @MaxLength(250)
  externalId?: string;

  @IsNotEmpty({ message: 'Document title is required' })
  @IsString()
  @MaxLength(300)
  title!: string;

  @IsString()
  content!: string;

  @IsOptional()
  @IsString()
  sourceUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  checksum?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}
=======
  externalId?: string;
  title!: string;
  content!: string;
  sourceUrl?: string;
  checksum?: string;
  metadata?: Record<string, unknown>;
}
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
