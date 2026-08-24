import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { ChatService } from './chat.service.js';
import { CreateChannelDto } from './dto/create-channel.dto.js';
import { SendMessageDto } from './dto/send-message.dto.js';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('channels')
  createChannel(@Body() dto: CreateChannelDto) {
    return this.chatService.createChannel(dto);
  }

  @Get('channels/:id')
  getChannel(@Param('id') id: string) {
    return this.chatService.getChannel(id);
  }

  @Get('channels/project/:projectId')
  getProjectChannels(@Param('projectId') projectId: string) {
    return this.chatService.getProjectChannels(projectId);
  }

  @Delete('channels/:id')
  deleteChannel(@Param('id') id: string) {
    return this.chatService.deleteChannel(id);
  }

  @Post('messages')
  sendMessage(@Body() dto: SendMessageDto) {
    return this.chatService.sendMessage(dto);
  }

  @Get('channels/:channelId/messages')
  getMessages(@Param('channelId') channelId: string) {
    return this.chatService.getMessages(channelId);
  }

  @Patch('messages/:id')
  editMessage(
    @Param('id') id: string,
    @Body('content') content: string,
  ) {
    return this.chatService.editMessage(id, content);
  }

  @Delete('messages/:id')
  deleteMessage(@Param('id') id: string) {
    return this.chatService.deleteMessage(id);
  }
}