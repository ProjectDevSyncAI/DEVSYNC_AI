import {
  Body,
  Controller,
  Post,
} from '@nestjs/common';

import { StandupService } from './standup.service.js';
import { GenerateStandupDto } from './dto/generate-standup.dto.js';

@Controller('ai/standup')
export class StandupController {
  constructor(
    private readonly standupService: StandupService,
  ) {}

  @Post('generate')
  generate(
    @Body() dto: GenerateStandupDto,
  ) {
    return this.standupService.generate(dto);
  }
}