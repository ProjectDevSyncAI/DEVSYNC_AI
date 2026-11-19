import assert from 'node:assert/strict';
import test from 'node:test';

import { ActivityController } from '../../src/activity/activity.controller.js';
import {
  ActivityService,
  MAX_ACTIVITY_LIMIT,
  MAX_ACTIVITY_OFFSET,
  MAX_ACTIVITY_PAGE,
  SAFE_PROJECT_SELECT,
  SAFE_USER_SELECT,
} from '../../src/activity/activity.service.js';
import { validateActivityMetadata } from '../../src/activity/helpers/metadata-validator.helper.js';

function createMockPrisma(options: {
  projectExists?: boolean;
  isProjectMember?: boolean;
  isOrgOwner?: boolean;
  orgRole?: string;
  platformRole?: string;
  authorizedProjectIds?: string[];
  activities?: any[];
} = {}) {
  const {
    projectExists = true,
    isProjectMember = true,
    isOrgOwner = false,
    orgRole = 'MEMBER',
    authorizedProjectIds = ['proj-1'],
    activities = [],
  } = options;

  let queryExecuted = false;

  const mockPrisma: any = {
    project: {
      findUnique: async ({ where }: any) => {
        queryExecuted = true;
        if (!projectExists) return null;
        return {
          id: where.id,
          name: 'Project 1',
          key: 'P1',
          organizationId: 'org-1',
          organization: {
            id: 'org-1',
            ownerId: isOrgOwner ? 'user-1' : 'user-other',
          },
          members: isProjectMember ? [{ id: 'pm-1' }] : [],
          status: 'ACTIVE',
        };
      },
      findMany: async () => {
        queryExecuted = true;
        return authorizedProjectIds.map((id) => ({ id }));
      },
    },

    projectMember: {
      findUnique: async ({ where }: any) => {
        queryExecuted = true;
        if (!isProjectMember) return null;
        return {
          id: 'pm-1',
          projectId: where.projectId_userId?.projectId || 'proj-1',
          userId: where.projectId_userId?.userId || 'user-1',
          role: 'MEMBER',
        };
      },
      findMany: async ({ where }: any) => {
        queryExecuted = true;
        return authorizedProjectIds.map((projectId) => ({
          projectId,
          role: 'MEMBER',
        }));
      },
    },

    organization: {
      findUnique: async ({ where }: any) => {
        queryExecuted = true;
        return {
          id: where.id,
          ownerId: isOrgOwner ? 'user-1' : 'user-other',
        };
      },
      findMany: async () => {
        queryExecuted = true;
        return isOrgOwner ? [{ id: 'org-1' }] : [];
      },
    },

    organizationMember: {
      findUnique: async () => {
        queryExecuted = true;
        return { role: orgRole };
      },
      findMany: async () => {
        queryExecuted = true;
        return ['OWNER', 'ADMIN'].includes(orgRole) ? [{ organizationId: 'org-1' }] : [];
      },
    },

    activity: {
      create: async ({ data, select }: any) => {
        queryExecuted = true;
        const record = {
          id: 'act-' + (activities.length + 1),
          ...data,
          createdAt: new Date(),
          project: { id: data.projectId, name: 'Project 1', key: 'P1', organizationId: 'org-1' },
          user: {
            id: data.userId,
            firstName: 'Jane',
            lastName: 'Doe',
            username: 'janedoe',
            avatarUrl: 'https://avatar.png',
            passwordHash: '$2b$10$EXTREMELY_SECRET_HASH',
            tokenVersion: 42,
          },
        };

        if (select) {
          const sanitized: any = {};
          for (const key of Object.keys(select)) {
            if (key === 'user' && select.user?.select) {
              sanitized.user = {};
              for (const uKey of Object.keys(select.user.select)) {
                sanitized.user[uKey] = record.user[uKey];
              }
            } else if (key === 'project' && select.project?.select) {
              sanitized.project = {};
              for (const pKey of Object.keys(select.project.select)) {
                sanitized.project[pKey] = record.project[pKey];
              }
            } else {
              sanitized[key] = record[key];
            }
          }
          activities.push(sanitized);
          return sanitized;
        }

        activities.push(record);
        return record;
      },

      count: async ({ where }: any = {}) => {
        queryExecuted = true;
        let filtered = [...activities];
        if (where?.projectId?.in) {
          filtered = filtered.filter((a) => where.projectId.in.includes(a.projectId));
        } else if (where?.projectId) {
          filtered = filtered.filter((a) => a.projectId === where.projectId);
        }
        if (where?.userId) {
          filtered = filtered.filter((a) => a.userId === where.userId);
        }
        if (where?.type) {
          filtered = filtered.filter((a) => a.type === where.type);
        }
        return filtered.length;
      },

      findMany: async ({ where, take, skip, orderBy, select }: any = {}) => {
        queryExecuted = true;
        let filtered = [...activities];
        if (where?.projectId?.in) {
          filtered = filtered.filter((a) => where.projectId.in.includes(a.projectId));
        } else if (where?.projectId) {
          filtered = filtered.filter((a) => a.projectId === where.projectId);
        }
        if (where?.userId) {
          filtered = filtered.filter((a) => a.userId === where.userId);
        }
        if (where?.type) {
          filtered = filtered.filter((a) => a.type === where.type);
        }

        if (Array.isArray(orderBy)) {
          filtered.sort((a, b) => {
            for (const order of orderBy) {
              const [key, dir] = Object.entries(order)[0] as [string, 'asc' | 'desc'];
              const aVal = a[key] instanceof Date ? a[key].getTime() : a[key];
              const bVal = b[key] instanceof Date ? b[key].getTime() : b[key];
              if (aVal !== bVal) {
                return dir === 'desc' ? (bVal > aVal ? 1 : -1) : (aVal > bVal ? 1 : -1);
              }
            }
            return 0;
          });
        }

        if (typeof skip === 'number') {
          filtered = filtered.slice(skip);
        }
        if (typeof take === 'number') {
          filtered = filtered.slice(0, take);
        }

        if (select) {
          return filtered.map((record) => {
            const sanitized: any = {};
            for (const key of Object.keys(select)) {
              if (key === 'user' && select.user?.select) {
                if (record.user) {
                  sanitized.user = {};
                  for (const uKey of Object.keys(select.user.select)) {
                    sanitized.user[uKey] = record.user[uKey];
                  }
                } else {
                  sanitized.user = null;
                }
              } else if (key === 'project' && select.project?.select) {
                if (record.project) {
                  sanitized.project = {};
                  for (const pKey of Object.keys(select.project.select)) {
                    sanitized.project[pKey] = record.project[pKey];
                  }
                } else {
                  sanitized.project = null;
                }
              } else {
                sanitized[key] = record[key];
              }
            }
            return sanitized;
          });
        }

        return filtered;
      },

      findUnique: async ({ where, select }: any) => {
        queryExecuted = true;
        const record = activities.find((a) => a.id === where.id) || null;
        if (!record) return null;

        if (select) {
          const sanitized: any = {};
          for (const key of Object.keys(select)) {
            if (key === 'user' && select.user?.select) {
              if (record.user) {
                sanitized.user = {};
                for (const uKey of Object.keys(select.user.select)) {
                  sanitized.user[uKey] = record.user[uKey];
                }
              } else {
                sanitized.user = null;
              }
            } else if (key === 'project' && select.project?.select) {
              if (record.project) {
                sanitized.project = {};
                for (const pKey of Object.keys(select.project.select)) {
                  sanitized.project[pKey] = record.project[pKey];
                }
              } else {
                sanitized.project = null;
              }
            } else {
              sanitized[key] = record[key];
            }
          }
          return sanitized;
        }

        return record;
      },

      update: async ({ where, data, select }: any) => {
        queryExecuted = true;
        const act = activities.find((a) => a.id === where.id);
        if (act) Object.assign(act, data);
        if (select && act) {
          const sanitized: any = {};
          for (const key of Object.keys(select)) {
            sanitized[key] = act[key];
          }
          return sanitized;
        }
        return act;
      },

      delete: async ({ where }: any) => {
        queryExecuted = true;
        const idx = activities.findIndex((a) => a.id === where.id);
        if (idx !== -1) return activities.splice(idx, 1)[0];
        return null;
      },
    },
  };

  return mockPrisma;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. SENSITIVE DATA PROTECTION & SAFE PROJECTIONS
// ═══════════════════════════════════════════════════════════════════════════════

test('Activity Privacy 1: SAFE_USER_SELECT defines only non-sensitive presentation fields', () => {
  assert.deepStrictEqual(SAFE_USER_SELECT, {
    id: true,
    firstName: true,
    lastName: true,
    username: true,
    avatarUrl: true,
  });
  assert.strictEqual((SAFE_USER_SELECT as any).passwordHash, undefined);
  assert.strictEqual((SAFE_USER_SELECT as any).tokenVersion, undefined);
});

test('Activity Privacy 2: SAFE_PROJECT_SELECT defines only non-sensitive project fields', () => {
  assert.deepStrictEqual(SAFE_PROJECT_SELECT, {
    id: true,
    name: true,
    key: true,
    organizationId: true,
  });
});

test('Activity Privacy 3: findAll response strictly excludes passwordHash and tokenVersion', async () => {
  const rawActivities = [
    {
      id: 'act-1',
      projectId: 'proj-1',
      userId: 'user-1',
      type: 'TASK_CREATED',
      title: 'Task Created',
      createdAt: new Date(),
      user: {
        id: 'user-1',
        firstName: 'Jane',
        lastName: 'Doe',
        username: 'janedoe',
        avatarUrl: 'https://avatar.png',
        passwordHash: '$2b$10$EXTREMELY_SECRET_HASH',
        tokenVersion: 99,
      },
      project: { id: 'proj-1', name: 'DevSync', key: 'DS', organizationId: 'org-1' },
    },
  ];

  const prisma = createMockPrisma({ activities: rawActivities });
  const service = new ActivityService(prisma);
  const controller = new ActivityController(service, prisma);

  const req = { user: { id: 'user-1' } };
  const res = await controller.findAll(req, { projectId: 'proj-1' });

  assert.strictEqual(res.items.length, 1);
  const item = res.items[0];

  assert.strictEqual(item.user?.username, 'janedoe');
  assert.strictEqual(item.user?.firstName, 'Jane');
  assert.strictEqual((item.user as any)?.passwordHash, undefined, 'passwordHash must never be exposed');
  assert.strictEqual((item.user as any)?.tokenVersion, undefined, 'tokenVersion must never be exposed');
});

test('Activity Privacy 4: findById response strictly excludes passwordHash and tokenVersion', async () => {
  const rawActivities = [
    {
      id: 'act-detail-1',
      projectId: 'proj-1',
      userId: 'user-1',
      type: 'ISSUE_RESOLVED',
      title: 'Bug Fixed',
      createdAt: new Date(),
      user: {
        id: 'user-1',
        firstName: 'Alex',
        lastName: 'Dev',
        username: 'alexdev',
        avatarUrl: null,
        passwordHash: '$2b$10$HASH_MUST_BE_HIDDEN',
        tokenVersion: 12,
      },
      project: { id: 'proj-1', name: 'DevSync', key: 'DS', organizationId: 'org-1' },
    },
  ];

  const prisma = createMockPrisma({ activities: rawActivities });
  const service = new ActivityService(prisma);
  const controller = new ActivityController(service, prisma);

  const req = { user: { id: 'user-1' } };
  const detail = await controller.findById(req, 'act-detail-1');

  assert.strictEqual(detail.id, 'act-detail-1');
  assert.strictEqual(detail.user?.username, 'alexdev');
  assert.strictEqual((detail.user as any)?.passwordHash, undefined);
  assert.strictEqual((detail.user as any)?.tokenVersion, undefined);
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. BOUNDED PAGINATION & STRICT REJECTION OF INVALID INPUTS
// ═══════════════════════════════════════════════════════════════════════════════

test('Activity Pagination 1: Default request enforces page 1 and limit 20', async () => {
  const items = Array.from({ length: 45 }, (_, i) => ({
    id: `act-${i + 1}`,
    projectId: 'proj-1',
    type: 'TASK',
    title: `Task ${i + 1}`,
    createdAt: new Date(2026, 0, i + 1),
  }));

  const prisma = createMockPrisma({ activities: items });
  const service = new ActivityService(prisma);
  const controller = new ActivityController(service, prisma);

  const req = { user: { id: 'user-1' } };
  const res = await controller.findAll(req, { projectId: 'proj-1' });

  assert.strictEqual(res.page, 1);
  assert.strictEqual(res.limit, 20);
  assert.strictEqual(res.total, 45);
  assert.strictEqual(res.totalPages, 3);
  assert.strictEqual(res.hasNextPage, true);
  assert.strictEqual(res.hasPreviousPage, false);
  assert.strictEqual(res.items.length, 20);
});

test('Activity Pagination 2: Explicit page and limit parameters calculate skip and take correctly', async () => {
  const items = Array.from({ length: 35 }, (_, i) => ({
    id: `act-${i + 1}`,
    projectId: 'proj-1',
    type: 'TASK',
    title: `Task ${i + 1}`,
    createdAt: new Date(2026, 0, i + 1),
  }));

  const prisma = createMockPrisma({ activities: items });
  const service = new ActivityService(prisma);
  const controller = new ActivityController(service, prisma);

  const req = { user: { id: 'user-1' } };
  const res = await controller.findAll(req, { projectId: 'proj-1', page: 2, limit: 10 });

  assert.strictEqual(res.page, 2);
  assert.strictEqual(res.limit, 10);
  assert.strictEqual(res.total, 35);
  assert.strictEqual(res.totalPages, 4);
  assert.strictEqual(res.hasNextPage, true);
  assert.strictEqual(res.hasPreviousPage, true);
  assert.strictEqual(res.items.length, 10);
});

test('Activity Pagination 3: Limit exceeding maximum 100 is strictly rejected with 400', async () => {
  const prisma = createMockPrisma();
  const service = new ActivityService(prisma);
  const controller = new ActivityController(service, prisma);

  const req = { user: { id: 'user-1' } };
  await assert.rejects(
    async () => controller.findAll(req, { projectId: 'proj-1', page: 1, limit: 101 }),
    (err: any) => err.status === 400 && err.message.includes('Limit must be an integer between 1 and 100'),
  );
});

test('Activity Pagination 4: Zero, negative, and non-integer values are rejected with 400', async () => {
  const prisma = createMockPrisma();
  const service = new ActivityService(prisma);
  const controller = new ActivityController(service, prisma);

  const req = { user: { id: 'user-1' } };

  // Negative page
  await assert.rejects(
    async () => controller.findAll(req, { projectId: 'proj-1', page: -1 }),
    (err: any) => err.status === 400 && err.message.includes('Page must be a valid positive integer'),
  );

  // Zero page
  await assert.rejects(
    async () => controller.findAll(req, { projectId: 'proj-1', page: 0 }),
    (err: any) => err.status === 400 && err.message.includes('Page must be a valid positive integer'),
  );

  // Decimal page
  await assert.rejects(
    async () => controller.findAll(req, { projectId: 'proj-1', page: 1.5 }),
    (err: any) => err.status === 400 && err.message.includes('Page must be a valid positive integer'),
  );

  // Decimal limit
  await assert.rejects(
    async () => controller.findAll(req, { projectId: 'proj-1', limit: 12.3 }),
    (err: any) => err.status === 400 && err.message.includes('Limit must be an integer between 1 and 100'),
  );
});

test('Activity Pagination 5: Page exceeding maximum permitted page 10000 is rejected with 400', async () => {
  const prisma = createMockPrisma();
  const service = new ActivityService(prisma);
  const controller = new ActivityController(service, prisma);

  const req = { user: { id: 'user-1' } };
  await assert.rejects(
    async () => controller.findAll(req, { projectId: 'proj-1', page: 10001 }),
    (err: any) => err.status === 400 && err.message.includes(`Page cannot exceed ${MAX_ACTIVITY_PAGE}`),
  );
});

test('Activity Pagination 6: Offset calculation exceeding MAX_ACTIVITY_OFFSET is rejected with 400', async () => {
  const prisma = createMockPrisma();
  const service = new ActivityService(prisma);

  // Directly call service to verify defensive offset check
  await assert.rejects(
    async () => service.findAll('proj-1', undefined, undefined, 6000, 100), // (6000-1)*100 = 599,900 > 500,000
    (err: any) => err.status === 400 && err.message.includes(`Pagination offset exceeds maximum permitted limit (${MAX_ACTIVITY_OFFSET})`),
  );
});

test('Activity Pagination 7: Empty dataset returns total 0 and totalPages 0 with false flags', async () => {
  const prisma = createMockPrisma({ activities: [] });
  const service = new ActivityService(prisma);
  const controller = new ActivityController(service, prisma);

  const req = { user: { id: 'user-1' } };
  const res = await controller.findAll(req, { projectId: 'proj-1' });

  assert.strictEqual(res.total, 0);
  assert.strictEqual(res.totalPages, 0);
  assert.strictEqual(res.hasNextPage, false);
  assert.strictEqual(res.hasPreviousPage, false);
  assert.strictEqual(res.items.length, 0);
});

test('Activity Pagination 8: Final page with fewer than requested limit calculates flags correctly', async () => {
  const items = Array.from({ length: 25 }, (_, i) => ({
    id: `act-${i + 1}`,
    projectId: 'proj-1',
    type: 'TASK',
    title: `Task ${i + 1}`,
    createdAt: new Date(2026, 0, i + 1),
  }));

  const prisma = createMockPrisma({ activities: items });
  const service = new ActivityService(prisma);
  const controller = new ActivityController(service, prisma);

  const req = { user: { id: 'user-1' } };
  const res = await controller.findAll(req, { projectId: 'proj-1', page: 3, limit: 10 });

  assert.strictEqual(res.page, 3);
  assert.strictEqual(res.items.length, 5);
  assert.strictEqual(res.hasNextPage, false);
  assert.strictEqual(res.hasPreviousPage, true);
});

test('Activity Pagination 9: Multi-project authorized pagination applies bounded limits and count', async () => {
  const items = [
    { id: 'act-p1-1', projectId: 'proj-1', title: 'Task P1-1', createdAt: new Date(2026, 0, 1) },
    { id: 'act-p1-2', projectId: 'proj-1', title: 'Task P1-2', createdAt: new Date(2026, 0, 2) },
    { id: 'act-p2-1', projectId: 'proj-2', title: 'Task P2-1', createdAt: new Date(2026, 0, 3) },
    { id: 'act-p3-secret', projectId: 'proj-forbidden', title: 'Secret Task', createdAt: new Date(2026, 0, 4) },
  ];

  const prisma = createMockPrisma({
    authorizedProjectIds: ['proj-1', 'proj-2'],
    activities: items,
  });
  const service = new ActivityService(prisma);
  const controller = new ActivityController(service, prisma);

  const req = { user: { id: 'user-1' } };
  const res = await controller.findAll(req, { page: 1, limit: 2 });

  assert.strictEqual(res.total, 3, 'Total count must exclude forbidden projects');
  assert.strictEqual(res.items.length, 2);
  assert.strictEqual(res.totalPages, 2);
  assert.strictEqual(res.hasNextPage, true);
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3. DETERMINISTIC CHRONOLOGICAL ORDERING
// ═══════════════════════════════════════════════════════════════════════════════

test('Activity Ordering 1: Records with identical timestamps sort deterministically by id DESC', async () => {
  const sameTime = new Date('2026-11-17T10:00:00.000Z');
  const items = [
    { id: 'act-aaa', projectId: 'proj-1', title: 'First Created', createdAt: sameTime },
    { id: 'act-zzz', projectId: 'proj-1', title: 'Second Created', createdAt: sameTime },
    { id: 'act-mmm', projectId: 'proj-1', title: 'Third Created', createdAt: sameTime },
  ];

  const prisma = createMockPrisma({ activities: items });
  const service = new ActivityService(prisma);
  const controller = new ActivityController(service, prisma);

  const req = { user: { id: 'user-1' } };
  const res = await controller.findAll(req, { projectId: 'proj-1' });

  assert.strictEqual(res.items[0].id, 'act-zzz');
  assert.strictEqual(res.items[1].id, 'act-mmm');
  assert.strictEqual(res.items[2].id, 'act-aaa');
});

// ═══════════════════════════════════════════════════════════════════════════════
// 4. USERID FILTER AUTHORIZATION (SCOPE B)
// ═══════════════════════════════════════════════════════════════════════════════

test('Activity Scope B [1]: Unscoped query by non-admin with third-party userId is blocked with 403', async () => {
  const prisma = createMockPrisma();
  const service = new ActivityService(prisma);
  const controller = new ActivityController(service, prisma);

  const req = { user: { id: 'user-actor', platformRole: 'USER' } };

  // Attempting to query activities of user-victim across all projects without specifying projectId
  await assert.rejects(
    async () => controller.findAll(req, { userId: 'user-victim' }),
    (err: any) =>
      err.status === 403 &&
      err.message.includes('Cannot query other users activity across projects without platform administrator privileges'),
  );
});

test('Activity Scope B [2]: Unscoped query with own userId is permitted for regular user', async () => {
  const prisma = createMockPrisma({
    authorizedProjectIds: ['proj-1'],
    activities: [{ id: 'act-1', projectId: 'proj-1', userId: 'user-actor', title: 'My task', createdAt: new Date() }],
  });
  const service = new ActivityService(prisma);
  const controller = new ActivityController(service, prisma);

  const req = { user: { id: 'user-actor', platformRole: 'USER' } };
  const res = await controller.findAll(req, { userId: 'user-actor' });

  assert.strictEqual(res.items.length, 1);
  assert.strictEqual(res.items[0].userId, 'user-actor');
});

test('Activity Scope B [3]: Unscoped query by Platform ADMIN with third-party userId is permitted', async () => {
  const prisma = createMockPrisma({
    authorizedProjectIds: ['proj-1'],
    activities: [{ id: 'act-1', projectId: 'proj-1', userId: 'user-target', title: 'Target task', createdAt: new Date() }],
  });
  const service = new ActivityService(prisma);
  const controller = new ActivityController(service, prisma);

  const req = { user: { id: 'user-superadmin', platformRole: 'ADMIN' } };
  const res = await controller.findAll(req, { userId: 'user-target' });

  assert.strictEqual(res.items.length, 1);
  assert.strictEqual(res.items[0].userId, 'user-target');
});

test('Activity Scope B [4]: Project-scoped query allows filtering by team member userId when caller is member', async () => {
  const prisma = createMockPrisma({
    projectExists: true,
    isProjectMember: true,
    activities: [{ id: 'act-1', projectId: 'proj-1', userId: 'user-teammate', title: 'Team task', createdAt: new Date() }],
  });
  const service = new ActivityService(prisma);
  const controller = new ActivityController(service, prisma);

  const req = { user: { id: 'user-actor', platformRole: 'USER' } };
  const res = await controller.findAll(req, { projectId: 'proj-1', userId: 'user-teammate' });

  assert.strictEqual(res.items.length, 1);
  assert.strictEqual(res.items[0].userId, 'user-teammate');
});

test('Activity Scope B [5]: Project-scoped query rejects caller who is not a member of target project (403)', async () => {
  const prisma = createMockPrisma({
    projectExists: true,
    isProjectMember: false,
    isOrgOwner: false,
  });
  const service = new ActivityService(prisma);
  const controller = new ActivityController(service, prisma);

  const req = { user: { id: 'user-intruder', platformRole: 'USER' } };
  await assert.rejects(
    async () => controller.findAll(req, { projectId: 'proj-foreign', userId: 'user-anyone' }),
    (err: any) => err.status === 403,
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// 5. METADATA VALIDATION & PRIVACY (SCOPE C)
// ═══════════════════════════════════════════════════════════════════════════════

test('Activity Scope C [1]: UTF-8 multibyte characters exceeding 10KB byte ceiling are rejected with 400', () => {
  // '€' is 3 bytes in UTF-8. 3500 chars = 10,500 bytes (> 10,240 bytes) even though length < 10,000 chars!
  const multibytePayload = { symbolText: '€'.repeat(3500) };

  assert.throws(
    () => validateActivityMetadata(multibytePayload),
    (err: any) => err.status === 400 && err.message.includes('exceeds maximum permitted limit (10240 bytes)'),
  );
});

test('Activity Scope C [2]: Plain JSON object requirement rejects arrays and primitive types with 400', () => {
  assert.throws(
    () => validateActivityMetadata(['array', 'not', 'allowed']),
    (err: any) => err.status === 400 && err.message.includes('Metadata must be a plain JSON object'),
  );

  assert.throws(
    () => validateActivityMetadata('string_primitive'),
    (err: any) => err.status === 400 && err.message.includes('Metadata must be a plain JSON object'),
  );

  assert.throws(
    () => validateActivityMetadata(12345),
    (err: any) => err.status === 400 && err.message.includes('Metadata must be a plain JSON object'),
  );
});

test('Activity Scope C [3]: Non-serializable circular metadata is rejected with 400', () => {
  const circular: any = { prop: 'valid' };
  circular.self = circular;

  assert.throws(
    () => validateActivityMetadata(circular),
    (err: any) => err.status === 400 && err.message.includes('Metadata contains non-serializable values'),
  );
});

test('Activity Scope C [4]: Prohibited sensitive keys (password, token, secret, apiKey) are strictly rejected with 400', () => {
  assert.throws(
    () => validateActivityMetadata({ password: 'my-password' }),
    (err: any) => err.status === 400 && err.message.includes('prohibited: credentials and security-sensitive tokens'),
  );

  assert.throws(
    () => validateActivityMetadata({ nested: { accessToken: 'jwt-token-here' } }),
    (err: any) => err.status === 400 && err.message.includes('prohibited: credentials and security-sensitive tokens'),
  );

  assert.throws(
    () => validateActivityMetadata({ authSecret: 'secret123' }),
    (err: any) => err.status === 400 && err.message.includes('prohibited: credentials and security-sensitive tokens'),
  );

  assert.throws(
    () => validateActivityMetadata({ privateKey: '-----BEGIN RSA PRIVATE KEY-----' }),
    (err: any) => err.status === 400 && err.message.includes('prohibited: credentials and security-sensitive tokens'),
  );
});

test('Activity Scope C [5]: Deep nesting exceeding 5 levels is rejected with 400', () => {
  const deep = { l1: { l2: { l3: { l4: { l5: { l6: { l7: 'too deep' } } } } } } };

  assert.throws(
    () => validateActivityMetadata(deep),
    (err: any) => err.status === 400 && err.message.includes('Metadata nesting depth cannot exceed 5 levels'),
  );
});

test('Activity Scope C [6]: Safe metadata passes validation and serializes cleanly', () => {
  const safe = {
    storyPoints: 5,
    tags: ['core', 'auth'],
    ui: { theme: 'dark', platform: 'desktop' },
    isComplete: true,
  };

  const validated = validateActivityMetadata(safe);
  assert.deepStrictEqual(validated, safe);
});

// ═══════════════════════════════════════════════════════════════════════════════
// 6. MANUAL CREATION & TRUST BOUNDARIES
// ═══════════════════════════════════════════════════════════════════════════════

test('Activity Trust 1: Actor spoofing is strictly prevented by overriding userId from JWT', async () => {
  const prisma = createMockPrisma({ projectExists: true, isProjectMember: true });
  const service = new ActivityService(prisma);
  const controller = new ActivityController(service, prisma);

  const req = { user: { id: 'user-actual-jwt-subject' } };
  const created = await controller.create(req, {
    projectId: 'proj-1',
    userId: 'user-spoofed-target',
    type: 'TASK_NOTE',
    title: 'Legitimate Note',
  });

  assert.strictEqual(created.userId, 'user-actual-jwt-subject');
});

test('Activity Trust 2: Activity creation for unauthorized project is blocked with 403', async () => {
  const prisma = createMockPrisma({ projectExists: true, isProjectMember: false, isOrgOwner: false });
  const service = new ActivityService(prisma);
  const controller = new ActivityController(service, prisma);

  const req = { user: { id: 'user-unauthorized' } };
  await assert.rejects(
    async () => controller.create(req, { projectId: 'proj-foreign', type: 'TASK_NOTE', title: 'Unauthorized' }),
    (err: any) => err.status === 403,
  );
});

test('Activity Trust 3: Description exceeding 2000 characters is rejected with 400', async () => {
  const prisma = createMockPrisma({ projectExists: true, isProjectMember: true });
  const service = new ActivityService(prisma);
  const controller = new ActivityController(service, prisma);

  const req = { user: { id: 'user-1' } };
  const longDescription = 'A'.repeat(2001);

  await assert.rejects(
    async () =>
      controller.create(req, {
        projectId: 'proj-1',
        type: 'TASK_NOTE',
        title: 'Note',
        description: longDescription,
      }),
    (err: any) => err.status === 400 && err.message.includes('cannot exceed 2000 characters'),
  );
});

test('Activity Trust 4: Personal activity access blocks unauthorized third-party users with 403', async () => {
  const rawActivities = [
    {
      id: 'act-personal-1',
      projectId: null,
      userId: 'user-private-owner',
      type: 'PROFILE_UPDATED',
      title: 'Profile Updated',
      createdAt: new Date(),
    },
  ];

  const prisma = createMockPrisma({ activities: rawActivities });
  const service = new ActivityService(prisma);
  const controller = new ActivityController(service, prisma);

  const req = { user: { id: 'user-intruder', platformRole: 'USER' } };
  await assert.rejects(
    async () => controller.findById(req, 'act-personal-1'),
    (err: any) => err.status === 403,
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// 7. IMMUTABILITY CONTROLS
// ═══════════════════════════════════════════════════════════════════════════════

test('Activity Immutability 1: Non-admin project member cannot modify activity records (403)', async () => {
  const rawActivities = [
    { id: 'act-hist-1', projectId: 'proj-1', title: 'Original Audit', createdAt: new Date() },
  ];

  const prisma = createMockPrisma({
    projectExists: true,
    isProjectMember: true,
    orgRole: 'MEMBER',
    activities: rawActivities,
  });
  const service = new ActivityService(prisma);
  const controller = new ActivityController(service, prisma);

  const req = { user: { id: 'user-member', platformRole: 'USER' } };
  await assert.rejects(
    async () => controller.update(req, 'act-hist-1', { title: 'Modified' }),
    (err: any) => err.status === 403,
  );
});

test('Activity Immutability 2: Non-admin project member cannot delete activity records (403)', async () => {
  const rawActivities = [
    { id: 'act-hist-1', projectId: 'proj-1', title: 'Permanent Entry', createdAt: new Date() },
  ];

  const prisma = createMockPrisma({
    projectExists: true,
    isProjectMember: true,
    orgRole: 'MEMBER',
    activities: rawActivities,
  });
  const service = new ActivityService(prisma);
  const controller = new ActivityController(service, prisma);

  const req = { user: { id: 'user-member', platformRole: 'USER' } };
  await assert.rejects(
    async () => controller.remove(req, 'act-hist-1'),
    (err: any) => err.status === 403,
  );
});

test('Activity Immutability 3: Organization Admin can update and delete activity records', async () => {
  const rawActivities = [
    { id: 'act-admin-1', projectId: 'proj-1', title: 'Before Admin Fix', createdAt: new Date() },
  ];

  const prisma = createMockPrisma({
    projectExists: true,
    isProjectMember: true,
    orgRole: 'ADMIN',
    activities: rawActivities,
  });
  const service = new ActivityService(prisma);
  const controller = new ActivityController(service, prisma);

  const req = { user: { id: 'user-admin', platformRole: 'USER' } };
  const updated = await controller.update(req, 'act-admin-1', { title: 'After Admin Fix' });
  assert.strictEqual(updated.title, 'After Admin Fix');

  const removed = await controller.remove(req, 'act-admin-1');
  assert.strictEqual(removed.id, 'act-admin-1');
});

test('Activity Immutability 4: Platform Admin can update and delete activity records without org role', async () => {
  const rawActivities = [
    { id: 'act-platform-1', projectId: 'proj-1', title: 'System Event', createdAt: new Date() },
  ];

  const prisma = createMockPrisma({
    projectExists: true,
    isProjectMember: false,
    orgRole: 'MEMBER',
    activities: rawActivities,
  });
  const service = new ActivityService(prisma);
  const controller = new ActivityController(service, prisma);

  const req = { user: { id: 'user-superadmin', platformRole: 'ADMIN' } };
  const updated = await controller.update(req, 'act-platform-1', { title: 'Superadmin Revised' });
  assert.strictEqual(updated.title, 'Superadmin Revised');
});
