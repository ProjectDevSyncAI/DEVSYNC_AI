import { Module } from '@nestjs/common';
<<<<<<< HEAD
import { ConfigModule } from '@nestjs/config';

import { OrganizationsController } from './organizations.controller.js';
import { OrganizationsService } from './organizations.service.js';
import { OrganizationInvitationsController } from './organization-invitations.controller.js';
import { InvitationsController } from './invitations.controller.js';
import { OrganizationInvitationsService } from './organization-invitations.service.js';
import { InvitationPreviewRateLimiterService } from './invitation-preview-rate-limiter.service.js';

@Module({
  imports: [ConfigModule],
  controllers: [
    OrganizationsController,
    OrganizationInvitationsController,
    InvitationsController,
  ],
  providers: [
    OrganizationsService,
    OrganizationInvitationsService,
    InvitationPreviewRateLimiterService,
  ],
  exports: [
    OrganizationsService,
    OrganizationInvitationsService,
    InvitationPreviewRateLimiterService,
  ],
=======

import { OrganizationsController } from './organizations.controller.js';
import { OrganizationsService } from './organizations.service.js';

@Module({
  controllers: [OrganizationsController],
  providers: [OrganizationsService],
  exports: [OrganizationsService],
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
})
export class OrganizationsModule {}