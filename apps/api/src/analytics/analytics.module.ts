import { Module } from '@nestjs/common';

import { AnalyticsController } from './analytics.controller.js';
import { AnalyticsService } from './analytics.service.js';
import { HealthScoreService } from './health-score.service.js';
import { VelocityService } from './velocity.service.js';

import { MetricsController } from './metrics/metrics.controller.js';
import { MetricsService } from './metrics/metrics.service.js';

@Module({
  controllers: [
    AnalyticsController,
    MetricsController,
  ],

  providers: [
    AnalyticsService,
    HealthScoreService,
    VelocityService,
    MetricsService,
  ],

  exports: [
    AnalyticsService,
    HealthScoreService,
    VelocityService,
    MetricsService,
  ],
})
export class AnalyticsModule {}