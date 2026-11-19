import test from 'node:test';
import assert from 'node:assert';
import crypto from 'node:crypto';
import bcrypt from 'bcrypt';

import { JwtAuthGuard } from '../../src/auth/guards/jwt-auth.guard.js';
import { GithubSignatureGuard } from '../../src/github/guards/github-signature.guard.js';
import { GithubWebhookController } from '../../src/github/github-webhook.controller.js';
import { GithubWebhookService } from '../../src/github/github-webhook.service.js';
import { UsersController } from '../../src/users/users.controller.js';
import { UsersService } from '../../src/users/users.service.js';
import { AuthController } from '../../src/auth/auth.controller.js';
import { AuthService } from '../../src/auth/auth.service.js';

function createMockPrismaForTargeted() {
  const usersStore: any[] = [
    {
      id: 'user-admin-1',
      email: 'admin@org-alpha.com',
      username: 'admin_alpha',
      firstName: 'Alpha',
      lastName: 'Admin',
      passwordHash: '$2b$12$eX4mP1eH4sHeD1234567890123456789012345678901234567890',
      status: 'ACTIVE',
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    },
    {
      id: 'user-member-alpha',
      email: 'member@org-alpha.com',
      username: 'member_alpha',
      firstName: 'Alpha',
      lastName: 'Member',
      passwordHash: '$2b$12$eX4mP1eH4sHeD1234567890123456789012345678901234567890',
      status: 'ACTIVE',
      createdAt: new Date('2026-01-02'),
      updatedAt: new Date('2026-01-02'),
    },
    {
      id: 'user-member-beta',
      email: 'member@org-beta.com',
      username: 'member_beta',
      firstName: 'Beta',
      lastName: 'Member',
      passwordHash: '$2b$12$eX4mP1eH4sHeD1234567890123456789012345678901234567890',
      status: 'ACTIVE',
      createdAt: new Date('2026-01-03'),
      updatedAt: new Date('2026-01-03'),
    },
  ];

  const organizationsStore: any[] = [
    {
      id: 'org-alpha',
      name: 'Organization Alpha',
      slug: 'org-alpha',
      ownerId: 'user-admin-1',
    },
    {
      id: 'org-beta',
      name: 'Organization Beta',
      slug: 'org-beta',
      ownerId: 'user-beta-owner',
    },
  ];

  const orgMembershipsStore: any[] = [
    {
      id: 'om-1',
      organizationId: 'org-alpha',
      userId: 'user-admin-1',
      role: 'OWNER',
    },
    {
      id: 'om-2',
      organizationId: 'org-alpha',
      userId: 'user-member-alpha',
      role: 'ENGINEER',
    },
    {
      id: 'om-3',
      organizationId: 'org-beta',
      userId: 'user-member-beta',
      role: 'ENGINEER',
    },
  ];

  const webhookEventsStore: any[] = [
    {
      id: 'evt-1',
      deliveryId: 'del-101',
      eventType: 'PUSH',
      action: null,
      repositoryId: null,
      processed: false,
      processedAt: null,
      errorMessage: null,
      payload: { ref: 'refs/heads/main', commits: [] },
      createdAt: new Date('2026-01-01'),
    },
  ];

  const mockPrisma: any = {
    user: {
      findUnique: async ({ where, select }: any) => {
        const u = usersStore.find(
          (x) =>
            (where.id && x.id === where.id) ||
            (where.email && x.email === where.email) ||
            (where.username && x.username === where.username),
        );
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
      findFirst: async ({ where, select }: any) => {
        const u = usersStore.find((x) => {
          if (where.id && x.id !== where.id) return false;
          if (where.OR) {
            // Check if matches any of the OR conditions
            const matchesOr = where.OR.some((cond: any) => {
              if (cond.memberships?.some?.organizationId?.in) {
                const userOrgs = orgMembershipsStore
                  .filter((m) => m.userId === x.id)
                  .map((m) => m.organizationId);
                return userOrgs.some((oId) =>
                  cond.memberships.some.organizationId.in.includes(oId),
                );
              }
              if (cond.ownedOrganizations?.some?.id?.in) {
                const userOwned = organizationsStore
                  .filter((o) => o.ownerId === x.id)
                  .map((o) => o.id);
                return userOwned.some((oId) =>
                  cond.ownedOrganizations.some.id.in.includes(oId),
                );
              }
              return false;
            });
            return matchesOr;
          }
          return true;
        });
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
      findMany: async ({ where, select }: any) => {
        const list = usersStore.filter((x) => {
          if (where?.OR) {
            return where.OR.some((cond: any) => {
              if (cond.id && cond.id === x.id) return true;
              if (cond.memberships?.some?.organizationId?.in) {
                const userOrgs = orgMembershipsStore
                  .filter((m) => m.userId === x.id)
                  .map((m) => m.organizationId);
                return userOrgs.some((oId) =>
                  cond.memberships.some.organizationId.in.includes(oId),
                );
              }
              if (cond.ownedOrganizations?.some?.id?.in) {
                const userOwned = organizationsStore
                  .filter((o) => o.ownerId === x.id)
                  .map((o) => o.id);
                return userOwned.some((oId) =>
                  cond.ownedOrganizations.some.id.in.includes(oId),
                );
              }
              return false;
            });
          }
          return true;
        });
        return list.map((u) => {
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
        const newU = {
          id: `user-${Date.now()}`,
          ...data,
          status: 'ACTIVE',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
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

    organization: {
      findFirst: async ({ where }: any) => {
        return (
          organizationsStore.find((o) => {
            if (where.ownerId && o.ownerId === where.ownerId) return true;
            return false;
          }) || null
        );
      },
      findMany: async ({ where }: any) => {
        return organizationsStore.filter((o) => {
          if (where.ownerId && o.ownerId === where.ownerId) return true;
          return false;
        });
      },
    },

    organizationMember: {
      findFirst: async ({ where }: any) => {
        return (
          orgMembershipsStore.find((m) => {
            if (where.userId && m.userId !== where.userId) return false;
            if (where.role?.in && !where.role.in.includes(m.role)) return false;
            return true;
          }) || null
        );
      },
      findMany: async ({ where }: any) => {
        return orgMembershipsStore.filter((m) => {
          if (where.userId && m.userId !== where.userId) return false;
          return true;
        });
      },
    },

    gitHubWebhookEvent: {
      findMany: async () => webhookEventsStore,
      findUnique: async ({ where }: any) =>
        webhookEventsStore.find((e) => e.id === where.id) || null,
      update: async ({ where, data }: any) => {
        const idx = webhookEventsStore.findIndex((e) => e.id === where.id);
        if (idx === -1) throw new Error('Event not found');
        webhookEventsStore[idx] = {
          ...webhookEventsStore[idx],
          ...data,
          updatedAt: new Date(),
        };
        return webhookEventsStore[idx];
      },
    },
  };

  return {
    prisma: mockPrisma,
    usersStore,
    organizationsStore,
    orgMembershipsStore,
    webhookEventsStore,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUITE 1: Webhook Auxiliary Endpoints Authorization
// ═══════════════════════════════════════════════════════════════════════════════

test('Webhook Auxiliary - GET /github/webhooks rejects unauthenticated caller with 401', async () => {
  const { prisma } = createMockPrismaForTargeted();
  const mockWebhookService: any = { findAll: async () => [] };
  const controller = new GithubWebhookController(mockWebhookService, prisma);

  await assert.rejects(
    async () => controller.findAll({ user: undefined }),
    { status: 401 },
  );
});

test('Webhook Auxiliary - GET /github/webhooks rejects ordinary user with 403', async () => {
  const { prisma } = createMockPrismaForTargeted();
  const mockWebhookService: any = { findAll: async () => [] };
  const controller = new GithubWebhookController(mockWebhookService, prisma);

  const reqOrdinary = { user: { userId: 'user-member-alpha', roles: ['DEVELOPER'] } };
  await assert.rejects(
    async () => controller.findAll(reqOrdinary),
    { status: 403 },
  );
});

test('Webhook Auxiliary - GET /github/webhooks allows platform administrator', async () => {
  const { prisma } = createMockPrismaForTargeted();
  const mockWebhookService: any = {
    findAll: async () => [{ id: 'evt-1', deliveryId: 'del-101' }],
  };
  const controller = new GithubWebhookController(mockWebhookService, prisma);

  const reqAdmin = { user: { userId: 'user-admin-1', roles: ['ADMIN'] } };
  const result = await controller.findAll(reqAdmin);
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].id, 'evt-1');
});

test('Webhook Auxiliary - GET /github/webhooks rejects organization admin without platform admin role with 403', async () => {
  const { prisma } = createMockPrismaForTargeted();
  const mockWebhookService: any = { findAll: async () => [] };
  const controller = new GithubWebhookController(mockWebhookService, prisma);

  const reqOrgAdmin = { user: { userId: 'user-admin-1' } };
  await assert.rejects(
    async () => controller.findAll(reqOrgAdmin),
    { status: 403 },
  );
});

test('Webhook Auxiliary - Internal worker with valid secret header is authorized on mutation endpoints', async () => {
  process.env.INTERNAL_WORKER_SECRET = 'worker-super-secret-key-999';
  const { prisma } = createMockPrismaForTargeted();
  const mockWebhookService: any = {
    markProcessed: async (id: string) => ({ id, processed: true }),
  };
  const controller = new GithubWebhookController(mockWebhookService, prisma);

  const reqWorker = {
    headers: { 'x-worker-secret': 'worker-super-secret-key-999' },
    user: undefined,
  };
  const result = await controller.markProcessed(reqWorker, 'evt-1');
  assert.strictEqual(result.processed, true);
});

test('Webhook Auxiliary - Internal worker with invalid secret header is rejected on mutation endpoints', async () => {
  process.env.INTERNAL_WORKER_SECRET = 'worker-super-secret-key-999';
  const { prisma } = createMockPrismaForTargeted();
  const mockWebhookService: any = { markProcessed: async () => ({}) };
  const controller = new GithubWebhookController(mockWebhookService, prisma);

  const reqBadWorker = {
    headers: { 'x-worker-secret': 'wrong-secret' },
    user: undefined,
  };
  await assert.rejects(
    async () => controller.markProcessed(reqBadWorker, 'evt-1'),
    { status: 401 },
  );
});

test('Webhook Auxiliary - Worker secret cannot access administrative inspection endpoint', async () => {
  process.env.INTERNAL_WORKER_SECRET = 'worker-super-secret-key-999';
  const { prisma } = createMockPrismaForTargeted();
  const mockWebhookService: any = { findAll: async () => [] };
  const controller = new GithubWebhookController(mockWebhookService, prisma);

  const reqWorker = {
    headers: { 'x-worker-secret': 'worker-super-secret-key-999' },
    user: undefined,
  };
  await assert.rejects(
    async () => controller.findAll(reqWorker),
    { status: 401 },
  );
});

test('Webhook Auxiliary - Mutation endpoints (process/fail) reject non-admin users with 403', async () => {
  const { prisma } = createMockPrismaForTargeted();
  const mockWebhookService: any = {
    markProcessed: async () => ({ processed: true }),
    markFailed: async () => ({ processed: false }),
  };
  const controller = new GithubWebhookController(mockWebhookService, prisma);

  const reqOrdinary = { user: { userId: 'user-member-alpha', roles: ['DEVELOPER'] } };

  await assert.rejects(
    async () => controller.markProcessed(reqOrdinary, 'evt-1'),
    { status: 403 },
  );

  await assert.rejects(
    async () => controller.markFailed(reqOrdinary, 'evt-1', 'failure reason'),
    { status: 403 },
  );
});

test('Webhook Auxiliary - Mutation endpoints (process/fail) allow platform administrator', async () => {
  const { prisma } = createMockPrismaForTargeted();
  const mockWebhookService: any = {
    markProcessed: async (id: string) => ({ id, processed: true }),
    markFailed: async (id: string, msg: string) => ({ id, processed: false, errorMessage: msg }),
  };
  const controller = new GithubWebhookController(mockWebhookService, prisma);

  const reqAdmin = { user: { userId: 'user-admin-1', roles: ['ADMIN'] } };

  const processed = await controller.markProcessed(reqAdmin, 'evt-1');
  assert.strictEqual(processed.processed, true);

  const failed = await controller.markFailed(reqAdmin, 'evt-1', 'Worker error');
  assert.strictEqual(failed.errorMessage, 'Worker error');
});

// ═══════════════════════════════════════════════════════════════════════════════
// SUITE 2: Users Directory Tenant Isolation
// ═══════════════════════════════════════════════════════════════════════════════

test('Users Directory - Unauthenticated user listing and profile lookup rejected with 401', async () => {
  const { prisma } = createMockPrismaForTargeted();
  const service = new UsersService(prisma);
  const controller = new UsersController(service, prisma);

  await assert.rejects(
    async () => controller.findAll({ user: undefined }),
    { status: 401 },
  );

  await assert.rejects(
    async () => controller.findById({ user: undefined }, 'user-admin-1'),
    { status: 401 },
  );
});

test('Users Directory - Cross-tenant directory enumeration prevented (only same-org returned)', async () => {
  const { prisma } = createMockPrismaForTargeted();
  const service = new UsersService(prisma);
  const controller = new UsersController(service, prisma);

  // Calling as member of Org Alpha
  const reqAlpha = { user: { userId: 'user-member-alpha' } };
  const users = await controller.findAll(reqAlpha);

  // Must only contain Alpha users (admin-1, member-alpha) and NOT user-member-beta
  const returnedIds = users.map((u) => u.id);
  assert.ok(returnedIds.includes('user-admin-1'), 'Org Alpha owner must be included');
  assert.ok(returnedIds.includes('user-member-alpha'), 'Self must be included');
  assert.strictEqual(
    returnedIds.includes('user-member-beta'),
    false,
    'Foreign Org Beta member must NEVER be included in directory results',
  );
});

test('Users Directory - Cross-tenant individual profile access returns 404', async () => {
  const { prisma } = createMockPrismaForTargeted();
  const service = new UsersService(prisma);
  const controller = new UsersController(service, prisma);

  // Calling as member of Org Alpha attempting to query Beta member
  const reqAlpha = { user: { userId: 'user-member-alpha' } };

  await assert.rejects(
    async () => controller.findById(reqAlpha, 'user-member-beta'),
    { status: 404 },
    'Accessing cross-tenant user ID must return 404 to avoid leaking user existence',
  );
});

test('Users Directory - Same-organization co-member profile lookup succeeds', async () => {
  const { prisma } = createMockPrismaForTargeted();
  const service = new UsersService(prisma);
  const controller = new UsersController(service, prisma);

  // Calling as member of Org Alpha querying Alpha admin
  const reqAlpha = { user: { userId: 'user-member-alpha' } };
  const coMember = await controller.findById(reqAlpha, 'user-admin-1');

  assert.strictEqual(coMember.id, 'user-admin-1');
  assert.strictEqual(coMember.email, 'admin@org-alpha.com');
  assert.strictEqual((coMember as any).passwordHash, undefined, 'passwordHash must be omitted');
});

test('Users Directory - Self profile lookup succeeds even without organizations', async () => {
  const { prisma, usersStore } = createMockPrismaForTargeted();
  const standaloneUser = {
    id: 'user-standalone',
    email: 'standalone@example.com',
    username: 'standalone',
    firstName: 'Solo',
    lastName: 'User',
    passwordHash: 'hash',
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  usersStore.push(standaloneUser);

  const service = new UsersService(prisma);
  const controller = new UsersController(service, prisma);

  const reqSolo = { user: { userId: 'user-standalone' } };
  const profile = await controller.findById(reqSolo, 'user-standalone');
  assert.strictEqual(profile.id, 'user-standalone');

  const list = await controller.findAll(reqSolo);
  assert.strictEqual(list.length, 1);
  assert.strictEqual(list[0].id, 'user-standalone');
});

// ═══════════════════════════════════════════════════════════════════════════════
// SUITE 3: User Provisioning Authorization (POST /users)
// ═══════════════════════════════════════════════════════════════════════════════

test('User Provisioning - Ordinary authenticated user cannot provision accounts (403)', async () => {
  const { prisma } = createMockPrismaForTargeted();
  const service = new UsersService(prisma);
  const controller = new UsersController(service, prisma);

  const reqOrdinary = { user: { userId: 'user-member-alpha', roles: ['DEVELOPER'] } };

  await assert.rejects(
    async () =>
      controller.create(reqOrdinary, {
        email: 'attacker-created@example.com',
        username: 'attacker_created',
        password: 'ValidPassword123!',
      }),
    { status: 403 },
  );
});

test('User Provisioning - Organization administrator can provision accounts (201)', async () => {
  const { prisma, usersStore } = createMockPrismaForTargeted();
  const service = new UsersService(prisma);
  const controller = new UsersController(service, prisma);

  const reqAdmin = { user: { userId: 'user-admin-1' } };

  const created = await controller.create(reqAdmin, {
    email: 'provisioned@org-alpha.com',
    username: 'provisioned_user',
    password: 'ProvisionedPassword123!',
    firstName: 'Provisioned',
    lastName: 'Dev',
  });

  assert.strictEqual(created.email, 'provisioned@org-alpha.com');
  assert.strictEqual((created as any).passwordHash, undefined, 'passwordHash must not be returned');

  const inDb = usersStore.find((u) => u.email === 'provisioned@org-alpha.com');
  assert.ok(inDb, 'User must exist in database');
  const validHash = await bcrypt.compare('ProvisionedPassword123!', inDb.passwordHash);
  assert.strictEqual(validHash, true, 'Stored password must be securely hashed with bcrypt');
});

test('User Provisioning - Privileged role/status injection is rejected by service', async () => {
  const { prisma, usersStore } = createMockPrismaForTargeted();
  const service = new UsersService(prisma);
  const controller = new UsersController(service, prisma);

  const reqAdmin = { user: { userId: 'user-admin-1' } };

  // Attempt to pass role: 'ADMIN' or status: 'SUSPENDED' in body
  const created = await controller.create(reqAdmin, {
    email: 'test-injection@org-alpha.com',
    username: 'test_injection',
    password: 'Password123!',
    ...({ role: 'SUPER_ADMIN', status: 'INACTIVE' } as any),
  });

  const inDb = usersStore.find((u) => u.email === 'test-injection@org-alpha.com');
  assert.strictEqual(inDb.status, 'ACTIVE', 'Status must default safely, injection must be ignored');
  assert.strictEqual((inDb as any).role, undefined, 'Global role injection must not be set');
});

test('User Provisioning - Public registration via /auth/register remains unblocked', async () => {
  const { prisma, usersStore } = createMockPrismaForTargeted();
  const mockJwtService: any = {
    sign: () => 'mock-jwt-token-xyz',
  };
  const authService = new AuthService(prisma, mockJwtService);
  const authController = new AuthController(authService);

  const res = await authController.register({
    email: 'self-registered@example.com',
    username: 'self_reg',
    firstName: 'Self',
    lastName: 'Register',
    password: 'StrongPassword123!',
  });

  assert.strictEqual(res.accessToken, 'mock-jwt-token-xyz');
  assert.strictEqual(res.user.email, 'self-registered@example.com');

  const inDb = usersStore.find((u) => u.email === 'self-registered@example.com');
  assert.ok(inDb, 'Self-registered user created in DB');
  const validHash = await bcrypt.compare('StrongPassword123!', inDb.passwordHash);
  assert.strictEqual(validHash, true, 'Self-registered password must be hashed with bcrypt');
});
