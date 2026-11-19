<<<<<<< HEAD
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { CreateNotificationDto } from './dto/create-notification.dto.js';
import { UpdateNotificationDto } from './dto/update-notification.dto.js';
import { assertProjectAccess } from '../common/helpers/project-access.helper.js';
=======
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { CreateNotificationDto } from './dto/create-notification.dto.js';
import { UpdateNotificationDto } from './dto/update-notification.dto.js';
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c

@Injectable()
export class NotificationsService {
  constructor(private readonly db: PrismaService) {}

<<<<<<< HEAD
  async create(dto: CreateNotificationDto, actorUserId?: string) {
    if (actorUserId) {
      if (!actorUserId) {
        throw new ForbiddenException('User is not authenticated');
      }

      // Check recipient user existence if user model is queried
      if (this.db.user) {
        const recipient = await this.db.user.findUnique({
          where: { id: dto.userId },
          select: { id: true, status: true },
        });
        if (!recipient) {
          throw new NotFoundException('Recipient user not found');
        }
        if (recipient.status !== 'ACTIVE') {
          throw new ForbiddenException('Recipient user account is inactive or suspended');
        }
      }

      // Project-scoped authorization
      if (dto.projectId) {
        // 1. Verify actor has access to this project
        await assertProjectAccess(this.db, actorUserId, dto.projectId);

        // 2. Verify recipient also belongs to this project or its organization
        try {
          await assertProjectAccess(this.db, dto.userId, dto.projectId);
        } catch {
          throw new ForbiddenException(
            'Recipient does not belong to this project or organization',
          );
        }
      } else {
        // Cross-org check: Actor and recipient must share at least one organization
        if (this.db.organizationMember) {
          const sharedOrg = await this.db.organizationMember.findFirst({
            where: {
              userId: dto.userId,
              organization: {
                members: {
                  some: { userId: actorUserId },
                },
              },
            },
          });
          if (!sharedOrg) {
            throw new ForbiddenException(
              'Cannot send notifications to a user outside your organizations or projects',
            );
          }
        }
      }
    }

=======
  async create(dto: CreateNotificationDto) {
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
    return this.db.notification.create({
      data: {
        userId: dto.userId,
        projectId: dto.projectId,
        type: dto.type,
        priority: dto.priority,
        title: dto.title,
        message: dto.message,
        metadata: dto.metadata as any,
      },
    });
  }

  async findAll(userId: string, unreadOnly = false) {
<<<<<<< HEAD
    if (!userId) {
      throw new ForbiddenException('User is not authenticated');
    }

=======
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
    return this.db.notification.findMany({
      where: {
        userId,
        ...(unreadOnly ? { readAt: null } : {}),
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

<<<<<<< HEAD
  async getUnreadCount(userId: string): Promise<{ count: number }> {
    if (!userId) {
      throw new ForbiddenException('User is not authenticated');
    }

    const count = await this.db.notification.count({
      where: {
        userId,
        readAt: null,
      },
    });

    return { count };
  }

  async findOne(userId: string, id: string) {
    if (!userId) {
      throw new ForbiddenException('User is not authenticated');
    }

=======
  async findOne(id: string) {
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
    const notification = await this.db.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

<<<<<<< HEAD
    if (notification.userId !== userId) {
      throw new ForbiddenException('You do not have access to this notification');
    }

    return notification;
  }

  async update(userId: string, id: string, dto: UpdateNotificationDto) {
    await this.findOne(userId, id);
=======
    return notification;
  }

  async update(id: string, dto: UpdateNotificationDto) {
    await this.findOne(id);
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c

    return this.db.notification.update({
      where: { id },
      data: {
        priority: dto.priority,
        title: dto.title,
        message: dto.message,
        metadata: dto.metadata as any,
<<<<<<< HEAD
        readAt:
          dto.read === true
            ? new Date()
            : dto.read === false
              ? null
              : undefined,
=======
        readAt: dto.read === true ? new Date() : undefined,
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
      },
    });
  }

<<<<<<< HEAD
  async markAsRead(userId: string, id: string) {
    await this.findOne(userId, id);
=======
  async markAsRead(id: string) {
    await this.findOne(id);
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c

    return this.db.notification.update({
      where: { id },
      data: {
        readAt: new Date(),
      },
    });
  }

  async markAllAsRead(userId: string) {
<<<<<<< HEAD
    if (!userId) {
      throw new ForbiddenException('User is not authenticated');
    }

=======
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
    return this.db.notification.updateMany({
      where: {
        userId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });
  }

<<<<<<< HEAD
  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
=======
  async remove(id: string) {
    await this.findOne(id);
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c

    return this.db.notification.delete({
      where: { id },
    });
  }
}
