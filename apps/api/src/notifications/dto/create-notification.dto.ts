<<<<<<< HEAD
import {
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import {
  NotificationPriority,
  NotificationType,
} from '../../generated/prisma/client.js';

export class CreateNotificationDto {
  @IsUUID()
  @IsString()
  userId!: string;

  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsEnum(NotificationType)
  type!: NotificationType;

  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;

  @IsString()
  @MaxLength(200)
  title!: string;

  @IsString()
  message!: string;

  @IsOptional()
  @IsObject()
=======
import { NotificationPriority, NotificationType } from '../../generated/prisma/client.js';

export class CreateNotificationDto {
  userId!: string;
  projectId?: string;

  type!: NotificationType;
  priority?: NotificationPriority;

  title!: string;
  message!: string;
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
  metadata?: Record<string, unknown>;
}
