import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
<<<<<<< HEAD
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
=======
  Post,
  Query,
  Req,
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { AddProjectMemberDto } from './dto/add-project-member.dto.js';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
<<<<<<< HEAD
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface.js';
import { CreateProjectDto } from './dto/create-project.dto.js';
import { UpdateProjectDto } from './dto/update-project.dto.js';
import { ProjectService } from './project.service.js';

interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
=======
import { CreateProjectDto } from './dto/create-project.dto.js';
import { ProjectService } from './project.service.js';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    username: string;
  };
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
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

<<<<<<< HEAD

  @Patch(':id')
  update(
    @Req() req: AuthenticatedRequest,
    @Param('id') projectId: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectService.update(
      req.user.userId,
      projectId,
      dto,
    );
  }

=======
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
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
<<<<<<< HEAD
  if (!req.user?.userId) {
    throw new UnauthorizedException('User is not authenticated');
  }
=======
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
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
<<<<<<< HEAD
  if (!req.user?.userId) {
    throw new UnauthorizedException('User is not authenticated');
  }
=======
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
  return this.projectService.removeMember(
    req.user.userId,
    projectId,
    targetUserId,
  );
}

<<<<<<< HEAD
}
=======
}
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
