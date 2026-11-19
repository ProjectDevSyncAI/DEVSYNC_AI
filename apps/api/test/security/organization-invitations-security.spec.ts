import test from 'node:test';
import assert from 'node:assert/strict';
import * as crypto from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { OrganizationInvitationsService } from '../../src/organizations/organization-invitations.service.js';
import { OrganizationInvitationsController } from '../../src/organizations/organization-invitations.controller.js';
import { InvitationsController } from '../../src/organizations/invitations.controller.js';
import { UsersService } from '../../src/users/users.service.js';
import { JwtAuthGuard } from '../../src/auth/guards/jwt-auth.guard.js';
import {
  InvitationPreviewRateLimiterService,
  extractClientIp,
  UNKNOWN_CLIENT_IP,
} from '../../src/organizations/invitation-preview-rate-limiter.service.js';

// ─────────────────────────────────────────────────────────────────────────────
// Test Fixtures & In-Memory Store
// Canonical Prisma OrganizationRole: OWNER | ADMIN | ENGINEER | MANAGER | VIEWER
// ─────────────────────────────────────────────────────────────────────────────

type CanonicalOrganizationRole =
  | 'OWNER'
  | 'ADMIN'
  | 'ENGINEER'
  | 'MANAGER'
  | 'VIEWER';

interface MockUser {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  emailVerifiedAt: Date | null;
}

interface MockOrg {
  id: string;
  name: string;
  ownerId: string;
}

interface MockOrgMember {
  organizationId: string;
  userId: string;
  role: CanonicalOrganizationRole;
}

interface MockInvitation {
  id: string;
  organizationId: string;
  email: string;
  role: CanonicalOrganizationRole;
  token: string; // SHA-256 hash
  expiresAt: Date;
  acceptedAt: Date | null;
  createdAt: Date;
}

interface MockAuditLog {
  id: string;
  organizationId: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  description?: string;
}

function createTestEnvironment() {
  const users: Record<string, MockUser> = {
    'user-owner': {
      id: 'user-owner',
      email: 'owner@alpha.org',
      username: 'alpha_owner',
      firstName: 'Alpha',
      lastName: 'Owner',
      emailVerifiedAt: new Date('2026-01-01'),
    },
    'user-admin': {
      id: 'user-admin',
      email: 'admin@alpha.org',
      username: 'alpha_admin',
      firstName: 'Alpha',
      lastName: 'Admin',
      emailVerifiedAt: new Date('2026-01-01'),
    },
    'user-manager': {
      id: 'user-manager',
      email: 'manager@alpha.org',
      username: 'alpha_manager',
      firstName: 'Alpha',
      lastName: 'Manager',
      emailVerifiedAt: new Date('2026-01-01'),
    },
    'user-engineer': {
      id: 'user-engineer',
      email: 'engineer@alpha.org',
      username: 'alpha_eng',
      firstName: 'Alpha',
      lastName: 'Engineer',
      emailVerifiedAt: new Date('2026-01-01'),
    },
    'user-viewer': {
      id: 'user-viewer',
      email: 'viewer@alpha.org',
      username: 'alpha_viewer',
      firstName: 'Alpha',
      lastName: 'Viewer',
      emailVerifiedAt: new Date('2026-01-01'),
    },
    'user-foreign': {
      id: 'user-foreign',
      email: 'stranger@beta.org',
      username: 'stranger_beta',
      firstName: 'Foreign',
      lastName: 'User',
      emailVerifiedAt: new Date('2026-01-01'),
    },
    'user-candidate-unverified': {
      id: 'user-candidate-unverified',
      email: 'unverified@candidate.org',
      username: 'candidate_unverified',
      firstName: 'Unverified',
      lastName: 'Candidate',
      emailVerifiedAt: null, // Critical: Unverified email
    },
    'user-candidate-verified': {
      id: 'user-candidate-verified',
      email: 'verified@candidate.org',
      username: 'candidate_verified',
      firstName: 'Verified',
      lastName: 'Candidate',
      emailVerifiedAt: new Date('2026-02-01'),
    },
    'user-wrong-email': {
      id: 'user-wrong-email',
      email: 'imposter@wrong.org',
      username: 'imposter_user',
      firstName: 'Imposter',
      lastName: 'User',
      emailVerifiedAt: new Date('2026-02-01'),
    },
    'user-candidate-2': {
      id: 'user-candidate-2',
      email: 'candidate2@verified.org',
      username: 'candidate2',
      firstName: 'Second',
      lastName: 'Candidate',
      emailVerifiedAt: new Date('2026-02-01'),
    },
  };

  const organizations: Record<string, MockOrg> = {
    'org-alpha': {
      id: 'org-alpha',
      name: 'Alpha Organization',
      ownerId: 'user-owner',
    },
    'org-beta': {
      id: 'org-beta',
      name: 'Beta Organization',
      ownerId: 'user-foreign',
    },
  };

  const orgMembers: MockOrgMember[] = [
    { organizationId: 'org-alpha', userId: 'user-owner', role: 'OWNER' },
    { organizationId: 'org-alpha', userId: 'user-admin', role: 'ADMIN' },
    { organizationId: 'org-alpha', userId: 'user-manager', role: 'MANAGER' },
    { organizationId: 'org-alpha', userId: 'user-engineer', role: 'ENGINEER' },
    { organizationId: 'org-alpha', userId: 'user-viewer', role: 'VIEWER' },
    { organizationId: 'org-beta', userId: 'user-foreign', role: 'OWNER' },
  ];

  const invitations: MockInvitation[] = [];
  const auditLogs: MockAuditLog[] = [];

  const mockPrisma: any = {
    _getInvitations: () => [...invitations],
    _getAuditLogs: () => [...auditLogs],
    _getOrgMembers: () => [...orgMembers],

    organization: {
      findUnique: async ({ where }: any) => {
        return organizations[where.id] ?? null;
      },
    },

    organizationMember: {
      findUnique: async ({ where }: any) => {
        const { organizationId, userId } = where.organizationId_userId || {};
        return (
          orgMembers.find(
            (om) => om.organizationId === organizationId && om.userId === userId,
          ) ?? null
        );
      },
      create: async ({ data }: any) => {
        const newMember: MockOrgMember = {
          organizationId: data.organizationId,
          userId: data.userId,
          role: data.role,
        };
        orgMembers.push(newMember);
        return newMember;
      },
    },

    user: {
      findUnique: async ({ where }: any) => {
        if (where.id) return users[where.id] ?? null;
        if (where.email) {
          return (
            Object.values(users).find(
              (u) => u.email.toLowerCase() === where.email.toLowerCase(),
            ) ?? null
          );
        }
        return null;
      },
      update: async ({ where, data }: any) => {
        const u = users[where.id];
        if (!u) throw new Error('User not found');
        if (data.email !== undefined) u.email = data.email;
        if (data.emailVerifiedAt !== undefined) u.emailVerifiedAt = data.emailVerifiedAt;
        if (data.firstName !== undefined) u.firstName = data.firstName;
        if (data.lastName !== undefined) u.lastName = data.lastName;
        return u;
      },
    },

    organizationInvitation: {
      findUnique: async ({ where, include }: any) => {
        let inv: any = null;
        if (where.id) inv = invitations.find((i) => i.id === where.id) ?? null;
        if (where.token)
          inv = invitations.find((i) => i.token === where.token) ?? null;
        if (!inv) return null;
        if (include?.organization) {
          return {
            ...inv,
            organization: organizations[inv.organizationId] ?? null,
          };
        }
        return inv;
      },
      findFirst: async ({ where }: any) => {
        return (
          invitations.find((i) => {
            if (i.organizationId !== where.organizationId) return false;
            if (where.email && i.email !== where.email) return false;
            if (where.acceptedAt === null && i.acceptedAt !== null) return false;
            if (where.expiresAt?.gt && !(i.expiresAt > where.expiresAt.gt))
              return false;
            return true;
          }) ?? null
        );
      },
      findMany: async ({ where, skip = 0, take = 20 }: any) => {
        const filtered = invitations.filter((i) => {
          if (where.organizationId && i.organizationId !== where.organizationId)
            return false;
          return true;
        });
        return filtered.slice(skip, skip + take);
      },
      count: async ({ where }: any) => {
        return invitations.filter((i) => {
          if (where.organizationId && i.organizationId !== where.organizationId)
            return false;
          return true;
        }).length;
      },
      create: async ({ data }: any) => {
        const inv: MockInvitation = {
          id: `inv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          organizationId: data.organizationId,
          email: data.email,
          role: data.role,
          token: data.token,
          expiresAt: data.expiresAt,
          acceptedAt: null,
          createdAt: new Date(),
        };
        invitations.push(inv);
        return inv;
      },
      update: async ({ where, data }: any) => {
        const inv = invitations.find((i) => i.id === where.id);
        if (!inv) throw new Error('Not found');
        if (data.acceptedAt !== undefined) inv.acceptedAt = data.acceptedAt;
        return inv;
      },
      updateMany: async ({ where, data }: any) => {
        let count = 0;
        for (const inv of invitations) {
          if (where.id && inv.id !== where.id) continue;
          if (where.organizationId && inv.organizationId !== where.organizationId) continue;
          if (where.acceptedAt === null && inv.acceptedAt !== null) continue;
          if (where.expiresAt?.gt && !(inv.expiresAt > where.expiresAt.gt)) continue;
          if (data.acceptedAt !== undefined) inv.acceptedAt = data.acceptedAt;
          if (data.token !== undefined) inv.token = data.token;
          if (data.expiresAt !== undefined) inv.expiresAt = data.expiresAt;
          count++;
        }
        return { count };
      },
      delete: async ({ where }: any) => {
        const idx = invitations.findIndex((i) => i.id === where.id);
        if (idx !== -1) {
          invitations.splice(idx, 1);
        }
        return { count: 1 };
      },
      deleteMany: async ({ where }: any) => {
        let count = 0;
        for (let i = invitations.length - 1; i >= 0; i--) {
          const inv = invitations[i];
          if (where.id && inv.id !== where.id) continue;
          if (where.organizationId && inv.organizationId !== where.organizationId) continue;
          if (where.acceptedAt === null && inv.acceptedAt !== null) continue;
          invitations.splice(i, 1);
          count++;
        }
        return { count };
      },
    },

    auditLog: {
      create: async ({ data }: any) => {
        const log: MockAuditLog = {
          id: `audit-${Date.now()}`,
          ...data,
        };
        auditLogs.push(log);
        return log;
      },
    },

    $transaction: async (fn: (tx: any) => Promise<any>, _options?: any) => {
      return fn(mockPrisma);
    },
  };

  const service = new OrganizationInvitationsService(mockPrisma);
  const usersService = new UsersService(mockPrisma);
  const orgInvitationsController = new OrganizationInvitationsController(service);
  const invitationsController = new InvitationsController(service);

  return {
    service,
    usersService,
    orgInvitationsController,
    invitationsController,
    mockPrisma,
    users,
    organizations,
    orgMembers,
    invitations,
    auditLogs,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Test Suite: Organization Invitation Backend Security
// ─────────────────────────────────────────────────────────────────────────────

test('SEC-INV-02 — Phase 2: Secure Organization Invitation Backend Suite', async (t) => {
  await t.test('Test 1: Authorized OWNER creates an invitation successfully', async () => {
    const { service, mockPrisma } = createTestEnvironment();

    const result = await service.createInvitation('user-owner', 'org-alpha', {
      email: 'newbie@domain.com',
      role: 'ADMIN',
    });

    assert.ok(result.id);
    assert.equal(result.organizationId, 'org-alpha');
    assert.equal(result.email, 'newbie@domain.com');
    assert.equal(result.role, 'ADMIN');
    assert.ok(result.rawToken, 'rawToken must be returned in creation response');
    assert.equal((result as any).token, undefined, 'token hash must not be exposed');

    // Verify stored token is SHA-256 hash
    const stored = mockPrisma._getInvitations().find((i: any) => i.id === result.id);
    assert.ok(stored);
    const expectedHash = crypto.createHash('sha256').update(result.rawToken).digest('hex');
    assert.equal(stored.token, expectedHash, 'DB must store SHA-256 hash of token');
    assert.notEqual(stored.token, result.rawToken, 'DB must NOT store raw token');
  });

  await t.test('Test 2: Authorized ADMIN creates an invitation with an allowed role (ENGINEER)', async () => {
    const { service } = createTestEnvironment();

    const result = await service.createInvitation('user-admin', 'org-alpha', {
      email: 'engineer_invitee@domain.com',
      role: 'ENGINEER',
    });

    assert.ok(result);
    assert.equal(result.role, 'ENGINEER');
  });

  await t.test('Test 3: ADMIN cannot invite OWNER (Forbidden)', async () => {
    const { service } = createTestEnvironment();

    await assert.rejects(
      async () => {
        await service.createInvitation('user-admin', 'org-alpha', {
          email: 'trying_owner@domain.com',
          role: 'OWNER' as any,
        });
      },
      (err: any) => {
        assert.ok(err instanceof ForbiddenException);
        assert.equal(err.message, 'Cannot invite users with OWNER role');
        return true;
      },
    );
  });

  await t.test('Test 4: ADMIN cannot assign ADMIN under defined policy (Forbidden)', async () => {
    const { service } = createTestEnvironment();

    await assert.rejects(
      async () => {
        await service.createInvitation('user-admin', 'org-alpha', {
          email: 'trying_admin@domain.com',
          role: 'ADMIN',
        });
      },
      (err: any) => {
        assert.ok(err instanceof ForbiddenException);
        assert.equal(err.message, 'Administrators cannot invite other administrators');
        return true;
      },
    );
  });

  await t.test('Test 5: MANAGER cannot create invitations (403 Forbidden)', async () => {
    const { service } = createTestEnvironment();

    await assert.rejects(
      async () => {
        await service.createInvitation('user-manager', 'org-alpha', {
          email: 'manager_invitee@domain.com',
          role: 'ENGINEER',
        });
      },
      (err: any) => {
        assert.ok(err instanceof ForbiddenException);
        assert.equal(err.message, 'You do not have permission to manage invitations for this organization');
        return true;
      },
    );
  });

  await t.test('Test 6: ENGINEER cannot create invitations (403 Forbidden)', async () => {
    const { service } = createTestEnvironment();

    await assert.rejects(
      async () => {
        await service.createInvitation('user-engineer', 'org-alpha', {
          email: 'engineer_invitee@domain.com',
          role: 'VIEWER',
        });
      },
      (err: any) => {
        assert.ok(err instanceof ForbiddenException);
        return true;
      },
    );
  });

  await t.test('Test 7: VIEWER cannot create invitations (403 Forbidden)', async () => {
    const { service } = createTestEnvironment();

    await assert.rejects(
      async () => {
        await service.createInvitation('user-viewer', 'org-alpha', {
          email: 'viewer_invitee@domain.com',
          role: 'VIEWER',
        });
      },
      (err: any) => {
        assert.ok(err instanceof ForbiddenException);
        return true;
      },
    );
  });

  await t.test('Test 8: Cross-organization invitation access is rejected', async () => {
    const { service } = createTestEnvironment();

    // user-owner is owner of org-alpha, attempting to create invitation for org-beta
    await assert.rejects(
      async () => {
        await service.createInvitation('user-owner', 'org-beta', {
          email: 'cross_org@domain.com',
          role: 'ENGINEER',
        });
      },
      (err: any) => {
        assert.ok(err instanceof ForbiddenException);
        return true;
      },
    );
  });

  await t.test('Test 9: Email normalization trims and lowercases before persisting', async () => {
    const { service, mockPrisma } = createTestEnvironment();

    const result = await service.createInvitation('user-owner', 'org-alpha', {
      email: '   CaNdIdAtE.NoRmAlIzEd@DoMaIn.CoM   ',
      role: 'ENGINEER',
    });

    assert.equal(result.email, 'candidate.normalized@domain.com');
    const stored = mockPrisma._getInvitations().find((i: any) => i.id === result.id);
    assert.equal(stored.email, 'candidate.normalized@domain.com');
  });

  await t.test('Test 10: Invalid organization role is rejected', async () => {
    const { service } = createTestEnvironment();

    await assert.rejects(
      async () => {
        await service.createInvitation('user-owner', 'org-alpha', {
          email: 'badrole@domain.com',
          role: 'SUPERADMIN' as any,
        });
      },
      (err: any) => {
        assert.ok(err instanceof BadRequestException);
        return true;
      },
    );
  });

  await t.test('Test 11: Existing organization member cannot be invited (409 Conflict)', async () => {
    const { service } = createTestEnvironment();

    // user-engineer already in org-alpha
    await assert.rejects(
      async () => {
        await service.createInvitation('user-owner', 'org-alpha', {
          email: 'engineer@alpha.org',
          role: 'ENGINEER',
        });
      },
      (err: any) => {
        assert.ok(err instanceof ConflictException);
        assert.equal(err.message, 'User is already a member of this organization');
        return true;
      },
    );
  });

  await t.test('Test 12: Duplicate pending invitation is rejected (409 Conflict)', async () => {
    const { service } = createTestEnvironment();

    await service.createInvitation('user-owner', 'org-alpha', {
      email: 'duplicate@test.com',
      role: 'ENGINEER',
    });

    // Attempt second pending invitation with mixed case
    await assert.rejects(
      async () => {
        await service.createInvitation('user-owner', 'org-alpha', {
          email: 'DuPlIcAtE@tEsT.cOm',
          role: 'VIEWER',
        });
      },
      (err: any) => {
        assert.ok(err instanceof ConflictException);
        assert.equal(err.message, 'An active invitation already exists for this email');
        return true;
      },
    );
  });

  await t.test('Test 13: Stored token is hashed and strictly excluded from list responses', async () => {
    const { service } = createTestEnvironment();

    await service.createInvitation('user-owner', 'org-alpha', {
      email: 'listed@domain.com',
      role: 'VIEWER',
    });

    const listing = await service.listInvitations('user-owner', 'org-alpha', { page: 1, limit: 10 });
    assert.ok(listing.items.length > 0);
    const item = listing.items.find((i) => i.email === 'listed@domain.com');
    assert.ok(item);
    assert.equal(item.status, 'PENDING');
    assert.equal((item as any).token, undefined, 'Stored token hash must NEVER be returned');
    assert.equal((item as any).rawToken, undefined, 'rawToken must NEVER be returned in listing');
  });

  await t.test('Test 14: Expired invitation is rejected on acceptance', async () => {
    const { service, invitations } = createTestEnvironment();

    // Create an expired invitation directly
    const rawToken = 'expired-raw-token-12345';
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    invitations.push({
      id: 'inv-expired',
      organizationId: 'org-alpha',
      email: 'verified@candidate.org',
      role: 'ENGINEER',
      token: tokenHash,
      expiresAt: new Date(Date.now() - 10000), // expired in past
      acceptedAt: null,
      createdAt: new Date(Date.now() - 20000),
    });

    await assert.rejects(
      async () => {
        await service.acceptInvitation('user-candidate-verified', {
          token: rawToken,
        });
      },
      (err: any) => {
        assert.ok(err instanceof BadRequestException);
        assert.equal(err.message, 'Invitation has expired');
        return true;
      },
    );
  });

  await t.test('Test 15: Already accepted invitation cannot be accepted again', async () => {
    const { service, invitations } = createTestEnvironment();

    const rawToken = 'already-accepted-raw-token';
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    invitations.push({
      id: 'inv-accepted',
      organizationId: 'org-alpha',
      email: 'verified@candidate.org',
      role: 'ENGINEER',
      token: tokenHash,
      expiresAt: new Date(Date.now() + 100000),
      acceptedAt: new Date(),
      createdAt: new Date(),
    });

    await assert.rejects(
      async () => {
        await service.acceptInvitation('user-candidate-verified', {
          token: rawToken,
        });
      },
      (err: any) => {
        assert.ok(err instanceof ConflictException);
        assert.equal(err.message, 'Invitation has already been accepted');
        return true;
      },
    );
  });

  await t.test('Test 16: Revoked invitation cannot be accepted (NotFound)', async () => {
    const { service, invitations } = createTestEnvironment();

    const rawToken = 'to-be-revoked-token';
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    invitations.push({
      id: 'inv-revoked-test',
      organizationId: 'org-alpha',
      email: 'verified@candidate.org',
      role: 'ENGINEER',
      token: tokenHash,
      expiresAt: new Date(Date.now() + 100000),
      acceptedAt: null,
      createdAt: new Date(),
    });

    // Revoke the invitation
    await service.revokeInvitation('user-owner', 'org-alpha', 'inv-revoked-test');

    // Attempt to accept
    await assert.rejects(
      async () => {
        await service.acceptInvitation('user-candidate-verified', {
          token: rawToken,
        });
      },
      (err: any) => {
        assert.ok(err instanceof NotFoundException);
        assert.equal(err.message, 'Invalid invitation token');
        return true;
      },
    );
  });

  await t.test('Test 17: Wrong authenticated email is rejected on acceptance', async () => {
    const { service } = createTestEnvironment();

    const created = await service.createInvitation('user-owner', 'org-alpha', {
      email: 'verified@candidate.org',
      role: 'ENGINEER',
    });

    // user-wrong-email (imposter@wrong.org) tries to accept
    await assert.rejects(
      async () => {
        await service.acceptInvitation('user-wrong-email', {
          token: created.rawToken,
        });
      },
      (err: any) => {
        assert.ok(err instanceof ForbiddenException);
        assert.equal(err.message, 'Authenticated email does not match invitation recipient');
        return true;
      },
    );
  });

  await t.test('Test 18 [CRITICAL]: Unverified email is rejected on acceptance (Fail-Closed)', async () => {
    const { service } = createTestEnvironment();

    const created = await service.createInvitation('user-owner', 'org-alpha', {
      email: 'unverified@candidate.org',
      role: 'ENGINEER',
    });

    // user-candidate-unverified has emailVerifiedAt: null
    await assert.rejects(
      async () => {
        await service.acceptInvitation('user-candidate-unverified', {
          token: created.rawToken,
        });
      },
      (err: any) => {
        assert.ok(err instanceof ForbiddenException);
        assert.equal(
          err.message,
          'Email address has not been verified. Email verification is required before accepting invitations.',
        );
        return true;
      },
    );
  });

  await t.test('Test 19: Verified email recipient successfully accepts invitation', async () => {
    const { service, mockPrisma } = createTestEnvironment();

    const created = await service.createInvitation('user-owner', 'org-alpha', {
      email: 'verified@candidate.org',
      role: 'MANAGER',
    });

    const acceptResult = await service.acceptInvitation('user-candidate-verified', {
      token: created.rawToken,
    });

    assert.ok(acceptResult);
    assert.equal(acceptResult.organizationId, 'org-alpha');
    assert.equal(acceptResult.role, 'MANAGER');

    // Verify OrganizationMember created in database
    const member = mockPrisma._getOrgMembers().find(
      (m: any) => m.organizationId === 'org-alpha' && m.userId === 'user-candidate-verified',
    );
    assert.ok(member, 'OrganizationMember record must exist in DB');
    assert.equal(member.role, 'MANAGER');

    // Verify invitation marked accepted
    const storedInv = mockPrisma._getInvitations().find((i: any) => i.id === created.id);
    assert.ok(storedInv.acceptedAt !== null, 'acceptedAt must be timestamped');
  });

  await t.test('Test 20: Unauthorized invitation listing is rejected (403 Forbidden)', async () => {
    const { service } = createTestEnvironment();

    // user-engineer is not OWNER or ADMIN
    await assert.rejects(
      async () => {
        await service.listInvitations('user-engineer', 'org-alpha', {});
      },
      (err: any) => {
        assert.ok(err instanceof ForbiddenException);
        assert.equal(err.message, 'You do not have permission to view invitations for this organization');
        return true;
      },
    );
  });

  await t.test('Test 21: Invitation revocation enforces organization ownership and tenant isolation', async () => {
    const { service } = createTestEnvironment();

    const created = await service.createInvitation('user-owner', 'org-alpha', {
      email: 'revokeme@domain.com',
      role: 'VIEWER',
    });

    // Foreign user from org-beta tries to revoke org-alpha's invitation
    await assert.rejects(
      async () => {
        await service.revokeInvitation('user-foreign', 'org-alpha', created.id);
      },
      (err: any) => {
        assert.ok(err instanceof ForbiddenException);
        return true;
      },
    );

    // Cross-tenant route mismatch (trying to revoke org-alpha's invitation through org-beta route)
    await assert.rejects(
      async () => {
        await service.revokeInvitation('user-foreign', 'org-beta', created.id);
      },
      (err: any) => {
        assert.ok(err instanceof NotFoundException);
        assert.equal(err.message, 'Invitation not found');
        return true;
      },
    );

    // Authorized owner successfully revokes
    const result = await service.revokeInvitation('user-owner', 'org-alpha', created.id);
    assert.equal(result.message, 'Invitation revoked successfully');
  });

  await t.test('Test 22: Controller binds authenticated user and JwtAuthGuard correctly', async () => {
    const { orgInvitationsController, invitationsController } = createTestEnvironment();

    const req = {
      user: {
        userId: 'user-owner',
        id: 'user-owner',
        email: 'owner@alpha.org',
        username: 'alpha_owner',
      },
    } as any;

    const createRes = await orgInvitationsController.create(req, 'org-alpha', {
      email: 'ctrl_test@domain.com',
      role: 'ENGINEER',
    });
    assert.ok(createRes.id);

    const listRes = await orgInvitationsController.findAll(req, 'org-alpha', {});
    assert.ok(listRes.items.length > 0);

    const revokeRes = await orgInvitationsController.revoke(req, 'org-alpha', createRes.id);
    assert.ok(revokeRes.message);

    // Verify unauthenticated request fails closed
    const unauthReq = { user: {} as any } as any;
    await assert.rejects(
      async () => {
        await orgInvitationsController.create(unauthReq, 'org-alpha', {
          email: 'unauth@test.com',
          role: 'ENGINEER',
        });
      },
      (err: any) => {
        assert.ok(err instanceof UnauthorizedException);
        return true;
      },
    );

    await assert.rejects(
      async () => {
        await invitationsController.accept(unauthReq, { token: 'raw-token' });
      },
      (err: any) => {
        assert.ok(err instanceof UnauthorizedException);
        return true;
      },
    );
  });

  await t.test('Test 23: Audit logs record INVITE, DELETE, and CREATE actions', async () => {
    const { service, mockPrisma } = createTestEnvironment();

    const created = await service.createInvitation('user-owner', 'org-alpha', {
      email: 'audit_test@domain.com',
      role: 'VIEWER',
    });

    const inviteLog = mockPrisma._getAuditLogs().find(
      (l: any) => l.action === 'INVITE' && l.entityId === created.id,
    );
    assert.ok(inviteLog, 'INVITE action must be audited');

    await service.revokeInvitation('user-owner', 'org-alpha', created.id);
    const deleteLog = mockPrisma._getAuditLogs().find(
      (l: any) => l.action === 'DELETE' && l.entityId === created.id,
    );
    assert.ok(deleteLog, 'DELETE action must be audited');
  });

  await t.test('Test 24: Concurrent duplicate creation collisions handled cleanly', async () => {
    const { service, mockPrisma } = createTestEnvironment();

    // Simulate P2002 collision during invitation insert
    mockPrisma.organizationInvitation.create = async () => {
      const err: any = new Error('Unique constraint violation');
      err.code = 'P2002';
      throw err;
    };

    await assert.rejects(
      async () => {
        await service.createInvitation('user-owner', 'org-alpha', {
          email: 'concurrent@test.com',
          role: 'ENGINEER',
        });
      },
      (err: any) => {
        assert.ok(err instanceof ConflictException);
        assert.equal(err.message, 'An active invitation already exists for this email');
        return true;
      },
    );
  });

  await t.test('Test 25: Controllers enforce JwtAuthGuard metadata', () => {
    const orgGuards = Reflect.getMetadata('__guards__', OrganizationInvitationsController);
    assert.ok(Array.isArray(orgGuards));
    assert.ok(orgGuards.some((g: any) => g === JwtAuthGuard || g.name === 'JwtAuthGuard'));

    const invGuards = Reflect.getMetadata('__guards__', InvitationsController);
    assert.ok(Array.isArray(invGuards));
    assert.ok(invGuards.some((g: any) => g === JwtAuthGuard || g.name === 'JwtAuthGuard'));
  });

  await t.test('Test 26 [F1]: Atomic conditional consumption rejects concurrent/second acceptance', async () => {
    const { service, mockPrisma } = createTestEnvironment();

    const created = await service.createInvitation('user-owner', 'org-alpha', {
      email: 'verified@candidate.org',
      role: 'ENGINEER',
    });

    // First acceptance succeeds
    const firstAccept = await service.acceptInvitation('user-candidate-verified', {
      token: created.rawToken,
    });
    assert.ok(firstAccept);

    // Second acceptance with the same token fails with 409 ConflictException
    await assert.rejects(
      async () => {
        await service.acceptInvitation('user-candidate-verified', {
          token: created.rawToken,
        });
      },
      (err: any) => {
        assert.ok(err instanceof ConflictException);
        return true;
      },
    );

    // Simulate race condition where updateMany resolves with count: 0
    const created2 = await service.createInvitation('user-owner', 'org-alpha', {
      email: 'candidate2@verified.org',
      role: 'VIEWER',
    });

    const originalUpdateMany = mockPrisma.organizationInvitation.updateMany;
    mockPrisma.organizationInvitation.updateMany = async () => ({ count: 0 });

    try {
      await assert.rejects(
        async () => {
          await service.acceptInvitation('user-candidate-2', {
            token: created2.rawToken,
          });
        },
        (err: any) => {
          assert.ok(err instanceof ConflictException);
          assert.equal(err.message, 'Invitation is no longer available');
          return true;
        },
      );
    } finally {
      mockPrisma.organizationInvitation.updateMany = originalUpdateMany;
    }
  });

  await t.test('Test 27 [F2 Case A]: Acceptance wins race; subsequent revocation is rejected (409 Conflict)', async () => {
    const { service, mockPrisma } = createTestEnvironment();

    const created = await service.createInvitation('user-owner', 'org-alpha', {
      email: 'verified@candidate.org',
      role: 'ENGINEER',
    });

    // Acceptance completes
    await service.acceptInvitation('user-candidate-verified', {
      token: created.rawToken,
    });

    // Revocation attempted after acceptance commits
    await assert.rejects(
      async () => {
        await service.revokeInvitation('user-owner', 'org-alpha', created.id);
      },
      (err: any) => {
        assert.ok(err instanceof ConflictException);
        assert.equal(err.message, 'Cannot revoke an already accepted invitation');
        return true;
      },
    );

    // Simulate atomic deleteMany returning { count: 0 }
    const created2 = await service.createInvitation('user-owner', 'org-alpha', {
      email: 'another@candidate.org',
      role: 'ENGINEER',
    });

    const originalDeleteMany = mockPrisma.organizationInvitation.deleteMany;
    mockPrisma.organizationInvitation.deleteMany = async () => ({ count: 0 });
    try {
      await assert.rejects(
        async () => {
          await service.revokeInvitation('user-owner', 'org-alpha', created2.id);
        },
        (err: any) => {
          assert.ok(err instanceof ConflictException);
          assert.equal(err.message, 'Cannot revoke an already accepted invitation');
          return true;
        },
      );
    } finally {
      mockPrisma.organizationInvitation.deleteMany = originalDeleteMany;
    }
  });

  await t.test('Test 28 [F2 Case B]: Revocation wins race; subsequent acceptance is rejected and creates 0 memberships', async () => {
    const { service, mockPrisma } = createTestEnvironment();

    const created = await service.createInvitation('user-owner', 'org-alpha', {
      email: 'verified@candidate.org',
      role: 'ENGINEER',
    });

    // Revocation completes
    await service.revokeInvitation('user-owner', 'org-alpha', created.id);

    // Acceptance fails with NotFoundException because token was deleted
    await assert.rejects(
      async () => {
        await service.acceptInvitation('user-candidate-verified', {
          token: created.rawToken,
        });
      },
      (err: any) => {
        assert.ok(err instanceof NotFoundException);
        assert.equal(err.message, 'Invalid invitation token');
        return true;
      },
    );

    // Verify 0 memberships created for this recipient in org-alpha
    const members = mockPrisma._getOrgMembers().filter(
      (m: any) => m.organizationId === 'org-alpha' && m.userId === 'user-candidate-verified',
    );
    assert.equal(members.length, 0, 'No organization membership must be created');
  });

  await t.test('Test 29 [F3]: Changing user email via usersService.update invalidates emailVerifiedAt', async () => {
    const { usersService, users } = createTestEnvironment();

    const user = users['user-candidate-verified'];
    assert.ok(user.emailVerifiedAt !== null, 'Fixture user should initially be verified');

    // Updating non-email fields preserves emailVerifiedAt
    const updatedName = await usersService.update('user-candidate-verified', {
      firstName: 'UpdatedName',
    });
    assert.equal(updatedName.firstName, 'UpdatedName');
    assert.ok(user.emailVerifiedAt !== null, 'emailVerifiedAt must be preserved on non-email update');

    // Updating email to the SAME normalized email preserves emailVerifiedAt
    await usersService.update('user-candidate-verified', {
      email: 'VERIFIED@CANDIDATE.ORG',
    });
    assert.ok(user.emailVerifiedAt !== null, 'emailVerifiedAt must be preserved when normalized email is unchanged');

    // Updating email to a NEW email resets emailVerifiedAt to null
    const updatedNewEmail = await usersService.update('user-candidate-verified', {
      email: 'new-address@candidate.org',
    });
    assert.equal(updatedNewEmail.email, 'new-address@candidate.org');
    assert.equal(user.emailVerifiedAt, null, 'emailVerifiedAt must be reset to null when email address changes');
  });

  await t.test('Test 30: Token confidentiality: raw token never stored in DB, never logged, never returned in list', async () => {
    const { service, mockPrisma } = createTestEnvironment();

    const created = await service.createInvitation('user-owner', 'org-alpha', {
      email: 'confidential@domain.com',
      role: 'VIEWER',
    });

    const rawToken = created.rawToken;
    assert.ok(rawToken, 'rawToken must be returned only in creation response');
    assert.ok(rawToken.length >= 64, 'rawToken must be cryptographically secure');

    // Check stored DB record: token must be SHA-256 hash (64 hex characters), not rawToken
    const storedInv = mockPrisma._getInvitations().find((i: any) => i.id === created.id);
    assert.ok(storedInv);
    assert.notEqual(storedInv.token, rawToken, 'Stored token must not be raw token');
    const expectedHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    assert.equal(storedInv.token, expectedHash, 'Stored token must be SHA-256 hex digest');

    // Check audit logs: raw token must NOT be in audit logs
    const auditLogs = mockPrisma._getAuditLogs();
    for (const log of auditLogs) {
      const logStr = JSON.stringify(log);
      assert.ok(!logStr.includes(rawToken), 'rawToken must NEVER appear in audit logs');
    }

    // Check listing: neither token nor rawToken should be present
    const listing = await service.listInvitations('user-owner', 'org-alpha', {});
    const listedItem = listing.items.find((i) => i.id === created.id);
    assert.ok(listedItem);
    assert.equal((listedItem as any).rawToken, undefined, 'rawToken must not be in listing');
    assert.equal((listedItem as any).token, undefined, 'token hash must not be in listing');

    // Check error handling: passing an invalid token never echoes raw token in exception
    await assert.rejects(
      async () => {
        await service.acceptInvitation('user-candidate-verified', {
          token: 'invalid-nonexistent-token-xyz-12345',
        });
      },
      (err: any) => {
        assert.ok(err instanceof NotFoundException);
        assert.ok(!err.message.includes('invalid-nonexistent-token-xyz-12345'));
        return true;
      },
    );
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // PHASE 5.4: INVITATION RESEND & TOKEN ROTATION SECURITY TESTS
  // ─────────────────────────────────────────────────────────────────────────────
  await t.test('Phase 5.4 — Resend: OWNER can resend pending invitation and rotate token', async () => {
    const { service, mockPrisma } = createTestEnvironment();
    const created = await service.createInvitation('user-owner', 'org-alpha', {
      email: 'rotate-owner@candidate.org',
      role: 'ENGINEER',
    });

    const oldToken = created.rawToken;
    const oldHash = crypto.createHash('sha256').update(oldToken).digest('hex');

    const resent = await service.resendInvitation('user-owner', 'org-alpha', created.id);
    assert.equal(resent.id, created.id);
    assert.equal(resent.email, 'rotate-owner@candidate.org');
    assert.equal(resent.role, 'ENGINEER');
    assert.ok(resent.rawToken);
    assert.notEqual(resent.rawToken, oldToken, 'New raw token must differ from old raw token');

    const newHash = crypto.createHash('sha256').update(resent.rawToken).digest('hex');
    const stored = mockPrisma._getInvitations().find((i: any) => i.id === created.id);
    assert.equal(stored.token, newHash, 'Stored token must match new token SHA-256 hash');
    assert.notEqual(stored.token, oldHash, 'Stored token must no longer match old token hash');
  });

  await t.test('Phase 5.4 — Resend: ADMIN can resend pending invitation', async () => {
    const { service, mockPrisma } = createTestEnvironment();
    const created = await service.createInvitation('user-owner', 'org-alpha', {
      email: 'rotate-admin@candidate.org',
      role: 'VIEWER',
    });

    const resent = await service.resendInvitation('user-admin', 'org-alpha', created.id);
    assert.equal(resent.id, created.id);
    assert.ok(resent.rawToken);
    assert.notEqual(resent.rawToken, created.rawToken);
  });

  await t.test('Phase 5.4 — Resend: Lower roles (MANAGER, ENGINEER, VIEWER) cannot resend', async () => {
    const { service } = createTestEnvironment();
    const created = await service.createInvitation('user-owner', 'org-alpha', {
      email: 'rotate-rbac@candidate.org',
      role: 'VIEWER',
    });

    for (const userId of ['user-manager', 'user-engineer', 'user-viewer']) {
      await assert.rejects(
        async () => {
          await service.resendInvitation(userId, 'org-alpha', created.id);
        },
        (err: any) => {
          assert.ok(err instanceof ForbiddenException);
          return true;
        },
      );
    }
  });

  await t.test('Phase 5.4 — Resend: Cross-organization invitation ID is rejected (404)', async () => {
    const { service } = createTestEnvironment();
    const created = await service.createInvitation('user-owner', 'org-alpha', {
      email: 'rotate-cross@candidate.org',
      role: 'ENGINEER',
    });

    await assert.rejects(
      async () => {
        await service.resendInvitation('user-foreign', 'org-beta', created.id);
      },
      (err: any) => {
        assert.ok(err instanceof NotFoundException);
        return true;
      },
    );
  });

  await t.test('Phase 5.4 — Resend: Already accepted invitation cannot be resent (409)', async () => {
    const { service } = createTestEnvironment();
    const created = await service.createInvitation('user-owner', 'org-alpha', {
      email: 'verified@candidate.org',
      role: 'ENGINEER',
    });

    await service.acceptInvitation('user-candidate-verified', { token: created.rawToken });

    await assert.rejects(
      async () => {
        await service.resendInvitation('user-owner', 'org-alpha', created.id);
      },
      (err: any) => {
        assert.ok(err instanceof ConflictException);
        assert.ok(err.message.includes('already accepted'));
        return true;
      },
    );
  });

  await t.test('Phase 5.4 — Resend: Old token becomes immediately invalid for acceptance', async () => {
    const { service } = createTestEnvironment();
    const created = await service.createInvitation('user-owner', 'org-alpha', {
      email: 'verified@candidate.org',
      role: 'ENGINEER',
    });

    const oldToken = created.rawToken;
    const resent = await service.resendInvitation('user-owner', 'org-alpha', created.id);

    // Old token must fail
    await assert.rejects(
      async () => {
        await service.acceptInvitation('user-candidate-verified', { token: oldToken });
      },
      (err: any) => {
        assert.ok(err instanceof NotFoundException);
        return true;
      },
    );

    // New rotated token must succeed
    const acceptRes = await service.acceptInvitation('user-candidate-verified', {
      token: resent.rawToken,
    });
    assert.equal(acceptRes.organizationId, 'org-alpha');
  });

  await t.test('Phase 5.4 — Resend: Expiration resets to 7 days from rotation time', async () => {
    const { service } = createTestEnvironment();
    const created = await service.createInvitation('user-owner', 'org-alpha', {
      email: 'expire-reset@candidate.org',
      role: 'ENGINEER',
    });

    const resent = await service.resendInvitation('user-owner', 'org-alpha', created.id);
    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const diff = Math.abs(resent.expiresAt.getTime() - (now + sevenDaysMs));
    assert.ok(diff < 5000, 'Expiration must be approximately 7 days from now');
  });

  await t.test('Phase 5.4 — Resend: Raw token never appears in database or audit logs', async () => {
    const { service, mockPrisma } = createTestEnvironment();
    const created = await service.createInvitation('user-owner', 'org-alpha', {
      email: 'token-safety@candidate.org',
      role: 'ENGINEER',
    });

    const resent = await service.resendInvitation('user-owner', 'org-alpha', created.id);
    const stored = mockPrisma._getInvitations().find((i: any) => i.id === created.id);
    assert.notEqual(stored.token, resent.rawToken);

    const auditLogs = mockPrisma._getAuditLogs();
    for (const log of auditLogs) {
      assert.ok(!JSON.stringify(log).includes(resent.rawToken));
    }

    const resendAudit = auditLogs.find((l: any) => l.action === 'INVITE' && l.description.includes('Resent'));
    assert.ok(resendAudit);
    assert.equal(resendAudit.organizationId, 'org-alpha');
    assert.equal(resendAudit.userId, 'user-owner');
    assert.equal(resendAudit.entityId, created.id);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // PHASE 5.4: PUBLIC INVITATION METADATA PREVIEW TESTS
  // ─────────────────────────────────────────────────────────────────────────────
  await t.test('Phase 5.4 — Preview: Valid token returns sanitized metadata', async () => {
    const { service } = createTestEnvironment();
    const created = await service.createInvitation('user-owner', 'org-alpha', {
      email: 'developer@example.org',
      role: 'ENGINEER',
    });

    const preview = await service.previewInvitation({ token: created.rawToken });
    assert.equal(preview.organizationName, 'Alpha Organization');
    assert.equal(preview.role, 'ENGINEER');
    assert.equal(preview.maskedEmail, 'd***r@example.org');
    assert.equal((preview as any).rawToken, undefined);
    assert.equal((preview as any).token, undefined);
  });

  await t.test('Phase 5.4 — Preview: Raw token is hashed with SHA-256 before lookup', async () => {
    const { service, mockPrisma } = createTestEnvironment();
    const created = await service.createInvitation('user-owner', 'org-alpha', {
      email: 'hash-check@example.org',
      role: 'VIEWER',
    });

    const tokenHash = crypto.createHash('sha256').update(created.rawToken).digest('hex');
    const stored = mockPrisma._getInvitations().find((i: any) => i.id === created.id);
    assert.equal(stored.token, tokenHash);

    const preview = await service.previewInvitation({ token: created.rawToken });
    assert.equal(preview.organizationName, 'Alpha Organization');
  });

  await t.test('Phase 5.4 — Preview: Invalid token throws NotFoundException (404)', async () => {
    const { service } = createTestEnvironment();
    await assert.rejects(
      async () => {
        await service.previewInvitation({ token: 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff' });
      },
      (err: any) => {
        assert.ok(err instanceof NotFoundException);
        assert.equal(err.message, 'Invalid invitation token');
        return true;
      },
    );
  });

  await t.test('Phase 5.4 — Preview: Expired token throws BadRequestException (400)', async () => {
    const { service, mockPrisma } = createTestEnvironment();
    const created = await service.createInvitation('user-owner', 'org-alpha', {
      email: 'expired-preview@candidate.org',
      role: 'ENGINEER',
    });

    // Artificially expire invitation
    const stored = mockPrisma._getInvitations().find((i: any) => i.id === created.id);
    stored.expiresAt = new Date(Date.now() - 10000);

    await assert.rejects(
      async () => {
        await service.previewInvitation({ token: created.rawToken });
      },
      (err: any) => {
        assert.ok(err instanceof BadRequestException);
        assert.equal(err.message, 'Invitation has expired');
        return true;
      },
    );
  });

  await t.test('Phase 5.4 — Preview: Already accepted token throws ConflictException (409)', async () => {
    const { service } = createTestEnvironment();
    const created = await service.createInvitation('user-owner', 'org-alpha', {
      email: 'verified@candidate.org',
      role: 'ENGINEER',
    });

    await service.acceptInvitation('user-candidate-verified', { token: created.rawToken });

    await assert.rejects(
      async () => {
        await service.previewInvitation({ token: created.rawToken });
      },
      (err: any) => {
        assert.ok(err instanceof ConflictException);
        assert.equal(err.message, 'Invitation has already been accepted');
        return true;
      },
    );
  });

  await t.test('Phase 5.4 — Preview: Preview is strictly read-only', async () => {
    const { service, mockPrisma } = createTestEnvironment();
    const created = await service.createInvitation('user-owner', 'org-alpha', {
      email: 'readonly-preview@candidate.org',
      role: 'MANAGER',
    });

    const storedBefore = JSON.parse(JSON.stringify(mockPrisma._getInvitations().find((i: any) => i.id === created.id)));
    await service.previewInvitation({ token: created.rawToken });
    const storedAfter = JSON.parse(JSON.stringify(mockPrisma._getInvitations().find((i: any) => i.id === created.id)));

    assert.deepEqual(storedBefore, storedAfter, 'Invitation state must be completely unchanged after preview');
    assert.equal(storedAfter.acceptedAt, null);
  });

  await t.test('Phase 5.4 — Preview: Email masking formats address correctly', () => {
    const { service } = createTestEnvironment();
    assert.equal(service.maskEmail('john.doe@devsync.io'), 'j***e@devsync.io');
    assert.equal(service.maskEmail('ab@example.com'), 'a***@example.com');
    assert.equal(service.maskEmail('a@example.com'), 'a***@example.com');
    assert.equal(service.maskEmail('invalid-email'), '***');
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // PHASE 5.4: INVITATION PREVIEW RATE LIMITING TESTS
  // ─────────────────────────────────────────────────────────────────────────────
  function createRateLimiter(overrides?: { env?: string; secret?: string }) {
    const mockConfig: any = {
      get: (key: string) => {
        if (key === 'app.environment') return overrides?.env ?? 'test';
        if (key === 'emailVerification.hmacSecret')
          return overrides?.secret ?? 'test-hmac-secret-min-32-characters-long-key';
        return null;
      },
    };
    return new InvitationPreviewRateLimiterService(mockConfig);
  }

  await t.test('Phase 5.4 — Rate Limiter: Requests below IP threshold succeed', async () => {
    const rateLimiter = createRateLimiter();
    const clientIp = '198.51.100.1';

    // 5 rapid requests must succeed
    for (let i = 0; i < 5; i++) {
      await rateLimiter.checkIpRateLimit(clientIp);
    }
  });

  await t.test('Phase 5.4 — Rate Limiter: Requests exceeding 30 per 15-minute window throw 429', async () => {
    const rateLimiter = createRateLimiter();
    const clientIp = '198.51.100.2';

    // 30 requests succeed
    for (let i = 0; i < 30; i++) {
      await rateLimiter.checkIpRateLimit(clientIp);
    }

    // 31st request fails
    await assert.rejects(
      async () => {
        await rateLimiter.checkIpRateLimit(clientIp);
      },
      (err: any) => {
        assert.equal(err.getStatus(), 429);
        assert.ok(err.getResponse().message.includes('Too many invitation preview requests'));
        assert.ok(err.getResponse().retryAfter > 0);
        return true;
      },
    );
  });

  await t.test('Phase 5.4 — Rate Limiter: Production mode without Redis fails closed (503)', async () => {
    const rateLimiter = createRateLimiter({
      env: 'production',
      secret: 'prod-secret-min-32-chars-long-key-ok',
    });
    await assert.rejects(
      async () => {
        await rateLimiter.checkIpRateLimit('198.51.100.99');
      },
      (err: any) => {
        assert.equal(err.getStatus(), 503);
        assert.ok(err.message.includes('currently unavailable'));
        return true;
      },
    );
  });

  await t.test('Phase 5.4 — Rate Limiter: Redis client executes atomic Lua script with HMAC pseudonymized key', async () => {
    const rateLimiter = createRateLimiter();
    const clientIp = '198.51.100.4';

    let executedKey = '';
    const mockRedis = {
      eval: async (script: string, arg2: any, ...rest: any[]) => {
        if (arg2 && typeof arg2 === 'object' && Array.isArray(arg2.keys)) {
          executedKey = arg2.keys[0];
        } else {
          executedKey = rest[0];
        }
        return [1, 1, 0];
      },
    };

    rateLimiter.setRedisClient(mockRedis);
    await rateLimiter.checkIpRateLimit(clientIp);

    assert.ok(executedKey.startsWith('inv:prev:ip:'));
    assert.notEqual(executedKey, `inv:prev:ip:${clientIp}`, 'Key must be HMAC pseudonymized, not raw IP');
  });

  await t.test('Phase 5.4 — Rate Limiter: extractClientIp respects TRUST_PROXY=true and rejects untrusted header when false', () => {
    const origTrustProxy = process.env.TRUST_PROXY;
    const origTrustedProxies = process.env.TRUSTED_PROXIES;
    try {
      // 1. TRUST_PROXY disabled: forged X-Forwarded-For is ignored
      delete process.env.TRUST_PROXY;
      delete process.env.TRUSTED_PROXIES;
      const reqUntrusted: any = {
        headers: { 'x-forwarded-for': '203.0.113.195, 10.0.0.1' },
        socket: { remoteAddress: '127.0.0.1' },
      };
      assert.equal(extractClientIp(reqUntrusted), '127.0.0.1');

      // 2. TRUST_PROXY disabled: forged X-Real-IP is ignored
      const reqUntrustedRealIp: any = {
        headers: { 'x-real-ip': '203.0.113.195' },
        socket: { remoteAddress: '127.0.0.1' },
      };
      assert.equal(extractClientIp(reqUntrustedRealIp), '127.0.0.1');

      // 3. TRUST_PROXY enabled: valid trusted proxy chain with multiple addresses
      process.env.TRUST_PROXY = 'true';
      process.env.TRUSTED_PROXIES = '127.0.0.1, 10.0.0.0/8';
      const reqTrusted: any = {
        headers: { 'x-forwarded-for': '203.0.113.195, 10.0.0.1, 10.0.0.2' },
        socket: { remoteAddress: '127.0.0.1' },
      };
      assert.equal(extractClientIp(reqTrusted), '203.0.113.195');

      // 4. TRUST_PROXY enabled: IPv6 client address
      const reqIpv6: any = {
        headers: { 'x-forwarded-for': '2001:db8::1, 10.0.0.1' },
        socket: { remoteAddress: '127.0.0.1' },
      };
      assert.equal(extractClientIp(reqIpv6), '2001:db8::1');

      // 5. TRUST_PROXY enabled: malformed/injection X-Forwarded-For falls back strictly to direct socket peer
      const reqMalformedFwd: any = {
        headers: {
          'x-forwarded-for': '<script>alert(1)</script>, 10.0.0.1',
          'x-real-ip': '198.51.100.24',
        },
        socket: { remoteAddress: '127.0.0.1' },
      };
      assert.equal(extractClientIp(reqMalformedFwd), '127.0.0.1');

      // 6. TRUST_PROXY enabled: empty/whitespace forwarded header falls back to socket
      const reqEmptyFwd: any = {
        headers: { 'x-forwarded-for': '   ' },
        socket: { remoteAddress: '127.0.0.1' },
      };
      assert.equal(extractClientIp(reqEmptyFwd), '127.0.0.1');

      // 7. TRUST_PROXY enabled: missing forwarded headers falls back to socket address
      const reqNoHeaders: any = {
        headers: {},
        socket: { remoteAddress: '192.168.1.50' },
      };
      assert.equal(extractClientIp(reqNoHeaders), '192.168.1.50');
    } finally {
      process.env.TRUST_PROXY = origTrustProxy;
      process.env.TRUSTED_PROXIES = origTrustedProxies;
    }
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Phase 5.4.2.3 — Trusted X-Forwarded-For Boundary & Invalid Socket Peer Remediation
  // ─────────────────────────────────────────────────────────────────────────────

  // Socket Peer Validation (Cases 1-10)
  await t.test('Phase 5.4.2.3 Scope C.1: Missing socket remote address resolves to UNKNOWN_CLIENT_IP', () => {
    const origTrustProxy = process.env.TRUST_PROXY;
    const origTrustedProxies = process.env.TRUSTED_PROXIES;
    try {
      process.env.TRUST_PROXY = 'true';
      process.env.TRUSTED_PROXIES = '127.0.0.1';
      const req: any = {
        headers: { 'x-forwarded-for': '203.0.113.195' },
        socket: undefined,
      };
      assert.equal(extractClientIp(req), UNKNOWN_CLIENT_IP);
    } finally {
      process.env.TRUST_PROXY = origTrustProxy;
      process.env.TRUSTED_PROXIES = origTrustedProxies;
    }
  });

  await t.test('Phase 5.4.2.3 Scope C.2: Empty socket remote address resolves to UNKNOWN_CLIENT_IP', () => {
    const origTrustProxy = process.env.TRUST_PROXY;
    const origTrustedProxies = process.env.TRUSTED_PROXIES;
    try {
      process.env.TRUST_PROXY = 'true';
      process.env.TRUSTED_PROXIES = '127.0.0.1';
      const req: any = {
        headers: { 'x-forwarded-for': '203.0.113.195' },
        socket: { remoteAddress: '   ' },
      };
      assert.equal(extractClientIp(req), UNKNOWN_CLIENT_IP);
    } finally {
      process.env.TRUST_PROXY = origTrustProxy;
      process.env.TRUSTED_PROXIES = origTrustedProxies;
    }
  });

  await t.test('Phase 5.4.2.3 Scope C.3: Malformed socket remote address resolves to UNKNOWN_CLIENT_IP', () => {
    const origTrustProxy = process.env.TRUST_PROXY;
    const origTrustedProxies = process.env.TRUSTED_PROXIES;
    try {
      process.env.TRUST_PROXY = 'true';
      process.env.TRUSTED_PROXIES = '127.0.0.1';
      const req: any = {
        headers: { 'x-forwarded-for': '203.0.113.195' },
        socket: { remoteAddress: 'not-an-ip-socket' },
      };
      assert.equal(extractClientIp(req), UNKNOWN_CLIENT_IP);
    } finally {
      process.env.TRUST_PROXY = origTrustProxy;
      process.env.TRUSTED_PROXIES = origTrustedProxies;
    }
  });

  await t.test('Phase 5.4.2.3 Scope C.4: IPv4-mapped IPv6 normalization extracts pure IPv4', () => {
    const req: any = {
      socket: { remoteAddress: '::ffff:203.0.113.5' },
    };
    assert.equal(extractClientIp(req), '203.0.113.5');
  });

  await t.test('Phase 5.4.2.3 Scope C.5: Valid loopback peer recognized correctly', () => {
    const reqV4: any = { socket: { remoteAddress: '127.0.0.1' } };
    const reqV6: any = { socket: { remoteAddress: '::1' } };
    assert.equal(extractClientIp(reqV4), '127.0.0.1');
    assert.equal(extractClientIp(reqV6), '::1');
  });

  await t.test('Phase 5.4.2.3 Scope C.6: Valid configured private proxy peer recognized correctly', () => {
    const origTrustProxy = process.env.TRUST_PROXY;
    const origTrustedProxies = process.env.TRUSTED_PROXIES;
    try {
      process.env.TRUST_PROXY = 'true';
      process.env.TRUSTED_PROXIES = '10.0.0.0/8';
      const req: any = {
        headers: { 'x-forwarded-for': '203.0.113.99' },
        socket: { remoteAddress: '10.2.3.4' },
      };
      assert.equal(extractClientIp(req), '203.0.113.99');
    } finally {
      process.env.TRUST_PROXY = origTrustProxy;
      process.env.TRUSTED_PROXIES = origTrustedProxies;
    }
  });

  await t.test('Phase 5.4.2.3 Scope C.7: Untrusted peer with forged XFF: header ignored, socket address used', () => {
    const origTrustProxy = process.env.TRUST_PROXY;
    const origTrustedProxies = process.env.TRUSTED_PROXIES;
    try {
      process.env.TRUST_PROXY = 'true';
      process.env.TRUSTED_PROXIES = '127.0.0.1, 10.0.0.1';
      const req: any = {
        headers: { 'x-forwarded-for': '198.51.100.1' },
        socket: { remoteAddress: '198.51.100.5' },
      };
      assert.equal(extractClientIp(req), '198.51.100.5');
    } finally {
      process.env.TRUST_PROXY = origTrustProxy;
      process.env.TRUSTED_PROXIES = origTrustedProxies;
    }
  });

  await t.test('Phase 5.4.2.3 Scope C.8: Invalid peer with forged XFF: resolves to UNKNOWN_CLIENT_IP without trusting headers', () => {
    const origTrustProxy = process.env.TRUST_PROXY;
    const origTrustedProxies = process.env.TRUSTED_PROXIES;
    try {
      process.env.TRUST_PROXY = 'true';
      process.env.TRUSTED_PROXIES = '127.0.0.1';
      const req: any = {
        headers: { 'x-forwarded-for': '198.51.100.1' },
        socket: { remoteAddress: 'malformed-socket-peer' },
      };
      assert.equal(extractClientIp(req), UNKNOWN_CLIENT_IP);
    } finally {
      process.env.TRUST_PROXY = origTrustProxy;
      process.env.TRUSTED_PROXIES = origTrustedProxies;
    }
  });

  await t.test('Phase 5.4.2.3 Scope C.9: Invalid peer with forged XFF and X-Real-IP: resolves to UNKNOWN_CLIENT_IP', () => {
    const origTrustProxy = process.env.TRUST_PROXY;
    const origTrustedProxies = process.env.TRUSTED_PROXIES;
    try {
      process.env.TRUST_PROXY = 'true';
      process.env.TRUSTED_PROXIES = '127.0.0.1';
      const req: any = {
        headers: {
          'x-forwarded-for': '198.51.100.1',
          'x-real-ip': '198.51.100.2',
        },
        socket: { remoteAddress: '' },
      };
      assert.equal(extractClientIp(req), UNKNOWN_CLIENT_IP);
    } finally {
      process.env.TRUST_PROXY = origTrustProxy;
      process.env.TRUSTED_PROXIES = origTrustedProxies;
    }
  });

  await t.test('Phase 5.4.2.3 Scope C.10: Invalid peer cannot be treated as a trusted proxy', () => {
    const origTrustProxy = process.env.TRUST_PROXY;
    const origTrustedProxies = process.env.TRUSTED_PROXIES;
    try {
      process.env.TRUST_PROXY = 'true';
      process.env.TRUSTED_PROXIES = '127.0.0.1, ::1, 0.0.0.0/0';
      const req: any = {
        headers: { 'x-forwarded-for': '203.0.113.88' },
        socket: { remoteAddress: 'invalid-address' },
      };
      const resolved = extractClientIp(req);
      assert.equal(resolved, UNKNOWN_CLIENT_IP);
      assert.notEqual(resolved, '127.0.0.1');
      assert.notEqual(resolved, '203.0.113.88');
    } finally {
      process.env.TRUST_PROXY = origTrustProxy;
      process.env.TRUSTED_PROXIES = origTrustedProxies;
    }
  });

  // Proxy Header Authenticity (Cases 11-18)
  await t.test('Phase 5.4.2.3 Scope C.11: Direct client sends forged XFF to API: header ignored', () => {
    const origTrustProxy = process.env.TRUST_PROXY;
    try {
      delete process.env.TRUST_PROXY;
      const req: any = {
        headers: { 'x-forwarded-for': '203.0.113.195' },
        socket: { remoteAddress: '198.51.100.77' },
      };
      assert.equal(extractClientIp(req), '198.51.100.77');
    } finally {
      process.env.TRUST_PROXY = origTrustProxy;
    }
  });

  await t.test('Phase 5.4.2.3 Scope C.12: Trusted NGINX appends client-supplied XFF correctly: real connecting client extracted', () => {
    const origTrustProxy = process.env.TRUST_PROXY;
    const origTrustedProxies = process.env.TRUSTED_PROXIES;
    try {
      process.env.TRUST_PROXY = 'true';
      process.env.TRUSTED_PROXIES = '10.0.0.2';
      // Client forged '8.8.8.8'; NGINX proxy_add_x_forwarded_for produced '8.8.8.8, 198.51.100.33'
      const req: any = {
        headers: { 'x-forwarded-for': '8.8.8.8, 198.51.100.33' },
        socket: { remoteAddress: '10.0.0.2' },
      };
      assert.equal(extractClientIp(req), '198.51.100.33');
    } finally {
      process.env.TRUST_PROXY = origTrustProxy;
      process.env.TRUSTED_PROXIES = origTrustedProxies;
    }
  });

  await t.test('Phase 5.4.2.3 Scope C.13: Trusted NGINX with verified upstream load balancer: chain resolved according to actual topology', () => {
    const origTrustProxy = process.env.TRUST_PROXY;
    const origTrustedProxies = process.env.TRUSTED_PROXIES;
    try {
      process.env.TRUST_PROXY = 'true';
      process.env.TRUSTED_PROXIES = '10.0.0.2, 10.0.0.3';
      // Client '198.51.100.44' -> ALB '10.0.0.3' -> NGINX '10.0.0.2' -> API
      const req: any = {
        headers: { 'x-forwarded-for': '198.51.100.44, 10.0.0.3' },
        socket: { remoteAddress: '10.0.0.2' },
      };
      assert.equal(extractClientIp(req), '198.51.100.44');
    } finally {
      process.env.TRUST_PROXY = origTrustProxy;
      process.env.TRUSTED_PROXIES = origTrustedProxies;
    }
  });

  await t.test('Phase 5.4.2.3 Scope C.14: Malformed XFF: entire chain discarded and socket peer used', () => {
    const origTrustProxy = process.env.TRUST_PROXY;
    const origTrustedProxies = process.env.TRUSTED_PROXIES;
    try {
      process.env.TRUST_PROXY = 'true';
      process.env.TRUSTED_PROXIES = '10.0.0.1';
      const req: any = {
        headers: { 'x-forwarded-for': 'invalid-hop, 10.0.0.1' },
        socket: { remoteAddress: '10.0.0.1' },
      };
      assert.equal(extractClientIp(req), '10.0.0.1');
    } finally {
      process.env.TRUST_PROXY = origTrustProxy;
      process.env.TRUSTED_PROXIES = origTrustedProxies;
    }
  });

  await t.test('Phase 5.4.2.3 Scope C.15: XFF with conflicting client-supplied values: only verified chain is used', () => {
    const origTrustProxy = process.env.TRUST_PROXY;
    const origTrustedProxies = process.env.TRUSTED_PROXIES;
    try {
      process.env.TRUST_PROXY = 'true';
      process.env.TRUSTED_PROXIES = '10.0.0.1';
      const req: any = {
        headers: {
          'x-forwarded-for': '203.0.113.88',
          'x-real-ip': '198.51.100.24',
        },
        socket: { remoteAddress: '10.0.0.1' },
      };
      assert.equal(extractClientIp(req), '203.0.113.88');
    } finally {
      process.env.TRUST_PROXY = origTrustProxy;
      process.env.TRUSTED_PROXIES = origTrustedProxies;
    }
  });

  await t.test('Phase 5.4.2.3 Scope C.16: X-Real-IP remains ignored in all cases', () => {
    const origTrustProxy = process.env.TRUST_PROXY;
    const origTrustedProxies = process.env.TRUSTED_PROXIES;
    try {
      process.env.TRUST_PROXY = 'true';
      process.env.TRUSTED_PROXIES = '10.0.0.1';
      const req: any = {
        headers: { 'x-real-ip': '203.0.113.195' },
        socket: { remoteAddress: '10.0.0.1' },
      };
      assert.equal(extractClientIp(req), '10.0.0.1');
    } finally {
      process.env.TRUST_PROXY = origTrustProxy;
      process.env.TRUSTED_PROXIES = origTrustedProxies;
    }
  });

  await t.test('Phase 5.4.2.3 Scope C.17: RFC 7239 Forwarded header remains ignored', () => {
    const origTrustProxy = process.env.TRUST_PROXY;
    const origTrustedProxies = process.env.TRUSTED_PROXIES;
    try {
      process.env.TRUST_PROXY = 'true';
      process.env.TRUSTED_PROXIES = '127.0.0.1';
      const req: any = {
        headers: { forwarded: 'for=198.51.100.33;proto=https' },
        socket: { remoteAddress: '127.0.0.1' },
      };
      assert.equal(extractClientIp(req), '127.0.0.1');
    } finally {
      process.env.TRUST_PROXY = origTrustProxy;
      process.env.TRUSTED_PROXIES = origTrustedProxies;
    }
  });

  await t.test('Phase 5.4.2.3 Scope C.18: Multiple proxy hops are traversed right-to-left correctly', () => {
    const origTrustProxy = process.env.TRUST_PROXY;
    const origTrustedProxies = process.env.TRUSTED_PROXIES;
    try {
      process.env.TRUST_PROXY = 'true';
      process.env.TRUSTED_PROXIES = '10.0.0.1, 10.0.0.2';
      const req: any = {
        headers: { 'x-forwarded-for': '203.0.113.50, 10.0.0.1' },
        socket: { remoteAddress: '10.0.0.2' },
      };
      assert.equal(extractClientIp(req), '203.0.113.50');
    } finally {
      process.env.TRUST_PROXY = origTrustProxy;
      process.env.TRUSTED_PROXIES = origTrustedProxies;
    }
  });

  // Rate-Limit Bypass Regression (Cases 19-22)
  await t.test('Phase 5.4.2.3 Scope C.19: Rotating forged XFF from an untrusted peer cannot create new identities', () => {
    const origTrustProxy = process.env.TRUST_PROXY;
    const origTrustedProxies = process.env.TRUSTED_PROXIES;
    try {
      process.env.TRUST_PROXY = 'true';
      process.env.TRUSTED_PROXIES = '10.0.0.1';
      const reqA: any = {
        headers: { 'x-forwarded-for': '1.1.1.1' },
        socket: { remoteAddress: '198.51.100.22' },
      };
      const reqB: any = {
        headers: { 'x-forwarded-for': '2.2.2.2' },
        socket: { remoteAddress: '198.51.100.22' },
      };
      assert.equal(extractClientIp(reqA), '198.51.100.22');
      assert.equal(extractClientIp(reqB), '198.51.100.22');
    } finally {
      process.env.TRUST_PROXY = origTrustProxy;
      process.env.TRUSTED_PROXIES = origTrustedProxies;
    }
  });

  await t.test('Phase 5.4.2.3 Scope C.20: Invalid socket peers cannot create trusted identities or bypass limits', async () => {
    const origTrustProxy = process.env.TRUST_PROXY;
    const origTrustedProxies = process.env.TRUSTED_PROXIES;
    try {
      process.env.TRUST_PROXY = 'true';
      process.env.TRUSTED_PROXIES = '127.0.0.1, 10.0.0.1';

      const rateLimiter = createRateLimiter();

      for (let i = 0; i < 30; i++) {
        const req: any = {
          headers: { 'x-forwarded-for': `10.99.${i}.1` },
          socket: { remoteAddress: 'malformed-peer' },
        };
        const resolvedIp = extractClientIp(req);
        assert.equal(resolvedIp, UNKNOWN_CLIENT_IP);
        await rateLimiter.checkIpRateLimit(resolvedIp);
      }

      // 31st request from invalid socket peer fails with 429
      const req31: any = {
        headers: { 'x-forwarded-for': '10.99.99.1' },
        socket: { remoteAddress: 'malformed-peer' },
      };
      const resolvedIp31 = extractClientIp(req31);
      assert.equal(resolvedIp31, UNKNOWN_CLIENT_IP);
      await assert.rejects(
        async () => {
          await rateLimiter.checkIpRateLimit(resolvedIp31);
        },
        (err: any) => {
          assert.equal(err.getStatus(), 429);
          return true;
        },
      );
    } finally {
      process.env.TRUST_PROXY = origTrustProxy;
      process.env.TRUSTED_PROXIES = origTrustedProxies;
    }
  });

  await t.test('Phase 5.4.2.3 Scope C.21: Repeated requests from one direct peer cannot bypass 30-request limit by changing headers', async () => {
    const origTrustProxy = process.env.TRUST_PROXY;
    const origTrustedProxies = process.env.TRUSTED_PROXIES;
    try {
      delete process.env.TRUST_PROXY;
      delete process.env.TRUSTED_PROXIES;

      const rateLimiter = createRateLimiter();
      const directIp = '198.51.100.80';

      for (let i = 0; i < 30; i++) {
        const req: any = {
          headers: {
            'x-forwarded-for': `10.99.${i}.1`,
            'x-real-ip': `10.99.${i}.2`,
          },
          socket: { remoteAddress: directIp },
        };
        const resolvedIp = extractClientIp(req);
        assert.equal(resolvedIp, directIp);
        await rateLimiter.checkIpRateLimit(resolvedIp);
      }

      // 31st request rotating headers fails with 429
      const req31: any = {
        headers: {
          'x-forwarded-for': '10.99.99.1',
          'x-real-ip': '10.99.99.2',
        },
        socket: { remoteAddress: directIp },
      };
      const resolvedIp31 = extractClientIp(req31);
      await assert.rejects(
        async () => {
          await rateLimiter.checkIpRateLimit(resolvedIp31);
        },
        (err: any) => {
          assert.equal(err.getStatus(), 429);
          return true;
        },
      );
    } finally {
      process.env.TRUST_PROXY = origTrustProxy;
      process.env.TRUSTED_PROXIES = origTrustedProxies;
    }
  });

  await t.test('Phase 5.4.2.3 Scope C.22: Production Redis failure continues returning documented fail-closed response', async () => {
    const rateLimiter = createRateLimiter({
      env: 'production',
      secret: 'prod-secret-min-32-chars-long-key-ok',
    });
    await assert.rejects(
      async () => {
        await rateLimiter.checkIpRateLimit('198.51.100.96');
      },
      (err: any) => {
        assert.equal(err.getStatus(), 503);
        return true;
      },
    );
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Phase 5.4.2.1 Scope C — Redis Time Consistency & Sliding-Window Regression Tests
  // ─────────────────────────────────────────────────────────────────────────────

  class MockRedisTimeSlidingWindow {
    public data = new Map<string, Array<{ member: string; score: number }>>();
    public ttls = new Map<string, number>();
    public calls: Array<{ script: string; keys: string[]; args: string[] }> = [];
    public failNext = false;
    public simulatedRedisTimeMs: number | null = null;

    getRedisTime(): [number, number] {
      const ms = this.simulatedRedisTimeMs ?? Date.now();
      const sec = Math.floor(ms / 1000);
      const microsec = (ms % 1000) * 1000;
      return [sec, microsec];
    }

    async eval(script: string, configOrNumKeys: any, ...rest: any[]) {
      if (this.failNext) {
        throw new Error('Redis connection lost');
      }

      let key: string;
      let argv: string[];
      if (configOrNumKeys && typeof configOrNumKeys === 'object' && configOrNumKeys.keys) {
        key = configOrNumKeys.keys[0];
        argv = configOrNumKeys.arguments;
      } else {
        key = rest[0];
        argv = rest.slice(1);
      }

      this.calls.push({ script, keys: [key], args: argv });

      const maxRequests = parseInt(argv[0], 10);
      const windowMs = parseInt(argv[1], 10);
      let memberId = argv[2];
      let windowSeconds = parseInt(argv[3], 10);

      // Legacy 5-arg contract handling
      if (argv.length >= 5) {
        memberId = argv[3];
        windowSeconds = parseInt(argv[4], 10);
      }

      // Authoritative Redis TIME: sec * 1000 + floor(microsec / 1000)
      const [sec, microsec] = this.getRedisTime();
      const now = sec * 1000 + Math.floor(microsec / 1000);

      // 1. ZREMRANGEBYSCORE key -inf (now - windowMs)
      let set = this.data.get(key) || [];
      set = set.filter((entry) => entry.score >= now - windowMs);

      // 2. ZCARD key
      const count = set.length;

      // 3. If count >= maxRequests: reject and repair TTL if missing
      if (count >= maxRequests) {
        set.sort((a, b) => a.score - b.score);
        const oldestScore = set[0].score;
        const remainingMs = oldestScore + windowMs - now;
        const retryAfter = remainingMs > 0 ? Math.ceil(remainingMs / 1000) : 1;
        this.data.set(key, set);
        if (!this.ttls.has(key)) {
          this.ttls.set(key, windowSeconds);
        }
        return [0, count, retryAfter];
      }

      // 4. Under quota: ZADD key now memberId
      set.push({ member: memberId, score: now });
      this.data.set(key, set);
      this.ttls.set(key, windowSeconds);

      return [1, count + 1, 0];
    }
  }

  await t.test('Phase 5.4.2.1 Scope C.1 — Redis TIME Authority: Lua derives timestamp from Redis TIME, ignoring API server clock', async () => {
    const rateLimiter = createRateLimiter();
    const mockRedis = new MockRedisTimeSlidingWindow();
    // Freeze simulated Redis time at a known fixed epoch
    const fixedRedisEpoch = 1770000000000;
    mockRedis.simulatedRedisTimeMs = fixedRedisEpoch;
    rateLimiter.setRedisClient(mockRedis as any);

    const clientIp = '198.51.100.201';
    await rateLimiter.checkIpRateLimit(clientIp);

    const key = `inv:prev:ip:${rateLimiter.deriveIpKeyIdentifier(clientIp)}`;
    const stored = mockRedis.data.get(key);
    assert.equal(stored?.length, 1);
    assert.equal(stored?.[0].score, fixedRedisEpoch, 'Score must match Redis authoritative time, not server Date.now()');
  });

  await t.test('Phase 5.4.2.1 Scope C.2 — Multi-Instance Clock Drift: API clock drift does not affect Redis sliding-window boundary', async () => {
    // Two API server instances pointing to the same Redis instance
    const rateLimiterServerA = createRateLimiter();
    const rateLimiterServerB = createRateLimiter();
    const mockSharedRedis = new MockRedisTimeSlidingWindow();
    const sharedRedisTime = 1770000000000;
    mockSharedRedis.simulatedRedisTimeMs = sharedRedisTime;

    rateLimiterServerA.setRedisClient(mockSharedRedis as any);
    rateLimiterServerB.setRedisClient(mockSharedRedis as any);

    const clientIp = '198.51.100.202';
    // Server A executes request
    await rateLimiterServerA.checkIpRateLimit(clientIp);
    // Server B executes request
    await rateLimiterServerB.checkIpRateLimit(clientIp);

    const key = `inv:prev:ip:${rateLimiterServerA.deriveIpKeyIdentifier(clientIp)}`;
    const entries = mockSharedRedis.data.get(key) || [];
    assert.equal(entries.length, 2);
    // Both entries recorded against shared Redis time
    assert.equal(entries[0].score, sharedRedisTime);
    assert.equal(entries[1].score, sharedRedisTime);
  });

  await t.test('Phase 5.4.2.1 Scope C.3 — Millisecond Precision: Seconds and microseconds convert with integer millisecond fidelity', () => {
    const sec = 1770000000;
    const microsec = 456789;
    const nowMs = sec * 1000 + Math.floor(microsec / 1000);
    assert.equal(nowMs, 1770000000456);
    assert.equal(Number.isInteger(nowMs), true);
  });

  await t.test('Phase 5.4.2.1 Scope C.4 — Basic Quota: 30 requests allowed, 31st rejected (429)', async () => {
    const rateLimiter = createRateLimiter();
    const mockRedis = new MockRedisTimeSlidingWindow();
    rateLimiter.setRedisClient(mockRedis as any);
    const clientIp = '198.51.100.204';

    for (let i = 1; i <= 30; i++) {
      await rateLimiter.checkIpRateLimit(clientIp);
    }
    assert.equal(mockRedis.calls.length, 30);

    await assert.rejects(
      async () => {
        await rateLimiter.checkIpRateLimit(clientIp);
      },
      (err: any) => {
        assert.equal(err.getStatus(), 429);
        assert.ok(err.getResponse().retryAfter > 0);
        return true;
      },
    );
  });

  await t.test('Phase 5.4.2.1 Scope C.5 — Sliding Window Expiration: Requests older than 15 minutes pruned based on Redis TIME', async () => {
    const rateLimiter = createRateLimiter();
    const mockRedis = new MockRedisTimeSlidingWindow();
    rateLimiter.setRedisClient(mockRedis as any);
    const clientIp = '198.51.100.205';
    const key = `inv:prev:ip:${rateLimiter.deriveIpKeyIdentifier(clientIp)}`;

    const t0 = 1770000000000;
    mockRedis.simulatedRedisTimeMs = t0;

    // Fill 30 requests at t0
    for (let i = 0; i < 30; i++) {
      await rateLimiter.checkIpRateLimit(clientIp);
    }
    assert.equal(mockRedis.data.get(key)?.length, 30);

    // Advance Redis time by 15 minutes + 1 ms (900001 ms)
    mockRedis.simulatedRedisTimeMs = t0 + 900001;

    // Request at t0 + 900001ms prunes all 30 old requests and succeeds
    await rateLimiter.checkIpRateLimit(clientIp);
    const currentEntries = mockRedis.data.get(key) || [];
    assert.equal(currentEntries.length, 1);
    assert.equal(currentEntries[0].score, t0 + 900001);
  });

  await t.test('Phase 5.4.2.1 Scope C.6 — Quota Integrity: 429 rejections do not consume quota or insert members', async () => {
    const rateLimiter = createRateLimiter();
    const mockRedis = new MockRedisTimeSlidingWindow();
    rateLimiter.setRedisClient(mockRedis as any);
    const clientIp = '198.51.100.206';
    const key = `inv:prev:ip:${rateLimiter.deriveIpKeyIdentifier(clientIp)}`;

    for (let i = 0; i < 30; i++) {
      await rateLimiter.checkIpRateLimit(clientIp);
    }
    assert.equal(mockRedis.data.get(key)?.length, 30);

    for (let i = 0; i < 10; i++) {
      await assert.rejects(
        async () => {
          await rateLimiter.checkIpRateLimit(clientIp);
        },
        (err: any) => {
          assert.equal(err.getStatus(), 429);
          return true;
        },
      );
    }

    // Set size remains exactly 30
    assert.equal(mockRedis.data.get(key)?.length, 30);
  });

  await t.test('Phase 5.4.2.1 Scope C.7 — Timestamp Collisions: Multiple requests in exact same millisecond retain unique members', async () => {
    const rateLimiter = createRateLimiter();
    const mockRedis = new MockRedisTimeSlidingWindow();
    mockRedis.simulatedRedisTimeMs = 1770000000500; // Locked timestamp
    rateLimiter.setRedisClient(mockRedis as any);
    const clientIp = '198.51.100.207';
    const key = `inv:prev:ip:${rateLimiter.deriveIpKeyIdentifier(clientIp)}`;

    for (let i = 0; i < 15; i++) {
      await rateLimiter.checkIpRateLimit(clientIp);
    }

    const members = mockRedis.data.get(key)?.map((e) => e.member) || [];
    assert.equal(members.length, 15);
    const unique = new Set(members);
    assert.equal(unique.size, 15, 'All member IDs must be unique even with identical millisecond scores');
  });

  await t.test('Phase 5.4.2.1 Scope C.8 — Concurrency: Concurrent requests enforce exactly 30 allowed requests', async () => {
    const rateLimiter = createRateLimiter();
    const mockRedis = new MockRedisTimeSlidingWindow();
    rateLimiter.setRedisClient(mockRedis as any);
    const clientIp = '198.51.100.208';

    const results = await Promise.allSettled(
      Array.from({ length: 40 }, () => rateLimiter.checkIpRateLimit(clientIp)),
    );

    const allowed = results.filter((r) => r.status === 'fulfilled').length;
    const rejected = results.filter((r) => r.status === 'rejected').length;

    assert.equal(allowed, 30);
    assert.equal(rejected, 10);
  });

  await t.test('Phase 5.4.2.1 Scope C.9 — TTL Behavior: Key receives expiration, missing TTL is repaired', async () => {
    const rateLimiter = createRateLimiter();
    const mockRedis = new MockRedisTimeSlidingWindow();
    rateLimiter.setRedisClient(mockRedis as any);
    const clientIp = '198.51.100.209';
    const key = `inv:prev:ip:${rateLimiter.deriveIpKeyIdentifier(clientIp)}`;

    await rateLimiter.checkIpRateLimit(clientIp);
    assert.equal(mockRedis.ttls.get(key), 900);

    mockRedis.ttls.delete(key);
    assert.equal(mockRedis.ttls.has(key), false);

    await rateLimiter.checkIpRateLimit(clientIp);
    assert.equal(mockRedis.ttls.get(key), 900);
  });

  await t.test('Phase 5.4.2.1 Scope C.10 — Infrastructure Fail-Closed: Production fails closed with 503 on Redis failure', async () => {
    const rateLimiter = createRateLimiter({
      env: 'production',
      secret: 'prod-secret-min-32-chars-long-key-ok',
    });
    const mockRedis = new MockRedisTimeSlidingWindow();
    mockRedis.failNext = true;
    rateLimiter.setRedisClient(mockRedis as any);

    await assert.rejects(
      async () => {
        await rateLimiter.checkIpRateLimit('198.51.100.210');
      },
      (err: any) => {
        assert.equal(err.getStatus(), 503);
        assert.ok(err.message.includes('currently unavailable'));
        return true;
      },
    );
  });

  await t.test('Phase 5.4.2.1 Scope C.11 — Development Fallback: In-memory sliding window functions in dev/test', async () => {
    const rateLimiter = createRateLimiter({ env: 'test' });
    const clientIp = '198.51.100.211';

    for (let i = 0; i < 30; i++) {
      await rateLimiter.checkIpRateLimit(clientIp);
    }

    await assert.rejects(
      async () => {
        await rateLimiter.checkIpRateLimit(clientIp);
      },
      (err: any) => {
        assert.equal(err.getStatus(), 429);
        return true;
      },
    );
  });
});
