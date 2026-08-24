import {
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
    return this.aiService.getConversations(userId, projectId);
  }

  @Get('conversations/:id')
  getConversation(@Param('id') id: string) {
    return this.aiService.getConversation(id);
  }

  @Post('conversations')
  createConversation(
    @Body()
    body: {
      userId: string;
      projectId?: string;
      title: string;
    },
  ) {
    return this.aiService.createConversation(
      body.userId,
      body.projectId,
      body.title,
    );
  }

  @Post('messages')
  addMessage(
    @Body()
    body: {
      conversationId: string;
      userId?: string;
      role: string;
      content: string;
    },
  ) {
    return this.aiService.addMessage(
      body.conversationId,
      body.userId,
      body.role,
      body.content,
    );
  }

  @Get('insights/:projectId')
  getInsights(@Param('projectId') projectId: string) {
    return this.aiService.getInsights(projectId);
  }
}