import test from 'node:test';
import assert from 'node:assert';
import crypto from 'node:crypto';
import { GithubSignatureGuard } from '../../src/github/guards/github-signature.guard.js';
import { GithubWebhookController } from '../../src/github/github-webhook.controller.js';

function signPayload(payload: string | Buffer, secret: string): string {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  return `sha256=${hmac.digest('hex')}`;
}

test('Webhook Controller & Guard Integration - Valid signature allows controller execution', async () => {
  const secret = 'super-secure-webhook-secret-xyz';
  process.env.GITHUB_WEBHOOK_SECRET = secret;

  const rawPayload = JSON.stringify({ action: 'opened', pull_request: { id: 101 } });
  const rawBody = Buffer.from(rawPayload, 'utf8');
  const signature = signPayload(rawBody, secret);

  let capturedEvent: any = null;
  const mockWebhookService = {
    create: async (dto: any) => {
      capturedEvent = dto;
      return { id: 'evt-123', ...dto };
    },
  };

  const guard = new GithubSignatureGuard();
  const controller = new GithubWebhookController(mockWebhookService as any);

  // Mock ExecutionContext
  const mockContext = {
    switchToHttp: () => ({
      getRequest: () => ({
        headers: {
          'x-hub-signature-256': signature,
          'x-github-event': 'pull_request',
          'x-github-delivery': 'del-test-1',
        },
        rawBody,
        body: JSON.parse(rawPayload),
      }),
    }),
  } as any;

  // 1. Guard check
  const canActivate = guard.canActivate(mockContext);
  assert.strictEqual(canActivate, true, 'Guard must allow requests with valid signature');

  // 2. Controller check
  const result = await controller.handleIncoming('pull_request', 'del-test-1', JSON.parse(rawPayload));
  assert.strictEqual(result.id, 'evt-123');
  assert.strictEqual(capturedEvent.eventType, 'PULL_REQUEST');
  assert.strictEqual(capturedEvent.deliveryId, 'del-test-1');
});

test('Webhook Controller & Guard Integration - PULL_REQUEST_TARGET event normalized to PULL_REQUEST', async () => {
  const mockWebhookService = {
    create: async (dto: any) => dto,
  };
  const controller = new GithubWebhookController(mockWebhookService as any);

  const result = await controller.handleIncoming('pull_request_target', 'del-norm-1', { action: 'opened' });
  assert.strictEqual(result.eventType, 'PULL_REQUEST');
});

test('Webhook Controller & Guard Integration - Tampered payload is rejected by guard (401)', async () => {
  const secret = 'super-secure-webhook-secret-xyz';
  process.env.GITHUB_WEBHOOK_SECRET = secret;

  const originalPayload = Buffer.from('{"action":"opened"}', 'utf8');
  const signature = signPayload(originalPayload, secret);

  const tamperedPayload = Buffer.from('{"action":"opened","malicious":"injection"}', 'utf8');

  const guard = new GithubSignatureGuard();
  const mockContext = {
    switchToHttp: () => ({
      getRequest: () => ({
        headers: {
          'x-hub-signature-256': signature, // signed with originalPayload, but body is tamperedPayload
        },
        rawBody: tamperedPayload,
      }),
    }),
  } as any;

  assert.throws(
    () => guard.canActivate(mockContext),
    (err: any) => err.status === 401,
    'Tampered raw body must be rejected by guard with 401 Unauthorized'
  );
});

test('Webhook Controller & Guard Integration - Missing signature header is rejected by guard (401)', async () => {
  process.env.GITHUB_WEBHOOK_SECRET = 'super-secure-webhook-secret-xyz';

  const guard = new GithubSignatureGuard();
  const mockContext = {
    switchToHttp: () => ({
      getRequest: () => ({
        headers: {},
        rawBody: Buffer.from('{}'),
      }),
    }),
  } as any;

  assert.throws(
    () => guard.canActivate(mockContext),
    (err: any) => err.status === 401,
    'Missing signature header must be rejected with 401'
  );
});

test('Webhook Controller & Guard Integration - Missing secret fails securely (401)', async () => {
  delete process.env.GITHUB_WEBHOOK_SECRET;

  const guard = new GithubSignatureGuard();
  const mockContext = {
    switchToHttp: () => ({
      getRequest: () => ({
        headers: {
          'x-hub-signature-256': 'sha256=1234567890abcdef',
        },
        rawBody: Buffer.from('{}'),
      }),
    }),
  } as any;

  assert.throws(
    () => guard.canActivate(mockContext),
    (err: any) => err.status === 401,
    'Missing server webhook secret must fail securely with 401'
  );
});
