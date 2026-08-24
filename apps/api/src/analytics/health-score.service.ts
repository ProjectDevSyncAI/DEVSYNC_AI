import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class HealthScoreService {
  constructor(private readonly prisma: PrismaService) {}

  async calculate(projectId: string) {
    const analytics = await this.prisma.projectAnalytics.findMany({
      where: { projectId },
      orderBy: {
        date: 'desc',
      },
      take: 30,
    });

    if (analytics.length === 0) {
      return {
        projectId,
        score: 0,
        status: 'NO_DATA',
      };
    }

    const totalCompleted = analytics.reduce(
      (sum, item) => sum + item.completedTasks,
      0,
    );

    const totalOpenedIssues = analytics.reduce(
      (sum, item) => sum + item.openedIssues,
      0,
    );

    const totalResolvedIssues = analytics.reduce(
      (sum, item) => sum + item.resolvedIssues,
      0,
    );

    const totalCommits = analytics.reduce(
      (sum, item) => sum + item.commits,
      0,
    );

    const totalDeployments = analytics.reduce(
      (sum, item) => sum + item.deploymentCount,
      0,
    );

    const issueResolutionRate =
      totalOpenedIssues > 0
        ? Math.min(
            totalResolvedIssues / totalOpenedIssues,
            1,
          )
        : 1;

    const productivityScore = Math.min(
      totalCompleted / Math.max(analytics.length * 5, 1),
      1,
    );

    const developmentScore = Math.min(
      totalCommits / Math.max(analytics.length * 10, 1),
      1,
    );

    const deploymentScore = Math.min(
      totalDeployments / Math.max(analytics.length, 1),
      1,
    );

    const score = Math.round(
      issueResolutionRate * 35 +
        productivityScore * 30 +
        developmentScore * 20 +
        deploymentScore * 15,
    );

    let status = 'CRITICAL';

    if (score >= 80) {
      status = 'EXCELLENT';
    } else if (score >= 60) {
      status = 'GOOD';
    } else if (score >= 40) {
      status = 'WARNING';
    }

    return {
      projectId,
      score,
      status,
      metrics: {
        totalCompleted,
        totalOpenedIssues,
        totalResolvedIssues,
        totalCommits,
        totalDeployments,
        issueResolutionRate,
      },
    };
  }
}