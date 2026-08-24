import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../database/prisma.service.js';
import { CreateChannelDto } from './dto/create-channel.dto.js';
import { SendMessageDto } from './dto/send-message.dto.js';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async createChannel(dto: CreateChannelDto) {
    return this.prisma.chatChannel.create({
      data: {
        projectId: dto.projectId,
        name: dto.name,
        type: (dto.type as any) ?? 'PROJECT',
        isPrivate: dto.isPrivate ?? false,
      },
    });
  }

  async getChannel(id: string) {
    const channel = await this.prisma.chatChannel.findUnique({
      where: { id },
      include: {
        members: true,
      },
    });

    if (!channel) {
      throw new NotFoundException('Chat channel not found');
    }

    return channel;
  }

  async getProjectChannels(projectId: string) {
    return this.prisma.chatChannel.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async deleteChannel(id: string) {
    await this.getChannel(id);

    return this.prisma.chatChannel.delete({
      where: { id },
    });
  }

  async sendMessage(dto: SendMessageDto) {
    return this.prisma.chatMessage.create({
      data: {
        channelId: dto.channelId,
        senderId: dto.senderId,
        content: dto.content,
        type: (dto.type as any) ?? 'TEXT',
        metadata: dto.metadata
            ? JSON.parse(JSON.stringify(dto.metadata))
            : undefined,
      },
    });
  }

  async getMessages(channelId: string) {
    return this.prisma.chatMessage.findMany({
      where: {
        channelId,
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async editMessage(id: string, content: string) {
    const message = await this.prisma.chatMessage.findUnique({
      where: { id },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    return this.prisma.chatMessage.update({
      where: { id },
      data: { content },
    });
  }

  async deleteMessage(id: string) {
    const message = await this.prisma.chatMessage.findUnique({
      where: { id },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    return this.prisma.chatMessage.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}