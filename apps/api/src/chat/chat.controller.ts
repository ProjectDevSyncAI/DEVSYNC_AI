import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
<<<<<<< HEAD
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
=======
} from '@nestjs/common';

>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
import { ChatService } from './chat.service.js';
import { CreateChannelDto } from './dto/create-channel.dto.js';
import { SendMessageDto } from './dto/send-message.dto.js';

@Controller('chat')
<<<<<<< HEAD
@UseGuards(JwtAuthGuard)
=======
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('channels')
<<<<<<< HEAD
  createChannel(@Req() req: any, @Body() dto: CreateChannelDto) {
    const userId = req?.user?.userId || req?.user?.id || '';
    return this.chatService.createChannel(userId, dto);
  }

  @Get('channels/:id')
  getChannel(@Req() req: any, @Param('id') id: string) {
    const userId = req?.user?.userId || req?.user?.id || '';
    return this.chatService.getChannel(userId, id);
  }

  @Get('channels/project/:projectId')
  getProjectChannels(@Req() req: any, @Param('projectId') projectId: string) {
    const userId = req?.user?.userId || req?.user?.id || '';
    return this.chatService.getProjectChannels(userId, projectId);
  }

  @Delete('channels/:id')
  deleteChannel(@Req() req: any, @Param('id') id: string) {
    const userId = req?.user?.userId || req?.user?.id || '';
    return this.chatService.deleteChannel(userId, id);
  }

  @Post('messages')
  sendMessage(@Req() req: any, @Body() dto: SendMessageDto) {
    const userId = req?.user?.userId || req?.user?.id || '';
    return this.chatService.sendMessage(userId, dto);
  }

  @Get('channels/:channelId/messages')
  getMessages(@Req() req: any, @Param('channelId') channelId: string) {
    const userId = req?.user?.userId || req?.user?.id || '';
    return this.chatService.getMessages(userId, channelId);
=======
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
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
  }

  @Patch('messages/:id')
  editMessage(
<<<<<<< HEAD
    @Req() req: any,
    @Param('id') id: string,
    @Body('content') content: string,
    @Query('channelId') channelId?: string,
    @Body('channelId') bodyChannelId?: string,
  ) {
    const userId = req?.user?.userId || req?.user?.id || '';
    return this.chatService.editMessage(
      userId,
      id,
      content,
      channelId || bodyChannelId,
    );
  }

  @Patch('channels/:channelId/messages/:id')
  editChannelMessage(
    @Req() req: any,
    @Param('channelId') channelId: string,
    @Param('id') id: string,
    @Body('content') content: string,
  ) {
    const userId = req?.user?.userId || req?.user?.id || '';
    return this.chatService.editMessage(userId, id, content, channelId);
  }

  @Delete('messages/:id')
  deleteMessage(
    @Req() req: any,
    @Param('id') id: string,
    @Query('channelId') channelId?: string,
    @Body('channelId') bodyChannelId?: string,
  ) {
    const userId = req?.user?.userId || req?.user?.id || '';
    return this.chatService.deleteMessage(
      userId,
      id,
      channelId || bodyChannelId,
    );
  }

  @Delete('channels/:channelId/messages/:id')
  deleteChannelMessage(
    @Req() req: any,
    @Param('channelId') channelId: string,
    @Param('id') id: string,
  ) {
    const userId = req?.user?.userId || req?.user?.id || '';
    return this.chatService.deleteMessage(userId, id, channelId);
=======
    @Param('id') id: string,
    @Body('content') content: string,
  ) {
    return this.chatService.editMessage(id, content);
  }

  @Delete('messages/:id')
  deleteMessage(@Param('id') id: string) {
    return this.chatService.deleteMessage(id);
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
  }
}