import {
  BadRequestException,
<<<<<<< HEAD
  ForbiddenException,
=======
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../database/prisma.service.js';
<<<<<<< HEAD
import { ActivityService } from '../activity/activity.service.js';
import { CreateIssueDto } from './dto/create-issue.dto.js';
import { UpdateIssueDto } from './dto/update-issue.dto.js';
import { assertProjectAccess } from '../common/helpers/project-access.helper.js';

@Injectable()
export class IssuesService {
  private readonly prisma: PrismaService;
  private readonly activityService?: ActivityService;

  constructor(prisma: PrismaService, activityService?: ActivityService) {
    this.prisma = prisma;
    this.activityService = activityService;
  }

  async create(userId: string, dto: CreateIssueDto) {
    await assertProjectAccess(this.prisma, userId, dto.projectId);

    // Reporter and Creator identities are strictly bound to the authenticated user
    const reporterId = userId;
=======

import { CreateIssueDto } from './dto/create-issue.dto.js';
import { UpdateIssueDto } from './dto/update-issue.dto.js';

@Injectable()
export class IssuesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateIssueDto) {
    const project = await this.prisma.project.findUnique({
      where: {
        id: dto.projectId,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const reporter = await this.prisma.user.findUnique({
      where: {
        id: dto.reporterId,
      },
    });

    if (!reporter) {
      throw new NotFoundException('Reporter not found');
    }

    const creator = await this.prisma.user.findUnique({
      where: {
        id: dto.creatorId,
      },
    });

    if (!creator) {
      throw new NotFoundException('Creator not found');
    }
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c

    if (dto.assigneeId) {
      const assignee = await this.prisma.user.findUnique({
        where: {
          id: dto.assigneeId,
        },
      });

      if (!assignee) {
        throw new NotFoundException('Assignee not found');
      }
<<<<<<< HEAD

      // Verify assignee is an authorized member of the project
      await assertProjectAccess(this.prisma, dto.assigneeId, dto.projectId);
=======
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
    }

    if (dto.repositoryId) {
      const repository = await this.prisma.repository.findUnique({
        where: {
          id: dto.repositoryId,
        },
      });

      if (!repository) {
        throw new NotFoundException('Repository not found');
      }
<<<<<<< HEAD

      if (repository.projectId !== dto.projectId) {
        throw new BadRequestException('Repository does not belong to this project');
      }
    }

    const execute = async (tx: any) => {
      const issue = await tx.issue.create({
        data: {
          projectId: dto.projectId,
          repositoryId: dto.repositoryId,
          assigneeId: dto.assigneeId,
          reporterId,
          creatorId: userId,
          title: dto.title,
          description: dto.description,
          type: dto.type,
          status: dto.status,
          priority: dto.priority,
          estimatedHours: dto.estimatedHours,
          dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        },
        include: {
          project: true,
          assignee: true,
          reporter: true,
          creator: true,
          repository: true,
        },
      });

      if (this.activityService) {
        await this.activityService.createEvent(
          {
            projectId: dto.projectId,
            userId,
            type: 'ISSUE_CREATED',
            title: `Issue created: ${issue.title}`,
            description: issue.description || undefined,
            entityType: 'ISSUE',
            entityId: issue.id,
            metadata: {
              issueId: issue.id,
              title: issue.title,
              type: issue.type,
              status: issue.status,
              priority: issue.priority,
              assigneeId: issue.assigneeId,
            },
          },
          tx,
        );
      }

      return issue;
    };

    if (typeof this.prisma?.$transaction === 'function') {
      return this.prisma.$transaction(execute);
    }
    return execute(this.prisma);
  }

  async findAllByProject(userId: string, projectId: string) {
    await assertProjectAccess(this.prisma, userId, projectId);
=======
    }

    return this.prisma.issue.create({
      data: {
        projectId: dto.projectId,
        repositoryId: dto.repositoryId,
        assigneeId: dto.assigneeId,
        reporterId: dto.reporterId,
        creatorId: dto.creatorId,
        title: dto.title,
        description: dto.description,
        type: dto.type,
        status: dto.status,
        priority: dto.priority,
        estimatedHours: dto.estimatedHours,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
      include: {
        project: true,
        assignee: true,
        reporter: true,
        creator: true,
        repository: true,
      },
    });
  }

  async findAllByProject(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: {
        id: projectId,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c

    return this.prisma.issue.findMany({
      where: {
        projectId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        assignee: true,
        reporter: true,
        creator: true,
        repository: true,
      },
    });
  }

<<<<<<< HEAD
  async findOne(userId: string, id: string) {
=======
  async findOne(id: string) {
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
    const issue = await this.prisma.issue.findUnique({
      where: {
        id,
      },
      include: {
        project: true,
        assignee: true,
        reporter: true,
        creator: true,
        repository: true,
      },
    });

    if (!issue) {
      throw new NotFoundException('Issue not found');
    }

<<<<<<< HEAD
    await assertProjectAccess(this.prisma, userId, issue.projectId);

    return issue;
  }

  async update(userId: string, id: string, dto: UpdateIssueDto) {
    const existing = await this.findOne(userId, id);
=======
    return issue;
  }

  async update(id: string, dto: UpdateIssueDto) {
    await this.findOne(id);
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c

    if (dto.assigneeId) {
      const assignee = await this.prisma.user.findUnique({
        where: {
          id: dto.assigneeId,
        },
      });

      if (!assignee) {
        throw new NotFoundException('Assignee not found');
      }
<<<<<<< HEAD

      // Verify assignee is an authorized member of the project
      await assertProjectAccess(this.prisma, dto.assigneeId, existing.projectId);
=======
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
    }

    if (dto.repositoryId) {
      const repository = await this.prisma.repository.findUnique({
        where: {
          id: dto.repositoryId,
        },
      });

      if (!repository) {
        throw new NotFoundException('Repository not found');
      }
<<<<<<< HEAD

      if (repository.projectId !== existing.projectId) {
        throw new BadRequestException('Repository does not belong to this project');
      }
=======
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
    }

    const data: any = {
      title: dto.title,
      description: dto.description,
      type: dto.type,
      status: dto.status,
      priority: dto.priority,
      repositoryId: dto.repositoryId,
      assigneeId: dto.assigneeId,
      estimatedHours: dto.estimatedHours,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
    };

    if (dto.status === 'RESOLVED' || dto.status === 'CLOSED') {
      data.resolvedAt = new Date();
    } else if (dto.status) {
      data.resolvedAt = null;
    }

<<<<<<< HEAD
    const execute = async (tx: any) => {
      const updated = await tx.issue.update({
        where: {
          id,
        },
        data,
        include: {
          project: true,
          assignee: true,
          reporter: true,
          creator: true,
          repository: true,
        },
      });

      if (this.activityService) {
        if (dto.status && dto.status !== existing.status) {
          await this.activityService.createEvent(
            {
              projectId: existing.projectId,
              userId,
              type: 'ISSUE_STATUS_CHANGED',
              title: `Issue status changed to ${dto.status}: ${updated.title}`,
              entityType: 'ISSUE',
              entityId: updated.id,
              metadata: {
                issueId: updated.id,
                oldStatus: existing.status,
                newStatus: updated.status,
              },
            },
            tx,
          );
        } else if (dto.assigneeId !== undefined && dto.assigneeId !== existing.assigneeId) {
          await this.activityService.createEvent(
            {
              projectId: existing.projectId,
              userId,
              type: 'ISSUE_ASSIGNED',
              title: dto.assigneeId ? `Issue assigned: ${updated.title}` : `Issue unassigned: ${updated.title}`,
              entityType: 'ISSUE',
              entityId: updated.id,
              metadata: {
                issueId: updated.id,
                oldAssigneeId: existing.assigneeId,
                newAssigneeId: updated.assigneeId,
              },
            },
            tx,
          );
        } else {
          const hasOtherChanges = Object.keys(dto).some(
            (k) => k !== 'status' && k !== 'assigneeId' && (dto as any)[k] !== undefined && (dto as any)[k] !== (existing as any)[k],
          );
          if (hasOtherChanges) {
            const updatedFields = Object.keys(dto).filter(
              (k) => (dto as any)[k] !== undefined && (dto as any)[k] !== (existing as any)[k],
            );
            await this.activityService.createEvent(
              {
                projectId: existing.projectId,
                userId,
                type: 'ISSUE_UPDATED',
                title: `Issue updated: ${updated.title}`,
                entityType: 'ISSUE',
                entityId: updated.id,
                metadata: {
                  issueId: updated.id,
                  title: updated.title,
                  status: updated.status,
                  priority: updated.priority,
                  updatedFields,
                },
              },
              tx,
            );
          }
        }
      }

      return updated;
    };

    if (typeof this.prisma?.$transaction === 'function') {
      return this.prisma.$transaction(execute);
    }
    return execute(this.prisma);
  }

  async remove(userId: string, id: string) {
    const existing = await this.findOne(userId, id);

    const execute = async (tx: any) => {
      await tx.issue.delete({
        where: {
          id,
        },
      });

      if (this.activityService) {
        await this.activityService.createEvent(
          {
            projectId: existing.projectId,
            userId,
            type: 'ISSUE_DELETED',
            title: `Issue deleted: ${existing.title}`,
            entityType: 'ISSUE',
            entityId: existing.id,
            metadata: {
              issueId: existing.id,
              title: existing.title,
            },
          },
          tx,
        );
      }

      return {
        success: true,
        message: 'Issue deleted successfully',
      };
    };

    if (typeof this.prisma?.$transaction === 'function') {
      return this.prisma.$transaction(execute);
    }
    return execute(this.prisma);
=======
    return this.prisma.issue.update({
      where: {
        id,
      },
      data,
      include: {
        project: true,
        assignee: true,
        reporter: true,
        creator: true,
        repository: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.issue.delete({
      where: {
        id,
      },
    });

    return {
      success: true,
      message: 'Issue deleted successfully',
    };
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
  }
}