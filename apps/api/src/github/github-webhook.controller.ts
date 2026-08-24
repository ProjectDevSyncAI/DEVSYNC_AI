import {
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';

import { GithubWebhookService } from './github-webhook.service.js';
import { CreateWebhookEventDto } from './dto/create-webhook-event.dto.js';

@Controller('github/webhooks')
export class GithubWebhookController {
  constructor(
    private readonly webhookService: GithubWebhookService,
  ) {}

  @Post()
  create(@Body() dto: CreateWebhookEventDto) {
    return this.webhookService.create(dto);
  }

  @Get()
  findAll() {
    return this.webhookService.findAll();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.webhookService.findById(id);
  }

  @Post(':id/process')
  markProcessed(@Param('id') id: string) {
    return this.webhookService.markProcessed(id);
  }

  @Post(':id/fail')
  markFailed(
    @Param('id') id: string,
    @Body('errorMessage') errorMessage: string,
  ) {
    return this.webhookService.markFailed(
      id,
      errorMessage,
    );
  }
}