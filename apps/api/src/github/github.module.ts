import { Module } from '@nestjs/common';

import { GithubController } from './github.controller.js';
import { GithubWebhookController } from './github-webhook.controller.js';

import { GithubService } from './github.service.js';
import { GithubSyncService } from './github-sync.service.js';
import { GithubAppService } from './github-app.service.js';
import { GithubWebhookService } from './github-webhook.service.js';

@Module({
  controllers: [
    GithubController,
    GithubWebhookController,
  ],

  providers: [
    GithubService,
    GithubSyncService,
    GithubAppService,
    GithubWebhookService,
  ],

  exports: [
    GithubService,
    GithubSyncService,
    GithubAppService,
    GithubWebhookService,
  ],
})
export class GithubModule {}