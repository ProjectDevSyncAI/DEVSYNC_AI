import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { CreatePullRequestReviewDto } from './dto/create-pull-request-review.dto.js';
import { UpdatePullRequestReviewDto } from './dto/update-pull-request-review.dto.js';

@Injectable()
export class PullRequestReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePullRequestReviewDto) {
    return this.prisma.pullRequestReview.create({
      data: {
        pullRequestId: dto.pullRequestId,
        reviewerId: dto.reviewerId,
        githubId: dto.githubId,
        status: dto.status as any,
        body: dto.body,
        submittedAt: dto.submittedAt
          ? new Date(dto.submittedAt)
          : undefined,
      },
    });
  }

  async findAll() {
    return this.prisma.pullRequestReview.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const review = await this.prisma.pullRequestReview.findUnique({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException('Pull request review not found');
    }

    return review;
  }

  async update(id: string, dto: UpdatePullRequestReviewDto) {
    await this.findOne(id);

    return this.prisma.pullRequestReview.update({
      where: { id },
      data: {
        ...(dto.status !== undefined
          ? { status: dto.status as any }
          : {}),
        body: dto.body,
        submittedAt: dto.submittedAt
          ? new Date(dto.submittedAt)
          : undefined,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.pullRequestReview.delete({
      where: { id },
    });
  }
}