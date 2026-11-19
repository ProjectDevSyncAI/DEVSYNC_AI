<<<<<<< HEAD
import { IsEnum, IsNotEmpty, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';
import { MessageType } from '../../generated/prisma/client.js';

export class SendMessageDto {
  @IsUUID()
  channelId!: string;

  @IsOptional()
  @IsUUID()
  senderId?: string;

  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsOptional()
  @IsEnum(MessageType)
  type?: MessageType;

  @IsOptional()
  @IsObject()
=======
export class SendMessageDto {
  channelId!: string;
  senderId?: string;
  content!: string;
  type?: string;
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
  metadata?: Record<string, unknown>;
}