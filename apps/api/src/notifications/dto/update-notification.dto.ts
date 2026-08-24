import { NotificationPriority } from '../../generated/prisma/client.js';

export class UpdateNotificationDto {
  priority?: NotificationPriority;
  title?: string;
  message?: string;
  metadata?: Record<string, unknown>;
  read?: boolean;
}
