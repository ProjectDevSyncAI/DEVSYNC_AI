import { Module } from '@nestjs/common';

import { BugAnalyzerController } from './bug-analyzer.controller.js';
import { BugAnalyzerService } from './bug-analyzer.service.js';

import { OpenAIService } from '../llm/openai.service.js';
import { PromptService } from '../llm/prompt.service.js';

@Module({
  controllers: [BugAnalyzerController],

  providers: [
    BugAnalyzerService,
    OpenAIService,
    PromptService,
  ],

  exports: [
    BugAnalyzerService,
  ],
})
export class BugAnalyzerModule {}
