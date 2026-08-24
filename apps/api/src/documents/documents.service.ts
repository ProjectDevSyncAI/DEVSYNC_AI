import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { CreateDocumentDto } from './dto/create-document.dto.js';
import { UpdateDocumentDto } from './dto/update-document.dto.js';
import { CreateChunkDto } from './dto/create-chunk.dto.js';

@Injectable()
export class DocumentsService {
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
        indexedAt: dto.indexedAt
          ? new Date(dto.indexedAt)
          : undefined,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.document.delete({
      where: { id },
    });
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
}