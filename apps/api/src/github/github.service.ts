<<<<<<< HEAD

import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'node:crypto';

import { PrismaService } from '../database/prisma.service.js';

export const SAFE_GITHUB_ACCOUNT_SELECT = {
  id: true,
  userId: true,
  githubUserId: true,
  username: true,
  avatarUrl: true,
  tokenExpiresAt: true,
  scopes: true,
  createdAt: true,
  updatedAt: true,
} as const;
=======
import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../database/prisma.service.js';
import { ConnectGithubDto } from './dto/connect-github.dto.js';
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c

@Injectable()
export class GithubService {
  constructor(
    private readonly prisma: PrismaService,
<<<<<<< HEAD
    private readonly config: ConfigService,
  ) {}

  private getEncryptionKey(): Buffer {
    const key = this.config.get<string>(
      'GITHUB_TOKEN_ENCRYPTION_KEY',
    );

    if (!key || !/^[a-fA-F0-9]{64}$/.test(key)) {
      throw new InternalServerErrorException(
        'GITHUB_TOKEN_ENCRYPTION_KEY must be 64 hexadecimal characters',
      );
    }

    return Buffer.from(key, 'hex');
  }

  private encryptToken(token: string): string {
    const iv = crypto.randomBytes(12);

    const cipher = crypto.createCipheriv(
      'aes-256-gcm',
      this.getEncryptionKey(),
      iv,
    );

    const encrypted = Buffer.concat([
      cipher.update(token, 'utf8'),
      cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();

    return [
      'enc',
      'v1',
      iv.toString('hex'),
      authTag.toString('hex'),
      encrypted.toString('hex'),
    ].join(':');
  }

  private decryptToken(value: string): string {
    // Existing plaintext values remain readable until reconnected.
    if (!value.startsWith('enc:v1:')) {
      return value;
    }

    const [, , ivHex, tagHex, encryptedHex] =
      value.split(':');

    if (!ivHex || !tagHex || !encryptedHex) {
      throw new InternalServerErrorException(
        'Stored GitHub token has an invalid format',
      );
    }

    try {
      const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        this.getEncryptionKey(),
        Buffer.from(ivHex, 'hex'),
      );

      decipher.setAuthTag(Buffer.from(tagHex, 'hex'));

      return Buffer.concat([
        decipher.update(Buffer.from(encryptedHex, 'hex')),
        decipher.final(),
      ]).toString('utf8');
    } catch {
      throw new InternalServerErrorException(
        'Could not decrypt GitHub access token. Check your encryption key.',
      );
    }
  }

  async connectFromOAuth(data: {
    userId: string;
    githubUserId: string;
    username: string;
    avatarUrl?: string;
    accessToken: string;
    scopes: string[];
  }) {
    const encryptedToken = this.encryptToken(
      data.accessToken,
    );

    return this.prisma.gitHubAccount.upsert({
      where: {
        userId: data.userId,
      },
      update: {
        githubUserId: data.githubUserId,
        username: data.username,
        avatarUrl: data.avatarUrl ?? null,
        accessToken: encryptedToken,
        refreshToken: null,
        tokenExpiresAt: null,
        scopes: data.scopes as any,
      },
      create: {
        userId: data.userId,
        githubUserId: data.githubUserId,
        username: data.username,
        avatarUrl: data.avatarUrl ?? null,
        accessToken: encryptedToken,
        refreshToken: null,
        tokenExpiresAt: null,
        scopes: data.scopes as any,
      },
      select: SAFE_GITHUB_ACCOUNT_SELECT,
    });
  }

  async getAccessToken(userId: string): Promise<string> {
    const account =
      await this.prisma.gitHubAccount.findUnique({
        where: { userId },
        select: { accessToken: true },
      });

    if (!account?.accessToken) {
      throw new NotFoundException(
        'GitHub account is not connected',
      );
    }

    return this.decryptToken(account.accessToken);
  }

  async findByUserId(userId: string) {
    const account =
      await this.prisma.gitHubAccount.findUnique({
        where: { userId },
        select: SAFE_GITHUB_ACCOUNT_SELECT,
=======
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
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
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
<<<<<<< HEAD
      select: SAFE_GITHUB_ACCOUNT_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllForUser(userId: string) {
    return this.prisma.gitHubAccount.findMany({
      where: { userId },
      select: SAFE_GITHUB_ACCOUNT_SELECT,
      orderBy: { createdAt: 'desc' },
=======
      orderBy: {
        createdAt: 'desc',
      },
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
    });
  }

  async disconnect(userId: string) {
<<<<<<< HEAD
    const account =
      await this.prisma.gitHubAccount.findUnique({
        where: { userId },
        select: { id: true },
      });

    if (!account) {
      throw new NotFoundException(
        'GitHub account not connected',
      );
    }

    await this.prisma.gitHubAccount.delete({
      where: { userId },
    });

    return {
      success: true,
      message: 'GitHub account disconnected',
    };
  }
}
=======
    await this.findByUserId(userId);

    return this.prisma.gitHubAccount.delete({
      where: {
        userId,
      },
    });
  }
}
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
