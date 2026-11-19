import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface.js';
import { CreateInvitationDto } from './dto/create-invitation.dto.js';
import { ListInvitationsQueryDto } from './dto/list-invitations-query.dto.js';
import { OrganizationInvitationsService } from './organization-invitations.service.js';

interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

@ApiTags('Organization Invitations')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('organizations/:organizationId/invitations')
export class OrganizationInvitationsController {
  constructor(
    private readonly invitationsService: OrganizationInvitationsService,
  ) {}

  @Post()
  create(
    @Req() req: AuthenticatedRequest,
    @Param('organizationId') organizationId: string,
    @Body() dto: CreateInvitationDto,
  ) {
    if (!req.user?.userId) {
      throw new UnauthorizedException('User is not authenticated');
    }
    return this.invitationsService.createInvitation(
      req.user.userId,
      organizationId,
      dto,
    );
  }

  @Get()
  findAll(
    @Req() req: AuthenticatedRequest,
    @Param('organizationId') organizationId: string,
    @Query() query: ListInvitationsQueryDto,
  ) {
    if (!req.user?.userId) {
      throw new UnauthorizedException('User is not authenticated');
    }
    return this.invitationsService.listInvitations(
      req.user.userId,
      organizationId,
      query,
    );
  }

  @Delete(':invitationId')
  revoke(
    @Req() req: AuthenticatedRequest,
    @Param('organizationId') organizationId: string,
    @Param('invitationId') invitationId: string,
  ) {
    if (!req.user?.userId) {
      throw new UnauthorizedException('User is not authenticated');
    }
    return this.invitationsService.revokeInvitation(
      req.user.userId,
      organizationId,
      invitationId,
    );
  }

  @Post(':invitationId/resend')
  resend(
    @Req() req: AuthenticatedRequest,
    @Param('organizationId') organizationId: string,
    @Param('invitationId') invitationId: string,
  ) {
    if (!req.user?.userId) {
      throw new UnauthorizedException('User is not authenticated');
    }
    return this.invitationsService.resendInvitation(
      req.user.userId,
      organizationId,
      invitationId,
    );
  }
}
