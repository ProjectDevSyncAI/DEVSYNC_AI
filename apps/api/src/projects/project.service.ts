import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../database/prisma.service.js';
import { CreateProjectDto } from './dto/create-project.dto.js';

@Injectable()
export class ProjectService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    organizationId: string,
    dto: CreateProjectDto,
  ) {
    const membership = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        'You are not a member of this organization',
      );
    }

    if (!['OWNER', 'ADMIN', 'MANAGER'].includes(membership.role)) {
      throw new ForbiddenException(
        'You do not have permission to create projects',
      );
    }

    const existingProject = await this.prisma.project.findFirst({
      where: {
        organizationId,
        key: dto.key.trim().toUpperCase(),
      },
    });

    if (existingProject) {
      throw new ConflictException(
        'A project with this key already exists in the organization',
      );
    }

    const project = await this.prisma.project.create({
      data: {
        organizationId,
        createdById: userId,
        name: dto.name.trim(),
        key: dto.key.trim().toUpperCase(),
        description: dto.description?.trim() || null,
        status: dto.status,
        startDate: dto.startDate
          ? new Date(dto.startDate)
          : undefined,
        targetDate: dto.targetDate
          ? new Date(dto.targetDate)
          : undefined,
      },
    });

    await this.prisma.projectMember.create({
      data: {
        projectId: project.id,
        userId,
      },
    });

    return project;
  }

  async findAll(userId: string, organizationId: string) {
    const membership = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        'You are not a member of this organization',
      );
    }

    return this.prisma.project.findMany({
      where: {
        organizationId,
        members: {
          some: {
            userId,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
  async getMembers(userId: string, projectId: string) {
  const membership = await this.prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId,
      },
    },
  });

  if (!membership) {
    throw new ForbiddenException(
      'You are not a member of this project',
    );
  }

  return this.prisma.projectMember.findMany({
    where: {
      projectId,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: {
      joinedAt: 'asc',
    },
  });
}

async addMember(
  requesterId: string,
  projectId: string,
  targetUserId: string,
) {
  const requester = await this.prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId: requesterId,
      },
    },
    include: {
      project: {
        select: {
          organizationId: true,
        },
      },
    },
  });

  if (!requester) {
    throw new ForbiddenException(
      'You are not a member of this project',
    );
  }

  const organizationMembership =
    await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: requester.project.organizationId,
          userId: requesterId,
        },
      },
    });

  if (
    !organizationMembership ||
    !['OWNER', 'ADMIN', 'MANAGER'].includes(
      organizationMembership.role,
    )
  ) {
    throw new ForbiddenException(
      'You do not have permission to add project members',
    );
  }

  const targetUser = await this.prisma.user.findUnique({
    where: {
      id: targetUserId,
    },
  });

  if (!targetUser) {
    throw new NotFoundException('User not found');
  }

  const existing = await this.prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId: targetUserId,
      },
    },
  });

  if (existing) {
    throw new ConflictException(
      'User is already a member of this project',
    );
  }

  return this.prisma.projectMember.create({
    data: {
      projectId,
      userId: targetUserId,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
        },
      },
    },
  });
}

async removeMember(
  requesterId: string,
  projectId: string,
  targetUserId: string,
) {
  if (requesterId === targetUserId) {
    throw new ForbiddenException(
      'You cannot remove yourself from a project',
    );
  }

  const requester = await this.prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId: requesterId,
      },
    },
    include: {
      project: {
        select: {
          organizationId: true,
        },
      },
    },
  });

  if (!requester) {
    throw new ForbiddenException(
      'You are not a member of this project',
    );
  }

  const organizationMembership =
    await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: requester.project.organizationId,
          userId: requesterId,
        },
      },
    });

  if (
    !organizationMembership ||
    !['OWNER', 'ADMIN', 'MANAGER'].includes(
      organizationMembership.role,
    )
  ) {
    throw new ForbiddenException(
      'You do not have permission to remove project members',
    );
  }

  const targetMembership =
    await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: targetUserId,
        },
      },
    });

  if (!targetMembership) {
    throw new NotFoundException(
      'Project member not found',
    );
  }

  await this.prisma.projectMember.delete({
    where: {
      projectId_userId: {
        projectId,
        userId: targetUserId,
      },
    },
  });

  return {
    message: 'Project member removed successfully',
  };
}







  async findOne(userId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                username: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }
}