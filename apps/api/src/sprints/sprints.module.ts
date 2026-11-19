import { Module } from '@nestjs/common';
<<<<<<< HEAD
import { ActivityModule } from '../activity/activity.module.js';
=======
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
import { SprintsController } from './sprints.controller.js';
import { SprintsService } from './sprints.service.js';

@Module({
<<<<<<< HEAD
  imports: [ActivityModule],
=======
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
  controllers: [SprintsController],
  providers: [SprintsService],
  exports: [SprintsService],
})
export class SprintsModule {}