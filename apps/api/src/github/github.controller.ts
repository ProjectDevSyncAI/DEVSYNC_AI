<<<<<<< HEAD

import {
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';

import type { Request } from 'express';
import { Octokit } from '@octokit/rest';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { GithubService } from './github.service.js';
import { GithubSyncService } from './github-sync.service.js';
import { GithubOAuthService } from './github-oauth.service.js';

@Controller('github')
@UseGuards(JwtAuthGuard)
=======
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
} from '@nestjs/common';

import { GithubService } from './github.service.js';
import { GithubSyncService } from './github-sync.service.js';
import { ConnectGithubDto } from './dto/connect-github.dto.js';

@Controller('github')
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
export class GithubController {
  constructor(
    private readonly githubService: GithubService,
    private readonly syncService: GithubSyncService,
<<<<<<< HEAD
    private readonly oauth: GithubOAuthService,
  ) {}

  private userId(
    req: Request & { user?: any },
  ): string {
    const id = req.user?.userId || req.user?.id;

    if (!id) {
      throw new UnauthorizedException(
        'Authentication required',
      );
    }

    return id;
  }

  // Start OAuth using the authenticated DevSync account.
  @Get('authorize')
  authorize(
    @Req() req: Request & { user?: any },
  ) {
    return {
      url: this.oauth.getAuthorizationUrl(
        this.userId(req),
      ),
    };
  }

  // Check GitHub connection status.
  @Get('status')
  async status(
    @Req() req: Request & { user?: any },
  ) {
    const accounts =
      await this.githubService.findAllForUser(
        this.userId(req),
      );

    return {
      connected: accounts.length > 0,
      account: accounts[0] || null,
    };
  }

  // List authenticated user's GitHub accounts.
  @Get()
  async findAll(
    @Req() req: Request & { user?: any },
  ) {
    return this.githubService.findAllForUser(
      this.userId(req),
    );
  }

  // Get repositories directly from GitHub.
  @Get('repositories')
  async repositories(
    @Req() req: Request & { user?: any },
  ) {
    const token =
      await this.githubService.getAccessToken(
        this.userId(req),
      );

    const octokit = new Octokit({ auth: token });

    const { data } =
      await octokit.repos.listForAuthenticatedUser({
        visibility: 'all',
        sort: 'updated',
        per_page: 100,
      });

    return data.map((repo) => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      private: repo.private,
      htmlUrl: repo.html_url,
      defaultBranch: repo.default_branch,
      language: repo.language,
      stars: repo.stargazers_count,
      updatedAt: repo.updated_at,
    }));
  }

  // Sync account - currently delegates to existing sync service.
  @Post('sync/:userId')
  async sync(
    @Req() req: Request & { user?: any },
    @Param('userId') paramUserId: string,
  ) {
    const authUserId = this.userId(req);

    if (paramUserId !== authUserId) {
      throw new ForbiddenException(
        'Cannot synchronize another user GitHub account',
      );
    }

    return this.syncService.syncAccount(authUserId);
  }

  // Get a specific user's GitHub account.
  @Get('user/:userId')
  async findByUserId(
    @Req() req: Request & { user?: any },
    @Param('userId') paramUserId: string,
  ) {
    const authUserId = this.userId(req);

    if (paramUserId !== authUserId) {
      throw new ForbiddenException(
        'Cannot access another user GitHub account',
      );
    }

    return this.githubService.findByUserId(authUserId);
  }

  // Preferred disconnect endpoint for Settings.
  @Delete('disconnect')
  async disconnect(
    @Req() req: Request & { user?: any },
  ) {
    return this.githubService.disconnect(
      this.userId(req),
    );
  }

  // Backward-compatible disconnect endpoint.
  @Delete('disconnect/:userId')
  async disconnectByUserId(
    @Req() req: Request & { user?: any },
    @Param('userId') paramUserId: string,
  ) {
    const authUserId = this.userId(req);

    if (paramUserId !== authUserId) {
      throw new ForbiddenException(
        "Cannot disconnect another user's GitHub account",
      );
    }

    return this.githubService.disconnect(authUserId);
  }
}
=======
  ) {}

  @Post('connect')
  connect(@Body() dto: ConnectGithubDto) {
    return this.githubService.connect(dto);
  }

  @Get()
  findAll() {
    return this.githubService.findAll();
  }

  @Get('user/:userId')
  findByUserId(
    @Param('userId') userId: string,
  ) {
    return this.githubService.findByUserId(userId);
  }

  @Post('sync/:userId')
  sync(@Param('userId') userId: string) {
    return this.syncService.syncAccount(userId);
  }

  @Delete('disconnect/:userId')
  disconnect(
    @Param('userId') userId: string,
  ) {
    return this.githubService.disconnect(userId);
  }
}
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
