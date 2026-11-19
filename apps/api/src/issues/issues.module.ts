import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module.js';
<<<<<<< HEAD
import { ActivityModule } from '../activity/activity.module.js';
=======
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c

import { IssuesController } from './issues.controller.js';
import { IssuesService } from './issues.service.js';

@Module({
<<<<<<< HEAD
  imports: [DatabaseModule, ActivityModule],
=======
  imports: [DatabaseModule],
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
  controllers: [IssuesController],
  providers: [IssuesService],
  exports: [IssuesService],
})
export class IssuesModule {}