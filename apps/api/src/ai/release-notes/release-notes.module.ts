import { Module } from '@nestjs/common';

import { ReleaseNotesController } from './release-notes.controller.js';
import { ReleaseNotesService } from './release-notes.service.js';

import { OpenAIService } from '../llm/openai.service.js';
import { PromptService } from '../llm/prompt.service.js';

@Module({
  controllers: [
    ReleaseNotesController,
  ],

  providers: [
    ReleaseNotesService,
    OpenAIService,
    PromptService,
  ],

  exports: [
    ReleaseNotesService,
  ],
})
export class ReleaseNotesModule {}