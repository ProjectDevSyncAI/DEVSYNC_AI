import {
  Body,
  Controller,
  Post,
<<<<<<< HEAD
  UseGuards,
  BadRequestException,
} from '@nestjs/common';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { BugAnalyzerService } from './bug-analyzer.service.js';

@Controller('ai/bug-analyzer')
@UseGuards(JwtAuthGuard)
=======
} from '@nestjs/common';

import { BugAnalyzerService } from './bug-analyzer.service.js';

@Controller('ai/bug-analyzer')
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
export class BugAnalyzerController {
  constructor(
    private readonly bugAnalyzerService: BugAnalyzerService,
  ) {}

  @Post('analyze')
<<<<<<< HEAD
  async analyze(
    @Body()
    body: {
      description?: string;
      projectId?: string;
    },
  ) {
    if (
      !body.description ||
      typeof body.description !== 'string' ||
      !body.description.trim()
    ) {
      throw new BadRequestException(
        'A code description is required.',
      );
    }

    if (body.description.length > 100000) {
      throw new BadRequestException(
        'The analysis input is too large.',
      );
    }

=======
  analyze(
    @Body()
    body: {
      description: string;
      projectId?: string;
    },
  ) {
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
    return this.bugAnalyzerService.analyze(
      body.description,
      body.projectId,
    );
  }
<<<<<<< HEAD
}
=======
}
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
