import { BadRequestException } from '@nestjs/common';

export const FORBIDDEN_METADATA_KEYS = new Set([
  'password',
  'passwordhash',
  'token',
  'accesstoken',
  'refreshtoken',
  'secret',
  'authsecret',
  'jwtsecret',
  'privatekey',
  'apikey',
  'credential',
  'credentials',
  'authorization',
  'tokenversion',
  'oauth',
  'oauthtoken',
]);

export const SENSITIVE_KEY_PATTERNS = [
  'password',
  'secret',
  'token',
  'privatekey',
  'apikey',
  'credential',
  'tokenversion',
  'authorization',
];

export function isForbiddenMetadataKey(key: string): boolean {
  const normalized = key.toLowerCase().replace(/[^a-z]/g, '');
  if (FORBIDDEN_METADATA_KEYS.has(normalized)) {
    return true;
  }
  return SENSITIVE_KEY_PATTERNS.some((pattern) => normalized.includes(pattern));
}

export function validateActivityMetadata(
  metadata: unknown,
): Record<string, unknown> | undefined {
  if (metadata === undefined || metadata === null) {
    return undefined;
  }

  if (typeof metadata !== 'object' || Array.isArray(metadata)) {
    throw new BadRequestException('Metadata must be a plain JSON object');
  }

  const proto = Object.getPrototypeOf(metadata);
  if (proto !== null && proto !== Object.prototype) {
    throw new BadRequestException('Metadata must be a plain object');
  }

  let serialized: string;
  try {
    serialized = JSON.stringify(metadata);
    if (!serialized) {
      throw new Error();
    }
  } catch {
    throw new BadRequestException('Metadata contains non-serializable values');
  }

  // Measure in UTF-8 bytes, not JS character count
  const byteLength = Buffer.byteLength(serialized, 'utf8');
  if (byteLength > 10240) {
    throw new BadRequestException(
      `Metadata byte size (${byteLength} bytes) exceeds maximum permitted limit (10240 bytes)`,
    );
  }

  // Recursive inspection for sensitive keys and nesting depth
  function inspectNode(node: any, depth = 0) {
    if (depth > 5) {
      throw new BadRequestException(
        'Metadata nesting depth cannot exceed 5 levels',
      );
    }
    if (node && typeof node === 'object') {
      if (Array.isArray(node)) {
        for (const item of node) {
          inspectNode(item, depth + 1);
        }
      } else {
        for (const [key, val] of Object.entries(node)) {
          if (isForbiddenMetadataKey(key)) {
            throw new BadRequestException(
              `Metadata key "${key}" is prohibited: credentials and security-sensitive tokens cannot be stored in activity records`,
            );
          }
          inspectNode(val, depth + 1);
        }
      }
    }
  }

  inspectNode(metadata);
  return JSON.parse(serialized);
}
