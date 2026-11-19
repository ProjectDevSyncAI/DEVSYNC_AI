import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
<<<<<<< HEAD
  Req,
=======
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

import { CreateIssueDto } from './dto/create-issue.dto.js';
import { UpdateIssueDto } from './dto/update-issue.dto.js';
import { IssuesService } from './issues.service.js';

@Controller('issues')
@UseGuards(JwtAuthGuard)
export class IssuesController {
<<<<<<< HEAD
  private readonly issuesService: IssuesService;

  constructor(issuesService: IssuesService) {
    this.issuesService = issuesService;
  }

  @Post()
  create(@Req() req: any, @Body() dto: CreateIssueDto) {
    const userId = req.user.userId || req.user.id;
    return this.issuesService.create(userId, dto);
  }

  @Get('project/:projectId')
  findAllByProject(@Req() req: any, @Param('projectId') projectId: string) {
    const userId = req.user.userId || req.user.id;
    return this.issuesService.findAllByProject(userId, projectId);
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.userId || req.user.id;
    return this.issuesService.findOne(userId, id);
=======
  constructor(private readonly issuesService: IssuesService) {}

  @Post()
  create(@Body() dto: CreateIssueDto) {
    return this.issuesService.create(dto);
  }

  @Get('project/:projectId')
  findAllByProject(@Param('projectId') projectId: string) {
    return this.issuesService.findAllByProject(projectId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.issuesService.findOne(id);
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
  }

  @Patch(':id')
  update(
<<<<<<< HEAD
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateIssueDto,
  ) {
    const userId = req.user.userId || req.user.id;
    return this.issuesService.update(userId, id, dto);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.userId || req.user.id;
    return this.issuesService.remove(userId, id);
=======
    @Param('id') id: string,
    @Body() dto: UpdateIssueDto,
  ) {
    return this.issuesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.issuesService.remove(id);
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
  }
}