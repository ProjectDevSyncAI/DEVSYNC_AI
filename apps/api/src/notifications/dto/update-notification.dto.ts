<<<<<<< HEAD
import {
  IsBoolean,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { NotificationPriority } from '../../generated/prisma/client.js';

export class UpdateNotificationDto {
  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
=======
import { NotificationPriority } from '../../generated/prisma/client.js';

export class UpdateNotificationDto {
  priority?: NotificationPriority;
  title?: string;
  message?: string;
  metadata?: Record<string, unknown>;
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
  read?: boolean;
}
