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
export class GithubController {
  constructor(
    private readonly githubService: GithubService,
    private readonly syncService: GithubSyncService,
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