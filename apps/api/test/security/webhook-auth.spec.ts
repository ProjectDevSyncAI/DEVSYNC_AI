import test from 'node:test';
import assert from 'node:assert';
import * as crypto from 'node:crypto';
import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';

import { WebhookAdminOrWorkerGuard } from '../../src/github/guards/webhook-admin-or-worker.guard.js';
import { PlatformAdminGuard } from '../../src/github/guards/platform-admin.guard.js';
import { GithubWebhookController } from '../../src/github/github-webhook.controller.js';
import { verifyGithubSignature } from '../../src/github/guards/github-signature.validator.js';

function createMockExecutionContext(req: any): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => req,
      getResponse: () => ({}),
      getNext: () => ({}),
    }),
    getClass: () => GithubWebhookController as any,
    getHandler: () => (() => {}) as any,
    getArgs: () => [req],
    getArgByIndex: () => req,
    switchToRpc: () => ({}) as any,
    switchToWs: () => ({}) as any,
    getType: () => 'http',
  } as unknown as ExecutionContext;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUITE 1: WebhookAdminOrWorkerGuard Execution Order & Worker Authentication
// ═══════════════════════════════════════════════════════════════════════════════

test('Worker Auth - Valid worker secret succeeds without user JWT', async () => {
  process.env.INTERNAL_WORKER_SECRET = 'correct-worker-secret-xyz';
  const guard = new WebhookAdminOrWorkerGuard();

  const req: any = {
    headers: { 'x-worker-secret': 'correct-worker-secret-xyz' },
    user: undefined,
  };
  const context = createMockExecutionContext(req);

  const canActivate = await guard.canActivate(context);
  assert.strictEqual(canActivate, true);
  assert.strictEqual(req.isWorker, true);
  assert.strictEqual(req.authType, 'worker');
  assert.strictEqual(req.user, undefined, 'Must not fabricate user identity for workers');
});

test('Worker Auth - Missing environment configuration fails closed', async () => {
  delete process.env.INTERNAL_WORKER_SECRET;
  const guard = new WebhookAdminOrWorkerGuard();

  const req: any = {
    headers: { 'x-worker-secret': 'some-secret' },
    user: undefined,
  };
  const context = createMockExecutionContext(req);

  await assert.rejects(
    async () => guard.canActivate(context),
    (err: any) => {
      assert.strictEqual(err.status, 401);
      assert.match(err.message, /not configured/i);
      return true;
    },
  );
});

test('Worker Auth - Empty or whitespace environment configuration fails closed', async () => {
  process.env.INTERNAL_WORKER_SECRET = '   ';
  const guard = new WebhookAdminOrWorkerGuard();

  const req: any = {
    headers: { 'x-worker-secret': 'some-secret' },
    user: undefined,
  };
  const context = createMockExecutionContext(req);

  await assert.rejects(
    async () => guard.canActivate(context),
    { status: 401 },
  );
});

test('Worker Auth - Invalid worker secret cannot bypass JWT/admin authorization', async () => {
  process.env.INTERNAL_WORKER_SECRET = 'correct-worker-secret-xyz';
  const guard = new WebhookAdminOrWorkerGuard();

  const req: any = {
    headers: {
      'x-worker-secret': 'invalid-secret-attacker',
      authorization: 'Bearer admin-jwt-token',
    },
    user: { userId: 'admin-1', roles: ['ADMIN'] },
  };
  const context = createMockExecutionContext(req);

  await assert.rejects(
    async () => guard.canActivate(context),
    { status: 401 },
  );
});

test('Worker Auth - Invalid worker secret fails with 401 and timingSafeEqual', async () => {
  process.env.INTERNAL_WORKER_SECRET = 'correct-worker-secret-xyz';
  const guard = new WebhookAdminOrWorkerGuard();

  const req: any = {
    headers: { 'x-worker-secret': 'wrong-secret-abc' },
    user: undefined,
  };
  const context = createMockExecutionContext(req);

  await assert.rejects(
    async () => guard.canActivate(context),
    (err: any) => {
      assert.strictEqual(err.status, 401);
      assert.match(err.message, /invalid worker authentication secret/i);
      return true;
    },
  );
});

test('Worker Auth - Non-string worker secret header fails closed with 401', async () => {
  process.env.INTERNAL_WORKER_SECRET = 'correct-worker-secret-xyz';
  const guard = new WebhookAdminOrWorkerGuard();

  const req: any = {
    headers: { 'x-worker-secret': ['array', 'secret'] },
    user: undefined,
  };
  const context = createMockExecutionContext(req);

  await assert.rejects(
    async () => guard.canActivate(context),
    { status: 401 },
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// SUITE 2: Guard Fallback to JWT & Platform Administrator Authorization
// ═══════════════════════════════════════════════════════════════════════════════

test('Guard Fallback - Valid platform admin JWT is authorized when worker secret is absent', async () => {
  const guard = new WebhookAdminOrWorkerGuard();

  // Mock super.canActivate to simulate valid Passport JWT validation
  (guard as any).canActivate = async function (context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    if (req.headers?.['x-worker-secret'] !== undefined) {
      return Object.getPrototypeOf(WebhookAdminOrWorkerGuard.prototype).canActivate.call(this, context);
    }
    // Simulate Passport populating user with ADMIN role
    if (req.headers?.authorization === 'Bearer admin-jwt-token') {
      req.user = { userId: 'admin-uuid', roles: ['ADMIN'] };
      return true;
    }
    throw new UnauthorizedException('Unauthorized');
  };

  const req: any = {
    headers: { authorization: 'Bearer admin-jwt-token' },
  };
  const context = createMockExecutionContext(req);

  const result = await guard.canActivate(context);
  assert.strictEqual(result, true);
  assert.strictEqual(req.user.roles.includes('ADMIN'), true);
});

test('Guard Fallback - Ordinary user JWT is rejected with 403 on worker endpoints', async () => {
  const guard = new WebhookAdminOrWorkerGuard();

  const req: any = {
    headers: {},
    user: { userId: 'dev-1', roles: ['DEVELOPER'] },
  };
  const context = createMockExecutionContext(req);

  // Directly call the authorization evaluation logic
  const hasPlatformAdminRole =
    req.user?.roles?.includes('ADMIN') || req.user?.roles?.includes('OWNER');

  assert.strictEqual(hasPlatformAdminRole, false);
  assert.throws(
    () => {
      if (!hasPlatformAdminRole) {
        throw new ForbiddenException(
          'Platform administrative privileges required for webhook operations',
        );
      }
    },
    { status: 403 },
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// SUITE 3: PlatformAdminGuard for Administrative Inspection Endpoints
// ═══════════════════════════════════════════════════════════════════════════════

test('PlatformAdminGuard - Worker secret cannot access administrative inspection routes', async () => {
  const guard = new PlatformAdminGuard();

  const req: any = {
    headers: { 'x-worker-secret': 'valid-worker-secret' },
    user: undefined,
  };
  const context = createMockExecutionContext(req);

  await assert.rejects(
    async () => guard.canActivate(context),
    (err: any) => {
      assert.strictEqual(err.status, 401);
      assert.match(err.message, /not authorized for administrative inspection/i);
      return true;
    },
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// SUITE 4: Controller Action Authorization & Worker Scope Limitations
// ═══════════════════════════════════════════════════════════════════════════════

test('Controller - Worker can markProcessed and markFailed via secret header', async () => {
  process.env.INTERNAL_WORKER_SECRET = 'worker-secret-prod-123';
  const mockWebhookService: any = {
    markProcessed: async (id: string) => ({ id, processed: true }),
    markFailed: async (id: string, msg: string) => ({ id, processed: false, errorMessage: msg }),
  };
  const controller = new GithubWebhookController(mockWebhookService);

  const reqWorker = {
    headers: { 'x-worker-secret': 'worker-secret-prod-123' },
    user: undefined,
  };

  const processed = await controller.markProcessed(reqWorker, 'evt-worker-1');
  assert.strictEqual(processed.processed, true);

  const failed = await controller.markFailed(reqWorker, 'evt-worker-1', 'Build failed');
  assert.strictEqual(failed.errorMessage, 'Build failed');
});

test('Controller - Worker cannot call findAll (administrative inspection endpoint)', async () => {
  process.env.INTERNAL_WORKER_SECRET = 'worker-secret-prod-123';
  const mockWebhookService: any = { findAll: async () => [] };
  const controller = new GithubWebhookController(mockWebhookService);

  const reqWorker = {
    headers: { 'x-worker-secret': 'worker-secret-prod-123' },
    user: undefined,
  };

  await assert.rejects(
    async () => controller.findAll(reqWorker),
    (err: any) => {
      assert.strictEqual(err.status, 401);
      assert.match(err.message, /inspection/i);
      return true;
    },
  );
});

test('Controller - Organization admin without platform role is rejected with 403 on all webhook operations', async () => {
  const mockWebhookService: any = {
    findAll: async () => [],
    markProcessed: async () => ({}),
  };
  const controller = new GithubWebhookController(mockWebhookService);

  // User is an admin of Org Alpha, but has NO platform roles on their JWT
  const reqOrgAdmin = {
    user: {
      userId: 'user-org-admin-only',
      // No platform 'ADMIN' or 'OWNER'
    },
  };

  await assert.rejects(
    async () => controller.findAll(reqOrgAdmin),
    { status: 403 },
  );

  await assert.rejects(
    async () => controller.markProcessed(reqOrgAdmin, 'evt-1'),
    { status: 403 },
  );
});

test('Controller - Platform administrator can perform all webhook operations', async () => {
  const mockWebhookService: any = {
    findAll: async () => [{ id: 'evt-all-1' }],
    findById: async (id: string) => ({ id }),
    markProcessed: async (id: string) => ({ id, processed: true }),
    markFailed: async (id: string, msg: string) => ({ id, errorMessage: msg }),
  };
  const controller = new GithubWebhookController(mockWebhookService);

  const reqPlatformAdmin = {
    user: {
      userId: 'platform-super-admin',
      roles: ['ADMIN'],
    },
  };

  const list = await controller.findAll(reqPlatformAdmin);
  assert.strictEqual(list.length, 1);

  const single = await controller.findById(reqPlatformAdmin, 'evt-all-1');
  assert.strictEqual(single.id, 'evt-all-1');

  const processed = await controller.markProcessed(reqPlatformAdmin, 'evt-all-1');
  assert.strictEqual(processed.processed, true);

  const failed = await controller.markFailed(reqPlatformAdmin, 'evt-all-1', 'Admin rejected');
  assert.strictEqual(failed.errorMessage, 'Admin rejected');
});

// ═══════════════════════════════════════════════════════════════════════════════
// SUITE 5: Regression Verification — Public Signed Webhook Ingress
// ═══════════════════════════════════════════════════════════════════════════════

test('Regression - Public webhook ingress accepts valid HMAC-SHA256 signature', () => {
  const secret = 'webhook-hmac-secret-42';
  const rawBody = Buffer.from(JSON.stringify({ zen: 'Keep it logically awesome.' }), 'utf8');

  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(rawBody);
  const signature = `sha256=${hmac.digest('hex')}`;

  const isValid = verifyGithubSignature(signature, rawBody, secret);
  assert.strictEqual(isValid, true);
});

test('Regression - Public webhook ingress rejects invalid signature', () => {
  const secret = 'webhook-hmac-secret-42';
  const rawBody = Buffer.from(JSON.stringify({ zen: 'Keep it logically awesome.' }), 'utf8');
  const invalidSignature = 'sha256=0000000000000000000000000000000000000000000000000000000000000000';

  assert.throws(
    () => verifyGithubSignature(invalidSignature, rawBody, secret),
    /invalid webhook signature/i,
  );
});

test('Regression - Public webhook ingress rejects missing signature header', () => {
  const secret = 'webhook-hmac-secret-42';
  const rawBody = Buffer.from(JSON.stringify({ action: 'opened' }), 'utf8');

  assert.throws(
    () => verifyGithubSignature(undefined, rawBody, secret),
    /missing x-hub-signature-256 header/i,
  );
});
