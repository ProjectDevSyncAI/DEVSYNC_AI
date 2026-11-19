import {
<<<<<<< HEAD
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
=======
  Body,
  Controller,
  Delete,
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
  Get,
  Param,
  Patch,
  Post,
  Query,
<<<<<<< HEAD
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
import { ActivityService, MAX_ACTIVITY_PAGE, MAX_ACTIVITY_LIMIT } from './activity.service.js';
import { CreateActivityDto } from './dto/create-activity.dto.js';
import { QueryActivityDto } from './dto/query-activity.dto.js';
import { UpdateActivityDto } from './dto/update-activity.dto.js';
import { validateActivityMetadata } from './helpers/metadata-validator.helper.js';

@Controller('activity')
@UseGuards(JwtAuthGuard)
export class ActivityController {
  constructor(
    private readonly activityService: ActivityService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  async create(@Req() req: any, @Body() dto: CreateActivityDto) {
    const actorUserId = req.user?.userId || req.user?.id;
    if (!actorUserId) {
      throw new UnauthorizedException('Authentication required');
    }

    if (!dto.type || typeof dto.type !== 'string' || !dto.type.trim()) {
      throw new BadRequestException('Activity type is required');
    }
    if (!dto.title || typeof dto.title !== 'string' || !dto.title.trim()) {
      throw new BadRequestException('Activity title is required');
    }
    if (dto.description && dto.description.length > 2000) {
      throw new BadRequestException(
        'Activity description cannot exceed 2000 characters',
      );
    }
    if (dto.metadata !== undefined && dto.metadata !== null) {
      dto.metadata = validateActivityMetadata(dto.metadata);
    }

    // Force actor identity from verified JWT to prevent impersonation
    dto.userId = actorUserId;

    if (dto.projectId) {
      await assertProjectAccess(this.prisma, actorUserId, dto.projectId);
    }

=======
} from '@nestjs/common';

import { ActivityService } from './activity.service.js';
import { CreateActivityDto } from './dto/create-activity.dto.js';
import { UpdateActivityDto } from './dto/update-activity.dto.js';

@Controller('activity')
export class ActivityController {
  constructor(
    private readonly activityService: ActivityService,
  ) {}

  @Post()
  create(@Body() dto: CreateActivityDto) {
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
    return this.activityService.create(dto);
  }

  @Get()
<<<<<<< HEAD
  async findAll(
    @Req() req: any,
    @Query() query: QueryActivityDto = new QueryActivityDto(),
  ) {
    const actorUserId = req.user?.userId || req.user?.id;
    if (!actorUserId) {
      throw new UnauthorizedException('Authentication required');
    }

    const rawPage = query.page ?? 1;
    const rawLimit = query.limit ?? 20;

    const pageNum = Number(rawPage);
    const limitNum = Number(rawLimit);

    if (!Number.isInteger(pageNum) || pageNum < 1 || !Number.isSafeInteger(pageNum)) {
      throw new BadRequestException('Page must be a valid positive integer');
    }
    if (pageNum > MAX_ACTIVITY_PAGE) {
      throw new BadRequestException(`Page cannot exceed ${MAX_ACTIVITY_PAGE}`);
    }

    if (!Number.isInteger(limitNum) || limitNum < 1 || limitNum > MAX_ACTIVITY_LIMIT || !Number.isSafeInteger(limitNum)) {
      throw new BadRequestException(`Limit must be an integer between 1 and ${MAX_ACTIVITY_LIMIT}`);
    }

    const { projectId, userId, type } = query;

    if (projectId) {
      await assertProjectAccess(this.prisma, actorUserId, projectId);
      return this.activityService.findAll(projectId, userId, type, pageNum, limitNum);
    }

    // Scope B: Enforce that an ordinary user cannot query other users' activity across projects
    if (userId && userId !== actorUserId && req.user?.platformRole !== 'ADMIN') {
      throw new ForbiddenException(
        'Cannot query other users activity across projects without platform administrator privileges',
      );
    }

    const authorizedProjectIds = await getAuthorizedProjectIds(
      this.prisma,
      actorUserId,
    );
    if (authorizedProjectIds.length === 0) {
      return {
        items: [],
        page: pageNum,
        limit: limitNum,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      };
    }

    return this.activityService.findAllForProjects(
      authorizedProjectIds,
      userId,
      type,
      pageNum,
      limitNum,
=======
  findAll(
    @Query('projectId') projectId?: string,
    @Query('userId') userId?: string,
    @Query('type') type?: string,
  ) {
    return this.activityService.findAll(
      projectId,
      userId,
      type,
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
    );
  }

  @Get(':id')
<<<<<<< HEAD
  async findById(@Req() req: any, @Param('id') id: string) {
    const actorUserId = req.user?.userId || req.user?.id;
    if (!actorUserId) {
      throw new UnauthorizedException('Authentication required');
    }

    const activity = await this.activityService.findById(id);

    if (activity.projectId) {
      await assertProjectAccess(this.prisma, actorUserId, activity.projectId);
    } else if (
      activity.userId &&
      activity.userId !== actorUserId &&
      req.user?.platformRole !== 'ADMIN'
    ) {
      throw new ForbiddenException('Access denied to activity record');
    }

    return activity;
  }

  @Patch(':id')
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateActivityDto,
  ) {
    const actorUserId = req.user?.userId || req.user?.id;
    if (!actorUserId) {
      throw new UnauthorizedException('Authentication required');
    }

    if (dto.description && dto.description.length > 2000) {
      throw new BadRequestException(
        'Activity description cannot exceed 2000 characters',
      );
    }
    if (dto.metadata !== undefined && dto.metadata !== null) {
      dto.metadata = validateActivityMetadata(dto.metadata);
    }

    const activity = await this.activityService.findById(id);

    // Audit trail protection: only Organization OWNER/ADMIN or Platform ADMIN can modify records
    await this.assertAdminModificationAccess(req.user, actorUserId, activity);

=======
  findById(@Param('id') id: string) {
    return this.activityService.findById(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateActivityDto,
  ) {
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
    return this.activityService.update(id, dto);
  }

  @Delete(':id')
<<<<<<< HEAD
  async remove(@Req() req: any, @Param('id') id: string) {
    const actorUserId = req.user?.userId || req.user?.id;
    if (!actorUserId) {
      throw new UnauthorizedException('Authentication required');
    }

    const activity = await this.activityService.findById(id);

    // Audit trail protection: only Organization OWNER/ADMIN or Platform ADMIN can delete records
    await this.assertAdminModificationAccess(req.user, actorUserId, activity);

    return this.activityService.remove(id);
  }

  private async assertAdminModificationAccess(
    user: any,
    actorUserId: string,
    activity: any,
  ): Promise<void> {
    if (user?.platformRole === 'ADMIN') {
      return;
    }

    if (activity.projectId) {
      const access = await assertProjectAccess(
        this.prisma,
        actorUserId,
        activity.projectId,
      );
      const isOrgAdmin = await this.isOrgAdmin(
        actorUserId,
        access.organizationId,
      );
      if (!isOrgAdmin) {
        throw new ForbiddenException(
          'Only organization administrators can modify activity audit records',
        );
      }
    } else {
      if (activity.userId !== actorUserId) {
        throw new ForbiddenException(
          'Only organization administrators can modify activity audit records',
        );
      }
    }
  }

  private async isOrgAdmin(
    userId: string,
    organizationId: string,
  ): Promise<boolean> {
    const member = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
      select: { role: true },
    });

    if (member && ['OWNER', 'ADMIN'].includes(member.role)) {
      return true;
    }

    return false;
  }
}
=======
  remove(@Param('id') id: string) {
    return this.activityService.remove(id);
  }
}
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
