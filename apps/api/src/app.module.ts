import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'node:path';

import { DatabaseModule } from './database/database.module.js';
import { HealthModule } from './health/health.module.js';
import { AuthModule } from './auth/auth.module.js';
import authConfig from './config/auth.config.js';
import { OrganizationsModule } from './organizations/organizations.module.js';
import { ProjectsModule } from './projects/projects.module.js';
import { TasksModule } from './tasks/tasks.module.js';
import { IssuesModule } from './issues/issues.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { CommentsModule } from './comments/comments.module.js';
import { ChatModule } from './chat/chat.module.js';
import { RepositoriesModule } from './repositories/repositories.module.js';
import { BranchesModule } from './branches/branches.module.js';
import { PullRequestsModule } from './pull-requests/pull-requests.module.js';
import { ReviewsModule } from './reviews/reviews.module.js';
import { PullRequestReviewsModule } from './pull-request-reviews/pull-request-reviews.module.js';
import { LabelsModule } from './labels/labels.module.js';
import { SprintsModule } from './sprints/sprints.module.js';
import { SprintMembersModule } from './sprint-members/sprint-members.module.js';
import { AIModule } from './ai/ai.module.js';
import { DocumentsModule } from './documents/documents.module.js';
import { UsersModule } from './users/users.module.js';
import { CommitsModule } from './commits/commits.module.js';
import { AnalyticsModule } from './analytics/analytics.module.js';
import { AuditModule } from './audit/audit.module.js';
import { ActivityModule } from './activity/activity.module.js';
import { GithubModule } from './github/github.module.js';






import {
  MiddlewareConsumer,
  NestModule,
} from '@nestjs/common';

import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware.js';







@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: join(process.cwd(), '../../.env'),
      load: [authConfig],
    }),

    DatabaseModule,
    HealthModule,
    AuthModule,
    OrganizationsModule,
    ProjectsModule,
    TasksModule,
    IssuesModule,
    NotificationsModule,
    CommentsModule,
    ChatModule,
    RepositoriesModule,
    BranchesModule,
    PullRequestsModule,
    ReviewsModule,
    PullRequestReviewsModule,
    LabelsModule,
    SprintsModule,
    SprintMembersModule,
    AIModule,
    DocumentsModule,
    UsersModule,
    CommitsModule,
    AnalyticsModule,
    AuditModule,
    ActivityModule,
    GithubModule,

  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestLoggerMiddleware)
      .forRoutes('*');
  }
}


