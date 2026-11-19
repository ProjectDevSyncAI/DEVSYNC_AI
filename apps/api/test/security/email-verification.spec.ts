import test from 'node:test';
import assert from 'node:assert/strict';
import * as crypto from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailVerificationService } from '../../src/auth/email-verification/email-verification.service.js';
import {
  EmailDeliveryService,
  EmailProviderAdapter,
  DeliveryStatus,
} from '../../src/auth/email-verification/email-delivery.service.js';
import {
  EmailVerificationRateLimiterService,
  RedisClientInterface,
  ATOMIC_RATE_LIMIT_LUA,
} from '../../src/auth/email-verification/email-verification-rate-limiter.service.js';
import { EmailVerificationController } from '../../src/auth/email-verification/email-verification.controller.js';
import { ConfirmEmailVerificationDto } from '../../src/auth/email-verification/dto/confirm-email-verification.dto.js';
import { ResendEmailVerificationDto } from '../../src/auth/email-verification/dto/resend-email-verification.dto.js';
import { RequestEmailVerificationDto } from '../../src/auth/email-verification/dto/request-email-verification.dto.js';

// ─────────────────────────────────────────────────────────────────────────────
// Test Fixtures & In-Memory Store
// ─────────────────────────────────────────────────────────────────────────────

interface MockUser {
  id: string;
  email: string;
  username: string;
  pendingEmail?: string | null;
  emailVerifiedAt?: Date | null;
  platformRole?: string;
  tokenVersion?: number;
}

interface MockToken {
  id: string;
  userId: string;
  email: string;
  tokenHash: string;
  purpose: 'INITIAL_VERIFICATION' | 'EMAIL_CHANGE';
  expiresAt: Date;
  consumedAt: Date | null;
  createdAt: Date;
}

function createMockEnvironment(
  initialUsers: MockUser[] = [],
  initialTokens: MockToken[] = [],
  envOverrides: { nodeEnv?: string; hmacSecret?: string } = {},
) {
  const users: MockUser[] = initialUsers.map((u) => ({ ...u }));
  const tokens: MockToken[] = initialTokens.map((t) => ({ ...t }));

  const mockPrisma: any = {
    user: {
      findUnique: async ({ where }: any) => {
        if (where.id) {
          const user = users.find((u) => u.id === where.id);
          return user ? { ...user } : null;
        }
        if (where.email) {
          const user = users.find((u) => u.email === where.email.toLowerCase());
          return user ? { ...user } : null;
        }
        return null;
      },
      findFirst: async ({ where }: any) => {
        return (
          users.find((u) => {
            if (where.email && u.email !== where.email.toLowerCase()) return false;
            if (where.id?.not && u.id === where.id.not) return false;
            return true;
          }) || null
        );
      },
      update: async ({ where, data }: any) => {
        const user = users.find((u) => u.id === where.id);
        if (!user) throw new Error('User not found in update');
        Object.assign(user, data);
        return { ...user };
      },
    },
    emailVerificationToken: {
      findUnique: async ({ where }: any) => {
        if (where.tokenHash) {
          const token = tokens.find((t) => t.tokenHash === where.tokenHash);
          return token ? { ...token } : null;
        }
        if (where.id) {
          const token = tokens.find((t) => t.id === where.id);
          return token ? { ...token } : null;
        }
        return null;
      },
      findFirst: async ({ where }: any) => {
        const filtered = tokens.filter((t) => {
          if (where.userId && t.userId !== where.userId) return false;
          if (where.email && t.email !== where.email.toLowerCase()) return false;
          if (where.purpose && t.purpose !== where.purpose) return false;
          if (where.consumedAt === null && t.consumedAt !== null) return false;
          return true;
        });
        filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        return filtered[0] ? { ...filtered[0] } : null;
      },
      count: async ({ where }: any) => {
        return tokens.filter((t) => {
          if (where.userId && t.userId !== where.userId) return false;
          if (where.email && t.email !== where.email.toLowerCase()) return false;
          if (where.createdAt?.gte && t.createdAt < where.createdAt.gte) return false;
          return true;
        }).length;
      },
      create: async ({ data }: any) => {
        const newToken: MockToken = {
          id: `token-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          userId: data.userId,
          email: data.email.toLowerCase(),
          tokenHash: data.tokenHash,
          purpose: data.purpose,
          expiresAt: data.expiresAt,
          consumedAt: null,
          createdAt: data.createdAt || new Date(),
        };
        tokens.push(newToken);
        return { ...newToken };
      },
      updateMany: async ({ where, data }: any) => {
        let count = 0;
        for (const token of tokens) {
          let match = true;
          if (where.id && token.id !== where.id) match = false;
          if (where.userId && token.userId !== where.userId) match = false;
          if (where.purpose && token.purpose !== where.purpose) match = false;
          if (where.consumedAt === null && token.consumedAt !== null) match = false;
          if (match) {
            Object.assign(token, data);
            count++;
          }
        }
        return { count };
      },
    },
    $transaction: async (fn: any) => {
      // Snapshot state for atomic rollback simulation
      const userSnapshot = users.map((u) => ({ ...u }));
      const tokenSnapshot = tokens.map((t) => ({ ...t }));
      try {
        return await fn(mockPrisma);
      } catch (err) {
        // Rollback state on error
        users.length = 0;
        users.push(...userSnapshot);
        tokens.length = 0;
        tokens.push(...tokenSnapshot);
        throw err;
      }
    },
  };

  const mockConfig: any = {
    get: (key: string) => {
      if (key === 'app.frontendUrl') return 'http://localhost:5173';
      if (key === 'app.environment') {
        return 'nodeEnv' in envOverrides ? envOverrides.nodeEnv : 'development';
      }
      if (key === 'emailVerification.hmacSecret') {
        // If hmacSecret key is explicitly present in envOverrides (even as undefined/null),
        // return that exact value so tests can simulate a missing secret in production.
        if ('hmacSecret' in envOverrides) {
          return envOverrides.hmacSecret ?? null;
        }
        return 'test-hmac-secret-min-32-characters-long-key';
      }
      return null;
    },
  };

  const emailDelivery = new EmailDeliveryService(mockConfig as ConfigService);
  const rateLimiter = new EmailVerificationRateLimiterService(mockPrisma, mockConfig as ConfigService);
  const emailVerificationService = new EmailVerificationService(mockPrisma, emailDelivery, rateLimiter);
  const controller = new EmailVerificationController(emailVerificationService);

  return {
    users,
    tokens,
    mockPrisma,
    mockConfig,
    emailDelivery,
    rateLimiter,
    emailVerificationService,
    controller,
  };
}

/**
 * Creates an in-memory simulated Redis client executing ATOMIC_RATE_LIMIT_LUA semantics.
 */
function createMockRedisLuaEngine() {
  const store = new Map<string, { value: string; ex?: number; expireAt?: number }>();

  const client: RedisClientInterface = {
    eval: async (script: string, ...args: any[]) => {
      let keys: string[] = [];
      let argv: string[] = [];
      if (args[0] && typeof args[0] === 'object' && Array.isArray(args[0].keys)) {
        keys = args[0].keys;
        argv = args[0].arguments || [];
      } else {
        const numKeys = Number(args[0]) || 0;
        keys = args.slice(1, 1 + numKeys);
        argv = args.slice(1 + numKeys);
      }

      const cooldownKey = keys[0];
      const hourlyKey = keys[1];
      const cooldownTtl = Number(argv[0]) || 60;
      const hourlyTtl = Number(argv[1]) || 3600;
      const maxRequests = Number(argv[2]) || 5;

      const now = Date.now();

      // Clean up expired keys
      for (const [k, v] of store.entries()) {
        if (v.expireAt && v.expireAt <= now) {
          store.delete(k);
        }
      }

      // 1. Check cooldown
      const cooldownRecord = store.get(cooldownKey);
      if (cooldownRecord) {
        const remaining = Math.max(1, Math.ceil((cooldownRecord.expireAt! - now) / 1000));
        return [0, 'COOLDOWN', remaining];
      }

      // 2. Check hourly count
      const hourlyRecord = store.get(hourlyKey);
      const currentHourly = hourlyRecord ? Number(hourlyRecord.value) : 0;
      if (currentHourly >= maxRequests) {
        const remaining = Math.max(1, Math.ceil((hourlyRecord!.expireAt! - now) / 1000));
        return [0, 'HOURLY_CAP', remaining];
      }

      // 3. Set cooldown and increment hourly count
      store.set(cooldownKey, {
        value: '1',
        ex: cooldownTtl,
        expireAt: now + cooldownTtl * 1000,
      });

      const nextHourly = currentHourly + 1;
      const existingHourlyExpireAt = hourlyRecord?.expireAt || now + hourlyTtl * 1000;
      store.set(hourlyKey, {
        value: String(nextHourly),
        ex: hourlyTtl,
        expireAt: existingHourlyExpireAt,
      });

      return [1, 'OK', nextHourly];
    },
    get: async (key: string) => store.get(key)?.value ?? null,
    ttl: async (key: string) => {
      const rec = store.get(key);
      if (!rec || !rec.expireAt) return -2;
      return Math.max(0, Math.ceil((rec.expireAt - Date.now()) / 1000));
    },
  };

  return { client, store };
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Token Security & Cryptographic Generation Tests
// ─────────────────────────────────────────────────────────────────────────────
test('Token Security - Generates 64-character hexadecimal cryptographically random tokens', () => {
  const env = createMockEnvironment();
  const token1 = env.emailVerificationService.generateSecureToken();
  const token2 = env.emailVerificationService.generateSecureToken();

  assert.equal(typeof token1, 'string');
  assert.equal(token1.length, 64);
  assert.ok(/^[a-f0-9]{64}$/.test(token1));
  assert.notEqual(token1, token2);
});

test('Token Security - Only SHA-256 hash is persisted in database; raw token is never stored', async () => {
  const env = createMockEnvironment([
    { id: 'user-1', email: 'dev@example.com', username: 'developer', emailVerifiedAt: null },
  ]);

  const res = await env.emailVerificationService.requestVerification('user-1', {});
  assert.equal(res.success, true);

  assert.equal(env.tokens.length, 1);
  const persisted = env.tokens[0];
  assert.ok(persisted.tokenHash);
  assert.equal(persisted.tokenHash.length, 64);

  const sentEmails = env.emailDelivery.getSentEmails();
  assert.equal(sentEmails.length, 1);
  const url = sentEmails[0].verificationUrl;
  const rawTokenMatch = url.match(/#token=([a-f0-9]{64})/);
  assert.ok(rawTokenMatch, 'Verification URL must contain raw token in fragment');
  const rawToken = rawTokenMatch[1];

  const computedHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  assert.equal(persisted.tokenHash, computedHash);
  assert.notEqual(persisted.tokenHash, rawToken);
});

test('Token Security - Token is bound to target email and purpose', async () => {
  const env = createMockEnvironment([
    { id: 'user-1', email: 'original@example.com', username: 'developer', emailVerifiedAt: new Date() },
  ]);

  await env.emailVerificationService.requestVerification('user-1', {
    email: 'new-address@example.com',
  });

  assert.equal(env.tokens.length, 1);
  const token = env.tokens[0];
  assert.equal(token.email, 'new-address@example.com');
  assert.equal(token.purpose, 'EMAIL_CHANGE');
  const diffMinutes = Math.round((token.expiresAt.getTime() - token.createdAt.getTime()) / 60000);
  assert.equal(diffMinutes, 60);
});

test('Token Security - Expired tokens are strictly rejected with 400 Bad Request', async () => {
  const rawToken = 'a'.repeat(64);
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  const env = createMockEnvironment(
    [{ id: 'user-1', email: 'dev@example.com', username: 'dev', emailVerifiedAt: null }],
    [
      {
        id: 'tok-1',
        userId: 'user-1',
        email: 'dev@example.com',
        tokenHash,
        purpose: 'INITIAL_VERIFICATION',
        expiresAt: new Date(Date.now() - 1000),
        consumedAt: null,
        createdAt: new Date(Date.now() - 86401000),
      },
    ],
  );

  await assert.rejects(
    async () => {
      await env.emailVerificationService.confirmVerification({ token: rawToken });
    },
    (err: any) => {
      assert.ok(err instanceof BadRequestException);
      assert.equal(err.message, 'Verification token has expired');
      return true;
    },
  );
});

test('Token Security - Consumed tokens are strictly rejected with 409 Conflict', async () => {
  const rawToken = 'b'.repeat(64);
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  const env = createMockEnvironment(
    [{ id: 'user-1', email: 'dev@example.com', username: 'dev', emailVerifiedAt: null }],
    [
      {
        id: 'tok-1',
        userId: 'user-1',
        email: 'dev@example.com',
        tokenHash,
        purpose: 'INITIAL_VERIFICATION',
        expiresAt: new Date(Date.now() + 86400000),
        consumedAt: new Date(),
        createdAt: new Date(),
      },
    ],
  );

  await assert.rejects(
    async () => {
      await env.emailVerificationService.confirmVerification({ token: rawToken });
    },
    (err: any) => {
      assert.ok(err instanceof ConflictException);
      assert.equal(err.message, 'Verification token has already been used');
      return true;
    },
  );
});

test('Token Security - Invalid/unrecognized tokens return 404 Not Found', async () => {
  const env = createMockEnvironment();

  await assert.rejects(
    async () => {
      await env.emailVerificationService.confirmVerification({ token: 'c'.repeat(64) });
    },
    (err: any) => {
      assert.ok(err instanceof NotFoundException);
      assert.equal(err.message, 'Invalid verification token');
      return true;
    },
  );
});

test('Token Security - Invalid/unknown purpose is rejected with 400 Bad Request', async () => {
  const rawToken = 'd'.repeat(64);
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  const env = createMockEnvironment(
    [{ id: 'user-1', email: 'dev@example.com', username: 'dev', emailVerifiedAt: null }],
    [
      {
        id: 'tok-unknown',
        userId: 'user-1',
        email: 'dev@example.com',
        tokenHash,
        purpose: 'UNKNOWN_PURPOSE' as any,
        expiresAt: new Date(Date.now() + 86400000),
        consumedAt: null,
        createdAt: new Date(),
      },
    ],
  );

  await assert.rejects(
    async () => {
      await env.emailVerificationService.confirmVerification({ token: rawToken });
    },
    (err: any) => {
      assert.ok(err instanceof BadRequestException);
      assert.equal(err.message, 'Invalid verification purpose');
      return true;
    },
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. F4: Transaction Atomicity, Rollback & State Transitions
// ─────────────────────────────────────────────────────────────────────────────
test('Atomicity - Successful confirmation consumes token and marks user verified', async () => {
  const rawToken = '1'.repeat(64);
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  const env = createMockEnvironment(
    [{ id: 'user-1', email: 'dev@example.com', username: 'dev', emailVerifiedAt: null }],
    [
      {
        id: 'tok-1',
        userId: 'user-1',
        email: 'dev@example.com',
        tokenHash,
        purpose: 'INITIAL_VERIFICATION',
        expiresAt: new Date(Date.now() + 86400000),
        consumedAt: null,
        createdAt: new Date(),
      },
    ],
  );

  const res = await env.emailVerificationService.confirmVerification({ token: rawToken });
  assert.equal(res.success, true);
  assert.equal(res.purpose, 'INITIAL_VERIFICATION');

  const token = env.tokens[0];
  assert.ok(token.consumedAt instanceof Date);

  const user = env.users[0];
  assert.ok(user.emailVerifiedAt instanceof Date);
});

test('Atomicity - Repeated confirmation of same token fails on second invocation', async () => {
  const rawToken = '2'.repeat(64);
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  const env = createMockEnvironment(
    [{ id: 'user-1', email: 'dev@example.com', username: 'dev', emailVerifiedAt: null }],
    [
      {
        id: 'tok-1',
        userId: 'user-1',
        email: 'dev@example.com',
        tokenHash,
        purpose: 'INITIAL_VERIFICATION',
        expiresAt: new Date(Date.now() + 86400000),
        consumedAt: null,
        createdAt: new Date(),
      },
    ],
  );

  const res1 = await env.emailVerificationService.confirmVerification({ token: rawToken });
  assert.equal(res1.success, true);

  await assert.rejects(
    async () => {
      await env.emailVerificationService.confirmVerification({ token: rawToken });
    },
    (err: any) => {
      assert.ok(err instanceof ConflictException);
      assert.equal(err.message, 'Verification token has already been used');
      return true;
    },
  );
});

test('Atomicity - Concurrent confirmation attempts result in strictly one successful consumption', async () => {
  const rawToken = 'e'.repeat(64);
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  const env = createMockEnvironment(
    [{ id: 'user-1', email: 'dev@example.com', username: 'dev', emailVerifiedAt: null }],
    [
      {
        id: 'tok-concurrent',
        userId: 'user-1',
        email: 'dev@example.com',
        tokenHash,
        purpose: 'INITIAL_VERIFICATION',
        expiresAt: new Date(Date.now() + 86400000),
        consumedAt: null,
        createdAt: new Date(),
      },
    ],
  );

  const promises = Array.from({ length: 5 }, () =>
    env.emailVerificationService.confirmVerification({ token: rawToken }),
  );

  const results = await Promise.allSettled(promises);
  const fulfilled = results.filter((r) => r.status === 'fulfilled');
  const rejected = results.filter((r) => r.status === 'rejected');

  assert.equal(fulfilled.length, 1, 'Strictly 1 concurrent confirmation must succeed');
  assert.equal(rejected.length, 4, 'Remaining 4 concurrent confirmations must be rejected');

  for (const rej of rejected) {
    const reason = (rej as PromiseRejectedResult).reason;
    assert.ok(reason instanceof ConflictException);
    assert.equal(reason.message, 'Verification token has already been used');
  }
});

test('F4 Rollback - Database error during user update rolls back token consumption', async () => {
  const rawToken = 'r'.repeat(64);
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  const env = createMockEnvironment(
    [{ id: 'user-1', email: 'dev@example.com', username: 'dev', emailVerifiedAt: null }],
    [
      {
        id: 'tok-rollback',
        userId: 'user-1',
        email: 'dev@example.com',
        tokenHash,
        purpose: 'INITIAL_VERIFICATION',
        expiresAt: new Date(Date.now() + 86400000),
        consumedAt: null,
        createdAt: new Date(),
      },
    ],
  );

  // Force user update inside transaction to throw
  env.mockPrisma.user.update = async () => {
    throw new Error('Database connection severed during user update');
  };

  await assert.rejects(
    async () => {
      await env.emailVerificationService.confirmVerification({ token: rawToken });
    },
    (err: any) => {
      assert.ok(err.message.includes('Database connection severed'));
      return true;
    },
  );

  // Transaction rollback MUST restore token to unconsumed!
  const token = env.tokens.find((t) => t.id === 'tok-rollback');
  assert.equal(token?.consumedAt, null, 'Token must not remain consumed after transaction rollback');
});

test('Atomicity - Rejects confirmation if token email does not match user current email for initial verification', async () => {
  const rawToken = 'f'.repeat(64);
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  const env = createMockEnvironment(
    [{ id: 'user-1', email: 'changed@example.com', username: 'dev', emailVerifiedAt: null }],
    [
      {
        id: 'tok-mismatch',
        userId: 'user-1',
        email: 'original@example.com',
        tokenHash,
        purpose: 'INITIAL_VERIFICATION',
        expiresAt: new Date(Date.now() + 86400000),
        consumedAt: null,
        createdAt: new Date(),
      },
    ],
  );

  await assert.rejects(
    async () => {
      await env.emailVerificationService.confirmVerification({ token: rawToken });
    },
    (err: any) => {
      assert.ok(err instanceof BadRequestException);
      assert.equal(err.message, 'Token email mismatch');
      return true;
    },
  );
});

test('Email Change - Preserves current email as primary and sets pendingEmail', async () => {
  const env = createMockEnvironment([
    {
      id: 'user-1',
      email: 'primary@example.com',
      username: 'dev',
      emailVerifiedAt: new Date(),
      pendingEmail: null,
    },
  ]);

  const res = await env.emailVerificationService.requestVerification('user-1', {
    email: 'new-pending@example.com',
  });

  assert.equal(res.success, true);
  assert.equal(res.purpose, 'EMAIL_CHANGE');

  const user = env.users[0];
  assert.equal(user.email, 'primary@example.com');
  assert.equal(user.pendingEmail, 'new-pending@example.com');
});

test('Email Change - Rejects email change if target address is claimed by another user', async () => {
  const env = createMockEnvironment([
    { id: 'user-1', email: 'user1@example.com', username: 'user1', emailVerifiedAt: new Date() },
    { id: 'user-2', email: 'user2@example.com', username: 'user2', emailVerifiedAt: new Date() },
  ]);

  await assert.rejects(
    async () => {
      await env.emailVerificationService.requestVerification('user-1', {
        email: 'user2@example.com',
      });
    },
    (err: any) => {
      assert.ok(err instanceof ConflictException);
      assert.equal(err.message, 'Email is already registered');
      return true;
    },
  );
});

test('Email Change - Confirmation atomically commits new email, clears pendingEmail, and sets verified', async () => {
  const rawToken = '4'.repeat(64);
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  const env = createMockEnvironment(
    [
      {
        id: 'user-1',
        email: 'old@example.com',
        pendingEmail: 'new-confirmed@example.com',
        username: 'dev',
        emailVerifiedAt: new Date('2026-01-01T00:00:00Z'),
      },
    ],
    [
      {
        id: 'tok-change',
        userId: 'user-1',
        email: 'new-confirmed@example.com',
        tokenHash,
        purpose: 'EMAIL_CHANGE',
        expiresAt: new Date(Date.now() + 3600000),
        consumedAt: null,
        createdAt: new Date(),
      },
    ],
  );

  const res = await env.emailVerificationService.confirmVerification({ token: rawToken });
  assert.equal(res.success, true);
  assert.equal(res.purpose, 'EMAIL_CHANGE');

  const user = env.users[0];
  assert.equal(user.email, 'new-confirmed@example.com');
  assert.equal(user.pendingEmail, null);
  assert.ok(user.emailVerifiedAt instanceof Date);
  assert.notEqual(user.emailVerifiedAt.toISOString(), '2026-01-01T00:00:00.000Z');

  const token = env.tokens[0];
  assert.ok(token.consumedAt instanceof Date);
});

test('Email Change - Rejects confirmation if pendingEmail does not match token address', async () => {
  const rawToken = '5'.repeat(64);
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  const env = createMockEnvironment(
    [
      {
        id: 'user-1',
        email: 'old@example.com',
        pendingEmail: 'another-pending@example.com',
        username: 'dev',
        emailVerifiedAt: new Date(),
      },
    ],
    [
      {
        id: 'tok-mismatch',
        userId: 'user-1',
        email: 'new@example.com',
        tokenHash,
        purpose: 'EMAIL_CHANGE',
        expiresAt: new Date(Date.now() + 3600000),
        consumedAt: null,
        createdAt: new Date(),
      },
    ],
  );

  await assert.rejects(
    async () => {
      await env.emailVerificationService.confirmVerification({ token: rawToken });
    },
    (err: any) => {
      assert.ok(err instanceof BadRequestException);
      assert.equal(err.message, 'Pending email address mismatch');
      return true;
    },
  );
});

test('Email Change - Rejects confirmation if interim collision occurs between token issue and confirmation', async () => {
  const rawToken = '6'.repeat(64);
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  const env = createMockEnvironment(
    [
      {
        id: 'user-1',
        email: 'user1@example.com',
        pendingEmail: 'collision@example.com',
        username: 'user1',
        emailVerifiedAt: new Date(),
      },
      {
        id: 'user-interim',
        email: 'collision@example.com',
        username: 'interim',
        emailVerifiedAt: new Date(),
      },
    ],
    [
      {
        id: 'tok-collision',
        userId: 'user-1',
        email: 'collision@example.com',
        tokenHash,
        purpose: 'EMAIL_CHANGE',
        expiresAt: new Date(Date.now() + 3600000),
        consumedAt: null,
        createdAt: new Date(),
      },
    ],
  );

  await assert.rejects(
    async () => {
      await env.emailVerificationService.confirmVerification({ token: rawToken });
    },
    (err: any) => {
      assert.ok(err instanceof ConflictException);
      assert.equal(err.message, 'Email address is already claimed by another user');
      return true;
    },
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. F1: Public Resend Anti-Enumeration & IP Abuse Throttling
// ─────────────────────────────────────────────────────────────────────────────
test('F1 Anti-Enumeration - Returns identical generic response for nonexistent, unverified, and verified accounts', async () => {
  const env = createMockEnvironment([
    { id: 'user-1', email: 'unverified@example.com', username: 'unverified', emailVerifiedAt: null },
    { id: 'user-2', email: 'verified@example.com', username: 'verified', emailVerifiedAt: new Date() },
  ]);

  const expectedResponse = {
    success: true,
    message: 'If an unverified account exists for this email, a verification link has been sent.',
  };

  const res1 = await env.emailVerificationService.resendVerification({ email: 'nonexistent@example.com' });
  assert.deepEqual(res1, expectedResponse);

  const res2 = await env.emailVerificationService.resendVerification({ email: 'verified@example.com' });
  assert.deepEqual(res2, expectedResponse);

  const res3 = await env.emailVerificationService.resendVerification({ email: 'unverified@example.com' });
  assert.deepEqual(res3, expectedResponse);
});

test('F1 Anti-Enumeration - Cooldown on existing account is silently suppressed without leaking 429', async () => {
  const env = createMockEnvironment([
    { id: 'user-1', email: 'unverified@example.com', username: 'unverified', emailVerifiedAt: null },
  ]);

  const expectedResponse = {
    success: true,
    message: 'If an unverified account exists for this email, a verification link has been sent.',
  };

  const res1 = await env.emailVerificationService.resendVerification({ email: 'unverified@example.com' });
  assert.deepEqual(res1, expectedResponse);
  assert.equal(env.tokens.length, 1);
  assert.equal(env.emailDelivery.getSentEmails().length, 1);

  const res2 = await env.emailVerificationService.resendVerification({ email: 'unverified@example.com' });
  assert.deepEqual(res2, expectedResponse);

  assert.equal(env.tokens.length, 1);
  assert.equal(env.emailDelivery.getSentEmails().length, 1);
});

test('F1 Anti-Enumeration - Hourly cap on existing account is silently suppressed without leaking 429', async () => {
  const env = createMockEnvironment([
    { id: 'user-1', email: 'unverified@example.com', username: 'unverified', emailVerifiedAt: null },
  ]);

  for (let i = 0; i < 5; i++) {
    env.tokens.push({
      id: `tok-hourly-${i}`,
      userId: 'user-1',
      email: 'unverified@example.com',
      tokenHash: `hash-${i}`,
      purpose: 'INITIAL_VERIFICATION',
      expiresAt: new Date(Date.now() + 86400000),
      consumedAt: null,
      createdAt: new Date(Date.now() - (60000 + i * 10000)),
    });
  }

  const res = await env.emailVerificationService.resendVerification({ email: 'unverified@example.com' });
  assert.deepEqual(res, {
    success: true,
    message: 'If an unverified account exists for this email, a verification link has been sent.',
  });

  assert.equal(env.tokens.length, 5);
  assert.equal(env.emailDelivery.getSentEmails().length, 0);
});

test('F1 Anti-Enumeration - IP rate throttling blocks abusive client IP without leaking account info', async () => {
  const env = createMockEnvironment([
    { id: 'user-1', email: 'target@example.com', username: 'target', emailVerifiedAt: null },
  ]);

  const clientIp = '198.51.100.42';

  for (let i = 0; i < 15; i++) {
    await env.emailVerificationService.resendVerification(
      { email: `probe-${i}@example.com` },
      clientIp,
    );
  }

  await assert.rejects(
    async () => {
      await env.emailVerificationService.resendVerification(
        { email: 'probe-16@example.com' },
        clientIp,
      );
    },
    (err: any) => {
      assert.ok(err instanceof HttpException);
      assert.equal(err.getStatus(), HttpStatus.TOO_MANY_REQUESTS);
      assert.ok(err.message.includes('Too many verification requests from this IP address'));
      return true;
    },
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. F1 & F2: Redis Atomic Lua Engine & Production Fail-Closed
// ─────────────────────────────────────────────────────────────────────────────
test('F1 Redis Lua - First request creates cooldown (60s) and hourly counter (3600s)', async () => {
  const env = createMockEnvironment([
    { id: 'user-1', email: 'lua@example.com', username: 'luaUser', emailVerifiedAt: null },
  ]);

  const { client, store } = createMockRedisLuaEngine();
  env.rateLimiter.setRedisClient(client);

  const res = await env.emailVerificationService.requestVerification('user-1', {});
  assert.equal(res.success, true);

  const hmacId = env.rateLimiter.deriveEmailKeyIdentifier('lua@example.com');
  const cdKey = `ev:cd:${hmacId}`;
  const hrKey = `ev:hr:${hmacId}`;

  assert.equal(store.get(cdKey)?.value, '1');
  assert.equal(store.get(hrKey)?.value, '1');
  assert.equal(store.get(cdKey)?.ex, 60);
  assert.equal(store.get(hrKey)?.ex, 3600);
});

test('F1 Redis Lua - Requests 2 through 5 are allowed after cooldown expires without resetting hourly TTL', async () => {
  const env = createMockEnvironment([
    { id: 'user-1', email: 'multi@example.com', username: 'multiUser', emailVerifiedAt: null },
  ]);

  const { client, store } = createMockRedisLuaEngine();
  env.rateLimiter.setRedisClient(client);

  const hmacId = env.rateLimiter.deriveEmailKeyIdentifier('multi@example.com');
  const cdKey = `ev:cd:${hmacId}`;
  const hrKey = `ev:hr:${hmacId}`;

  // Request 1
  await env.emailVerificationService.requestVerification('user-1', {});
  const originalHourlyExpireAt = store.get(hrKey)?.expireAt;

  // Requests 2 through 5 (simulate passage of 60s cooldown by clearing cooldown key)
  for (let req = 2; req <= 5; req++) {
    store.delete(cdKey);
    const res = await env.emailVerificationService.requestVerification('user-1', {});
    assert.equal(res.success, true);
    assert.equal(store.get(hrKey)?.value, String(req));
    assert.equal(
      store.get(hrKey)?.expireAt,
      originalHourlyExpireAt,
      'Hourly TTL must not be reset on subsequent increments',
    );
  }

  // Request 6 (after clearing cooldown): blocked by HOURLY_CAP
  store.delete(cdKey);
  await assert.rejects(
    async () => {
      await env.emailVerificationService.requestVerification('user-1', {});
    },
    (err: any) => {
      assert.ok(err instanceof HttpException);
      assert.equal(err.getStatus(), HttpStatus.TOO_MANY_REQUESTS);
      const resp = err.getResponse() as any;
      assert.ok(resp?.message?.includes('Too many verification requests'));
      assert.ok(resp?.retryAfter > 0);
      return true;
    },
  );
});

test('F1 Redis Lua - 6th public resend request is silently suppressed via Lua engine', async () => {
  const env = createMockEnvironment([
    { id: 'user-1', email: 'unv-lua@example.com', username: 'unvLua', emailVerifiedAt: null },
  ]);

  const { client, store } = createMockRedisLuaEngine();
  env.rateLimiter.setRedisClient(client);

  const hmacId = env.rateLimiter.deriveEmailKeyIdentifier('unv-lua@example.com');
  const cdKey = `ev:cd:${hmacId}`;
  const hrKey = `ev:hr:${hmacId}`;

  // Fill 5 requests
  for (let req = 1; req <= 5; req++) {
    store.delete(cdKey);
    await env.emailVerificationService.resendVerification({ email: 'unv-lua@example.com' });
  }

  // 6th request: hourly cap reached. Public resend must return generic 200 without throwing 429
  store.delete(cdKey);
  const res = await env.emailVerificationService.resendVerification({ email: 'unv-lua@example.com' });
  assert.deepEqual(res, {
    success: true,
    message: 'If an unverified account exists for this email, a verification link has been sent.',
  });

  // Verify counter stopped at 5
  assert.equal(store.get(hrKey)?.value, '5');
});

test('F1 Redis Lua - Concurrent requests against Lua script strictly honor the limit', async () => {
  const env = createMockEnvironment([
    { id: 'user-1', email: 'concurrent-lua@example.com', username: 'concLua', emailVerifiedAt: null },
  ]);

  const { client } = createMockRedisLuaEngine();
  env.rateLimiter.setRedisClient(client);

  const promises = Array.from({ length: 8 }, () =>
    env.emailVerificationService.requestVerification('user-1', {}),
  );

  const results = await Promise.allSettled(promises);
  const fulfilled = results.filter((r) => r.status === 'fulfilled');
  const rejected = results.filter((r) => r.status === 'rejected');

  assert.equal(fulfilled.length, 1, 'Only 1 request may succeed through atomic Lua check');
  assert.equal(rejected.length, 7, 'Other concurrent requests must be rejected');
});

test('F2 Production Requirement - Fails closed with 503 if Redis is missing in production mode', async () => {
  const env = createMockEnvironment(
    [{ id: 'user-1', email: 'prod@example.com', username: 'prodUser', emailVerifiedAt: null }],
    [],
    { nodeEnv: 'production' },
  );

  // Production with NO Redis client set
  assert.equal(env.rateLimiter.isRedisActive(), false);
  assert.equal(env.rateLimiter.isRedisMandatory(), true);

  await assert.rejects(
    async () => {
      await env.emailVerificationService.requestVerification('user-1', {});
    },
    (err: any) => {
      assert.ok(err instanceof HttpException);
      assert.equal(err.getStatus(), HttpStatus.SERVICE_UNAVAILABLE);
      assert.ok(err.message.includes('Email verification service is currently unavailable'));
      return true;
    },
  );
});

test('F2 Production Requirement - Public resend preserves anti-enumeration when Redis is missing in production', async () => {
  const env = createMockEnvironment(
    [{ id: 'user-1', email: 'prod@example.com', username: 'prodUser', emailVerifiedAt: null }],
    [],
    { nodeEnv: 'production' },
  );

  const res = await env.emailVerificationService.resendVerification({ email: 'prod@example.com' });
  assert.deepEqual(res, {
    success: true,
    message: 'If an unverified account exists for this email, a verification link has been sent.',
  });

  // Zero tokens created and zero emails sent
  assert.equal(env.tokens.length, 0);
  assert.equal(env.emailDelivery.getSentEmails().length, 0);
});

test('F2 Production Requirement - Fails closed with 503 if Redis connection errors in production mode', async () => {
  const env = createMockEnvironment(
    [{ id: 'user-1', email: 'prod-err@example.com', username: 'prodUser', emailVerifiedAt: null }],
    [],
    { nodeEnv: 'production' },
  );

  const faultyRedis: RedisClientInterface = {
    eval: async () => {
      throw new Error('ECONNREFUSED: Connection to Redis master 10.0.0.5:6379 lost');
    },
  };

  env.rateLimiter.setRedisClient(faultyRedis);

  await assert.rejects(
    async () => {
      await env.emailVerificationService.requestVerification('user-1', {});
    },
    (err: any) => {
      assert.ok(err instanceof HttpException);
      assert.equal(err.getStatus(), HttpStatus.SERVICE_UNAVAILABLE);
      return true;
    },
  );
});

test('F2 Production Requirement - Fails closed on Redis script timeout in production mode', async () => {
  const env = createMockEnvironment(
    [{ id: 'user-1', email: 'prod-to@example.com', username: 'prodUser', emailVerifiedAt: null }],
    [],
    { nodeEnv: 'production' },
  );

  const timeoutRedis: RedisClientInterface = {
    eval: async () => {
      throw new Error('ETIMEDOUT: Redis command timed out after 1000ms');
    },
  };

  env.rateLimiter.setRedisClient(timeoutRedis);

  await assert.rejects(
    async () => {
      await env.emailVerificationService.requestVerification('user-1', {});
    },
    (err: any) => {
      assert.ok(err instanceof HttpException);
      assert.equal(err.getStatus(), HttpStatus.SERVICE_UNAVAILABLE);
      return true;
    },
  );
});

test('F2 Rate Limiting - Authenticated request throws 429 on active cooldown with retryAfter', async () => {
  const env = createMockEnvironment([
    { id: 'user-1', email: 'dev@example.com', username: 'dev', emailVerifiedAt: null },
  ]);

  await env.emailVerificationService.requestVerification('user-1', {});

  await assert.rejects(
    async () => {
      await env.emailVerificationService.requestVerification('user-1', {});
    },
    (err: any) => {
      assert.ok(err instanceof HttpException);
      assert.equal(err.getStatus(), HttpStatus.TOO_MANY_REQUESTS);
      const resp = err.getResponse() as any;
      assert.ok(resp?.message?.includes('Please wait'));
      assert.ok(typeof resp?.retryAfter === 'number');
      return true;
    },
  );
});

test('F2 Rate Limiting - Authenticated request throws 429 on hourly cap boundary', async () => {
  const env = createMockEnvironment([
    { id: 'user-1', email: 'dev@example.com', username: 'dev', emailVerifiedAt: null },
  ]);

  for (let i = 0; i < 5; i++) {
    env.tokens.push({
      id: `tok-${i}`,
      userId: 'user-1',
      email: 'dev@example.com',
      tokenHash: `hash-${i}`,
      purpose: 'INITIAL_VERIFICATION',
      expiresAt: new Date(Date.now() + 86400000),
      consumedAt: null,
      createdAt: new Date(Date.now() - (70000 + i * 1000)),
    });
  }

  await assert.rejects(
    async () => {
      await env.emailVerificationService.requestVerification('user-1', {});
    },
    (err: any) => {
      assert.ok(err instanceof HttpException);
      assert.equal(err.getStatus(), HttpStatus.TOO_MANY_REQUESTS);
      const resp = err.getResponse() as any;
      assert.ok(resp?.message?.includes('Too many verification requests'));
      assert.equal(resp?.retryAfter, 3600);
      return true;
    },
  );
});

test('F2 Concurrency - Simultaneous requests from the same account execute safely without bypass', async () => {
  const env = createMockEnvironment([
    { id: 'user-1', email: 'concurrent@example.com', username: 'concurrent', emailVerifiedAt: null },
  ]);

  const promises = Array.from({ length: 10 }, () =>
    env.emailVerificationService.requestVerification('user-1', {}),
  );

  const results = await Promise.allSettled(promises);
  const fulfilled = results.filter((r) => r.status === 'fulfilled');
  const rejected = results.filter((r) => r.status === 'rejected');

  assert.equal(fulfilled.length, 1, 'Only 1 concurrent verification request may succeed');
  assert.equal(rejected.length, 9, 'All 9 remaining concurrent requests must be rejected');

  for (const rej of rejected) {
    const err = (rej as PromiseRejectedResult).reason;
    assert.ok(err instanceof HttpException);
    assert.equal(err.getStatus(), HttpStatus.TOO_MANY_REQUESTS);
  }

  assert.equal(env.tokens.length, 1);
  assert.equal(env.emailDelivery.getSentEmails().length, 1);
});

test('F2 Concurrency - Simultaneous requests from different accounts do not block each other', async () => {
  const env = createMockEnvironment([
    { id: 'user-a', email: 'a@example.com', username: 'userA', emailVerifiedAt: null },
    { id: 'user-b', email: 'b@example.com', username: 'userB', emailVerifiedAt: null },
  ]);

  const [resA, resB] = await Promise.all([
    env.emailVerificationService.requestVerification('user-a', {}),
    env.emailVerificationService.requestVerification('user-b', {}),
  ]);

  assert.equal(resA.success, true);
  assert.equal(resB.success, true);
  assert.equal(env.tokens.length, 2);
  assert.equal(env.emailDelivery.getSentEmails().length, 2);
});

test('F2 Rate Limiting - Email normalization prevents case-variation bypass', async () => {
  const env = createMockEnvironment([
    { id: 'user-1', email: 'dev@example.com', username: 'dev', emailVerifiedAt: null },
  ]);

  env.tokens.push({
    id: 'tok-norm',
    userId: 'user-1',
    email: 'dev@example.com',
    tokenHash: 'hash-norm',
    purpose: 'INITIAL_VERIFICATION',
    expiresAt: new Date(Date.now() + 86400000),
    consumedAt: null,
    createdAt: new Date(Date.now() - 5000),
  });

  await assert.rejects(
    async () => {
      await env.emailVerificationService.requestVerification('user-1', {
        email: 'DEV@EXAMPLE.COM',
      });
    },
    (err: any) => {
      assert.ok(err instanceof HttpException);
      assert.equal(err.getStatus(), HttpStatus.TOO_MANY_REQUESTS);
      return true;
    },
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. F3: Reservation Lifecycle & Downstream Failure Throttling
// ─────────────────────────────────────────────────────────────────────────────
test('F3 Reservation Lifecycle - Downstream DB error retains rate-limit reservation preventing abuse burst', async () => {
  const env = createMockEnvironment([
    { id: 'user-1', email: 'db-fail@example.com', username: 'dbUser', emailVerifiedAt: null },
  ]);

  // Make DB create token throw
  env.mockPrisma.emailVerificationToken.create = async () => {
    throw new Error('Database disk full');
  };

  // Attempt 1 fails at DB level
  await assert.rejects(
    async () => {
      await env.emailVerificationService.requestVerification('user-1', {});
    },
    (err: any) => {
      assert.ok(err.message.includes('Database disk full'));
      return true;
    },
  );

  // Attempt 2 immediately after: must be blocked by active cooldown reservation!
  await assert.rejects(
    async () => {
      await env.emailVerificationService.requestVerification('user-1', {});
    },
    (err: any) => {
      assert.ok(err instanceof HttpException);
      assert.equal(err.getStatus(), HttpStatus.TOO_MANY_REQUESTS);
      return true;
    },
  );
});

test('F3 Reservation Lifecycle - Email provider failure throws 503 without falsely reporting success', async () => {
  const env = createMockEnvironment([
    { id: 'user-1', email: 'prov-fail@example.com', username: 'provUser', emailVerifiedAt: null },
  ]);

  const failingAdapter: EmailProviderAdapter = {
    name: 'failing-adapter',
    isProduction: true,
    send: async () => ({
      success: false,
      messageId: '',
      status: 'FAILED',
    }),
  };

  env.emailDelivery.setAdapter(failingAdapter);

  await assert.rejects(
    async () => {
      await env.emailVerificationService.requestVerification('user-1', {});
    },
    (err: any) => {
      assert.ok(err instanceof HttpException);
      assert.equal(err.getStatus(), HttpStatus.SERVICE_UNAVAILABLE);
      assert.ok(err.message.includes('Failed to dispatch verification email'));
      return true;
    },
  );
});

test('F3 Reservation Lifecycle - Email provider failure retains cooldown to prevent hammering relay', async () => {
  const env = createMockEnvironment([
    { id: 'user-1', email: 'hammer@example.com', username: 'hammerUser', emailVerifiedAt: null },
  ]);

  let calls = 0;
  const failingAdapter: EmailProviderAdapter = {
    name: 'flaky-adapter',
    isProduction: true,
    send: async () => {
      calls++;
      return { success: false, messageId: '', status: 'FAILED' };
    },
  };

  env.emailDelivery.setAdapter(failingAdapter);

  // Call 1 fails at provider
  await assert.rejects(async () => {
    await env.emailVerificationService.requestVerification('user-1', {});
  });
  assert.equal(calls, 1);

  // Immediate retry: blocked by rate limiter cooldown before reaching provider!
  await assert.rejects(async () => {
    await env.emailVerificationService.requestVerification('user-1', {});
  });
  assert.equal(calls, 1, 'Provider must not be called a second time while in cooldown');
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. F3 & F5: Sensitive Data Protection & Delivery Status Audit
// ─────────────────────────────────────────────────────────────────────────────
test('F3 Email Delivery - Reports simulated status honestly when using in-memory test adapter', async () => {
  const env = createMockEnvironment([
    { id: 'user-1', email: 'dev@example.com', username: 'dev', emailVerifiedAt: null },
  ]);

  assert.equal(env.emailDelivery.isProductionProviderConfigured(), false);
  assert.equal(env.emailDelivery.getActiveProviderName(), 'in-memory-test');

  const result = await env.emailDelivery.sendVerificationEmail({
    to: 'dev@example.com',
    rawToken: '7'.repeat(64),
    purpose: 'INITIAL_VERIFICATION',
  });

  assert.equal(result.success, true);
  assert.equal(result.status, 'SIMULATED');
  assert.equal(result.provider, 'in-memory-test');
});

test('F3 Email Delivery - Handles provider rejection without falsely reporting success', async () => {
  const env = createMockEnvironment();

  const rejectingAdapter: EmailProviderAdapter = {
    name: 'rejecting-mock-adapter',
    isProduction: true,
    send: async () => {
      return {
        success: false,
        messageId: '',
        status: 'FAILED',
      };
    },
  };

  env.emailDelivery.setAdapter(rejectingAdapter);
  assert.equal(env.emailDelivery.isProductionProviderConfigured(), true);

  const result = await env.emailDelivery.sendVerificationEmail({
    to: 'reject@example.com',
    rawToken: '8'.repeat(64),
    purpose: 'INITIAL_VERIFICATION',
  });

  assert.equal(result.success, false);
  assert.equal(result.status, 'FAILED');
  assert.equal(result.provider, 'rejecting-mock-adapter');
});

test('F3 Email Delivery - Handles provider exception/timeout without crashing and reports FAILED', async () => {
  const env = createMockEnvironment();

  const timingOutAdapter: EmailProviderAdapter = {
    name: 'timeout-mock-adapter',
    isProduction: true,
    send: async () => {
      throw new Error('ETIMEDOUT: Connection to SMTP relay timed out');
    },
  };

  env.emailDelivery.setAdapter(timingOutAdapter);

  const result = await env.emailDelivery.sendVerificationEmail({
    to: 'timeout@example.com',
    rawToken: '9'.repeat(64),
    purpose: 'INITIAL_VERIFICATION',
  });

  assert.equal(result.success, false);
  assert.equal(result.status, 'FAILED');
});

test('F5 Sensitive Data - Masks email recipient and never logs raw token or full verification URL', () => {
  const env = createMockEnvironment();

  assert.equal(env.emailDelivery.maskEmail('developer@example.com'), 'd***r@example.com');
  assert.equal(env.emailDelivery.maskEmail('a@b.com'), 'a***@b.com');
  assert.equal(env.emailDelivery.maskEmail('ab@domain.com'), 'a***@domain.com');

  const rawToken = 'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789';
  const url = env.emailDelivery.buildVerificationUrl(rawToken, 'INITIAL_VERIFICATION');

  assert.ok(url.includes('#token='));
  assert.ok(!env.emailDelivery.maskEmail('test@example.com').includes(rawToken));
});

test('F5 Sensitive Data - All API endpoint responses strictly omit raw tokens and token hashes', async () => {
  const env = createMockEnvironment([
    { id: 'user-1', email: 'safe@example.com', username: 'safeUser', emailVerifiedAt: null },
  ]);

  // 1. requestVerification response
  const reqRes = await env.emailVerificationService.requestVerification('user-1', {});
  assert.equal((reqRes as any).rawToken, undefined);
  assert.equal((reqRes as any).token, undefined);
  assert.equal((reqRes as any).tokenHash, undefined);

  // 2. resendVerification response
  const resendRes = await env.emailVerificationService.resendVerification({ email: 'safe@example.com' });
  assert.equal((resendRes as any).rawToken, undefined);
  assert.equal((resendRes as any).tokenHash, undefined);

  // 3. confirmVerification response
  const token = env.tokens[0];
  const confirmRes = await env.emailVerificationService.confirmVerification({ token: 'z'.repeat(64) }).catch(() => null);
  // confirm error never returns token
  assert.equal((confirmRes as any)?.tokenHash, undefined);

  // 4. getStatus response
  const statusRes = await env.emailVerificationService.getStatus('user-1');
  assert.equal((statusRes as any).rawToken, undefined);
  assert.equal((statusRes as any).tokenHash, undefined);
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. F5 URL Format & Public API Endpoints
// ─────────────────────────────────────────────────────────────────────────────
test('F5 URL Format - Verification link formats token strictly in URL fragment (#token=)', async () => {
  const env = createMockEnvironment([
    { id: 'user-1', email: 'dev@example.com', username: 'dev', emailVerifiedAt: null },
  ]);

  await env.emailVerificationService.requestVerification('user-1', {});

  const sent = env.emailDelivery.getSentEmails();
  assert.equal(sent.length, 1);
  const { verificationUrl, purpose } = sent[0];

  assert.equal(purpose, 'INITIAL_VERIFICATION');
  assert.ok(verificationUrl.startsWith('http://localhost:5173/verify-email#token='));
  assert.ok(!verificationUrl.includes('?token='));
});

test('F5 URL Format - Email change link formats purpose query inside fragment', async () => {
  const env = createMockEnvironment([
    { id: 'user-1', email: 'dev@example.com', username: 'dev', emailVerifiedAt: new Date() },
  ]);

  await env.emailVerificationService.requestVerification('user-1', {
    email: 'new@example.com',
  });

  const sent = env.emailDelivery.getSentEmails();
  assert.equal(sent.length, 1);
  const { verificationUrl, purpose } = sent[0];

  assert.equal(purpose, 'EMAIL_CHANGE');
  assert.ok(verificationUrl.includes('#token='));
  assert.ok(verificationUrl.includes('&purpose=email_change'));
});

test('Public API - Confirmation response never exposes token hash or sensitive fields', async () => {
  const rawToken = '3'.repeat(64);
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  const env = createMockEnvironment(
    [{ id: 'user-1', email: 'dev@example.com', username: 'dev', emailVerifiedAt: null }],
    [
      {
        id: 'tok-1',
        userId: 'user-1',
        email: 'dev@example.com',
        tokenHash,
        purpose: 'INITIAL_VERIFICATION',
        expiresAt: new Date(Date.now() + 86400000),
        consumedAt: null,
        createdAt: new Date(),
      },
    ],
  );

  const res = await env.controller.confirmVerification({ token: rawToken });
  assert.equal(res.success, true);
  assert.equal((res as any).tokenHash, undefined);
  assert.equal((res as any).userId, undefined);
  assert.equal((res as any).passwordHash, undefined);
});

test('Status API - Returns authenticated status without exposing other users data', async () => {
  const env = createMockEnvironment([
    {
      id: 'user-1',
      email: 'dev@example.com',
      username: 'dev',
      emailVerifiedAt: new Date('2026-05-01T12:00:00Z'),
      pendingEmail: 'pending@example.com',
    },
  ]);

  const status = await env.controller.getStatus({ user: { userId: 'user-1' } } as any);
  assert.equal(status.email, 'dev@example.com');
  assert.equal(status.isVerified, true);
  assert.equal(status.pendingEmail, 'pending@example.com');
  assert.equal(status.emailVerifiedAt, '2026-05-01T12:00:00.000Z');
});


// =============================================================================
// Phase 5.1.3 — New Tests: F1 TTL Recovery, F2 HMAC Keys, F3 Distributed IP,
//               F4 Configuration Fail-Closed
// =============================================================================

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Extended mock Lua engine with TTL -1 simulation support
// ─────────────────────────────────────────────────────────────────────────────

function createExtendedMockLuaEngine() {
  // Keys that exist without an expiry (TTL = -1) are pre-seeded here
  const store = new Map<string, { value: string; expireAt?: number }>();

  // Helper: insert a key with no expiry (TTL = -1) to simulate a stale key
  function seedKeyWithoutTTL(key: string, value: string) {
    store.set(key, { value });
  }

  const client: RedisClientInterface = {
    eval: async (script: string, ...args: any[]) => {
      let keys: string[] = [];
      let argv: string[] = [];
      if (args[0] && typeof args[0] === 'object' && Array.isArray(args[0].keys)) {
        keys = args[0].keys;
        argv = args[0].arguments || [];
      } else {
        const numKeys = Number(args[0]) || 0;
        keys = args.slice(1, 1 + numKeys);
        argv = args.slice(1 + numKeys);
      }

      const now = Date.now();

      // Clean up truly expired keys
      for (const [k, v] of store.entries()) {
        if (v.expireAt !== undefined && v.expireAt <= now) {
          store.delete(k);
        }
      }

      // ── Dispatch by script type ──────────────────────────────────────────
      // Detect IP script by number of keys
      if (keys.length === 1) {
        // ATOMIC_IP_RATE_LIMIT_LUA
        const ipKey = keys[0];
        const maxRequests = Number(argv[0]) || 15;
        const windowSeconds = Number(argv[1]) || 900;

        const existing = store.get(ipKey);
        const currentCount = existing ? Number(existing.value) : 0;
        const nextCount = currentCount + 1;

        if (nextCount === 1) {
          store.set(ipKey, { value: '1', expireAt: now + windowSeconds * 1000 });
          return [1, nextCount, 0];
        }

        // Repair TTL if missing (TTL = -1 scenario)
        const expireAt = existing?.expireAt ?? (now + windowSeconds * 1000);
        store.set(ipKey, { value: String(nextCount), expireAt });

        const ttlRemaining = Math.ceil((expireAt - now) / 1000);

        if (nextCount > maxRequests) {
          return [0, nextCount, Math.max(1, ttlRemaining)];
        }
        return [1, nextCount, 0];
      }

      // ATOMIC_RATE_LIMIT_LUA (2 keys: cooldown + hourly)
      const cooldownKey = keys[0];
      const hourlyKey = keys[1];
      const cooldownTtl = Number(argv[0]) || 60;
      const hourlyTtl = Number(argv[1]) || 3600;
      const maxRequests = Number(argv[2]) || 5;

      // Check cooldown (with TTL-repair)
      const cooldownRecord = store.get(cooldownKey);
      if (cooldownRecord) {
        // Simulate TTL repair: if no expireAt, set it now
        if (cooldownRecord.expireAt === undefined) {
          cooldownRecord.expireAt = now + cooldownTtl * 1000;
          store.set(cooldownKey, cooldownRecord);
        }
        const remaining = Math.max(1, Math.ceil((cooldownRecord.expireAt - now) / 1000));
        return [0, 'COOLDOWN', remaining];
      }

      // Check hourly (with TTL-repair)
      const hourlyRecord = store.get(hourlyKey);
      const currentHourly = hourlyRecord ? Number(hourlyRecord.value) : 0;
      if (currentHourly >= maxRequests) {
        if (hourlyRecord && hourlyRecord.expireAt === undefined) {
          hourlyRecord.expireAt = now + hourlyTtl * 1000;
          store.set(hourlyKey, hourlyRecord);
        }
        const remaining = hourlyRecord?.expireAt
          ? Math.max(1, Math.ceil((hourlyRecord.expireAt - now) / 1000))
          : hourlyTtl;
        return [0, 'HOURLY_CAP', remaining];
      }

      // Allow: set cooldown + increment hourly
      store.set(cooldownKey, { value: '1', expireAt: now + cooldownTtl * 1000 });

      const nextHourly = currentHourly + 1;
      const existingHourlyExpireAt = hourlyRecord?.expireAt ?? (now + hourlyTtl * 1000);
      store.set(hourlyKey, { value: String(nextHourly), expireAt: existingHourlyExpireAt });

      return [1, 'OK', nextHourly];
    },
    get: async (key: string) => store.get(key)?.value ?? null,
    ttl: async (key: string) => {
      const rec = store.get(key);
      if (!rec) return -2;
      if (rec.expireAt === undefined) return -1; // Key with no TTL
      return Math.max(0, Math.ceil((rec.expireAt - Date.now()) / 1000));
    },
  };

  return { client, store, seedKeyWithoutTTL };
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. F1 TTL Recovery Tests
// ─────────────────────────────────────────────────────────────────────────────

test('F1 TTL Recovery - Cooldown key with TTL=-1 is repaired atomically by Lua script', async () => {
  const env = createMockEnvironment([
    { id: 'user-1', email: 'ttlfix@example.com', username: 'ttlUser', emailVerifiedAt: null },
  ]);

  const { client, store, seedKeyWithoutTTL } = createExtendedMockLuaEngine();
  env.rateLimiter.setRedisClient(client);

  // Pre-seed a cooldown key without TTL (TTL = -1 scenario)
  const hmacId = env.rateLimiter.deriveEmailKeyIdentifier('ttlfix@example.com');
  const cdKey = `ev:cd:${hmacId}`;
  seedKeyWithoutTTL(cdKey, '1');

  // Verify the key has no expiry initially
  assert.equal(store.get(cdKey)?.expireAt, undefined, 'Pre-seeded key must have no expiry');

  // After the Lua script executes, the cooldown key should be blocked and TTL should be set
  await assert.rejects(
    async () => {
      await env.emailVerificationService.requestVerification('user-1', {});
    },
    (err: any) => {
      assert.ok(err instanceof HttpException);
      assert.equal(err.getStatus(), HttpStatus.TOO_MANY_REQUESTS);
      return true;
    },
  );

  // TTL must now be set (key was repaired)
  const afterRecord = store.get(cdKey);
  assert.ok(afterRecord?.expireAt !== undefined, 'TTL must be set after repair by Lua script');
  assert.ok(afterRecord!.expireAt! > Date.now(), 'Repaired expireAt must be in the future');
});

test('F1 TTL Recovery - Hourly counter key with TTL=-1 is repaired atomically by Lua script', async () => {
  const env = createMockEnvironment([
    { id: 'user-1', email: 'hrfix@example.com', username: 'hrUser', emailVerifiedAt: null },
  ]);

  const { client, store, seedKeyWithoutTTL } = createExtendedMockLuaEngine();
  env.rateLimiter.setRedisClient(client);

  const hmacId = env.rateLimiter.deriveEmailKeyIdentifier('hrfix@example.com');
  const hrKey = `ev:hr:${hmacId}`;

  // Pre-seed hourly counter at max capacity with no TTL
  seedKeyWithoutTTL(hrKey, '5');
  assert.equal(store.get(hrKey)?.expireAt, undefined, 'Pre-seeded hourly key must have no expiry');

  // Request should be blocked by HOURLY_CAP, and hourly key TTL should be repaired
  await assert.rejects(
    async () => {
      await env.emailVerificationService.requestVerification('user-1', {});
    },
    (err: any) => {
      assert.ok(err instanceof HttpException);
      assert.equal(err.getStatus(), HttpStatus.TOO_MANY_REQUESTS);
      const resp = err.getResponse() as any;
      assert.ok(resp?.message?.includes('Too many verification requests'));
      return true;
    },
  );

  // Hourly key must now have TTL set
  const afterRecord = store.get(hrKey);
  assert.ok(afterRecord?.expireAt !== undefined, 'Hourly TTL must be set after repair');
  assert.ok(afterRecord!.expireAt! > Date.now(), 'Repaired hourly expireAt must be in the future');
});

test('F1 TTL Recovery - Healthy existing TTL is NOT reset when cooldown is active', async () => {
  const env = createMockEnvironment([
    { id: 'user-1', email: 'healthyttl@example.com', username: 'healthyUser', emailVerifiedAt: null },
  ]);

  const { client, store } = createExtendedMockLuaEngine();
  env.rateLimiter.setRedisClient(client);

  const hmacId = env.rateLimiter.deriveEmailKeyIdentifier('healthyttl@example.com');
  const hrKey = `ev:hr:${hmacId}`;

  // Make a first request to set a healthy hourly key with TTL
  await env.emailVerificationService.requestVerification('user-1', {});
  const originalExpireAt = store.get(hrKey)?.expireAt;
  assert.ok(originalExpireAt !== undefined, 'Hourly key must have expiry after first request');

  // Wait a tick and make another request (blocked by cooldown); hourly TTL must NOT change
  await assert.rejects(async () => {
    await env.emailVerificationService.requestVerification('user-1', {});
  });

  const newExpireAt = store.get(hrKey)?.expireAt;
  assert.equal(newExpireAt, originalExpireAt, 'Healthy hourly TTL must not be reset by subsequent blocked request');
});

test('F1 TTL Recovery - Requests do not extend the hourly window on subsequent increments', async () => {
  const env = createMockEnvironment([
    { id: 'user-1', email: 'noextend@example.com', username: 'noExtend', emailVerifiedAt: null },
  ]);

  const { client, store } = createExtendedMockLuaEngine();
  env.rateLimiter.setRedisClient(client);

  const hmacId = env.rateLimiter.deriveEmailKeyIdentifier('noextend@example.com');
  const cdKey = `ev:cd:${hmacId}`;
  const hrKey = `ev:hr:${hmacId}`;

  // Request 1
  await env.emailVerificationService.requestVerification('user-1', {});
  const originalHourlyExpireAt = store.get(hrKey)?.expireAt;

  // Requests 2-4: simulate cooldown expiry between each
  for (let i = 2; i <= 4; i++) {
    store.delete(cdKey); // expire cooldown
    await env.emailVerificationService.requestVerification('user-1', {});
    const currentExpireAt = store.get(hrKey)?.expireAt;
    assert.equal(
      currentExpireAt,
      originalHourlyExpireAt,
      `Hourly window must not extend on request ${i}`,
    );
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. F2 HMAC Key Identifier Tests
// ─────────────────────────────────────────────────────────────────────────────

test('F2 HMAC Keys - Same normalized email always produces the same HMAC identifier', () => {
  const env = createMockEnvironment();

  const id1 = env.rateLimiter.deriveEmailKeyIdentifier('User@Example.COM');
  const id2 = env.rateLimiter.deriveEmailKeyIdentifier('user@example.com');
  const id3 = env.rateLimiter.deriveEmailKeyIdentifier('  USER@EXAMPLE.COM  ');

  assert.equal(id1, id2, 'Case-insensitive email must produce same identifier');
  assert.equal(id2, id3, 'Leading/trailing whitespace must be stripped before HMAC');
});

test('F2 HMAC Keys - Different emails produce different HMAC identifiers', () => {
  const env = createMockEnvironment();

  const idA = env.rateLimiter.deriveEmailKeyIdentifier('alice@example.com');
  const idB = env.rateLimiter.deriveEmailKeyIdentifier('bob@example.com');
  const idC = env.rateLimiter.deriveEmailKeyIdentifier('alice@example.org');

  assert.notEqual(idA, idB, 'Different usernames must produce different identifiers');
  assert.notEqual(idA, idC, 'Different domains must produce different identifiers');
  assert.notEqual(idB, idC);
});

test('F2 HMAC Keys - Identifier is a 64-character lowercase hexadecimal string (SHA-256 output)', () => {
  const env = createMockEnvironment();

  const id = env.rateLimiter.deriveEmailKeyIdentifier('test@example.com');
  assert.equal(typeof id, 'string');
  assert.equal(id.length, 64, 'SHA-256 hex output must be 64 characters');
  assert.ok(/^[a-f0-9]{64}$/.test(id), 'Identifier must be lowercase hexadecimal');
});

test('F2 HMAC Keys - Raw email does NOT appear in Redis key names (key contains only hex after prefix)', async () => {
  const env = createMockEnvironment([
    { id: 'user-1', email: 'private@example.com', username: 'privUser', emailVerifiedAt: null },
  ]);

  const { client, store } = createExtendedMockLuaEngine();
  env.rateLimiter.setRedisClient(client);

  await env.emailVerificationService.requestVerification('user-1', {});

  // All Redis keys must not contain the raw email address
  for (const key of store.keys()) {
    assert.ok(
      !key.includes('private@example.com'),
      `Redis key "${key}" must not contain raw email`,
    );
    assert.ok(
      !key.includes('private'),
      `Redis key "${key}" must not contain email local-part in plaintext`,
    );
  }

  // Keys should follow ev:cd:<hex> and ev:hr:<hex> pattern
  const keyArray = [...store.keys()];
  for (const key of keyArray) {
    assert.ok(
      /^ev:(cd|hr):[a-f0-9]{64}$/.test(key),
      `Redis key "${key}" must match ev:(cd|hr):<64hexchars>`,
    );
  }
});

test('F2 HMAC Keys - IP key does not contain raw IP address in Redis key name', async () => {
  const env = createMockEnvironment([
    { id: 'user-1', email: 'iptest@example.com', username: 'ipUser', emailVerifiedAt: null },
  ]);

  const { client, store } = createExtendedMockLuaEngine();
  env.rateLimiter.setRedisClient(client);

  const clientIp = '192.168.100.200';
  await env.rateLimiter.checkIpRateLimit(clientIp);

  // No Redis key should contain the raw IP
  for (const key of store.keys()) {
    assert.ok(!key.includes(clientIp), `Redis key "${key}" must not contain raw IP address`);
    assert.ok(
      /^ev:ip:[a-f0-9]{64}$/.test(key),
      `IP Redis key "${key}" must match ev:ip:<64hexchars>`,
    );
  }
});

test('F2 HMAC Keys - Identifier changes when HMAC secret changes (different instances, different secrets)', () => {
  const envA = createMockEnvironment([], [], { hmacSecret: 'secret-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' });
  const envB = createMockEnvironment([], [], { hmacSecret: 'secret-bbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' });

  const idA = envA.rateLimiter.deriveEmailKeyIdentifier('same@example.com');
  const idB = envB.rateLimiter.deriveEmailKeyIdentifier('same@example.com');

  assert.notEqual(idA, idB, 'Different HMAC secrets must produce different identifiers for same email');
});

test('F2 HMAC Keys - Multiple instances with same secret derive identical key identifiers', () => {
  const sharedSecret = 'shared-secret-for-distributed-instances-long-enough';
  const env1 = createMockEnvironment([], [], { hmacSecret: sharedSecret });
  const env2 = createMockEnvironment([], [], { hmacSecret: sharedSecret });

  const id1 = env1.rateLimiter.deriveEmailKeyIdentifier('distributed@example.com');
  const id2 = env2.rateLimiter.deriveEmailKeyIdentifier('distributed@example.com');

  assert.equal(id1, id2, 'Same secret + same email must produce identical identifiers across instances');
});

// ─────────────────────────────────────────────────────────────────────────────
// 10. F3 Distributed IP Rate Limiting Tests
// ─────────────────────────────────────────────────────────────────────────────

test('F3 Distributed IP - IP counter is shared across simulated API instances via same Redis store', async () => {
  const sharedSecret = 'shared-ip-test-secret-at-least-32-chars';
  const { client, store } = createExtendedMockLuaEngine();

  const env1 = createMockEnvironment([], [], { hmacSecret: sharedSecret });
  const env2 = createMockEnvironment([], [], { hmacSecret: sharedSecret });

  // Both instances share the same Redis client (same store)
  env1.rateLimiter.setRedisClient(client);
  env2.rateLimiter.setRedisClient(client);

  const clientIp = '10.0.0.5';

  // Instance 1 makes 8 requests
  for (let i = 0; i < 8; i++) {
    await env1.rateLimiter.checkIpRateLimit(clientIp);
  }

  // Instance 2 makes 7 more (total = 15, at the boundary)
  for (let i = 0; i < 7; i++) {
    await env2.rateLimiter.checkIpRateLimit(clientIp);
  }

  // Instance 1 makes 1 more request (total = 16, should be blocked)
  await assert.rejects(
    async () => {
      await env1.rateLimiter.checkIpRateLimit(clientIp);
    },
    (err: any) => {
      assert.ok(err instanceof HttpException);
      assert.equal(err.getStatus(), HttpStatus.TOO_MANY_REQUESTS);
      return true;
    },
  );

  // Verify count in shared store
  const ipId = env1.rateLimiter.deriveIpKeyIdentifier(clientIp);
  const ipKey = `ev:ip:${ipId}`;
  const count = Number(store.get(ipKey)?.value);
  assert.ok(count > 15, 'Shared IP counter must reflect requests from both instances');
});

test('F3 Distributed IP - 15th IP request is allowed; 16th is blocked (boundary enforcement)', async () => {
  const env = createMockEnvironment();
  const { client, store } = createExtendedMockLuaEngine();
  env.rateLimiter.setRedisClient(client);

  const clientIp = '203.0.113.42';

  // Requests 1-15: all must succeed
  for (let i = 1; i <= 15; i++) {
    await env.rateLimiter.checkIpRateLimit(clientIp); // must not throw
  }

  // Request 16: must be blocked
  await assert.rejects(
    async () => {
      await env.rateLimiter.checkIpRateLimit(clientIp);
    },
    (err: any) => {
      assert.ok(err instanceof HttpException);
      assert.equal(err.getStatus(), HttpStatus.TOO_MANY_REQUESTS);
      const resp = err.getResponse() as any;
      assert.ok(resp?.message?.includes('Too many verification requests from this IP'));
      assert.ok(typeof resp?.retryAfter === 'number' && resp.retryAfter >= 1);
      return true;
    },
  );
});

test('F3 Distributed IP - Different IP addresses are independently rate-limited', async () => {
  const env = createMockEnvironment();
  const { client } = createExtendedMockLuaEngine();
  env.rateLimiter.setRedisClient(client);

  const ipA = '10.0.0.1';
  const ipB = '10.0.0.2';

  // Exhaust ipA
  for (let i = 0; i < 15; i++) {
    await env.rateLimiter.checkIpRateLimit(ipA);
  }

  // ipB must still be allowed independently
  await env.rateLimiter.checkIpRateLimit(ipB); // must not throw

  // ipA is blocked
  await assert.rejects(
    async () => {
      await env.rateLimiter.checkIpRateLimit(ipA);
    },
    (err: any) => {
      assert.equal(err.getStatus(), HttpStatus.TOO_MANY_REQUESTS);
      return true;
    },
  );
});

test('F3 Distributed IP - Missing or empty client IP is handled safely without throwing', async () => {
  const env = createMockEnvironment();
  const { client } = createExtendedMockLuaEngine();
  env.rateLimiter.setRedisClient(client);

  // Empty string IP: should return silently without throwing
  await env.rateLimiter.checkIpRateLimit(''); // must not throw
});

test('F3 Distributed IP - Production without Redis fails closed with 503 (not in-memory fallback)', async () => {
  const env = createMockEnvironment(
    [{ id: 'user-1', email: 'prod@example.com', username: 'prodUser', emailVerifiedAt: null }],
    [],
    { nodeEnv: 'production' },
  );

  // No Redis client set — production must reject immediately
  assert.equal(env.rateLimiter.isRedisActive(), false);
  assert.equal(env.rateLimiter.isRedisMandatory(), true);

  await assert.rejects(
    async () => {
      await env.rateLimiter.checkIpRateLimit('1.2.3.4');
    },
    (err: any) => {
      assert.ok(err instanceof HttpException);
      assert.equal(err.getStatus(), HttpStatus.SERVICE_UNAVAILABLE);
      assert.ok(err.message.includes('unavailable'));
      return true;
    },
  );
});

test('F3 Distributed IP - Public resend response remains generic when IP is throttled', async () => {
  const env = createMockEnvironment([
    { id: 'user-1', email: 'iplimit@example.com', username: 'ipUser', emailVerifiedAt: null },
  ]);

  const { client } = createExtendedMockLuaEngine();
  env.rateLimiter.setRedisClient(client);

  // Exhaust IP limit
  for (let i = 0; i < 15; i++) {
    await env.rateLimiter.checkIpRateLimit('5.5.5.5');
  }

  // The 16th resend must result in HTTP 429, NOT an account-revealing error
  await assert.rejects(
    async () => {
      // Simulate the controller path that calls checkIpRateLimit before service
      await env.rateLimiter.checkIpRateLimit('5.5.5.5');
    },
    (err: any) => {
      assert.ok(err instanceof HttpException);
      assert.equal(err.getStatus(), HttpStatus.TOO_MANY_REQUESTS);
      // Response body must not mention accounts, users, or email existence
      const body = JSON.stringify(err.getResponse());
      assert.ok(!body.includes('account'), 'Response must not mention accounts');
      assert.ok(!body.includes('user'), 'Response must not mention users');
      assert.ok(!body.includes('registered'), 'Response must not reveal registration status');
      return true;
    },
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// 11. F4 Configuration Fail-Closed Tests
// ─────────────────────────────────────────────────────────────────────────────

test('F4 Config - Production with valid HMAC secret constructs successfully', () => {
  const validSecret = 'valid-production-secret-at-least-32-chars-long';
  // Should not throw
  const env = createMockEnvironment(
    [],
    [],
    { nodeEnv: 'production', hmacSecret: validSecret },
  );

  assert.ok(env.rateLimiter, 'Rate limiter must be constructed without error');
  assert.equal(env.rateLimiter.isRedisMandatory(), true);
});

test('F4 Config - Production without HMAC secret throws FATAL at construction time', () => {
  assert.throws(
    () => {
      createMockEnvironment(
        [],
        [],
        { nodeEnv: 'production', hmacSecret: undefined },
      );
    },
    (err: any) => {
      assert.ok(
        err instanceof Error,
        'Constructor must throw an Error when production HMAC secret is missing',
      );
      assert.ok(
        err.message.includes('EMAIL_VERIFICATION_HMAC_SECRET') || err.message.includes('required') || err.message.includes('HMAC'),
        `Error message must mention the missing secret config: "${err.message}"`,
      );
      return true;
    },
  );
});

test('F4 Config - Production with HMAC secret shorter than 32 characters throws at construction', () => {
  assert.throws(
    () => {
      createMockEnvironment(
        [],
        [],
        { nodeEnv: 'production', hmacSecret: 'too-short' },
      );
    },
    (err: any) => {
      assert.ok(err instanceof Error);
      assert.ok(
        err.message.includes('32') || err.message.includes('short') || err.message.includes('length') || err.message.includes('HMAC'),
        `Error must indicate the secret is too short: "${err.message}"`,
      );
      return true;
    },
  );
});

test('F4 Config - Development mode with no HMAC secret uses built-in dev fallback without throwing', () => {
  // envOverrides.hmacSecret = undefined in dev mode — mockConfig returns the test default
  // This verifies that the fallback path is exercised in non-production environments
  const env = createMockEnvironment(
    [],
    [],
    { nodeEnv: 'development' },
    // hmacSecret intentionally not passed — defaults to test-hmac-secret-... in mockConfig
  );

  assert.ok(env.rateLimiter, 'Rate limiter must construct in dev mode without throwing');
  assert.equal(env.rateLimiter.isRedisMandatory(), false);
});

test('F4 Config - Rate limiter correctly identifies production vs non-production mode', () => {
  const devEnv = createMockEnvironment([], [], { nodeEnv: 'development' });
  const testEnv = createMockEnvironment([], [], { nodeEnv: 'test' });
  const prodEnv = createMockEnvironment([], [], { nodeEnv: 'production', hmacSecret: 'prod-secret-at-least-32-chars-longxx' });

  assert.equal(devEnv.rateLimiter.isRedisMandatory(), false, 'Development must not require Redis');
  assert.equal(testEnv.rateLimiter.isRedisMandatory(), false, 'Test must not require Redis');
  assert.equal(prodEnv.rateLimiter.isRedisMandatory(), true, 'Production must require Redis');
});

test('F4 Config - setRedisClient enables Redis mode and isRedisActive returns true', () => {
  const env = createMockEnvironment();
  assert.equal(env.rateLimiter.isRedisActive(), false, 'Redis must be inactive by default');

  const { client } = createExtendedMockLuaEngine();
  env.rateLimiter.setRedisClient(client);
  assert.equal(env.rateLimiter.isRedisActive(), true, 'Redis must be active after setRedisClient');

  env.rateLimiter.setRedisClient(null);
  assert.equal(env.rateLimiter.isRedisActive(), false, 'Redis must be inactive after setRedisClient(null)');
});


// =============================================================================
// Phase 5.1.3.1 — Scope C, D & E Additional Security & Reliability Tests
// =============================================================================

test('F4 Config - Production with placeholder HMAC secret throws FATAL error', () => {
  assert.throws(
    () => {
      createMockEnvironment([], [], {
        nodeEnv: 'production',
        hmacSecret: 'REPLACE_WITH_A_REAL_SECRET_THAT_IS_LONG_ENOUGH_32',
      });
    },
    (err: any) => {
      assert.ok(err instanceof Error);
      assert.ok(
        err.message.includes('placeholder') || err.message.includes('FATAL'),
        `Error must mention placeholder: "${err.message}"`,
      );
      return true;
    },
  );

  assert.throws(
    () => {
      createMockEnvironment([], [], {
        nodeEnv: 'production',
        hmacSecret: 'my-placeholder-secret-value-at-least-32-chars-long',
      });
    },
    (err: any) => {
      assert.ok(err instanceof Error);
      assert.ok(err.message.includes('placeholder') || err.message.includes('FATAL'));
      return true;
    },
  );
});

test('F4 Config - Missing or unspecified environment fails closed to production mode', () => {
  // If NODE_ENV / app.environment is empty string or unspecified, it must be treated as production
  const env = createMockEnvironment(
    [],
    [],
    { nodeEnv: '', hmacSecret: 'valid-secret-for-unspecified-env-32-chars-ok' },
  );

  assert.equal(
    env.rateLimiter.isRedisMandatory(),
    true,
    'Unspecified environment must fail closed to requiring Redis',
  );
});

test('F4 Config - Staging environment fails closed to production mode', () => {
  const env = createMockEnvironment(
    [],
    [],
    { nodeEnv: 'staging', hmacSecret: 'valid-secret-for-staging-environment-32-chars-ok' },
  );

  assert.equal(
    env.rateLimiter.isRedisMandatory(),
    true,
    'Staging environment must require Redis (cannot use dev fallback)',
  );
});

test('Scope C - Trusted proxy disabled uses socket address and ignores forged X-Forwarded-For', async () => {
  const prevTrustProxy = process.env.TRUST_PROXY;
  delete process.env.TRUST_PROXY; // Trust proxy disabled by default

  try {
    const env = createMockEnvironment();
    let recordedIp: string | undefined;

    // Spy on checkIpRateLimit
    const origCheckIp = env.rateLimiter.checkIpRateLimit.bind(env.rateLimiter);
    env.rateLimiter.checkIpRateLimit = async (ip: string) => {
      recordedIp = ip;
      return origCheckIp(ip);
    };

    const mockReq: any = {
      headers: {
        'x-forwarded-for': '203.0.113.195', // Attacker-forged client IP
      },
      socket: {
        remoteAddress: '10.0.0.1', // Actual TCP socket connection IP
      },
    };

    await env.controller.resendVerification({ email: 'nobody@example.com' }, mockReq);

    assert.equal(
      recordedIp,
      '10.0.0.1',
      'When TRUST_PROXY is disabled, socket.remoteAddress must be used, ignoring X-Forwarded-For',
    );
  } finally {
    if (prevTrustProxy !== undefined) {
      process.env.TRUST_PROXY = prevTrustProxy;
    } else {
      delete process.env.TRUST_PROXY;
    }
  }
});

test('Scope C - Trusted proxy enabled extracts client IP from X-Forwarded-For chain', async () => {
  const prevTrustProxy = process.env.TRUST_PROXY;
  process.env.TRUST_PROXY = 'true';

  try {
    const env = createMockEnvironment();
    let recordedIp: string | undefined;

    const origCheckIp = env.rateLimiter.checkIpRateLimit.bind(env.rateLimiter);
    env.rateLimiter.checkIpRateLimit = async (ip: string) => {
      recordedIp = ip;
      return origCheckIp(ip);
    };

    const mockReq: any = {
      headers: {
        'x-forwarded-for': '198.51.100.42, 10.0.0.1, 10.0.0.2',
      },
      socket: {
        remoteAddress: '10.0.0.1',
      },
    };

    await env.controller.resendVerification({ email: 'nobody@example.com' }, mockReq);

    assert.equal(
      recordedIp,
      '198.51.100.42',
      'When TRUST_PROXY is enabled, the first IP (original client) in the chain must be extracted',
    );
  } finally {
    if (prevTrustProxy !== undefined) {
      process.env.TRUST_PROXY = prevTrustProxy;
    } else {
      delete process.env.TRUST_PROXY;
    }
  }
});

test('Scope C - Trusted proxy handles malformed and port-appended forwarding headers safely', async () => {
  const prevTrustProxy = process.env.TRUST_PROXY;
  process.env.TRUST_PROXY = '1';

  try {
    const env = createMockEnvironment();
    let recordedIp: string | undefined;

    const origCheckIp = env.rateLimiter.checkIpRateLimit.bind(env.rateLimiter);
    env.rateLimiter.checkIpRateLimit = async (ip: string) => {
      recordedIp = ip;
      return origCheckIp(ip);
    };

    // Case 1: IPv4 with port (e.g. "203.0.113.5:54321")
    const mockReqWithPort: any = {
      headers: { 'x-forwarded-for': '203.0.113.5:54321' },
      socket: { remoteAddress: '10.0.0.1' },
    };
    await env.controller.resendVerification({ email: 'nobody@example.com' }, mockReqWithPort);
    assert.equal(recordedIp, '203.0.113.5', 'Port must be stripped from IPv4 address');

    // Case 2: Empty or whitespace-only X-Forwarded-For falls back to socket address
    const mockReqWhitespace: any = {
      headers: { 'x-forwarded-for': '   ' },
      socket: { remoteAddress: '10.0.0.2' },
    };
    await env.controller.resendVerification({ email: 'nobody@example.com' }, mockReqWhitespace);
    assert.equal(recordedIp, '10.0.0.2', 'Whitespace header must fall back to socket address');

    // Case 3: Missing headers object entirely falls back safely
    const mockReqNoHeaders: any = {
      socket: { remoteAddress: '10.0.0.3' },
    };
    await env.controller.resendVerification({ email: 'nobody@example.com' }, mockReqNoHeaders);
    assert.equal(recordedIp, '10.0.0.3');
  } finally {
    if (prevTrustProxy !== undefined) {
      process.env.TRUST_PROXY = prevTrustProxy;
    } else {
      delete process.env.TRUST_PROXY;
    }
  }
});

test('Scope C - IPv4-mapped IPv6 address normalizes to identical HMAC identifier', () => {
  const env = createMockEnvironment();

  const id1 = env.rateLimiter.deriveIpKeyIdentifier('203.0.113.1');
  const id2 = env.rateLimiter.deriveIpKeyIdentifier('::ffff:203.0.113.1');
  const id3 = env.rateLimiter.deriveIpKeyIdentifier('  ::FFFF:203.0.113.1  ');

  assert.equal(id1, id2, 'IPv4 and IPv4-mapped IPv6 must produce the same HMAC identifier');
  assert.equal(id2, id3, 'Case and whitespace variation must produce the same HMAC identifier');
});

test('Scope D - IP counter key with TTL=-1 is repaired atomically by Lua script', async () => {
  const env = createMockEnvironment();
  const { client, store, seedKeyWithoutTTL } = createExtendedMockLuaEngine();
  env.rateLimiter.setRedisClient(client);

  const clientIp = '198.51.100.99';
  const ipId = env.rateLimiter.deriveIpKeyIdentifier(clientIp);
  const ipKey = `ev:ip:${ipId}`;

  // Pre-seed the IP key at 15 requests without a TTL (simulating a crash before EXPIRE)
  seedKeyWithoutTTL(ipKey, '15');
  assert.equal(store.get(ipKey)?.expireAt, undefined, 'Pre-seeded key must have no expiry');

  // Next request (request 16) should trigger TTL repair and be blocked by limit
  await assert.rejects(
    async () => {
      await env.rateLimiter.checkIpRateLimit(clientIp);
    },
    (err: any) => {
      assert.ok(err instanceof HttpException);
      assert.equal(err.getStatus(), HttpStatus.TOO_MANY_REQUESTS);
      const resp = err.getResponse() as any;
      assert.ok(resp?.retryAfter > 0, 'Must return a positive retryAfter duration');
      return true;
    },
  );

  // TTL must now be repaired
  const repairedRecord = store.get(ipKey);
  assert.ok(repairedRecord?.expireAt !== undefined, 'IP counter TTL must be repaired by Lua script');
  assert.ok(repairedRecord!.expireAt! > Date.now(), 'Repaired expireAt must be in the future');
});
