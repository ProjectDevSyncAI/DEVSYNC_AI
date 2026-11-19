import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  verifyGithubSignature,
  WebhookUnauthorizedError,
} from './github-signature.validator.js';

interface RawBodyRequest extends Request {
  rawBody?: Buffer;
}

@Injectable()
export class GithubSignatureGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RawBodyRequest>();
    const secret = process.env.GITHUB_WEBHOOK_SECRET;
    const signature = request.headers['x-hub-signature-256'] as string | undefined;

    try {
      return verifyGithubSignature(signature, request.rawBody, secret);
    } catch (err) {
      if (err instanceof WebhookUnauthorizedError) {
        throw new UnauthorizedException(err.message);
      }
      throw new UnauthorizedException('Webhook verification failed');
    }
  }
}
