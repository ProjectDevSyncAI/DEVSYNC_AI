import {
  Body,
  Controller,
  Post,
} from '@nestjs/common';

import { BugAnalyzerService } from './bug-analyzer.service.js';

@Controller('ai/bug-analyzer')
export class BugAnalyzerController {
  constructor(
    private readonly bugAnalyzerService: BugAnalyzerService,
  ) {}

  @Post('analyze')
  analyze(
    @Body()
    body: {
      description: string;
      projectId?: string;
    },
  ) {
    return this.bugAnalyzerService.analyze(
      body.description,
      body.projectId,
    );
  }
}
