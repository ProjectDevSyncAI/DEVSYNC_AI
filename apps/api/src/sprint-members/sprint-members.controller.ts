import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
} from '@nestjs/common';

import { SprintMembersService } from './sprint-members.service.js';
import { CreateSprintMemberDto } from './dto/create-sprint-member.dto.js';

@Controller('sprint-members')
export class SprintMembersController {
  constructor(
    private readonly sprintMembersService: SprintMembersService,
  ) {}

  @Post()
  create(@Body() dto: CreateSprintMemberDto) {
    return this.sprintMembersService.create(dto);
  }

  @Get()
  findAll() {
    return this.sprintMembersService.findAll();
  }

  @Get('sprint/:sprintId')
  findBySprint(@Param('sprintId') sprintId: string) {
    return this.sprintMembersService.findBySprint(sprintId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.sprintMembersService.remove(id);
  }
}