import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
} from '@nestjs/common';

import { InsightsService } from './insights.service.js';
import { CreateInsightDto } from './dto/create-insight.dto.js';

@Controller('ai/insights')
export class InsightsController {
  constructor(
    private readonly insightsService: InsightsService,
  ) {}

  @Get('project/:projectId')
  getProjectInsights(
    @Param('projectId') projectId: string,
  ) {
    return this.insightsService.getProjectInsights(
      projectId,
    );
  }

  @Get(':id')
  getInsight(@Param('id') id: string) {
    return this.insightsService.getInsight(id);
  }

  @Post()
  createInsight(
    @Body() dto: CreateInsightDto,
  ) {
    return this.insightsService.createInsight(dto);
  }

  @Post('generate/:projectId')
  generateInsight(
    @Param('projectId') projectId: string,
  ) {
    return this.insightsService.generateInsight(
      projectId,
    );
  }

  @Delete(':id')
  deleteInsight(@Param('id') id: string) {
    return this.insightsService.deleteInsight(id);
  }
}