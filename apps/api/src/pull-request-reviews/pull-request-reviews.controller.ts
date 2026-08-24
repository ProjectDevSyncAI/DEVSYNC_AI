import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { PullRequestReviewsService } from './pull-request-reviews.service.js';
import { CreatePullRequestReviewDto } from './dto/create-pull-request-review.dto.js';
import { UpdatePullRequestReviewDto } from './dto/update-pull-request-review.dto.js';

@Controller('pull-request-reviews')
export class PullRequestReviewsController {
  constructor(
    private readonly reviewsService: PullRequestReviewsService,
  ) {}

  @Post()
  create(@Body() dto: CreatePullRequestReviewDto) {
    return this.reviewsService.create(dto);
  }

  @Get()
  findAll() {
    return this.reviewsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reviewsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePullRequestReviewDto,
  ) {
    return this.reviewsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.reviewsService.remove(id);
  }
}