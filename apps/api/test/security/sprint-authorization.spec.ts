import test from 'node:test';
import assert from 'node:assert';
import { SprintsController } from '../../src/sprints/sprints.controller.js';
import { SprintsService } from '../../src/sprints/sprints.service.js';
import { JwtAuthGuard } from '../../src/auth/guards/jwt-auth.guard.js';

function createMockPrismaForSprints(authorizedProjectIds: string[]) {
  const sprintsStore: any[] = [
    {
      id: 'sprint-auth-1',
      projectId: 'proj-auth-1',
      creatorId: 'user-auth-1',
      name: 'Q4 Foundation Sprint',
      goal: 'Deliver core authentication and API endpoints',
      status: 'ACTIVE',
      startDate: new Date('2026-11-01'),
      endDate: new Date('2026-11-14'),
      capacity: 40,
    },
    {
      id: 'sprint-foreign-1',
      projectId: 'proj-foreign-1',
      creatorId: 'user-foreign-1',
      name: 'Secret Foreign Sprint',
      goal: 'Confidential external initiative',
      status: 'ACTIVE',
      startDate: new Date('2026-11-01'),
      endDate: new Date('2026-11-14'),
      capacity: 50,
    },
  ];

  const sprintMembersStore: any[] = [
    {
      id: 'sm-1',
      sprintId: 'sprint-auth-1',
      userId: 'user-auth-1',
      sprintId_userId: { sprintId: 'sprint-auth-1', userId: 'user-auth-1' },
    },
  ];

  return {
    user: {
      findUnique: async ({ where }: any) => {
        if (where.id === 'user-nonexistent') return null;
        if (where.id === 'user-suspended') return { id: 'user-suspended', status: 'SUSPENDED' };
        return { id: where.id, status: 'ACTIVE' };
      },
    },
    project: {
      findUnique: async ({ where, select }: any) => {
        if (where.id === 'proj-nonexistent') return null;
        const isAuth = authorizedProjectIds.includes(where.id);
        const queryUserId = select?.members?.where?.userId ?? where?.members?.where?.userId;
        const isMember = isAuth && (queryUserId === 'user-auth-1' || queryUserId === 'user-auth-member');
        return {
          id: where.id,
          organizationId: isAuth ? 'org-auth' : 'org-foreign',
          organization: {
            id: isAuth ? 'org-auth' : 'org-foreign',
            ownerId: isAuth ? 'user-auth-1' : 'user-foreign-owner',
          },
          members: isMember ? [{ id: 'pm-1' }] : [],
        };
      },
      findMany: async () => [],
    },
    projectMember: {
      findMany: async ({ where }: any) => {
        return authorizedProjectIds.map((pId) => ({ projectId: pId }));
      },
    },
    organizationMember: {
      findUnique: async () => null,
    },
    sprint: {
      create: async ({ data }: any) => {
        const created = { id: `sprint-${Date.now()}`, ...data };
        sprintsStore.push(created);
        return created;
      },
      findMany: async ({ where }: any) => {
        if (where?.projectId?.in) {
          return sprintsStore.filter((s) => where.projectId.in.includes(s.projectId));
        }
        if (where?.projectId) {
          return sprintsStore.filter((s) => s.projectId === where.projectId);
        }
        return sprintsStore;
      },
      findUnique: async ({ where }: any) => {
        return sprintsStore.find((s) => s.id === where.id) || null;
      },
      update: async ({ where, data }: any) => {
        const sprint = sprintsStore.find((s) => s.id === where.id);
        if (sprint) Object.assign(sprint, data);
        return sprint;
      },
      delete: async ({ where }: any) => {
        const idx = sprintsStore.findIndex((s) => s.id === where.id);
        if (idx >= 0) sprintsStore.splice(idx, 1);
        return { id: where.id };
      },
    },
    sprintMember: {
      create: async ({ data }: any) => {
        const member = { id: `sm-${Date.now()}`, ...data };
        sprintMembersStore.push(member);
        return member;
      },
      findMany: async ({ where }: any) => {
        if (where?.sprintId) {
          return sprintMembersStore.filter((sm) => sm.sprintId === where.sprintId);
        }
        return sprintMembersStore;
      },
      delete: async ({ where }: any) => {
        const idx = sprintMembersStore.findIndex(
          (sm) => sm.sprintId === where.sprintId_userId.sprintId && sm.userId === where.sprintId_userId.userId
        );
        if (idx >= 0) sprintMembersStore.splice(idx, 1);
        return { id: 'deleted' };
      },
    },
  } as any;
}

/* =========================================================
   SUITE 1: CONTROLLER AUTHENTICATION GUARD ENFORCEMENT
   ========================================================= */

test('Sprints Security - SprintsController is protected with JwtAuthGuard', () => {
  const guards = Reflect.getMetadata('__guards__', SprintsController);
  assert.ok(guards, 'SprintsController must declare guard metadata');
  assert.ok(
    guards.includes(JwtAuthGuard),
    'SprintsController must have JwtAuthGuard applied at class level'
  );
});

/* =========================================================
   SUITE 2: SPRINT LISTING & DETAIL AUTHORIZATION
   ========================================================= */

test('Sprints Security - Authorized project member can list project sprints', async () => {
  const prisma = createMockPrismaForSprints(['proj-auth-1']);
  const service = new SprintsService(prisma);

  const sprints = await service.findAll('user-auth-1', 'proj-auth-1');
  assert.strictEqual(sprints.length, 1);
  assert.strictEqual(sprints[0].id, 'sprint-auth-1');
  assert.strictEqual(sprints[0].projectId, 'proj-auth-1');
});

test('Sprints Security - User from another project cannot list foreign sprints (403)', async () => {
  const prisma = createMockPrismaForSprints(['proj-auth-1']); // Not authorized for proj-foreign-1
  const service = new SprintsService(prisma);

  await assert.rejects(
    () => service.findAll('user-auth-1', 'proj-foreign-1'),
    (err: any) => err.status === 403,
    'Listing sprints of foreign project must be rejected with 403 Forbidden'
  );
});

test('Sprints Security - Unfiltered list scopes by user authorized projects and does not leak foreign sprints', async () => {
  const prisma = createMockPrismaForSprints(['proj-auth-1']);
  const service = new SprintsService(prisma);

  // Calling findAll without projectId
  const sprints = await service.findAll('user-auth-1');
  assert.strictEqual(sprints.length, 1);
  assert.strictEqual(sprints[0].id, 'sprint-auth-1');
  assert.ok(
    !sprints.some((s: any) => s.projectId === 'proj-foreign-1'),
    'Unscoped findAll must never leak sprints from unauthorized foreign projects'
  );
});

test('Sprints Security - Authorized user can view an accessible sprint detail', async () => {
  const prisma = createMockPrismaForSprints(['proj-auth-1']);
  const service = new SprintsService(prisma);

  const sprint = await service.findOne('user-auth-1', 'sprint-auth-1');
  assert.strictEqual(sprint.id, 'sprint-auth-1');
});

test('Sprints Security - Foreign sprint detail access is blocked with 403 Forbidden', async () => {
  const prisma = createMockPrismaForSprints(['proj-auth-1']);
  const service = new SprintsService(prisma);

  await assert.rejects(
    () => service.findOne('user-auth-1', 'sprint-foreign-1'),
    (err: any) => err.status === 403,
    'Reading foreign sprint detail must throw 403 Forbidden'
  );
});

/* =========================================================
   SUITE 3: SPRINT CREATION & IDENTITY DERIVATION
   ========================================================= */

test('Sprints Security - Authorized user can create a sprint and creatorId is strictly bound to authenticated user', async () => {
  const prisma = createMockPrismaForSprints(['proj-auth-1']);
  const service = new SprintsService(prisma);

  const created = await service.create('user-auth-1', {
    projectId: 'proj-auth-1',
    name: 'New Sprint 01',
    startDate: '2026-12-01T00:00:00.000Z',
    endDate: '2026-12-14T00:00:00.000Z',
    capacity: 35,
  } as any);

  assert.strictEqual(created.projectId, 'proj-auth-1');
  assert.strictEqual(created.creatorId, 'user-auth-1', 'creatorId must be strictly bound to authenticated user');
});

test('Sprints Security - Client-supplied creatorId cannot spoof another user', async () => {
  const prisma = createMockPrismaForSprints(['proj-auth-1']);
  const service = new SprintsService(prisma);

  const created = await service.create('user-auth-1', {
    projectId: 'proj-auth-1',
    name: 'Spoof attempt sprint',
    creatorId: 'user-foreign-impersonated', // Client attempts to claim another creator
    startDate: '2026-12-01T00:00:00.000Z',
    endDate: '2026-12-14T00:00:00.000Z',
  } as any);

  assert.strictEqual(
    created.creatorId,
    'user-auth-1',
    'Client-supplied creatorId must be ignored and overridden by JWT identity'
  );
});

test('Sprints Security - Foreign project sprint creation is blocked with 403 Forbidden', async () => {
  const prisma = createMockPrismaForSprints(['proj-auth-1']);
  const service = new SprintsService(prisma);

  await assert.rejects(
    () =>
      service.create('user-auth-1', {
        projectId: 'proj-foreign-1', // Foreign unauthorized project
        name: 'Unauthorized sprint creation',
        startDate: '2026-12-01T00:00:00.000Z',
        endDate: '2026-12-14T00:00:00.000Z',
      } as any),
    (err: any) => err.status === 403,
    'Attempt to create sprint in foreign project must throw 403 Forbidden'
  );
});

/* =========================================================
   SUITE 4: SPRINT MUTATION (UPDATE & DELETE)
   ========================================================= */

test('Sprints Security - Foreign sprint update is blocked with 403 Forbidden', async () => {
  const prisma = createMockPrismaForSprints(['proj-auth-1']);
  const service = new SprintsService(prisma);

  await assert.rejects(
    () =>
      service.update('user-auth-1', 'sprint-foreign-1', {
        name: 'Compromised Name',
      } as any),
    (err: any) => err.status === 403,
    'Updating foreign sprint must throw 403 Forbidden'
  );
});

test('Sprints Security - Authorized sprint update succeeds', async () => {
  const prisma = createMockPrismaForSprints(['proj-auth-1']);
  const service = new SprintsService(prisma);

  const updated = await service.update('user-auth-1', 'sprint-auth-1', {
    name: 'Updated Foundation Sprint',
    goal: 'Updated milestone objectives',
  } as any);

  assert.strictEqual(updated.name, 'Updated Foundation Sprint');
});

test('Sprints Security - Foreign sprint deletion is blocked with 403 Forbidden', async () => {
  const prisma = createMockPrismaForSprints(['proj-auth-1']);
  const service = new SprintsService(prisma);

  await assert.rejects(
    () => service.remove('user-auth-1', 'sprint-foreign-1'),
    (err: any) => err.status === 403,
    'Deleting foreign sprint must throw 403 Forbidden'
  );
});

test('Sprints Security - Authorized sprint deletion succeeds', async () => {
  const prisma = createMockPrismaForSprints(['proj-auth-1']);
  const service = new SprintsService(prisma);

  const result = await service.remove('user-auth-1', 'sprint-auth-1');
  assert.ok(result);
});

/* =========================================================
   SUITE 5: SPRINT MEMBERS MANAGEMENT AUTHORIZATION
   ========================================================= */

test('Sprints Security - Foreign sprint members listing is blocked with 403 Forbidden', async () => {
  const prisma = createMockPrismaForSprints(['proj-auth-1']);
  const service = new SprintsService(prisma);

  await assert.rejects(
    () => service.getMembers('user-auth-1', 'sprint-foreign-1'),
    (err: any) => err.status === 403,
    'Listing members of a foreign sprint must throw 403 Forbidden'
  );
});

test('Sprints Security - Authorized member addition succeeds when target user belongs to project', async () => {
  const prisma = createMockPrismaForSprints(['proj-auth-1']);
  const service = new SprintsService(prisma);

  const added = await service.addMember('user-auth-1', 'sprint-auth-1', 'user-auth-member');
  assert.strictEqual(added.userId, 'user-auth-member');
  assert.strictEqual(added.sprintId, 'sprint-auth-1');
});

test('Sprints Security - Target user from another project cannot be added to sprint (403)', async () => {
  const prisma = createMockPrismaForSprints(['proj-auth-1']);
  const service = new SprintsService(prisma);

  await assert.rejects(
    () => service.addMember('user-auth-1', 'sprint-auth-1', 'user-foreign-1'),
    (err: any) => err.status === 403,
    'Adding target user without project access must throw 403 Forbidden'
  );
});

test('Sprints Security - Non-existent target user throws 404', async () => {
  const prisma = createMockPrismaForSprints(['proj-auth-1']);
  const service = new SprintsService(prisma);

  await assert.rejects(
    () => service.addMember('user-auth-1', 'sprint-auth-1', 'user-nonexistent'),
    (err: any) => err.status === 404,
    'Adding non-existent user must throw 404'
  );
});

test('Sprints Security - Unauthorized user cannot remove members from foreign sprint (403)', async () => {
  const prisma = createMockPrismaForSprints(['proj-auth-1']);
  const service = new SprintsService(prisma);

  await assert.rejects(
    () => service.removeMember('user-auth-1', 'sprint-foreign-1', 'user-foreign-1'),
    (err: any) => err.status === 403,
    'Removing member from foreign sprint must throw 403 Forbidden'
  );
});

test('Sprints Security - Authorized user can remove member from sprint', async () => {
  const prisma = createMockPrismaForSprints(['proj-auth-1']);
  const service = new SprintsService(prisma);

  const result = await service.removeMember('user-auth-1', 'sprint-auth-1', 'user-auth-1');
  assert.ok(result);
});
