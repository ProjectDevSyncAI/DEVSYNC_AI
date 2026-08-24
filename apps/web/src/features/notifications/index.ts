export type NotificationType =
  | "task"
  | "project"
  | "mention"
  | "comment"
  | "github"
  | "system"
  | "security";

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  userId: string;
  projectId?: string;
  taskId?: string;
  createdAt: string;
  actionUrl?: string;
}

export interface NotificationPreferences {
  taskUpdates: boolean;
  projectUpdates: boolean;
  mentions: boolean;
  comments: boolean;
  github: boolean;
  security: boolean;
  email: boolean;
  push: boolean;
}

export function countUnreadNotifications(
  notifications: NotificationItem[],
): number {
  return notifications.reduce(
    (count, notification) => count + (notification.read ? 0 : 1),
    0,
  );
}

export function markNotificationsAsRead(
  notifications: NotificationItem[],
  ids?: string[],
): NotificationItem[] {
  if (!ids) {
    return notifications.map((notification) => ({
      ...notification,
      read: true,
    }));
  }

  const selected = new Set(ids);

  return notifications.map((notification) =>
    selected.has(notification.id)
      ? { ...notification, read: true }
      : notification,
  );
}