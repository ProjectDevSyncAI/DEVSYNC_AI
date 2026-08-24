import { Module } from '@nestjs/common';

import { SprintPlannerController } from './sprint-planner.controller.js';
import { SprintPlannerService } from './sprint-planner.service.js';

import { OpenAIService } from '../llm/openai.service.js';
import { PromptService } from '../llm/prompt.service.js';

@Module({
  controllers: [
    SprintPlannerController,
  ],

  providers: [
    SprintPlannerService,
    OpenAIService,
    PromptService,
  ],

  exports: [
    SprintPlannerService,
  ],
})
export class SprintPlannerModule {}