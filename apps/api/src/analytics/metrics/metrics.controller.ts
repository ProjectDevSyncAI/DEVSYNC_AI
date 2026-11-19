import {
<<<<<<< HEAD
  BadRequestException,
  Controller,
  Get,
  Param,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { assertProjectAccess } from '../../common/helpers/project-access.helper.js';
import { PrismaService } from '../../database/prisma.service.js';
import { MetricsService } from './metrics.service.js';

@Controller('analytics/metrics')
@UseGuards(JwtAuthGuard)
export class MetricsController {
  constructor(
    private readonly metricsService: MetricsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get(':projectId')
  async getProjectMetrics(
    @Req() req: any,
    @Param('projectId') projectId: string,
  ) {
    const actorUserId = req.user?.userId || req.user?.id;
    if (!actorUserId) {
      throw new UnauthorizedException('Authentication required');
    }
    if (!projectId || typeof projectId !== 'string' || !projectId.trim()) {
      throw new BadRequestException('Valid projectId is required');
    }
    await assertProjectAccess(this.prisma, actorUserId, projectId.trim());
    return this.metricsService.getProjectMetrics(projectId.trim());
=======
  Controller,
  Get,
  Param,
} from '@nestjs/common';

import { MetricsService } from './metrics.service.js';

@Controller('analytics/metrics')
export class MetricsController {
  constructor(
    private readonly metricsService: MetricsService,
  ) {}

  @Get(':projectId')
  getProjectMetrics(
    @Param('projectId') projectId: string,
  ) {
    return this.metricsService.getProjectMetrics(projectId);
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
  }
}