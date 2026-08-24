import {
  Controller,
  Get,
  Param,
} from '@nestjs/common';

import { MetricsService } from './metrics.service.js';

@Controller('analytics/metrics')
export class MetricsController {
  constructor(
    private readonly metricsService: MetricsService,
  ) {}

  @Get(':projectId')
  getProjectMetrics(
    @Param('projectId') projectId: string,
  ) {
    return this.metricsService.getProjectMetrics(projectId);
  }
}