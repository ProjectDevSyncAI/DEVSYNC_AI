import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class AIService {
  constructor(private readonly prisma: PrismaService) {}

  async getConversations(userId: string, projectId?: string) {
    return this.prisma.aIConversation.findMany({
      where: {
        userId,
        ...(projectId ? { projectId } : {}),
      },
      include: {
        messages: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  async getConversation(id: string) {
    return this.prisma.aIConversation.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: {
            createdAt: 'asc',
          },
          include: {
            citations: true,
          },
        },
      },
    });
  }

  async createConversation(
    userId: string,
    projectId: string | undefined,
    title: string,
  ) {
    return this.prisma.aIConversation.create({
      data: {
        userId,
        projectId,
        title,
      },
    });
  }

  async addMessage(
    conversationId: string,
    userId: string | undefined,
    role: any,
    content: string,
  ) {
    return this.prisma.aIMessage.create({
      data: {
        conversationId,
        userId,
        role,
        content,
      },
    });
  }

  async getInsights(projectId: string) {
    return this.prisma.aIInsight.findMany({
      where: { projectId },
      orderBy: {
        generatedAt: 'desc',
      },
    });
  }
}