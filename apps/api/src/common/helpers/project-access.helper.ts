import {
  ForbiddenException,
  NotFoundException,
} from '../errors/http-exceptions.js';
import type { PrismaService } from '../../database/prisma.service.js';

export async function assertProjectAccess(
  prisma: PrismaService,
  userId: string,
  projectId: string,
): Promise<{ projectId: string; organizationId: string }> {
  if (!userId) {
    throw new ForbiddenException('User is not authenticated');
  }

  if (!projectId) {
    throw new NotFoundException('Project ID is required');
  }

  // Verify user account is active if user model is queried
  if (prisma.user) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, status: true },
    });
    if (user && user.status !== 'ACTIVE') {
      throw new ForbiddenException('User account is inactive or suspended');
    }
  }

  const project = await prisma.project.findUnique({
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
      members: {
        where: { userId },
        select: { id: true },
      },
    },
  });

  if (!project) {
    throw new NotFoundException('Project not found');
  }

  // 1. Direct Project Member
  if (project.members && project.members.length > 0) {
    return { projectId: project.id, organizationId: project.organizationId };
  }

  // 2. Organization Member (Owner / Admin / Manager)
  const orgMembership = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId: project.organizationId,
        userId,
      },
    },
    select: {
      role: true,
    },
  });

  // Active Organization Owner (prevents stale ownerId access if removed or demoted)
  if (
    project.organization.ownerId === userId &&
    orgMembership?.role === 'OWNER'
  ) {
    return { projectId: project.id, organizationId: project.organizationId };
  }

  // Organization Admin / Manager
  if (
    orgMembership &&
    ['OWNER', 'ADMIN', 'MANAGER'].includes(orgMembership.role)
  ) {
    return { projectId: project.id, organizationId: project.organizationId };
  }

  throw new ForbiddenException('You do not have access to this project');
}

export async function getAuthorizedProjectIds(
  prisma: PrismaService,
  userId: string,
): Promise<string[]> {
  const [directProjects, orgAdminProjects] = await Promise.all([
    prisma.projectMember.findMany({
      where: { userId },
      select: { projectId: true },
    }),
    prisma.project.findMany({
      where: {
        organization: {
          OR: [
            { ownerId: userId },
            {
              members: {
                some: {
                  userId,
                  role: { in: ['OWNER', 'ADMIN', 'MANAGER'] },
                },
              },
            },
          ],
        },
      },
      select: { id: true },
    }),
  ]);

  const ids = new Set<string>([
    ...directProjects.map((p) => p.projectId),
    ...orgAdminProjects.map((p) => p.id),
  ]);

  return Array.from(ids);
}
