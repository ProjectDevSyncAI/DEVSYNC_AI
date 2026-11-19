import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as crypto from 'node:crypto';
import { PrismaService } from '../../database/prisma.service.js';
import { EmailDeliveryService, VerificationPurpose } from './email-delivery.service.js';
import { EmailVerificationRateLimiterService } from './email-verification-rate-limiter.service.js';
import { RequestEmailVerificationDto } from './dto/request-email-verification.dto.js';
import { ResendEmailVerificationDto } from './dto/resend-email-verification.dto.js';
import { ConfirmEmailVerificationDto } from './dto/confirm-email-verification.dto.js';

export const INITIAL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
export const EMAIL_CHANGE_TTL_MS = 1 * 60 * 60 * 1000; // 1 hour
export const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds
export const MAX_REQUESTS_PER_HOUR = 5;
export const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

export interface EmailVerificationTokenRecord {
  id: string;
  userId: string;
  email: string;
  tokenHash: string;
  purpose: VerificationPurpose;
  expiresAt: Date;
  consumedAt: Date | null;
  createdAt: Date;
}

@Injectable()
export class EmailVerificationService {
  private readonly logger = new Logger(EmailVerificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailDelivery: EmailDeliveryService,
    private readonly rateLimiter: EmailVerificationRateLimiterService,
  ) {}

  /**
   * Helper accessor for EmailVerificationToken delegate
   */
  private get tokenDelegate(): any {
    return (this.prisma as any).emailVerificationToken;
  }

  /**
   * Generates a 32-byte cryptographically secure random hexadecimal token (64 hex characters)
   */
  generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generates SHA-256 hash of a raw token for safe database persistence
   */
  hashToken(rawToken: string): string {
    return crypto.createHash('sha256').update(rawToken.trim().toLowerCase()).digest('hex');
  }

  /**
   * Authenticated user requests initial email verification or initiates an email-change request
   */
  async requestVerification(userId: string, dto: RequestEmailVerificationDto) {
    const user: any = await (this.prisma.user as any).findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        emailVerifiedAt: true,
        pendingEmail: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }
    const accountEmail = String(user.email || '')
  .trim()
  .toLowerCase();

if (!accountEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(accountEmail)) {
  throw new BadRequestException(
    'Your account does not have a valid email address. Please update your account email.',
  );
}


    const requestedEmail = dto.email ? dto.email.trim().toLowerCase() : null;
    const isEmailChange = Boolean(requestedEmail && requestedEmail !== user.email);

    if (isEmailChange && requestedEmail) {
      // 1. Email Change Flow
      // Validate that target email is not already claimed by another user
      const existingCollision = await this.prisma.user.findFirst({
        where: {
          email: requestedEmail,
          id: { not: user.id },
        },
      });

      if (existingCollision) {
        throw new ConflictException('Email is already registered');
      }

      // Check cooldown and rate limits (authenticated: throws 429 or 503 on limit/error)
      await this.rateLimiter.acquireSlot(user.id, requestedEmail, { silent: false });

      // Store pendingEmail on User without overwriting verified email
      await (this.prisma.user as any).update({
        where: { id: user.id },
        data: { pendingEmail: requestedEmail },
      });

      // Invalidate prior unconsumed EMAIL_CHANGE tokens for this user
      await this.tokenDelegate.updateMany({
        where: {
          userId: user.id,
          purpose: 'EMAIL_CHANGE',
          consumedAt: null,
        },
        data: { consumedAt: new Date() },
      });

      // Generate cryptographically secure token & SHA-256 hash
      const rawToken = this.generateSecureToken();
      const tokenHash = this.hashToken(rawToken);
      const expiresAt = new Date(Date.now() + EMAIL_CHANGE_TTL_MS);

      await this.tokenDelegate.create({
        data: {
          userId: user.id,
          email: requestedEmail,
          tokenHash,
          purpose: 'EMAIL_CHANGE',
          expiresAt,
        },
      });

      // Dispatch verification email to the NEW pending address
      const deliveryResult = await this.emailDelivery.sendVerificationEmail({
        to: requestedEmail,
        rawToken,
        purpose: 'EMAIL_CHANGE',
        username: user.username,
      });

      if (!deliveryResult.success) {
        throw new HttpException(
          'Failed to dispatch verification email. Please try again later.',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      return {
        success: true,
        message: `Verification email sent to ${requestedEmail}`,
        email: requestedEmail,
        purpose: 'EMAIL_CHANGE',
      };
    } else {
      // 2. Initial Registration Verification Flow
      if (user.emailVerifiedAt) {
        throw new BadRequestException('Email address is already verified');
      }

      // Check cooldown and rate limits (authenticated: throws 429 or 503 on limit/error)
      await this.rateLimiter.acquireSlot(user.id, user.email, { silent: false });

      // Invalidate prior unconsumed INITIAL_VERIFICATION tokens for this user
      await this.tokenDelegate.updateMany({
        where: {
          userId: user.id,
          purpose: 'INITIAL_VERIFICATION',
          consumedAt: null,
        },
        data: { consumedAt: new Date() },
      });

      // Generate cryptographically secure token & SHA-256 hash
      const rawToken = this.generateSecureToken();
      const tokenHash = this.hashToken(rawToken);
      const expiresAt = new Date(Date.now() + INITIAL_VERIFICATION_TTL_MS);

      await this.tokenDelegate.create({
        data: {
          userId: user.id,
          email: user.email,
          tokenHash,
          purpose: 'INITIAL_VERIFICATION',
          expiresAt,
        },
      });

      // Dispatch verification email
      const deliveryResult = await this.emailDelivery.sendVerificationEmail({
        to: user.email,
        rawToken,
        purpose: 'INITIAL_VERIFICATION',
        username: user.username,
      });

      if (!deliveryResult.success) {
        throw new HttpException(
          'Failed to dispatch verification email. Please try again later.',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      return {
        success: true,
        message: 'Verification email sent',
        email: user.email,
        purpose: 'INITIAL_VERIFICATION',
      };
    }
  }

  /**
   * Public resend endpoint with strict anti-enumeration guarantees.
   * Returns identical HTTP 200 response and body for nonexistent, verified, and rate-limited unverified accounts.
   */
  async resendVerification(dto: ResendEmailVerificationDto, clientIp?: string) {
    // Check IP-level rate limiting if client IP is available (abuse protection, leaks no account info)
    if (clientIp) {
      await this.rateLimiter.checkIpRateLimit(clientIp);
    }

    const normalizedEmail = dto.email.trim().toLowerCase();
    const antiEnumerationResponse = {
      success: true,
      message: 'If an unverified account exists for this email, a verification link has been sent.',
    };

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        username: true,
        emailVerifiedAt: true,
      },
    });

    // Anti-enumeration: if user doesn't exist or is already verified, return identical response
    if (!user || user.emailVerifiedAt) {
      return antiEnumerationResponse;
    }

    // Apply rate limits silently for public resend (anti-enumeration: do NOT throw 429 on account cooldown)
    const slot = await this.rateLimiter.acquireSlot(user.id, user.email, { silent: true });
    if (!slot.allowed) {
      this.logger.debug(
        `Resend suppressed for ${this.emailDelivery.maskEmail(user.email)} due to ${slot.reason}`,
      );
      // Suppress token creation and email dispatch; return identical 200 response
      return antiEnumerationResponse;
    }

    // Invalidate prior unconsumed INITIAL_VERIFICATION tokens
    await this.tokenDelegate.updateMany({
      where: {
        userId: user.id,
        purpose: 'INITIAL_VERIFICATION',
        consumedAt: null,
      },
      data: { consumedAt: new Date() },
    });

    const rawToken = this.generateSecureToken();
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + INITIAL_VERIFICATION_TTL_MS);

    await this.tokenDelegate.create({
      data: {
        userId: user.id,
        email: user.email,
        tokenHash,
        purpose: 'INITIAL_VERIFICATION',
        expiresAt,
      },
    });

    const deliveryResult = await this.emailDelivery.sendVerificationEmail({
      to: user.email,
      rawToken,
      purpose: 'INITIAL_VERIFICATION',
      username: user.username,
    });

    if (!deliveryResult.success) {
      this.logger.error(
        `Resend delivery failed via ${deliveryResult.provider} for ${this.emailDelivery.maskEmail(user.email)}`,
      );
    }

    return antiEnumerationResponse;
  }

  /**
   * Public confirmation endpoint: atomically verifies and consumes token inside database transaction
   */
  async confirmVerification(dto: ConfirmEmailVerificationDto) {
    const tokenHash = this.hashToken(dto.token);

    const tokenRecord = await this.tokenDelegate.findUnique({
      where: { tokenHash },
    });

    if (!tokenRecord) {
      throw new NotFoundException('Invalid verification token');
    }

    if (tokenRecord.consumedAt) {
      throw new ConflictException('Verification token has already been used');
    }

    if (new Date() > new Date(tokenRecord.expiresAt)) {
      throw new BadRequestException('Verification token has expired');
    }

    if (
      tokenRecord.purpose !== 'INITIAL_VERIFICATION' &&
      tokenRecord.purpose !== 'EMAIL_CHANGE'
    ) {
      throw new BadRequestException('Invalid verification purpose');
    }

    const execute = async (tx: any) => {
      const txToken = tx.emailVerificationToken ?? (tx as any).emailVerificationToken;

      // 1. Atomic token consumption via conditional updateMany inside the transaction
      const updateResult = await txToken.updateMany({
        where: {
          id: tokenRecord.id,
          consumedAt: null,
        },
        data: {
          consumedAt: new Date(),
        },
      });

      if (updateResult.count !== 1) {
        throw new ConflictException('Verification token has already been used');
      }

      // 2. Purpose-specific fulfillment inside the same atomic transaction
      if (tokenRecord.purpose === 'EMAIL_CHANGE') {
        const user = await tx.user.findUnique({
          where: { id: tokenRecord.userId },
          select: { id: true, email: true, pendingEmail: true },
        });

        if (!user) {
          throw new BadRequestException('User no longer exists');
        }

        if (user.pendingEmail !== tokenRecord.email) {
          throw new BadRequestException('Pending email address mismatch');
        }

        // Verify target email has not been claimed by another user in the interim
        const collision = await tx.user.findFirst({
          where: {
            email: tokenRecord.email,
            id: { not: user.id },
          },
        });

        if (collision) {
          throw new ConflictException('Email address is already claimed by another user');
        }

        // Commit email change, clear pendingEmail, mark verified
        await tx.user.update({
          where: { id: user.id },
          data: {
            email: tokenRecord.email,
            pendingEmail: null,
            emailVerifiedAt: new Date(),
          },
        });
      } else {
        // Initial registration verification
        const user = await tx.user.findUnique({
          where: { id: tokenRecord.userId },
          select: { id: true, email: true },
        });

        if (!user) {
          throw new BadRequestException('User no longer exists');
        }

        if (user.email !== tokenRecord.email) {
          throw new BadRequestException('Token email mismatch');
        }

        await tx.user.update({
          where: { id: user.id },
          data: {
            emailVerifiedAt: new Date(),
          },
        });
      }

      return {
        success: true,
        message: 'Email verified successfully',
        purpose: tokenRecord.purpose,
      };
    };

    if (typeof this.prisma.$transaction === 'function') {
      return this.prisma.$transaction(execute);
    }
    return execute(this.prisma);
  }

  /**
   * Authenticated endpoint to retrieve user's current email verification status
   */
  async getStatus(userId: string) {
    const user: any = await (this.prisma.user as any).findUnique({
      where: { id: userId },
      select: {
        email: true,
        pendingEmail: true,
        emailVerifiedAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    return {
      email: user.email,
      isVerified: Boolean(user.emailVerifiedAt),
      emailVerifiedAt: user.emailVerifiedAt ? new Date(user.emailVerifiedAt).toISOString() : null,
      pendingEmail: user.pendingEmail ?? null,
    };
  }
}
