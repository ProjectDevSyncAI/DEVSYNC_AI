<<<<<<< HEAD
import { IsBoolean, IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ChatChannelType } from '../../generated/prisma/client.js';

export class CreateChannelDto {
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsString()
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsEnum(ChatChannelType)
  type?: ChatChannelType;

  @IsOptional()
  @IsBoolean()
=======
export class CreateChannelDto {
  projectId?: string;
  name?: string;
  type?: string;
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
  isPrivate?: boolean;
}