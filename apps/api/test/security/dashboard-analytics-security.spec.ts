import test from 'node:test';
import assert from 'node:assert/strict';
import { MetricsController } from '../../src/analytics/metrics/metrics.controller.js';
import { MetricsService } from '../../src/analytics/metrics/metrics.service.js';
import { ActivityController } from '../../src/activity/activity.controller.js';
import { ActivityService } from '../../src/activity/activity.service.js';
import { DashboardOverviewService } from '../../src/analytics/dashboard-overview.service.js';
import { AnalyticsController } from '../../src/analytics/analytics.controller.js';
import { AnalyticsService } from '../../src/analytics/analytics.service.js';
import { JwtAuthGuard } from '../../src/auth/guards/jwt-auth.guard.js';

// ─────────────────────────────────────────────────────────────────────────────
// Test Helpers & Mock Factories
// ─────────────────────────────────────────────────────────────────────────────

function createMockPrisma(options: {
  projectExists?: boolean;
  isProjectMember?: boolean;
  isOrgOwner?: boolean;
  orgRole?: string | null;
  authorizedProjectIds?: string[];
  tasks?: any[];
  issues?: any[];
  sprints?: any[];
  activities?: any[];
  memberCount?: number;
} = {}) {
  const {
    projectExists = true,
    isProjectMember = false,
    isOrgOwner = false,
    orgRole = null,
    authorizedProjectIds = ['proj-1'],
    tasks = [],
    issues = [],
    sprints = [],
    activities = [],
    memberCount = 3,
  } = options;

  let queryExecuted = false;

  const mockPrisma: any = {
    _queryExecuted: () => queryExecuted,
    _resetQueryFlag: () => {
      queryExecuted = false;
    },

    project: {
      findUnique: async ({ where }: any) => {
        if (!projectExists && where.id !== 'proj-existing-1') return null;
        return {
          id: where.id,
          name: 'DevSync AI',
          key: 'DEV',
          description: 'AI platform',
          status: 'ACTIVE',
          organizationId: 'org-1',
          createdAt: new Date('2026-01-01T00:00:00Z'),
          updatedAt: new Date('2026-01-10T00:00:00Z'),
          organization: {
            id: 'org-1',
            ownerId: isOrgOwner ? 'user-1' : 'user-other',
          },
          members: isProjectMember ? [{ id: 'pm-1' }] : [],
        };
      },
      findMany: async () => [{ id: 'proj-1' }],
    },

    projectMember: {
      count: async () => memberCount,
      findMany: async () => authorizedProjectIds.map((id) => ({ projectId: id })),
    },

    organizationMember: {
      findUnique: async () => {
        if (!orgRole) return null;
        return { role: orgRole };
      },
    },

    organization: {
      findUnique: async () => ({ id: 'org-1', ownerId: isOrgOwner ? 'user-1' : 'user-other' }),
    },

    projectAnalytics: {
      findMany: async () => {
        queryExecuted = true;
        return [{ date: new Date('2026-01-01'), completedTasks: 5, velocity: 10 }];
      },
    },

    task: {
      count: async ({ where }: any = {}) => {
        queryExecuted = true;
        let filtered = [...tasks];
        if (where?.projectId) {
          filtered = filtered.filter((t) => t.projectId === where.projectId);
        }
        if (where?.sprintId) {
          filtered = filtered.filter((t) => t.sprintId === where.sprintId);
        }
        if (where?.status) {
          if (typeof where.status === 'object' && where.status.not) {
            filtered = filtered.filter((t) => t.status !== where.status.not);
          } else if (typeof where.status === 'object' && where.status.notIn) {
            filtered = filtered.filter((t) => !where.status.notIn.includes(t.status));
          } else {
            filtered = filtered.filter((t) => t.status === where.status);
          }
        }
        if (where?.dueDate?.lt) {
          const boundary = where.dueDate.lt;
          filtered = filtered.filter((t) => t.dueDate && new Date(t.dueDate) < boundary);
        }
        return filtered.length;
      },
      findMany: async ({ where }: any = {}) => {
        queryExecuted = true;
        let filtered = [...tasks];
        if (where?.sprintId) {
          filtered = filtered.filter((t) => t.sprintId === where.sprintId);
        }
        return filtered;
      },
    },

    issue: {
      count: async ({ where }: any = {}) => {
        queryExecuted = true;
        let filtered = [...issues];
        if (where?.projectId) {
          filtered = filtered.filter((i) => i.projectId === where.projectId);
        }
        if (where?.status) {
          if (typeof where.status === 'object' && where.status.in) {
            filtered = filtered.filter((i) => where.status.in.includes(i.status));
          } else {
            filtered = filtered.filter((i) => i.status === where.status);
          }
        }
        return filtered.length;
      },
      groupBy: async ({ by, where }: any = {}) => {
        queryExecuted = true;
        let filtered = [...issues];
        if (where?.projectId) {
          filtered = filtered.filter((i) => i.projectId === where.projectId);
        }
        const field = by[0];
        const counts: Record<string, number> = {};
        for (const item of filtered) {
          const val = item[field];
          counts[val] = (counts[val] || 0) + 1;
        }
        return Object.entries(counts).map(([val, cnt]) => ({
          [field]: val,
          _count: { id: cnt },
        }));
      },
    },

    sprint: {
      findMany: async ({ where }: any = {}) => {
        queryExecuted = true;
        let filtered = [...sprints];
        if (where?.projectId) {
          filtered = filtered.filter((s) => s.projectId === where.projectId);
        }
        if (where?.status) {
          filtered = filtered.filter((s) => s.status === where.status);
        }
        return filtered;
      },
      findFirst: async ({ where }: any = {}) => {
        queryExecuted = true;
        return sprints.find((s) => s.projectId === where?.projectId && s.status === where?.status) || null;
      },
    },

    activity: {
      create: async ({ data }: any) => {
        queryExecuted = true;
        const record = { id: 'act-' + (activities.length + 1), ...data, createdAt: new Date() };
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
      findMany: async ({ where, take, skip }: any = {}) => {
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
        if (typeof skip === 'number') {
          filtered = filtered.slice(skip);
        }
        if (typeof take === 'number') {
          filtered = filtered.slice(0, take);
        }
        return filtered;
      },
      findUnique: async ({ where }: any) => {
        queryExecuted = true;
        return activities.find((a) => a.id === where.id) || null;
      },
      update: async ({ where, data }: any) => {
        queryExecuted = true;
        const act = activities.find((a) => a.id === where.id);
        if (act) Object.assign(act, data);
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
// WORKSTREAM A: MetricsController Security Tests
// ═══════════════════════════════════════════════════════════════════════════════

test('Metrics Security 1: MetricsController is protected by JwtAuthGuard at class level', () => {
  const guards = Reflect.getMetadata('__guards__', MetricsController);
  assert.ok(Array.isArray(guards), 'Guards metadata must be an array');
  assert.ok(guards.includes(JwtAuthGuard), 'MetricsController must include JwtAuthGuard');
});

test('Metrics Security 2: Unauthenticated request to getProjectMetrics throws 401', async () => {
  const prisma = createMockPrisma({ isProjectMember: false });
  const metricsService = new MetricsService(prisma);
  const controller = new MetricsController(metricsService, prisma);

  await assert.rejects(
    async () => controller.getProjectMetrics({ user: undefined }, 'proj-1'),
    (err: any) => err.status === 401 || err.message.includes('Authentication required'),
  );
  assert.strictEqual(prisma._queryExecuted(), false, 'Database query must not execute for unauthenticated user');
});

test('Metrics Security 3: Non-member request to getProjectMetrics throws 403 Forbidden', async () => {
  const prisma = createMockPrisma({ projectExists: true, isProjectMember: false, isOrgOwner: false });
  const metricsService = new MetricsService(prisma);
  const controller = new MetricsController(metricsService, prisma);

  await assert.rejects(
    async () => controller.getProjectMetrics({ user: { id: 'user-attacker' } }, 'proj-1'),
    (err: any) => err.status === 403,
  );
  assert.strictEqual(prisma._queryExecuted(), false, 'Metrics query must not execute for unauthorized user');
});

test('Metrics Security 4: Request with missing or invalid project ID is safely rejected', async () => {
  const prisma = createMockPrisma({ isProjectMember: true });
  const metricsService = new MetricsService(prisma);
  const controller = new MetricsController(metricsService, prisma);

  await assert.rejects(
    async () => controller.getProjectMetrics({ user: { id: 'user-1' } }, '   '),
    (err: any) => err.status === 400 || err.status === 404,
  );
});

test('Metrics Security 5: Authorized project member successfully retrieves project metrics', async () => {
  const prisma = createMockPrisma({ projectExists: true, isProjectMember: true });
  const metricsService = new MetricsService(prisma);
  const controller = new MetricsController(metricsService, prisma);

  const res = await controller.getProjectMetrics({ user: { id: 'user-1' } }, 'proj-1');
  assert.ok(Array.isArray(res));
  assert.strictEqual(res.length, 1);
  assert.strictEqual(res[0].completedTasks, 5);
});

// ═══════════════════════════════════════════════════════════════════════════════
// WORKSTREAM B: ActivityController Security & Immutability Tests
// ═══════════════════════════════════════════════════════════════════════════════

test('Activity Security 1: ActivityController is protected by JwtAuthGuard at class level', () => {
  const guards = Reflect.getMetadata('__guards__', ActivityController);
  assert.ok(Array.isArray(guards));
  assert.ok(guards.includes(JwtAuthGuard), 'ActivityController must include JwtAuthGuard');
});

test('Activity Security 2: Anonymous activity creation and read requests are rejected with 401', async () => {
  const prisma = createMockPrisma();
  const activityService = new ActivityService(prisma);
  const controller = new ActivityController(activityService, prisma);

  await assert.rejects(
    async () => controller.create({ user: undefined }, { type: 'TASK_DONE', title: 'Task Completed' }),
    (err: any) => err.status === 401,
  );

  await assert.rejects(
    async () => controller.findAll({ user: undefined }),
    (err: any) => err.status === 401,
  );
});

test('Activity Security 3: Client cannot spoof another user identity on activity creation', async () => {
  const prisma = createMockPrisma({ projectExists: true, isProjectMember: true });
  const activityService = new ActivityService(prisma);
  const controller = new ActivityController(activityService, prisma);

  const req = { user: { id: 'user-real-actor' } };
  const dto: any = {
    projectId: 'proj-1',
    userId: 'user-victim-spoofed', // Malicious attempt to spoof victim
    type: 'COMMENT_ADDED',
    title: 'Security Notice',
  };

  const created = await controller.create(req, dto);
  assert.strictEqual(created.userId, 'user-real-actor', 'Actor ID must be overridden from authenticated JWT');
});

test('Activity Security 4: Activity creation for unauthorized project is rejected with 403', async () => {
  const prisma = createMockPrisma({ projectExists: true, isProjectMember: false, isOrgOwner: false });
  const activityService = new ActivityService(prisma);
  const controller = new ActivityController(activityService, prisma);

  const req = { user: { id: 'user-attacker' } };
  await assert.rejects(
    async () => controller.create(req, { projectId: 'proj-foreign', type: 'TASK', title: 'Hacked' }),
    (err: any) => err.status === 403,
  );
});

test('Activity Security 5: Unscoped findAll retrieves only activities in user authorized projects', async () => {
  const prisma = createMockPrisma({
    authorizedProjectIds: ['proj-auth-1'],
    activities: [
      { id: 'act-1', projectId: 'proj-auth-1', title: 'Allowed' },
      { id: 'act-2', projectId: 'proj-secret-2', title: 'Forbidden' },
    ],
  });
  const activityService = new ActivityService(prisma);
  const controller = new ActivityController(activityService, prisma);

  const req = { user: { id: 'user-1' } };
  const results: any = await controller.findAll(req);
  const items = Array.isArray(results) ? results : results.items;

  assert.strictEqual(items.length, 1);
  assert.strictEqual(items[0].id, 'act-1');
});

test('Activity Security 6: Ordinary project members cannot modify historical activity (immutability)', async () => {
  const prisma = createMockPrisma({
    projectExists: true,
    isProjectMember: true,
    orgRole: 'ENGINEER', // Regular engineer, not org admin
    activities: [{ id: 'act-hist-1', projectId: 'proj-1', title: 'Original Audit Entry' }],
  });
  const activityService = new ActivityService(prisma);
  const controller = new ActivityController(activityService, prisma);

  const req = { user: { id: 'user-regular-member', platformRole: 'USER' } };

  await assert.rejects(
    async () => controller.update(req, 'act-hist-1', { title: 'Tampered Entry' }),
    (err: any) => err.status === 403 && err.message.includes('Only organization administrators'),
  );
});

test('Activity Security 7: Ordinary project members cannot delete historical activity records', async () => {
  const prisma = createMockPrisma({
    projectExists: true,
    isProjectMember: true,
    orgRole: 'ENGINEER',
    activities: [{ id: 'act-hist-1', projectId: 'proj-1', title: 'Permanent Record' }],
  });
  const activityService = new ActivityService(prisma);
  const controller = new ActivityController(activityService, prisma);

  const req = { user: { id: 'user-regular-member', platformRole: 'USER' } };

  await assert.rejects(
    async () => controller.remove(req, 'act-hist-1'),
    (err: any) => err.status === 403 && err.message.includes('Only organization administrators'),
  );
});

test('Activity Security 8: Organization administrators CAN modify or delete activity audit records', async () => {
  const prisma = createMockPrisma({
    projectExists: true,
    isProjectMember: true,
    orgRole: 'ADMIN', // Organization Admin
    activities: [{ id: 'act-hist-1', projectId: 'proj-1', title: 'Before Admin Edit' }],
  });
  const activityService = new ActivityService(prisma);
  const controller = new ActivityController(activityService, prisma);

  const req = { user: { id: 'user-admin', platformRole: 'USER' } };

  const updated = await controller.update(req, 'act-hist-1', { title: 'Admin Revised' });
  assert.strictEqual(updated.title, 'Admin Revised');

  const removed = await controller.remove(req, 'act-hist-1');
  assert.strictEqual(removed.id, 'act-hist-1');
});

// ═══════════════════════════════════════════════════════════════════════════════
// WORKSTREAM C: Live Dashboard Overview Aggregations & Calculations
// ═══════════════════════════════════════════════════════════════════════════════

test('Dashboard Calculation 1: Rejects non-existent project with 404', async () => {
  const prisma = createMockPrisma({ projectExists: false });
  const service = new DashboardOverviewService(prisma);

  await assert.rejects(
    async () => service.getDashboardOverview('non-existent-proj'),
    (err: any) => err.status === 404,
  );
});

test('Dashboard Calculation 2: Aggregates task status counts and overdue counts accurately', async () => {
  const now = new Date();
  const pastDate = new Date(now.getTime() - 24 * 3600 * 1000); // 1 day ago
  const futureDate = new Date(now.getTime() + 24 * 3600 * 1000); // 1 day future

  const sampleTasks = [
    { id: 't1', projectId: 'proj-1', status: 'DONE', dueDate: pastDate }, // Completed, not overdue despite past date
    { id: 't2', projectId: 'proj-1', status: 'IN_PROGRESS', dueDate: pastDate }, // Overdue!
    { id: 't3', projectId: 'proj-1', status: 'TODO', dueDate: pastDate }, // Overdue!
    { id: 't4', projectId: 'proj-1', status: 'TODO', dueDate: futureDate }, // Not overdue
    { id: 't5', projectId: 'proj-1', status: 'IN_REVIEW', dueDate: null }, // Not overdue
    { id: 't6', projectId: 'proj-1', status: 'BLOCKED', dueDate: pastDate }, // Overdue!
    { id: 't7', projectId: 'proj-1', status: 'CANCELLED', dueDate: pastDate }, // Cancelled, not overdue
  ];

  const prisma = createMockPrisma({ projectExists: true, tasks: sampleTasks });
  const service = new DashboardOverviewService(prisma);

  const res = await service.getDashboardOverview('proj-1');

  assert.strictEqual(res.tasks.total, 7);
  assert.strictEqual(res.tasks.completed, 1);
  assert.strictEqual(res.tasks.inProgress, 1);
  assert.strictEqual(res.tasks.todo, 2);
  assert.strictEqual(res.tasks.inReview, 1);
  assert.strictEqual(res.tasks.blocked, 1);
  assert.strictEqual(res.tasks.cancelled, 1);
  assert.strictEqual(res.tasks.overdue, 3, 'Only open/in-progress/blocked tasks with past due dates are overdue');

  // Verify internal consistency: sum of all status buckets equals total
  const sumStatuses =
    res.tasks.completed +
    res.tasks.inProgress +
    res.tasks.todo +
    res.tasks.inReview +
    res.tasks.blocked +
    res.tasks.cancelled;
  assert.strictEqual(sumStatuses, res.tasks.total, 'Sum of task statuses must equal totalTasks');
});

test('Dashboard Calculation 3: Aggregates issue distributions by status, priority, and type', async () => {
  const sampleIssues = [
    { id: 'i1', projectId: 'proj-1', status: 'OPEN', priority: 'HIGH', type: 'BUG' },
    { id: 'i2', projectId: 'proj-1', status: 'IN_PROGRESS', priority: 'CRITICAL', type: 'BUG' },
    { id: 'i3', projectId: 'proj-1', status: 'RESOLVED', priority: 'LOW', type: 'FEATURE' },
    { id: 'i4', projectId: 'proj-1', status: 'CLOSED', priority: 'MEDIUM', type: 'TASK' },
    { id: 'i5', projectId: 'proj-1', status: 'REOPENED', priority: 'HIGH', type: 'IMPROVEMENT' },
  ];

  const prisma = createMockPrisma({ projectExists: true, issues: sampleIssues });
  const service = new DashboardOverviewService(prisma);

  const res = await service.getDashboardOverview('proj-1');

  assert.strictEqual(res.issues.total, 5);
  assert.strictEqual(res.issues.open, 1);
  assert.strictEqual(res.issues.inProgress, 1);
  assert.strictEqual(res.issues.resolved, 1);
  assert.strictEqual(res.issues.closed, 1);
  assert.strictEqual(res.issues.reopened, 1);

  assert.strictEqual(res.issues.byPriority.CRITICAL, 1);
  assert.strictEqual(res.issues.byPriority.HIGH, 2);
  assert.strictEqual(res.issues.byPriority.MEDIUM, 1);
  assert.strictEqual(res.issues.byPriority.LOW, 1);

  assert.strictEqual(res.issues.byType.BUG, 2);
  assert.strictEqual(res.issues.byType.FEATURE, 1);
  assert.strictEqual(res.issues.byType.TASK, 1);
  assert.strictEqual(res.issues.byType.IMPROVEMENT, 1);
  assert.strictEqual(res.issues.byType.EPIC, 0);
});

test('Dashboard Calculation 4: Handles active sprint with story points and completion percentage', async () => {
  const sprint = {
    id: 'sprint-active-1',
    projectId: 'proj-1',
    name: 'Sprint 4B.8',
    goal: 'Ship Dashboard & Analytics',
    status: 'ACTIVE',
    startDate: new Date('2026-02-01'),
    endDate: new Date('2026-02-14'),
    capacity: 40,
  };

  const sprintTasks = [
    { id: 't1', projectId: 'proj-1', sprintId: 'sprint-active-1', status: 'DONE', storyPoints: 5 },
    { id: 't2', projectId: 'proj-1', sprintId: 'sprint-active-1', status: 'DONE', storyPoints: 8 },
    { id: 't3', projectId: 'proj-1', sprintId: 'sprint-active-1', status: 'IN_PROGRESS', storyPoints: 3 },
    { id: 't4', projectId: 'proj-1', sprintId: 'sprint-active-1', status: 'TODO', storyPoints: 5 },
  ];

  const prisma = createMockPrisma({
    projectExists: true,
    sprints: [sprint],
    tasks: sprintTasks,
  });
  const service = new DashboardOverviewService(prisma);

  const res = await service.getDashboardOverview('proj-1');

  assert.ok(res.activeSprint !== null);
  assert.strictEqual(res.activeSprint.name, 'Sprint 4B.8');
  assert.strictEqual(res.activeSprint.totalTasks, 4);
  assert.strictEqual(res.activeSprint.completedTasks, 2);
  assert.strictEqual(res.activeSprint.remainingTasks, 2);
  assert.strictEqual(res.activeSprint.completionPercentage, 50); // 2/4 = 50%
  assert.strictEqual(res.activeSprint.plannedStoryPoints, 21); // 5+8+3+5 = 21
  assert.strictEqual(res.activeSprint.completedStoryPoints, 13); // 5+8 = 13
  assert.strictEqual(res.activeSprint.hasMultipleActiveSprints, false);
});

test('Dashboard Calculation 5: Handles project with no active sprint gracefully without error', async () => {
  const prisma = createMockPrisma({
    projectExists: true,
    sprints: [], // Zero active sprints
  });
  const service = new DashboardOverviewService(prisma);

  const res = await service.getDashboardOverview('proj-1');
  assert.strictEqual(res.activeSprint, null, 'Active sprint must be null when none is active');
});

test('Dashboard Calculation 6: Active sprint with 0 tasks avoids division by zero', async () => {
  const sprint = {
    id: 'sprint-empty-1',
    projectId: 'proj-1',
    name: 'Empty Sprint',
    status: 'ACTIVE',
    startDate: new Date('2026-02-01'),
    endDate: new Date('2026-02-14'),
    capacity: 20,
  };

  const prisma = createMockPrisma({
    projectExists: true,
    sprints: [sprint],
    tasks: [], // 0 tasks in sprint
  });
  const service = new DashboardOverviewService(prisma);

  const res = await service.getDashboardOverview('proj-1');
  assert.ok(res.activeSprint !== null);
  assert.strictEqual(res.activeSprint.totalTasks, 0);
  assert.strictEqual(res.activeSprint.completedTasks, 0);
  assert.strictEqual(res.activeSprint.completionPercentage, 0, 'Zero tasks must yield 0% completion');
});

test('Dashboard Calculation 7: Detects and reports multiple active sprints flag', async () => {
  const sprints = [
    {
      id: 'sprint-1',
      projectId: 'proj-1',
      name: 'Sprint 1',
      status: 'ACTIVE',
      startDate: new Date('2026-02-05'),
      endDate: new Date('2026-02-19'),
    },
    {
      id: 'sprint-2',
      projectId: 'proj-1',
      name: 'Sprint 2',
      status: 'ACTIVE',
      startDate: new Date('2026-02-01'),
      endDate: new Date('2026-02-15'),
    },
  ];

  const prisma = createMockPrisma({ projectExists: true, sprints });
  const service = new DashboardOverviewService(prisma);

  const res = await service.getDashboardOverview('proj-1');
  assert.ok(res.activeSprint !== null);
  assert.strictEqual(res.activeSprint.id, 'sprint-1', 'Must pick latest active sprint by startDate');
  assert.strictEqual(res.activeSprint.hasMultipleActiveSprints, true, 'Must flag multiple active sprints');
});

test('Dashboard Controller 8: AnalyticsController getDashboardOverview enforces project authorization', async () => {
  const prisma = createMockPrisma({ projectExists: true, isProjectMember: false, isOrgOwner: false });
  const analyticsService = new AnalyticsService(prisma);
  const overviewService = new DashboardOverviewService(prisma);
  const controller = new AnalyticsController(analyticsService, prisma, overviewService);

  const unauthorizedReq = { user: { id: 'user-attacker' } };

  await assert.rejects(
    async () => controller.getDashboardOverview(unauthorizedReq, 'proj-1'),
    (err: any) => err.status === 403,
    'Non-member request to dashboard overview must be rejected with 403',
  );

  // Authorized project member succeeds
  const authorizedPrisma = createMockPrisma({ projectExists: true, isProjectMember: true });
  const authOverviewService = new DashboardOverviewService(authorizedPrisma);
  const authController = new AnalyticsController(analyticsService, authorizedPrisma, authOverviewService);

  const authorizedReq = { user: { id: 'user-1' } };
  const res = await authController.getDashboardOverview(authorizedReq, 'proj-1');
  assert.ok(res.project);
  assert.strictEqual(res.project.id, 'proj-1');
});
