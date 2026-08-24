import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service.js';
import { CreateInsightDto } from './dto/create-insight.dto.js';

@Injectable()
export class InsightsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async getProjectInsights(projectId: string) {
    return this.prisma.aIInsight.findMany({
      where: {
        projectId,
      },
      orderBy: {
        generatedAt: 'desc',
      },
    });
  }

  async getInsight(id: string) {
    const insight = await this.prisma.aIInsight.findUnique({
      where: {
        id,
      },
    });

    if (!insight) {
      throw new NotFoundException(
        'AI insight not found',
      );
    }

    return insight;
  }

  async createInsight(dto: CreateInsightDto) {
    return this.prisma.aIInsight.create({
      data: {
        projectId: dto.projectId,
        type: 'GENERAL',
        title: dto.title,
        summary: dto.content,
      },
    });
  }

  async generateInsight(projectId: string) {
    return this.prisma.aIInsight.create({
      data: {
        projectId,
        type: 'GENERAL',
        title: 'AI Generated Insight',
        summary: 'AI-generated project insight.',
      },
    });
  }

  async deleteInsight(id: string) {
    await this.getInsight(id);

    return this.prisma.aIInsight.delete({
      where: {
        id,
      },
    });
  }
}