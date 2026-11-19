import * as crypto from 'node:crypto';

export class WebhookUnauthorizedError extends Error {
  readonly statusCode = 401;
  constructor(message: string) {
    super(message);
    this.name = 'WebhookUnauthorizedError';
  }
}

export function verifyGithubSignature(
  signatureHeader: string | undefined,
  rawBody: Buffer | undefined,
  secret: string | undefined,
): boolean {
  if (!secret || secret.trim().length === 0) {
    throw new WebhookUnauthorizedError('GitHub webhook secret is not configured');
  }

  if (!signatureHeader || typeof signatureHeader !== 'string') {
    throw new WebhookUnauthorizedError('Missing x-hub-signature-256 header');
  }

  // Require exact format: sha256=<64 hexadecimal characters>
  const sha256Regex = /^sha256=[0-9a-fA-F]{64}$/;
  if (!sha256Regex.test(signatureHeader)) {
    throw new WebhookUnauthorizedError('Malformed x-hub-signature-256 header format');
  }

  if (!rawBody || !Buffer.isBuffer(rawBody)) {
    throw new WebhookUnauthorizedError('Missing raw request body for webhook signature verification');
  }

  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(rawBody);
  const expectedSignature = `sha256=${hmac.digest('hex')}`;

  const signatureBuffer = Buffer.from(signatureHeader, 'utf8');
  const expectedBuffer = Buffer.from(expectedSignature, 'utf8');

  if (signatureBuffer.length !== expectedBuffer.length) {
    throw new WebhookUnauthorizedError('Invalid webhook signature');
  }

  const isMatch = crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
  if (!isMatch) {
    throw new WebhookUnauthorizedError('Invalid webhook signature');
  }

  return true;
}
