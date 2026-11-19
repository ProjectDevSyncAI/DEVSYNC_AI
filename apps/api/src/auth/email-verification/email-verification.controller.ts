import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../guards/jwt-auth.guard.js';
import { EmailVerificationService } from './email-verification.service.js';
import { RequestEmailVerificationDto } from './dto/request-email-verification.dto.js';
import { ResendEmailVerificationDto } from './dto/resend-email-verification.dto.js';
import { ConfirmEmailVerificationDto } from './dto/confirm-email-verification.dto.js';

@ApiTags('Email Verification')
@Controller('auth/email')
export class EmailVerificationController {
  constructor(
    private readonly emailVerificationService: EmailVerificationService,
  ) {}

  @Post('verify/request')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Request email verification',
    description:
      'Authenticated user requests initial verification email or initiates an email-change verification flow.',
  })
  @ApiResponse({ status: 200, description: 'Verification email sent successfully' })
  @ApiResponse({ status: 400, description: 'Email is already verified' })
  @ApiResponse({ status: 409, description: 'Target email is already registered to another user' })
  @ApiResponse({ status: 429, description: 'Cooldown active or hourly rate limit exceeded' })
  async requestVerification(
    @Req() req: Request & { user: { userId?: string; id?: string } },
    @Body() dto: RequestEmailVerificationDto,
  ) {
    const userId = req.user.userId || req.user.id;
    return this.emailVerificationService.requestVerification(userId!, dto);
  }

  @Post('verify/resend')
  @ApiOperation({
    summary: 'Resend email verification (public)',
    description:
      'Public endpoint allowing unverified users to request another verification email with strict anti-enumeration.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Consistent response returned regardless of whether the account exists or is unverified.',
  })
  @ApiResponse({ status: 429, description: 'Rate limit or cooldown exceeded' })
  async resendVerification(
    @Body() dto: ResendEmailVerificationDto,
    @Req() req: Request,
  ) {
    // Extract client IP securely.
    // If TRUST_PROXY env var is set to "true" or "1", extract first IP from X-Forwarded-For header
    // (only valid when behind a trusted reverse proxy). Otherwise, use the immediate socket address
    // to prevent client-controlled header spoofing.
    const isTrustProxy =
      process.env.TRUST_PROXY === 'true' || process.env.TRUST_PROXY === '1';

    let clientIp: string | undefined;
    if (isTrustProxy) {
      const rawForwarded = req?.headers ? req.headers['x-forwarded-for'] : undefined;
      let firstIp: string | undefined;
      if (typeof rawForwarded === 'string' && rawForwarded.trim()) {
        firstIp = rawForwarded.split(',')[0].trim();
      } else if (
        Array.isArray(rawForwarded) &&
        rawForwarded.length > 0 &&
        typeof rawForwarded[0] === 'string'
      ) {
        firstIp = rawForwarded[0].split(',')[0].trim();
      }
      // If IPv4 has a port suffix (e.g., "198.51.100.1:8080"), strip the port
      if (firstIp && /^\d{1,3}(\.\d{1,3}){3}:\d+$/.test(firstIp)) {
        firstIp = firstIp.split(':')[0];
      }
      clientIp = firstIp || req?.socket?.remoteAddress || req?.ip;
    } else {
      clientIp = req?.socket?.remoteAddress || req?.ip;
    }

    return this.emailVerificationService.resendVerification(dto, clientIp);
  }

  @Post('verify/confirm')
  @ApiOperation({
    summary: 'Confirm email verification',
    description:
      'Public endpoint accepting a secure 64-character verification token in JSON body to atomically verify email.',
  })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 400, description: 'Token has expired' })
  @ApiResponse({ status: 404, description: 'Invalid verification token' })
  @ApiResponse({ status: 409, description: 'Token has already been consumed or email conflict' })
  async confirmVerification(@Body() dto: ConfirmEmailVerificationDto) {
    return this.emailVerificationService.confirmVerification(dto);
  }

  @Get('status')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get email verification status',
    description: 'Returns the authenticated user verification status and pending email.',
  })
  @ApiResponse({ status: 200, description: 'Verification status returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getStatus(@Req() req: Request & { user: { userId?: string; id?: string } }) {
    const userId = req.user.userId || req.user.id;
    return this.emailVerificationService.getStatus(userId!);
  }
}
