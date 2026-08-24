import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../database/prisma.service.js';
import { CreateActivityDto } from './dto/create-activity.dto.js';
import { UpdateActivityDto } from './dto/update-activity.dto.js';

@Injectable()
export class ActivityService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(dto: CreateActivityDto) {
    return this.prisma.activity.create({
      data: {
        projectId: dto.projectId,
        userId: dto.userId,
        type: dto.type,
        title: dto.title,
        description: dto.description,
        entityType: dto.entityType,
        entityId: dto.entityId,
        metadata: dto.metadata as any,
      },
    });
  }

  async findAll(
    projectId?: string,
    userId?: string,
    type?: string,
  ) {
    return this.prisma.activity.findMany({
      where: {
        ...(projectId ? { projectId } : {}),
        ...(userId ? { userId } : {}),
        ...(type ? { type } : {}),
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        project: true,
        user: true,
      },
    });
  }

  async findById(id: string) {
    const activity =
      await this.prisma.activity.findUnique({
        where: { id },
        include: {
          project: true,
          user: true,
        },
      });

    if (!activity) {
      throw new NotFoundException(
        'Activity not found',
      );
    }

    return activity;
  }

  async update(
    id: string,
    dto: UpdateActivityDto,
  ) {
    await this.findById(id);

    return this.prisma.activity.update({
      where: { id },
      data: {
        ...(dto.type !== undefined
          ? { type: dto.type }
          : {}),
        ...(dto.title !== undefined
          ? { title: dto.title }
          : {}),
        ...(dto.description !== undefined
          ? { description: dto.description }
          : {}),
        ...(dto.entityType !== undefined
          ? { entityType: dto.entityType }
          : {}),
        ...(dto.entityId !== undefined
          ? { entityId: dto.entityId }
          : {}),
        ...(dto.metadata !== undefined
          ? { metadata: dto.metadata as any }
          : {}),
      },
    });
  }

  async remove(id: string) {
    await this.findById(id);

    return this.prisma.activity.delete({
      where: { id },
    });
  }
}