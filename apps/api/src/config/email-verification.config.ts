import { registerAs } from '@nestjs/config';

export const DEV_EMAIL_VERIFICATION_HMAC_SECRET = 'devsync-dev-email-verification-hmac-secret-min-32-chars';
export const MIN_HMAC_SECRET_LENGTH = 32;

/**
 * Validates EMAIL_VERIFICATION_HMAC_SECRET according to environment policy.
 * - In production mode (or any non-dev/non-test mode):
 *   Fails closed if the secret is missing, empty, matches default dev fallback,
 *   contains obvious placeholders, or is shorter than 32 characters.
 * - In development / test mode:
 *   Permits fallback to DEV_EMAIL_VERIFICATION_HMAC_SECRET for local convenience.
 * - Never prints the secret in error logs.
 */
export function validateEmailVerificationHmacSecret(
  secret: string | undefined,
  nodeEnv: string | undefined = process.env.NODE_ENV,
): string {
  const rawEnv = nodeEnv?.trim().toLowerCase();
  const trimmed = secret?.trim();

  // ONLY explicit development or test modes permit fallback
  if (rawEnv === 'development' || rawEnv === 'test') {
    return trimmed || DEV_EMAIL_VERIFICATION_HMAC_SECRET;
  }

  const envLabel = rawEnv || 'unspecified (missing NODE_ENV)';

  if (!trimmed) {
    throw new Error(
      `FATAL: EMAIL_VERIFICATION_HMAC_SECRET is required and cannot be empty when NODE_ENV is ${envLabel}`,
    );
  }

  if (trimmed === DEV_EMAIL_VERIFICATION_HMAC_SECRET) {
    throw new Error(
      `FATAL: Insecure EMAIL_VERIFICATION_HMAC_SECRET detected. Default development secret cannot be used when NODE_ENV is ${envLabel}`,
    );
  }

  if (
    trimmed.startsWith('REPLACE_WITH') ||
    trimmed.toLowerCase().includes('placeholder') ||
    trimmed.toLowerCase().includes('your-secret')
  ) {
    throw new Error(
      `FATAL: EMAIL_VERIFICATION_HMAC_SECRET contains an unconfigured placeholder value when NODE_ENV is ${envLabel}`,
    );
  }

  if (trimmed.length < MIN_HMAC_SECRET_LENGTH) {
    throw new Error(
      `FATAL: EMAIL_VERIFICATION_HMAC_SECRET is too short (${trimmed.length} chars). Minimum length is ${MIN_HMAC_SECRET_LENGTH} characters when NODE_ENV is ${envLabel}`,
    );
  }

  return trimmed;
}

export default registerAs('emailVerification', () => ({
  hmacSecret: validateEmailVerificationHmacSecret(
    process.env.EMAIL_VERIFICATION_HMAC_SECRET,
    process.env.NODE_ENV,
  ),
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
}));
