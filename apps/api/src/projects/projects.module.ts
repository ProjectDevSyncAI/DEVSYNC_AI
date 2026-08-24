import { Module } from '@nestjs/common';

import { ProjectsController } from './projects.controller.js';
import { ProjectService } from './project.service.js';

@Module({
  controllers: [ProjectsController],
  providers: [ProjectService],
  exports: [ProjectService],
})
export class ProjectsModule {}