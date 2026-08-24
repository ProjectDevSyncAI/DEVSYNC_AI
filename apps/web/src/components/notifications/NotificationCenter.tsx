import {
  Bell,
  CheckCheck,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import NotificationItem, {
  type Notification,
} from "./NotificationItem";

interface NotificationCenterProps {
  notifications: Notification[];
  onNotificationClick?: (
    notification: Notification,
  ) => void;
}

export default function NotificationCenter({
  notifications,
  onNotificationClick,
}: NotificationCenterProps) {
  const [open, setOpen] = useState(false);
  const [items, setItems] =
    useState<Notification[]>(notifications);

  const unreadCount = useMemo(
    () => items.filter((item) => !item.read).length,
    [items],
  );

  const markAllRead = () => {
    setItems((current) =>
      current.map((item) => ({
        ...item,
        read: true,
      })),
    );
  };

  const markRead = (id: string) => {
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, read: true }
          : item,
      ),
    );
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-white/[0.05] hover:text-white"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell className="h-4 w-4" />

        {unreadCount > 0 && (
          <span className="absolute right-2 top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-500 px-1 text-[8px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close notifications"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />

          <div className="absolute right-0 top-full z-50 mt-2 w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-white/10 bg-[#0b0d1a] shadow-2xl shadow-black/50">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Notifications
                </h3>

                <p className="mt-0.5 text-[10px] text-slate-600">
                  {unreadCount} unread
                </p>
              </div>

              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="rounded-lg p-2 text-slate-500 hover:bg-white/[0.05] hover:text-indigo-300"
                    title="Mark all as read"
                  >
                    <CheckCheck className="h-4 w-4" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-2 text-slate-500 hover:bg-white/[0.05] hover:text-white"
                  title="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="max-h-[420px] overflow-y-auto">
              {items.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <Bell className="mx-auto h-6 w-6 text-slate-700" />
                  <p className="mt-3 text-xs text-slate-500">
                    You're all caught up.
                  </p>
                </div>
              ) : (
                items.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onClick={() =>
                      onNotificationClick?.(
                        notification,
                      )
                    }
                    onMarkRead={() =>
                      markRead(notification.id)
                    }
                  />
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}