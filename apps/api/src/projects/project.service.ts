import {
  ConflictException,
  ForbiddenException,
<<<<<<< HEAD
  HttpException,
=======
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
  Injectable,
  NotFoundException,
} from '@nestjs/common';

<<<<<<< HEAD
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../database/prisma.service.js';
import { CreateProjectDto } from './dto/create-project.dto.js';
import { UpdateProjectDto } from './dto/update-project.dto.js';
=======
import { PrismaService } from '../database/prisma.service.js';
import { CreateProjectDto } from './dto/create-project.dto.js';
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c

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
<<<<<<< HEAD
  const MAX_RETRIES = 3;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await this.prisma.$transaction(
        async (tx) => {
          // 1. Verify project exists and retrieve parent organization details
          const project = await tx.project.findUnique({
            where: { id: projectId },
            select: {
              id: true,
              organizationId: true,
              organization: {
                select: {
                  id: true,
                  ownerId: true,
                },
              },
            },
          });

          if (!project) {
            throw new NotFoundException('Project not found');
          }

          const requesterOrgMembership =
            await tx.organizationMember.findUnique({
              where: {
                organizationId_userId: {
                  organizationId: project.organizationId,
                  userId: requesterId,
                },
              },
              select: {
                role: true,
              },
            });

          // Active org owner check (requires active OWNER role to prevent stale ownerId bypass)
          const isOrgOwner =
            project.organization?.ownerId === requesterId &&
            requesterOrgMembership?.role === 'OWNER';

          const isAuthorizedOrgRole =
            requesterOrgMembership &&
            ['OWNER', 'ADMIN', 'MANAGER'].includes(
              requesterOrgMembership.role,
            );

          if (!isOrgOwner && !isAuthorizedOrgRole) {
            throw new ForbiddenException(
              'You do not have permission to add project members',
            );
          }

          // 3. Verify target user exists globally
          const targetUser = await tx.user.findUnique({
            where: {
              id: targetUserId,
            },
            select: {
              id: true,
            },
          });

          if (!targetUser) {
            throw new NotFoundException('User not found');
          }

          // 4. CRITICAL SEC-INV-01 CHECK: Verify target user belongs to parent organization
          const targetOrgMembership =
            await tx.organizationMember.findUnique({
              where: {
                organizationId_userId: {
                  organizationId: project.organizationId,
                  userId: targetUserId,
                },
              },
            });

          if (!targetOrgMembership) {
            throw new ForbiddenException(
              'User is not a member of this organization',
            );
          }

          // 5. Verify target user is not already a member of this project
          const existing = await tx.projectMember.findUnique({
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

          // 6. Atomically insert project member with safe user projection
          return tx.projectMember.create({
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
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      );
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }

      // F5: Concurrency - handle unique constraint collision (P2002) as 409 Conflict
      if (error?.code === 'P2002') {
        throw new ConflictException(
          'User is already a member of this project',
        );
      }

      // F1: Concurrency - handle serialization failure (P2034) with bounded retry
      if (error?.code === 'P2034' && attempt < MAX_RETRIES) {
        await new Promise((resolve) =>
          setTimeout(resolve, attempt * 15 + Math.floor(Math.random() * 10)),
        );
        continue;
      }

      throw error;
    }
  }
  throw new Error('Transaction retries exhausted');
=======
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
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
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

<<<<<<< HEAD
  const MAX_RETRIES = 3;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await this.prisma.$transaction(
        async (tx) => {
          const project = await tx.project.findUnique({
            where: { id: projectId },
            select: {
              id: true,
              organizationId: true,
              organization: {
                select: {
                  id: true,
                  ownerId: true,
                },
              },
            },
          });

          if (!project) {
            throw new NotFoundException('Project not found');
          }

          const requesterOrgMembership =
            await tx.organizationMember.findUnique({
              where: {
                organizationId_userId: {
                  organizationId: project.organizationId,
                  userId: requesterId,
                },
              },
              select: {
                role: true,
              },
            });

          // Active org owner check (requires active OWNER role to prevent stale ownerId bypass)
          const isOrgOwner =
            project.organization?.ownerId === requesterId &&
            requesterOrgMembership?.role === 'OWNER';

          const isAuthorizedOrgRole =
            requesterOrgMembership &&
            ['OWNER', 'ADMIN', 'MANAGER'].includes(
              requesterOrgMembership.role,
            );

          if (!isOrgOwner && !isAuthorizedOrgRole) {
            throw new ForbiddenException(
              'You do not have permission to remove project members',
            );
          }

          const targetMembership =
            await tx.projectMember.findUnique({
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

          await tx.projectMember.delete({
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
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      );
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }

      if (error?.code === 'P2034' && attempt < MAX_RETRIES) {
        await new Promise((resolve) =>
          setTimeout(resolve, attempt * 15 + Math.floor(Math.random() * 10)),
        );
        continue;
      }

      throw error;
    }
  }
  throw new Error('Transaction retries exhausted');
=======
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
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
}







<<<<<<< HEAD

  async update(userId: string, projectId: string, dto: UpdateProjectDto) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        createdById: true,
        organizationId: true,
        startDate: true,
        targetDate: true,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const membership = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: project.organizationId,
          userId,
        },
      },
      select: { role: true },
    });

    const canManageOrganization =
      membership &&
      ['OWNER', 'ADMIN', 'MANAGER'].includes(membership.role);

    const isCreator = project.createdById === userId;

    if (!isCreator && !canManageOrganization) {
      throw new ForbiddenException(
        'You do not have permission to update this project',
      );
    }

    const startDate =
      dto.startDate !== undefined
        ? dto.startDate === null ? null : new Date(dto.startDate)
        : project.startDate;

    const targetDate =
      dto.targetDate !== undefined
        ? dto.targetDate === null ? null : new Date(dto.targetDate)
        : project.targetDate;

    if (startDate && targetDate && startDate > targetDate) {
      throw new ConflictException(
        'Project start date cannot be later than target date',
      );
    }

    const data: Prisma.ProjectUpdateInput = {};

    if (dto.name !== undefined) {
      data.name = dto.name.trim();
    }

    if (dto.description !== undefined) {
      data.description = dto.description?.trim() || null;
    }

    if (dto.status !== undefined) {
      data.status = dto.status;
    }

    if (dto.startDate !== undefined) {
      data.startDate = startDate;
    }

    if (dto.targetDate !== undefined) {
      data.targetDate = targetDate;
    }

    return this.prisma.project.update({
      where: { id: projectId },
      data,
    });
  }

=======
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
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
<<<<<<< HEAD
}
=======
}
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
