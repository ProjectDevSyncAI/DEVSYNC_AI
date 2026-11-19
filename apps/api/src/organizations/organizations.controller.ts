import {
  Body,
  Controller,
<<<<<<< HEAD
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
=======
  Get,
  Param,
  Post,
  Req,
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { OrganizationsService } from './organizations.service.js';
import { CreateOrganizationDto } from './dto/create-organization.dto.js';
<<<<<<< HEAD
import { ListMembersQueryDto } from './dto/list-members-query.dto.js';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto.js';
=======
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    username: string;
  };
}

@ApiTags('Organizations')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('organizations')
export class OrganizationsController {
  constructor(
    private readonly organizationsService: OrganizationsService,
  ) {}

  @Post()
  create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateOrganizationDto,
  ) {
<<<<<<< HEAD
    if (!req.user?.userId) {
      throw new UnauthorizedException('User is not authenticated');
    }
=======
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
    return this.organizationsService.create(req.user.userId, dto);
  }

  @Get()
  findMine(@Req() req: AuthenticatedRequest) {
<<<<<<< HEAD
    if (!req.user?.userId) {
      throw new UnauthorizedException('User is not authenticated');
    }
    return this.organizationsService.findMine(req.user.userId);
  }

  @Get(':organizationId/members')
  listMembers(
    @Req() req: AuthenticatedRequest,
    @Param('organizationId') organizationId: string,
    @Query() query: ListMembersQueryDto,
  ) {
    if (!req.user?.userId) {
      throw new UnauthorizedException('User is not authenticated');
    }
    return this.organizationsService.listMembers(
      req.user.userId,
      organizationId,
      query,
    );
  }

  @Patch(':organizationId/members/:userId')
  updateMemberRole(
    @Req() req: AuthenticatedRequest,
    @Param('organizationId') organizationId: string,
    @Param('userId') targetUserId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    if (!req.user?.userId) {
      throw new UnauthorizedException('User is not authenticated');
    }
    return this.organizationsService.updateMemberRole(
      req.user.userId,
      organizationId,
      targetUserId,
      dto,
    );
  }

  @Delete(':organizationId/members/:userId')
  removeMember(
    @Req() req: AuthenticatedRequest,
    @Param('organizationId') organizationId: string,
    @Param('userId') targetUserId: string,
  ) {
    if (!req.user?.userId) {
      throw new UnauthorizedException('User is not authenticated');
    }
    return this.organizationsService.removeMember(
      req.user.userId,
      organizationId,
      targetUserId,
    );
  }

  @Post(':organizationId/leave')
  leave(
    @Req() req: AuthenticatedRequest,
    @Param('organizationId') organizationId: string,
  ) {
    if (!req.user?.userId) {
      throw new UnauthorizedException('User is not authenticated');
    }
    return this.organizationsService.leaveOrganization(
      req.user.userId,
      organizationId,
    );
  }

=======
    return this.organizationsService.findMine(req.user.userId);
  }

>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
  @Get(':id')
  findOne(
    @Req() req: AuthenticatedRequest,
    @Param('id') organizationId: string,
  ) {
<<<<<<< HEAD
    if (!req.user?.userId) {
      throw new UnauthorizedException('User is not authenticated');
    }
=======
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
    return this.organizationsService.findOne(
      req.user.userId,
      organizationId,
    );
  }
<<<<<<< HEAD
}
=======
}
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
