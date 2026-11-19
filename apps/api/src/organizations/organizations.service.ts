import {
<<<<<<< HEAD
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../database/prisma.service.js';
import { CreateOrganizationDto } from './dto/create-organization.dto.js';
import { ListMembersQueryDto } from './dto/list-members-query.dto.js';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto.js';

export const MAX_MEMBER_PAGE = 10000;
export const MAX_MEMBER_LIMIT = 100;
export const MAX_MEMBER_OFFSET = 500000;

export function validateMemberPagination(
  pageInput?: any,
  limitInput?: any,
): { page: number; limit: number; skip: number } {
  const pageNum = pageInput === undefined ? 1 : Number(pageInput);
  const limitNum = limitInput === undefined ? 20 : Number(limitInput);

  if (
    !Number.isInteger(pageNum) ||
    pageNum < 1 ||
    !Number.isSafeInteger(pageNum)
  ) {
    throw new BadRequestException('Page must be a valid positive integer');
  }
  if (pageNum > MAX_MEMBER_PAGE) {
    throw new BadRequestException(`Page cannot exceed ${MAX_MEMBER_PAGE}`);
  }

  if (
    !Number.isInteger(limitNum) ||
    limitNum < 1 ||
    limitNum > MAX_MEMBER_LIMIT ||
    !Number.isSafeInteger(limitNum)
  ) {
    throw new BadRequestException(
      `Limit must be an integer between 1 and ${MAX_MEMBER_LIMIT}`,
    );
  }

  const skip = (pageNum - 1) * limitNum;
  if (!Number.isSafeInteger(skip) || skip > MAX_MEMBER_OFFSET) {
    throw new BadRequestException(
      `Pagination offset exceeds maximum permitted limit (${MAX_MEMBER_OFFSET})`,
    );
  }

  return { page: pageNum, limit: limitNum, skip };
}

const SAFE_USER_SELECT = {
  id: true,
  email: true,
  username: true,
  firstName: true,
  lastName: true,
  avatarUrl: true,
} as const;

const MEMBER_SELECT = {
  id: true,
  organizationId: true,
  userId: true,
  role: true,
  joinedAt: true,
  updatedAt: true,
  user: {
    select: SAFE_USER_SELECT,
  },
} as const;
=======
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { CreateOrganizationDto } from './dto/create-organization.dto.js';
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

<<<<<<< HEAD
  /**
   * Helper to execute operations with bounded retries on serialization failures (P2034).
   * Fast-fails on HTTP domain/authorization exceptions without retrying.
   */
  private async executeWithRetry<T>(operation: () => Promise<T>): Promise<T> {
    const MAX_RETRIES = 3;
    let lastError: any;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        return await operation();
      } catch (err: any) {
        lastError = err;
        // Bounded retry on Prisma serialization failure (P2034)
        if (err.code === 'P2034' && attempt < MAX_RETRIES) {
          const jitter = Math.random() * 50;
          await new Promise((resolve) => setTimeout(resolve, attempt * 50 + jitter));
          continue;
        }
        // Do not retry domain or authorization exceptions
        if (err instanceof HttpException) {
          throw err;
        }
        // Prisma unique constraint violation -> ConflictException
        if (err.code === 'P2002') {
          throw new ConflictException('A database conflict occurred');
        }
        throw err;
      }
    }
    throw lastError || new Error('Transaction retries exhausted');
  }

=======
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
  async create(userId: string, dto: CreateOrganizationDto) {
    const slug = dto.slug.trim().toLowerCase();

    const existing = await this.prisma.organization.findUnique({
      where: { slug },
    });

    if (existing) {
      throw new ConflictException(
        'An organization with this slug already exists',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: dto.name.trim(),
          slug,
          description: dto.description?.trim() || null,
          logoUrl: dto.logoUrl?.trim() || null,
          ownerId: userId,
        },
      });

      await tx.organizationMember.create({
        data: {
          organizationId: organization.id,
          userId,
          role: 'OWNER',
        },
      });

      return organization;
    });
  }

  async findMine(userId: string) {
    const memberships = await this.prisma.organizationMember.findMany({
      where: { userId },
      include: {
        organization: true,
      },
      orderBy: {
        joinedAt: 'asc',
      },
    });

    return memberships.map((membership) => ({
      ...membership.organization,
      role: membership.role,
      joinedAt: membership.joinedAt,
    }));
  }

  async findOne(userId: string, organizationId: string) {
<<<<<<< HEAD
    const membership = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
      include: {
        organization: {
          include: {
            members: {
              include: {
                user: {
                  select: SAFE_USER_SELECT,
=======
    const membership =
      await this.prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId,
            userId,
          },
        },
        include: {
          organization: {
            include: {
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
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
                },
              },
            },
          },
        },
<<<<<<< HEAD
      },
    });
=======
      });
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c

    if (!membership) {
      throw new NotFoundException('Organization not found');
    }

    return {
      ...membership.organization,
      currentUserRole: membership.role,
    };
  }
<<<<<<< HEAD

  /**
   * List organization members with bounded pagination, safe user projections,
   * deterministic offset bounds, and stable ordering.
   * Requirement: Requesting user must belong to the organization.
   */
  async listMembers(
    requesterId: string,
    organizationId: string,
    query: ListMembersQueryDto,
  ) {
    // 1. Verify caller belongs to this organization
    const callerMembership = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId: requesterId,
        },
      },
    });

    if (!callerMembership) {
      throw new ForbiddenException(
        'You do not have permission to view members of this organization',
      );
    }

    // 2. Validate pagination bounds and offset protection (F2)
    const { page, limit, skip } = validateMemberPagination(
      query.page,
      query.limit,
    );

    // 3. Query members and count in parallel
    const [items, total] = await Promise.all([
      this.prisma.organizationMember.findMany({
        where: { organizationId },
        select: MEMBER_SELECT,
        orderBy: [
          { joinedAt: 'desc' },
          { id: 'desc' },
        ],
        skip,
        take: limit,
      }),
      this.prisma.organizationMember.count({
        where: { organizationId },
      }),
    ]);

    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    return {
      items,
      page,
      limit,
      total,
      totalPages,
    };
  }

  /**
   * Update organization member role with hierarchy enforcement and canonical owner protection.
   * - OWNER can assign: ADMIN, MANAGER, ENGINEER, VIEWER (never OWNER).
   * - ADMIN can assign: MANAGER, ENGINEER, VIEWER to targets that are currently MANAGER, ENGINEER, VIEWER.
   * - ADMIN cannot modify OWNER or ADMIN members, and cannot assign ADMIN or OWNER.
   * - MANAGER, ENGINEER, VIEWER cannot modify roles.
   * - Self-modification of role is strictly prohibited.
   * - Canonical primary owner (matching Organization.ownerId) cannot be demoted.
   * - The last OWNER cannot be demoted.
   */
  async updateMemberRole(
    requesterId: string,
    organizationId: string,
    targetUserId: string,
    dto: UpdateMemberRoleDto,
  ) {
    // 1. Prohibit assigning OWNER role through this endpoint
    if (dto.role === 'OWNER') {
      throw new ForbiddenException(
        'Cannot assign OWNER role through this endpoint',
      );
    }

    if (!['ADMIN', 'MANAGER', 'ENGINEER', 'VIEWER'].includes(dto.role)) {
      throw new BadRequestException('Invalid organization role');
    }

    // 2. Prevent self-promotion or self-modification
    if (requesterId === targetUserId) {
      throw new ForbiddenException(
        'Self-modification of member role is not permitted',
      );
    }

    return await this.executeWithRetry(async () => {
      return await this.prisma.$transaction(
        async (tx) => {
          // Verify organization existence and fetch canonical ownerId
          const org = await tx.organization.findUnique({
            where: { id: organizationId },
            select: { id: true, ownerId: true },
          });

          if (!org) {
            throw new NotFoundException('Organization not found');
          }

          // Verify requester membership
          const requesterMember = await tx.organizationMember.findUnique({
            where: {
              organizationId_userId: {
                organizationId,
                userId: requesterId,
              },
            },
          });

          if (!requesterMember) {
            throw new ForbiddenException(
              'You are not a member of this organization',
            );
          }

          if (!['OWNER', 'ADMIN'].includes(requesterMember.role)) {
            throw new ForbiddenException(
              'You do not have permission to modify member roles',
            );
          }

          // Verify target membership
          const targetMember = await tx.organizationMember.findUnique({
            where: {
              organizationId_userId: {
                organizationId,
                userId: targetUserId,
              },
            },
          });

          if (!targetMember) {
            throw new NotFoundException(
              'Member not found in this organization',
            );
          }

          // Prevent redundant role modifications
          if (targetMember.role === dto.role) {
            throw new BadRequestException(
              'Member already has the specified role',
            );
          }

          // Enforce role hierarchy rules
          if (requesterMember.role === 'ADMIN') {
            // ADMIN cannot modify OWNER or ADMIN
            if (['OWNER', 'ADMIN'].includes(targetMember.role)) {
              throw new ForbiddenException(
                'ADMIN cannot modify OWNER or ADMIN members',
              );
            }
            // ADMIN cannot assign ADMIN or OWNER
            if (['OWNER', 'ADMIN'].includes(dto.role)) {
              throw new ForbiddenException(
                'ADMIN cannot assign ADMIN or OWNER roles',
              );
            }
          }

          // Canonical owner cannot be demoted while ownership transfer is unavailable (F1)
          if (org.ownerId === targetUserId && targetMember.role === 'OWNER') {
            throw new ConflictException(
              'Cannot demote the primary organization owner. Ownership transfer is required.',
            );
          }

          // If target is currently OWNER, enforce last-owner invariant
          if (targetMember.role === 'OWNER') {
            const ownerCount = await tx.organizationMember.count({
              where: {
                organizationId,
                role: 'OWNER',
              },
            });

            if (ownerCount <= 1) {
              throw new ConflictException(
                'Cannot demote the last organization owner',
              );
            }
          }

          // Capture previous role prior to mutation
          const previousRole = targetMember.role;

          // Update role
          const updated = await tx.organizationMember.update({
            where: {
              organizationId_userId: {
                organizationId,
                userId: targetUserId,
              },
            },
            data: {
              role: dto.role,
            },
            select: MEMBER_SELECT,
          });

          // Audit log
          await tx.auditLog.create({
            data: {
              organizationId,
              userId: requesterId,
              action: 'ROLE_CHANGE',
              entityType: 'OrganizationMember',
              entityId: `${organizationId}:${targetUserId}`,
              description: `User ${targetUserId} role updated from ${previousRole} to ${dto.role}`,
              metadata: {
                targetUserId,
                previousRole,
                newRole: dto.role,
                updatedBy: requesterId,
              },
            },
          });

          return updated;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    });
  }

  /**
   * Remove member from organization with canonical owner protection, last-owner invariant,
   * and atomic cleanup of ProjectMember records in the organization's projects.
   */
  async removeMember(
    requesterId: string,
    organizationId: string,
    targetUserId: string,
  ) {
    return await this.executeWithRetry(async () => {
      return await this.prisma.$transaction(
        async (tx) => {
          // 1. Verify organization existence and fetch canonical ownerId
          const org = await tx.organization.findUnique({
            where: { id: organizationId },
            select: { id: true, ownerId: true },
          });

          if (!org) {
            throw new NotFoundException('Organization not found');
          }

          // 2. Verify requester membership
          const requesterMember = await tx.organizationMember.findUnique({
            where: {
              organizationId_userId: {
                organizationId,
                userId: requesterId,
              },
            },
          });

          if (!requesterMember) {
            throw new ForbiddenException(
              'You are not a member of this organization',
            );
          }

          if (!['OWNER', 'ADMIN'].includes(requesterMember.role)) {
            throw new ForbiddenException(
              'You do not have permission to remove members from this organization',
            );
          }

          // 3. Verify target membership
          const targetMember = await tx.organizationMember.findUnique({
            where: {
              organizationId_userId: {
                organizationId,
                userId: targetUserId,
              },
            },
          });

          if (!targetMember) {
            throw new NotFoundException(
              'Member not found in this organization',
            );
          }

          // 4. Enforce role hierarchy rules
          if (requesterMember.role === 'ADMIN') {
            if (targetMember.role === 'OWNER') {
              throw new ForbiddenException('ADMIN cannot remove an OWNER');
            }
            if (targetMember.role === 'ADMIN') {
              throw new ForbiddenException('ADMIN cannot remove another ADMIN');
            }
          }

          // 5. Canonical owner cannot be removed while ownership transfer is unavailable (F1)
          if (org.ownerId === targetUserId) {
            throw new ConflictException(
              'Cannot remove the primary organization owner. Ownership transfer is required.',
            );
          }

          // 6. Last-owner protection
          if (targetMember.role === 'OWNER') {
            const ownerCount = await tx.organizationMember.count({
              where: {
                organizationId,
                role: 'OWNER',
              },
            });

            if (ownerCount <= 1) {
              throw new ConflictException(
                'Cannot remove the last organization owner',
              );
            }
          }

          // 7. Clean up ProjectMember records for projects belonging to this organization
          const orgProjects = await tx.project.findMany({
            where: { organizationId },
            select: { id: true },
          });

          const projectIds = orgProjects.map((p) => p.id);
          if (projectIds.length > 0) {
            await tx.projectMember.deleteMany({
              where: {
                userId: targetUserId,
                projectId: { in: projectIds },
              },
            });
          }

          // 8. Delete OrganizationMember
          await tx.organizationMember.delete({
            where: {
              organizationId_userId: {
                organizationId,
                userId: targetUserId,
              },
            },
          });

          // 9. Audit log
          await tx.auditLog.create({
            data: {
              organizationId,
              userId: requesterId,
              action: 'DELETE',
              entityType: 'OrganizationMember',
              entityId: `${organizationId}:${targetUserId}`,
              description: `User ${targetUserId} was removed from the organization`,
              metadata: {
                targetUserId,
                removedRole: targetMember.role,
                removedBy: requesterId,
              },
            },
          });

          return { message: 'Member removed successfully' };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    });
  }

  /**
   * Self-leave organization with canonical owner protection, last-owner invariant,
   * and atomic project cleanup.
   */
  async leaveOrganization(userId: string, organizationId: string) {
    return await this.executeWithRetry(async () => {
      return await this.prisma.$transaction(
        async (tx) => {
          // 1. Verify organization existence and canonical ownerId
          const org = await tx.organization.findUnique({
            where: { id: organizationId },
            select: { id: true, ownerId: true },
          });

          if (!org) {
            throw new NotFoundException('Organization not found');
          }

          // 2. Canonical owner cannot self-leave while ownership transfer is unavailable (F1)
          if (org.ownerId === userId) {
            throw new ConflictException(
              'Cannot leave organization as the primary owner. Ownership transfer is required.',
            );
          }

          // 3. Verify user membership
          const membership = await tx.organizationMember.findUnique({
            where: {
              organizationId_userId: {
                organizationId,
                userId,
              },
            },
          });

          if (!membership) {
            throw new NotFoundException(
              'You are not a member of this organization',
            );
          }

          // 4. Last-owner protection
          if (membership.role === 'OWNER') {
            const ownerCount = await tx.organizationMember.count({
              where: {
                organizationId,
                role: 'OWNER',
              },
            });

            if (ownerCount <= 1) {
              throw new ConflictException(
                'Cannot leave organization as the sole owner. Transfer ownership or assign another owner first.',
              );
            }
          }

          // 5. Clean up ProjectMember records for projects belonging to this organization
          const orgProjects = await tx.project.findMany({
            where: { organizationId },
            select: { id: true },
          });

          const projectIds = orgProjects.map((p) => p.id);
          if (projectIds.length > 0) {
            await tx.projectMember.deleteMany({
              where: {
                userId,
                projectId: { in: projectIds },
              },
            });
          }

          // 6. Delete OrganizationMember
          await tx.organizationMember.delete({
            where: {
              organizationId_userId: {
                organizationId,
                userId,
              },
            },
          });

          // 7. Audit log
          await tx.auditLog.create({
            data: {
              organizationId,
              userId,
              action: 'DELETE',
              entityType: 'OrganizationMember',
              entityId: `${organizationId}:${userId}`,
              description: `User ${userId} left the organization`,
              metadata: {
                userId,
                leftRole: membership.role,
              },
            },
          });

          return { message: 'Left organization successfully' };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    });
  }
}
=======
}
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
