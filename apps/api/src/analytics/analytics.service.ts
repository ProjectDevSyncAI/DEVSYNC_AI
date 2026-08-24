import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../database/prisma.service.js';
import { CreateAnalyticsDto } from './dto/create-analytics.dto.js';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAnalyticsDto) {
    return this.prisma.projectAnalytics.upsert({
      where: {
        projectId_date: {
          projectId: dto.projectId,
          date: new Date(dto.date),
        },
      },

      update: {
        completedTasks: dto.completedTasks ?? 0,
        openedIssues: dto.openedIssues ?? 0,
        resolvedIssues: dto.resolvedIssues ?? 0,
        commits: dto.commits ?? 0,
        pullRequests: dto.pullRequests ?? 0,
        mergedPullRequests: dto.mergedPullRequests ?? 0,
        activeDevelopers: dto.activeDevelopers ?? 0,
        deploymentCount: dto.deploymentCount ?? 0,
        averageCycleTime: dto.averageCycleTime,
        velocity: dto.velocity,
      },

      create: {
        projectId: dto.projectId,
        date: new Date(dto.date),
        completedTasks: dto.completedTasks ?? 0,
        openedIssues: dto.openedIssues ?? 0,
        resolvedIssues: dto.resolvedIssues ?? 0,
        commits: dto.commits ?? 0,
        pullRequests: dto.pullRequests ?? 0,
        mergedPullRequests: dto.mergedPullRequests ?? 0,
        activeDevelopers: dto.activeDevelopers ?? 0,
        deploymentCount: dto.deploymentCount ?? 0,
        averageCycleTime: dto.averageCycleTime,
        velocity: dto.velocity,
      },
    });
  }

  async findAll(projectId?: string) {
    return this.prisma.projectAnalytics.findMany({
      where: projectId ? { projectId } : undefined,
      orderBy: {
        date: 'desc',
      },
    });
  }

  async findById(id: string) {
    const analytics = await this.prisma.projectAnalytics.findUnique({
      where: { id },
    });

    if (!analytics) {
      throw new NotFoundException('Analytics record not found');
    }

    return analytics;
  }

  async findByProject(projectId: string) {
    return this.prisma.projectAnalytics.findMany({
      where: {
        projectId,
      },
      orderBy: {
        date: 'desc',
      },
    });
  }

  async getLatest(projectId: string) {
    return this.prisma.projectAnalytics.findFirst({
      where: {
        projectId,
      },
      orderBy: {
        date: 'desc',
      },
    });
  }

  async getSummary(projectId: string) {
    const records = await this.prisma.projectAnalytics.findMany({
      where: {
        projectId,
      },
      orderBy: {
        date: 'asc',
      },
    });

    if (records.length === 0) {
      return {
        projectId,
        totalRecords: 0,
        completedTasks: 0,
        openedIssues: 0,
        resolvedIssues: 0,
        commits: 0,
        pullRequests: 0,
        mergedPullRequests: 0,
        activeDevelopers: 0,
        deploymentCount: 0,
        averageCycleTime: 0,
        averageVelocity: 0,
      };
    }

    const sum = (values: number[]) =>
      values.reduce((total, value) => total + value, 0);

    return {
      projectId,
      totalRecords: records.length,

      completedTasks: sum(
        records.map((r) => r.completedTasks),
      ),

      openedIssues: sum(
        records.map((r) => r.openedIssues),
      ),

      resolvedIssues: sum(
        records.map((r) => r.resolvedIssues),
      ),

      commits: sum(
        records.map((r) => r.commits),
      ),

      pullRequests: sum(
        records.map((r) => r.pullRequests),
      ),

      mergedPullRequests: sum(
        records.map((r) => r.mergedPullRequests),
      ),

      activeDevelopers: Math.max(
        ...records.map((r) => r.activeDevelopers),
      ),

      deploymentCount: sum(
        records.map((r) => r.deploymentCount),
      ),

      averageCycleTime:
        records.reduce(
          (total, r) => total + (r.averageCycleTime ?? 0),
          0,
        ) / records.length,

      averageVelocity:
        records.reduce(
          (total, r) => total + (r.velocity ?? 0),
          0,
        ) / records.length,
    };
  }

  async remove(id: string) {
    await this.findById(id);

    return this.prisma.projectAnalytics.delete({
      where: { id },
    });
  }
}