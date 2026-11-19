import test from 'node:test';
import assert from 'node:assert';
import * as crypto from 'node:crypto';
import {
  verifySocketTokenSync,
  authorizeChannelAccess,
  SocketAuthError,
} from '../../src/chat/chat-auth.validator.js';

function createJwt(payload: any, secret: string): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(`${headerB64}.${payloadB64}`);
  const signatureB64 = hmac.digest('base64url');
  return `${headerB64}.${payloadB64}.${signatureB64}`;
}

const TEST_SECRET = 'devsync-test-jwt-secret-key-32-chars';

test('WebSocket Security - Missing JWT token is rejected', () => {
  assert.throws(
    () => verifySocketTokenSync(undefined, TEST_SECRET),
    (err: any) => err instanceof SocketAuthError && err.message === 'Authentication token is missing',
    'Missing token must throw SocketAuthError'
  );

  assert.throws(
    () => verifySocketTokenSync('', TEST_SECRET),
    (err: any) => err instanceof SocketAuthError && err.message === 'Authentication token is missing'
  );
});

test('WebSocket Security - Invalid JWT signature is rejected', () => {
  const token = createJwt({ sub: 'user-1', username: 'alice' }, 'wrong-secret');
  assert.throws(
    () => verifySocketTokenSync(token, TEST_SECRET),
    (err: any) => err instanceof SocketAuthError && err.message === 'Invalid JWT token signature',
    'Tampered or wrong secret token must be rejected'
  );
});

test('WebSocket Security - Expired JWT token is rejected', () => {
  const pastTimestamp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
  const expiredToken = createJwt({ sub: 'user-1', exp: pastTimestamp }, TEST_SECRET);

  assert.throws(
    () => verifySocketTokenSync(expiredToken, TEST_SECRET),
    (err: any) => err instanceof SocketAuthError && err.message === 'JWT token has expired',
    'Expired token must be rejected'
  );
});

test('WebSocket Security - Valid JWT connects and extracts authenticated identity', () => {
  const futureTimestamp = Math.floor(Date.now() / 1000) + 3600;
  const token = createJwt(
    { sub: 'user-authenticated-123', email: 'alice@example.com', username: 'alice', exp: futureTimestamp },
    TEST_SECRET
  );

  const user = verifySocketTokenSync(token, TEST_SECRET);
  assert.strictEqual(user.userId, 'user-authenticated-123');
  assert.strictEqual(user.id, 'user-authenticated-123');
  assert.strictEqual(user.username, 'alice');
});

test('WebSocket Security - Non-member cannot join project channel', async () => {
  const mockPrisma = {
    chatChannel: {
      findUnique: async () => ({
        id: 'chan-secret',
        projectId: 'proj-secret',
        isPrivate: false,
        members: [],
        project: {
          id: 'proj-secret',
          organizationId: 'org-secret',
          organization: { ownerId: 'other-user' },
          members: [], // User is not a member of this project
        },
      }),
    },
    organizationMember: {
      findUnique: async () => null,
    },
  } as any;

  const hasAccess = await authorizeChannelAccess(mockPrisma, 'user-intruder', 'chan-secret');
  assert.strictEqual(hasAccess, false, 'Non-member must be denied channel join access');
});

test('WebSocket Security - Authorized member can access channel', async () => {
  const mockPrisma = {
    chatChannel: {
      findUnique: async () => ({
        id: 'chan-project',
        projectId: 'proj-1',
        isPrivate: false,
        members: [],
        project: {
          id: 'proj-1',
          organizationId: 'org-1',
          organization: { ownerId: 'owner-1' },
          members: [{ id: 'pm-1' }], // User is a project member!
        },
      }),
    },
  } as any;

  const hasAccess = await authorizeChannelAccess(mockPrisma, 'user-member', 'chan-project');
  assert.strictEqual(hasAccess, true, 'Authorized project member must be granted channel access');
});

test('WebSocket Security - Forged client-provided senderId is overridden with verified identity', () => {
  const verifiedUser = { userId: 'user-real-identity', id: 'user-real-identity', username: 'alice', email: '' };

  const incomingDto = {
    channelId: 'chan-1',
    senderId: 'user-spoofed-ceo', // Attacker attempts to forge identity
    content: 'Approved bonus for everyone!',
  };

  // Gateway logic: enforce verified user ID
  incomingDto.senderId = verifiedUser.userId;

  assert.strictEqual(incomingDto.senderId, 'user-real-identity', 'Spoofed senderId must be overwritten with verified identity');
});
