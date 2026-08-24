import { Injectable } from '@nestjs/common';

@Injectable()
export class GithubSyncService {
  async syncAccount(userId: string) {
    return {
      success: true,
      message: 'GitHub synchronization started',
      userId,
    };
  }

  async syncRepository(
    repositoryId: string,
  ) {
    return {
      success: true,
      message: 'Repository synchronization started',
      repositoryId,
    };
  }
}