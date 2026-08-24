import { Module } from '@nestjs/common';
import { AIController } from './ai.controller.js';
import { AIService } from './ai.service.js';
import { ChunkingService } from './rag/chunking.service.js';
import { EmbeddingService } from './rag/embedding.service.js';
import { RetrievalService } from './rag/retrieval.service.js';
import { RerankingService } from './rag/reranking.service.js';
import { ContextService } from './rag/context.service.js';
import { RagService } from './rag/rag.service.js';
import { BugAnalyzerModule } from './bug-analyzer/bug-analyzer.module.js';
import { InsightsModule } from './insights/insights.module.js';
import { SprintPlannerModule } from './sprint-planner/sprint-planner.module.js';
import { StandupModule } from './standup/standup.module.js';



@Module({
  controllers: [AIController],
  providers: [
    AIService,
    ChunkingService,
    EmbeddingService,
    RetrievalService,
    RerankingService,
    ContextService,
    RagService,
    BugAnalyzerModule,
    InsightsModule,
    SprintPlannerModule,
    StandupModule,
  ],
  exports: [
    AIService,
    RagService,
  ],
})
export class AIModule {}