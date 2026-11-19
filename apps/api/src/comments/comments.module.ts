import { Module } from '@nestjs/common';
<<<<<<< HEAD
import { ActivityModule } from '../activity/activity.module.js';
=======
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
import { CommentsController } from './comments.controller.js';
import { CommentsService } from './comments.service.js';

@Module({
<<<<<<< HEAD
  imports: [ActivityModule],
=======
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
  controllers: [CommentsController],
  providers: [CommentsService],
  exports: [CommentsService],
})
export class CommentsModule {}
