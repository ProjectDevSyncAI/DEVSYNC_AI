
<<<<<<< HEAD
import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { ActivityService } from '../activity/activity.service.js';
=======
import { Injectable, NotFoundException } from '@nestjs/common';
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
import { PrismaService } from '../database/prisma.service.js';
import { CreateCommentDto } from './dto/create-comment.dto.js';
import { UpdateCommentDto } from './dto/update-comment.dto.js';

<<<<<<< HEAD
const SAFE_AUTHOR_SELECT = {
  id: true,
  email: true,
  name: true,
  avatarUrl: true,
  createdAt: true,
  updatedAt: true,
};

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly activityService?: ActivityService,
  ) {}

  async create(dto: CreateCommentDto & { projectId: string; authorId: string }) {
    const execute = async (tx: any) => {
      const comment = await tx.comment.create({
        data: {
          projectId: dto.projectId,
          taskId: dto.taskId,
          issueId: dto.issueId,
          pullRequestId: dto.pullRequestId,
          authorId: dto.authorId,
          content: dto.content,
        },
        include: {
          author: {
            select: SAFE_AUTHOR_SELECT,
          },
        },
      });

      if (this.activityService) {
        await this.activityService.createEvent(
          {
            projectId: dto.projectId,
            userId: dto.authorId,
            type: 'COMMENT_CREATED',
            title: 'Added a comment',
            description: dto.content ? dto.content.slice(0, 200) : undefined,
            entityType: 'COMMENT',
            entityId: comment.id,
            metadata: {
              commentId: comment.id,
              taskId: dto.taskId ?? null,
              issueId: dto.issueId ?? null,
              pullRequestId: dto.pullRequestId ?? null,
            },
          },
          tx,
        );
      }

      return comment;
    };

    if (typeof this.prisma?.$transaction === 'function') {
      return this.prisma.$transaction(execute);
    }
    return execute(this.prisma);
=======
@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCommentDto) {
    return this.prisma.comment.create({
      data: {
        projectId: dto.projectId,
        taskId: dto.taskId,
        issueId: dto.issueId,
        pullRequestId: dto.pullRequestId,
        authorId: dto.authorId,
        content: dto.content,
      },
      include: {
        author: true,
      },
    });
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
  }

  async findAll(projectId: string) {
    return this.prisma.comment.findMany({
      where: { projectId },
      include: {
<<<<<<< HEAD
        author: {
          select: SAFE_AUTHOR_SELECT,
        },
=======
        author: true,
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async findOne(id: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      include: {
<<<<<<< HEAD
        author: {
          select: SAFE_AUTHOR_SELECT,
        },
=======
        author: true,
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    return comment;
  }

<<<<<<< HEAD
  async update(id: string, dto: UpdateCommentDto, actorUserId?: string) {
    const existing = await this.findOne(id);

    const execute = async (tx: any) => {
      const comment = await tx.comment.update({
        where: { id },
        data: {
          content: dto.content,
        },
        include: {
          author: {
            select: SAFE_AUTHOR_SELECT,
          },
        },
      });

      if (this.activityService) {
        await this.activityService.createEvent(
          {
            projectId: existing.projectId,
            userId: actorUserId || existing.authorId,
            type: 'COMMENT_UPDATED',
            title: 'Updated a comment',
            description: dto.content ? dto.content.slice(0, 200) : undefined,
            entityType: 'COMMENT',
            entityId: comment.id,
            metadata: {
              commentId: comment.id,
              taskId: existing.taskId ?? null,
              issueId: existing.issueId ?? null,
              pullRequestId: existing.pullRequestId ?? null,
            },
          },
          tx,
        );
      }

      return comment;
    };

    if (typeof this.prisma?.$transaction === 'function') {
      return this.prisma.$transaction(execute);
    }
    return execute(this.prisma);
  }

  async remove(id: string, actorUserId?: string) {
    const existing = await this.findOne(id);

    const execute = async (tx: any) => {
      const deleted = await tx.comment.delete({
        where: { id },
      });

      if (this.activityService) {
        await this.activityService.createEvent(
          {
            projectId: existing.projectId,
            userId: actorUserId || existing.authorId,
            type: 'COMMENT_DELETED',
            title: 'Deleted a comment',
            entityType: 'COMMENT',
            entityId: id,
            metadata: {
              commentId: id,
              taskId: existing.taskId ?? null,
              issueId: existing.issueId ?? null,
              pullRequestId: existing.pullRequestId ?? null,
            },
          },
          tx,
        );
      }

      return deleted;
    };

    if (typeof this.prisma?.$transaction === 'function') {
      return this.prisma.$transaction(execute);
    }
    return execute(this.prisma);
=======
  async update(id: string, dto: UpdateCommentDto) {
    await this.findOne(id);

    return this.prisma.comment.update({
      where: { id },
      data: {
        content: dto.content,
      },
      include: {
        author: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.comment.delete({
      where: { id },
    });
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
  }
}
