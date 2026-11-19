
import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Octokit } from '@octokit/rest';
import * as crypto from 'node:crypto';
import { GithubService } from './github.service.js';

@Injectable()
export class GithubOAuthService {
  constructor(
    private readonly config: ConfigService,
    private readonly githubService: GithubService,
  ) {}

  private required(key: string): string {
    const value = this.config.get<string>(key);

    if (!value) {
      throw new InternalServerErrorException(
        `Missing environment variable: ${key}`,
      );
    }

    return value;
  }

  private sign(payload: string): string {
    return crypto
      .createHmac(
        'sha256',
        this.required('GITHUB_OAUTH_STATE_SECRET'),
      )
      .update(payload)
      .digest('hex');
  }

  createState(userId: string): string {
    const payload = Buffer.from(
      JSON.stringify({
        userId,
        timestamp: Date.now(),
        nonce: crypto.randomBytes(16).toString('hex'),
      }),
    ).toString('base64url');

    return `${payload}.${this.sign(payload)}`;
  }

  private verifyState(state: string): string {
    const [payload, signature] = state.split('.');

    if (
      !payload ||
      !signature ||
      !/^[a-f0-9]{64}$/i.test(signature)
    ) {
      throw new BadRequestException('Invalid OAuth state');
    }

    const expected = Buffer.from(this.sign(payload), 'hex');
    const received = Buffer.from(signature, 'hex');

    if (
      expected.length !== received.length ||
      !crypto.timingSafeEqual(expected, received)
    ) {
      throw new BadRequestException(
        'OAuth state verification failed',
      );
    }

    let data: {
      userId: string;
      timestamp: number;
      nonce: string;
    };

    try {
      data = JSON.parse(
        Buffer.from(payload, 'base64url').toString('utf8'),
      );
    } catch {
      throw new BadRequestException(
        'Invalid OAuth state payload',
      );
    }

    if (
      !data.userId ||
      !data.timestamp ||
      !data.nonce ||
      Date.now() - data.timestamp > 10 * 60 * 1000 ||
      data.timestamp > Date.now() + 60_000
    ) {
      throw new BadRequestException('OAuth state expired');
    }

    return data.userId;
  }

  getAuthorizationUrl(userId: string): string {
    const url = new URL(
      'https://github.com/login/oauth/authorize',
    );

    url.searchParams.set(
      'client_id',
      this.required('GITHUB_CLIENT_ID'),
    );

    url.searchParams.set(
      'redirect_uri',
      this.required('GITHUB_CALLBACK_URL'),
    );

    url.searchParams.set(
      'scope',
      'read:user user:email repo',
    );

    url.searchParams.set(
      'state',
      this.createState(userId),
    );

    return url.toString();
  }

  async complete(
    code: string,
    state: string,
  ): Promise<string> {
    const userId = this.verifyState(state);

    const response = await fetch(
      'https://github.com/login/oauth/access_token',
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: this.required('GITHUB_CLIENT_ID'),
          client_secret: this.required('GITHUB_CLIENT_SECRET'),
          code,
          redirect_uri: this.required('GITHUB_CALLBACK_URL'),
        }),
      },
    );

    if (!response.ok) {
      throw new BadRequestException(
        'GitHub token exchange failed',
      );
    }

    const tokenData = await response.json() as {
      access_token?: string;
      scope?: string;
      error?: string;
    };

    if (!tokenData.access_token) {
      throw new BadRequestException(
        tokenData.error ||
          'GitHub access token was not returned',
      );
    }

    const octokit = new Octokit({
      auth: tokenData.access_token,
    });

    const { data: profile } =
      await octokit.users.getAuthenticated();

    await this.githubService.connectFromOAuth({
      userId,
      githubUserId: String(profile.id),
      username: profile.login,
      avatarUrl: profile.avatar_url,
      accessToken: tokenData.access_token,
      scopes: (tokenData.scope || '')
        .split(',')
        .filter(Boolean),
    });

    return userId;
  }
}
