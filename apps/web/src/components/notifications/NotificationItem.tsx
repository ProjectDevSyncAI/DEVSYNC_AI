import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  GitPullRequest,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NotificationType =
  | "task"
  | "pull_request"
  | "mention"
  | "warning"
  | "success"
  | "ai"
  | "general";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description?: string;
  time: string;
  read?: boolean;
}

interface NotificationItemProps {
  notification: Notification;
  onClick?: () => void;
  onMarkRead?: () => void;
}

const icons: Record<
  NotificationType,
  LucideIcon
> = {
  task: CheckCircle2,
  pull_request: GitPullRequest,
  mention: MessageSquare,
  warning: AlertTriangle,
  success: CheckCircle2,
  ai: Sparkles,
  general: Bell,
};

const iconStyles: Record<
  NotificationType,
  string
> = {
  task: "bg-indigo-500/10 text-indigo-300",
  pull_request: "bg-violet-500/10 text-violet-300",
  mention: "bg-sky-500/10 text-sky-300",
  warning: "bg-amber-500/10 text-amber-300",
  success: "bg-emerald-500/10 text-emerald-300",
  ai: "bg-indigo-500/10 text-indigo-300",
  general: "bg-white/[0.05] text-slate-400",
};

export default function NotificationItem({
  notification,
  onClick,
  onMarkRead,
}: NotificationItemProps) {
  const Icon = icons[notification.type];

  return (
    <button
      type="button"
      onClick={() => {
        onClick?.();

        if (!notification.read) {
          onMarkRead?.();
        }
      }}
      className={[
        "flex w-full gap-3 px-4 py-3 text-left",
        "transition-colors hover:bg-white/[0.04]",
        !notification.read
          ? "bg-indigo-500/[0.025]"
          : "",
      ].join(" ")}
    >
      <div
        className={[
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
          iconStyles[notification.type],
        ].join(" ")}
      >
        <Icon className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <p className="min-w-0 flex-1 text-xs font-medium text-slate-200">
            {notification.title}
          </p>

          {!notification.read && (
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
          )}
        </div>

        {notification.description && (
          <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-slate-600">
            {notification.description}
          </p>
        )}

        <p className="mt-1.5 text-[10px] text-slate-700">
          {notification.time}
        </p>
      </div>
    </button>
  );
}