import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'node:crypto';
import * as net from 'node:net';
import type { Request } from 'express';
import {
  DEV_EMAIL_VERIFICATION_HMAC_SECRET,
  validateEmailVerificationHmacSecret,
} from '../config/email-verification.config.js';

export const IP_PREVIEW_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
export const MAX_PREVIEWS_PER_IP_WINDOW = 30; // 30 preview requests per 15-minute window

export interface RedisClientInterface {
  eval(script: string, ...args: any[]): Promise<any>;
  set?(key: string, value: string, options?: any): Promise<string | null>;
  incr?(key: string): Promise<number>;
  expire?(key: string, seconds: number): Promise<number | boolean>;
  get?(key: string): Promise<string | null>;
  ttl?(key: string): Promise<number>;
}

/**
 * Genuine Atomic Redis Lua script enforcing true rolling sliding-window IP rate limiting
 * using a Redis sorted set with authoritative Redis TIME scores.
 *
 * KEYS[1]: ipKey (inv:prev:ip:<ipHash>)
 * ARGV[1]: maxRequests (30)
 * ARGV[2]: windowMs (900000)
 * ARGV[3]: memberId (unique collision-resistant request member e.g. <uuid>)
 * ARGV[4]: windowSeconds (900)
 *
 * Note: If 5 arguments are provided (legacy contract: [maxRequests, windowMs, now, memberId, windowSeconds]),
 * the script safely maps memberId from ARGV[4] and windowSeconds from ARGV[5] while still deriving
 * the authoritative timestamp exclusively from redis.call('TIME').
 *
 * Returns: { allowed (0 or 1), currentCount, retryAfterSeconds }
 */
export const ATOMIC_IP_PREVIEW_RATE_LIMIT_LUA = `
local ipKey = KEYS[1]
local maxRequests = tonumber(ARGV[1])
local windowMs = tonumber(ARGV[2])
local memberId = ARGV[3]
local windowSeconds = tonumber(ARGV[4])

-- Legacy 5-argument compatibility: [maxRequests, windowMs, now, memberId, windowSeconds]
if #ARGV >= 5 then
  memberId = ARGV[4]
  windowSeconds = tonumber(ARGV[5])
end

-- 1. Authoritative Redis time in milliseconds (seconds + microseconds)
local rtime = redis.call('TIME')
local now = tonumber(rtime[1]) * 1000 + math.floor(tonumber(rtime[2]) / 1000)

-- 2. Calculate window cutoff: entries strictly older than now - windowMs are expired
local windowStart = now - windowMs

-- 3. Remove entries strictly older than the active window
redis.call('ZREMRANGEBYSCORE', ipKey, '-inf', '(' .. windowStart)

-- 4. Count remaining active requests in the sliding window
local count = redis.call('ZCARD', ipKey)

-- 5. Check if quota exceeded
if count >= maxRequests then
  local oldest = redis.call('ZRANGE', ipKey, 0, 0, 'WITHSCORES')
  local retryAfter = windowSeconds
  if oldest and #oldest >= 2 then
    local oldestScore = tonumber(oldest[2])
    if oldestScore then
      local remainingMs = (oldestScore + windowMs) - now
      if remainingMs > 0 then
        retryAfter = math.ceil(remainingMs / 1000)
      else
        retryAfter = 1
      end
    end
  end

  local ttl = redis.call('TTL', ipKey)
  if ttl < 0 then
    redis.call('EXPIRE', ipKey, windowSeconds)
  end

  return { 0, count, retryAfter }
end

-- 6. Under quota: add current request member with Redis authoritative timestamp as score
redis.call('ZADD', ipKey, now, memberId)

-- 7. Ensure key expiration covers the full window duration
redis.call('EXPIRE', ipKey, windowSeconds)

return { 1, count + 1, 0 }
`;

/**
 * Normalizes an IP string by trimming, lowercasing, stripping port (if present),
 * and stripping IPv4-mapped IPv6 prefix (::ffff:).
 */
export function normalizeIp(ip: string): string {
  if (!ip) return '';
  let trimmed = ip.trim().toLowerCase();

  // Strip brackets from IPv6 with port e.g. [2001:db8::1]:8080
  if (trimmed.startsWith('[') && trimmed.includes(']')) {
    const closing = trimmed.indexOf(']');
    trimmed = trimmed.slice(1, closing);
  } else {
    // Strip port from IPv4 with port e.g. 1.2.3.4:8080 (only 1 colon)
    const colons = (trimmed.match(/:/g) || []).length;
    if (colons === 1) {
      trimmed = trimmed.split(':')[0];
    }
  }

  // Strip IPv4-mapped IPv6 prefix
  if (trimmed.startsWith('::ffff:')) {
    trimmed = trimmed.slice(7);
  }

  return trimmed;
}

/**
 * Converts an IPv4 dotted-quad string into a 32-bit unsigned integer.
 */
function ipv4ToInt(ip: string): number {
  return ip.split('.').reduce((acc, octet) => ((acc << 8) + parseInt(octet, 10)) >>> 0, 0);
}

/**
 * Converts an IPv6 string into a 16-byte Buffer for bitwise operations.
 */
function ipv6ToBuffer(ip: string): Buffer | null {
  try {
    if (net.isIPv6(ip)) {
      const doubleColonIndex = ip.indexOf('::');
      let fullParts: string[] = [];
      if (doubleColonIndex !== -1) {
        const left = ip.slice(0, doubleColonIndex).split(':').filter(Boolean);
        const right = ip.slice(doubleColonIndex + 2).split(':').filter(Boolean);
        const missing = 8 - (left.length + right.length);
        fullParts = [...left, ...Array(missing).fill('0'), ...right];
      } else {
        fullParts = ip.split(':');
      }
      const buf = Buffer.alloc(16);
      for (let i = 0; i < 8; i++) {
        const val = parseInt(fullParts[i] || '0', 16);
        buf.writeUInt16BE(val, i * 2);
      }
      return buf;
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Checks if a candidate IP matches a specific IP or CIDR block (IPv4 or IPv6).
 */
export function isIpInCidr(ip: string, cidrOrIp: string): boolean {
  const normIp = normalizeIp(ip);
  const normTarget = normalizeIp(cidrOrIp);

  if (!normIp || !normTarget) return false;

  // Exact IP match
  if (!normTarget.includes('/')) {
    return normIp === normTarget;
  }

  const [rangeIp, prefixStr] = normTarget.split('/');
  const prefix = parseInt(prefixStr, 10);
  if (isNaN(prefix)) return false;

  const ipFamily = net.isIP(normIp);
  const rangeFamily = net.isIP(rangeIp);

  if (ipFamily === 0 || ipFamily !== rangeFamily) return false;

  if (ipFamily === 4) {
    if (prefix < 0 || prefix > 32) return false;
    const ipInt = ipv4ToInt(normIp);
    const rangeInt = ipv4ToInt(rangeIp);
    const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
    return (ipInt & mask) === (rangeInt & mask);
  }

  if (ipFamily === 6) {
    if (prefix < 0 || prefix > 128) return false;
    if (prefix === 128) return normIp === rangeIp;
    const b1 = ipv6ToBuffer(normIp);
    const b2 = ipv6ToBuffer(rangeIp);
    if (!b1 || !b2) return false;

    const fullBytes = Math.floor(prefix / 8);
    const remBits = prefix % 8;

    for (let i = 0; i < fullBytes; i++) {
      if (b1[i] !== b2[i]) return false;
    }
    if (remBits > 0) {
      const mask = (0xff << (8 - remBits)) & 0xff;
      if ((b1[fullBytes] & mask) !== (b2[fullBytes] & mask)) return false;
    }
    return true;
  }

  return false;
}

/**
 * Checks if a direct peer IP is recognized as a trusted reverse proxy.
 */
export function isTrustedProxy(ip: string, trustedProxies: string[]): boolean {
  const normIp = normalizeIp(ip);
  if (!normIp || net.isIP(normIp) === 0) return false;

  for (const entry of trustedProxies) {
    const trimmedEntry = entry.trim();
    if (!trimmedEntry) continue;
    if (isIpInCidr(normIp, trimmedEntry)) {
      return true;
    }
  }

  return false;
}

/**
 * Designated fallback identifier when direct socket peer address is missing, empty, or malformed.
 * Guaranteed never to match any IP or CIDR in TRUSTED_PROXIES (net.isIP('unknown') === 0).
 */
export const UNKNOWN_CLIENT_IP = 'unknown';

/**
 * Extracts the client IP safely from an Express Request using an explicit trusted reverse-proxy boundary.
 * 
 * Boundary & Header Trust Policy (Phase 5.4.2.3):
 * 1. Direct Socket Validation: The physical incoming TCP socket peer address is verified first.
 *    If direct socket address is missing, empty, or syntactically invalid, the client identity is resolved
 *    strictly to UNKNOWN_CLIENT_IP ('unknown'). It is NEVER replaced with 127.0.0.1, ::1, or any address
 *    that could match TRUSTED_PROXIES. All forwarding headers are discarded immediately.
 * 2. Default (TRUST_PROXY disabled/unset): strictly returns direct socket peer address. Ignores all forwarding headers.
 * 3. Trusted Proxy enabled: requires direct socket peer to belong to configured TRUSTED_PROXIES (default: loopback 127.0.0.1, ::1).
 *    If direct peer is untrusted, all headers are discarded and direct peer address is returned.
 * 4. If direct peer is trusted: parses X-Forwarded-For chain from right to left to locate the first untrusted client IP.
 *    Any syntactically malformed hop causes rejection of the entire forwarded chain, falling back strictly to direct socket peer.
 * 5. X-Real-IP is explicitly ignored: reverse proxies do not guarantee header-overwrite behavior for X-Real-IP,
 *    allowing client-injected values to pass through unverified. Only verified X-Forwarded-For chains are trusted.
 * 6. If X-Forwarded-For is absent, empty, or malformed, the resolver falls back strictly to the direct socket peer.
 * 7. Standardized RFC 7239 Forwarded header ('Forwarded: for=...') is explicitly unsupported and ignored.
 */
export function extractClientIp(req: Request): string {
  // Direct socket peer address (physical incoming connection)
  const rawSocket = req?.socket?.remoteAddress || (req as any)?.connection?.remoteAddress;
  const directPeer = normalizeIp(rawSocket || '');

  // 1. Validate direct socket peer
  // If direct socket is missing, empty, or not a valid IP syntax, peer is unknown.
  // CRITICAL: An unknown peer must NEVER be replaced with 127.0.0.1 or any address
  // that could match TRUSTED_PROXIES. Forwarding headers must be completely ignored.
  if (!directPeer || net.isIP(directPeer) === 0) {
    return UNKNOWN_CLIENT_IP;
  }

  const trustProxy =
    process.env.TRUST_PROXY === 'true' || process.env.TRUST_PROXY === '1';

  // If TRUST_PROXY is disabled/unset: NEVER trust forwarding headers
  if (!trustProxy) {
    return directPeer;
  }

  // Parse configured trusted proxies
  const rawTrustedConfig = process.env.TRUSTED_PROXIES || '';
  const configuredList = rawTrustedConfig
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  // If TRUST_PROXY is enabled without explicit TRUSTED_PROXIES, default strictly to loopback proxies
  const trustedProxies =
    configuredList.length > 0 ? configuredList : ['127.0.0.1', '::1'];

  // Enforce trust boundary: Direct socket peer MUST belong to trusted proxies
  if (!isTrustedProxy(directPeer, trustedProxies)) {
    // Untrusted direct peer trying to forge headers: discard headers completely
    return directPeer;
  }

  // Direct peer is trusted. Check X-Forwarded-For chain
  const forwarded = req.headers?.['x-forwarded-for'];
  if (forwarded) {
    const rawHeader = Array.isArray(forwarded) ? forwarded.join(',') : forwarded;
    const rawHops = rawHeader
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (rawHops.length > 0) {
      const normalizedHops = rawHops.map(normalizeIp);

      // Validate that every hop has valid IP syntax
      const allValid = normalizedHops.every((h) => h && net.isIP(h) !== 0);
      if (!allValid) {
        // Malformed forwarded chain: reject entire chain and fall back strictly to direct socket peer.
        return directPeer;
      }

      // Walk proxy chain from right to left (closest proxy to furthest client)
      // The first IP from the right that is NOT in trustedProxies is the genuine client
      for (let i = normalizedHops.length - 1; i >= 0; i--) {
        const candidate = normalizedHops[i];
        if (!isTrustedProxy(candidate, trustedProxies)) {
          return candidate;
        }
      }

      // If all hops in chain were themselves trusted proxies, return the leftmost hop
      return normalizedHops[0];
    }
  }

  // If X-Forwarded-For is absent or empty, fall back strictly to direct socket peer.
  // Note: X-Real-IP is explicitly ignored for security closure (Finding F1).
  return directPeer;
}

@Injectable()
export class InvitationPreviewRateLimiterService {
  private readonly logger = new Logger(InvitationPreviewRateLimiterService.name);

  // In-memory sliding window for IP abuse prevention in dev/test
  private readonly ipTimestamps = new Map<string, number[]>();

  // Redis client for distributed atomic rate limiting
  private redisClient: RedisClientInterface | null = null;
  private isRedisRequired = false;
  private readonly isProduction: boolean;
  private readonly hmacSecret: string;

  constructor(@Optional() private readonly configService?: ConfigService) {
    const rawEnv = (
      this.configService?.get<string>('app.environment') ||
      process.env.NODE_ENV ||
      ''
    )
      .trim()
      .toLowerCase();

    // Permitted only in development or test; any other mode requires Redis
    this.isProduction = rawEnv !== 'development' && rawEnv !== 'test';

    if (this.isProduction) {
      this.isRedisRequired = true;
    }

    const rawSecret =
      this.configService?.get<string>('emailVerification.hmacSecret') ||
      process.env.EMAIL_VERIFICATION_HMAC_SECRET;

    this.hmacSecret = validateEmailVerificationHmacSecret(
      rawSecret,
      rawEnv || process.env.NODE_ENV,
    );
  }

  /**
   * Derives a deterministic HMAC-SHA256 identifier for an IP address.
   */
  deriveIpKeyIdentifier(ip: string): string {
    const normalized = normalizeIp(ip);
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

  isRedisActive(): boolean {
    return Boolean(this.redisClient);
  }

  isRedisMandatory(): boolean {
    return this.isProduction || this.isRedisRequired;
  }

  /**
   * Checks whether the client IP has exceeded the public preview threshold (30 req / 15 min).
   * Distributed via Redis sorted-set sliding window in production; in-memory fallback permitted ONLY in dev/test.
   * Throws 429 Too Many Requests if throttled.
   */
  async checkIpRateLimit(clientIp: string): Promise<void> {
    if (!clientIp) return;

    // 1. Production enforcement: Redis is strictly mandatory for distributed IP rate limiting
    if (this.isProduction && !this.redisClient) {
      this.logger.error(
        'CRITICAL: Production invitation preview IP rate limiting requires Redis, but Redis is not configured.',
      );
      throw new HttpException(
        'Invitation preview service is currently unavailable. Please try again later.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    // 2. Distributed Redis IP rate limiting with true atomic sorted-set sliding window
    if (this.redisClient) {
      const ipIdentifier = this.deriveIpKeyIdentifier(clientIp);
      const ipKey = `inv:prev:ip:${ipIdentifier}`;
      const memberId = crypto.randomUUID();
      const windowSeconds = Math.ceil(IP_PREVIEW_WINDOW_MS / 1000); // 900s

      let evalResult: any;
      try {
        evalResult = await this.redisClient.eval(ATOMIC_IP_PREVIEW_RATE_LIMIT_LUA, {
          keys: [ipKey],
          arguments: [
            String(MAX_PREVIEWS_PER_IP_WINDOW),
            String(IP_PREVIEW_WINDOW_MS),
            memberId,
            String(windowSeconds),
          ],
        });
      } catch (evalErr) {
        try {
          evalResult = await (this.redisClient as any).eval(
            ATOMIC_IP_PREVIEW_RATE_LIMIT_LUA,
            1,
            ipKey,
            String(MAX_PREVIEWS_PER_IP_WINDOW),
            String(IP_PREVIEW_WINDOW_MS),
            memberId,
            String(windowSeconds),
          );
        } catch (fallbackErr) {
          if (this.isProduction || this.isRedisRequired) {
            this.logger.error(
              `Redis sliding-window rate limit evaluation failed in production: ${(fallbackErr as any)?.message || fallbackErr}`,
            );
            throw new HttpException(
              'Invitation preview service is currently unavailable. Please try again later.',
              HttpStatus.SERVICE_UNAVAILABLE,
            );
          }
          return this.inMemoryLimit(clientIp);
        }
      }

      const allowed = Array.isArray(evalResult) ? Number(evalResult[0]) : 0;
      const retryAfterSeconds = Array.isArray(evalResult)
        ? Number(evalResult[2])
        : windowSeconds;

      if (allowed !== 1) {
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message:
              'Too many invitation preview requests from this IP address. Please try again later.',
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
        'Invitation preview service is currently unavailable. Please try again later.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    // 4. Local dev/test in-memory sliding window
    this.inMemoryLimit(clientIp);
  }

  private inMemoryLimit(clientIp: string): void {
    const now = Date.now();
    const windowStart = now - IP_PREVIEW_WINDOW_MS;

    const timestamps = (this.ipTimestamps.get(clientIp) || []).filter(
      (ts) => ts >= windowStart,
    );

    if (timestamps.length >= MAX_PREVIEWS_PER_IP_WINDOW) {
      const oldest = timestamps[0];
      const remainingMs = Math.max(0, oldest + IP_PREVIEW_WINDOW_MS - now);
      const retryAfter = Math.ceil(remainingMs / 1000) || 1;

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message:
            'Too many invitation preview requests from this IP address. Please try again later.',
          retryAfter,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    timestamps.push(now);
    this.ipTimestamps.set(clientIp, timestamps);
  }

  /**
   * Resets in-memory rate limiting state (test utility).
   */
  reset(): void {
    this.ipTimestamps.clear();
  }
}
