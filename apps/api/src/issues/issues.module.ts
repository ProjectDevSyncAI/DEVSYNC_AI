import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module.js';

import { IssuesController } from './issues.controller.js';
import { IssuesService } from './issues.service.js';

@Module({
  imports: [DatabaseModule],
  controllers: [IssuesController],
  providers: [IssuesService],
  exports: [IssuesService],
})
export class IssuesModule {}