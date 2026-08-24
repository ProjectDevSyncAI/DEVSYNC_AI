import {
  ArrowDownRight,
  ArrowUpRight,
  Minus,
} from "lucide-react";
import type { ReactNode } from "react";

interface MetricCardProps {
  label: string;
  value: string | number;
  change?: number;
  description?: string;
  icon?: ReactNode;
}

export default function MetricCard({
  label,
  value,
  change,
  description,
  icon,
}: MetricCardProps) {
  const trend =
    change === undefined
      ? "neutral"
      : change > 0
        ? "up"
        : change < 0
          ? "down"
          : "neutral";

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500">
            {label}
          </p>

          <p className="mt-2 text-2xl font-bold tracking-tight text-white">
            {value}
          </p>
        </div>

        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-300">
            {icon}
          </div>
        )}
      </div>

      {(change !== undefined || description) && (
        <div className="mt-4 flex items-center gap-2">
          {change !== undefined && (
            <span
              className={[
                "inline-flex items-center gap-1 text-xs font-medium",
                trend === "up"
                  ? "text-emerald-300"
                  : trend === "down"
                    ? "text-red-300"
                    : "text-slate-400",
              ].join(" ")}
            >
              {trend === "up" ? (
                <ArrowUpRight className="h-3.5 w-3.5" />
              ) : trend === "down" ? (
                <ArrowDownRight className="h-3.5 w-3.5" />
              ) : (
                <Minus className="h-3.5 w-3.5" />
              )}

              {Math.abs(change)}%
            </span>
          )}

          {description && (
            <span className="text-[11px] text-slate-500">
              {description}
            </span>
          )}
        </div>
      )}
    </div>
  );
}