import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../database/prisma.service.js';
import { CreateRepositoryDto } from './dto/create-repository.dto.js';
import { UpdateRepositoryDto } from './dto/update-repository.dto.js';

@Injectable()
export class RepositoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateRepositoryDto) {
    return this.prisma.repository.create({
      data: {
        organizationId: dto.organizationId,
        projectId: dto.projectId,
        githubId: dto.githubId,
        name: dto.name,
        fullName: dto.fullName,
        url: dto.url,
        defaultBranch: dto.defaultBranch ?? 'main',
        visibility: dto.visibility as any,
        language: dto.language,
        stars: dto.stars ?? 0,
        forks: dto.forks ?? 0,
      },
    });
  }

  async findAll(organizationId?: string) {
    return this.prisma.repository.findMany({
      where: organizationId
        ? { organizationId }
        : undefined,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const repository = await this.prisma.repository.findUnique({
      where: { id },
    });

    if (!repository) {
      throw new NotFoundException('Repository not found');
    }

    return repository;
  }

  async update(id: string, dto: UpdateRepositoryDto) {
    await this.findOne(id);

    return this.prisma.repository.update({
      where: { id },
      data: {
        name: dto.name,
        fullName: dto.fullName,
        url: dto.url,
        defaultBranch: dto.defaultBranch,
        visibility: dto.visibility as any,
        language: dto.language,
        stars: dto.stars,
        forks: dto.forks,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.repository.delete({
      where: { id },
    });
  }
}