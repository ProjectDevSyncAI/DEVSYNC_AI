import {
<<<<<<< HEAD
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
=======
  Body,
  Controller,
  Delete,
  Get,
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
  Param,
  Patch,
  Post,
  Query,
<<<<<<< HEAD
  Req,
  Res,
  UnauthorizedException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { ProjectUploadGuard } from './guards/project-upload.guard.js';
import { ReconciliationAuthGuard } from './guards/reconciliation-auth.guard.js';
import { PrismaService } from '../database/prisma.service.js';
import {
  assertProjectAccess,
  getAuthorizedProjectIds,
} from '../common/helpers/project-access.helper.js';
import { DocumentsService } from './documents.service.js';
import { StorageService } from './storage/storage.service.js';
import { DocumentQueueService } from './queues/document-queue.service.js';
import { DocumentReconciliationService } from './queues/document-reconciliation.service.js';
import { FileUploadValidator } from './validators/file-upload.validator.js';
=======
} from '@nestjs/common';

import { DocumentsService } from './documents.service.js';
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
import { CreateDocumentDto } from './dto/create-document.dto.js';
import { UpdateDocumentDto } from './dto/update-document.dto.js';
import { CreateChunkDto } from './dto/create-chunk.dto.js';

<<<<<<< HEAD
interface MulterLikeFile {
  buffer?: Buffer;
  originalname?: string;
  size?: number;
  mimetype?: string;
}

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(
    private readonly documentsService: DocumentsService,
    private readonly prisma: PrismaService,
    private readonly storageService?: StorageService,
    private readonly documentQueueService?: DocumentQueueService,
    private readonly reconciliationService?: DocumentReconciliationService,
  ) {}

  private getActiveStorageService(): StorageService {
    if (this.storageService) {
      return this.storageService;
    }
    return this.documentsService.getStorageService();
  }

  /**
   * Secure multipart/form-data upload endpoint.
   * Mandates projectId, verifies user project authorization, validates file signature & size,
   * stores file on persistent disk, and records metadata in database.
   */
  @Post('upload')
  @UseGuards(ProjectUploadGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @Req() req: any,
    @UploadedFile() file: MulterLikeFile,
    @Body('projectId') bodyProjectId?: string,
    @Body('title') title?: string,
    @Query('projectId') queryProjectId?: string,
  ) {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('Authentication required');
    }

    const projectId =
      req.authorizedProjectId ||
      bodyProjectId ||
      queryProjectId ||
      req.headers?.['x-project-id'] ||
      req.query?.projectId ||
      req.body?.projectId;

    // 1. Mandatory Project ID validation
    if (!projectId || typeof projectId !== 'string' || !projectId.trim()) {
      throw new BadRequestException('Project ID is required for document upload');
    }

    const cleanProjectId = projectId.trim();

    // 2. Project access authorization (enforced if not pre-authorized by ProjectUploadGuard)
    if (!req.authorizedProjectId) {
      await assertProjectAccess(this.prisma, userId, cleanProjectId);
    }

    // 3. File presence & format/signature validation
    const { sanitizedFilename, mimeType } = FileUploadValidator.validate(file);

    const docTitle = title && title.trim() ? title.trim().slice(0, 300) : sanitizedFilename;

    // 4. Save file to persistent storage
    const storageService = this.getActiveStorageService();
    const stored = await storageService.saveFile(
      {
        buffer: file.buffer!,
        originalname: sanitizedFilename,
        mimetype: mimeType,
        size: file.size ?? file.buffer!.length,
      },
      cleanProjectId,
    );

    // 5. Database persistence with rollback on failure
    try {
      const document = await this.documentsService.createUploadedDocument({
        projectId: cleanProjectId,
        title: docTitle,
        userId,
        storageKey: stored.storageKey,
        storagePath: stored.storagePath,
        originalFilename: sanitizedFilename,
        mimeType: stored.mimeType,
        fileSize: stored.size,
        checksum: stored.checksum,
      });

      // Enqueue document for background ingestion pipeline
      if (this.documentQueueService) {
        const enqueueResult = await this.documentQueueService.enqueueDocumentIndexing(
          document.id,
          cleanProjectId,
          (document.metadata as any)?.status || 'UPLOADED',
          async (docId: string) => {
            const fresh = await this.documentsService.findOne(docId);
            return (fresh?.metadata as any)?.status === 'INDEXED';
          },
        );

        if (!enqueueResult.enqueued) {
          await this.documentsService.update(document.id, {
            metadata: {
              ...(document.metadata as any),
              queueStatus: 'ENQUEUE_FAILED',
              queueError: enqueueResult.error,
            },
          });
        }
      }

      return document;
    } catch (dbErr) {
      // Rollback stored file if database persistence fails
      await storageService.deleteFile(stored.storageKey, cleanProjectId).catch(() => null);
      throw dbErr;
    }
  }

  /**
   * Secure binary file download endpoint.
   * Verifies user authorization to the associated project before sending file content.
   */
  @Get(':id/download')
  async downloadFile(
    @Req() req: any,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('Authentication required');
    }

    const document = await this.documentsService.findOne(id);

    // Fail closed on legacy documents without projectId
    if (!document.projectId) {
      throw new ForbiddenException('Access denied: legacy document without project association');
    }

    await assertProjectAccess(this.prisma, userId, document.projectId);

    const meta = document.metadata as Record<string, any> | null;
    const storageKey = meta?.storageKey;

    if (!storageKey) {
      throw new NotFoundException('No binary file associated with this document');
    }

    const storageService = this.getActiveStorageService();
    const buffer = await storageService.getFile(storageKey, document.projectId);

    const filename = meta?.originalFilename || document.title || 'document';
    const mimeType = meta?.mimeType || 'application/octet-stream';

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(filename)}"`,
    );

    return res.end(buffer);
  }

  /**
   * JSON document creation.
   * Mandates projectId and verifies project authorization.
   */
  @Post()
  async create(@Req() req: any, @Body() dto: CreateDocumentDto) {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('Authentication required');
    }

    if (!dto.projectId || typeof dto.projectId !== 'string' || !dto.projectId.trim()) {
      throw new BadRequestException('Project ID is required for all new documents');
    }

    const cleanProjectId = dto.projectId.trim();
    await assertProjectAccess(this.prisma, userId, cleanProjectId);

    return this.documentsService.create(
      {
        ...dto,
        projectId: cleanProjectId,
      },
      userId,
    );
  }

  @Get()
  async findAll(
    @Req() req: any,
    @Query('projectId') projectId?: string,
    @Query('repositoryId') repositoryId?: string,
  ) {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('Authentication required');
    }

    if (projectId) {
      await assertProjectAccess(this.prisma, userId, projectId);
      return this.documentsService.findAll(projectId, repositoryId);
    }

    const authorizedProjectIds = await getAuthorizedProjectIds(
      this.prisma,
      userId,
    );

    return this.documentsService.findAllForProjects(
      authorizedProjectIds,
=======
@Controller('documents')
export class DocumentsController {
  constructor(
    private readonly documentsService: DocumentsService,
  ) {}

  @Post()
  create(@Body() dto: CreateDocumentDto) {
    return this.documentsService.create(dto);
  }

  @Get()
  findAll(
    @Query('projectId') projectId?: string,
    @Query('repositoryId') repositoryId?: string,
  ) {
    return this.documentsService.findAll(
      projectId,
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
      repositoryId,
    );
  }

  @Get(':id')
<<<<<<< HEAD
  async findOne(@Req() req: any, @Param('id') id: string) {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('Authentication required');
    }

    const document = await this.documentsService.findOne(id);

    // Fail closed on legacy documents without projectId
    if (!document.projectId) {
      throw new ForbiddenException('Access denied: legacy document without project association');
    }

    await assertProjectAccess(this.prisma, userId, document.projectId);
    return document;
  }

  @Patch(':id')
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateDocumentDto,
  ) {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('Authentication required');
    }

    const document = await this.documentsService.findOne(id);

    // Fail closed on legacy documents without projectId
    if (!document.projectId) {
      throw new ForbiddenException('Access denied: legacy document without project association');
    }

    await assertProjectAccess(this.prisma, userId, document.projectId);

    if (dto.projectId && dto.projectId !== document.projectId) {
      await assertProjectAccess(this.prisma, userId, dto.projectId);
    }

=======
  findOne(@Param('id') id: string) {
    return this.documentsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDocumentDto,
  ) {
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
    return this.documentsService.update(id, dto);
  }

  @Delete(':id')
<<<<<<< HEAD
  async remove(@Req() req: any, @Param('id') id: string) {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('Authentication required');
    }

    const document = await this.documentsService.findOne(id);

    // Fail closed on legacy documents without projectId
    if (!document.projectId) {
      throw new ForbiddenException('Access denied: legacy document without project association');
    }

    await assertProjectAccess(this.prisma, userId, document.projectId);
    return this.documentsService.remove(id, userId);
  }

  @Post('reconcile')
  @UseGuards(ReconciliationAuthGuard)
  async reconcilePendingDocuments(@Req() req: any) {
    const isWorker = req.isWorker === true;
    const user = req.user;
    const isPlatformAdmin =
      user?.platformRole === 'ADMIN' ||
      (Array.isArray(user?.roles) &&
        user.roles.includes('ADMIN') &&
        !user.roles.includes('OWNER'));

    if (!isWorker && !isPlatformAdmin) {
      if (!user && !isWorker) {
        throw new UnauthorizedException('Authentication required');
      }
      throw new ForbiddenException(
        'Platform administrative privileges required for document reconciliation',
      );
    }

    if (!this.reconciliationService) {
      return { message: 'Reconciliation service is not available', reconciled: 0 };
    }

    return this.reconciliationService.reconcilePendingDocuments();
  }

  @Post(':id/chunks')
  async createChunk(
    @Req() req: any,
    @Param('id') documentId: string,
    @Body() dto: CreateChunkDto,
  ) {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('Authentication required');
    }

    const document = await this.documentsService.findOne(documentId);

    if (!document.projectId) {
      throw new ForbiddenException('Access denied: legacy document without project association');
    }

    await assertProjectAccess(this.prisma, userId, document.projectId);

=======
  remove(@Param('id') id: string) {
    return this.documentsService.remove(id);
  }

  @Post(':id/chunks')
  createChunk(
    @Param('id') documentId: string,
    @Body() dto: CreateChunkDto,
  ) {
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
    return this.documentsService.createChunk({
      ...dto,
      documentId,
    });
  }

  @Get(':id/chunks')
<<<<<<< HEAD
  async getChunks(@Req() req: any, @Param('id') documentId: string) {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('Authentication required');
    }

    const document = await this.documentsService.findOne(documentId);

    if (!document.projectId) {
      throw new ForbiddenException('Access denied: legacy document without project association');
    }

    await assertProjectAccess(this.prisma, userId, document.projectId);

=======
  getChunks(@Param('id') documentId: string) {
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
    return this.documentsService.getChunks(documentId);
  }

  @Delete('chunks/:id')
<<<<<<< HEAD
  async deleteChunk(@Req() req: any, @Param('id') id: string) {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('Authentication required');
    }

    const chunk = await this.prisma.documentChunk.findUnique({
      where: { id },
      include: {
        document: true,
      },
    });

    if (!chunk) {
      throw new NotFoundException('Document chunk not found');
    }

    if (!chunk.document?.projectId) {
      throw new ForbiddenException('Access denied: legacy document without project association');
    }

    await assertProjectAccess(this.prisma, userId, chunk.document.projectId);

    return this.documentsService.deleteChunk(id);
  }
}
=======
  deleteChunk(@Param('id') id: string) {
    return this.documentsService.deleteChunk(id);
  }
}
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
