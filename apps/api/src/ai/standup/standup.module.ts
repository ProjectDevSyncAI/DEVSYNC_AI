import { Module } from '@nestjs/common';

import { StandupController } from './standup.controller.js';
import { StandupService } from './standup.service.js';

import { OpenAIService } from '../llm/openai.service.js';
import { PromptService } from '../llm/prompt.service.js';

@Module({
  controllers: [
    StandupController,
  ],

  providers: [
    StandupService,
    OpenAIService,
    PromptService,
  ],

  exports: [
    StandupService,
  ],
})
export class StandupModule {}