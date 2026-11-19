<<<<<<< HEAD

import { Injectable, UnauthorizedException } from '@nestjs/common';
=======
import { Injectable } from '@nestjs/common';
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

<<<<<<< HEAD
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface.js';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
=======
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
    const secret = configService.get<string>('auth.jwtSecret');

    if (!secret) {
      throw new Error('JWT_SECRET is not configured');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: secret,
<<<<<<< HEAD
      ignoreExpiration: false,
    });
  }

  async validate(payload: {
    sub: string;
    email: string;
    username: string;
    platformRole?: string;
    tokenVersion?: number;
    tv?: number;
    roles?: string[];
  }): Promise<AuthenticatedUser> {
    if (!payload?.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }

    const user = await this.prisma.user.findUnique({
      where: {
        id: payload.sub,
      },
      select: {
        id: true,
        email: true,
        username: true,
        platformRole: true,
        tokenVersion: true,
        status: true,
        emailVerifiedAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    // Reject inactive accounts.
    if (
      user.status === 'DEACTIVATED' ||
      user.status === 'SUSPENDED'
    ) {
      throw new UnauthorizedException('User account is inactive');
    }

    // Validate token version to support token revocation.
    const payloadTokenVersion =
      payload.tokenVersion ?? payload.tv;

    if (
      payloadTokenVersion === undefined ||
      payloadTokenVersion !== user.tokenVersion
    ) {
      throw new UnauthorizedException(
        'Token has been revoked or invalidated',
      );
    }

    // IMPORTANT:
    // Do not reject unverified users here.
    // They need access to email status, resend and confirmation workflows.
    // Use EmailVerifiedGuard on features that require verified accounts.

    const authoritativeRole = user.platformRole || 'USER';

    return {
      userId: user.id,
      id: user.id,
      email: user.email,
      username: user.username,
      platformRole: authoritativeRole,
      tokenVersion: user.tokenVersion,
      emailVerifiedAt: user.emailVerifiedAt,
      roles: [authoritativeRole],
    };
  }
}
=======
    });
  }

  validate(payload: {
    sub: string;
    email: string;
    username: string;
  }) {
    return {
      userId: payload.sub,
      email: payload.email,
      username: payload.username,
    };
  }
}
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
