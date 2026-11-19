import test from 'node:test';
import assert from 'node:assert/strict';

import authConfig, {
  validateJwtSecret,
  DEV_JWT_SECRET,
  MIN_JWT_SECRET_LENGTH,
} from '../../src/config/auth.config.js';

const validSecret32 = 'a-very-secure-random-secret-key-32b';
const validSecret64 = 'c694a1b025f1624c965773173d1000bb7097c0f16bbd9ea98a96c3d90610360a';

// ─── 1. Missing NODE_ENV (Fails Closed) ───────────────────────────────────────

test('1. Missing NODE_ENV (undefined): reject missing JWT_SECRET', () => {
  assert.throws(
    () => validateJwtSecret(undefined, undefined),
    /JWT_SECRET is required and cannot be empty when NODE_ENV is unspecified \(missing NODE_ENV\)/,
  );
});

test('2. Missing NODE_ENV (empty string): reject empty JWT_SECRET', () => {
  assert.throws(
    () => validateJwtSecret('   ', ''),
    /JWT_SECRET is required and cannot be empty when NODE_ENV is unspecified \(missing NODE_ENV\)/,
  );
});

test('3. Missing NODE_ENV: reject development default secret', () => {
  assert.throws(
    () => validateJwtSecret(DEV_JWT_SECRET, undefined),
    /Default development secret cannot be used when NODE_ENV is unspecified \(missing NODE_ENV\)/,
  );
});

test('4. Missing NODE_ENV: accept valid 32+ char secret', () => {
  const result = validateJwtSecret(validSecret32, undefined);
  assert.equal(result, validSecret32);
});

// ─── 2. Explicit Development Mode ─────────────────────────────────────────────

test('5. Explicit development: fallback to DEV_JWT_SECRET when secret is missing', () => {
  const result = validateJwtSecret(undefined, 'development');
  assert.equal(result, DEV_JWT_SECRET);
});

test('6. Explicit development: fallback to DEV_JWT_SECRET when secret is empty', () => {
  const result = validateJwtSecret('   ', 'development');
  assert.equal(result, DEV_JWT_SECRET);
});

test('7. Explicit development: return custom secret if provided', () => {
  const custom = 'my-custom-local-development-secret-1234';
  const result = validateJwtSecret(custom, 'development');
  assert.equal(result, custom);
});

// ─── 3. Explicit Test Mode ────────────────────────────────────────────────────

test('8. Explicit test: fallback to DEV_JWT_SECRET when secret is missing', () => {
  const result = validateJwtSecret(undefined, 'test');
  assert.equal(result, DEV_JWT_SECRET);
});

test('9. Explicit test: return custom secret if provided', () => {
  const custom = 'test-specific-secret-key-1234';
  const result = validateJwtSecret(custom, 'test');
  assert.equal(result, custom);
});

// ─── 4. Staging Mode (Fail-Closed) ─────────────────────────────────────────────

test('10. Staging: reject missing secret', () => {
  assert.throws(
    () => validateJwtSecret(undefined, 'staging'),
    /JWT_SECRET is required and cannot be empty when NODE_ENV is staging/,
  );
});

test('11. Staging: reject empty secret', () => {
  assert.throws(
    () => validateJwtSecret('   ', 'staging'),
    /JWT_SECRET is required and cannot be empty when NODE_ENV is staging/,
  );
});

test('12. Staging: reject development default secret', () => {
  assert.throws(
    () => validateJwtSecret(DEV_JWT_SECRET, 'staging'),
    /Default development secret cannot be used when NODE_ENV is staging/,
  );
});

test('13. Staging: reject placeholder secrets', () => {
  assert.throws(
    () => validateJwtSecret('REPLACE_WITH_REAL_STAGING_KEY_12345678', 'staging'),
    /JWT_SECRET contains an unconfigured placeholder value when NODE_ENV is staging/,
  );
  assert.throws(
    () => validateJwtSecret('some-placeholder-secret-value-12345678', 'staging'),
    /JWT_SECRET contains an unconfigured placeholder value when NODE_ENV is staging/,
  );
});

test('14. Staging: reject secrets shorter than MIN_JWT_SECRET_LENGTH (32)', () => {
  const shortSecret = 'short-secret-under-32-chars';
  assert.ok(shortSecret.length < MIN_JWT_SECRET_LENGTH);
  assert.throws(
    () => validateJwtSecret(shortSecret, 'staging'),
    /JWT_SECRET is too short \(27 chars\)\. Minimum length is 32 characters when NODE_ENV is staging/,
  );
});

test('15. Staging: accept valid 32+ char secret', () => {
  const result = validateJwtSecret(validSecret32, 'staging');
  assert.equal(result, validSecret32);
});

test('16. Staging: accept valid 64 char hex secret', () => {
  const result = validateJwtSecret(validSecret64, 'staging');
  assert.equal(result, validSecret64);
});

// ─── 5. Production Mode (Fail-Closed) ──────────────────────────────────────────

test('17. Production: reject missing secret', () => {
  assert.throws(
    () => validateJwtSecret(undefined, 'production'),
    /JWT_SECRET is required and cannot be empty when NODE_ENV is production/,
  );
});

test('18. Production: reject development default secret', () => {
  assert.throws(
    () => validateJwtSecret(DEV_JWT_SECRET, 'production'),
    /Default development secret cannot be used when NODE_ENV is production/,
  );
});

test('19. Production: reject placeholder secret', () => {
  assert.throws(
    () => validateJwtSecret('REPLACE_WITH_PRODUCTION_SECRET_KEY_1234', 'production'),
    /JWT_SECRET contains an unconfigured placeholder value when NODE_ENV is production/,
  );
});

test('20. Production: accept valid 64 char secret', () => {
  const result = validateJwtSecret(validSecret64, 'production');
  assert.equal(result, validSecret64);
});

// ─── 6. Security: Zero Secret Disclosure ──────────────────────────────────────

test('21. Security: error messages never disclose sensitive secret values', () => {
  const candidate = 'my-super-secret-key-too-short';
  try {
    validateJwtSecret(candidate, 'staging');
    assert.fail('Should have thrown validation error');
  } catch (err: any) {
    assert.ok(!err.message.includes(candidate));
  }
});

// ─── 7. Actual Configuration Factory Invocation (authConfig) ──────────────────

test('22. Factory invocation: authConfig() in development returns valid config with dev default', () => {
  const prevSecret = process.env.JWT_SECRET;
  const prevEnv = process.env.NODE_ENV;
  try {
    delete process.env.JWT_SECRET;
    process.env.NODE_ENV = 'development';

    const config = authConfig();
    assert.equal(config.jwtSecret, DEV_JWT_SECRET);
    assert.equal(config.jwtExpiresIn, '7d');
  } finally {
    process.env.JWT_SECRET = prevSecret;
    process.env.NODE_ENV = prevEnv;
  }
});

test('23. Factory invocation: authConfig() in staging without JWT_SECRET throws immediately', () => {
  const prevSecret = process.env.JWT_SECRET;
  const prevEnv = process.env.NODE_ENV;
  try {
    delete process.env.JWT_SECRET;
    process.env.NODE_ENV = 'staging';

    assert.throws(
      () => authConfig(),
      /JWT_SECRET is required and cannot be empty when NODE_ENV is staging/,
    );
  } finally {
    process.env.JWT_SECRET = prevSecret;
    process.env.NODE_ENV = prevEnv;
  }
});

test('24. Factory invocation: authConfig() in staging with valid secret returns config object', () => {
  const prevSecret = process.env.JWT_SECRET;
  const prevEnv = process.env.NODE_ENV;
  try {
    process.env.JWT_SECRET = validSecret64;
    process.env.NODE_ENV = 'staging';

    const config = authConfig();
    assert.equal(config.jwtSecret, validSecret64);
    assert.equal(config.jwtExpiresIn, '7d');
  } finally {
    process.env.JWT_SECRET = prevSecret;
    process.env.NODE_ENV = prevEnv;
  }
});

test('25. Factory invocation: authConfig() without NODE_ENV and without JWT_SECRET throws immediately', () => {
  const prevSecret = process.env.JWT_SECRET;
  const prevEnv = process.env.NODE_ENV;
  try {
    delete process.env.JWT_SECRET;
    delete process.env.NODE_ENV;

    assert.throws(
      () => authConfig(),
      /JWT_SECRET is required and cannot be empty when NODE_ENV is unspecified \(missing NODE_ENV\)/,
    );
  } finally {
    process.env.JWT_SECRET = prevSecret;
    process.env.NODE_ENV = prevEnv;
  }
});
