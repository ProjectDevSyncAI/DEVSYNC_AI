import { Module } from '@nestjs/common';

import { InsightsController } from './insights.controller.js';
import { InsightsService } from './insights.service.js';

import { OpenAIService } from '../llm/openai.service.js';
import { PromptService } from '../llm/prompt.service.js';

@Module({
  controllers: [
    InsightsController,
  ],

  providers: [
    InsightsService,
    OpenAIService,
    PromptService,
  ],

  exports: [
    InsightsService,
  ],
})
export class InsightsModule {}