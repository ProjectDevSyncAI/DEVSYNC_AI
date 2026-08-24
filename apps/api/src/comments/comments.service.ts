
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { CreateCommentDto } from './dto/create-comment.dto.js';
import { UpdateCommentDto } from './dto/update-comment.dto.js';

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
  }

  async findAll(projectId: string) {
    return this.prisma.comment.findMany({
      where: { projectId },
      include: {
        author: true,
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
        author: true,
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    return comment;
  }

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
  }
}
