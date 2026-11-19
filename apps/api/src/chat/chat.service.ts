<<<<<<< HEAD
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
=======
import { Injectable, NotFoundException } from '@nestjs/common';
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c

import { PrismaService } from '../database/prisma.service.js';
import { CreateChannelDto } from './dto/create-channel.dto.js';
import { SendMessageDto } from './dto/send-message.dto.js';
<<<<<<< HEAD
import { assertProjectAccess } from '../common/helpers/project-access.helper.js';
import { authorizeChannelAccess } from './chat-auth.validator.js';
=======
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

<<<<<<< HEAD
  async createChannel(
    userIdOrDto: string | CreateChannelDto,
    maybeDto?: CreateChannelDto,
  ) {
    let userId: string;
    let dto: CreateChannelDto;

    if (typeof userIdOrDto === 'string') {
      userId = userIdOrDto;
      dto = maybeDto!;
    } else {
      dto = userIdOrDto;
      userId = '';
    }

    if (!userId) {
      throw new ForbiddenException('User is not authenticated');
    }

    if (dto.projectId) {
      await assertProjectAccess(this.prisma, userId, dto.projectId);
    }

    const channel = await this.prisma.chatChannel.create({
=======
  async createChannel(dto: CreateChannelDto) {
    return this.prisma.chatChannel.create({
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
      data: {
        projectId: dto.projectId,
        name: dto.name,
        type: (dto.type as any) ?? 'PROJECT',
        isPrivate: dto.isPrivate ?? false,
      },
    });
<<<<<<< HEAD

    // If channel is private, automatically add creator as a member
    if (dto.isPrivate && channel?.id) {
      await this.prisma.chatChannelMember.create({
        data: {
          channelId: channel.id,
          userId,
        },
      });
    }

    return channel;
  }

  async getChannel(userIdOrId: string, maybeId?: string) {
    let userId: string | undefined;
    let id: string;

    if (maybeId) {
      userId = userIdOrId;
      id = maybeId;
    } else {
      id = userIdOrId;
    }

=======
  }

  async getChannel(id: string) {
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
    const channel = await this.prisma.chatChannel.findUnique({
      where: { id },
      include: {
        members: true,
      },
    });

    if (!channel) {
      throw new NotFoundException('Chat channel not found');
    }

<<<<<<< HEAD
    if (userId) {
      const hasAccess = await authorizeChannelAccess(this.prisma, userId, id);
      if (!hasAccess) {
        throw new ForbiddenException(
          'You do not have permission to access this channel',
        );
      }
    }

    return channel;
  }

  async getProjectChannels(userIdOrProjectId: string, maybeProjectId?: string) {
    let userId: string | undefined;
    let projectId: string;

    if (maybeProjectId) {
      userId = userIdOrProjectId;
      projectId = maybeProjectId;
    } else {
      projectId = userIdOrProjectId;
    }

    if (userId) {
      await assertProjectAccess(this.prisma, userId, projectId);
    }

    const channels = await this.prisma.chatChannel.findMany({
      where: { projectId },
      include: {
        members: {
          where: userId ? { userId } : undefined,
          select: { id: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    if (!userId) {
      return channels;
    }

    // Filter out private channels unless user is a member or org owner/admin
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        organizationId: true,
        organization: { select: { ownerId: true } },
      },
    });

    let isOrgAdmin = false;
    if (project) {
      const orgMember = await this.prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId: project.organizationId,
            userId,
          },
        },
        select: { role: true },
      });
      if (
        orgMember &&
        ['OWNER', 'ADMIN', 'MANAGER'].includes(orgMember.role)
      ) {
        isOrgAdmin = true;
      }
    }

    return channels.filter((channel) => {
      if (!channel.isPrivate) return true;
      if (isOrgAdmin) return true;
      return channel.members && channel.members.length > 0;
    });
  }

  async deleteChannel(userIdOrId: string, maybeId?: string) {
    let userId: string | undefined;
    let id: string;

    if (maybeId) {
      userId = userIdOrId;
      id = maybeId;
    } else {
      id = userIdOrId;
    }

    const channel = await this.prisma.chatChannel.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            organizationId: true,
            organization: { select: { ownerId: true } },
          },
        },
      },
    });

    if (!channel) {
      throw new NotFoundException('Chat channel not found');
    }

    if (userId && channel.project) {
      let isAuthorized = false;
      const orgMember = await this.prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId: channel.project.organizationId,
            userId,
          },
        },
        select: { role: true },
      });
      if (
        orgMember &&
        ['OWNER', 'ADMIN', 'MANAGER'].includes(orgMember.role)
      ) {
        isAuthorized = true;
      }

      if (!isAuthorized) {
        throw new ForbiddenException(
          'You do not have administrative permission to delete this channel',
        );
      }
    }
=======
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
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c

    return this.prisma.chatChannel.delete({
      where: { id },
    });
  }

<<<<<<< HEAD
  async sendMessage(
    userIdOrDto: string | SendMessageDto,
    maybeDto?: SendMessageDto,
  ) {
    let userId: string;
    let dto: SendMessageDto;

    if (typeof userIdOrDto === 'string') {
      userId = userIdOrDto;
      dto = maybeDto!;
    } else {
      dto = userIdOrDto;
      userId = dto.senderId!;
    }

    if (!userId) {
      throw new ForbiddenException('User is not authenticated');
    }

    if (!dto.channelId) {
      throw new BadRequestException('Channel ID is required');
    }

    if (!dto.content || !dto.content.trim()) {
      throw new BadRequestException('Message content cannot be empty');
    }

    // Always enforce verified JWT identity, suppressing any client-supplied senderId
    dto.senderId = userId;

    const hasAccess = await authorizeChannelAccess(
      this.prisma,
      userId,
      dto.channelId,
    );
    if (!hasAccess) {
      throw new ForbiddenException(
        'You do not have permission to send messages in this channel',
      );
    }

    return this.prisma.chatMessage.create({
      data: {
        channelId: dto.channelId,
        senderId: userId,
        content: dto.content,
        type: (dto.type as any) ?? 'TEXT',
        metadata: dto.metadata
          ? JSON.parse(JSON.stringify(dto.metadata))
          : undefined,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            avatarUrl: true,
          },
        },
=======
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
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
      },
    });
  }

<<<<<<< HEAD
  async getMessages(userIdOrChannelId: string, maybeChannelId?: string) {
    let userId: string | undefined;
    let channelId: string;

    if (maybeChannelId) {
      userId = userIdOrChannelId;
      channelId = maybeChannelId;
    } else {
      channelId = userIdOrChannelId;
    }

    if (userId) {
      const hasAccess = await authorizeChannelAccess(
        this.prisma,
        userId,
        channelId,
      );
      if (!hasAccess) {
        throw new ForbiddenException(
          'You do not have permission to view messages in this channel',
        );
      }
    }

=======
  async getMessages(channelId: string) {
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
    return this.prisma.chatMessage.findMany({
      where: {
        channelId,
        deletedAt: null,
      },
<<<<<<< HEAD
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
=======
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

<<<<<<< HEAD
  async editMessage(
    userId: string,
    id: string,
    content: string,
    channelId?: string,
  ) {
    if (!content || !content.trim()) {
      throw new BadRequestException('Message content cannot be empty');
    }

    const message = await this.prisma.chatMessage.findUnique({
      where: { id },
      include: {
        channel: {
          select: {
            id: true,
            projectId: true,
            project: {
              select: {
                organizationId: true,
                organization: { select: { ownerId: true } },
              },
            },
          },
        },
      },
    });

    if (!message || message.deletedAt) {
      throw new NotFoundException('Message not found');
    }

    // Cross-channel manipulation check
    if (channelId && message.channelId !== channelId) {
      throw new BadRequestException(
        'Message does not belong to the specified channel',
      );
    }

    // Check ownership or admin permissions
    const isAuthor = message.senderId === userId;
    let isOrgAdmin = false;
    if (message.channel?.project) {
      const orgMember = await this.prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId: message.channel.project.organizationId,
            userId,
          },
        },
        select: { role: true },
      });
      if (
        orgMember &&
        ['OWNER', 'ADMIN', 'MANAGER'].includes(orgMember.role)
      ) {
        isOrgAdmin = true;
      }
    }

    if (!isAuthor && !isOrgAdmin) {
      throw new ForbiddenException(
        'You do not have permission to edit this message',
      );
    }

=======
  async editMessage(id: string, content: string) {
    const message = await this.prisma.chatMessage.findUnique({
      where: { id },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
    return this.prisma.chatMessage.update({
      where: { id },
      data: { content },
    });
  }

<<<<<<< HEAD
  async deleteMessage(userId: string, id: string, channelId?: string) {
    const message = await this.prisma.chatMessage.findUnique({
      where: { id },
      include: {
        channel: {
          select: {
            id: true,
            projectId: true,
            project: {
              select: {
                organizationId: true,
                organization: { select: { ownerId: true } },
              },
            },
          },
        },
      },
    });

    if (!message || message.deletedAt) {
      throw new NotFoundException('Message not found');
    }

    // Cross-channel manipulation check
    if (channelId && message.channelId !== channelId) {
      throw new BadRequestException(
        'Message does not belong to the specified channel',
      );
    }

    // Check ownership or admin permissions
    const isAuthor = message.senderId === userId;
    let isOrgAdmin = false;
    if (message.channel?.project) {
      const orgMember = await this.prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId: message.channel.project.organizationId,
            userId,
          },
        },
        select: { role: true },
      });
      if (
        orgMember &&
        ['OWNER', 'ADMIN', 'MANAGER'].includes(orgMember.role)
      ) {
        isOrgAdmin = true;
      }
    }

    if (!isAuthor && !isOrgAdmin) {
      throw new ForbiddenException(
        'You do not have permission to delete this message',
      );
    }

=======
  async deleteMessage(id: string) {
    const message = await this.prisma.chatMessage.findUnique({
      where: { id },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
    return this.prisma.chatMessage.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}