import {
  CanActivate,
  ExecutionContext,
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { assertProjectAccess } from '../../common/helpers/project-access.helper.js';

/**
 * Pre-upload guard that validates project membership before expensive Multer file buffering
 * when projectId is provided via query parameter (?projectId=) or header (x-project-id).
 */
@Injectable()
export class ProjectUploadGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const userId = req.user?.userId || req.user?.id;

    if (!userId) {
      throw new UnauthorizedException('Authentication required');
    }

    // Inspect pre-stream identifiers (query or header)
    const rawProjectId =
      req.query?.projectId ||
      req.headers?.['x-project-id'] ||
      req.body?.projectId;

    if (rawProjectId && typeof rawProjectId === 'string' && rawProjectId.trim()) {
      const cleanProjectId = rawProjectId.trim();
      // Enforce project authorization before Multer buffers or writes files
      await assertProjectAccess(this.prisma, userId, cleanProjectId);
      req.authorizedProjectId = cleanProjectId;
    }

    return true;
  }
}
