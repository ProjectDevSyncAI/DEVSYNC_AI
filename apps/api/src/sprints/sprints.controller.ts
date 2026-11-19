import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
<<<<<<< HEAD
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
=======
} from '@nestjs/common';

>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
import { SprintsService } from './sprints.service.js';
import { CreateSprintDto } from './dto/create-sprint.dto.js';
import { UpdateSprintDto } from './dto/update-sprint.dto.js';

@Controller('sprints')
<<<<<<< HEAD
@UseGuards(JwtAuthGuard)
=======
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
export class SprintsController {
  constructor(private readonly sprintsService: SprintsService) {}

  @Post()
<<<<<<< HEAD
  create(@Req() req: any, @Body() dto: CreateSprintDto) {
    const userId = req.user.userId || req.user.id;
    return this.sprintsService.create(userId, dto);
  }

  @Get()
  findAll(@Req() req: any, @Query('projectId') projectId?: string) {
    const userId = req.user.userId || req.user.id;
    return this.sprintsService.findAll(userId, projectId);
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.userId || req.user.id;
    return this.sprintsService.findOne(userId, id);
=======
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
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
  }

  @Patch(':id')
  update(
<<<<<<< HEAD
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateSprintDto,
  ) {
    const userId = req.user.userId || req.user.id;
    return this.sprintsService.update(userId, id, dto);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.userId || req.user.id;
    return this.sprintsService.remove(userId, id);
=======
    @Param('id') id: string,
    @Body() dto: UpdateSprintDto,
  ) {
    return this.sprintsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.sprintsService.remove(id);
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
  }

  @Post(':id/members/:userId')
  addMember(
<<<<<<< HEAD
    @Req() req: any,
    @Param('id') sprintId: string,
    @Param('userId') targetUserId: string,
  ) {
    const userId = req.user.userId || req.user.id;
    return this.sprintsService.addMember(userId, sprintId, targetUserId);
=======
    @Param('id') sprintId: string,
    @Param('userId') userId: string,
  ) {
    return this.sprintsService.addMember(sprintId, userId);
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
  }

  @Delete(':id/members/:userId')
  removeMember(
<<<<<<< HEAD
    @Req() req: any,
    @Param('id') sprintId: string,
    @Param('userId') targetUserId: string,
  ) {
    const userId = req.user.userId || req.user.id;
    return this.sprintsService.removeMember(userId, sprintId, targetUserId);
  }

  @Get(':id/members')
  getMembers(@Req() req: any, @Param('id') sprintId: string) {
    const userId = req.user.userId || req.user.id;
    return this.sprintsService.getMembers(userId, sprintId);
=======
    @Param('id') sprintId: string,
    @Param('userId') userId: string,
  ) {
    return this.sprintsService.removeMember(sprintId, userId);
  }

  @Get(':id/members')
  getMembers(@Param('id') sprintId: string) {
    return this.sprintsService.getMembers(sprintId);
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
  }
}