import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { CreateReviewDto } from './dto/create-review.dto.js';
import { UpdateReviewDto } from './dto/update-review.dto.js';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateReviewDto) {
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

  async findAll(pullRequestId?: string) {
    return this.prisma.pullRequestReview.findMany({
      where: pullRequestId ? { pullRequestId } : undefined,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const review = await this.prisma.pullRequestReview.findUnique({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return review;
  }

  async update(id: string, dto: UpdateReviewDto) {
    await this.findOne(id);

    return this.prisma.pullRequestReview.update({
      where: { id },
      data: {
        status: dto.status as any,
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