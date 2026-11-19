import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import * as crypto from 'node:crypto';
import { firstValueFrom, isObservable } from 'rxjs';

@Injectable()
export class WebhookAdminOrWorkerGuard extends AuthGuard('jwt') {
  override async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    // 1. Worker Secret Authentication Check
    const providedSecret = req?.headers?.['x-worker-secret'];
    if (providedSecret !== undefined) {
      const configuredSecret = process.env.INTERNAL_WORKER_SECRET;

      if (!configuredSecret || configuredSecret.trim().length === 0) {
        throw new UnauthorizedException(
          'Worker authentication secret is not configured on server',
        );
      }

      if (typeof providedSecret !== 'string') {
        throw new UnauthorizedException(
          'Invalid worker authentication secret header',
        );
      }

      const expected = Buffer.from(configuredSecret, 'utf8');
      const provided = Buffer.from(providedSecret, 'utf8');

      if (
        expected.length !== provided.length ||
        !crypto.timingSafeEqual(expected, provided)
      ) {
        throw new UnauthorizedException('Invalid worker authentication secret');
      }

      // Valid worker authentication: set worker flag without fabricating user identity
      req.isWorker = true;
      req.authType = 'worker';
      return true;
    }

    // 2. Fall back to JWT Authentication for Platform Administrators
    const result = super.canActivate(context);
    const canProceed = isObservable(result)
      ? await firstValueFrom(result)
      : await result;

    if (!canProceed) {
      return false;
    }

    // 3. Platform Administrator Authorization Check
    const user = req.user;
    const hasPlatformAdminRole =
      user?.platformRole === 'ADMIN' ||
      (user?.roles?.includes('ADMIN') && !user?.roles?.includes('OWNER'));

    if (!hasPlatformAdminRole) {
      throw new ForbiddenException(
        'Platform administrative privileges required for webhook operations',
      );
    }

    return true;
  }
}
