import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class MetricsService {
  constructor(private readonly prisma: PrismaService) {}

  async getProjectMetrics(projectId: string) {
    const analytics =
      await this.prisma.projectAnalytics.findMany({
        where: {
          projectId,
        },
        orderBy: {
          date: 'asc',
        },
      });

    return analytics.map((item) => ({
      date: item.date,
      completedTasks: item.completedTasks,
      openedIssues: item.openedIssues,
      resolvedIssues: item.resolvedIssues,
      commits: item.commits,
      pullRequests: item.pullRequests,
      mergedPullRequests: item.mergedPullRequests,
      activeDevelopers: item.activeDevelopers,
      deploymentCount: item.deploymentCount,
      averageCycleTime: item.averageCycleTime,
      velocity: item.velocity,
    }));
  }
}