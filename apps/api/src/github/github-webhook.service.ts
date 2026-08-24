import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../database/prisma.service.js';
import { CreateWebhookEventDto } from './dto/create-webhook-event.dto.js';

@Injectable()
export class GithubWebhookService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(dto: CreateWebhookEventDto) {
    return this.prisma.gitHubWebhookEvent.create({
      data: {
        deliveryId: dto.deliveryId,

        // Prisma enum value
        eventType: dto.eventType as any,

        action: dto.action,

        repositoryId: dto.repositoryId,

        // JSON payload
        payload: dto.payload as any,
      },
    });
  }

  async findAll() {
    return this.prisma.gitHubWebhookEvent.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findById(id: string) {
    const event =
      await this.prisma.gitHubWebhookEvent.findUnique({
        where: {
          id,
        },
      });

    if (!event) {
      throw new NotFoundException(
        'GitHub webhook event not found',
      );
    }

    return event;
  }

  async markProcessed(id: string) {
    await this.findById(id);

    return this.prisma.gitHubWebhookEvent.update({
      where: {
        id,
      },
      data: {
        processed: true,
        processedAt: new Date(),
        errorMessage: null,
      },
    });
  }

  async markFailed(
    id: string,
    errorMessage: string,
  ) {
    await this.findById(id);

    return this.prisma.gitHubWebhookEvent.update({
      where: {
        id,
      },
      data: {
        processed: false,
        errorMessage,
      },
    });
  }
}