import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';

import { AnalyticsService } from './analytics.service.js';
import { CreateAnalyticsDto } from './dto/create-analytics.dto.js';

@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
  ) {}

  @Post()
  create(@Body() dto: CreateAnalyticsDto) {
    return this.analyticsService.create(dto);
  }

  @Get()
  findAll(@Query('projectId') projectId?: string) {
    return this.analyticsService.findAll(projectId);
  }

  @Get('project/:projectId')
  findByProject(@Param('projectId') projectId: string) {
    return this.analyticsService.findByProject(projectId);
  }

  @Get('project/:projectId/latest')
  getLatest(@Param('projectId') projectId: string) {
    return this.analyticsService.getLatest(projectId);
  }

  @Get('project/:projectId/summary')
  getSummary(@Param('projectId') projectId: string) {
    return this.analyticsService.getSummary(projectId);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.analyticsService.findById(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.analyticsService.remove(id);
  }
}