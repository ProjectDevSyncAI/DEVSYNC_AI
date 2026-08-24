import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { PullRequestsService } from './pull-requests.service.js';
import { CreatePullRequestDto } from './dto/create-pull-request.dto.js';
import { UpdatePullRequestDto } from './dto/update-pull-request.dto.js';

@Controller('pull-requests')
export class PullRequestsController {
  constructor(
    private readonly pullRequestsService: PullRequestsService,
  ) {}

  @Post()
  create(@Body() dto: CreatePullRequestDto) {
    return this.pullRequestsService.create(dto);
  }

  @Get()
  findAll(@Query('repositoryId') repositoryId?: string) {
    return this.pullRequestsService.findAll(repositoryId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pullRequestsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePullRequestDto,
  ) {
    return this.pullRequestsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.pullRequestsService.remove(id);
  }
}
