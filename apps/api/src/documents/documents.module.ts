import { Module } from '@nestjs/common';
<<<<<<< HEAD
import { ActivityModule } from '../activity/activity.module.js';
import { DocumentsController } from './documents.controller.js';
import { DocumentsService } from './documents.service.js';
import { StorageService } from './storage/storage.service.js';
import { ProjectUploadGuard } from './guards/project-upload.guard.js';
import { ReconciliationAuthGuard } from './guards/reconciliation-auth.guard.js';
import { DocumentExtractionService } from './extraction/document-extraction.service.js';
import { DocumentQueueService } from './queues/document-queue.service.js';
import { DocumentReconciliationService } from './queues/document-reconciliation.service.js';

@Module({
  imports: [ActivityModule],
  controllers: [DocumentsController],
  providers: [
    DocumentsService,
    StorageService,
    ProjectUploadGuard,
    ReconciliationAuthGuard,
    DocumentExtractionService,
    DocumentQueueService,
    DocumentReconciliationService,
  ],
  exports: [
    DocumentsService,
    StorageService,
    ProjectUploadGuard,
    ReconciliationAuthGuard,
    DocumentExtractionService,
    DocumentQueueService,
    DocumentReconciliationService,
  ],
})
export class DocumentsModule {}
=======
import { DocumentsController } from './documents.controller.js';
import { DocumentsService } from './documents.service.js';

@Module({
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
