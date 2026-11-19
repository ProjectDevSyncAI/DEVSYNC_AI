import { Module } from '@nestjs/common';

<<<<<<< HEAD
import { ActivityModule } from '../activity/activity.module.js';
=======
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
import { TasksController } from './tasks.controller.js';
import { TasksService } from './tasks.service.js';

@Module({
<<<<<<< HEAD
  imports: [ActivityModule],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
=======
  controllers: [TasksController],
  providers: [TasksService],
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
})
export class TasksModule {}