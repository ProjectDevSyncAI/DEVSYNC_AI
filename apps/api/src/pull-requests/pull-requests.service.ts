import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../database/prisma.service.js';
import { CreatePullRequestDto } from './dto/create-pull-request.dto.js';
import { UpdatePullRequestDto } from './dto/update-pull-request.dto.js';

@Injectable()
export class PullRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePullRequestDto) {
    return this.prisma.pullRequest.create({
      data: {
        repositoryId: dto.repositoryId,
        projectId: dto.projectId,
        authorId: dto.authorId,
        githubId: dto.githubId,
        number: dto.number,
        title: dto.title,
        description: dto.description,
        sourceBranch: dto.sourceBranch,
        targetBranch: dto.targetBranch,
        status: dto.status as any,
        reviewStatus: dto.reviewStatus as any,
        additions: dto.additions ?? 0,
        deletions: dto.deletions ?? 0,
        changedFiles: dto.changedFiles ?? 0,
        openedAt: new Date(dto.openedAt),
      },
    });
  }

  async findAll(repositoryId?: string) {
    return this.prisma.pullRequest.findMany({
      where: repositoryId ? { repositoryId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const pullRequest = await this.prisma.pullRequest.findUnique({
      where: { id },
    });

    if (!pullRequest) {
      throw new NotFoundException('Pull request not found');
    }

    return pullRequest;
  }

  async update(id: string, dto: UpdatePullRequestDto) {
    await this.findOne(id);

    return this.prisma.pullRequest.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        sourceBranch: dto.sourceBranch,
        targetBranch: dto.targetBranch,
        status: dto.status as any,
        reviewStatus: dto.reviewStatus as any,
        additions: dto.additions,
        deletions: dto.deletions,
        changedFiles: dto.changedFiles,
        mergedAt: dto.mergedAt ? new Date(dto.mergedAt) : undefined,
        closedAt: dto.closedAt ? new Date(dto.closedAt) : undefined,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.pullRequest.delete({
      where: { id },
    });
  }
}