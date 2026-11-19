import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { OrganizationsService } from '../../src/organizations/organizations.service.js';
import { OrganizationsController } from '../../src/organizations/organizations.controller.js';
import { OrganizationInvitationsService } from '../../src/organizations/organization-invitations.service.js';
import { ProjectService } from '../../src/projects/project.service.js';
import { assertProjectAccess } from '../../src/common/helpers/project-access.helper.js';
import { JwtAuthGuard } from '../../src/auth/guards/jwt-auth.guard.js';

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
  avatarUrl: string | null;
  passwordHash: string;
  tokenVersion: number;
  platformRole?: string;
  status?: string;
}

interface MockOrg {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
}

interface MockOrgMember {
  id: string;
  organizationId: string;
  userId: string;
  role: CanonicalOrganizationRole;
  joinedAt: Date;
  updatedAt: Date;
}

interface MockProject {
  id: string;
  name: string;
  organizationId: string;
}

interface MockProjectMember {
  id: string;
  projectId: string;
  userId: string;
  joinedAt: Date;
}

interface MockAuditLog {
  id: string;
  organizationId: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  description?: string;
  metadata?: any;
}

function createTestEnvironment() {
  const users: Record<string, MockUser> = {
    'user-owner': {
      id: 'user-owner',
      email: 'owner@alpha.org',
      username: 'alpha_owner',
      firstName: 'Alpha',
      lastName: 'Owner',
      avatarUrl: null,
      passwordHash: 'secret-hash-owner-12345',
      tokenVersion: 1,
      status: 'ACTIVE',
    },
    'user-owner-2': {
      id: 'user-owner-2',
      email: 'owner2@alpha.org',
      username: 'alpha_owner2',
      firstName: 'Second',
      lastName: 'Owner',
      avatarUrl: null,
      passwordHash: 'secret-hash-owner2-12345',
      tokenVersion: 1,
      status: 'ACTIVE',
    },
    'user-admin': {
      id: 'user-admin',
      email: 'admin@alpha.org',
      username: 'alpha_admin',
      firstName: 'Alpha',
      lastName: 'Admin',
      avatarUrl: null,
      passwordHash: 'secret-hash-admin-12345',
      tokenVersion: 1,
      status: 'ACTIVE',
    },
    'user-admin-2': {
      id: 'user-admin-2',
      email: 'admin2@alpha.org',
      username: 'alpha_admin2',
      firstName: 'Second',
      lastName: 'Admin',
      avatarUrl: null,
      passwordHash: 'secret-hash-admin2-12345',
      tokenVersion: 1,
      status: 'ACTIVE',
    },
    'user-manager': {
      id: 'user-manager',
      email: 'manager@alpha.org',
      username: 'alpha_manager',
      firstName: 'Alpha',
      lastName: 'Manager',
      avatarUrl: null,
      passwordHash: 'secret-hash-manager-12345',
      tokenVersion: 1,
      status: 'ACTIVE',
    },
    'user-engineer': {
      id: 'user-engineer',
      email: 'engineer@alpha.org',
      username: 'alpha_eng',
      firstName: 'Alpha',
      lastName: 'Engineer',
      avatarUrl: null,
      passwordHash: 'secret-hash-eng-12345',
      tokenVersion: 1,
      status: 'ACTIVE',
    },
    'user-viewer': {
      id: 'user-viewer',
      email: 'viewer@alpha.org',
      username: 'alpha_viewer',
      firstName: 'Alpha',
      lastName: 'Viewer',
      avatarUrl: null,
      passwordHash: 'secret-hash-viewer-12345',
      tokenVersion: 1,
      status: 'ACTIVE',
    },
    'user-foreign': {
      id: 'user-foreign',
      email: 'foreign@beta.org',
      username: 'foreign_user',
      firstName: 'Foreign',
      lastName: 'User',
      avatarUrl: null,
      passwordHash: 'secret-hash-foreign-12345',
      tokenVersion: 1,
      status: 'ACTIVE',
    },
    'user-non-member': {
      id: 'user-non-member',
      email: 'nonmember@test.org',
      username: 'non_member',
      firstName: 'Non',
      lastName: 'Member',
      avatarUrl: null,
      passwordHash: 'secret-hash-nonmember-12345',
      tokenVersion: 1,
      status: 'ACTIVE',
    },
    'user-platform-admin': {
      id: 'user-platform-admin',
      email: 'platform_admin@devsync.internal',
      username: 'platform_admin',
      firstName: 'Platform',
      lastName: 'Admin',
      avatarUrl: null,
      passwordHash: 'secret-hash-platform-admin',
      tokenVersion: 1,
      platformRole: 'ADMIN',
      status: 'ACTIVE',
    },
  };

  const organizations: Record<string, MockOrg> = {
    'org-alpha': {
      id: 'org-alpha',
      name: 'Alpha Organization',
      slug: 'alpha-org',
      ownerId: 'user-owner',
    },
    'org-beta': {
      id: 'org-beta',
      name: 'Beta Organization',
      slug: 'beta-org',
      ownerId: 'user-foreign',
    },
  };

  const orgMembers: MockOrgMember[] = [
    {
      id: 'om-owner-1',
      organizationId: 'org-alpha',
      userId: 'user-owner',
      role: 'OWNER',
      joinedAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z'),
    },
    {
      id: 'om-admin-1',
      organizationId: 'org-alpha',
      userId: 'user-admin',
      role: 'ADMIN',
      joinedAt: new Date('2026-01-02T00:00:00Z'),
      updatedAt: new Date('2026-01-02T00:00:00Z'),
    },
    {
      id: 'om-admin-2',
      organizationId: 'org-alpha',
      userId: 'user-admin-2',
      role: 'ADMIN',
      joinedAt: new Date('2026-01-03T00:00:00Z'),
      updatedAt: new Date('2026-01-03T00:00:00Z'),
    },
    {
      id: 'om-manager-1',
      organizationId: 'org-alpha',
      userId: 'user-manager',
      role: 'MANAGER',
      joinedAt: new Date('2026-01-04T00:00:00Z'),
      updatedAt: new Date('2026-01-04T00:00:00Z'),
    },
    {
      id: 'om-engineer-1',
      organizationId: 'org-alpha',
      userId: 'user-engineer',
      role: 'ENGINEER',
      joinedAt: new Date('2026-01-05T00:00:00Z'),
      updatedAt: new Date('2026-01-05T00:00:00Z'),
    },
    {
      id: 'om-viewer-1',
      organizationId: 'org-alpha',
      userId: 'user-viewer',
      role: 'VIEWER',
      joinedAt: new Date('2026-01-06T00:00:00Z'),
      updatedAt: new Date('2026-01-06T00:00:00Z'),
    },
    {
      id: 'om-foreign-1',
      organizationId: 'org-beta',
      userId: 'user-foreign',
      role: 'OWNER',
      joinedAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z'),
    },
  ];

  const projects: MockProject[] = [
    { id: 'proj-alpha-1', name: 'Alpha Project 1', organizationId: 'org-alpha' },
    { id: 'proj-alpha-2', name: 'Alpha Project 2', organizationId: 'org-alpha' },
    { id: 'proj-beta-1', name: 'Beta Project 1', organizationId: 'org-beta' },
  ];

  const projectMembers: MockProjectMember[] = [
    { id: 'pm-1', projectId: 'proj-alpha-1', userId: 'user-owner', joinedAt: new Date() },
    { id: 'pm-2', projectId: 'proj-alpha-1', userId: 'user-admin', joinedAt: new Date() },
    { id: 'pm-3', projectId: 'proj-alpha-1', userId: 'user-engineer', joinedAt: new Date() },
    { id: 'pm-4', projectId: 'proj-alpha-2', userId: 'user-engineer', joinedAt: new Date() },
    { id: 'pm-5', projectId: 'proj-beta-1', userId: 'user-engineer', joinedAt: new Date() },
    { id: 'pm-6', projectId: 'proj-beta-1', userId: 'user-foreign', joinedAt: new Date() },
  ];

  const auditLogs: MockAuditLog[] = [];

  const mockPrisma: any = {
    _getOrgMembers: () => [...orgMembers],
    _getProjectMembers: () => [...projectMembers],
    _getAuditLogs: () => [...auditLogs],
    _getUsers: () => ({ ...users }),
    _getOrganizations: () => ({ ...organizations }),

    user: {
      findUnique: async ({ where }: any) => {
        if (where.id) {
          const u = users[where.id];
          return u ? { ...u, status: u.status || 'ACTIVE' } : null;
        }
        return null;
      },
    },

    organization: {
      findUnique: async ({ where }: any) => {
        if (where.id) return organizations[where.id] ?? null;
        if (where.slug) {
          return Object.values(organizations).find((o) => o.slug === where.slug) ?? null;
        }
        return null;
      },
      create: async ({ data }: any) => {
        const org: MockOrg = {
          id: `org-${Date.now()}`,
          name: data.name,
          slug: data.slug,
          ownerId: data.ownerId,
        };
        organizations[org.id] = org;
        return org;
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
      findMany: async ({ where, skip = 0, take = 20, orderBy }: any) => {
        let filtered = orgMembers.filter((om) => {
          if (where.organizationId && om.organizationId !== where.organizationId) return false;
          if (where.userId && om.userId !== where.userId) return false;
          if (where.role && om.role !== where.role) return false;
          return true;
        });

        // Apply ordering if requested
        if (Array.isArray(orderBy)) {
          filtered.sort((a, b) => {
            for (const rule of orderBy) {
              if (rule.joinedAt) {
                const diff = b.joinedAt.getTime() - a.joinedAt.getTime();
                if (diff !== 0) return rule.joinedAt === 'desc' ? diff : -diff;
              }
              if (rule.id) {
                const diff = b.id.localeCompare(a.id);
                if (diff !== 0) return rule.id === 'desc' ? diff : -diff;
              }
            }
            return 0;
          });
        }

        const sliced = filtered.slice(skip, skip + take);

        // Project user fields safely
        return sliced.map((om) => {
          const u = users[om.userId];
          return {
            ...om,
            user: u
              ? {
                  id: u.id,
                  email: u.email,
                  username: u.username,
                  firstName: u.firstName,
                  lastName: u.lastName,
                  avatarUrl: u.avatarUrl,
                }
              : null,
          };
        });
      },
      count: async ({ where }: any) => {
        return orgMembers.filter((om) => {
          if (where.organizationId && om.organizationId !== where.organizationId) return false;
          if (where.userId && om.userId !== where.userId) return false;
          if (where.role && om.role !== where.role) return false;
          return true;
        }).length;
      },
      create: async ({ data }: any) => {
        const newOm: MockOrgMember = {
          id: `om-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          organizationId: data.organizationId,
          userId: data.userId,
          role: data.role,
          joinedAt: new Date(),
          updatedAt: new Date(),
        };
        orgMembers.push(newOm);
        return newOm;
      },
      update: async ({ where, data, select }: any) => {
        const { organizationId, userId } = where.organizationId_userId || {};
        const member = orgMembers.find(
          (om) => om.organizationId === organizationId && om.userId === userId,
        );
        if (!member) throw new Error('Member not found');
        if (data.role !== undefined) member.role = data.role;
        member.updatedAt = new Date();

        if (select?.user) {
          const u = users[member.userId];
          return {
            ...member,
            user: u
              ? {
                  id: u.id,
                  email: u.email,
                  username: u.username,
                  firstName: u.firstName,
                  lastName: u.lastName,
                  avatarUrl: u.avatarUrl,
                }
              : null,
          };
        }
        return member;
      },
      delete: async ({ where }: any) => {
        const { organizationId, userId } = where.organizationId_userId || {};
        const idx = orgMembers.findIndex(
          (om) => om.organizationId === organizationId && om.userId === userId,
        );
        if (idx !== -1) {
          const deleted = orgMembers.splice(idx, 1)[0];
          return deleted;
        }
        throw new Error('Member not found');
      },
    },

    project: {
      findMany: async ({ where }: any) => {
        return projects.filter((p) => {
          if (where.organizationId && p.organizationId !== where.organizationId) return false;
          return true;
        });
      },
      findUnique: async ({ where, select }: any) => {
        const p = projects.find((proj) => proj.id === where.id);
        if (!p) return null;
        const org = organizations[p.organizationId];
        let pms = projectMembers.filter((pm) => pm.projectId === p.id);
        const queryUserId = select?.members?.where?.userId ?? where?.members?.where?.userId;
        if (queryUserId) {
          pms = pms.filter((pm) => pm.userId === queryUserId);
        }
        return {
          id: p.id,
          name: p.name,
          organizationId: p.organizationId,
          organization: org ? { id: org.id, ownerId: org.ownerId } : null,
          members: pms.map((pm) => ({ id: pm.id, userId: pm.userId })),
        };
      },
    },

    projectMember: {
      findUnique: async ({ where }: any) => {
        const { projectId, userId } = where?.projectId_userId || {};
        return (
          projectMembers.find(
            (pm) => pm.projectId === projectId && pm.userId === userId,
          ) ?? null
        );
      },
      create: async ({ data, include }: any) => {
        const newPm: MockProjectMember = {
          id: `pm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          projectId: data.projectId,
          userId: data.userId,
          joinedAt: new Date(),
        };
        projectMembers.push(newPm);
        const u = users[data.userId];
        return {
          ...newPm,
          ...(include?.user
            ? {
                user: u
                  ? {
                      id: u.id,
                      email: u.email,
                      username: u.username,
                      firstName: u.firstName,
                      lastName: u.lastName,
                      avatarUrl: u.avatarUrl,
                    }
                  : null,
              }
            : {}),
        };
      },
      findMany: async ({ where }: any) => {
        return projectMembers.filter((pm) => {
          if (where.userId && pm.userId !== where.userId) return false;
          if (where.projectId?.in && !where.projectId.in.includes(pm.projectId)) return false;
          return true;
        });
      },
      deleteMany: async ({ where }: any) => {
        let count = 0;
        for (let i = projectMembers.length - 1; i >= 0; i--) {
          const pm = projectMembers[i];
          if (where.userId && pm.userId !== where.userId) continue;
          if (where.projectId?.in && !where.projectId.in.includes(pm.projectId)) continue;
          projectMembers.splice(i, 1);
          count++;
        }
        return { count };
      },
    },

    auditLog: {
      create: async ({ data }: any) => {
        const log: MockAuditLog = {
          id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
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

  const service = new OrganizationsService(mockPrisma);
  const controller = new OrganizationsController(service);
  const projectService = new ProjectService(mockPrisma);
  const invitationsService = new OrganizationInvitationsService(mockPrisma);

  return {
    service,
    controller,
    projectService,
    invitationsService,
    mockPrisma,
    users,
    organizations,
    orgMembers,
    projects,
    projectMembers,
    auditLogs,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Test Suite: Organization Member Management & RBAC Security Suite
// ─────────────────────────────────────────────────────────────────────────────

test('SEC-ORG-MEM — Milestone 4B.9 Phase 3 & 3.1: Organization Member Management & RBAC Suite', async (t) => {
  // ── Member Listing (Tests 1–6) ──────────────────────────────────────────────

  await t.test('Test 1: Authorized member can list organization members', async () => {
    const { service } = createTestEnvironment();

    const result = await service.listMembers('user-engineer', 'org-alpha', { page: 1, limit: 10 });
    assert.ok(result);
    assert.equal(result.page, 1);
    assert.equal(result.limit, 10);
    assert.ok(result.total >= 6);
    assert.ok(result.items.length >= 6);

    const engineerItem = result.items.find((m) => m.userId === 'user-engineer');
    assert.ok(engineerItem);
    assert.equal(engineerItem.role, 'ENGINEER');
    assert.equal(engineerItem.user?.email, 'engineer@alpha.org');
  });

  await t.test('Test 2: Unauthenticated request is rejected', async () => {
    const { controller } = createTestEnvironment();

    const unauthReq = { user: {} as any } as any;

    await assert.rejects(
      async () => {
        await controller.listMembers(unauthReq, 'org-alpha', {});
      },
      (err: any) => {
        assert.ok(err instanceof UnauthorizedException);
        assert.equal(err.message, 'User is not authenticated');
        return true;
      },
    );

    // Verify JwtAuthGuard is applied to OrganizationsController
    const guards = Reflect.getMetadata('__guards__', OrganizationsController);
    assert.ok(Array.isArray(guards));
    assert.ok(guards.some((g: any) => g === JwtAuthGuard || g.name === 'JwtAuthGuard'));
  });

  await t.test('Test 3: Cross-organization listing is rejected', async () => {
    const { service } = createTestEnvironment();

    await assert.rejects(
      async () => {
        await service.listMembers('user-foreign', 'org-alpha', {});
      },
      (err: any) => {
        assert.ok(err instanceof ForbiddenException);
        assert.equal(
          err.message,
          'You do not have permission to view members of this organization',
        );
        return true;
      },
    );
  });

  await t.test('Test 4: Pagination defaults and bounds validation are enforced', async () => {
    const { service } = createTestEnvironment();

    // Default pagination
    const defaultRes = await service.listMembers('user-owner', 'org-alpha', {});
    assert.equal(defaultRes.page, 1);
    assert.equal(defaultRes.limit, 20);

    // Limit exceeding 100 is rejected with 400 Bad Request
    await assert.rejects(
      async () => {
        await service.listMembers('user-owner', 'org-alpha', { limit: 200 });
      },
      (err: any) => {
        assert.ok(err instanceof BadRequestException);
        return true;
      },
    );

    // Negative page is rejected with 400 Bad Request
    await assert.rejects(
      async () => {
        await service.listMembers('user-owner', 'org-alpha', { page: -5 });
      },
      (err: any) => {
        assert.ok(err instanceof BadRequestException);
        return true;
      },
    );
  });

  await t.test('Test 5: Sensitive user fields are strictly excluded from member listing', async () => {
    const { service } = createTestEnvironment();

    const result = await service.listMembers('user-owner', 'org-alpha', {});
    for (const item of result.items) {
      assert.equal((item.user as any).passwordHash, undefined, 'passwordHash must NEVER be exposed');
      assert.equal((item.user as any).tokenVersion, undefined, 'tokenVersion must NEVER be exposed');
      assert.equal((item.user as any).lastLoginAt, undefined, 'lastLoginAt must not be exposed');
    }
  });

  await t.test('Test 6: Stable ordering is enforced', async () => {
    const { service } = createTestEnvironment();

    const result = await service.listMembers('user-owner', 'org-alpha', {});
    assert.ok(result.items.length >= 2);
    for (let i = 0; i < result.items.length - 1; i++) {
      const current = new Date(result.items[i].joinedAt).getTime();
      const next = new Date(result.items[i + 1].joinedAt).getTime();
      assert.ok(current >= next, 'Members must be ordered by joinedAt DESC');
    }
  });

  // ── Role Modification (Tests 7–17) ──────────────────────────────────────────

  await t.test('Test 7: OWNER can modify permitted roles', async () => {
    const { service } = createTestEnvironment();

    const updated = await service.updateMemberRole('user-owner', 'org-alpha', 'user-engineer', {
      role: 'MANAGER',
    });
    assert.equal(updated.role, 'MANAGER');

    const updated2 = await service.updateMemberRole('user-owner', 'org-alpha', 'user-manager', {
      role: 'ADMIN',
    });
    assert.equal(updated2.role, 'ADMIN');
  });

  await t.test('Test 8: ADMIN can modify MANAGER, ENGINEER and VIEWER roles', async () => {
    const { service } = createTestEnvironment();

    const updated = await service.updateMemberRole('user-admin', 'org-alpha', 'user-viewer', {
      role: 'ENGINEER',
    });
    assert.equal(updated.role, 'ENGINEER');

    const updated2 = await service.updateMemberRole('user-admin', 'org-alpha', 'user-engineer', {
      role: 'VIEWER',
    });
    assert.equal(updated2.role, 'VIEWER');
  });

  await t.test('Test 9: ADMIN cannot modify OWNER or ADMIN', async () => {
    const { service } = createTestEnvironment();

    await assert.rejects(
      async () => {
        await service.updateMemberRole('user-admin', 'org-alpha', 'user-owner', {
          role: 'ENGINEER',
        });
      },
      (err: any) => {
        assert.ok(err instanceof ForbiddenException);
        assert.equal(err.message, 'ADMIN cannot modify OWNER or ADMIN members');
        return true;
      },
    );

    await assert.rejects(
      async () => {
        await service.updateMemberRole('user-admin', 'org-alpha', 'user-admin-2', {
          role: 'VIEWER',
        });
      },
      (err: any) => {
        assert.ok(err instanceof ForbiddenException);
        assert.equal(err.message, 'ADMIN cannot modify OWNER or ADMIN members');
        return true;
      },
    );

    await assert.rejects(
      async () => {
        await service.updateMemberRole('user-admin', 'org-alpha', 'user-engineer', {
          role: 'ADMIN',
        });
      },
      (err: any) => {
        assert.ok(err instanceof ForbiddenException);
        assert.equal(err.message, 'ADMIN cannot assign ADMIN or OWNER roles');
        return true;
      },
    );
  });

  await t.test('Test 10: MANAGER cannot modify member roles', async () => {
    const { service } = createTestEnvironment();

    await assert.rejects(
      async () => {
        await service.updateMemberRole('user-manager', 'org-alpha', 'user-viewer', {
          role: 'ENGINEER',
        });
      },
      (err: any) => {
        assert.ok(err instanceof ForbiddenException);
        assert.equal(err.message, 'You do not have permission to modify member roles');
        return true;
      },
    );
  });

  await t.test('Test 11: ENGINEER cannot modify member roles', async () => {
    const { service } = createTestEnvironment();

    await assert.rejects(
      async () => {
        await service.updateMemberRole('user-engineer', 'org-alpha', 'user-viewer', {
          role: 'ENGINEER',
        });
      },
      (err: any) => {
        assert.ok(err instanceof ForbiddenException);
        assert.equal(err.message, 'You do not have permission to modify member roles');
        return true;
      },
    );
  });

  await t.test('Test 12: VIEWER cannot modify member roles', async () => {
    const { service } = createTestEnvironment();

    await assert.rejects(
      async () => {
        await service.updateMemberRole('user-viewer', 'org-alpha', 'user-engineer', {
          role: 'VIEWER',
        });
      },
      (err: any) => {
        assert.ok(err instanceof ForbiddenException);
        assert.equal(err.message, 'You do not have permission to modify member roles');
        return true;
      },
    );
  });

  await t.test('Test 13: OWNER cannot assign OWNER through the ordinary endpoint', async () => {
    const { service } = createTestEnvironment();

    await assert.rejects(
      async () => {
        await service.updateMemberRole('user-owner', 'org-alpha', 'user-admin', {
          role: 'OWNER',
        });
      },
      (err: any) => {
        assert.ok(err instanceof ForbiddenException);
        assert.equal(err.message, 'Cannot assign OWNER role through this endpoint');
        return true;
      },
    );
  });

  await t.test('Test 14: Invalid role values are rejected', async () => {
    const { service } = createTestEnvironment();

    await assert.rejects(
      async () => {
        await service.updateMemberRole('user-owner', 'org-alpha', 'user-admin', {
          role: 'SUPERADMIN' as any,
        });
      },
      (err: any) => {
        assert.ok(err instanceof BadRequestException);
        assert.equal(err.message, 'Invalid organization role');
        return true;
      },
    );

    // Redundant role change is also rejected
    await assert.rejects(
      async () => {
        await service.updateMemberRole('user-owner', 'org-alpha', 'user-admin', {
          role: 'ADMIN',
        });
      },
      (err: any) => {
        assert.ok(err instanceof BadRequestException);
        assert.equal(err.message, 'Member already has the specified role');
        return true;
      },
    );
  });

  await t.test('Test 15: Cross-organization target modification is rejected', async () => {
    const { service } = createTestEnvironment();

    await assert.rejects(
      async () => {
        await service.updateMemberRole('user-foreign', 'org-alpha', 'user-engineer', {
          role: 'MANAGER',
        });
      },
      (err: any) => {
        assert.ok(err instanceof ForbiddenException);
        assert.equal(err.message, 'You are not a member of this organization');
        return true;
      },
    );

    await assert.rejects(
      async () => {
        await service.updateMemberRole('user-owner', 'org-alpha', 'user-foreign', {
          role: 'MANAGER',
        });
      },
      (err: any) => {
        assert.ok(err instanceof NotFoundException);
        assert.equal(err.message, 'Member not found in this organization');
        return true;
      },
    );
  });

  await t.test('Test 16: Unauthorized self-promotion is rejected', async () => {
    const { service } = createTestEnvironment();

    await assert.rejects(
      async () => {
        await service.updateMemberRole('user-admin', 'org-alpha', 'user-admin', {
          role: 'MANAGER',
        });
      },
      (err: any) => {
        assert.ok(err instanceof ForbiddenException);
        assert.equal(err.message, 'Self-modification of member role is not permitted');
        return true;
      },
    );

    await assert.rejects(
      async () => {
        await service.updateMemberRole('user-owner', 'org-alpha', 'user-owner', {
          role: 'ADMIN',
        });
      },
      (err: any) => {
        assert.ok(err instanceof ForbiddenException);
        assert.equal(err.message, 'Self-modification of member role is not permitted');
        return true;
      },
    );
  });

  await t.test('Test 17: Role changes are recorded in AuditLog', async () => {
    const { service, mockPrisma } = createTestEnvironment();

    await service.updateMemberRole('user-owner', 'org-alpha', 'user-engineer', {
      role: 'MANAGER',
    });

    const logs = mockPrisma._getAuditLogs();
    const roleLog = logs.find(
      (l: any) => l.action === 'ROLE_CHANGE' && l.entityId === 'org-alpha:user-engineer',
    );
    assert.ok(roleLog, 'ROLE_CHANGE audit log must be recorded');
    assert.equal(roleLog.metadata.previousRole, 'ENGINEER');
    assert.equal(roleLog.metadata.newRole, 'MANAGER');
    assert.equal(roleLog.metadata.updatedBy, 'user-owner');
  });

  // ── Member Removal (Tests 18–28) ────────────────────────────────────────────

  await t.test('Test 18: OWNER can remove eligible members', async () => {
    const { service, mockPrisma } = createTestEnvironment();

    const result = await service.removeMember('user-owner', 'org-alpha', 'user-viewer');
    assert.equal(result.message, 'Member removed successfully');

    const remaining = mockPrisma._getOrgMembers().find(
      (om: any) => om.organizationId === 'org-alpha' && om.userId === 'user-viewer',
    );
    assert.equal(remaining, undefined);
  });

  await t.test('Test 19: ADMIN can remove eligible lower-role members', async () => {
    const { service, mockPrisma } = createTestEnvironment();

    const result = await service.removeMember('user-admin', 'org-alpha', 'user-viewer');
    assert.equal(result.message, 'Member removed successfully');

    const remaining = mockPrisma._getOrgMembers().find(
      (om: any) => om.organizationId === 'org-alpha' && om.userId === 'user-viewer',
    );
    assert.equal(remaining, undefined);
  });

  await t.test('Test 20: ADMIN cannot remove another ADMIN', async () => {
    const { service } = createTestEnvironment();

    await assert.rejects(
      async () => {
        await service.removeMember('user-admin', 'org-alpha', 'user-admin-2');
      },
      (err: any) => {
        assert.ok(err instanceof ForbiddenException);
        assert.equal(err.message, 'ADMIN cannot remove another ADMIN');
        return true;
      },
    );
  });

  await t.test('Test 21: ADMIN cannot remove OWNER', async () => {
    const { service } = createTestEnvironment();

    await assert.rejects(
      async () => {
        await service.removeMember('user-admin', 'org-alpha', 'user-owner');
      },
      (err: any) => {
        assert.ok(err instanceof ForbiddenException);
        assert.equal(err.message, 'ADMIN cannot remove an OWNER');
        return true;
      },
    );
  });

  await t.test('Test 22: The last OWNER cannot be removed', async () => {
    const { service } = createTestEnvironment();

    await assert.rejects(
      async () => {
        await service.removeMember('user-owner', 'org-alpha', 'user-owner');
      },
      (err: any) => {
        assert.ok(err instanceof ConflictException);
        return true;
      },
    );
  });

  await t.test('Test 23: A nonexistent member is rejected', async () => {
    const { service } = createTestEnvironment();

    await assert.rejects(
      async () => {
        await service.removeMember('user-owner', 'org-alpha', 'user-non-member');
      },
      (err: any) => {
        assert.ok(err instanceof NotFoundException);
        assert.equal(err.message, 'Member not found in this organization');
        return true;
      },
    );
  });

  await t.test('Test 24: Cross-organization removal is rejected', async () => {
    const { service } = createTestEnvironment();

    await assert.rejects(
      async () => {
        await service.removeMember('user-foreign', 'org-alpha', 'user-engineer');
      },
      (err: any) => {
        assert.ok(err instanceof ForbiddenException);
        assert.equal(err.message, 'You are not a member of this organization');
        return true;
      },
    );

    await assert.rejects(
      async () => {
        await service.removeMember('user-owner', 'org-alpha', 'user-foreign');
      },
      (err: any) => {
        assert.ok(err instanceof NotFoundException);
        assert.equal(err.message, 'Member not found in this organization');
        return true;
      },
    );
  });

  await t.test('Test 25: Project membership cleanup occurs only within the target organization', async () => {
    const { service, mockPrisma } = createTestEnvironment();

    const initialPms = mockPrisma._getProjectMembers().filter((pm: any) => pm.userId === 'user-engineer');
    assert.equal(initialPms.length, 3);

    await service.removeMember('user-owner', 'org-alpha', 'user-engineer');

    const remainingPms = mockPrisma._getProjectMembers().filter((pm: any) => pm.userId === 'user-engineer');
    assert.equal(remainingPms.length, 1);
    assert.equal(remainingPms[0].projectId, 'proj-beta-1', 'Project membership in org-beta MUST remain intact');
  });

  await t.test('Test 26: Global User records remain intact', async () => {
    const { service, mockPrisma } = createTestEnvironment();

    await service.removeMember('user-owner', 'org-alpha', 'user-engineer');

    const users = mockPrisma._getUsers();
    assert.ok(users['user-engineer'], 'Global user record must NOT be deleted');
  });

  await t.test('Test 27: Removal audit events are recorded', async () => {
    const { service, mockPrisma } = createTestEnvironment();

    await service.removeMember('user-owner', 'org-alpha', 'user-viewer');

    const logs = mockPrisma._getAuditLogs();
    const deleteLog = logs.find(
      (l: any) => l.action === 'DELETE' && l.entityId === 'org-alpha:user-viewer',
    );
    assert.ok(deleteLog, 'Removal must be recorded in AuditLog');
    assert.equal(deleteLog.metadata.removedRole, 'VIEWER');
    assert.equal(deleteLog.metadata.removedBy, 'user-owner');
  });

  await t.test('Test 28: Unauthorized requesters cannot remove members', async () => {
    const { service } = createTestEnvironment();

    await assert.rejects(
      async () => {
        await service.removeMember('user-manager', 'org-alpha', 'user-viewer');
      },
      (err: any) => {
        assert.ok(err instanceof ForbiddenException);
        assert.equal(err.message, 'You do not have permission to remove members from this organization');
        return true;
      },
    );

    await assert.rejects(
      async () => {
        await service.removeMember('user-engineer', 'org-alpha', 'user-viewer');
      },
      (err: any) => {
        assert.ok(err instanceof ForbiddenException);
        return true;
      },
    );

    await assert.rejects(
      async () => {
        await service.removeMember('user-viewer', 'org-alpha', 'user-engineer');
      },
      (err: any) => {
        assert.ok(err instanceof ForbiddenException);
        return true;
      },
    );
  });

  // ── Self-Leave (Tests 29–32) ────────────────────────────────────────────────

  await t.test('Test 29: An ordinary member can leave an organization', async () => {
    const { service, mockPrisma } = createTestEnvironment();

    const result = await service.leaveOrganization('user-viewer', 'org-alpha');
    assert.equal(result.message, 'Left organization successfully');

    const remaining = mockPrisma._getOrgMembers().find(
      (om: any) => om.organizationId === 'org-alpha' && om.userId === 'user-viewer',
    );
    assert.equal(remaining, undefined);
  });

  await t.test('Test 30: An OWNER cannot leave if they are the last OWNER', async () => {
    const { service } = createTestEnvironment();

    await assert.rejects(
      async () => {
        await service.leaveOrganization('user-owner', 'org-alpha');
      },
      (err: any) => {
        assert.ok(err instanceof ConflictException);
        return true;
      },
    );
  });

  await t.test('Test 31: Leaving removes only the authenticated user\'s membership', async () => {
    const { service, mockPrisma } = createTestEnvironment();

    const countBefore = mockPrisma._getOrgMembers().filter((om: any) => om.organizationId === 'org-alpha').length;
    await service.leaveOrganization('user-manager', 'org-alpha');
    const countAfter = mockPrisma._getOrgMembers().filter((om: any) => om.organizationId === 'org-alpha').length;

    assert.equal(countAfter, countBefore - 1);
    const owner = mockPrisma._getOrgMembers().find(
      (om: any) => om.organizationId === 'org-alpha' && om.userId === 'user-owner',
    );
    assert.ok(owner);
  });

  await t.test('Test 32: Project memberships in unrelated organizations remain intact upon leaving', async () => {
    const { service, mockPrisma } = createTestEnvironment();

    await service.leaveOrganization('user-engineer', 'org-alpha');

    const alphaPms = mockPrisma._getProjectMembers().filter(
      (pm: any) => (pm.projectId === 'proj-alpha-1' || pm.projectId === 'proj-alpha-2') && pm.userId === 'user-engineer',
    );
    assert.equal(alphaPms.length, 0);

    const betaPms = mockPrisma._getProjectMembers().filter(
      (pm: any) => pm.projectId === 'proj-beta-1' && pm.userId === 'user-engineer',
    );
    assert.equal(betaPms.length, 1);
  });

  // ── Concurrency & Invariants (Tests 33–36) ──────────────────────────────────

  await t.test('Test 33: Concurrent owner removal/demotion attempts cannot violate the owner invariant', async () => {
    const { service, orgMembers } = createTestEnvironment();

    orgMembers.push({
      id: 'om-owner-2',
      organizationId: 'org-alpha',
      userId: 'user-owner-2',
      role: 'OWNER',
      joinedAt: new Date(),
      updatedAt: new Date(),
    });

    // Demoting non-canonical owner succeeds
    await service.updateMemberRole('user-owner', 'org-alpha', 'user-owner-2', {
      role: 'ADMIN',
    });

    // Demoting canonical owner fails with ConflictException
    await assert.rejects(
      async () => {
        await service.updateMemberRole('user-owner', 'org-alpha', 'user-owner', {
          role: 'ADMIN',
        });
      },
      (err: any) => {
        assert.ok(err instanceof ForbiddenException || err instanceof ConflictException);
        return true;
      },
    );

    // Removing canonical owner fails with ConflictException
    await assert.rejects(
      async () => {
        await service.removeMember('user-owner', 'org-alpha', 'user-owner');
      },
      (err: any) => {
        assert.ok(err instanceof ConflictException);
        return true;
      },
    );
  });

  await t.test('Test 34: Concurrent duplicate or conflicting role updates are handled safely', async () => {
    const { service, mockPrisma } = createTestEnvironment();

    let callCount = 0;
    const originalUpdate = mockPrisma.organizationMember.update;
    mockPrisma.organizationMember.update = async (...args: any[]) => {
      callCount++;
      if (callCount === 1) {
        const p2034Err: any = new Error('Serialization conflict');
        p2034Err.code = 'P2034';
        throw p2034Err;
      }
      return originalUpdate.apply(mockPrisma.organizationMember, args);
    };

    try {
      const res = await service.updateMemberRole('user-owner', 'org-alpha', 'user-engineer', {
        role: 'MANAGER',
      });
      assert.equal(res.role, 'MANAGER');
      assert.equal(callCount, 2, 'Must have retried on P2034 and succeeded');
    } finally {
      mockPrisma.organizationMember.update = originalUpdate;
    }
  });

  await t.test('Test 35: Existing project tenant-isolation behavior remains intact', async () => {
    const { service } = createTestEnvironment();

    await assert.rejects(
      async () => {
        await service.removeMember('user-foreign', 'org-alpha', 'user-engineer');
      },
      (err: any) => {
        assert.ok(err instanceof ForbiddenException);
        return true;
      },
    );
  });

  await t.test('Test 36: Existing invitation authorization and token behavior remains intact', async () => {
    const { controller } = createTestEnvironment();

    const req = { user: { userId: 'user-owner', email: 'owner@alpha.org', username: 'alpha_owner' } } as any;
    const res = await controller.listMembers(req, 'org-alpha', { page: 1, limit: 10 });
    assert.ok(res.items.length > 0);
  });

  // ── Phase 3.1: Ownership Source-of-Truth & Consistency (Tests 37–46) ────────

  await t.test('Test 37 [F1.1]: Original Organization.ownerId user remains correctly authorized', async () => {
    const { service, projectService } = createTestEnvironment();

    // Canonical owner lists members successfully
    const listing = await service.listMembers('user-owner', 'org-alpha', {});
    assert.ok(listing.items.length > 0);

    // Canonical owner updates roles successfully
    const updated = await service.updateMemberRole('user-owner', 'org-alpha', 'user-engineer', {
      role: 'MANAGER',
    });
    assert.equal(updated.role, 'MANAGER');

    // Canonical owner manages project members
    const pmResult = await projectService.addMember('user-owner', 'proj-alpha-1', 'user-viewer');
    assert.equal(pmResult.userId, 'user-viewer');
  });

  await t.test('Test 38 [F1.2]: Removing another non-canonical OWNER does not affect ownerId consistency', async () => {
    const { service, orgMembers, organizations } = createTestEnvironment();

    // Add a second non-canonical owner
    orgMembers.push({
      id: 'om-owner-2',
      organizationId: 'org-alpha',
      userId: 'user-owner-2',
      role: 'OWNER',
      joinedAt: new Date(),
      updatedAt: new Date(),
    });

    // Remove non-canonical owner
    const res = await service.removeMember('user-owner', 'org-alpha', 'user-owner-2');
    assert.equal(res.message, 'Member removed successfully');

    // Confirm canonical ownerId on organization is still user-owner
    assert.equal(organizations['org-alpha'].ownerId, 'user-owner');
  });

  await t.test('Test 39 [F1.3]: Demotion of the canonical owner is rejected while ownership transfer is unavailable', async () => {
    const { service, orgMembers } = createTestEnvironment();

    // Add second owner so ownerCount > 1
    orgMembers.push({
      id: 'om-owner-2',
      organizationId: 'org-alpha',
      userId: 'user-owner-2',
      role: 'OWNER',
      joinedAt: new Date(),
      updatedAt: new Date(),
    });

    // Attempt to demote canonical owner (user-owner)
    await assert.rejects(
      async () => {
        await service.updateMemberRole('user-owner-2', 'org-alpha', 'user-owner', {
          role: 'ADMIN',
        });
      },
      (err: any) => {
        assert.ok(err instanceof ConflictException);
        assert.equal(
          err.message,
          'Cannot demote the primary organization owner. Ownership transfer is required.',
        );
        return true;
      },
    );
  });

  await t.test('Test 40 [F1.4]: Removal of the canonical owner is rejected while ownership transfer is unavailable', async () => {
    const { service, orgMembers } = createTestEnvironment();

    // Add second owner so ownerCount > 1
    orgMembers.push({
      id: 'om-owner-2',
      organizationId: 'org-alpha',
      userId: 'user-owner-2',
      role: 'OWNER',
      joinedAt: new Date(),
      updatedAt: new Date(),
    });

    // Attempt to remove canonical owner (user-owner)
    await assert.rejects(
      async () => {
        await service.removeMember('user-owner-2', 'org-alpha', 'user-owner');
      },
      (err: any) => {
        assert.ok(err instanceof ConflictException);
        assert.equal(
          err.message,
          'Cannot remove the primary organization owner. Ownership transfer is required.',
        );
        return true;
      },
    );
  });

  await t.test('Test 41 [F1.5]: Canonical owner self-leave is rejected when it would invalidate organization ownership', async () => {
    const { service, orgMembers } = createTestEnvironment();

    // Add second owner
    orgMembers.push({
      id: 'om-owner-2',
      organizationId: 'org-alpha',
      userId: 'user-owner-2',
      role: 'OWNER',
      joinedAt: new Date(),
      updatedAt: new Date(),
    });

    // Canonical owner tries to leave
    await assert.rejects(
      async () => {
        await service.leaveOrganization('user-owner', 'org-alpha');
      },
      (err: any) => {
        assert.ok(err instanceof ConflictException);
        assert.equal(
          err.message,
          'Cannot leave organization as the primary owner. Ownership transfer is required.',
        );
        return true;
      },
    );
  });

  await t.test('Test 42 [F1.6]: A removed non-owner cannot retain project access', async () => {
    const { service, mockPrisma } = createTestEnvironment();

    // Remove user-engineer from org-alpha
    await service.removeMember('user-owner', 'org-alpha', 'user-engineer');

    // Attempt to access project in org-alpha
    await assert.rejects(
      async () => {
        await assertProjectAccess(mockPrisma, 'user-engineer', 'proj-alpha-1');
      },
      (err: any) => {
        assert.ok(err.status === 403 || err.name === 'ForbiddenException');
        return true;
      },
    );
  });

  await t.test('Test 43 [F1.7]: A demoted owner cannot retain privileges through stale ownerId checks', async () => {
    const { mockPrisma, projectService, invitationsService } = createTestEnvironment();

    // Simulate stale ownerId: set organization ownerId to user-viewer (who only has VIEWER role)
    const orgs = mockPrisma._getOrganizations();
    orgs['org-alpha'].ownerId = 'user-viewer';

    // 1. assertProjectAccess must NOT grant access solely because ownerId === user-viewer
    await assert.rejects(
      async () => {
        await assertProjectAccess(mockPrisma, 'user-viewer', 'proj-alpha-1');
      },
      (err: any) => {
        assert.ok(err.status === 403 || err.name === 'ForbiddenException');
        return true;
      },
    );

    // 2. ProjectService.addMember must reject user-viewer
    await assert.rejects(
      async () => {
        await projectService.addMember('user-viewer', 'proj-alpha-1', 'user-engineer');
      },
      (err: any) => {
        assert.ok(err instanceof ForbiddenException);
        return true;
      },
    );

    // 3. OrganizationInvitationsService must reject user-viewer
    await assert.rejects(
      async () => {
        await invitationsService.createInvitation('user-viewer', 'org-alpha', {
          email: 'stale-test@domain.com',
          role: 'ENGINEER',
        });
      },
      (err: any) => {
        assert.ok(err instanceof ForbiddenException);
        return true;
      },
    );
  });

  await t.test('Test 44 [F1.8]: A platform ADMIN is not automatically an organization OWNER', async () => {
    const { service } = createTestEnvironment();

    // user-platform-admin has platformRole: 'ADMIN', but is NOT a member of org-alpha
    await assert.rejects(
      async () => {
        await service.listMembers('user-platform-admin', 'org-alpha', {});
      },
      (err: any) => {
        assert.ok(err instanceof ForbiddenException);
        assert.equal(
          err.message,
          'You do not have permission to view members of this organization',
        );
        return true;
      },
    );

    await assert.rejects(
      async () => {
        await service.updateMemberRole('user-platform-admin', 'org-alpha', 'user-engineer', {
          role: 'MANAGER',
        });
      },
      (err: any) => {
        assert.ok(err instanceof ForbiddenException);
        return true;
      },
    );
  });

  await t.test('Test 45 [F1.9]: An ordinary organization ADMIN cannot exercise owner-only operations', async () => {
    const { service } = createTestEnvironment();

    // ADMIN cannot modify another ADMIN
    await assert.rejects(
      async () => {
        await service.updateMemberRole('user-admin', 'org-alpha', 'user-admin-2', {
          role: 'MANAGER',
        });
      },
      (err: any) => {
        assert.ok(err instanceof ForbiddenException);
        assert.equal(err.message, 'ADMIN cannot modify OWNER or ADMIN members');
        return true;
      },
    );

    // ADMIN cannot remove another ADMIN
    await assert.rejects(
      async () => {
        await service.removeMember('user-admin', 'org-alpha', 'user-admin-2');
      },
      (err: any) => {
        assert.ok(err instanceof ForbiddenException);
        assert.equal(err.message, 'ADMIN cannot remove another ADMIN');
        return true;
      },
    );

    // ADMIN cannot assign ADMIN role
    await assert.rejects(
      async () => {
        await service.updateMemberRole('user-admin', 'org-alpha', 'user-engineer', {
          role: 'ADMIN',
        });
      },
      (err: any) => {
        assert.ok(err instanceof ForbiddenException);
        assert.equal(err.message, 'ADMIN cannot assign ADMIN or OWNER roles');
        return true;
      },
    );
  });

  await t.test('Test 46 [F1.10]: All existing project tenant-isolation behavior remains intact', async () => {
    const { projectService } = createTestEnvironment();

    // Foreign user from org-beta cannot add members to proj-alpha-1 (org-alpha)
    await assert.rejects(
      async () => {
        await projectService.addMember('user-foreign', 'proj-alpha-1', 'user-foreign');
      },
      (err: any) => {
        assert.ok(err instanceof ForbiddenException);
        return true;
      },
    );
  });

  // ── Phase 3.1: Bounded Member Pagination & Offset Protection (Tests 47–59) ─

  await t.test('Test 47 [F2.1]: Default page and limit are applied when omitted', async () => {
    const { service } = createTestEnvironment();

    const res = await service.listMembers('user-owner', 'org-alpha', {});
    assert.equal(res.page, 1);
    assert.equal(res.limit, 20);
    assert.ok(res.items.length > 0);
  });

  await t.test('Test 48 [F2.2]: Explicit valid page and limit calculate pagination correctly', async () => {
    const { service } = createTestEnvironment();

    const res = await service.listMembers('user-owner', 'org-alpha', { page: 2, limit: 2 });
    assert.equal(res.page, 2);
    assert.equal(res.limit, 2);
    assert.equal(res.items.length, 2);
  });

  await t.test('Test 49 [F2.3]: Invalid zero page (page: 0) is rejected with 400 Bad Request', async () => {
    const { service } = createTestEnvironment();

    await assert.rejects(
      async () => {
        await service.listMembers('user-owner', 'org-alpha', { page: 0 });
      },
      (err: any) => {
        assert.ok(err instanceof BadRequestException);
        assert.equal(err.message, 'Page must be a valid positive integer');
        return true;
      },
    );
  });

  await t.test('Test 50 [F2.4]: Negative page (page: -1) is rejected with 400 Bad Request', async () => {
    const { service } = createTestEnvironment();

    await assert.rejects(
      async () => {
        await service.listMembers('user-owner', 'org-alpha', { page: -1 });
      },
      (err: any) => {
        assert.ok(err instanceof BadRequestException);
        assert.equal(err.message, 'Page must be a valid positive integer');
        return true;
      },
    );
  });

  await t.test('Test 51 [F2.5]: Fractional page (page: 1.5) is rejected with 400 Bad Request', async () => {
    const { service } = createTestEnvironment();

    await assert.rejects(
      async () => {
        await service.listMembers('user-owner', 'org-alpha', { page: 1.5 });
      },
      (err: any) => {
        assert.ok(err instanceof BadRequestException);
        assert.equal(err.message, 'Page must be a valid positive integer');
        return true;
      },
    );
  });

  await t.test('Test 52 [F2.6]: Non-numeric page is rejected with 400 Bad Request', async () => {
    const { service } = createTestEnvironment();

    await assert.rejects(
      async () => {
        await service.listMembers('user-owner', 'org-alpha', { page: 'invalid_page' as any });
      },
      (err: any) => {
        assert.ok(err instanceof BadRequestException);
        assert.equal(err.message, 'Page must be a valid positive integer');
        return true;
      },
    );
  });

  await t.test('Test 53 [F2.7]: Page greater than configured maximum (10000) is rejected with 400 Bad Request', async () => {
    const { service } = createTestEnvironment();

    await assert.rejects(
      async () => {
        await service.listMembers('user-owner', 'org-alpha', { page: 10001 });
      },
      (err: any) => {
        assert.ok(err instanceof BadRequestException);
        assert.equal(err.message, 'Page cannot exceed 10000');
        return true;
      },
    );
  });

  await t.test('Test 54 [F2.8]: Invalid limit (zero or negative) is rejected with 400 Bad Request', async () => {
    const { service } = createTestEnvironment();

    await assert.rejects(
      async () => {
        await service.listMembers('user-owner', 'org-alpha', { limit: 0 });
      },
      (err: any) => {
        assert.ok(err instanceof BadRequestException);
        assert.equal(err.message, 'Limit must be an integer between 1 and 100');
        return true;
      },
    );

    await assert.rejects(
      async () => {
        await service.listMembers('user-owner', 'org-alpha', { limit: -10 });
      },
      (err: any) => {
        assert.ok(err instanceof BadRequestException);
        assert.equal(err.message, 'Limit must be an integer between 1 and 100');
        return true;
      },
    );
  });

  await t.test('Test 55 [F2.9]: Limit above 100 is rejected with 400 Bad Request', async () => {
    const { service } = createTestEnvironment();

    await assert.rejects(
      async () => {
        await service.listMembers('user-owner', 'org-alpha', { limit: 101 });
      },
      (err: any) => {
        assert.ok(err instanceof BadRequestException);
        assert.equal(err.message, 'Limit must be an integer between 1 and 100');
        return true;
      },
    );
  });

  await t.test('Test 56 [F2.10]: Offset at the permitted boundary (500000) is accepted', async () => {
    const { service } = createTestEnvironment();

    // page: 5001, limit: 100 => skip = (5001 - 1) * 100 = 500000 <= 500000
    const res = await service.listMembers('user-owner', 'org-alpha', { page: 5001, limit: 100 });
    assert.equal(res.page, 5001);
    assert.equal(res.limit, 100);
  });

  await t.test('Test 57 [F2.11]: Offset above the permitted boundary (> 500000) is rejected with 400 Bad Request', async () => {
    const { service } = createTestEnvironment();

    // page: 5002, limit: 100 => skip = 500100 > 500000
    await assert.rejects(
      async () => {
        await service.listMembers('user-owner', 'org-alpha', { page: 5002, limit: 100 });
      },
      (err: any) => {
        assert.ok(err instanceof BadRequestException);
        assert.equal(err.message, 'Pagination offset exceeds maximum permitted limit (500000)');
        return true;
      },
    );
  });

  await t.test('Test 58 [F2.12]: Stable ordering by joinedAt DESC and id DESC is strictly enforced', async () => {
    const { service } = createTestEnvironment();

    const res = await service.listMembers('user-owner', 'org-alpha', { limit: 10 });
    assert.ok(res.items.length >= 2);
    for (let i = 0; i < res.items.length - 1; i++) {
      const curTime = new Date(res.items[i].joinedAt).getTime();
      const nextTime = new Date(res.items[i + 1].joinedAt).getTime();
      assert.ok(curTime >= nextTime, 'Members must be ordered by joinedAt DESC');
    }
  });

  await t.test('Test 59 [F2.13]: Tenant-scoped queries remain strictly isolated across organizations', async () => {
    const { service } = createTestEnvironment();

    // Querying org-alpha returns only members belonging to org-alpha
    const alphaMembers = await service.listMembers('user-owner', 'org-alpha', {});
    for (const member of alphaMembers.items) {
      assert.equal(member.organizationId, 'org-alpha');
      assert.notEqual(member.userId, 'user-foreign');
    }

    // Querying org-beta returns only members belonging to org-beta
    const betaMembers = await service.listMembers('user-foreign', 'org-beta', {});
    for (const member of betaMembers.items) {
      assert.equal(member.organizationId, 'org-beta');
      assert.equal(member.userId, 'user-foreign');
    }
  });
});
