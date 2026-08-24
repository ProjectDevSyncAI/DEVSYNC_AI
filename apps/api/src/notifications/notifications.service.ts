import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { CreateNotificationDto } from './dto/create-notification.dto.js';
import { UpdateNotificationDto } from './dto/update-notification.dto.js';

@Injectable()
export class NotificationsService {
  constructor(private readonly db: PrismaService) {}

  async create(dto: CreateNotificationDto) {
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

  async findOne(id: string) {
    const notification = await this.db.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return notification;
  }

  async update(id: string, dto: UpdateNotificationDto) {
    await this.findOne(id);

    return this.db.notification.update({
      where: { id },
      data: {
        priority: dto.priority,
        title: dto.title,
        message: dto.message,
        metadata: dto.metadata as any,
        readAt: dto.read === true ? new Date() : undefined,
      },
    });
  }

  async markAsRead(id: string) {
    await this.findOne(id);

    return this.db.notification.update({
      where: { id },
      data: {
        readAt: new Date(),
      },
    });
  }

  async markAllAsRead(userId: string) {
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

  async remove(id: string) {
    await this.findOne(id);

    return this.db.notification.delete({
      where: { id },
    });
  }
}
