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

import { SprintsService } from './sprints.service.js';
import { CreateSprintDto } from './dto/create-sprint.dto.js';
import { UpdateSprintDto } from './dto/update-sprint.dto.js';

@Controller('sprints')
export class SprintsController {
  constructor(private readonly sprintsService: SprintsService) {}

  @Post()
  create(@Body() dto: CreateSprintDto) {
    return this.sprintsService.create(dto);
  }

  @Get()
  findAll(@Query('projectId') projectId?: string) {
    return this.sprintsService.findAll(projectId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sprintsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSprintDto,
  ) {
    return this.sprintsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.sprintsService.remove(id);
  }

  @Post(':id/members/:userId')
  addMember(
    @Param('id') sprintId: string,
    @Param('userId') userId: string,
  ) {
    return this.sprintsService.addMember(sprintId, userId);
  }

  @Delete(':id/members/:userId')
  removeMember(
    @Param('id') sprintId: string,
    @Param('userId') userId: string,
  ) {
    return this.sprintsService.removeMember(sprintId, userId);
  }

  @Get(':id/members')
  getMembers(@Param('id') sprintId: string) {
    return this.sprintsService.getMembers(sprintId);
  }
}