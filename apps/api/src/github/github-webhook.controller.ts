import {
  Body,
  Controller,
<<<<<<< HEAD
  ForbiddenException,
  Get,
  Headers,
  Param,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import * as crypto from 'node:crypto';

import { GithubWebhookService } from './github-webhook.service.js';
import { CreateWebhookEventDto } from './dto/create-webhook-event.dto.js';
import { GithubSignatureGuard } from './guards/github-signature.guard.js';
import { PlatformAdminGuard } from './guards/platform-admin.guard.js';
import { WebhookAdminOrWorkerGuard } from './guards/webhook-admin-or-worker.guard.js';
import { PrismaService } from '../database/prisma.service.js';

@Controller('github/webhooks')
export class GithubWebhookController {
  private readonly webhookService: GithubWebhookService;

  constructor(
    webhookService: GithubWebhookService,
    private readonly prisma?: PrismaService,
  ) {
    this.webhookService = webhookService;
  }

  @Post('incoming')
  @UseGuards(GithubSignatureGuard)
  handleIncoming(
    @Headers('x-github-event') githubEvent: string,
    @Headers('x-github-delivery') githubDelivery: string,
    @Body() payload: Record<string, any>,
  ) {
    const deliveryId = githubDelivery || `del-${Date.now()}`;
    let eventType = (githubEvent || payload?.event || 'UNKNOWN').toUpperCase();
    if (eventType === 'PULL_REQUEST_TARGET') eventType = 'PULL_REQUEST';

    return this.webhookService.create({
      deliveryId,
      eventType,
      action: payload?.action,
      payload,
    });
  }

  @Post()
  @UseGuards(GithubSignatureGuard)
  create(@Body() dto: CreateWebhookEventDto) {
    if (!dto.deliveryId) {
      dto.deliveryId = `del-${Date.now()}`;
    }
=======
  Get,
  Param,
  Post,
} from '@nestjs/common';

import { GithubWebhookService } from './github-webhook.service.js';
import { CreateWebhookEventDto } from './dto/create-webhook-event.dto.js';

@Controller('github/webhooks')
export class GithubWebhookController {
  constructor(
    private readonly webhookService: GithubWebhookService,
  ) {}

  @Post()
  create(@Body() dto: CreateWebhookEventDto) {
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
    return this.webhookService.create(dto);
  }

  @Get()
<<<<<<< HEAD
  @UseGuards(PlatformAdminGuard)
  async findAll(@Req() req: any) {
    await this.assertPlatformAdminAccess(req);
=======
  findAll() {
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
    return this.webhookService.findAll();
  }

  @Get(':id')
<<<<<<< HEAD
  @UseGuards(PlatformAdminGuard)
  async findById(@Req() req: any, @Param('id') id: string) {
    await this.assertPlatformAdminAccess(req);
=======
  findById(@Param('id') id: string) {
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
    return this.webhookService.findById(id);
  }

  @Post(':id/process')
<<<<<<< HEAD
  @UseGuards(WebhookAdminOrWorkerGuard)
  async markProcessed(@Req() req: any, @Param('id') id: string) {
    await this.assertAdminOrWorkerAccess(req);
=======
  markProcessed(@Param('id') id: string) {
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
    return this.webhookService.markProcessed(id);
  }

  @Post(':id/fail')
<<<<<<< HEAD
  @UseGuards(WebhookAdminOrWorkerGuard)
  async markFailed(
    @Req() req: any,
    @Param('id') id: string,
    @Body('errorMessage') errorMessage: string,
  ) {
    await this.assertAdminOrWorkerAccess(req);
=======
  markFailed(
    @Param('id') id: string,
    @Body('errorMessage') errorMessage: string,
  ) {
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
    return this.webhookService.markFailed(
      id,
      errorMessage,
    );
  }
<<<<<<< HEAD

  private async assertPlatformAdminAccess(req: any) {
    // Worker secret is NOT permitted on administrative inspection endpoints
    if (req?.headers?.['x-worker-secret'] !== undefined && !req?.user) {
      throw new UnauthorizedException(
        'Worker secret is not authorized for administrative inspection endpoints',
      );
    }

    const actorUserId = req?.user?.userId || req?.user?.id;
    if (!actorUserId) {
      throw new UnauthorizedException('Authentication required');
    }

    if (
      req.user?.platformRole === 'ADMIN' ||
      (req.user?.roles?.includes('ADMIN') && !req.user?.roles?.includes('OWNER'))
    ) {
      return;
    }

    // Organization-level admin does NOT grant platform-wide webhook access
    throw new ForbiddenException(
      'Platform administrative privileges required',
    );
  }

  private async assertAdminOrWorkerAccess(req: any) {
    // 1. Worker authenticated via guard
    if (req?.isWorker) {
      return;
    }

    // 2. Direct worker secret evaluation (fallback for unit tests / direct calls)
    const providedWorkerSecret = req?.headers?.['x-worker-secret'];
    if (providedWorkerSecret !== undefined) {
      const workerSecret = process.env.INTERNAL_WORKER_SECRET;
      if (!workerSecret || workerSecret.trim().length === 0) {
        throw new UnauthorizedException(
          'Worker authentication secret is not configured on server',
        );
      }
      if (typeof providedWorkerSecret !== 'string') {
        throw new UnauthorizedException(
          'Invalid worker authentication secret header',
        );
      }
      const expected = Buffer.from(workerSecret, 'utf8');
      const provided = Buffer.from(providedWorkerSecret, 'utf8');
      if (expected.length === provided.length && crypto.timingSafeEqual(expected, provided)) {
        req.isWorker = true;
        return;
      }
      throw new UnauthorizedException('Invalid worker authentication secret');
    }

    // 3. Authenticated user identity check
    const actorUserId = req?.user?.userId || req?.user?.id;
    if (!actorUserId) {
      throw new UnauthorizedException('Authentication required');
    }

    // 4. Platform administrator check
    if (
      req.user?.platformRole === 'ADMIN' ||
      (req.user?.roles?.includes('ADMIN') && !req.user?.roles?.includes('OWNER'))
    ) {
      return;
    }

    // Organization-level admin does NOT grant platform-wide webhook mutation access
    throw new ForbiddenException('Platform administrative privileges required');
  }
}
=======
}
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
