import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import * as crypto from 'node:crypto';
import { firstValueFrom, isObservable } from 'rxjs';

/**
 * ReconciliationAuthGuard
 *
 * Protects global reconciliation endpoints:
 * 1. Allows trusted worker identity via x-worker-secret header matching INTERNAL_WORKER_SECRET.
 * 2. Allows platform administrators via JWT authentication where user.platformRole === 'ADMIN'.
 * 3. Rejects ordinary authenticated users (USER, DEVELOPER, etc.) with 403 Forbidden.
 * 4. Rejects tenant-level organization administrators without platform ADMIN with 403 Forbidden.
 * 5. Rejects unauthenticated requests with 401 Unauthorized.
 */
@Injectable()
export class ReconciliationAuthGuard extends AuthGuard('jwt') {
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

      req.isWorker = true;
      req.authType = 'worker';
      return true;
    }

    // 2. JWT Authentication for Platform Administrators
    const result = super.canActivate(context);
    const canProceed = isObservable(result)
      ? await firstValueFrom(result)
      : await result;

    if (!canProceed) {
      return false;
    }

    // 3. Platform Administrator Authorization Check
    const user = req.user;
    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    const hasPlatformAdminRole =
      user.platformRole === 'ADMIN' ||
      (Array.isArray(user.roles) &&
        user.roles.includes('ADMIN') &&
        !user.roles.includes('OWNER'));

    if (!hasPlatformAdminRole) {
      throw new ForbiddenException(
        'Platform administrative privileges required for document reconciliation',
      );
    }

    return true;
  }
}
