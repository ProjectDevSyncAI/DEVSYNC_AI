import type { ReactNode } from "react";

type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "purple";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  dot?: boolean;
  className?: string;
}

const styles: Record<BadgeVariant, string> = {
  default:
    "bg-white/[0.07] text-slate-300 border-white/10",
  success:
    "bg-emerald-400/10 text-emerald-300 border-emerald-400/20",
  warning:
    "bg-amber-400/10 text-amber-300 border-amber-400/20",
  danger:
    "bg-red-400/10 text-red-300 border-red-400/20",
  info:
    "bg-sky-400/10 text-sky-300 border-sky-400/20",
  purple:
    "bg-violet-400/10 text-violet-300 border-violet-400/20",
};

const dots: Record<BadgeVariant, string> = {
  default: "bg-slate-400",
  success: "bg-emerald-400",
  warning: "bg-amber-400",
  danger: "bg-red-400",
  info: "bg-sky-400",
  purple: "bg-violet-400",
};

export default function Badge({
  children,
  variant = "default",
  dot = false,
  className = "",
}: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full",
        "border px-2.5 py-1 text-[11px] font-medium",
        styles[variant],
        className,
      ].join(" ")}
    >
      {dot && (
        <span
          className={[
            "h-1.5 w-1.5 rounded-full",
            dots[variant],
          ].join(" ")}
        />
      )}

      {children}
    </span>
  );
}