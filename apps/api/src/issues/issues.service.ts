import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../database/prisma.service.js';

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

    if (dto.assigneeId) {
      const assignee = await this.prisma.user.findUnique({
        where: {
          id: dto.assigneeId,
        },
      });

      if (!assignee) {
        throw new NotFoundException('Assignee not found');
      }
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

  async findOne(id: string) {
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

    return issue;
  }

  async update(id: string, dto: UpdateIssueDto) {
    await this.findOne(id);

    if (dto.assigneeId) {
      const assignee = await this.prisma.user.findUnique({
        where: {
          id: dto.assigneeId,
        },
      });

      if (!assignee) {
        throw new NotFoundException('Assignee not found');
      }
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
  }
}