import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service.js';
import { CreateConversationDto } from './dto/create-conversation.dto.js';
import { UpdateConversationDto } from './dto/update-conversation.dto.js';

@Injectable()
export class ConversationsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(dto: CreateConversationDto) {
    return this.prisma.aIConversation.create({
      data: {
        userId: dto.userId,
        projectId: dto.projectId,
        title: dto.title,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.aIConversation.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const conversation =
      await this.prisma.aIConversation.findUnique({
        where: { id },
      });

    if (!conversation) {
      throw new NotFoundException(
        'AI conversation not found',
      );
    }

    return conversation;
  }

  async update(
    id: string,
    dto: UpdateConversationDto,
  ) {
    await this.findOne(id);

    return this.prisma.aIConversation.update({
      where: { id },
      data: {
        title: dto.title,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.aIConversation.delete({
      where: { id },
    });
  }
}