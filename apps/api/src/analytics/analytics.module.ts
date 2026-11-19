import { Module } from '@nestjs/common';

import { AnalyticsController } from './analytics.controller.js';
import { AnalyticsService } from './analytics.service.js';
import { HealthScoreService } from './health-score.service.js';
import { VelocityService } from './velocity.service.js';
<<<<<<< HEAD
import { DashboardOverviewService } from './dashboard-overview.service.js';
=======
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c

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
<<<<<<< HEAD
    DashboardOverviewService,
=======
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
  ],

  exports: [
    AnalyticsService,
    HealthScoreService,
    VelocityService,
    MetricsService,
<<<<<<< HEAD
    DashboardOverviewService,
=======
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
  ],
})
export class AnalyticsModule {}