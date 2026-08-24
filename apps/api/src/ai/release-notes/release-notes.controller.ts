import {
  Body,
  Controller,
  Post,
} from '@nestjs/common';

import { ReleaseNotesService } from './release-notes.service.js';
import { GenerateReleaseNotesDto } from './dto/generate-release-notes.dto.js';

@Controller('ai/release-notes')
export class ReleaseNotesController {
  constructor(
    private readonly releaseNotesService: ReleaseNotesService,
  ) {}

  @Post('generate')
  generate(
    @Body() dto: GenerateReleaseNotesDto,
  ) {
    return this.releaseNotesService.generate(dto);
  }
}