import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
<<<<<<< HEAD
import { ActivityService } from '../activity/activity.service.js';
import {
  assertProjectAccess,
  getAuthorizedProjectIds,
} from '../common/helpers/project-access.helper.js';
=======
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
import { CreateSprintDto } from './dto/create-sprint.dto.js';
import { UpdateSprintDto } from './dto/update-sprint.dto.js';

@Injectable()
export class SprintsService {
<<<<<<< HEAD
  constructor(
    private readonly db: PrismaService,
    private readonly activityService?: ActivityService,
  ) {}

  async create(userId: string, dto: CreateSprintDto) {
    await assertProjectAccess(this.db, userId, dto.projectId);

    const execute = async (tx: any) => {
      const sprint = await tx.sprint.create({
        data: {
          projectId: dto.projectId,
          creatorId: userId,
          name: dto.name,
          goal: dto.goal,
          startDate: new Date(dto.startDate),
          endDate: new Date(dto.endDate),
          capacity: dto.capacity,
        },
        include: {
          tasks: true,
          members: true,
        },
      });

      if (this.activityService) {
        await this.activityService.createEvent(
          {
            projectId: dto.projectId,
            userId,
            type: 'SPRINT_CREATED',
            title: `Sprint created: ${sprint.name}`,
            description: sprint.goal || undefined,
            entityType: 'SPRINT',
            entityId: sprint.id,
            metadata: {
              sprintId: sprint.id,
              name: sprint.name,
              status: sprint.status,
              startDate: sprint.startDate,
              endDate: sprint.endDate,
            },
          },
          tx,
        );
      }

      return sprint;
    };

    if (typeof this.db?.$transaction === 'function') {
      return this.db.$transaction(execute);
    }
    return execute(this.db);
  }

  async findAll(userId: string, projectId?: string) {
    if (projectId) {
      await assertProjectAccess(this.db, userId, projectId);
      return this.db.sprint.findMany({
        where: { projectId },
        orderBy: {
          startDate: 'desc',
        },
        include: {
          tasks: true,
          members: true,
        },
      });
    }

    const authorizedProjectIds = await getAuthorizedProjectIds(this.db, userId);
    return this.db.sprint.findMany({
      where: {
        projectId: { in: authorizedProjectIds },
      },
      orderBy: {
        startDate: 'desc',
      },
      include: {
        tasks: true,
        members: true,
=======
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
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
      },
    });
  }

<<<<<<< HEAD
  async findOne(userId: string, id: string) {
=======
  async findAll(projectId?: string) {
    return this.db.sprint.findMany({
      where: projectId ? { projectId } : undefined,
      orderBy: {
        startDate: 'desc',
      },
    });
  }

  async findOne(id: string) {
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
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

<<<<<<< HEAD
    await assertProjectAccess(this.db, userId, sprint.projectId);

    return sprint;
  }

  async update(userId: string, id: string, dto: UpdateSprintDto) {
    const existing = await this.findOne(userId, id);

    const execute = async (tx: any) => {
      const updated = await tx.sprint.update({
        where: { id },
        data: {
          name: dto.name,
          goal: dto.goal,
          status: dto.status as any,
          startDate: dto.startDate ? new Date(dto.startDate) : undefined,
          endDate: dto.endDate ? new Date(dto.endDate) : undefined,
          capacity: dto.capacity,
        },
        include: {
          tasks: true,
          members: true,
        },
      });

      if (this.activityService) {
        if (dto.status && dto.status !== existing.status) {
          let eventType = 'SPRINT_STATUS_CHANGED';
          let title = `Sprint status changed to ${dto.status}: ${updated.name}`;

          if (dto.status === 'ACTIVE') {
            eventType = 'SPRINT_STARTED';
            title = `Sprint started: ${updated.name}`;
          } else if (dto.status === 'COMPLETED') {
            eventType = 'SPRINT_COMPLETED';
            title = `Sprint completed: ${updated.name}`;
          }

          await this.activityService.createEvent(
            {
              projectId: existing.projectId,
              userId,
              type: eventType,
              title,
              entityType: 'SPRINT',
              entityId: updated.id,
              metadata: {
                sprintId: updated.id,
                name: updated.name,
                oldStatus: existing.status,
                newStatus: updated.status,
              },
            },
            tx,
          );
        } else {
          const hasOtherChanges = Object.keys(dto).some(
            (k) => k !== 'status' && (dto as any)[k] !== undefined && (dto as any)[k] !== (existing as any)[k],
          );
          if (hasOtherChanges) {
            const updatedFields = Object.keys(dto).filter(
              (k) => (dto as any)[k] !== undefined && (dto as any)[k] !== (existing as any)[k],
            );
            await this.activityService.createEvent(
              {
                projectId: existing.projectId,
                userId,
                type: 'SPRINT_UPDATED',
                title: `Sprint updated: ${updated.name}`,
                entityType: 'SPRINT',
                entityId: updated.id,
                metadata: {
                  sprintId: updated.id,
                  name: updated.name,
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

    if (typeof this.db?.$transaction === 'function') {
      return this.db.$transaction(execute);
    }
    return execute(this.db);
  }

  async remove(userId: string, id: string) {
    const existing = await this.findOne(userId, id);

    const execute = async (tx: any) => {
      await tx.sprint.delete({
        where: { id },
      });

      if (this.activityService) {
        await this.activityService.createEvent(
          {
            projectId: existing.projectId,
            userId,
            type: 'SPRINT_DELETED',
            title: `Sprint deleted: ${existing.name}`,
            entityType: 'SPRINT',
            entityId: existing.id,
            metadata: {
              sprintId: existing.id,
              name: existing.name,
            },
          },
          tx,
        );
      }

      return {
        message: 'Sprint deleted successfully',
      };
    };

    if (typeof this.db?.$transaction === 'function') {
      return this.db.$transaction(execute);
    }
    return execute(this.db);
  }

  async addMember(userId: string, sprintId: string, targetUserId: string) {
    const sprint = await this.findOne(userId, sprintId);

    const targetUser = await this.db.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      throw new NotFoundException('Target user not found');
    }

    // Verify target user has project access
    await assertProjectAccess(this.db, targetUserId, sprint.projectId);
=======
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
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c

    return this.db.sprintMember.create({
      data: {
        sprintId,
<<<<<<< HEAD
        userId: targetUserId,
      },
      include: {
        user: true,
=======
        userId,
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
      },
    });
  }

<<<<<<< HEAD
  async removeMember(userId: string, sprintId: string, targetUserId: string) {
    await this.findOne(userId, sprintId);

=======
  async removeMember(sprintId: string, userId: string) {
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
    return this.db.sprintMember.delete({
      where: {
        sprintId_userId: {
          sprintId,
<<<<<<< HEAD
          userId: targetUserId,
=======
          userId,
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
        },
      },
    });
  }

<<<<<<< HEAD
  async getMembers(userId: string, sprintId: string) {
    await this.findOne(userId, sprintId);

=======
  async getMembers(sprintId: string) {
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
    return this.db.sprintMember.findMany({
      where: { sprintId },
      include: {
        user: true,
      },
    });
  }
}