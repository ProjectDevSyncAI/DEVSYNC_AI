import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { CreateCommitDto } from './dto/create-commit.dto.js';

@Injectable()
export class CommitsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCommitDto) {
    return this.prisma.commit.create({
      data: {
        repositoryId: dto.repositoryId,
        projectId: dto.projectId,
        authorId: dto.authorId,
        sha: dto.sha,
        message: dto.message,
        branch: dto.branch,
        additions: dto.additions ?? 0,
        deletions: dto.deletions ?? 0,
        changedFiles: dto.changedFiles ?? 0,
        committedAt: new Date(dto.committedAt),
      },
    });
  }

  async findAll(repositoryId?: string, projectId?: string) {
    return this.prisma.commit.findMany({
      where: {
        ...(repositoryId ? { repositoryId } : {}),
        ...(projectId ? { projectId } : {}),
      },
      orderBy: {
        committedAt: 'desc',
      },
    });
  }

  async findById(id: string) {
    const commit = await this.prisma.commit.findUnique({
      where: { id },
    });

    if (!commit) {
      throw new NotFoundException('Commit not found');
    }

    return commit;
  }

  async remove(id: string) {
    await this.findById(id);

    return this.prisma.commit.delete({
      where: { id },
    });
  }
}