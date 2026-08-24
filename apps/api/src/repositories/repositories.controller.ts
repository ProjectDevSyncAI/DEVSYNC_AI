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

import { RepositoriesService } from './repositories.service.js';
import { CreateRepositoryDto } from './dto/create-repository.dto.js';
import { UpdateRepositoryDto } from './dto/update-repository.dto.js';

@Controller('repositories')
export class RepositoriesController {
  constructor(
    private readonly repositoriesService: RepositoriesService,
  ) {}

  @Post()
  create(@Body() dto: CreateRepositoryDto) {
    return this.repositoriesService.create(dto);
  }

  @Get()
  findAll(@Query('organizationId') organizationId?: string) {
    return this.repositoriesService.findAll(organizationId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.repositoriesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateRepositoryDto,
  ) {
    return this.repositoriesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.repositoriesService.remove(id);
  }
}