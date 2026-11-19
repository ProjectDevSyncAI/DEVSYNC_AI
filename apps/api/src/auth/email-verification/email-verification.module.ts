import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service.js';
import { EmailDeliveryService } from './email-delivery.service.js';
import { EmailVerificationRateLimiterService } from './email-verification-rate-limiter.service.js';
import { EmailVerificationService } from './email-verification.service.js';
import { EmailVerificationController } from './email-verification.controller.js';

@Module({
  imports: [ConfigModule],
  controllers: [EmailVerificationController],
  providers: [
    PrismaService,
    EmailDeliveryService,
    EmailVerificationRateLimiterService,
    EmailVerificationService,
  ],
  exports: [EmailVerificationService, EmailDeliveryService, EmailVerificationRateLimiterService],
})
export class EmailVerificationModule {}
