import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import * as crypto from 'node:crypto';
import { PrismaService } from '../database/prisma.service.js';
import { Prisma } from '../generated/prisma/client.js';
import { CreateInvitationDto } from './dto/create-invitation.dto.js';
import { AcceptInvitationDto } from './dto/accept-invitation.dto.js';
import { ListInvitationsQueryDto } from './dto/list-invitations-query.dto.js';
import { PreviewInvitationDto } from './dto/preview-invitation.dto.js';
import { InvitationPreviewRateLimiterService } from './invitation-preview-rate-limiter.service.js';

@Injectable()
export class OrganizationInvitationsService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional()
    private readonly rateLimiter?: InvitationPreviewRateLimiterService,
  ) {}

  /**
   * Helper to verify if an actor has OWNER or ADMIN role in an organization.
   * Returns the canonical role of the requester in that organization.
   */
  private async getRequesterOrgRole(
    prismaClient: any,
    organizationId: string,
    requesterId: string,
  ): Promise<'OWNER' | 'ADMIN' | null> {
    const org = await prismaClient.organization.findUnique({
      where: { id: organizationId },
      select: { id: true, ownerId: true },
    });

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    // Require active organization membership (F1: prevent stale ownerId bypass)
    const membership = await prismaClient.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId: requesterId,
        },
      },
      select: { role: true },
    });

    if (!membership) {
      return null;
    }

    if (membership.role === 'OWNER') {
      return 'OWNER';
    }

    if (membership.role === 'ADMIN') {
      return 'ADMIN';
    }

    return null;
  }

  /**
   * Create an organization invitation.
   * - Enforces role policy:
   *   - OWNER can invite: ADMIN, MANAGER, ENGINEER, VIEWER
   *   - ADMIN can invite: MANAGER, ENGINEER, VIEWER
   *   - Cannot invite OWNER role under any circumstances
   *   - Other roles cannot create invitations
   * - Generates 32-byte cryptographic token, stores only SHA-256 hash in DB.
   * - Returns raw token only once in creation response.
   */
  async createInvitation(
    requesterId: string,
    organizationId: string,
    dto: CreateInvitationDto,
  ) {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const MAX_RETRIES = 3;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        return await this.prisma.$transaction(
          async (tx) => {
            // 1. Verify organization existence and requester role
            const requesterRole = await this.getRequesterOrgRole(
              tx,
              organizationId,
              requesterId,
            );

            if (!requesterRole) {
              throw new ForbiddenException(
                'You do not have permission to manage invitations for this organization',
              );
            }

            // 2. Enforce invitation role policy
            if (dto.role === 'OWNER') {
              throw new ForbiddenException(
                'Cannot invite users with OWNER role',
              );
            }

            if (requesterRole === 'ADMIN' && dto.role === 'ADMIN') {
              throw new ForbiddenException(
                'Administrators cannot invite other administrators',
              );
            }

            const validRoles = ['ADMIN', 'MANAGER', 'ENGINEER', 'VIEWER'];
            if (!validRoles.includes(dto.role)) {
              throw new BadRequestException('Invalid organization role');
            }

            // 3. Reject if target email already belongs to an existing organization member
            const targetUser = await tx.user.findUnique({
              where: { email: normalizedEmail },
              select: { id: true },
            });

            if (targetUser) {
              const existingMember = await tx.organizationMember.findUnique({
                where: {
                  organizationId_userId: {
                    organizationId,
                    userId: targetUser.id,
                  },
                },
              });

              if (existingMember) {
                throw new ConflictException(
                  'User is already a member of this organization',
                );
              }
            }

            // 4. Reject duplicate pending invitations for same (organizationId, normalizedEmail)
            const now = new Date();
            const existingPending = await tx.organizationInvitation.findFirst({
              where: {
                organizationId,
                email: normalizedEmail,
                acceptedAt: null,
                expiresAt: {
                  gt: now,
                },
              },
            });

            if (existingPending) {
              throw new ConflictException(
                'An active invitation already exists for this email',
              );
            }

            // 5. Generate cryptographically secure token and compute SHA-256 hash
            const rawToken = crypto.randomBytes(32).toString('hex');
            const tokenHash = crypto
              .createHash('sha256')
              .update(rawToken)
              .digest('hex');

            // 6. Set 7-day expiration policy
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

            // 7. Persist invitation record (storing only the hash)
            const invitation = await tx.organizationInvitation.create({
              data: {
                organizationId,
                email: normalizedEmail,
                role: dto.role,
                token: tokenHash,
                expiresAt,
              },
            });

            // 8. Record audit log without storing raw token
            if (tx.auditLog) {
              await tx.auditLog.create({
                data: {
                  organizationId,
                  userId: requesterId,
                  action: 'INVITE',
                  entityType: 'OrganizationInvitation',
                  entityId: invitation.id,
                  description: `Invited ${normalizedEmail} with role ${dto.role}`,
                },
              });
            }

            // 9. Return safe response with raw token exposed only once
            return {
              id: invitation.id,
              organizationId: invitation.organizationId,
              email: invitation.email,
              role: invitation.role,
              expiresAt: invitation.expiresAt,
              createdAt: invitation.createdAt,
              rawToken,
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

        if (error?.code === 'P2002') {
          throw new ConflictException(
            'An active invitation already exists for this email',
          );
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
  }

  /**
   * List pending invitations for an organization.
   * - Strict exclusion of token hashes.
   * - Derived status: PENDING, ACCEPTED, EXPIRED.
   */
  async listInvitations(
    requesterId: string,
    organizationId: string,
    query: ListInvitationsQueryDto,
  ) {
    const requesterRole = await this.getRequesterOrgRole(
      this.prisma,
      organizationId,
      requesterId,
    );

    if (!requesterRole) {
      throw new ForbiddenException(
        'You do not have permission to view invitations for this organization',
      );
    }

    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const skip = (page - 1) * limit;

    const [invitations, total] = await Promise.all([
      this.prisma.organizationInvitation.findMany({
        where: { organizationId },
        select: {
          id: true,
          organizationId: true,
          email: true,
          role: true,
          expiresAt: true,
          acceptedAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.organizationInvitation.count({
        where: { organizationId },
      }),
    ]);

    const now = new Date();
    const items = invitations.map((inv) => ({
      id: inv.id,
      organizationId: inv.organizationId,
      email: inv.email,
      role: inv.role,
      createdAt: inv.createdAt,
      expiresAt: inv.expiresAt,
      acceptedAt: inv.acceptedAt,
      status: inv.acceptedAt
        ? 'ACCEPTED'
        : inv.expiresAt < now
        ? 'EXPIRED'
        : 'PENDING',
    }));

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 0,
    };
  }

  /**
   * Revoke a pending organization invitation.
   * - Only OWNER or ADMIN may revoke.
   * - Accepted invitations cannot be revoked.
   * - Removes the record under the existing schema.
   */
  async revokeInvitation(
    requesterId: string,
    organizationId: string,
    invitationId: string,
  ) {
    const MAX_RETRIES = 3;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        return await this.prisma.$transaction(
          async (tx) => {
            const requesterRole = await this.getRequesterOrgRole(
              tx,
              organizationId,
              requesterId,
            );

            if (!requesterRole) {
              throw new ForbiddenException(
                'You do not have permission to revoke invitations for this organization',
              );
            }

            const invitation = await tx.organizationInvitation.findUnique({
              where: { id: invitationId },
            });

            if (!invitation || invitation.organizationId !== organizationId) {
              throw new NotFoundException('Invitation not found');
            }

            if (invitation.acceptedAt !== null) {
              throw new ConflictException(
                'Cannot revoke an already accepted invitation',
              );
            }

            // F2: Atomic conditional deletion ensures mutual exclusion with concurrent acceptance
            const deleteResult = await tx.organizationInvitation.deleteMany({
              where: {
                id: invitationId,
                organizationId,
                acceptedAt: null,
              },
            });

            if (deleteResult.count !== 1) {
              throw new ConflictException(
                'Cannot revoke an already accepted invitation',
              );
            }

            if (tx.auditLog) {
              await tx.auditLog.create({
                data: {
                  organizationId,
                  userId: requesterId,
                  action: 'DELETE',
                  entityType: 'OrganizationInvitation',
                  entityId: invitationId,
                  description: `Revoked invitation for ${invitation.email}`,
                },
              });
            }

            return {
              message: 'Invitation revoked successfully',
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
  }

  /**
   * Accept an organization invitation.
   * - Hashes the incoming raw token to find the record.
   * - Validates token existence, expiration, non-accepted status.
   * - Enforces verified email check: if user.emailVerifiedAt is null, fails closed.
   * - Enforces recipient email matching.
   * - Atomically creates OrganizationMember and marks invitation accepted.
   */
  async acceptInvitation(userId: string, dto: AcceptInvitationDto) {
    const tokenHash = crypto
      .createHash('sha256')
      .update(dto.token.trim())
      .digest('hex');

    const MAX_RETRIES = 3;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        return await this.prisma.$transaction(
          async (tx) => {
            const invitation = await tx.organizationInvitation.findUnique({
              where: { token: tokenHash },
            });

            if (!invitation) {
              throw new NotFoundException('Invalid invitation token');
            }

            if (invitation.acceptedAt !== null) {
              throw new ConflictException(
                'Invitation has already been accepted',
              );
            }

            if (invitation.expiresAt < new Date()) {
              throw new BadRequestException('Invitation has expired');
            }

            const user = await tx.user.findUnique({
              where: { id: userId },
              select: {
                id: true,
                email: true,
                emailVerifiedAt: true,
              },
            });

            if (!user) {
              throw new NotFoundException('User not found');
            }

            // Verify normalized email matches invitation recipient
            if (
              user.email.trim().toLowerCase() !==
              invitation.email.trim().toLowerCase()
            ) {
              throw new ForbiddenException(
                'Authenticated email does not match invitation recipient',
              );
            }

            // CRITICAL: Verified email requirement
            if (!user.emailVerifiedAt) {
              throw new ForbiddenException(
                'Email address has not been verified. Email verification is required before accepting invitations.',
              );
            }

            // Verify user is not already an organization member
            const existingMember = await tx.organizationMember.findUnique({
              where: {
                organizationId_userId: {
                  organizationId: invitation.organizationId,
                  userId: user.id,
                },
              },
            });

            if (existingMember) {
              throw new ConflictException(
                'User is already a member of this organization',
              );
            }

            // F1: Atomic conditional consumption guarantees single-use and mutual exclusion
            const now = new Date();
            const consumptionResult = await tx.organizationInvitation.updateMany({
              where: {
                id: invitation.id,
                acceptedAt: null,
                expiresAt: { gt: now },
              },
              data: {
                acceptedAt: now,
              },
            });

            if (consumptionResult.count !== 1) {
              throw new ConflictException(
                'Invitation is no longer available',
              );
            }

            // Create organization member
            const member = await tx.organizationMember.create({
              data: {
                organizationId: invitation.organizationId,
                userId: user.id,
                role: invitation.role,
              },
            });

            if (tx.auditLog) {
              await tx.auditLog.create({
                data: {
                  organizationId: invitation.organizationId,
                  userId: user.id,
                  action: 'CREATE',
                  entityType: 'OrganizationMember',
                  entityId: member.id,
                  description: `Accepted invitation with role ${invitation.role}`,
                },
              });
            }

            return {
              message: 'Invitation accepted successfully',
              organizationId: invitation.organizationId,
              role: invitation.role,
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

        if (error?.code === 'P2002') {
          throw new ConflictException(
            'User is already a member of this organization',
          );
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
  }

  /**
   * Resend an organization invitation with secure token rotation.
   * - Authorized only for active OWNER or ADMIN of the organization.
   * - Cannot resend an already accepted invitation.
   * - Rotates the token: generates new 32-byte crypto token and stores SHA-256 hash.
   * - Immediately invalidates prior token.
   * - Resets expiration to exactly 7 days from now.
   * - Returns newly generated raw token once.
   * - Writes audit log.
   */
  async resendInvitation(
    requesterId: string,
    organizationId: string,
    invitationId: string,
  ) {
    const MAX_RETRIES = 3;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        return await this.prisma.$transaction(
          async (tx) => {
            const requesterRole = await this.getRequesterOrgRole(
              tx,
              organizationId,
              requesterId,
            );

            if (!requesterRole) {
              throw new ForbiddenException(
                'You do not have permission to manage invitations for this organization',
              );
            }

            const invitation = await tx.organizationInvitation.findUnique({
              where: { id: invitationId },
            });

            if (!invitation || invitation.organizationId !== organizationId) {
              throw new NotFoundException('Invitation not found');
            }

            if (invitation.acceptedAt !== null) {
              throw new ConflictException(
                'Cannot resend an already accepted invitation',
              );
            }

            // 1. Generate fresh 32-byte cryptographically secure token & SHA-256 hash
            const rawToken = crypto.randomBytes(32).toString('hex');
            const tokenHash = crypto
              .createHash('sha256')
              .update(rawToken)
              .digest('hex');

            // 2. Reset expiration to exactly 7 days from now
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

            // 3. Conditional update ensures mutual exclusion with concurrent acceptance
            const updateResult = await tx.organizationInvitation.updateMany({
              where: {
                id: invitationId,
                organizationId,
                acceptedAt: null,
              },
              data: {
                token: tokenHash,
                expiresAt,
              },
            });

            if (updateResult.count !== 1) {
              throw new ConflictException(
                'Cannot resend an already accepted invitation',
              );
            }

            // 4. Record audit event atomically
            if (tx.auditLog) {
              await tx.auditLog.create({
                data: {
                  organizationId,
                  userId: requesterId,
                  action: 'INVITE',
                  entityType: 'OrganizationInvitation',
                  entityId: invitationId,
                  description: `Resent invitation for ${invitation.email}`,
                },
              });
            }

            // 5. Return safe response with raw token exposed only once
            return {
              id: invitation.id,
              organizationId: invitation.organizationId,
              email: invitation.email,
              role: invitation.role,
              expiresAt,
              createdAt: invitation.createdAt,
              rawToken,
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
  }

  /**
   * Public preview of invitation metadata.
   * - Read-only: does not consume, rotate, or modify invitation state.
   * - Enforces distributed IP rate limiting.
   * - Hashes submitted raw token with SHA-256 before lookup.
   * - Verifies expiration and acceptance status.
   * - Masks recipient email to protect privacy.
   */
  async previewInvitation(dto: PreviewInvitationDto, clientIp?: string) {
    if (this.rateLimiter && clientIp) {
      await this.rateLimiter.checkIpRateLimit(clientIp);
    }

    const tokenHash = crypto
      .createHash('sha256')
      .update(dto.token.trim())
      .digest('hex');

    const invitation = await this.prisma.organizationInvitation.findUnique({
      where: { token: tokenHash },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invalid invitation token');
    }

    if (invitation.acceptedAt !== null) {
      throw new ConflictException('Invitation has already been accepted');
    }

    if (invitation.expiresAt < new Date()) {
      throw new BadRequestException('Invitation has expired');
    }

    return {
      organizationName: invitation.organization?.name || 'Organization',
      organizationSlug: invitation.organization?.slug || '',
      role: invitation.role,
      maskedEmail: this.maskEmail(invitation.email),
    };
  }

  /**
   * Helper to sanitize email address for safe preview and logging (e.g. j***e@example.com).
   */
  maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (!domain) return '***';
    const maskedLocal =
      local.length <= 2
        ? `${local[0]}***`
        : `${local[0]}***${local[local.length - 1]}`;
    return `${maskedLocal}@${domain}`;
  }
}
