import {
  ConnectedSocket,
  MessageBody,
<<<<<<< HEAD
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ConfigService } from '@nestjs/config';

import { ChatService } from './chat.service.js';
import { SendMessageDto } from './dto/send-message.dto.js';
import { PrismaService } from '../database/prisma.service.js';
import {
  authorizeChannelAccess,
  verifySocketTokenSync,
} from './chat-auth.validator.js';
=======
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';

import { ChatService } from './chat.service.js';
import { SendMessageDto } from './dto/send-message.dto.js';
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c

@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: '*',
  },
})
<<<<<<< HEAD
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly chatService: ChatService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  afterInit(server: Server) {
    // Socket.IO Handshake Middleware: Rejects unauthenticated connections during handshake phase
    server.use((socket: Socket, next: (err?: Error) => void) => {
      try {
        const rawToken =
          socket.handshake.auth?.token ||
          (socket.handshake.headers?.authorization as string | undefined);

        const secret =
          this.configService.get<string>('auth.jwtSecret') ||
          process.env.JWT_SECRET ||
          'devsync-production-grade-jwt-secret-key-32-chars';

        const user = verifySocketTokenSync(rawToken, secret);
        socket.data.user = user;
        next();
      } catch (err: any) {
        next(new Error(err?.message || 'Unauthorized connection'));
      }
    });
  }

  handleConnection(socket: Socket) {
    // Secondary defense in case connection bypassed middleware
    if (!socket.data?.user) {
      try {
        const rawToken =
          socket.handshake.auth?.token ||
          (socket.handshake.headers?.authorization as string | undefined);

        const secret =
          this.configService.get<string>('auth.jwtSecret') ||
          process.env.JWT_SECRET ||
          'devsync-production-grade-jwt-secret-key-32-chars';

        const user = verifySocketTokenSync(rawToken, secret);
        socket.data.user = user;
      } catch (err: any) {
        socket.emit('error', {
          message: err?.message || 'Unauthorized connection',
        });
        socket.disconnect(true);
      }
    }
  }

  handleDisconnect(_socket: Socket) {
    // Normal cleanup
  }

  @SubscribeMessage('join-channel')
  async joinChannel(
    @MessageBody() channelId: string,
    @ConnectedSocket() socket: Socket,
  ) {
    const user = socket.data?.user;
    if (!user) {
      return { success: false, error: 'Unauthorized: Missing session' };
    }

    const hasAccess = await authorizeChannelAccess(
      this.prisma,
      user.userId,
      channelId,
    );

    if (!hasAccess) {
      return {
        success: false,
        error: 'Forbidden: You do not have permission to join this channel',
      };
    }

=======
export class ChatGateway {
  constructor(
    private readonly chatService: ChatService,
  ) {}

  @SubscribeMessage('join-channel')
  joinChannel(
    @MessageBody() channelId: string,
    @ConnectedSocket() socket: Socket,
  ) {
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
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

<<<<<<< HEAD
  @SubscribeMessage('typing')
  async handleTyping(
    @MessageBody() data: { channelId: string },
    @ConnectedSocket() socket: Socket,
  ) {
    const user = socket.data?.user;
    if (!user || !data?.channelId) return;

    const hasAccess = await authorizeChannelAccess(
      this.prisma,
      user.userId,
      data.channelId,
    );

    if (!hasAccess) return;

    // Use verified username from JWT identity, ignore any client-supplied name
    socket.to(`channel:${data.channelId}`).emit('user-typing', {
      channelId: data.channelId,
      username: user.username,
    });
  }

=======
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
  @SubscribeMessage('send-message')
  async sendMessage(
    @MessageBody() dto: SendMessageDto,
    @ConnectedSocket() socket: Socket,
  ) {
<<<<<<< HEAD
    const user = socket.data?.user;
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const hasAccess = await authorizeChannelAccess(
      this.prisma,
      user.userId,
      dto.channelId,
    );

    if (!hasAccess) {
      return {
        success: false,
        error: 'Forbidden: You do not have permission to send messages in this channel',
      };
    }

    // Suppress client-supplied senderId, enforce verified user ID from JWT
    dto.senderId = user.userId;

    const message = await this.chatService.sendMessage(dto);

    // Broadcast to everyone in channel including other tabs
    this.server
      ? this.server.to(`channel:${dto.channelId}`).emit('new-message', message)
      : socket.to(`channel:${dto.channelId}`).emit('new-message', message);
=======
    const message = await this.chatService.sendMessage(dto);

    socket
      .to(`channel:${dto.channelId}`)
      .emit('new-message', message);
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c

    return message;
  }
}