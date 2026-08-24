import type { ReactNode } from "react";

interface DashboardStatProps {
  label: string;
  value: string | number;
  description?: string;
  icon?: ReactNode;
  trend?: {
    value: string;
    positive?: boolean;
  };
}

export default function DashboardStat({
  label,
  value,
  description,
  icon,
  trend,
}: DashboardStatProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {label}
          </p>

          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
        </div>

        {icon && (
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            {icon}
          </div>
        )}
      </div>

      {(description || trend) && (
        <div className="mt-4 flex items-center justify-between gap-3">
          {description && (
            <p className="text-xs text-slate-400">
              {description}
            </p>
          )}

          {trend && (
            <span
              className={
                trend.positive === false
                  ? "text-xs font-semibold text-rose-600"
                  : "text-xs font-semibold text-emerald-600"
              }
            >
              {trend.positive === false
                ? "↓"
                : "↑"}{" "}
              {trend.value}
            </span>
          )}
        </div>
      )}
    </article>
  );
}