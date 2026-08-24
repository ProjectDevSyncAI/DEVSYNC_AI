import { Module } from '@nestjs/common';

import {
  SprintMembersController,
} from './sprint-members.controller.js';

import {
  SprintMembersService,
} from './sprint-members.service.js';

@Module({
  controllers: [SprintMembersController],
  providers: [SprintMembersService],
  exports: [SprintMembersService],
})
export class SprintMembersModule {}