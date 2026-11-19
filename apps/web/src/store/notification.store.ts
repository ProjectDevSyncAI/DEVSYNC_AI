import { create } from "zustand";
import {
  notificationApi,
  type BackendNotification,
  type BackendNotificationType,
} from "../lib/api";

/* ------------------------------------------------------------------ */
/*  Display-layer type mapping                                          */
/* ------------------------------------------------------------------ */

export type NotificationDisplayType =
  | "task"
  | "mention"
  | "pull_request"
  | "ai"
  | "chat"
  | "sprint"
  | "system";

const TYPE_MAP: Record<BackendNotificationType, NotificationDisplayType> = {
  TASK_ASSIGNED: "task",
  TASK_UPDATED: "task",
  ISSUE_ASSIGNED: "task",
  ISSUE_UPDATED: "task",
  PR_REVIEW: "pull_request",
  PR_MERGED: "pull_request",
  MENTION: "mention",
  CHAT_MESSAGE: "chat",
  SPRINT_STARTED: "sprint",
  SPRINT_COMPLETED: "sprint",
  AI_INSIGHT: "ai",
  RISK_DETECTED: "ai",
  SYSTEM: "system",
};

export function mapNotificationType(
  type: BackendNotificationType,
): NotificationDisplayType {
  return TYPE_MAP[type] ?? "system";
}

/** Format an ISO date string into a relative-time label. */
export function formatNotificationTime(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(isoDate).toLocaleDateString();
}

/* ------------------------------------------------------------------ */
/*  Store state & actions                                               */
/* ------------------------------------------------------------------ */

export interface NotificationState {
  notifications: BackendNotification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;

  /** Fetch all (or unread-only) notifications from the backend. */
  fetchNotifications: (unreadOnly?: boolean) => Promise<void>;

  /** Fetch only the unread count (lightweight). */
  fetchUnreadCount: () => Promise<void>;

  /** Mark a single notification as read (optimistic). */
  markAsRead: (id: string) => Promise<void>;

  /** Mark all notifications as read. */
  markAllAsRead: () => Promise<void>;

  /** Delete a single notification (optimistic). */
  deleteNotification: (id: string) => Promise<void>;

  /** Reset store on logout. */
  clearNotificationState: () => void;
}

const initialState: Pick<
  NotificationState,
  "notifications" | "unreadCount" | "isLoading" | "error"
> = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
};

export const useNotificationStore = create<NotificationState>((set, get) => ({
  ...initialState,

  /* ---------------------------------------------------------------- */
  fetchNotifications: async (unreadOnly = false) => {
    set({ isLoading: true, error: null });
    try {
      const items = await notificationApi.getNotifications(unreadOnly);
      const unread = items.filter((n) => n.readAt === null).length;
      set({ notifications: items, unreadCount: unread, isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : "Failed to load notifications",
      });
    }
  },

  /* ---------------------------------------------------------------- */
  fetchUnreadCount: async () => {
    try {
      const { count } = await notificationApi.getUnreadCount();
      set({ unreadCount: count });
    } catch {
      // non-critical — silent fail
    }
  },

  /* ---------------------------------------------------------------- */
  markAsRead: async (id: string) => {
    // Optimistic update
    const prev = get().notifications;
    const readAt = new Date().toISOString();
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, readAt } : n,
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));

    try {
      const updated = await notificationApi.markAsRead(id);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? updated : n,
        ),
      }));
    } catch (err) {
      // Rollback optimistic update
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? (prev.find((p) => p.id === id) ?? n) : n,
        ),
        unreadCount: state.unreadCount + 1,
        error: err instanceof Error ? err.message : "Failed to mark as read",
      }));
    }
  },

  /* ---------------------------------------------------------------- */
  markAllAsRead: async () => {
    const readAt = new Date().toISOString();
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.readAt === null ? { ...n, readAt } : n,
      ),
      unreadCount: 0,
    }));

    try {
      await notificationApi.markAllAsRead();
    } catch (err) {
      // Re-fetch to restore correct state on failure
      get().fetchNotifications();
      set({
        error: err instanceof Error ? err.message : "Failed to mark all as read",
      });
    }
  },

  /* ---------------------------------------------------------------- */
  deleteNotification: async (id: string) => {
    const prev = get().notifications;
    const target = prev.find((n) => n.id === id);

    // Optimistic removal
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
      unreadCount:
        target && target.readAt === null
          ? Math.max(0, state.unreadCount - 1)
          : state.unreadCount,
    }));

    try {
      await notificationApi.deleteNotification(id);
    } catch (err) {
      // Rollback
      set((state) => ({
        notifications: target ? [target, ...state.notifications] : state.notifications,
        unreadCount:
          target && target.readAt === null
            ? state.unreadCount + 1
            : state.unreadCount,
        error: err instanceof Error ? err.message : "Failed to delete notification",
      }));
    }
  },

  /* ---------------------------------------------------------------- */
  clearNotificationState: () => set(initialState),
}));
