import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { AddProjectMemberDto } from './dto/add-project-member.dto.js';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CreateProjectDto } from './dto/create-project.dto.js';
import { ProjectService } from './project.service.js';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    username: string;
  };
}

@ApiTags('Projects')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  create(
    @Req() req: AuthenticatedRequest,
    @Query('organizationId') organizationId: string,
    @Body() dto: CreateProjectDto,
  ) {
    return this.projectService.create(
      req.user.userId,
      organizationId,
      dto,
    );
  }

  @Get()
  findAll(
    @Req() req: AuthenticatedRequest,
    @Query('organizationId') organizationId: string,
  ) {
    return this.projectService.findAll(
      req.user.userId,
      organizationId,
    );
  }

  @Get(':id')
  findOne(
    @Req() req: AuthenticatedRequest,
    @Param('id') projectId: string,
  ) {
    return this.projectService.findOne(
      req.user.userId,
      projectId,
    );
  }
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  @Get(':id/members')
getMembers(
  @Req() req: AuthenticatedRequest,
  @Param('id') projectId: string,
) {
  return this.projectService.getMembers(
    req.user.userId,
    projectId,
  );
}

@Post(':id/members')
addMember(
  @Req() req: AuthenticatedRequest,
  @Param('id') projectId: string,
  @Body() dto: AddProjectMemberDto,
) {
  return this.projectService.addMember(
    req.user.userId,
    projectId,
    dto.userId,
  );
}

@Delete(':id/members/:userId')
removeMember(
  @Req() req: AuthenticatedRequest,
  @Param('id') projectId: string,
  @Param('userId') targetUserId: string,
) {
  return this.projectService.removeMember(
    req.user.userId,
    projectId,
    targetUserId,
  );
}

}