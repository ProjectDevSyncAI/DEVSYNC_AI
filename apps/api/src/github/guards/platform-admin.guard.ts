import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { firstValueFrom, isObservable } from 'rxjs';

@Injectable()
export class PlatformAdminGuard extends AuthGuard('jwt') {
  override async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    // Reject worker secret on administrative inspection endpoints
    if (req?.headers?.['x-worker-secret'] !== undefined) {
      throw new UnauthorizedException(
        'Worker secret is not authorized for administrative inspection endpoints',
      );
    }

    const result = super.canActivate(context);
    const canProceed = isObservable(result)
      ? await firstValueFrom(result)
      : await result;

    if (!canProceed) {
      return false;
    }

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
