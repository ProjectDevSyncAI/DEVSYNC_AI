import {
  BadRequestException,
<<<<<<< HEAD
  ForbiddenException,
=======
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../database/prisma.service.js';
<<<<<<< HEAD
import { ActivityService } from '../activity/activity.service.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';
import {
  assertProjectAccess,
  getAuthorizedProjectIds,
} from '../common/helpers/project-access.helper.js';

@Injectable()
export class TasksService {
  private readonly prisma: PrismaService;
  private readonly activityService?: ActivityService;

  constructor(prisma: PrismaService, activityService?: ActivityService) {
    this.prisma = prisma;
    this.activityService = activityService;
  }

  async create(userId: string, dto: CreateTaskDto) {
    await assertProjectAccess(this.prisma, userId, dto.projectId);
=======
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
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c

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
<<<<<<< HEAD

      if (sprint.projectId !== dto.projectId) {
        throw new BadRequestException('Sprint does not belong to this project');
      }
    }

    const execute = async (tx: any) => {
      const task = await tx.task.create({
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

      if (this.activityService) {
        await this.activityService.createEvent(
          {
            projectId: dto.projectId,
            userId,
            type: 'TASK_CREATED',
            title: `Task created: ${task.title}`,
            description: task.description || undefined,
            entityType: 'TASK',
            entityId: task.id,
            metadata: {
              taskId: task.id,
              title: task.title,
              status: task.status,
              priority: task.priority,
              sprintId: task.sprintId,
              assigneeId: task.assigneeId,
            },
          },
          tx,
        );
      }

      return task;
    };

    if (typeof this.prisma?.$transaction === 'function') {
      return this.prisma.$transaction(execute);
    }
    return execute(this.prisma);
  }

  async findAll(userId: string, projectId?: string) {
    if (projectId) {
      await assertProjectAccess(this.prisma, userId, projectId);
      return this.prisma.task.findMany({
        where: { projectId },
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

    const authorizedProjectIds = await getAuthorizedProjectIds(this.prisma, userId);
    if (authorizedProjectIds.length === 0) {
      return [];
    }

    return this.prisma.task.findMany({
      where: {
        projectId: { in: authorizedProjectIds },
      },
=======
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
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
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

<<<<<<< HEAD
  async findOne(userId: string, id: string) {
=======
  async findOne(id: string) {
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
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

<<<<<<< HEAD
    await assertProjectAccess(this.prisma, userId, task.projectId);

    return task;
  }

  async update(userId: string, id: string, dto: UpdateTaskDto) {
    const existing = await this.findOne(userId, id);
=======
    return task;
  }

  async update(id: string, dto: UpdateTaskDto) {
    await this.findOne(id);
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c

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
<<<<<<< HEAD

      if (sprint.projectId !== existing.projectId) {
        throw new BadRequestException('Sprint does not belong to this project');
      }
=======
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
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

<<<<<<< HEAD
    const execute = async (tx: any) => {
      const updated = await tx.task.update({
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

      if (this.activityService) {
        if (dto.status && dto.status !== existing.status) {
          await this.activityService.createEvent(
            {
              projectId: existing.projectId,
              userId,
              type: 'TASK_STATUS_CHANGED',
              title: `Task status changed to ${dto.status}: ${updated.title}`,
              entityType: 'TASK',
              entityId: updated.id,
              metadata: {
                taskId: updated.id,
                oldStatus: existing.status,
                newStatus: updated.status,
              },
            },
            tx,
          );
        } else if (dto.assigneeId !== undefined && dto.assigneeId !== existing.assigneeId) {
          await this.activityService.createEvent(
            {
              projectId: existing.projectId,
              userId,
              type: 'TASK_ASSIGNED',
              title: dto.assigneeId ? `Task assigned: ${updated.title}` : `Task unassigned: ${updated.title}`,
              entityType: 'TASK',
              entityId: updated.id,
              metadata: {
                taskId: updated.id,
                oldAssigneeId: existing.assigneeId,
                newAssigneeId: updated.assigneeId,
              },
            },
            tx,
          );
        } else {
          const hasOtherChanges = Object.keys(dto).some(
            (k) => k !== 'status' && k !== 'assigneeId' && (dto as any)[k] !== undefined && (dto as any)[k] !== (existing as any)[k],
          );
          if (hasOtherChanges) {
            const updatedFields = Object.keys(dto).filter(
              (k) => (dto as any)[k] !== undefined && (dto as any)[k] !== (existing as any)[k],
            );
            await this.activityService.createEvent(
              {
                projectId: existing.projectId,
                userId,
                type: 'TASK_UPDATED',
                title: `Task updated: ${updated.title}`,
                entityType: 'TASK',
                entityId: updated.id,
                metadata: {
                  taskId: updated.id,
                  title: updated.title,
                  status: updated.status,
                  priority: updated.priority,
                  updatedFields,
                },
              },
              tx,
            );
          }
        }
      }

      return updated;
    };

    if (typeof this.prisma?.$transaction === 'function') {
      return this.prisma.$transaction(execute);
    }
    return execute(this.prisma);
  }

  async moveTask(userId: string, id: string, status: any, position?: number) {
    const existing = await this.findOne(userId, id);
    const data: any = { status };
    if (position !== undefined) {
      data.position = position;
    }
    if (status === 'DONE') {
      data.completedAt = new Date();
    } else {
      data.completedAt = null;
    }

    const execute = async (tx: any) => {
      const updated = await tx.task.update({
        where: { id },
        data,
        include: {
          project: true,
          creator: true,
          assignee: true,
          sprint: true,
        },
      });

      if (this.activityService && existing.status !== status) {
        await this.activityService.createEvent(
          {
            projectId: existing.projectId,
            userId,
            type: 'TASK_STATUS_CHANGED',
            title: `Task status changed to ${status}: ${updated.title}`,
            entityType: 'TASK',
            entityId: updated.id,
            metadata: {
              taskId: updated.id,
              oldStatus: existing.status,
              newStatus: status,
              position,
            },
          },
          tx,
        );
      }

      return updated;
    };

    if (typeof this.prisma?.$transaction === 'function') {
      return this.prisma.$transaction(execute);
    }
    return execute(this.prisma);
  }

  async remove(userId: string, id: string) {
    const existing = await this.findOne(userId, id);

    const execute = async (tx: any) => {
      await tx.task.delete({
        where: {
          id,
        },
      });

      if (this.activityService) {
        await this.activityService.createEvent(
          {
            projectId: existing.projectId,
            userId,
            type: 'TASK_DELETED',
            title: `Task deleted: ${existing.title}`,
            entityType: 'TASK',
            entityId: existing.id,
            metadata: {
              taskId: existing.id,
              title: existing.title,
            },
          },
          tx,
        );
      }

      return {
        message: 'Task deleted successfully',
      };
    };

    if (typeof this.prisma?.$transaction === 'function') {
      return this.prisma.$transaction(execute);
    }
    return execute(this.prisma);
=======
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
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
  }
}