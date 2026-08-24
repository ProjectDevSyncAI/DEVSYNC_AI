import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { CommitsService } from './commits.service.js';
import { CreateCommitDto } from './dto/create-commit.dto.js';

@Controller('commits')
export class CommitsController {
  constructor(private readonly commitsService: CommitsService) {}

  @Post()
  create(@Body() dto: CreateCommitDto) {
    return this.commitsService.create(dto);
  }

  @Get()
  findAll(
    @Query('repositoryId') repositoryId?: string,
    @Query('projectId') projectId?: string,
  ) {
    return this.commitsService.findAll(repositoryId, projectId);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.commitsService.findById(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.commitsService.remove(id);
  }
}