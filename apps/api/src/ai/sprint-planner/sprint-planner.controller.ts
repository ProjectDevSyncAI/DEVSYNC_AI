import {
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';

import { SprintPlannerService } from './sprint-planner.service.js';
import { CreateSprintPlanDto } from './dto/create-sprint-plan.dto.js';

@Controller('ai/sprint-planner')
export class SprintPlannerController {
  constructor(
    private readonly sprintPlannerService: SprintPlannerService,
  ) {}

  @Post()
  createPlan(
    @Body() dto: CreateSprintPlanDto,
  ) {
    return this.sprintPlannerService.createPlan(dto);
  }

  @Get('project/:projectId/issues')
  getProjectIssues(
    @Param('projectId') projectId: string,
  ) {
    return this.sprintPlannerService.getProjectIssues(
      projectId,
    );
  }
}