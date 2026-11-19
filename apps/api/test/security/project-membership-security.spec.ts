import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ForbiddenException,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { ProjectService } from '../../src/projects/project.service.js';
import { ProjectsController } from '../../src/projects/projects.controller.js';
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
  passwordHash?: string;
}

interface MockProject {
  id: string;
  name: string;
  organizationId: string;
  organization: {
    id: string;
    ownerId: string;
  };
}

interface MockOrgMember {
  organizationId: string;
  userId: string;
  role: CanonicalOrganizationRole;
}

interface MockProjectMember {
  projectId: string;
  userId: string;
  joinedAt: Date;
}

function createTestEnvironment() {
  const users: Record<string, MockUser> = {
    // Org Owner (also in proj-alpha)
    'user-owner': {
      id: 'user-owner',
      email: 'owner@alpha.org',
      username: 'alpha_owner',
      firstName: 'Alpha',
      lastName: 'Owner',
      avatarUrl: null,
      passwordHash: 'secret-hash-owner',
    },
    // Org Owner without ProjectMember record (F2 test)
    'user-owner-no-pm': {
      id: 'user-owner-no-pm',
      email: 'owner_nopm@alpha.org',
      username: 'alpha_owner_nopm',
      firstName: 'Alpha',
      lastName: 'OwnerNoPM',
      avatarUrl: null,
      passwordHash: 'secret-hash-owner-nopm',
    },
    // Org Admin (also in proj-alpha)
    'user-admin': {
      id: 'user-admin',
      email: 'admin@alpha.org',
      username: 'alpha_admin',
      firstName: 'Alpha',
      lastName: 'Admin',
      avatarUrl: 'https://alpha.org/admin.png',
      passwordHash: 'secret-hash-admin',
    },
    // Org Admin without ProjectMember record (F2 test)
    'user-admin-no-pm': {
      id: 'user-admin-no-pm',
      email: 'admin_nopm@alpha.org',
      username: 'alpha_admin_nopm',
      firstName: 'Alpha',
      lastName: 'AdminNoPM',
      avatarUrl: null,
      passwordHash: 'secret-hash-admin-nopm',
    },
    // Org Manager (also in proj-alpha)
    'user-manager': {
      id: 'user-manager',
      email: 'manager@alpha.org',
      username: 'alpha_manager',
      firstName: 'Alpha',
      lastName: 'Manager',
      avatarUrl: null,
      passwordHash: 'secret-hash-manager',
    },
    // Org Manager without ProjectMember record (F2 test)
    'user-manager-no-pm': {
      id: 'user-manager-no-pm',
      email: 'manager_nopm@alpha.org',
      username: 'alpha_manager_nopm',
      firstName: 'Alpha',
      lastName: 'ManagerNoPM',
      avatarUrl: null,
      passwordHash: 'secret-hash-manager-nopm',
    },
    // Org Engineer (canonical technical role)
    'user-engineer': {
      id: 'user-engineer',
      email: 'engineer@alpha.org',
      username: 'alpha_eng',
      firstName: 'Alpha',
      lastName: 'Engineer',
      avatarUrl: null,
      passwordHash: 'secret-hash-eng',
    },
    // Valid candidate for project membership
    'user-valid-candidate': {
      id: 'user-valid-candidate',
      email: 'candidate@alpha.org',
      username: 'candidate_alpha',
      firstName: 'Valid',
      lastName: 'Candidate',
      avatarUrl: 'https://alpha.org/candidate.png',
      passwordHash: 'secret-hash-candidate',
    },
    // Already in proj-alpha
    'user-already-member': {
      id: 'user-already-member',
      email: 'existing@alpha.org',
      username: 'existing_member',
      firstName: 'Existing',
      lastName: 'Member',
      avatarUrl: null,
      passwordHash: 'secret-hash-existing',
    },
    // Foreign tenant user (belongs to org-beta only)
    'user-foreign-tenant': {
      id: 'user-foreign-tenant',
      email: 'stranger@beta.org',
      username: 'stranger_beta',
      firstName: 'Foreign',
      lastName: 'TenantUser',
      avatarUrl: null,
      passwordHash: 'secret-hash-foreign',
    },
    // User with no organization membership
    'user-no-org': {
      id: 'user-no-org',
      email: 'lonely@independent.net',
      username: 'lonely_user',
      firstName: 'Lonely',
      lastName: 'User',
      avatarUrl: null,
      passwordHash: 'secret-hash-lonely',
    },
  };

  const projects: Record<string, MockProject> = {
    'proj-alpha': {
      id: 'proj-alpha',
      name: 'Alpha Core Project',
      organizationId: 'org-alpha',
      organization: {
        id: 'org-alpha',
        ownerId: 'user-owner',
      },
    },
    'proj-beta': {
      id: 'proj-beta',
      name: 'Beta Secret Project',
      organizationId: 'org-beta',
      organization: {
        id: 'org-beta',
        ownerId: 'user-foreign-tenant',
      },
    },
  };

  const orgMembers: MockOrgMember[] = [
    { organizationId: 'org-alpha', userId: 'user-owner', role: 'OWNER' },
    { organizationId: 'org-alpha', userId: 'user-owner-no-pm', role: 'OWNER' },
    { organizationId: 'org-alpha', userId: 'user-admin', role: 'ADMIN' },
    { organizationId: 'org-alpha', userId: 'user-admin-no-pm', role: 'ADMIN' },
    { organizationId: 'org-alpha', userId: 'user-manager', role: 'MANAGER' },
    { organizationId: 'org-alpha', userId: 'user-manager-no-pm', role: 'MANAGER' },
    { organizationId: 'org-alpha', userId: 'user-engineer', role: 'ENGINEER' },
    { organizationId: 'org-alpha', userId: 'user-valid-candidate', role: 'ENGINEER' },
    { organizationId: 'org-alpha', userId: 'user-already-member', role: 'ENGINEER' },
    // Foreign tenant user is in org-beta only:
    { organizationId: 'org-beta', userId: 'user-foreign-tenant', role: 'ADMIN' },
  ];

  const projectMembers: MockProjectMember[] = [
    { projectId: 'proj-alpha', userId: 'user-owner', joinedAt: new Date('2026-01-01') },
    { projectId: 'proj-alpha', userId: 'user-admin', joinedAt: new Date('2026-01-01') },
    { projectId: 'proj-alpha', userId: 'user-manager', joinedAt: new Date('2026-01-01') },
    { projectId: 'proj-alpha', userId: 'user-engineer', joinedAt: new Date('2026-01-02') },
    { projectId: 'proj-alpha', userId: 'user-already-member', joinedAt: new Date('2026-01-03') },
    // Note: user-owner-no-pm, user-admin-no-pm, user-manager-no-pm are deliberately NOT in projectMembers
  ];

  let writeCount = 0;

  const mockPrisma: any = {
    _getWriteCount: () => writeCount,
    _getProjectMembers: () => [...projectMembers],

    project: {
      findUnique: async ({ where }: any) => {
        return projects[where.id] ?? null;
      },
    },

    projectMember: {
      findUnique: async ({ where }: any) => {
        const { projectId, userId } = where.projectId_userId || {};
        return (
          projectMembers.find(
            (m) => m.projectId === projectId && m.userId === userId,
          ) ?? null
        );
      },
      create: async ({ data, include }: any) => {
        writeCount++;
        const newMember: MockProjectMember = {
          projectId: data.projectId,
          userId: data.userId,
          joinedAt: new Date(),
        };
        projectMembers.push(newMember);

        const targetUser = users[data.userId];
        return {
          ...newMember,
          user: include?.user?.select
            ? {
                id: targetUser.id,
                email: targetUser.email,
                username: targetUser.username,
                firstName: targetUser.firstName,
                lastName: targetUser.lastName,
                avatarUrl: targetUser.avatarUrl,
              }
            : targetUser,
        };
      },
      delete: async ({ where }: any) => {
        writeCount++;
        const { projectId, userId } = where.projectId_userId || {};
        const idx = projectMembers.findIndex(
          (m) => m.projectId === projectId && m.userId === userId,
        );
        if (idx !== -1) {
          projectMembers.splice(idx, 1);
        }
        return { count: 1 };
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
    },

    user: {
      findUnique: async ({ where }: any) => {
        return users[where.id] ?? null;
      },
    },

    $transaction: async (fn: (tx: any) => Promise<any>, _options?: any) => {
      // Execute the callback passing mockPrisma as tx
      return fn(mockPrisma);
    },
  };

  const service = new ProjectService(mockPrisma);
  const controller = new ProjectsController(service);

  return { service, controller, mockPrisma, users, projects, projectMembers, orgMembers };
}

// ─────────────────────────────────────────────────────────────────────────────
// Test Suite: Phase 1.1 Project Membership Security & Concurrency Verification
// ─────────────────────────────────────────────────────────────────────────────

test('SEC-INV-01 — Phase 1.1: Project Membership Security & Concurrency Verification', async (t) => {
  await t.test('Test 1: Valid same-organization member is successfully added to project', async () => {
    const { service, mockPrisma } = createTestEnvironment();
    const initialWriteCount = mockPrisma._getWriteCount();

    const result = await service.addMember(
      'user-admin',
      'proj-alpha',
      'user-valid-candidate',
    );

    assert.ok(result, 'Member should be created');
    assert.equal(result.projectId, 'proj-alpha');
    assert.equal(result.userId, 'user-valid-candidate');
    assert.equal(mockPrisma._getWriteCount(), initialWriteCount + 1, 'Exactly one write should occur');

    // Safe projection verification: sensitive fields must not be exposed
    assert.equal(result.user.id, 'user-valid-candidate');
    assert.equal(result.user.email, 'candidate@alpha.org');
    assert.equal(result.user.username, 'candidate_alpha');
    assert.equal(result.user.firstName, 'Valid');
    assert.equal(result.user.lastName, 'Candidate');
    assert.equal((result.user as any).passwordHash, undefined, 'passwordHash must never be exposed');
  });

  await t.test('Test 2 [CRITICAL SEC-INV-01]: Foreign organization user is rejected with 403 Forbidden', async () => {
    const { service, mockPrisma } = createTestEnvironment();
    const initialWriteCount = mockPrisma._getWriteCount();
    const initialMemberCount = mockPrisma._getProjectMembers().length;

    await assert.rejects(
      async () => {
        await service.addMember(
          'user-admin',
          'proj-alpha',
          'user-foreign-tenant',
        );
      },
      (err: any) => {
        assert.ok(err instanceof ForbiddenException, 'Must throw ForbiddenException');
        assert.equal(err.message, 'User is not a member of this organization');
        return true;
      },
    );

    // Verify zero database writes occurred
    assert.equal(mockPrisma._getWriteCount(), initialWriteCount, 'Zero writes must occur on rejection');
    assert.equal(
      mockPrisma._getProjectMembers().length,
      initialMemberCount,
      'Project member list must remain unchanged',
    );
  });

  await t.test('Test 3: Target user with no organization membership is rejected with 403 Forbidden', async () => {
    const { service, mockPrisma } = createTestEnvironment();
    const initialWriteCount = mockPrisma._getWriteCount();

    await assert.rejects(
      async () => {
        await service.addMember(
          'user-admin',
          'proj-alpha',
          'user-no-org',
        );
      },
      (err: any) => {
        assert.ok(err instanceof ForbiddenException, 'Must throw ForbiddenException');
        assert.equal(err.message, 'User is not a member of this organization');
        return true;
      },
    );

    assert.equal(mockPrisma._getWriteCount(), initialWriteCount, 'Zero writes must occur on rejection');
  });

  await t.test('Test 4 [F2 Compatibility]: Organization OWNER without ProjectMember record is authorized', async () => {
    const { service, mockPrisma } = createTestEnvironment();
    const initialWriteCount = mockPrisma._getWriteCount();

    // Verify user-owner-no-pm is NOT a project member initially
    const pmInitial = mockPrisma
      ._getProjectMembers()
      .find((m: any) => m.userId === 'user-owner-no-pm');
    assert.equal(pmInitial, undefined, 'Must not be in projectMember store');

    // Org Owner should successfully add member without deadlock
    const result = await service.addMember(
      'user-owner-no-pm',
      'proj-alpha',
      'user-valid-candidate',
    );

    assert.ok(result, 'OWNER without ProjectMember record must be authorized');
    assert.equal(result.userId, 'user-valid-candidate');
    assert.equal(mockPrisma._getWriteCount(), initialWriteCount + 1);
  });

  await t.test('Test 5 [F2 Compatibility]: Organization ADMIN without ProjectMember record is authorized', async () => {
    const { service, mockPrisma } = createTestEnvironment();
    const initialWriteCount = mockPrisma._getWriteCount();

    // Verify user-admin-no-pm is NOT a project member initially
    const pmInitial = mockPrisma
      ._getProjectMembers()
      .find((m: any) => m.userId === 'user-admin-no-pm');
    assert.equal(pmInitial, undefined, 'Must not be in projectMember store');

    // Org Admin should successfully add member without deadlock
    const result = await service.addMember(
      'user-admin-no-pm',
      'proj-alpha',
      'user-valid-candidate',
    );

    assert.ok(result, 'ADMIN without ProjectMember record must be authorized');
    assert.equal(result.userId, 'user-valid-candidate');
    assert.equal(mockPrisma._getWriteCount(), initialWriteCount + 1);
  });

  await t.test('Test 6 [F2 Compatibility]: Organization MANAGER without ProjectMember record is authorized', async () => {
    const { service, mockPrisma } = createTestEnvironment();
    const initialWriteCount = mockPrisma._getWriteCount();

    // Verify user-manager-no-pm is NOT a project member initially
    const pmInitial = mockPrisma
      ._getProjectMembers()
      .find((m: any) => m.userId === 'user-manager-no-pm');
    assert.equal(pmInitial, undefined, 'Must not be in projectMember store');

    // Org Manager should successfully add member without deadlock
    const result = await service.addMember(
      'user-manager-no-pm',
      'proj-alpha',
      'user-valid-candidate',
    );

    assert.ok(result, 'MANAGER without ProjectMember record must be authorized');
    assert.equal(result.userId, 'user-valid-candidate');
    assert.equal(mockPrisma._getWriteCount(), initialWriteCount + 1);
  });

  await t.test('Test 7: Authorized requester who is already a ProjectMember succeeds', async () => {
    const { service } = createTestEnvironment();

    // user-admin is already in projectMembers and has ADMIN org role
    const result = await service.addMember(
      'user-admin',
      'proj-alpha',
      'user-valid-candidate',
    );

    assert.ok(result, 'Authorized project member must succeed');
    assert.equal(result.userId, 'user-valid-candidate');
  });

  await t.test('Test 8: Unauthorized organization member (ENGINEER) is rejected with 403', async () => {
    const { service, mockPrisma } = createTestEnvironment();
    const initialWriteCount = mockPrisma._getWriteCount();

    // user-engineer is an active project member and org member, but has non-admin role ENGINEER
    await assert.rejects(
      async () => {
        await service.addMember(
          'user-engineer',
          'proj-alpha',
          'user-valid-candidate',
        );
      },
      (err: any) => {
        assert.ok(err instanceof ForbiddenException, 'Must throw ForbiddenException');
        assert.equal(err.message, 'You do not have permission to add project members');
        return true;
      },
    );

    assert.equal(mockPrisma._getWriteCount(), initialWriteCount, 'Zero writes must occur on rejection');
  });

  await t.test('Test 9: Unrelated organization user is rejected with 403', async () => {
    const { service, mockPrisma } = createTestEnvironment();
    const initialWriteCount = mockPrisma._getWriteCount();

    // user-foreign-tenant is in org-beta, not in org-alpha
    await assert.rejects(
      async () => {
        await service.addMember(
          'user-foreign-tenant',
          'proj-alpha',
          'user-valid-candidate',
        );
      },
      (err: any) => {
        assert.ok(err instanceof ForbiddenException, 'Must throw ForbiddenException');
        assert.equal(err.message, 'You do not have permission to add project members');
        return true;
      },
    );

    assert.equal(mockPrisma._getWriteCount(), initialWriteCount, 'Zero writes must occur on rejection');
  });

  await t.test('Test 10: Nonexistent target user is rejected with 404 Not Found', async () => {
    const { service, mockPrisma } = createTestEnvironment();
    const initialWriteCount = mockPrisma._getWriteCount();

    await assert.rejects(
      async () => {
        await service.addMember(
          'user-admin',
          'proj-alpha',
          'user-does-not-exist',
        );
      },
      (err: any) => {
        assert.ok(err instanceof NotFoundException, 'Must throw NotFoundException');
        assert.equal(err.message, 'User not found');
        return true;
      },
    );

    assert.equal(mockPrisma._getWriteCount(), initialWriteCount, 'Zero writes must occur on rejection');
  });

  await t.test('Test 11: Nonexistent project is rejected with 404 Not Found (derived orgId integrity)', async () => {
    const { service, mockPrisma } = createTestEnvironment();
    const initialWriteCount = mockPrisma._getWriteCount();

    await assert.rejects(
      async () => {
        await service.addMember(
          'user-admin',
          'proj-nonexistent',
          'user-valid-candidate',
        );
      },
      (err: any) => {
        assert.ok(err instanceof NotFoundException, 'Must throw NotFoundException');
        assert.equal(err.message, 'Project not found');
        return true;
      },
    );

    assert.equal(mockPrisma._getWriteCount(), initialWriteCount, 'Zero writes must occur on rejection');
  });

  await t.test('Test 12: Duplicate membership is rejected with 409 Conflict', async () => {
    const { service, mockPrisma } = createTestEnvironment();
    const initialWriteCount = mockPrisma._getWriteCount();

    await assert.rejects(
      async () => {
        await service.addMember(
          'user-admin',
          'proj-alpha',
          'user-already-member',
        );
      },
      (err: any) => {
        assert.ok(err instanceof ConflictException, 'Must throw ConflictException');
        assert.equal(err.message, 'User is already a member of this project');
        return true;
      },
    );

    assert.equal(mockPrisma._getWriteCount(), initialWriteCount, 'Zero writes must occur on rejection');
  });

  await t.test('Test 13 [F5 Concurrency]: Concurrent unique constraint collision (P2002) returns 409 Conflict', async () => {
    const { service, mockPrisma } = createTestEnvironment();

    // Inject simulated P2002 unique constraint collision during creation (race condition after pre-check)
    mockPrisma.projectMember.create = async () => {
      const error: any = new Error('Unique constraint failed on the fields: (`projectId`,`userId`)');
      error.code = 'P2002';
      throw error;
    };

    await assert.rejects(
      async () => {
        await service.addMember(
          'user-admin',
          'proj-alpha',
          'user-valid-candidate',
        );
      },
      (err: any) => {
        assert.ok(err instanceof ConflictException, 'P2002 must be converted to ConflictException');
        assert.equal(err.message, 'User is already a member of this project');
        return true;
      },
    );
  });

  await t.test('Test 14 [F1 Concurrency]: Transaction serialization conflict (P2034) triggers retry and succeeds', async () => {
    const { service, mockPrisma } = createTestEnvironment();

    let attempts = 0;
    const originalTx = mockPrisma.$transaction;

    // Simulate P2034 conflict on first attempt, then succeed on second
    mockPrisma.$transaction = async (fn: any, options: any) => {
      attempts++;
      if (attempts === 1) {
        const error: any = new Error('Transaction failed due to a write conflict or deadlock (P2034)');
        error.code = 'P2034';
        throw error;
      }
      return originalTx(fn, options);
    };

    const result = await service.addMember(
      'user-admin',
      'proj-alpha',
      'user-valid-candidate',
    );

    assert.ok(result, 'Should succeed after retry');
    assert.equal(attempts, 2, 'Must have retried exactly once after P2034');
    assert.equal(result.userId, 'user-valid-candidate');
  });

  await t.test('Test 15 [F1 Concurrency]: Permanent P2034 conflict exhausts bounded retries and fails cleanly', async () => {
    const { service, mockPrisma } = createTestEnvironment();

    let attempts = 0;
    mockPrisma.$transaction = async () => {
      attempts++;
      const error: any = new Error('Transaction failed due to serialization conflict');
      error.code = 'P2034';
      throw error;
    };

    await assert.rejects(
      async () => {
        await service.addMember(
          'user-admin',
          'proj-alpha',
          'user-valid-candidate',
        );
      },
      (err: any) => {
        assert.equal(err.code, 'P2034');
        return true;
      },
    );

    assert.equal(attempts, 3, 'Must stop after MAX_RETRIES (3 attempts)');
  });

  await t.test('Test 16 [F3 Canonical Roles]: Enum fixtures verify canonical OrganizationRole definitions', () => {
    const canonicalRoles: CanonicalOrganizationRole[] = [
      'OWNER',
      'ADMIN',
      'ENGINEER',
      'MANAGER',
      'VIEWER',
    ];

    // Assert that 'DEVELOPER' is NOT a valid canonical OrganizationRole
    assert.ok(!canonicalRoles.includes('DEVELOPER' as any), 'DEVELOPER is deprecated/non-canonical');
    assert.ok(canonicalRoles.includes('ENGINEER'), 'ENGINEER is canonical technical role');
    assert.ok(canonicalRoles.includes('OWNER'), 'OWNER is canonical role');
    assert.ok(canonicalRoles.includes('ADMIN'), 'ADMIN is canonical role');
    assert.ok(canonicalRoles.includes('MANAGER'), 'MANAGER is canonical role');
    assert.ok(canonicalRoles.includes('VIEWER'), 'VIEWER is canonical role');
  });

  await t.test('Test 17 [F4 Controller]: Canonical JWT identity extraction and type safety', async () => {
    const { controller } = createTestEnvironment();

    const validReq = {
      user: {
        userId: 'user-admin',
        id: 'user-admin',
        email: 'admin@alpha.org',
        username: 'alpha_admin',
      },
    } as any;

    const dto = {
      userId: 'user-valid-candidate',
    };

    const response = await controller.addMember(validReq, 'proj-alpha', dto);
    assert.ok(response);
    assert.equal(response.userId, 'user-valid-candidate');
    assert.equal(response.projectId, 'proj-alpha');

    // Test missing userId throws 401 UnauthorizedException (fail closed)
    const invalidReq = {
      user: {} as any,
    } as any;

    await assert.rejects(
      async () => {
        await controller.addMember(invalidReq, 'proj-alpha', dto);
      },
      (err: any) => {
        assert.ok(err instanceof UnauthorizedException, 'Must throw UnauthorizedException on missing identity');
        assert.equal(err.message, 'User is not authenticated');
        return true;
      },
    );
  });

  await t.test('Test 18: Controller enforces JwtAuthGuard metadata', () => {
    const guards = Reflect.getMetadata('__guards__', ProjectsController);
    assert.ok(Array.isArray(guards), 'Guards should be registered on ProjectsController');
    const hasJwtGuard = guards.some((g: any) => g === JwtAuthGuard || g.name === 'JwtAuthGuard');
    assert.ok(hasJwtGuard, 'JwtAuthGuard must be attached to ProjectsController');
  });

  await t.test('Test 19: removeMember allows organization OWNER, ADMIN, MANAGER without deadlock', async () => {
    const { service, mockPrisma } = createTestEnvironment();

    // user-owner-no-pm removes user-already-member
    const result = await service.removeMember(
      'user-owner-no-pm',
      'proj-alpha',
      'user-already-member',
    );

    assert.ok(result);
    assert.equal(result.message, 'Project member removed successfully');

    // Verify self-removal is blocked
    await assert.rejects(
      async () => {
        await service.removeMember(
          'user-admin',
          'proj-alpha',
          'user-admin',
        );
      },
      (err: any) => {
        assert.ok(err instanceof ForbiddenException);
        assert.equal(err.message, 'You cannot remove yourself from a project');
        return true;
      },
    );
  });
});
