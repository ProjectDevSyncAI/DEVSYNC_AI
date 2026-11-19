import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';
import { TasksService } from './tasks.service.js';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
<<<<<<< HEAD
  private readonly tasksService: TasksService;

  constructor(tasksService: TasksService) {
    this.tasksService = tasksService;
  }

  @Post()
  create(@Req() req: any, @Body() dto: CreateTaskDto) {
    const userId = req.user.userId || req.user.id;
    return this.tasksService.create(userId, dto);
  }

  @Get()
  findAll(@Req() req: any, @Query('projectId') projectId?: string) {
    const userId = req.user.userId || req.user.id;
    return this.tasksService.findAll(userId, projectId);
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.userId || req.user.id;
    return this.tasksService.findOne(userId, id);
=======
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateTaskDto) {
    return this.tasksService.create(req.user.id, dto);
  }

  @Get()
  findAll(@Query('projectId') projectId?: string) {
    return this.tasksService.findAll(projectId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
  }

  @Patch(':id')
  update(
<<<<<<< HEAD
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    const userId = req.user.userId || req.user.id;
    return this.tasksService.update(userId, id, dto);
  }

  @Patch(':id/move')
  move(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { status: any; position?: number },
  ) {
    const userId = req.user.userId || req.user.id;
    return this.tasksService.moveTask(userId, id, body.status, body.position);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.userId || req.user.id;
    return this.tasksService.remove(userId, id);
=======
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasksService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tasksService.remove(id);
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
  }
}