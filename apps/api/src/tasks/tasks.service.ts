import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../database/prisma.service.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateTaskDto) {
    const project = await this.prisma.project.findUnique({
      where: {
        id: dto.projectId,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (dto.assigneeId) {
      const assignee = await this.prisma.user.findUnique({
        where: {
          id: dto.assigneeId,
        },
      });

      if (!assignee) {
        throw new NotFoundException('Assignee not found');
      }
    }

    if (dto.sprintId) {
      const sprint = await this.prisma.sprint.findUnique({
        where: {
          id: dto.sprintId,
        },
      });

      if (!sprint) {
        throw new NotFoundException('Sprint not found');
      }
    }

    return this.prisma.task.create({
      data: {
        projectId: dto.projectId,
        creatorId: userId,
        title: dto.title,
        description: dto.description,
        assigneeId: dto.assigneeId,
        sprintId: dto.sprintId,
        status: dto.status,
        priority: dto.priority,
        storyPoints: dto.storyPoints,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
      include: {
        project: true,
        creator: true,
        assignee: true,
        sprint: true,
      },
    });
  }

  async findAll(projectId?: string) {
    return this.prisma.task.findMany({
      where: projectId
        ? {
            projectId,
          }
        : undefined,
      include: {
        project: true,
        creator: true,
        assignee: true,
        sprint: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const task = await this.prisma.task.findUnique({
      where: {
        id,
      },
      include: {
        project: true,
        creator: true,
        assignee: true,
        sprint: true,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async update(id: string, dto: UpdateTaskDto) {
    await this.findOne(id);

    if (dto.assigneeId) {
      const assignee = await this.prisma.user.findUnique({
        where: {
          id: dto.assigneeId,
        },
      });

      if (!assignee) {
        throw new NotFoundException('Assignee not found');
      }
    }

    if (dto.sprintId) {
      const sprint = await this.prisma.sprint.findUnique({
        where: {
          id: dto.sprintId,
        },
      });

      if (!sprint) {
        throw new NotFoundException('Sprint not found');
      }
    }

    const data: any = {
      ...dto,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
    };

    if (dto.status === 'DONE') {
      data.completedAt = new Date();
    } else if (dto.status) {
      data.completedAt = null;
    }

    return this.prisma.task.update({
      where: {
        id,
      },
      data,
      include: {
        project: true,
        creator: true,
        assignee: true,
        sprint: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.task.delete({
      where: {
        id,
      },
    });

    return {
      message: 'Task deleted successfully',
    };
  }
}