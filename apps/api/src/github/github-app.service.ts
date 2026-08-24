import { Injectable } from '@nestjs/common';

@Injectable()
export class GithubAppService {
  getStatus() {
    return {
      configured: Boolean(
        process.env.GITHUB_CLIENT_ID &&
        process.env.GITHUB_CLIENT_SECRET,
      ),
      message:
        'GitHub App configuration status',
    };
  }
}