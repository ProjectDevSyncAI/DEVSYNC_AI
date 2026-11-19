import { Module } from '@nestjs/common';
import { AIController } from './ai.controller.js';
import { AIService } from './ai.service.js';
import { ChunkingService } from './rag/chunking.service.js';
import { EmbeddingService } from './rag/embedding.service.js';
import { RetrievalService } from './rag/retrieval.service.js';
import { RerankingService } from './rag/reranking.service.js';
import { ContextService } from './rag/context.service.js';
import { RagService } from './rag/rag.service.js';
<<<<<<< HEAD
import { OpenAIService } from './llm/openai.service.js';
import { PromptService } from './llm/prompt.service.js';
=======
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
import { BugAnalyzerModule } from './bug-analyzer/bug-analyzer.module.js';
import { InsightsModule } from './insights/insights.module.js';
import { SprintPlannerModule } from './sprint-planner/sprint-planner.module.js';
import { StandupModule } from './standup/standup.module.js';

<<<<<<< HEAD
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module.js';
import { DocumentsModule } from '../documents/documents.module.js';
import { SseJwtAuthGuard } from './guards/sse-jwt-auth.guard.js';

@Module({
  imports: [
    ConfigModule,
    AuthModule,
    DocumentsModule,
    BugAnalyzerModule,
    InsightsModule,
    SprintPlannerModule,
    StandupModule,
  ],
  controllers: [AIController],
  providers: [
    SseJwtAuthGuard,
=======


@Module({
  controllers: [AIController],
  providers: [
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
    AIService,
    ChunkingService,
    EmbeddingService,
    RetrievalService,
    RerankingService,
    ContextService,
    RagService,
<<<<<<< HEAD
    OpenAIService,
    PromptService,
=======
    BugAnalyzerModule,
    InsightsModule,
    SprintPlannerModule,
    StandupModule,
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
  ],
  exports: [
    AIService,
    RagService,
<<<<<<< HEAD
    OpenAIService,
    PromptService,
=======
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
  ],
})
export class AIModule {}