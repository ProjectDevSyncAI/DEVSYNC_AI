import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'node:crypto';
import { PrismaService } from '../../database/prisma.service.js';
import {
  DEV_EMAIL_VERIFICATION_HMAC_SECRET,
  validateEmailVerificationHmacSecret,
} from '../../config/email-verification.config.js';

export const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds
export const MAX_REQUESTS_PER_HOUR = 5;
export const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
export const IP_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
export const MAX_RESENDS_PER_IP_WINDOW = 15;

export interface RateLimitCheckResult {
  allowed: boolean;
  retryAfterSeconds?: number;
  reason?: 'COOLDOWN' | 'HOURLY_CAP' | 'IP_THROTTLED' | 'REDIS_ERROR';
}

export interface RedisClientInterface {
  eval(script: string, ...args: any[]): Promise<any>;
  set?(key: string, value: string, options?: any): Promise<string | null>;
  incr?(key: string): Promise<number>;
  expire?(key: string, seconds: number): Promise<number | boolean>;
  get?(key: string): Promise<string | null>;
  ttl?(key: string): Promise<number>;
}

/**
 * Single atomic Redis Lua script enforcing both 60s cooldown and 5 req/hr limit,
 * with atomic TTL repair for keys that exist without expiry (TTL == -1).
 *
 * KEYS[1]: cooldownKey (ev:cd:<hmacIdentifier>)
 * KEYS[2]: hourlyKey   (ev:hr:<hmacIdentifier>)
 * ARGV[1]: cooldownTtl (60)
 * ARGV[2]: hourlyWindowTtl (3600)
 * ARGV[3]: hourlyMaxRequests (5)
 *
 * Returns: { allowed (0 or 1), reason ('OK' | 'COOLDOWN' | 'HOURLY_CAP'), value (remainingTtl or currentCount) }
 */
export const ATOMIC_RATE_LIMIT_LUA = `
local cdExists = redis.call('EXISTS', KEYS[1])
if cdExists == 1 then
  local cdTtl = redis.call('TTL', KEYS[1])
  if cdTtl < 0 then
    redis.call('EXPIRE', KEYS[1], tonumber(ARGV[1]))
    cdTtl = tonumber(ARGV[1])
  end
  return { 0, 'COOLDOWN', cdTtl }
end

local hrRaw = redis.call('GET', KEYS[2])
local hrCount = 0
if hrRaw then
  hrCount = tonumber(hrRaw) or 0
end

if hrCount >= tonumber(ARGV[3]) then
  local hrTtl = redis.call('TTL', KEYS[2])
  if hrTtl < 0 then
    redis.call('EXPIRE', KEYS[2], tonumber(ARGV[2]))
    hrTtl = tonumber(ARGV[2])
  end
  return { 0, 'HOURLY_CAP', hrTtl }
end

redis.call('SET', KEYS[1], '1', 'EX', tonumber(ARGV[1]))
local nextHr = redis.call('INCR', KEYS[2])
local nextHrTtl = redis.call('TTL', KEYS[2])
if nextHrTtl < 0 then
  redis.call('EXPIRE', KEYS[2], tonumber(ARGV[2]))
end

return { 1, 'OK', nextHr }
`;

/**
 * Atomic Redis Lua script enforcing sliding-window IP rate limiting (15 requests per 900 seconds)
 *
 * KEYS[1]: ipKey (ev:ip:<ipHash>)
 * ARGV[1]: maxRequests (15)
 * ARGV[2]: windowSeconds (900)
 *
 * Returns: { allowed (0 or 1), currentCount, retryAfterSeconds }
 */
export const ATOMIC_IP_RATE_LIMIT_LUA = `
local ipCount = redis.call('INCR', KEYS[1])
if ipCount == 1 then
  redis.call('EXPIRE', KEYS[1], tonumber(ARGV[2]))
  return { 1, ipCount, 0 }
end

local ipTtl = redis.call('TTL', KEYS[1])
if ipTtl < 0 then
  redis.call('EXPIRE', KEYS[1], tonumber(ARGV[2]))
  ipTtl = tonumber(ARGV[2])
end

if ipCount > tonumber(ARGV[1]) then
  return { 0, ipCount, ipTtl }
end

return { 1, ipCount, 0 }
`;

@Injectable()
export class EmailVerificationRateLimiterService {
  private readonly logger = new Logger(EmailVerificationRateLimiterService.name);

  // In-process serialized lock per normalized email to eliminate check-then-act races in local dev/test mode
  private readonly emailLocks = new Map<string, Promise<void>>();

  // In-process reservation tracker per normalized email for local dev/test mode
  private readonly recentReservations = new Map<string, number[]>();

  // In-memory sliding window for IP abuse prevention (bounded, purged automatically in dev/test)
  private readonly ipTimestamps = new Map<string, number[]>();

  // Redis client for distributed atomic rate limiting
  private redisClient: RedisClientInterface | null = null;
  private isRedisRequired = false;
  private readonly isProduction: boolean;
  private readonly hmacSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly configService?: ConfigService,
  ) {
    // Deterministic environment detection: inspect both configService and process.env.NODE_ENV
    // If either indicates production (or non-dev/non-test), enforce production mode strictly
    const rawEnv = (
      this.configService?.get<string>('app.environment') ||
      process.env.NODE_ENV ||
      ''
    ).trim().toLowerCase();

    // Fallback to local in-memory/in-process limiting is permitted ONLY in explicit development or test environments.
    // Any other environment (production, staging, empty, undefined) is treated as production (fail-closed, Redis mandatory).
    this.isProduction = rawEnv !== 'development' && rawEnv !== 'test';

    // In production, Redis is strictly mandatory
    if (this.isProduction) {
      this.isRedisRequired = true;
    }

    // Initialize & validate HMAC secret for Redis key pseudonymization
    const rawSecret =
      this.configService?.get<string>('emailVerification.hmacSecret') ||
      process.env.EMAIL_VERIFICATION_HMAC_SECRET;

    this.hmacSecret = validateEmailVerificationHmacSecret(rawSecret, rawEnv || process.env.NODE_ENV);
  }

  /**
   * Derives a deterministic HMAC-SHA256 identifier for an email address.
   * Prevents raw email exposure in Redis keys while mapping the same email
   * to the exact same key across all API instances.
   */
  deriveEmailKeyIdentifier(email: string): string {
    const normalized = this.normalizeEmail(email);
    return crypto
      .createHmac('sha256', this.hmacSecret)
      .update(normalized)
      .digest('hex');
  }

  /**
   * Derives a deterministic HMAC-SHA256 identifier for an IP address.
   */
  deriveIpKeyIdentifier(ip: string): string {
    let normalized = ip.trim().toLowerCase();
    // Normalize IPv4-mapped IPv6 addresses (e.g. "::ffff:192.0.2.1" -> "192.0.2.1")
    if (normalized.startsWith('::ffff:')) {
      normalized = normalized.slice(7);
    }
    return crypto
      .createHmac('sha256', this.hmacSecret)
      .update(normalized)
      .digest('hex');
  }

  /**
   * Configures an external Redis client for distributed atomic rate limiting.
   */
  setRedisClient(client: RedisClientInterface | null, required?: boolean): void {
    this.redisClient = client;
    if (required !== undefined) {
      this.isRedisRequired = required;
    }
  }

  /**
   * Returns whether Redis is configured and active as the rate limiter.
   */
  isRedisActive(): boolean {
    return Boolean(this.redisClient);
  }

  /**
   * Returns whether the current environment strictly requires Redis.
   */
  isRedisMandatory(): boolean {
    return this.isProduction || this.isRedisRequired;
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  /**
   * Helper accessor for Prisma EmailVerificationToken delegate
   */
  private get tokenDelegate(): any {
    return (this.prisma as any).emailVerificationToken;
  }

  /**
   * Checks whether the client IP has exceeded the public resend threshold (15 req / 15 min).
   * Distributed via Redis in production; in-memory fallback permitted ONLY in dev/test.
   * Throws 429 Too Many Requests if throttled (IP-level, leaks zero account information).
   */
  async checkIpRateLimit(clientIp: string): Promise<void> {
    if (!clientIp) return;

    // 1. Production enforcement: Redis is strictly mandatory for distributed IP rate limiting
    if (this.isProduction && !this.redisClient) {
      this.logger.error(
        'CRITICAL: Production email verification IP rate limiting requires Redis, but Redis is not configured.',
      );
      throw new HttpException(
        'Email verification service is currently unavailable. Please try again later.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    // 2. Distributed Redis IP rate limiting
    if (this.redisClient) {
      const ipIdentifier = this.deriveIpKeyIdentifier(clientIp);
      const ipKey = `ev:ip:${ipIdentifier}`;
      const windowSeconds = Math.ceil(IP_RATE_LIMIT_WINDOW_MS / 1000); // 900s

      let evalResult: any;
      try {
        // node-redis object signature
        evalResult = await this.redisClient.eval(ATOMIC_IP_RATE_LIMIT_LUA, {
          keys: [ipKey],
          arguments: [String(MAX_RESENDS_PER_IP_WINDOW), String(windowSeconds)],
        });
      } catch {
        // Fallback for positional signature: eval(script, numKeys, ...keys, ...args)
        evalResult = await (this.redisClient as any).eval(
          ATOMIC_IP_RATE_LIMIT_LUA,
          1,
          ipKey,
          String(MAX_RESENDS_PER_IP_WINDOW),
          String(windowSeconds),
        );
      }

      const allowed = Array.isArray(evalResult) ? Number(evalResult[0]) : 0;
      const retryAfterSeconds = Array.isArray(evalResult) ? Number(evalResult[2]) : windowSeconds;

      if (allowed !== 1) {
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: 'Too many verification requests from this IP address. Please try again later.',
            retryAfter: Math.max(1, retryAfterSeconds),
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      return;
    }

    // 3. Fail-closed if Redis was marked required
    if (this.isRedisRequired) {
      throw new HttpException(
        'Email verification service is currently unavailable. Please try again later.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    // 4. Local dev/test in-memory sliding window
    const now = Date.now();
    const windowStart = now - IP_RATE_LIMIT_WINDOW_MS;

    const timestamps = (this.ipTimestamps.get(clientIp) || []).filter(
      (ts) => ts > windowStart,
    );

    if (timestamps.length >= MAX_RESENDS_PER_IP_WINDOW) {
      const oldest = timestamps[0];
      const retryAfter = Math.ceil((oldest + IP_RATE_LIMIT_WINDOW_MS - now) / 1000);
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too many verification requests from this IP address. Please try again later.',
          retryAfter,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    timestamps.push(now);
    this.ipTimestamps.set(clientIp, timestamps);

    // Periodic cleanup of stale IPs to keep memory bounded in dev/test
    if (this.ipTimestamps.size > 1000) {
      for (const [ip, tsList] of this.ipTimestamps.entries()) {
        const valid = tsList.filter((ts) => ts > windowStart);
        if (valid.length === 0) {
          this.ipTimestamps.delete(ip);
        } else {
          this.ipTimestamps.set(ip, valid);
        }
      }
    }
  }

  /**
   * Acquires a verification request slot for the given user and target email.
   *
   * In Production:
   *   Requires Redis. If Redis is missing or fails, fails closed immediately.
   *   Never falls back to process-local rate limiting.
   *
   * In Development / Test:
   *   If Redis is configured, uses atomic Redis Lua script.
   *   Otherwise, uses serialized in-process reservation locking.
   *
   * @param userId - Target user ID
   * @param email - Target email address
   * @param options.silent - If true (used by public resend), returns { allowed: false } without throwing HTTP 429,
   *                         preventing account enumeration side channels.
   */
  async acquireSlot(
    userId: string,
    email: string,
    options: { silent?: boolean } = {},
  ): Promise<RateLimitCheckResult> {
    const normalizedEmail = this.normalizeEmail(email);

    // 1. Production enforcement: Redis is strictly required. No silent local fallback!
    if (this.isProduction && !this.redisClient) {
      this.logger.error(
        'CRITICAL: Production email verification rate limiting requires Redis, but Redis is not configured.',
      );
      if (options.silent) {
        return { allowed: false, reason: 'REDIS_ERROR' };
      }
      throw new HttpException(
        'Email verification service is currently unavailable. Please try again later.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    // 2. Redis-backed atomic rate-limiting via single Lua script
    if (this.redisClient) {
      return this.checkRedisRateLimit(normalizedEmail, options.silent ?? false);
    }

    // 3. Explicit fail-closed if Redis was marked required
    if (this.isRedisRequired) {
      if (options.silent) {
        return { allowed: false, reason: 'REDIS_ERROR' };
      }
      throw new HttpException(
        'Email verification service is currently unavailable. Please try again later.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    // 4. Development & Test local mode: In-process serialized lock per normalized email
    return this.withEmailLock(normalizedEmail, async () => {
      return this.checkDatabaseRateLimit(userId, normalizedEmail, options.silent ?? false);
    });
  }

  /**
   * Executes an action under an in-process serialized lock keyed by normalized email.
   */
  private async withEmailLock<T>(normalizedEmail: string, action: () => Promise<T>): Promise<T> {
    const currentLock = this.emailLocks.get(normalizedEmail) || Promise.resolve();

    let releaseLock: () => void = () => {};
    const nextLock = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });

    this.emailLocks.set(
      normalizedEmail,
      currentLock.then(
        () => nextLock,
        () => nextLock,
      ),
    );

    try {
      await currentLock;
      return await action();
    } finally {
      releaseLock();
      if (this.emailLocks.get(normalizedEmail) === nextLock) {
        this.emailLocks.delete(normalizedEmail);
      }
    }
  }

  /**
   * Database-backed rate limit check performed under serialized email lock for local dev/test mode.
   */
  private async checkDatabaseRateLimit(
    userId: string,
    normalizedEmail: string,
    silent: boolean,
  ): Promise<RateLimitCheckResult> {
    const now = Date.now();
    const oneHourAgo = new Date(now - RATE_LIMIT_WINDOW_MS);

    // 1. Check in-process active reservations (prevents concurrent check-then-act races before DB commit)
    const reservations = (this.recentReservations.get(normalizedEmail) || []).filter(
      (ts) => ts > oneHourAgo.getTime(),
    );

    const latestReservation = reservations[reservations.length - 1];
    if (latestReservation) {
      const elapsed = now - latestReservation;
      if (elapsed < RESEND_COOLDOWN_MS) {
        const retryAfterSeconds = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
        if (silent) {
          return { allowed: false, retryAfterSeconds, reason: 'COOLDOWN' };
        }
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: `Please wait ${retryAfterSeconds} seconds before requesting another verification email.`,
            retryAfter: retryAfterSeconds,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    if (reservations.length >= MAX_REQUESTS_PER_HOUR) {
      if (silent) {
        return { allowed: false, retryAfterSeconds: 3600, reason: 'HOURLY_CAP' };
      }
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too many verification requests. Please try again in an hour.',
          retryAfter: 3600,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // 2. Check cooldown in DB: most recent token created for this user and email
    const latestToken = await this.tokenDelegate.findFirst({
      where: {
        userId,
        email: normalizedEmail,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (latestToken && latestToken.createdAt) {
      const elapsed = now - new Date(latestToken.createdAt).getTime();
      if (elapsed < RESEND_COOLDOWN_MS) {
        const retryAfterSeconds = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
        if (silent) {
          return { allowed: false, retryAfterSeconds, reason: 'COOLDOWN' };
        }
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: `Please wait ${retryAfterSeconds} seconds before requesting another verification email.`,
            retryAfter: retryAfterSeconds,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    // 3. Check hourly cap in DB: maximum 5 verification requests in the last hour
    const recentDbCount = await this.tokenDelegate.count({
      where: {
        userId,
        email: normalizedEmail,
        createdAt: { gte: oneHourAgo },
      },
    });

    const combinedHourlyCount = Math.max(recentDbCount, reservations.length);
    if (combinedHourlyCount >= MAX_REQUESTS_PER_HOUR) {
      if (silent) {
        return { allowed: false, retryAfterSeconds: 3600, reason: 'HOURLY_CAP' };
      }
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too many verification requests. Please try again in an hour.',
          retryAfter: 3600,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Slot approved: atomically record reservation timestamp
    reservations.push(now);
    this.recentReservations.set(normalizedEmail, reservations);

    // Periodic cleanup of reservations Map
    if (this.recentReservations.size > 1000) {
      for (const [key, tsList] of this.recentReservations.entries()) {
        const valid = tsList.filter((ts) => ts > oneHourAgo.getTime());
        if (valid.length === 0) {
          this.recentReservations.delete(key);
        } else {
          this.recentReservations.set(key, valid);
        }
      }
    }

    return { allowed: true };
  }

  /**
   * Redis-backed atomic rate limit check using a single atomic Lua script.
   * Atomically evaluates cooldown, hourly cap, and increments/sets TTLs with automatic TTL repair.
   * Keys are keyed with HMAC-SHA256 identifiers to protect personal data in Redis key names.
   */
  private async checkRedisRateLimit(
    normalizedEmail: string,
    silent: boolean,
  ): Promise<RateLimitCheckResult> {
    try {
      const emailIdentifier = this.deriveEmailKeyIdentifier(normalizedEmail);
      const cooldownKey = `ev:cd:${emailIdentifier}`;
      const hourlyKey = `ev:hr:${emailIdentifier}`;

      let evalResult: any;
      const client = this.redisClient!;

      // Execute atomic Lua script
      try {
        // node-redis object signature
        evalResult = await client.eval(ATOMIC_RATE_LIMIT_LUA, {
          keys: [cooldownKey, hourlyKey],
          arguments: ['60', '3600', '5'],
        });
      } catch {
        // Fallback for positional signature: eval(script, numKeys, ...keys, ...args)
        evalResult = await (client as any).eval(
          ATOMIC_RATE_LIMIT_LUA,
          2,
          cooldownKey,
          hourlyKey,
          '60',
          '3600',
          '5',
        );
      }

      const allowed = Array.isArray(evalResult) ? Number(evalResult[0]) : 0;
      const reason = Array.isArray(evalResult) ? String(evalResult[1]) : 'UNKNOWN';
      const value = Array.isArray(evalResult) ? Number(evalResult[2]) : 0;

      if (allowed === 1) {
        return { allowed: true };
      }

      if (reason === 'COOLDOWN') {
        const retryAfterSeconds = Math.max(1, value || 60);
        if (silent) {
          return { allowed: false, retryAfterSeconds, reason: 'COOLDOWN' };
        }
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: `Please wait ${retryAfterSeconds} seconds before requesting another verification email.`,
            retryAfter: retryAfterSeconds,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      if (reason === 'HOURLY_CAP') {
        const retryAfterSeconds = Math.max(1, value || 3600);
        if (silent) {
          return { allowed: false, retryAfterSeconds, reason: 'HOURLY_CAP' };
        }
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: 'Too many verification requests. Please try again in an hour.',
            retryAfter: retryAfterSeconds,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      if (silent) {
        return { allowed: false, reason: 'REDIS_ERROR' };
      }
      throw new HttpException(
        'Rate limit exceeded. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    } catch (err: any) {
      if (err instanceof HttpException) {
        throw err;
      }

      this.logger.error(`Redis atomic rate limiting failure: ${err.message}`);
      if (this.isProduction || this.isRedisRequired) {
        if (silent) {
          return { allowed: false, reason: 'REDIS_ERROR' };
        }
        throw new HttpException(
          'Email verification service is currently unavailable. Please try again later.',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      // If Redis was optional and failed in dev/test, fail closed to be safe
      if (silent) {
        return { allowed: false, reason: 'REDIS_ERROR' };
      }
      throw new HttpException(
        'Rate limiting service error. Please try again later.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
