import {
<<<<<<< HEAD
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
=======
  Body,
  Controller,
  Delete,
  Get,
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
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
import { assertProjectAccess } from '../common/helpers/project-access.helper.js';
import { PrismaService } from '../database/prisma.service.js';
=======
} from '@nestjs/common';
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
import { CommentsService } from './comments.service.js';
import { CreateCommentDto } from './dto/create-comment.dto.js';
import { UpdateCommentDto } from './dto/update-comment.dto.js';

@Controller('comments')
<<<<<<< HEAD
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(
    private readonly commentsService: CommentsService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  async create(@Req() req: any, @Body() dto: CreateCommentDto) {
    const actorUserId = req.user?.userId || req.user?.id;
    if (!actorUserId) {
      throw new UnauthorizedException('Authentication required');
    }

    let effectiveProjectId = dto.projectId;

    if (dto.taskId) {
      const task = await this.prisma.task.findUnique({
        where: { id: dto.taskId },
        select: { projectId: true },
      });
      if (!task) {
        throw new NotFoundException('Task not found');
      }
      if (effectiveProjectId && effectiveProjectId !== task.projectId) {
        throw new BadRequestException('Specified projectId does not match task project');
      }
      effectiveProjectId = task.projectId;
    } else if (dto.issueId) {
      const issue = await this.prisma.issue.findUnique({
        where: { id: dto.issueId },
        select: { projectId: true },
      });
      if (!issue) {
        throw new NotFoundException('Issue not found');
      }
      if (effectiveProjectId && effectiveProjectId !== issue.projectId) {
        throw new BadRequestException('Specified projectId does not match issue project');
      }
      effectiveProjectId = issue.projectId;
    } else if (dto.pullRequestId) {
      const pr = await this.prisma.pullRequest.findUnique({
        where: { id: dto.pullRequestId },
        select: {
          projectId: true,
          repository: { select: { projectId: true } },
        },
      });
      if (!pr) {
        throw new NotFoundException('Pull request not found');
      }
      const prProjectId = pr.projectId || pr.repository?.projectId;
      if (!prProjectId) {
        throw new NotFoundException('Project associated with pull request not found');
      }
      if (effectiveProjectId && effectiveProjectId !== prProjectId) {
        throw new BadRequestException('Specified projectId does not match pull request project');
      }
      effectiveProjectId = prProjectId;
    }

    if (!effectiveProjectId) {
      throw new BadRequestException('A valid projectId, taskId, issueId, or pullRequestId is required');
    }

    await assertProjectAccess(this.prisma, actorUserId, effectiveProjectId);

    return this.commentsService.create({
      ...dto,
      projectId: effectiveProjectId,
      authorId: actorUserId,
    });
  }

  @Get()
  async findAll(@Req() req: any, @Query('projectId') projectId: string) {
    const actorUserId = req.user?.userId || req.user?.id;
    if (!actorUserId) {
      throw new UnauthorizedException('Authentication required');
    }
    if (!projectId) {
      throw new BadRequestException('projectId query parameter is required');
    }
    await assertProjectAccess(this.prisma, actorUserId, projectId);
=======
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  create(@Body() dto: CreateCommentDto) {
    return this.commentsService.create(dto);
  }

  @Get()
  findAll(@Query('projectId') projectId: string) {
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
    return this.commentsService.findAll(projectId);
  }

  @Get(':id')
<<<<<<< HEAD
  async findOne(@Req() req: any, @Param('id') id: string) {
    const actorUserId = req.user?.userId || req.user?.id;
    if (!actorUserId) {
      throw new UnauthorizedException('Authentication required');
    }
    const comment = await this.commentsService.findOne(id);
    await assertProjectAccess(this.prisma, actorUserId, comment.projectId);
    return comment;
  }

  @Patch(':id')
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateCommentDto,
  ) {
    const actorUserId = req.user?.userId || req.user?.id;
    if (!actorUserId) {
      throw new UnauthorizedException('Authentication required');
    }
    const comment = await this.commentsService.findOne(id);
    await assertProjectAccess(this.prisma, actorUserId, comment.projectId);
    if (comment.authorId !== actorUserId) {
      throw new ForbiddenException('You can only edit your own comments');
    }
    return this.commentsService.update(id, dto, actorUserId);
  }

  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    const actorUserId = req.user?.userId || req.user?.id;
    if (!actorUserId) {
      throw new UnauthorizedException('Authentication required');
    }
    const comment = await this.commentsService.findOne(id);
    await assertProjectAccess(this.prisma, actorUserId, comment.projectId);
    if (comment.authorId !== actorUserId) {
      throw new ForbiddenException('You can only delete your own comments');
    }
    return this.commentsService.remove(id, actorUserId);
  }
}

=======
  findOne(@Param('id') id: string) {
    return this.commentsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCommentDto,
  ) {
    return this.commentsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.commentsService.remove(id);
  }
}
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
