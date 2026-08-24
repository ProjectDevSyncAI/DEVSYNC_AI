import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { CreateSprintDto } from './dto/create-sprint.dto.js';
import { UpdateSprintDto } from './dto/update-sprint.dto.js';

@Injectable()
export class SprintsService {
  constructor(private readonly db: PrismaService) {}

  async create(dto: CreateSprintDto) {
    return this.db.sprint.create({
      data: {
        projectId: dto.projectId,
        creatorId: dto.creatorId,
        name: dto.name,
        goal: dto.goal,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        capacity: dto.capacity,
      },
    });
  }

  async findAll(projectId?: string) {
    return this.db.sprint.findMany({
      where: projectId ? { projectId } : undefined,
      orderBy: {
        startDate: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const sprint = await this.db.sprint.findUnique({
      where: { id },
      include: {
        tasks: true,
        members: true,
      },
    });

    if (!sprint) {
      throw new NotFoundException('Sprint not found');
    }

    return sprint;
  }

  async update(id: string, dto: UpdateSprintDto) {
    await this.findOne(id);

    return this.db.sprint.update({
      where: { id },
      data: {
        name: dto.name,
        goal: dto.goal,
        status: dto.status as any,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        capacity: dto.capacity,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.db.sprint.delete({
      where: { id },
    });
  }

  async addMember(sprintId: string, userId: string) {
    await this.findOne(sprintId);

    return this.db.sprintMember.create({
      data: {
        sprintId,
        userId,
      },
    });
  }

  async removeMember(sprintId: string, userId: string) {
    return this.db.sprintMember.delete({
      where: {
        sprintId_userId: {
          sprintId,
          userId,
        },
      },
    });
  }

  async getMembers(sprintId: string) {
    return this.db.sprintMember.findMany({
      where: { sprintId },
      include: {
        user: true,
      },
    });
  }
}