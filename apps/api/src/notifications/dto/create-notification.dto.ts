import { NotificationPriority, NotificationType } from '../../generated/prisma/client.js';

export class CreateNotificationDto {
  userId!: string;
  projectId?: string;

  type!: NotificationType;
  priority?: NotificationPriority;

  title!: string;
  message!: string;
  metadata?: Record<string, unknown>;
}
