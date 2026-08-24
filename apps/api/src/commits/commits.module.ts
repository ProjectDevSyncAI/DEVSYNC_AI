import { Module } from '@nestjs/common';
import { CommitsController } from './commits.controller.js';
import { CommitsService } from './commits.service.js';

@Module({
  controllers: [CommitsController],
  providers: [CommitsService],
  exports: [CommitsService],
})
export class CommitsModule {}