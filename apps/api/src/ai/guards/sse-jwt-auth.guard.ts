import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';

@Injectable()
export class SseJwtAuthGuard extends JwtAuthGuard {
  private readonly jwtService: JwtService;
  private readonly configService: ConfigService;

  constructor(
    jwtService: JwtService,
    configService: ConfigService,
  ) {
    super();
    this.jwtService = jwtService;
    this.configService = configService;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // 1. If standard Authorization Bearer header is present, use parent guard
    if (request.headers.authorization) {
      try {
        return (await super.canActivate(context)) as boolean;
      } catch {
        // Fall through to query token check if header failed
      }
    }

    // 2. Otherwise extract token specifically from query parameter for SSE
    const queryToken = request.query?.token as string | undefined;
    if (!queryToken || queryToken.trim().length === 0) {
      throw new UnauthorizedException('Missing authentication token for SSE stream');
    }

    try {
      const secret = this.configService.get<string>('auth.jwtSecret');
      const payload = await this.jwtService.verifyAsync(queryToken, { secret });
      request.user = {
        userId: payload.sub,
        id: payload.sub,
        email: payload.email,
        username: payload.username,
        roles: payload.roles,
      };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired authentication token for SSE stream');
    }
  }
}
