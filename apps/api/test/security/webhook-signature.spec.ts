import test from 'node:test';
import assert from 'node:assert';
import * as crypto from 'node:crypto';
import {
  verifyGithubSignature,
  WebhookUnauthorizedError,
} from '../../src/github/guards/github-signature.validator.js';

test('Webhook Security - Valid HMAC-SHA256 signature is accepted', () => {
  const secret = 'test-webhook-secret-key-12345';
  const rawBody = Buffer.from(JSON.stringify({ action: 'opened', issue: { id: 1 } }), 'utf8');
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(rawBody);
  const signature = `sha256=${hmac.digest('hex')}`;

  const result = verifyGithubSignature(signature, rawBody, secret);
  assert.strictEqual(result, true, 'Valid signature should be accepted');
});

test('Webhook Security - Invalid HMAC signature is rejected', () => {
  const secret = 'test-webhook-secret-key-12345';
  const rawBody = Buffer.from(JSON.stringify({ action: 'opened' }), 'utf8');
  const bogusSignature = `sha256=${'0'.repeat(64)}`;

  assert.throws(
    () => verifyGithubSignature(bogusSignature, rawBody, secret),
    (err: any) => err instanceof WebhookUnauthorizedError && err.message === 'Invalid webhook signature',
    'Invalid signature should throw WebhookUnauthorizedError'
  );
});

test('Webhook Security - Missing x-hub-signature-256 header is rejected', () => {
  const secret = 'test-secret';
  const rawBody = Buffer.from(JSON.stringify({ action: 'opened' }), 'utf8');

  assert.throws(
    () => verifyGithubSignature(undefined, rawBody, secret),
    (err: any) => err instanceof WebhookUnauthorizedError && err.message === 'Missing x-hub-signature-256 header',
    'Missing signature header should throw'
  );
});

test('Webhook Security - Malformed signature header format is rejected', () => {
  const secret = 'test-secret';
  const rawBody = Buffer.from(JSON.stringify({ action: 'opened' }), 'utf8');

  // Test not starting with sha256=
  assert.throws(
    () => verifyGithubSignature('md5=abcdef', rawBody, secret),
    (err: any) => err instanceof WebhookUnauthorizedError && err.message === 'Malformed x-hub-signature-256 header format'
  );

  // Test invalid length
  assert.throws(
    () => verifyGithubSignature('sha256=too-short', rawBody, secret),
    (err: any) => err instanceof WebhookUnauthorizedError && err.message === 'Malformed x-hub-signature-256 header format'
  );
});

test('Webhook Security - Missing GITHUB_WEBHOOK_SECRET fails securely', () => {
  const rawBody = Buffer.from(JSON.stringify({ action: 'opened' }), 'utf8');
  const validLengthSig = `sha256=${'a'.repeat(64)}`;

  assert.throws(
    () => verifyGithubSignature(validLengthSig, rawBody, undefined),
    (err: any) => err instanceof WebhookUnauthorizedError && err.message === 'GitHub webhook secret is not configured',
    'Missing secret must fail securely'
  );

  assert.throws(
    () => verifyGithubSignature(validLengthSig, rawBody, ''),
    (err: any) => err instanceof WebhookUnauthorizedError && err.message === 'GitHub webhook secret is not configured',
    'Empty secret must fail securely'
  );
});

test('Webhook Security - Missing raw request body is rejected', () => {
  const secret = 'test-secret';
  const validLengthSig = `sha256=${'a'.repeat(64)}`;

  assert.throws(
    () => verifyGithubSignature(validLengthSig, undefined, secret),
    (err: any) => err instanceof WebhookUnauthorizedError && err.message === 'Missing raw request body for webhook signature verification'
  );
});
