import * as crypto from 'node:crypto';
import type { PrismaService } from '../database/prisma.service.js';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface.js';

export class SocketAuthError extends Error {
  readonly statusCode = 401;
  constructor(message: string) {
    super(message);
    this.name = 'SocketAuthError';
  }
}

export function extractSocketToken(
  authHeaderOrToken: string | undefined,
): string | undefined {
  if (!authHeaderOrToken) return undefined;
  const trimmed = authHeaderOrToken.trim();
  if (trimmed.toLowerCase().startsWith('bearer ')) {
    return trimmed.slice(7).trim();
  }
  return trimmed;
}

export function verifySocketTokenSync(
  rawToken: string | undefined,
  secret: string | undefined,
): AuthenticatedUser {
  if (!secret) {
    throw new SocketAuthError('JWT_SECRET is not configured');
  }

  const token = extractSocketToken(rawToken);
  if (!token) {
    throw new SocketAuthError('Authentication token is missing');
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new SocketAuthError('Malformed JWT token structure');
  }

  const [headerB64, payloadB64, signatureB64] = parts;

  // Verify HMAC signature
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(`${headerB64}.${payloadB64}`);
  const expectedSignature = hmac.digest('base64url');

  if (signatureB64 !== expectedSignature) {
    throw new SocketAuthError('Invalid JWT token signature');
  }

  let payload: any;
  try {
    const jsonStr = Buffer.from(payloadB64, 'base64url').toString('utf8');
    payload = JSON.parse(jsonStr);
  } catch {
    throw new SocketAuthError('Invalid JWT payload format');
  }

  // Check expiration
  const nowInSec = Math.floor(Date.now() / 1000);
  if (payload.exp && typeof payload.exp === 'number' && payload.exp < nowInSec) {
    throw new SocketAuthError('JWT token has expired');
  }

  if (!payload.sub) {
    throw new SocketAuthError('JWT token is missing subject identity');
  }

  return {
    userId: payload.sub,
    id: payload.sub,
    email: payload.email || '',
    username: payload.username || '',
    roles: payload.roles,
  };
}

export async function authorizeChannelAccess(
  prisma: PrismaService,
  userId: string,
  channelId: string,
): Promise<boolean> {
  if (!userId || !channelId) return false;

  const channel = await prisma.chatChannel.findUnique({
    where: { id: channelId },
    select: {
      id: true,
      projectId: true,
      isPrivate: true,
      members: {
        where: { userId },
        select: { id: true },
      },
      project: {
        select: {
          id: true,
          organizationId: true,
          organization: {
            select: { ownerId: true },
          },
          members: {
            where: { userId },
            select: { id: true },
          },
        },
      },
    },
  });

  if (!channel) return false;

  // 1. Direct channel member
  if (channel.members && channel.members.length > 0) {
    return true;
  }

  // If private channel, non-members cannot access unless Org Owner or Org Admin/Manager
  if (channel.isPrivate) {
    if (channel.project) {
      const orgMembership = await prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId: channel.project.organizationId,
            userId,
          },
        },
        select: { role: true },
      });

      if (
        orgMembership &&
        ['OWNER', 'ADMIN', 'MANAGER'].includes(orgMembership.role)
      ) {
        return true;
      }
    }
    return false;
  }

  // If public channel in a project, check project or org access
  if (channel.project) {
    // 2. Direct project member
    if (channel.project.members && channel.project.members.length > 0) {
      return true;
    }

    // 3. Organization Member (Owner / Admin / Manager)
    const orgMembership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: channel.project.organizationId,
          userId,
        },
      },
      select: { role: true },
    });

    if (
      orgMembership &&
      ['OWNER', 'ADMIN', 'MANAGER'].includes(orgMembership.role)
    ) {
      return true;
    }
  }

  return false;
}
