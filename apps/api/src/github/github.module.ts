<<<<<<< HEAD

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ActivityModule } from '../activity/activity.module.js';

import { GithubController } from './github.controller.js';
import { GithubOAuthController } from './github-oauth.controller.js';
import { GithubWebhookController } from './github-webhook.controller.js';

import { GithubService } from './github.service.js';
import { GithubOAuthService } from './github-oauth.service.js';
=======
import { Module } from '@nestjs/common';

import { GithubController } from './github.controller.js';
import { GithubWebhookController } from './github-webhook.controller.js';

import { GithubService } from './github.service.js';
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
import { GithubSyncService } from './github-sync.service.js';
import { GithubAppService } from './github-app.service.js';
import { GithubWebhookService } from './github-webhook.service.js';

<<<<<<< HEAD
import { PlatformAdminGuard } from './guards/platform-admin.guard.js';
import { WebhookAdminOrWorkerGuard } from './guards/webhook-admin-or-worker.guard.js';
import { GithubSignatureGuard } from './guards/github-signature.guard.js';

@Module({
  imports: [
    ConfigModule,
    ActivityModule,
  ],

  controllers: [
    GithubController,
    GithubOAuthController,
=======
@Module({
  controllers: [
    GithubController,
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
    GithubWebhookController,
  ],

  providers: [
    GithubService,
<<<<<<< HEAD
    GithubOAuthService,
    GithubSyncService,
    GithubAppService,
    GithubWebhookService,
    PlatformAdminGuard,
    WebhookAdminOrWorkerGuard,
    GithubSignatureGuard,
=======
    GithubSyncService,
    GithubAppService,
    GithubWebhookService,
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
  ],

  exports: [
    GithubService,
<<<<<<< HEAD
    GithubOAuthService,
    GithubSyncService,
    GithubAppService,
    GithubWebhookService,
    PlatformAdminGuard,
    WebhookAdminOrWorkerGuard,
  ],
})
export class GithubModule {}
=======
    GithubSyncService,
    GithubAppService,
    GithubWebhookService,
  ],
})
export class GithubModule {}
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
