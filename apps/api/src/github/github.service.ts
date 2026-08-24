import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../database/prisma.service.js';
import { ConnectGithubDto } from './dto/connect-github.dto.js';

@Injectable()
export class GithubService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async connect(dto: ConnectGithubDto) {
    return this.prisma.gitHubAccount.upsert({
      where: {
        userId: dto.userId,
      },
      update: {
        githubUserId: dto.githubUserId,
        username: dto.username,
        avatarUrl: dto.avatarUrl,
        accessToken: dto.accessToken,
        refreshToken: dto.refreshToken,
        tokenExpiresAt: dto.tokenExpiresAt
          ? new Date(dto.tokenExpiresAt)
          : undefined,
        scopes: dto.scopes as any,
      },
      create: {
        userId: dto.userId,
        githubUserId: dto.githubUserId,
        username: dto.username,
        avatarUrl: dto.avatarUrl,
        accessToken: dto.accessToken,
        refreshToken: dto.refreshToken,
        tokenExpiresAt: dto.tokenExpiresAt
          ? new Date(dto.tokenExpiresAt)
          : undefined,
        scopes: dto.scopes as any,
      },
    });
  }

  async findByUserId(userId: string) {
    const account =
      await this.prisma.gitHubAccount.findUnique({
        where: {
          userId,
        },
      });

    if (!account) {
      throw new NotFoundException(
        'GitHub account not connected',
      );
    }

    return account;
  }

  async findAll() {
    return this.prisma.gitHubAccount.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async disconnect(userId: string) {
    await this.findByUserId(userId);

    return this.prisma.gitHubAccount.delete({
      where: {
        userId,
      },
    });
  }
}