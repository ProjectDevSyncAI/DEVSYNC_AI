
import {
  Controller,
  Get,
  Query,
  Res,
  BadRequestException,
} from '@nestjs/common';

import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { GithubOAuthService } from './github-oauth.service.js';

@Controller('github')
export class GithubOAuthController {
  constructor(
    private readonly oauth: GithubOAuthService,
    private readonly config: ConfigService,
  ) {}

  @Get('callback')
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Res() res: Response,
  ) {
    const frontend =
      this.config.get<string>('GITHUB_FRONTEND_URL') ||
      'http://localhost:5173';

    if (error) {
      return res.redirect(`${frontend}/?github=error`);
    }

    if (!code || !state) {
      throw new BadRequestException(
        'Missing GitHub OAuth code or state',
      );
    }

    try {
      await this.oauth.complete(code, state);

      return res.redirect(
        `${frontend}/?github=connected`,
      );
    } catch (err) {
      console.error('GitHub OAuth callback failed:', err);

      return res.redirect(
        `${frontend}/?github=error`,
      );
    }
  }
}
