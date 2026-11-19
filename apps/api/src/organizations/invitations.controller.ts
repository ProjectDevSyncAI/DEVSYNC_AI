import {
  Body,
  Controller,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard, Public } from '../auth/guards/jwt-auth.guard.js';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface.js';
import { AcceptInvitationDto } from './dto/accept-invitation.dto.js';
import { PreviewInvitationDto } from './dto/preview-invitation.dto.js';
import { OrganizationInvitationsService } from './organization-invitations.service.js';
import { extractClientIp } from './invitation-preview-rate-limiter.service.js';

interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

@ApiTags('Invitations')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('invitations')
export class InvitationsController {
  constructor(
    private readonly invitationsService: OrganizationInvitationsService,
  ) {}

  @Post('accept')
  @ApiOperation({ summary: 'Accept an organization invitation' })
  @ApiResponse({ status: 200, description: 'Invitation accepted successfully' })
  @ApiResponse({ status: 400, description: 'Invitation expired or invalid' })
  @ApiResponse({ status: 403, description: 'Email not verified or unverified recipient mismatch' })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  @ApiResponse({ status: 409, description: 'Invitation already accepted or member already exists' })
  accept(
    @Req() req: AuthenticatedRequest,
    @Body() dto: AcceptInvitationDto,
  ) {
    if (!req.user?.userId) {
      throw new UnauthorizedException('User is not authenticated');
    }
    return this.invitationsService.acceptInvitation(req.user.userId, dto);
  }

  @Public()
  @Post('preview')
  @ApiOperation({ summary: 'Public preview of invitation metadata' })
  @ApiResponse({ status: 200, description: 'Invitation metadata returned' })
  @ApiResponse({ status: 400, description: 'Token expired or invalid format' })
  @ApiResponse({ status: 404, description: 'Invalid invitation token' })
  @ApiResponse({ status: 409, description: 'Invitation already accepted' })
  @ApiResponse({ status: 429, description: 'Too many preview requests from this IP' })
  preview(
    @Req() req: Request,
    @Body() dto: PreviewInvitationDto,
  ) {
    const clientIp = extractClientIp(req);
    return this.invitationsService.previewInvitation(dto, clientIp);
  }
}
