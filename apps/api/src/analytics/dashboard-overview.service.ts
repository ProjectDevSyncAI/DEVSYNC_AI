import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

export interface ProjectMetadataOverview {
  id: string;
  name: string;
  key: string;
  description: string | null;
  status: string;
  memberCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskMetricsOverview {
  total: number;
  completed: number;
  inProgress: number;
  todo: number;
  inReview: number;
  blocked: number;
  cancelled: number;
  overdue: number;
}

export interface IssueMetricsOverview {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  reopened: number;
  byPriority: {
    LOW: number;
    MEDIUM: number;
    HIGH: number;
    CRITICAL: number;
  };
  byType: {
    BUG: number;
    FEATURE: number;
    TASK: number;
    IMPROVEMENT: number;
    EPIC: number;
  };
}

export interface ActiveSprintOverview {
  id: string;
  name: string;
  goal: string | null;
  startDate: Date;
  endDate: Date;
  capacity: number | null;
  totalTasks: number;
  completedTasks: number;
  remainingTasks: number;
  completionPercentage: number;
  plannedStoryPoints: number;
  completedStoryPoints: number;
  hasMultipleActiveSprints: boolean;
}

export interface DashboardOverviewResponse {
  project: ProjectMetadataOverview;
  tasks: TaskMetricsOverview;
  issues: IssueMetricsOverview;
  activeSprint: ActiveSprintOverview | null;
  timestamp: string;
}

@Injectable()
export class DashboardOverviewService {
  private readonly logger = new Logger(DashboardOverviewService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Aggregates real-time project metrics directly from live operational database entities:
   * - Project & ProjectMember
   * - Task (status, priority, dueDate, storyPoints)
   * - Issue (status, priority, type)
   * - Sprint (status, capacity, task relationships)
   */
  async getDashboardOverview(projectId: string): Promise<DashboardOverviewResponse> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        key: true,
        description: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    const now = new Date();

    // Parallel execution of operational queries
    const [
      memberCount,
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
      inReviewTasks,
      blockedTasks,
      cancelledTasks,
      overdueTasks,
      totalIssues,
      openIssues,
      inProgressIssues,
      resolvedIssues,
      closedIssues,
      reopenedIssues,
      issuePriorityGroups,
      issueTypeGroups,
      activeSprints,
    ] = await Promise.all([
      // Member count
      this.prisma.projectMember.count({ where: { projectId } }),

      // Task status metrics
      this.prisma.task.count({ where: { projectId } }),
      this.prisma.task.count({ where: { projectId, status: 'DONE' } }),
      this.prisma.task.count({ where: { projectId, status: 'IN_PROGRESS' } }),
      this.prisma.task.count({ where: { projectId, status: 'TODO' } }),
      this.prisma.task.count({ where: { projectId, status: 'IN_REVIEW' } }),
      this.prisma.task.count({ where: { projectId, status: 'BLOCKED' } }),
      this.prisma.task.count({ where: { projectId, status: 'CANCELLED' } }),

      // Overdue tasks: dueDate < now, excluding DONE and CANCELLED
      this.prisma.task.count({
        where: {
          projectId,
          dueDate: { lt: now },
          status: { notIn: ['DONE', 'CANCELLED'] },
        },
      }),

      // Issue status metrics
      this.prisma.issue.count({ where: { projectId } }),
      this.prisma.issue.count({ where: { projectId, status: 'OPEN' } }),
      this.prisma.issue.count({ where: { projectId, status: 'IN_PROGRESS' } }),
      this.prisma.issue.count({ where: { projectId, status: 'RESOLVED' } }),
      this.prisma.issue.count({ where: { projectId, status: 'CLOSED' } }),
      this.prisma.issue.count({ where: { projectId, status: 'REOPENED' } }),

      // Issue groupings
      this.prisma.issue.groupBy({
        by: ['priority'],
        where: { projectId },
        _count: { id: true },
      }),
      this.prisma.issue.groupBy({
        by: ['type'],
        where: { projectId },
        _count: { id: true },
      }),

      // Active sprints (fetch all active to report if multiple exist)
      this.prisma.sprint.findMany({
        where: {
          projectId,
          status: 'ACTIVE',
        },
        orderBy: {
          startDate: 'desc',
        },
      }),
    ]);

    // Format issue priorities
    const byPriority = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      CRITICAL: 0,
    };
    for (const group of issuePriorityGroups) {
      if (group.priority in byPriority) {
        byPriority[group.priority as keyof typeof byPriority] = group._count.id;
      }
    }

    // Format issue types
    const byType = {
      BUG: 0,
      FEATURE: 0,
      TASK: 0,
      IMPROVEMENT: 0,
      EPIC: 0,
    };
    for (const group of issueTypeGroups) {
      if (group.type in byType) {
        byType[group.type as keyof typeof byType] = group._count.id;
      }
    }

    // Process active sprint if one exists
    let activeSprintOverview: ActiveSprintOverview | null = null;
    if (activeSprints.length > 0) {
      const activeSprint = activeSprints[0];
      const sprintTasks = await this.prisma.task.findMany({
        where: { sprintId: activeSprint.id },
        select: { status: true, storyPoints: true },
      });

      const sprintTotalTasks = sprintTasks.length;
      const sprintCompletedTasks = sprintTasks.filter((t) => t.status === 'DONE').length;
      const sprintRemainingTasks = Math.max(0, sprintTotalTasks - sprintCompletedTasks);
      const completionPercentage =
        sprintTotalTasks > 0
          ? Math.round((sprintCompletedTasks / sprintTotalTasks) * 100)
          : 0;

      const plannedStoryPoints = sprintTasks.reduce(
        (sum, t) => sum + (t.storyPoints ?? 0),
        0,
      );
      const completedStoryPoints = sprintTasks
        .filter((t) => t.status === 'DONE')
        .reduce((sum, t) => sum + (t.storyPoints ?? 0), 0);

      activeSprintOverview = {
        id: activeSprint.id,
        name: activeSprint.name,
        goal: activeSprint.goal,
        startDate: activeSprint.startDate,
        endDate: activeSprint.endDate,
        capacity: activeSprint.capacity,
        totalTasks: sprintTotalTasks,
        completedTasks: sprintCompletedTasks,
        remainingTasks: sprintRemainingTasks,
        completionPercentage,
        plannedStoryPoints,
        completedStoryPoints,
        hasMultipleActiveSprints: activeSprints.length > 1,
      };
    }

    return {
      project: {
        id: project.id,
        name: project.name,
        key: project.key,
        description: project.description,
        status: project.status,
        memberCount,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      },
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        inProgress: inProgressTasks,
        todo: todoTasks,
        inReview: inReviewTasks,
        blocked: blockedTasks,
        cancelled: cancelledTasks,
        overdue: overdueTasks,
      },
      issues: {
        total: totalIssues,
        open: openIssues,
        inProgress: inProgressIssues,
        resolved: resolvedIssues,
        closed: closedIssues,
        reopened: reopenedIssues,
        byPriority,
        byType,
      },
      activeSprint: activeSprintOverview,
      timestamp: now.toISOString(),
    };
  }
}
