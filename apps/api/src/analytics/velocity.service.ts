import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class VelocityService {
  constructor(private readonly prisma: PrismaService) {}

  async getVelocity(projectId: string, limit = 10) {
    const analytics = await this.prisma.projectAnalytics.findMany({
      where: {
        projectId,
      },
      orderBy: {
        date: 'desc',
      },
      take: limit,
    });

    return analytics.map((item) => ({
      date: item.date,
      velocity: item.velocity ?? 0,
      completedTasks: item.completedTasks,
    }));
  }

  async getAverageVelocity(
    projectId: string,
    limit = 10,
  ) {
    const analytics = await this.prisma.projectAnalytics.findMany({
      where: {
        projectId,
      },
      orderBy: {
        date: 'desc',
      },
      take: limit,
    });

    if (analytics.length === 0) {
      return {
        projectId,
        averageVelocity: 0,
        records: 0,
      };
    }

    const total = analytics.reduce(
      (sum, item) => sum + (item.velocity ?? 0),
      0,
    );

    return {
      projectId,
      averageVelocity: total / analytics.length,
      records: analytics.length,
    };
  }
}