<<<<<<< HEAD
import { Injectable, Logger, NotFoundException, Optional } from '@nestjs/common';
import { ActivityService } from '../activity/activity.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { StorageService } from './storage/storage.service.js';
=======
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
import { CreateDocumentDto } from './dto/create-document.dto.js';
import { UpdateDocumentDto } from './dto/update-document.dto.js';
import { CreateChunkDto } from './dto/create-chunk.dto.js';

@Injectable()
export class DocumentsService {
<<<<<<< HEAD
  private readonly logger = new Logger(DocumentsService.name);

  private readonly storage: StorageService;

  constructor(
    private readonly prisma: PrismaService,
    storageService?: StorageService,
    @Optional() private readonly activityService?: ActivityService,
  ) {
    this.storage = storageService || new StorageService();
  }

  async create(dto: CreateDocumentDto, actorUserId?: string) {
    const execute = async (tx: any) => {
      const doc = await tx.document.create({
        data: {
          projectId: dto.projectId,
          repositoryId: dto.repositoryId,
          sourceType: dto.sourceType,
          externalId: dto.externalId,
          title: dto.title,
          content: dto.content,
          sourceUrl: dto.sourceUrl,
          checksum: dto.checksum,
          metadata: dto.metadata as any,
        },
      });

      if (this.activityService && dto.projectId) {
        await this.activityService.createEvent(
          {
            projectId: dto.projectId,
            userId: actorUserId || null,
            type: 'DOCUMENT_CREATED',
            title: `Created document: ${dto.title}`.slice(0, 250),
            entityType: 'DOCUMENT',
            entityId: doc.id,
            metadata: {
              documentId: doc.id,
              title: dto.title,
              sourceType: dto.sourceType,
            },
          },
          tx,
        );
      }

      return doc;
    };

    if (typeof this.prisma?.$transaction === 'function') {
      return this.prisma.$transaction(execute);
    }
    return execute(this.prisma);
  }

  async createUploadedDocument(params: {
    projectId: string;
    title: string;
    userId: string;
    storageKey: string;
    storagePath: string;
    originalFilename: string;
    mimeType: string;
    fileSize: number;
    checksum: string;
  }) {
    const execute = async (tx: any) => {
      const document = await tx.document.create({
        data: {
          projectId: params.projectId,
          title: params.title,
          content: `[Uploaded document: ${params.originalFilename} (${params.fileSize} bytes) - Pending text extraction]`,
          sourceType: 'DOCUMENTATION',
          checksum: params.checksum,
          sourceUrl: `/api/documents/download/${params.storageKey}`,
          metadata: {
            storageKey: params.storageKey,
            storagePath: params.storagePath,
            originalFilename: params.originalFilename,
            mimeType: params.mimeType,
            fileSize: params.fileSize,
            uploadedBy: params.userId,
            status: 'UPLOADED',
          },
        },
      });

      if (this.activityService) {
        await this.activityService.createEvent(
          {
            projectId: params.projectId,
            userId: params.userId,
            type: 'DOCUMENT_CREATED',
            title: `Uploaded document: ${params.title}`.slice(0, 250),
            entityType: 'DOCUMENT',
            entityId: document.id,
            metadata: {
              documentId: document.id,
              originalFilename: params.originalFilename,
              mimeType: params.mimeType,
              fileSize: params.fileSize,
            },
          },
          tx,
        );
      }

      return document;
    };

    if (typeof this.prisma?.$transaction === 'function') {
      return this.prisma.$transaction(execute);
    }
    return execute(this.prisma);
=======
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDocumentDto) {
    return this.prisma.document.create({
      data: {
        projectId: dto.projectId,
        repositoryId: dto.repositoryId,
        sourceType: dto.sourceType,
        externalId: dto.externalId,
        title: dto.title,
        content: dto.content,
        sourceUrl: dto.sourceUrl,
        checksum: dto.checksum,
        metadata: dto.metadata as any,
      },
    });
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
  }

  async findAll(projectId?: string, repositoryId?: string) {
    return this.prisma.document.findMany({
      where: {
        ...(projectId ? { projectId } : {}),
        ...(repositoryId ? { repositoryId } : {}),
      },
      include: {
        chunks: {
          orderBy: {
            chunkIndex: 'asc',
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

<<<<<<< HEAD
  async findAllForProjects(projectIds: string[], repositoryId?: string) {
    return this.prisma.document.findMany({
      where: {
        projectId: { in: projectIds },
        ...(repositoryId ? { repositoryId } : {}),
      },
      include: {
        chunks: {
          orderBy: {
            chunkIndex: 'asc',
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

=======
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
  async findOne(id: string) {
    const document = await this.prisma.document.findUnique({
      where: { id },
      include: {
        chunks: {
          orderBy: {
            chunkIndex: 'asc',
          },
        },
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return document;
  }

  async update(id: string, dto: UpdateDocumentDto) {
    await this.findOne(id);

    return this.prisma.document.update({
      where: { id },
      data: {
        projectId: dto.projectId,
        repositoryId: dto.repositoryId,
        sourceType: dto.sourceType,
        externalId: dto.externalId,
        title: dto.title,
        content: dto.content,
        sourceUrl: dto.sourceUrl,
        checksum: dto.checksum,
        metadata: dto.metadata as any,
<<<<<<< HEAD
        indexedAt: dto.indexedAt ? new Date(dto.indexedAt) : undefined,
=======
        indexedAt: dto.indexedAt
          ? new Date(dto.indexedAt)
          : undefined,
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
      },
    });
  }

<<<<<<< HEAD
  async remove(id: string, actorUserId?: string) {
    const document = await this.findOne(id);
    const storageKey = (document.metadata as any)?.storageKey;
    const projectId = document.projectId;

    const execute = async (tx: any) => {
      const deletedDocument = await tx.document.delete({
        where: { id },
      });

      if (this.activityService && projectId) {
        await this.activityService.createEvent(
          {
            projectId,
            userId: actorUserId || (document.metadata as any)?.uploadedBy || null,
            type: 'DOCUMENT_DELETED',
            title: `Deleted document: ${document.title}`.slice(0, 250),
            entityType: 'DOCUMENT',
            entityId: id,
            metadata: {
              documentId: id,
              title: document.title,
            },
          },
          tx,
        );
      }

      return deletedDocument;
    };

    let deletedDocument: any;
    if (typeof this.prisma?.$transaction === 'function') {
      deletedDocument = await this.prisma.$transaction(execute);
    } else {
      deletedDocument = await execute(this.prisma);
    }

    // Clean up physical file after database deletion succeeds
    if (storageKey && projectId) {
      try {
        await this.storage.deleteFile(storageKey, projectId);
      } catch (err: any) {
        this.logger.warn(
          `[StorageCleanupPending] Could not delete physical file for deleted document ${id} (key: ${storageKey}): ${err.message}`,
        );
      }
    }

    return deletedDocument;
=======
  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.document.delete({
      where: { id },
    });
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
  }

  async createChunk(dto: CreateChunkDto) {
    await this.findOne(dto.documentId);

    return this.prisma.documentChunk.create({
      data: {
        documentId: dto.documentId,
        chunkIndex: dto.chunkIndex,
        content: dto.content,
        tokenCount: dto.tokenCount,
        metadata: dto.metadata as any,
      },
    });
  }

  async getChunks(documentId: string) {
    await this.findOne(documentId);

    return this.prisma.documentChunk.findMany({
      where: { documentId },
      orderBy: {
        chunkIndex: 'asc',
      },
    });
  }

  async deleteChunk(id: string) {
    return this.prisma.documentChunk.delete({
      where: { id },
    });
  }
<<<<<<< HEAD

  getStorageService(): StorageService {
    return this.storage;
  }
}
=======
}
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
