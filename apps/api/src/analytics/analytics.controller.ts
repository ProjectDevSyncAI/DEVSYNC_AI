import {
<<<<<<< HEAD
  BadRequestException,
=======
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
  Body,
  Controller,
  Delete,
  Get,
<<<<<<< HEAD
  NotFoundException,
  Optional,
  Param,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import {
  assertProjectAccess,
  getAuthorizedProjectIds,
} from '../common/helpers/project-access.helper.js';
import { PrismaService } from '../database/prisma.service.js';
import { AnalyticsService } from './analytics.service.js';
import { DashboardOverviewService } from './dashboard-overview.service.js';
import { CreateAnalyticsDto } from './dto/create-analytics.dto.js';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly prisma: PrismaService,
    @Optional()
    private readonly dashboardOverviewService?: DashboardOverviewService,
  ) {}

  @Post()
  async create(@Req() req: any, @Body() dto: CreateAnalyticsDto) {
    const actorUserId = req.user?.userId || req.user?.id;
    if (!actorUserId) {
      throw new UnauthorizedException('Authentication required');
    }
    await assertProjectAccess(this.prisma, actorUserId, dto.projectId);
=======
  Param,
  Post,
  Query,
} from '@nestjs/common';

import { AnalyticsService } from './analytics.service.js';
import { CreateAnalyticsDto } from './dto/create-analytics.dto.js';

@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
  ) {}

  @Post()
  create(@Body() dto: CreateAnalyticsDto) {
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
    return this.analyticsService.create(dto);
  }

  @Get()
<<<<<<< HEAD
  async findAll(@Req() req: any, @Query('projectId') projectId?: string) {
    const actorUserId = req.user?.userId || req.user?.id;
    if (!actorUserId) {
      throw new UnauthorizedException('Authentication required');
    }
    if (projectId) {
      await assertProjectAccess(this.prisma, actorUserId, projectId);
      return this.analyticsService.findAll(projectId);
    }
    const authorizedProjectIds = await getAuthorizedProjectIds(this.prisma, actorUserId);
    if (authorizedProjectIds.length === 0) {
      return [];
    }
    return this.analyticsService.findAllForProjects(authorizedProjectIds);
  }

  @Get('project/:projectId')
  async findByProject(@Req() req: any, @Param('projectId') projectId: string) {
    const actorUserId = req.user?.userId || req.user?.id;
    if (!actorUserId) {
      throw new UnauthorizedException('Authentication required');
    }
    await assertProjectAccess(this.prisma, actorUserId, projectId);
=======
  findAll(@Query('projectId') projectId?: string) {
    return this.analyticsService.findAll(projectId);
  }

  @Get('project/:projectId')
  findByProject(@Param('projectId') projectId: string) {
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
    return this.analyticsService.findByProject(projectId);
  }

  @Get('project/:projectId/latest')
<<<<<<< HEAD
  async getLatest(@Req() req: any, @Param('projectId') projectId: string) {
    const actorUserId = req.user?.userId || req.user?.id;
    if (!actorUserId) {
      throw new UnauthorizedException('Authentication required');
    }
    await assertProjectAccess(this.prisma, actorUserId, projectId);
=======
  getLatest(@Param('projectId') projectId: string) {
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
    return this.analyticsService.getLatest(projectId);
  }

  @Get('project/:projectId/summary')
<<<<<<< HEAD
  async getSummary(@Req() req: any, @Param('projectId') projectId: string) {
    const actorUserId = req.user?.userId || req.user?.id;
    if (!actorUserId) {
      throw new UnauthorizedException('Authentication required');
    }
    await assertProjectAccess(this.prisma, actorUserId, projectId);
    return this.analyticsService.getSummary(projectId);
  }

  @Get('project/:projectId/dashboard')
  async getDashboardOverview(
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
    if (!this.dashboardOverviewService) {
      throw new NotFoundException('Dashboard overview service unavailable');
    }
    return this.dashboardOverviewService.getDashboardOverview(projectId.trim());
  }

  @Get(':id')
  async findById(@Req() req: any, @Param('id') id: string) {
    const actorUserId = req.user?.userId || req.user?.id;
    if (!actorUserId) {
      throw new UnauthorizedException('Authentication required');
    }
    const analytics = await this.analyticsService.findById(id);
    await assertProjectAccess(this.prisma, actorUserId, analytics.projectId);
    return analytics;
  }

  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    const actorUserId = req.user?.userId || req.user?.id;
    if (!actorUserId) {
      throw new UnauthorizedException('Authentication required');
    }
    const analytics = await this.analyticsService.findById(id);
    await assertProjectAccess(this.prisma, actorUserId, analytics.projectId);
=======
  getSummary(@Param('projectId') projectId: string) {
    return this.analyticsService.getSummary(projectId);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.analyticsService.findById(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
    return this.analyticsService.remove(id);
  }
}