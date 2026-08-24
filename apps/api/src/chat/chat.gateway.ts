import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';

import { ChatService } from './chat.service.js';
import { SendMessageDto } from './dto/send-message.dto.js';

@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: '*',
  },
})
export class ChatGateway {
  constructor(
    private readonly chatService: ChatService,
  ) {}

  @SubscribeMessage('join-channel')
  joinChannel(
    @MessageBody() channelId: string,
    @ConnectedSocket() socket: Socket,
  ) {
    socket.join(`channel:${channelId}`);

    return {
      success: true,
      channelId,
    };
  }

  @SubscribeMessage('leave-channel')
  leaveChannel(
    @MessageBody() channelId: string,
    @ConnectedSocket() socket: Socket,
  ) {
    socket.leave(`channel:${channelId}`);

    return {
      success: true,
      channelId,
    };
  }

  @SubscribeMessage('send-message')
  async sendMessage(
    @MessageBody() dto: SendMessageDto,
    @ConnectedSocket() socket: Socket,
  ) {
    const message = await this.chatService.sendMessage(dto);

    socket
      .to(`channel:${dto.channelId}`)
      .emit('new-message', message);

    return message;
  }
}