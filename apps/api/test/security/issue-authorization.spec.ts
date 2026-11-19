import test from 'node:test';
import assert from 'node:assert';
import { IssuesService } from '../../src/issues/issues.service.js';

function createMockPrismaForIssues(authorizedProjectIds: string[]) {
  const issuesStore: any[] = [
    {
      id: 'issue-accessible-1',
      projectId: 'proj-auth-1',
      creatorId: 'user-auth-1',
      reporterId: 'user-auth-1',
      title: 'Accessible Issue',
      type: 'BUG',
      status: 'OPEN',
      priority: 'MEDIUM',
    },
    {
      id: 'issue-foreign-1',
      projectId: 'proj-foreign-1',
      creatorId: 'user-foreign-1',
      reporterId: 'user-foreign-1',
      title: 'Foreign Private Security Bug',
      type: 'SECURITY',
      status: 'OPEN',
      priority: 'CRITICAL',
    },
  ];

  const reposStore: any[] = [
    { id: 'repo-auth-1', projectId: 'proj-auth-1', name: 'auth-repo' },
    { id: 'repo-foreign-1', projectId: 'proj-foreign-1', name: 'foreign-repo' },
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
        const isProjectMember = isAuth && (queryUserId === 'user-auth-1' || queryUserId === 'user-auth-member');
        return {
          id: where.id,
          organizationId: isAuth ? 'org-auth' : 'org-foreign',
          organization: {
            id: isAuth ? 'org-auth' : 'org-foreign',
            ownerId: isAuth ? 'user-auth-1' : 'user-foreign-owner',
          },
          members: isProjectMember ? [{ id: 'pm-auth-1' }] : [],
        };
      },
      findMany: async () => [],
    },
    projectMember: {
      findMany: async () => authorizedProjectIds.map((pId) => ({ projectId: pId })),
    },
    organizationMember: {
      findUnique: async () => null,
    },
    repository: {
      findUnique: async ({ where }: any) => {
        return reposStore.find((r) => r.id === where.id) || null;
      },
    },
    issue: {
      create: async ({ data }: any) => {
        const created = { id: `issue-${Date.now()}`, ...data };
        issuesStore.push(created);
        return created;
      },
      findMany: async ({ where }: any) => {
        if (where?.projectId?.in) {
          return issuesStore.filter((i) => where.projectId.in.includes(i.projectId));
        }
        if (where?.projectId) {
          return issuesStore.filter((i) => i.projectId === where.projectId);
        }
        return issuesStore;
      },
      findUnique: async ({ where }: any) => {
        return issuesStore.find((i) => i.id === where.id) || null;
      },
      update: async ({ where, data }: any) => {
        const issue = issuesStore.find((i) => i.id === where.id);
        if (issue) Object.assign(issue, data);
        return issue;
      },
      delete: async ({ where }: any) => {
        const idx = issuesStore.findIndex((i) => i.id === where.id);
        if (idx >= 0) issuesStore.splice(idx, 1);
        return { id: where.id };
      },
    },
  } as any;
}

test('Issues Service Security - Authorized user can create an issue and creatorId is bound to authenticated user', async () => {
  const prisma = createMockPrismaForIssues(['proj-auth-1']);
  const service = new IssuesService(prisma);

  const issue = await service.create('user-auth-1', {
    projectId: 'proj-auth-1',
    title: 'Valid bug report',
    type: 'BUG' as any,
    status: 'OPEN' as any,
    priority: 'HIGH' as any,
  } as any);

  assert.strictEqual(issue.projectId, 'proj-auth-1');
  assert.strictEqual(issue.creatorId, 'user-auth-1', 'Creator ID must be strictly bound to authenticated user');
  assert.strictEqual(issue.reporterId, 'user-auth-1', 'Reporter ID must default to authenticated user');
});

test('Issues Service Security - User cannot create issue in a project they lack access to (403)', async () => {
  const prisma = createMockPrismaForIssues(['proj-auth-1']);
  const service = new IssuesService(prisma);

  await assert.rejects(
    () =>
      service.create('user-auth-1', {
        projectId: 'proj-foreign-1',
        title: 'Unauthorized issue creation',
        type: 'FEATURE' as any,
        status: 'OPEN' as any,
        priority: 'LOW' as any,
      } as any),
    (err: any) => err.status === 403,
    'Cross-tenant issue creation must be blocked with 403 Forbidden'
  );
});

test('Issues Service Security - Authorized user can view an accessible issue', async () => {
  const prisma = createMockPrismaForIssues(['proj-auth-1']);
  const service = new IssuesService(prisma);

  const issue = await service.findOne('user-auth-1', 'issue-accessible-1');
  assert.strictEqual(issue.id, 'issue-accessible-1');
});

test('Issues Service Security - Unauthorized user cannot read a foreign issue (403)', async () => {
  const prisma = createMockPrismaForIssues(['proj-auth-1']);
  const service = new IssuesService(prisma);

  await assert.rejects(
    () => service.findOne('user-auth-1', 'issue-foreign-1'),
    (err: any) => err.status === 403,
    'Reading foreign issue must be blocked with 403 Forbidden'
  );
});

test('Issues Service Security - Unauthorized user cannot update a foreign issue (403)', async () => {
  const prisma = createMockPrismaForIssues(['proj-auth-1']);
  const service = new IssuesService(prisma);

  await assert.rejects(
    () => service.update('user-auth-1', 'issue-foreign-1', { title: 'Compromised Title' } as any),
    (err: any) => err.status === 403,
    'Updating foreign issue must be blocked with 403 Forbidden'
  );
});

test('Issues Service Security - Unauthorized user cannot delete a foreign issue (403)', async () => {
  const prisma = createMockPrismaForIssues(['proj-auth-1']);
  const service = new IssuesService(prisma);

  await assert.rejects(
    () => service.remove('user-auth-1', 'issue-foreign-1'),
    (err: any) => err.status === 403,
    'Deleting foreign issue must be blocked with 403 Forbidden'
  );
});

test('Issues Service Security - Attaching a repository belonging to another project throws 400', async () => {
  const prisma = createMockPrismaForIssues(['proj-auth-1']);
  const service = new IssuesService(prisma);

  await assert.rejects(
    () =>
      service.create('user-auth-1', {
        projectId: 'proj-auth-1',
        repositoryId: 'repo-foreign-1', // belongs to proj-foreign-1
        title: 'Mismatched repository test',
        type: 'BUG' as any,
        status: 'OPEN' as any,
        priority: 'MEDIUM' as any,
      } as any),
    (err: any) => err.status === 400 && err.message === 'Repository does not belong to this project',
    'Attaching a foreign repository to an issue must be rejected with 400 Bad Request'
  );
});

test('Issues Service Security - findAllByProject for unauthorized project throws 403', async () => {
  const prisma = createMockPrismaForIssues(['proj-auth-1']);
  const service = new IssuesService(prisma);

  await assert.rejects(
    () => service.findAllByProject('user-auth-1', 'proj-foreign-1'),
    (err: any) => err.status === 403,
    'Querying issues of an unauthorized project must throw 403 Forbidden'
  );
});

test('Issues Service Security - Client cannot impersonate another reporter or spoof creatorId', async () => {
  const prisma = createMockPrismaForIssues(['proj-auth-1']);
  const service = new IssuesService(prisma);

  const issue = await service.create('user-auth-1', {
    projectId: 'proj-auth-1',
    title: 'Spoof attempt issue',
    reporterId: 'user-spoofed-reporter', // Client attempts to claim another reporter
    creatorId: 'user-spoofed-creator',   // Client attempts to claim another creator
    type: 'BUG' as any,
  } as any);

  assert.strictEqual(issue.reporterId, 'user-auth-1', 'Reporter ID must strictly come from authenticated user');
  assert.strictEqual(issue.creatorId, 'user-auth-1', 'Creator ID must strictly come from authenticated user');
});

test('Issues Service Security - Valid project member can be assigned on create and update', async () => {
  const prisma = createMockPrismaForIssues(['proj-auth-1']);
  const service = new IssuesService(prisma);

  // 1. Create with valid member
  const created = await service.create('user-auth-1', {
    projectId: 'proj-auth-1',
    title: 'Assigned bug report',
    assigneeId: 'user-auth-member',
    type: 'BUG' as any,
  } as any);

  assert.strictEqual(created.assigneeId, 'user-auth-member');

  // 2. Update with valid member
  const updated = await service.update('user-auth-1', created.id, {
    assigneeId: 'user-auth-1',
  } as any);

  assert.strictEqual(updated.assigneeId, 'user-auth-1');
});

test('Issues Service Security - Nonmember from another project cannot be assigned on create (403)', async () => {
  const prisma = createMockPrismaForIssues(['proj-auth-1']);
  const service = new IssuesService(prisma);

  await assert.rejects(
    () =>
      service.create('user-auth-1', {
        projectId: 'proj-auth-1',
        title: 'Cross-tenant assignment attempt',
        assigneeId: 'user-foreign-1', // Does not belong to proj-auth-1
        type: 'BUG' as any,
      } as any),
    (err: any) => err.status === 403,
    'Assigning user outside project membership must throw 403 Forbidden'
  );
});

test('Issues Service Security - Nonmember from another project cannot be assigned on update (403)', async () => {
  const prisma = createMockPrismaForIssues(['proj-auth-1']);
  const service = new IssuesService(prisma);

  await assert.rejects(
    () =>
      service.update('user-auth-1', 'issue-accessible-1', {
        assigneeId: 'user-foreign-1', // Foreign user
      } as any),
    (err: any) => err.status === 403,
    'Updating issue with foreign assignee must throw 403 Forbidden'
  );
});

test('Issues Service Security - Non-existent assignee throws 404 on create and update', async () => {
  const prisma = createMockPrismaForIssues(['proj-auth-1']);
  const service = new IssuesService(prisma);

  await assert.rejects(
    () =>
      service.create('user-auth-1', {
        projectId: 'proj-auth-1',
        title: 'Ghost assignee',
        assigneeId: 'user-nonexistent',
      } as any),
    (err: any) => err.status === 404,
    'Non-existent assignee must throw 404'
  );

  await assert.rejects(
    () =>
      service.update('user-auth-1', 'issue-accessible-1', {
        assigneeId: 'user-nonexistent',
      } as any),
    (err: any) => err.status === 404,
    'Non-existent assignee on update must throw 404'
  );
});

test('Issues Service Security - Unassignment with null assigneeId is supported', async () => {
  const prisma = createMockPrismaForIssues(['proj-auth-1']);
  const service = new IssuesService(prisma);

  const updated = await service.update('user-auth-1', 'issue-accessible-1', {
    assigneeId: null,
  } as any);

  assert.strictEqual(updated.assigneeId, null, 'Unassignment must set assigneeId to null');
});

