import test from 'node:test';
import assert from 'node:assert';
import bcrypt from 'bcrypt';
import { JwtAuthGuard } from '../../src/auth/guards/jwt-auth.guard.js';

// Controllers & Services
import { UsersController } from '../../src/users/users.controller.js';
import { UsersService } from '../../src/users/users.service.js';
import { DocumentsController } from '../../src/documents/documents.controller.js';
import { DocumentsService } from '../../src/documents/documents.service.js';
import { GithubController } from '../../src/github/github.controller.js';
import { GithubService } from '../../src/github/github.service.js';
import { CommentsController } from '../../src/comments/comments.controller.js';
import { CommentsService } from '../../src/comments/comments.service.js';
import { AnalyticsController } from '../../src/analytics/analytics.controller.js';
import { AnalyticsService } from '../../src/analytics/analytics.service.js';
import { AIController } from '../../src/ai/ai.controller.js';

function createMockPrisma(options: {
  authorizedProjectIds?: string[];
  userId?: string;
  foreignUserId?: string;
} = {}) {
  const {
    authorizedProjectIds = ['proj-auth-1'],
    userId = 'user-auth-1',
    foreignUserId = 'user-foreign-1',
  } = options;

  const usersStore: any[] = [
    {
      id: userId,
      email: 'auth@example.com',
      username: 'authuser',
      firstName: 'Auth',
      lastName: 'User',
      passwordHash: '$2b$10$hashedpassworduser1',
      status: 'ACTIVE',
      role: 'DEVELOPER',
      avatarUrl: null,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    },
    {
      id: foreignUserId,
      email: 'foreign@example.com',
      username: 'foreignuser',
      firstName: 'Foreign',
      lastName: 'User',
      passwordHash: '$2b$10$hashedpassworduser2',
      status: 'ACTIVE',
      role: 'DEVELOPER',
      avatarUrl: null,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    },
  ];

  const documentsStore: any[] = [
    {
      id: 'doc-auth-1',
      projectId: 'proj-auth-1',
      repositoryId: 'repo-auth-1',
      title: 'Auth Project Architecture',
      path: 'docs/arch.md',
      content: 'Secret auth content',
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    },
    {
      id: 'doc-foreign-1',
      projectId: 'proj-foreign-1',
      repositoryId: 'repo-foreign-1',
      title: 'Foreign Project Architecture',
      path: 'docs/arch.md',
      content: 'Confidential foreign content',
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    },
  ];

  const chunksStore: any[] = [
    {
      id: 'chunk-auth-1',
      documentId: 'doc-auth-1',
      chunkIndex: 0,
      content: 'Auth doc chunk',
    },
    {
      id: 'chunk-foreign-1',
      documentId: 'doc-foreign-1',
      chunkIndex: 0,
      content: 'Foreign doc chunk',
    },
  ];

  const githubAccountsStore: any[] = [
    {
      id: 'gh-auth-1',
      userId: userId,
      githubUserId: 11111,
      username: 'authuser',
      displayName: 'Auth User GH',
      profileUrl: 'https://github.com/authuser',
      avatarUrl: null,
      accessToken: 'ghp_secret_access_token_1',
      refreshToken: 'ghr_secret_refresh_token_1',
      tokenExpiresAt: null,
      scopes: ['repo', 'user'],
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    },
    {
      id: 'gh-foreign-1',
      userId: foreignUserId,
      githubUserId: 22222,
      username: 'foreignuser',
      displayName: 'Foreign User GH',
      profileUrl: 'https://github.com/foreignuser',
      avatarUrl: null,
      accessToken: 'ghp_secret_foreign_token_2',
      refreshToken: 'ghr_secret_foreign_token_2',
      tokenExpiresAt: null,
      scopes: ['repo', 'user'],
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    },
  ];

  const commentsStore: any[] = [
    {
      id: 'comment-auth-1',
      projectId: 'proj-auth-1',
      taskId: 'task-1',
      issueId: null,
      pullRequestId: null,
      authorId: userId,
      content: 'Auth comment content',
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    },
    {
      id: 'comment-foreign-1',
      projectId: 'proj-foreign-1',
      taskId: null,
      issueId: 'issue-foreign-1',
      pullRequestId: null,
      authorId: foreignUserId,
      content: 'Foreign comment content',
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    },
  ];

  const analyticsStore: any[] = [
    {
      id: 'analytics-auth-1',
      projectId: 'proj-auth-1',
      date: new Date('2026-01-01'),
      completedTasks: 5,
      openedIssues: 2,
      resolvedIssues: 3,
      commits: 12,
      pullRequests: 4,
      mergedPullRequests: 3,
      activeDevelopers: 2,
      deploymentCount: 1,
      averageCycleTime: 3.5,
      velocity: 15,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    },
    {
      id: 'analytics-foreign-1',
      projectId: 'proj-foreign-1',
      date: new Date('2026-01-01'),
      completedTasks: 20,
      openedIssues: 10,
      resolvedIssues: 8,
      commits: 50,
      pullRequests: 10,
      mergedPullRequests: 8,
      activeDevelopers: 5,
      deploymentCount: 4,
      averageCycleTime: 2.1,
      velocity: 45,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    },
  ];

  const mockPrisma: any = {
    user: {
      findUnique: async ({ where, select }: any) => {
        const u = usersStore.find((x) => (where.id && x.id === where.id) || (where.email && x.email === where.email) || (where.username && x.username === where.username));
        if (!u) return null;
        if (select) {
          const res: any = {};
          for (const key of Object.keys(select)) {
            if (select[key]) res[key] = u[key];
          }
          return res;
        }
        return { ...u };
      },
      findMany: async ({ select }: any) => {
        return usersStore.map((u) => {
          if (select) {
            const res: any = {};
            for (const key of Object.keys(select)) {
              if (select[key]) res[key] = u[key];
            }
            return res;
          }
          return { ...u };
        });
      },
      create: async ({ data, select }: any) => {
        const newU = { id: `user-${Date.now()}`, ...data, createdAt: new Date(), updatedAt: new Date() };
        usersStore.push(newU);
        if (select) {
          const res: any = {};
          for (const key of Object.keys(select)) {
            if (select[key]) res[key] = newU[key];
          }
          return res;
        }
        return newU;
      },
      update: async ({ where, data, select }: any) => {
        const idx = usersStore.findIndex((x) => x.id === where.id);
        if (idx === -1) throw new Error('User not found');
        usersStore[idx] = { ...usersStore[idx], ...data, updatedAt: new Date() };
        const updated = usersStore[idx];
        if (select) {
          const res: any = {};
          for (const key of Object.keys(select)) {
            if (select[key]) res[key] = updated[key];
          }
          return res;
        }
        return updated;
      },
      delete: async ({ where }: any) => {
        const idx = usersStore.findIndex((x) => x.id === where.id);
        if (idx === -1) throw new Error('User not found');
        const [del] = usersStore.splice(idx, 1);
        return del;
      },
    },

    project: {
      findUnique: async ({ where }: any) => {
        if (!where.id) return null;
        const isAuth = authorizedProjectIds.includes(where.id);
        return {
          id: where.id,
          organizationId: isAuth ? 'org-auth' : 'org-foreign',
          organization: {
            id: isAuth ? 'org-auth' : 'org-foreign',
            ownerId: isAuth ? userId : foreignUserId,
          },
          members: isAuth ? [{ id: 'pm-1', userId }] : [],
        };
      },
      findMany: async () => [],
    },

    projectMember: {
      findMany: async ({ where }: any) => {
        if (where.userId === userId) {
          return authorizedProjectIds.map((projectId) => ({ projectId }));
        }
        return [];
      },
    },

    organizationMember: {
      findUnique: async () => null,
      findMany: async () => [],
    },

    document: {
      create: async ({ data }: any) => {
        const created = { id: `doc-${Date.now()}`, ...data, createdAt: new Date(), updatedAt: new Date() };
        documentsStore.push(created);
        return created;
      },
      findMany: async ({ where }: any) => {
        return documentsStore.filter((d) => {
          if (where?.projectId?.in) {
            return where.projectId.in.includes(d.projectId);
          }
          if (where?.projectId) {
            return d.projectId === where.projectId;
          }
          return true;
        });
      },
      findUnique: async ({ where, include, select }: any) => {
        const doc = documentsStore.find((d) => d.id === where.id);
        if (!doc) return null;
        if (select) {
          const res: any = {};
          for (const key of Object.keys(select)) {
            if (select[key]) res[key] = doc[key];
          }
          return res;
        }
        const chunks = chunksStore.filter((c) => c.documentId === doc.id);
        return { ...doc, chunks: include?.chunks ? chunks : undefined };
      },
      update: async ({ where, data }: any) => {
        const idx = documentsStore.findIndex((d) => d.id === where.id);
        if (idx === -1) throw new Error('Document not found');
        documentsStore[idx] = { ...documentsStore[idx], ...data, updatedAt: new Date() };
        return documentsStore[idx];
      },
      delete: async ({ where }: any) => {
        const idx = documentsStore.findIndex((d) => d.id === where.id);
        if (idx === -1) throw new Error('Document not found');
        const [del] = documentsStore.splice(idx, 1);
        return del;
      },
    },

    documentChunk: {
      create: async ({ data }: any) => {
        const chunk = { id: `chunk-${Date.now()}`, ...data };
        chunksStore.push(chunk);
        return chunk;
      },
      findMany: async ({ where }: any) => {
        return chunksStore.filter((c) => c.documentId === where.documentId);
      },
      findUnique: async ({ where, include }: any) => {
        const c = chunksStore.find((chunk) => chunk.id === where.id);
        if (!c) return null;
        const doc = documentsStore.find((d) => d.id === c.documentId);
        return {
          ...c,
          document: include?.document ? doc : undefined,
        };
      },
      delete: async ({ where }: any) => {
        const idx = chunksStore.findIndex((c) => c.id === where.id);
        if (idx === -1) throw new Error('Chunk not found');
        const [del] = chunksStore.splice(idx, 1);
        return del;
      },
    },

    gitHubAccount: {
      upsert: async ({ where, update, create, select }: any) => {
        const idx = githubAccountsStore.findIndex((g) => g.userId === where.userId);
        if (idx !== -1) {
          githubAccountsStore[idx] = { ...githubAccountsStore[idx], ...update, updatedAt: new Date() };
          const updated = githubAccountsStore[idx];
          if (select) {
            const res: any = {};
            for (const key of Object.keys(select)) {
              if (select[key]) res[key] = updated[key];
            }
            return res;
          }
          return updated;
        }
        const created = { id: `gh-${Date.now()}`, ...create, createdAt: new Date(), updatedAt: new Date() };
        githubAccountsStore.push(created);
        if (select) {
          const res: any = {};
          for (const key of Object.keys(select)) {
            if (select[key]) res[key] = created[key];
          }
          return res;
        }
        return created;
      },
      create: async ({ data, select }: any) => {
        const acc = { id: `gh-${Date.now()}`, ...data, createdAt: new Date(), updatedAt: new Date() };
        githubAccountsStore.push(acc);
        if (select) {
          const res: any = {};
          for (const key of Object.keys(select)) {
            if (select[key]) res[key] = acc[key];
          }
          return res;
        }
        return acc;
      },
      findMany: async ({ where, select }: any) => {
        const list = githubAccountsStore.filter((g) => {
          if (where?.userId) return g.userId === where.userId;
          return true;
        });
        return list.map((g) => {
          if (select) {
            const res: any = {};
            for (const key of Object.keys(select)) {
              if (select[key]) res[key] = g[key];
            }
            return res;
          }
          return g;
        });
      },
      findUnique: async ({ where, select }: any) => {
        const acc = githubAccountsStore.find((g) => {
          if (where.id) return g.id === where.id;
          if (where.userId) return g.userId === where.userId;
          if (where.githubUserId) return g.githubUserId === where.githubUserId;
          return false;
        });
        if (!acc) return null;
        if (select) {
          const res: any = {};
          for (const key of Object.keys(select)) {
            if (select[key]) res[key] = acc[key];
          }
          return res;
        }
        return acc;
      },
      update: async ({ where, data, select }: any) => {
        const idx = githubAccountsStore.findIndex((g) => g.id === where.id || g.userId === where.userId);
        if (idx === -1) throw new Error('Account not found');
        githubAccountsStore[idx] = { ...githubAccountsStore[idx], ...data, updatedAt: new Date() };
        const updated = githubAccountsStore[idx];
        if (select) {
          const res: any = {};
          for (const key of Object.keys(select)) {
            if (select[key]) res[key] = updated[key];
          }
          return res;
        }
        return updated;
      },
      delete: async ({ where }: any) => {
        const idx = githubAccountsStore.findIndex((g) => (where.id && g.id === where.id) || (where.userId && g.userId === where.userId));
        if (idx === -1) throw new Error('Account not found');
        const [del] = githubAccountsStore.splice(idx, 1);
        return del;
      },
    },

    comment: {
      create: async ({ data, include }: any) => {
        const comm = { id: `comment-${Date.now()}`, ...data, createdAt: new Date(), updatedAt: new Date() };
        commentsStore.push(comm);
        const author = usersStore.find((u) => u.id === comm.authorId);
        return {
          ...comm,
          author: include?.author ? { id: author?.id, email: author?.email, name: author?.username } : undefined,
        };
      },
      findMany: async ({ where, include }: any) => {
        return commentsStore
          .filter((c) => c.projectId === where.projectId)
          .map((c) => {
            const author = usersStore.find((u) => u.id === c.authorId);
            return {
              ...c,
              author: include?.author ? { id: author?.id, email: author?.email, name: author?.username } : undefined,
            };
          });
      },
      findUnique: async ({ where, include }: any) => {
        const comm = commentsStore.find((c) => c.id === where.id);
        if (!comm) return null;
        const author = usersStore.find((u) => u.id === comm.authorId);
        return {
          ...comm,
          author: include?.author ? { id: author?.id, email: author?.email, name: author?.username } : undefined,
        };
      },
      update: async ({ where, data, include }: any) => {
        const idx = commentsStore.findIndex((c) => c.id === where.id);
        if (idx === -1) throw new Error('Comment not found');
        commentsStore[idx] = { ...commentsStore[idx], ...data, updatedAt: new Date() };
        const comm = commentsStore[idx];
        const author = usersStore.find((u) => u.id === comm.authorId);
        return {
          ...comm,
          author: include?.author ? { id: author?.id, email: author?.email, name: author?.username } : undefined,
        };
      },
      delete: async ({ where }: any) => {
        const idx = commentsStore.findIndex((c) => c.id === where.id);
        if (idx === -1) throw new Error('Comment not found');
        const [del] = commentsStore.splice(idx, 1);
        return del;
      },
    },

    task: {
      findUnique: async ({ where }: any) => {
        if (where.id === 'task-1') return { id: 'task-1', projectId: 'proj-auth-1' };
        return null;
      },
    },

    issue: {
      findUnique: async ({ where }: any) => {
        if (where.id === 'issue-foreign-1') return { id: 'issue-foreign-1', projectId: 'proj-foreign-1' };
        return null;
      },
    },

    pullRequest: {
      findUnique: async ({ where }: any) => {
        if (where.id === 'pr-1') return { id: 'pr-1', projectId: 'proj-auth-1' };
        return null;
      },
    },

    projectAnalytics: {
      upsert: async ({ where, update, create }: any) => {
        const idx = analyticsStore.findIndex(
          (a) => a.projectId === where.projectId_date.projectId,
        );
        if (idx !== -1) {
          analyticsStore[idx] = { ...analyticsStore[idx], ...update, updatedAt: new Date() };
          return analyticsStore[idx];
        }
        const created = { id: `analytics-${Date.now()}`, ...create, createdAt: new Date(), updatedAt: new Date() };
        analyticsStore.push(created);
        return created;
      },
      findMany: async ({ where }: any) => {
        return analyticsStore.filter((a) => {
          if (where?.projectId?.in) return where.projectId.in.includes(a.projectId);
          if (where?.projectId) return a.projectId === where.projectId;
          return true;
        });
      },
      findFirst: async ({ where }: any) => {
        return analyticsStore.find((a) => a.projectId === where.projectId) || null;
      },
      findUnique: async ({ where }: any) => {
        return analyticsStore.find((a) => a.id === where.id) || null;
      },
      delete: async ({ where }: any) => {
        const idx = analyticsStore.findIndex((a) => a.id === where.id);
        if (idx === -1) throw new Error('Record not found');
        const [del] = analyticsStore.splice(idx, 1);
        return del;
      },
    },
  };

  return {
    prisma: mockPrisma,
    usersStore,
    documentsStore,
    chunksStore,
    githubAccountsStore,
    commentsStore,
    analyticsStore,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUITE 1: UsersController & UsersService Security
// ═══════════════════════════════════════════════════════════════════════════════

test('Users Security - UsersController has JwtAuthGuard', () => {
  const guards = Reflect.getMetadata('__guards__', UsersController);
  assert.ok(Array.isArray(guards), 'UsersController must have guards applied');
  assert.ok(guards.includes(JwtAuthGuard), 'UsersController must use JwtAuthGuard');
});

test('Users Security - UsersService never selects passwordHash in queries', async () => {
  const { prisma } = createMockPrisma();
  const service = new UsersService(prisma);

  const allUsers = await service.findAll();
  for (const u of allUsers) {
    assert.strictEqual((u as any).passwordHash, undefined, 'findAll must not return passwordHash');
  }

  const singleUser = await service.findOne('user-auth-1');
  assert.strictEqual((singleUser as any).passwordHash, undefined, 'findOne must not return passwordHash');
});

test('Users Security - UsersService hashes plaintext password with bcrypt on create', async () => {
  const { prisma, usersStore } = createMockPrisma();
  const service = new UsersService(prisma);

  const newUser = await service.create({
    email: 'newuser@example.com',
    username: 'newuser',
    password: 'SuperSecretPassword123!',
  });

  assert.strictEqual((newUser as any).passwordHash, undefined, 'Returned user object must omit passwordHash');
  const stored = usersStore.find((u) => u.email === 'newuser@example.com');
  assert.ok(stored, 'User must be created');
  assert.notStrictEqual(stored.passwordHash, 'SuperSecretPassword123!', 'Password must be hashed, not plaintext');
  const isMatch = await bcrypt.compare('SuperSecretPassword123!', stored.passwordHash);
  assert.strictEqual(isMatch, true, 'Stored hash must match plaintext password via bcrypt.compare');
});

test('Users Security - UsersService hashes updated password on update', async () => {
  const { prisma, usersStore } = createMockPrisma();
  const service = new UsersService(prisma);

  await service.update('user-auth-1', {
    password: 'NewChangedPassword456!',
  });

  const stored = usersStore.find((u) => u.id === 'user-auth-1');
  assert.notStrictEqual(stored.passwordHash, 'NewChangedPassword456!');
  const isMatch = await bcrypt.compare('NewChangedPassword456!', stored.passwordHash);
  assert.strictEqual(isMatch, true, 'Updated hash must match new password via bcrypt.compare');
});

test('Users Security - UsersController rejects unauthenticated requests', async () => {
  const { prisma } = createMockPrisma();
  const service = new UsersService(prisma);
  const controller = new UsersController(service);

  await assert.rejects(
    async () => controller.update({ user: undefined }, 'user-auth-1', { firstName: 'Hacked' }),
    { status: 401 },
  );

  await assert.rejects(
    async () => controller.remove({ user: undefined }, 'user-auth-1'),
    { status: 401 },
  );
});

test('Users Security - IDOR Prevention: User A cannot update User B profile', async () => {
  const { prisma } = createMockPrisma();
  const service = new UsersService(prisma);
  const controller = new UsersController(service);

  const reqUserA = { user: { userId: 'user-auth-1' } };
  await assert.rejects(
    async () => controller.update(reqUserA, 'user-foreign-1', { firstName: 'Attempted Spoof' }),
    { status: 403 },
  );
});

test('Users Security - IDOR Prevention: User A cannot delete User B profile', async () => {
  const { prisma } = createMockPrisma();
  const service = new UsersService(prisma);
  const controller = new UsersController(service);

  const reqUserA = { user: { userId: 'user-auth-1' } };
  await assert.rejects(
    async () => controller.remove(reqUserA, 'user-foreign-1'),
    { status: 403 },
  );
});

test('Users Security - User A CAN update and delete their own profile', async () => {
  const { prisma, usersStore } = createMockPrisma();
  const service = new UsersService(prisma);
  const controller = new UsersController(service);

  const reqUserA = { user: { userId: 'user-auth-1' } };
  const updated = await controller.update(reqUserA, 'user-auth-1', { firstName: 'SelfUpdated' });
  assert.strictEqual(updated.firstName, 'SelfUpdated');

  await controller.remove(reqUserA, 'user-auth-1');
  const found = usersStore.find((u) => u.id === 'user-auth-1');
  assert.strictEqual(found, undefined, 'User must be deleted');
});

// ═══════════════════════════════════════════════════════════════════════════════
// SUITE 2: DocumentsController & DocumentsService Security
// ═══════════════════════════════════════════════════════════════════════════════

test('Documents Security - DocumentsController has JwtAuthGuard', () => {
  const guards = Reflect.getMetadata('__guards__', DocumentsController);
  assert.ok(Array.isArray(guards));
  assert.ok(guards.includes(JwtAuthGuard));
});

test('Documents Security - Unauthenticated requests are rejected', async () => {
  const { prisma } = createMockPrisma();
  const service = new DocumentsService(prisma);
  const controller = new DocumentsController(service, prisma);

  await assert.rejects(
    async () => controller.findAll({ user: undefined }),
    { status: 401 },
  );
});

test('Documents Security - Cross-project document creation is rejected with 403/404', async () => {
  const { prisma } = createMockPrisma({ authorizedProjectIds: ['proj-auth-1'] });
  const service = new DocumentsService(prisma);
  const controller = new DocumentsController(service, prisma);

  const req = { user: { userId: 'user-auth-1' } };
  await assert.rejects(
    async () => controller.create(req, {
      projectId: 'proj-foreign-1',
      sourceType: 'DOCUMENT' as any,
      title: 'Infiltrated Doc',
      content: 'evil',
    }),
    (err: any) => err.status === 403 || err.status === 404,
  );
});

test('Documents Security - Authorized project document creation succeeds', async () => {
  const { prisma } = createMockPrisma({ authorizedProjectIds: ['proj-auth-1'] });
  const service = new DocumentsService(prisma);
  const controller = new DocumentsController(service, prisma);

  const req = { user: { userId: 'user-auth-1' } };
  const doc = await controller.create(req, {
    projectId: 'proj-auth-1',
    sourceType: 'DOCUMENT' as any,
    title: 'Valid Document',
    content: 'valid content',
  });
  assert.strictEqual(doc.title, 'Valid Document');
});

test('Documents Security - Cross-project document retrieval is rejected', async () => {
  const { prisma } = createMockPrisma({ authorizedProjectIds: ['proj-auth-1'] });
  const service = new DocumentsService(prisma);
  const controller = new DocumentsController(service, prisma);

  const req = { user: { userId: 'user-auth-1' } };

  await assert.rejects(
    async () => controller.findOne(req, 'doc-foreign-1'),
    (err: any) => err.status === 403 || err.status === 404,
  );

  await assert.rejects(
    async () => controller.update(req, 'doc-foreign-1', { title: 'Hacked' }),
    (err: any) => err.status === 403 || err.status === 404,
  );

  await assert.rejects(
    async () => controller.remove(req, 'doc-foreign-1'),
    (err: any) => err.status === 403 || err.status === 404,
  );
});

test('Documents Security - findAll without projectId returns only authorized documents', async () => {
  const { prisma } = createMockPrisma({ authorizedProjectIds: ['proj-auth-1'] });
  const service = new DocumentsService(prisma);
  const controller = new DocumentsController(service, prisma);

  const req = { user: { userId: 'user-auth-1' } };
  const docs = await controller.findAll(req);
  assert.strictEqual(docs.length, 1);
  assert.strictEqual(docs[0].id, 'doc-auth-1');
});

test('Documents Security - Chunk operations are scoped to document parent project', async () => {
  const { prisma } = createMockPrisma({ authorizedProjectIds: ['proj-auth-1'] });
  const service = new DocumentsService(prisma);
  const controller = new DocumentsController(service, prisma);

  const req = { user: { userId: 'user-auth-1' } };

  await assert.rejects(
    async () => controller.createChunk(req, 'doc-foreign-1', { documentId: 'doc-foreign-1', chunkIndex: 1, content: 'evil' }),
    (err: any) => err.status === 403 || err.status === 404,
  );

  await assert.rejects(
    async () => controller.getChunks(req, 'doc-foreign-1'),
    (err: any) => err.status === 403 || err.status === 404,
  );

  await assert.rejects(
    async () => controller.deleteChunk(req, 'chunk-foreign-1'),
    (err: any) => err.status === 403 || err.status === 404,
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// SUITE 3: GithubController & GithubService Security
// ═══════════════════════════════════════════════════════════════════════════════

test('GitHub Security - GithubController has JwtAuthGuard', () => {
  const guards = Reflect.getMetadata('__guards__', GithubController);
  assert.ok(Array.isArray(guards));
  assert.ok(guards.includes(JwtAuthGuard));
});

test('GitHub Security - Identity Spoofing Prevention in connect()', async () => {
  const { prisma } = createMockPrisma();
  const service = new GithubService(prisma);
  const mockSyncService: any = { syncAccount: async () => ({ success: true }) };
  const controller = new GithubController(service, mockSyncService);

  const req = { user: { userId: 'user-auth-1' } };
  const connected = await controller.connect(req, {
    userId: 'user-foreign-1',
    githubUserId: '99999',
    username: 'spoofed_user',
    accessToken: 'ghp_spoofed',
  });

  assert.strictEqual(connected.userId, 'user-auth-1', 'Controller must enforce authUserId regardless of body');
});

test('GitHub Security - Tokens (accessToken, refreshToken) are never returned', async () => {
  const { prisma } = createMockPrisma();
  const service = new GithubService(prisma);

  const accounts = await service.findAll();
  for (const acc of accounts) {
    assert.strictEqual((acc as any).accessToken, undefined, 'accessToken must be excluded');
    assert.strictEqual((acc as any).refreshToken, undefined, 'refreshToken must be excluded');
  }

  const single = await service.findByUserId('user-auth-1');
  assert.strictEqual((single as any).accessToken, undefined);
  assert.strictEqual((single as any).refreshToken, undefined);
});

test('GitHub Security - IDOR Prevention: User A cannot access or manage User B GitHub account', async () => {
  const { prisma } = createMockPrisma();
  const service = new GithubService(prisma);
  const mockSyncService: any = { syncAccount: async () => ({ success: true }) };
  const controller = new GithubController(service, mockSyncService);

  const reqUserA = { user: { userId: 'user-auth-1' } };

  await assert.rejects(
    async () => controller.findByUserId(reqUserA, 'user-foreign-1'),
    { status: 403 },
  );

  await assert.rejects(
    async () => controller.sync(reqUserA, 'user-foreign-1'),
    { status: 403 },
  );

  await assert.rejects(
    async () => controller.disconnect(reqUserA, 'user-foreign-1'),
    { status: 403 },
  );
});

test('GitHub Security - User A CAN manage their own GitHub account', async () => {
  const { prisma, githubAccountsStore } = createMockPrisma();
  const service = new GithubService(prisma);
  const mockSyncService: any = { syncAccount: async () => ({ success: true }) };
  const controller = new GithubController(service, mockSyncService);

  const reqUserA = { user: { userId: 'user-auth-1' } };

  const own = await controller.findByUserId(reqUserA, 'user-auth-1');
  assert.strictEqual(own.id, 'gh-auth-1');

  await controller.disconnect(reqUserA, 'user-auth-1');
  const found = githubAccountsStore.find((g) => g.userId === 'user-auth-1');
  assert.strictEqual(found, undefined, 'Own account disconnected');
});

// ═══════════════════════════════════════════════════════════════════════════════
// SUITE 4: CommentsController & CommentsService Security
// ═══════════════════════════════════════════════════════════════════════════════

test('Comments Security - CommentsController has JwtAuthGuard', () => {
  const guards = Reflect.getMetadata('__guards__', CommentsController);
  assert.ok(Array.isArray(guards));
  assert.ok(guards.includes(JwtAuthGuard));
});

test('Comments Security - Author spoofing prevention on create()', async () => {
  const { prisma } = createMockPrisma({ authorizedProjectIds: ['proj-auth-1'] });
  const service = new CommentsService(prisma);
  const controller = new CommentsController(service, prisma);

  const req = { user: { userId: 'user-auth-1' } };
  const created = await controller.create(req, {
    projectId: 'proj-auth-1',
    authorId: 'user-foreign-1',
    content: 'Spoofed comment',
  });

  assert.strictEqual(created.authorId, 'user-auth-1', 'authorId must match authenticated user');
});

test('Comments Security - Cross-project comment creation is rejected', async () => {
  const { prisma } = createMockPrisma({ authorizedProjectIds: ['proj-auth-1'] });
  const service = new CommentsService(prisma);
  const controller = new CommentsController(service, prisma);

  const req = { user: { userId: 'user-auth-1' } };
  await assert.rejects(
    async () => controller.create(req, {
      projectId: 'proj-foreign-1',
      content: 'Unauthorized comment',
    }),
    (err: any) => err.status === 403 || err.status === 404,
  );
});

test('Comments Security - Cross-project comment retrieval is rejected', async () => {
  const { prisma } = createMockPrisma({ authorizedProjectIds: ['proj-auth-1'] });
  const service = new CommentsService(prisma);
  const controller = new CommentsController(service, prisma);

  const req = { user: { userId: 'user-auth-1' } };

  await assert.rejects(
    async () => controller.findAll(req, 'proj-foreign-1'),
    (err: any) => err.status === 403 || err.status === 404,
  );

  await assert.rejects(
    async () => controller.findOne(req, 'comment-foreign-1'),
    (err: any) => err.status === 403 || err.status === 404,
  );
});

test('Comments Security - Only author can edit or delete comment', async () => {
  const { prisma } = createMockPrisma({ authorizedProjectIds: ['proj-auth-1'] });
  const service = new CommentsService(prisma);
  const controller = new CommentsController(service, prisma);

  const reqUserB = { user: { userId: 'user-foreign-1' } };
  await assert.rejects(
    async () => controller.update(reqUserB, 'comment-auth-1', { content: 'Tampered' }),
    (err: any) => err.status === 403,
  );

  await assert.rejects(
    async () => controller.remove(reqUserB, 'comment-auth-1'),
    (err: any) => err.status === 403,
  );
});

test('Comments Security - Author CAN update and delete their own comment', async () => {
  const { prisma, commentsStore } = createMockPrisma({ authorizedProjectIds: ['proj-auth-1'] });
  const service = new CommentsService(prisma);
  const controller = new CommentsController(service, prisma);

  const reqUserA = { user: { userId: 'user-auth-1' } };
  const updated = await controller.update(reqUserA, 'comment-auth-1', { content: 'Legit update' });
  assert.strictEqual(updated.content, 'Legit update');

  await controller.remove(reqUserA, 'comment-auth-1');
  const found = commentsStore.find((c) => c.id === 'comment-auth-1');
  assert.strictEqual(found, undefined, 'Comment must be removed');
});

// ═══════════════════════════════════════════════════════════════════════════════
// SUITE 5: AnalyticsController & AnalyticsService Security
// ═══════════════════════════════════════════════════════════════════════════════

test('Analytics Security - AnalyticsController has JwtAuthGuard', () => {
  const guards = Reflect.getMetadata('__guards__', AnalyticsController);
  assert.ok(Array.isArray(guards));
  assert.ok(guards.includes(JwtAuthGuard));
});

test('Analytics Security - Unauthenticated requests are rejected', async () => {
  const { prisma } = createMockPrisma();
  const service = new AnalyticsService(prisma);
  const controller = new AnalyticsController(service, prisma);

  await assert.rejects(
    async () => controller.findAll({ user: undefined }),
    { status: 401 },
  );
});

test('Analytics Security - Cross-project analytics creation is rejected', async () => {
  const { prisma } = createMockPrisma({ authorizedProjectIds: ['proj-auth-1'] });
  const service = new AnalyticsService(prisma);
  const controller = new AnalyticsController(service, prisma);

  const req = { user: { userId: 'user-auth-1' } };
  await assert.rejects(
    async () => controller.create(req, {
      projectId: 'proj-foreign-1',
      date: '2026-01-01',
      completedTasks: 1,
    }),
    (err: any) => err.status === 403 || err.status === 404,
  );
});

test('Analytics Security - Cross-project analytics access endpoints are rejected', async () => {
  const { prisma } = createMockPrisma({ authorizedProjectIds: ['proj-auth-1'] });
  const service = new AnalyticsService(prisma);
  const controller = new AnalyticsController(service, prisma);

  const req = { user: { userId: 'user-auth-1' } };

  await assert.rejects(
    async () => controller.findByProject(req, 'proj-foreign-1'),
    (err: any) => err.status === 403 || err.status === 404,
  );

  await assert.rejects(
    async () => controller.getLatest(req, 'proj-foreign-1'),
    (err: any) => err.status === 403 || err.status === 404,
  );

  await assert.rejects(
    async () => controller.getSummary(req, 'proj-foreign-1'),
    (err: any) => err.status === 403 || err.status === 404,
  );

  await assert.rejects(
    async () => controller.findById(req, 'analytics-foreign-1'),
    (err: any) => err.status === 403 || err.status === 404,
  );

  await assert.rejects(
    async () => controller.remove(req, 'analytics-foreign-1'),
    (err: any) => err.status === 403 || err.status === 404,
  );
});

test('Analytics Security - Authorized project analytics queries succeed', async () => {
  const { prisma } = createMockPrisma({ authorizedProjectIds: ['proj-auth-1'] });
  const service = new AnalyticsService(prisma);
  const controller = new AnalyticsController(service, prisma);

  const req = { user: { userId: 'user-auth-1' } };

  const byProj = await controller.findByProject(req, 'proj-auth-1');
  assert.strictEqual(byProj.length, 1);

  const latest = await controller.getLatest(req, 'proj-auth-1');
  assert.strictEqual(latest?.id, 'analytics-auth-1');

  const summary = await controller.getSummary(req, 'proj-auth-1');
  assert.strictEqual(summary.projectId, 'proj-auth-1');
  assert.strictEqual(summary.totalRecords, 1);
});

test('Analytics Security - findAll without projectId returns only authorized analytics', async () => {
  const { prisma } = createMockPrisma({ authorizedProjectIds: ['proj-auth-1'] });
  const service = new AnalyticsService(prisma);
  const controller = new AnalyticsController(service, prisma);

  const req = { user: { userId: 'user-auth-1' } };
  const records = await controller.findAll(req);
  assert.strictEqual(records.length, 1);
  assert.strictEqual(records[0].id, 'analytics-auth-1');
});

// ═══════════════════════════════════════════════════════════════════════════════
// SUITE 6: Orphaned Conversations Decommissioning & AIController Verification
// ═══════════════════════════════════════════════════════════════════════════════

test('Conversations Decommissioning - Active AIController getConversations is secured with JwtAuthGuard', () => {
  const guards = Reflect.getMetadata('__guards__', AIController.prototype.getConversations);
  assert.ok(Array.isArray(guards));
  assert.ok(guards.includes(JwtAuthGuard), 'AIController.getConversations must be guarded');
});
