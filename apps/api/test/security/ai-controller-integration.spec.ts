import test from 'node:test';
import assert from 'node:assert';
import { SseJwtAuthGuard } from '../../src/ai/guards/sse-jwt-auth.guard.js';
import { AIController } from '../../src/ai/ai.controller.js';

function createMockConfigService(jwtSecret: string = 'test-jwt-secret-key-123') {
  return {
    get: (key: string) => {
      if (key === 'auth.jwtSecret') return jwtSecret;
      return null;
    },
  } as any;
}

function createMockJwtService(validTokens: Record<string, any>) {
  return {
    verifyAsync: async (token: string, options: any) => {
      const payload = validTokens[token];
      if (!payload) {
        throw new Error('Invalid token');
      }
      return payload;
    },
  } as any;
}

function createMockPrismaForAI(userHasAccess: boolean) {
  return {
    user: {
      findUnique: async ({ where }: any) => ({ id: where.id, status: 'ACTIVE' }),
    },
    project: {
      findUnique: async ({ where }: any) => {
        if (where.id === 'unauthorized-project') {
          return {
            id: 'unauthorized-project',
            organizationId: 'org-foreign',
            organization: { id: 'org-foreign', ownerId: 'foreign-owner' },
            members: [],
          };
        }
        if (where.id === 'authorized-project') {
          return {
            id: 'authorized-project',
            organizationId: 'org-mine',
            organization: { id: 'org-mine', ownerId: 'my-owner' },
            members: userHasAccess ? [{ id: 'pm-1' }] : [],
          };
        }
        return null;
      },
    },
    projectMember: {
      findMany: async () => (userHasAccess ? [{ projectId: 'authorized-project' }] : []),
    },
    organizationMember: {
      findUnique: async () => null,
    },
  } as any;
}

test('SSE Guard Integration - Query parameter token authenticates SSE stream', async () => {
  const tokenPayload = {
    sub: 'user-streamer-1',
    email: 'streamer@example.com',
    username: 'streamer',
    roles: ['DEVELOPER'],
  };

  const jwtService = createMockJwtService({ 'valid-sse-token': tokenPayload });
  const configService = createMockConfigService('test-jwt-secret-key-123');
  const guard = new SseJwtAuthGuard(jwtService, configService);

  const request: any = {
    headers: {},
    query: { token: 'valid-sse-token' },
  };

  const context = {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as any;

  const result = await guard.canActivate(context);
  assert.strictEqual(result, true);
  assert.strictEqual(request.user.userId, 'user-streamer-1');
  assert.strictEqual(request.user.id, 'user-streamer-1');
  assert.strictEqual(request.user.email, 'streamer@example.com');
});

test('SSE Guard Integration - Missing query token rejects SSE connection with 401', async () => {
  const jwtService = createMockJwtService({});
  const configService = createMockConfigService();
  const guard = new SseJwtAuthGuard(jwtService, configService);

  const request: any = {
    headers: {},
    query: {},
  };

  const context = {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as any;

  await assert.rejects(
    () => guard.canActivate(context),
    (err: any) => err.status === 401 && err.message.includes('Missing authentication token for SSE stream'),
    'Missing query token must throw 401 Unauthorized'
  );
});

test('SSE Guard Integration - Invalid query token rejects SSE connection with 401', async () => {
  const jwtService = createMockJwtService({});
  const configService = createMockConfigService();
  const guard = new SseJwtAuthGuard(jwtService, configService);

  const request: any = {
    headers: {},
    query: { token: 'invalid-expired-token' },
  };

  const context = {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as any;

  await assert.rejects(
    () => guard.canActivate(context),
    (err: any) => err.status === 401 && err.message.includes('Invalid or expired authentication token for SSE stream'),
    'Invalid token must throw 401 Unauthorized'
  );
});

test('AI Controller Integration - getConversations with authorized projectId succeeds', async () => {
  const prisma = createMockPrismaForAI(true);
  const mockAiService = {
    getConversations: async (userId: string, projectId?: string) => [
      { id: 'conv-1', userId, projectId },
    ],
  };

  const controller = new AIController(mockAiService as any, prisma);
  const req = { user: { userId: 'user-auth-1' } };

  const result = await controller.getConversations(req, 'authorized-project');
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].id, 'conv-1');
});

test('AI Controller Integration - getConversations with unauthorized projectId is blocked with 403', async () => {
  const prisma = createMockPrismaForAI(false);
  const mockAiService = {
    getConversations: async () => [],
  };

  const controller = new AIController(mockAiService as any, prisma);
  const req = { user: { userId: 'user-auth-1' } };

  await assert.rejects(
    () => controller.getConversations(req, 'unauthorized-project'),
    (err: any) => err.status === 403,
    'Unauthorized project conversation access must be rejected with 403 Forbidden'
  );
});
