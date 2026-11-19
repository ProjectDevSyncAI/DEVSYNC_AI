import { registerAs } from '@nestjs/config';

<<<<<<< HEAD
export const DEV_JWT_SECRET = 'devsync-development-secret';
export const MIN_JWT_SECRET_LENGTH = 32;

/**
 * Validates JWT_SECRET according to environment policy.
 * - Development and test modes allow fallback to DEV_JWT_SECRET.
 * - Staging, production, and all non-development modes fail closed on:
 *   missing, empty, dev default, placeholder, or insufficient length.
 * - Never prints the secret in error messages.
 */
export function validateJwtSecret(
  secret: string | undefined,
  nodeEnv: string | undefined = process.env.NODE_ENV,
): string {
  const rawEnv = nodeEnv?.trim().toLowerCase();
  const trimmed = secret?.trim();

  // ONLY explicit development or test modes permit fallback for local convenience
  if (rawEnv === 'development' || rawEnv === 'test') {
    return trimmed || DEV_JWT_SECRET;
  }

  const envLabel = rawEnv || 'unspecified (missing NODE_ENV)';

  // Non-development modes (staging, production, unspecified/missing NODE_ENV) MUST fail closed
  if (!trimmed) {
    throw new Error(
      `FATAL: JWT_SECRET is required and cannot be empty when NODE_ENV is ${envLabel}`,
    );
  }

  if (trimmed === DEV_JWT_SECRET) {
    throw new Error(
      `FATAL: Insecure JWT_SECRET detected. Default development secret cannot be used when NODE_ENV is ${envLabel}`,
    );
  }

  if (
    trimmed.startsWith('REPLACE_WITH') ||
    trimmed.toLowerCase().includes('placeholder') ||
    trimmed.toLowerCase().includes('your-secret')
  ) {
    throw new Error(
      `FATAL: JWT_SECRET contains an unconfigured placeholder value when NODE_ENV is ${envLabel}`,
    );
  }

  if (trimmed.length < MIN_JWT_SECRET_LENGTH) {
    throw new Error(
      `FATAL: JWT_SECRET is too short (${trimmed.length} chars). Minimum length is ${MIN_JWT_SECRET_LENGTH} characters when NODE_ENV is ${envLabel}`,
    );
  }

  return trimmed;
}

export default registerAs('auth', () => ({
  jwtSecret: validateJwtSecret(process.env.JWT_SECRET, process.env.NODE_ENV),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
}));
=======
export default registerAs('auth', () => ({
  jwtSecret: process.env.JWT_SECRET ?? 'devsync-development-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
}));
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
