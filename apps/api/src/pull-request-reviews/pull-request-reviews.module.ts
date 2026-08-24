import { Module } from '@nestjs/common';

import { PullRequestReviewsController } from './pull-request-reviews.controller.js';
import { PullRequestReviewsService } from './pull-request-reviews.service.js';

@Module({
  controllers: [PullRequestReviewsController],
  providers: [PullRequestReviewsService],
  exports: [PullRequestReviewsService],
})
export class PullRequestReviewsModule {}