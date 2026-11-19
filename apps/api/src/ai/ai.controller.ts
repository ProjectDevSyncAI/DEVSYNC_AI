import {
<<<<<<< HEAD
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  MessageEvent,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  Sse,
  UseGuards,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { AIService } from './ai.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { SseJwtAuthGuard } from './guards/sse-jwt-auth.guard.js';
import { PrismaService } from '../database/prisma.service.js';
import { assertProjectAccess } from '../common/helpers/project-access.helper.js';

@Controller('ai')
export class AIController {
  private readonly aiService: AIService;
  private readonly prisma: PrismaService;

  constructor(
    aiService: AIService,
    prisma: PrismaService,
  ) {
    this.aiService = aiService;
    this.prisma = prisma;
  }

  @Get('conversations')
  @UseGuards(JwtAuthGuard)
  async getConversations(
    @Req() req: any,
    @Query('projectId') projectId?: string,
  ) {
    const userId = req.user.userId || req.user.id;
    if (projectId) {
      await assertProjectAccess(this.prisma, userId, projectId);
    }
=======
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { AIService } from './ai.service.js';

@Controller('ai')
export class AIController {
  constructor(private readonly aiService: AIService) {}

  @Get('conversations')
  getConversations(
    @Query('userId') userId: string,
    @Query('projectId') projectId?: string,
  ) {
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
    return this.aiService.getConversations(userId, projectId);
  }

  @Get('conversations/:id')
<<<<<<< HEAD
  @UseGuards(JwtAuthGuard)
  async getConversation(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.userId || req.user.id;
    const conversation = await this.aiService.getConversation(id);
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (conversation.projectId) {
      await assertProjectAccess(this.prisma, userId, conversation.projectId);
    } else if (conversation.userId && conversation.userId !== userId) {
      throw new ForbiddenException('You do not have access to this conversation');
    }

    return conversation;
  }

  @Post('conversations')
  @UseGuards(JwtAuthGuard)
  async createConversation(
    @Req() req: any,
    @Body()
    body: {
=======
  getConversation(@Param('id') id: string) {
    return this.aiService.getConversation(id);
  }

  @Post('conversations')
  createConversation(
    @Body()
    body: {
      userId: string;
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
      projectId?: string;
      title: string;
    },
  ) {
<<<<<<< HEAD
    const userId = req.user.userId || req.user.id;
    if (body.projectId) {
      await assertProjectAccess(this.prisma, userId, body.projectId);
    }
    return this.aiService.createConversation(
      userId,
=======
    return this.aiService.createConversation(
      body.userId,
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
      body.projectId,
      body.title,
    );
  }

  @Post('messages')
<<<<<<< HEAD
  @UseGuards(JwtAuthGuard)
  async addMessage(
    @Req() req: any,
    @Body()
    body: {
      conversationId: string;
=======
  addMessage(
    @Body()
    body: {
      conversationId: string;
      userId?: string;
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
      role: string;
      content: string;
    },
  ) {
<<<<<<< HEAD
    const userId = req.user.userId || req.user.id;
    const conversation = await this.aiService.getConversation(body.conversationId);
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (conversation.projectId) {
      await assertProjectAccess(this.prisma, userId, conversation.projectId);
    } else if (conversation.userId && conversation.userId !== userId) {
      throw new ForbiddenException('You do not have access to this conversation');
    }

    return this.aiService.addMessage(
      body.conversationId,
      userId,
=======
    return this.aiService.addMessage(
      body.conversationId,
      body.userId,
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
      body.role,
      body.content,
    );
  }

  @Get('insights/:projectId')
<<<<<<< HEAD
  @UseGuards(JwtAuthGuard)
  async getInsights(@Req() req: any, @Param('projectId') projectId: string) {
    const userId = req.user.userId || req.user.id;
    await assertProjectAccess(this.prisma, userId, projectId);
    return this.aiService.getInsights(projectId);
  }

  @Post('ask')
  @UseGuards(JwtAuthGuard)
  async ask(
    @Req() req: any,
    @Body()
    body: {
      projectId: string;
      question: string;
      conversationId?: string;
    },
  ) {
    const userId = req.user.userId || req.user.id;
    await assertProjectAccess(this.prisma, userId, body.projectId);

    return this.aiService.ask(
      userId,
      body.projectId,
      body.question,
      body.conversationId,
    );
  }

  @Sse('ask/stream')
  @UseGuards(SseJwtAuthGuard)
  askStream(
    @Req() req: any,
    @Query('projectId') projectId: string,
    @Query('question') question: string,
  ): Observable<MessageEvent> {
    const userId = req.user?.userId || req.user?.id;

    return new Observable((subscriber) => {
      (async () => {
        try {
          if (!userId) {
            subscriber.error(new ForbiddenException('User is not authenticated'));
            return;
          }
          await assertProjectAccess(this.prisma, userId, projectId);

          for await (const token of this.aiService.askStream(
            userId,
            projectId,
            question,
          )) {
            subscriber.next({ data: { token } });
          }
          subscriber.next({ data: { done: true } });
          subscriber.complete();
        } catch (err: any) {
          subscriber.error(err);
        }
      })();
    });
  }

  @Get('rag/search')
  @UseGuards(JwtAuthGuard)
  async searchKnowledge(
    @Req() req: any,
    @Query('projectId') projectId: string,
    @Query('query') query: string,
    @Query('limit') limit?: string,
    @Query('distanceThreshold') distanceThreshold?: string,
  ) {
    const userId = req.user.userId || req.user.id;

    if (!projectId || typeof projectId !== 'string' || !projectId.trim()) {
      throw new BadRequestException('Project ID is required');
    }

    if (!query || typeof query !== 'string' || !query.trim()) {
      throw new BadRequestException('Query string is required');
    }

    await assertProjectAccess(this.prisma, userId, projectId.trim());

    // Validate distanceThreshold: must be finite number in [0, 2]
    let parsedThreshold: number | undefined;
    if (distanceThreshold !== undefined) {
      if (typeof distanceThreshold !== 'string' || distanceThreshold.trim() === '') {
        throw new BadRequestException('Distance threshold cannot be empty');
      }
      const num = Number(distanceThreshold);
      if (!Number.isFinite(num) || isNaN(num) || num < 0 || num > 2) {
        throw new BadRequestException(
          'Distance threshold must be a finite number between 0 and 2',
        );
      }
      parsedThreshold = num;
    }

    // Validate limit: positive integer between 1 and 20
    let parsedLimit = 5;
    if (limit !== undefined) {
      if (typeof limit !== 'string' || limit.trim() === '') {
        throw new BadRequestException('Limit cannot be empty');
      }
      const numLimit = Number(limit);
      if (!Number.isInteger(numLimit) || numLimit <= 0) {
        throw new BadRequestException(
          'Limit must be a positive integer between 1 and 20',
        );
      }
      if (numLimit > 20) {
        throw new BadRequestException('Limit cannot exceed 20');
      }
      parsedLimit = numLimit;
    }

    return this.aiService.searchKnowledge(
      projectId.trim(),
      query.trim(),
      parsedLimit,
      parsedThreshold,
    );
  }
=======
  getInsights(@Param('projectId') projectId: string) {
    return this.aiService.getInsights(projectId);
  }
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
}