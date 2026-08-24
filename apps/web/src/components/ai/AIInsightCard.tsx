import {
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  Lightbulb,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import type { ReactNode } from "react";

export type AIInsightType =
  | "insight"
  | "warning"
  | "success"
  | "recommendation"
  | "trend";

interface AIInsightCardProps {
  type?: AIInsightType;
  title: string;
  description: string;
  confidence?: number;
  actionLabel?: string;
  onAction?: () => void;
  icon?: ReactNode;
  compact?: boolean;
}

const typeConfig: Record<
  AIInsightType,
  {
    icon: typeof BrainCircuit;
    iconClass: string;
    glowClass: string;
  }
> = {
  insight: {
    icon: BrainCircuit,
    iconClass: "text-indigo-300",
    glowClass: "bg-indigo-500/10",
  },
  warning: {
    icon: AlertTriangle,
    iconClass: "text-amber-300",
    glowClass: "bg-amber-500/10",
  },
  success: {
    icon: CheckCircle2,
    iconClass: "text-emerald-300",
    glowClass: "bg-emerald-500/10",
  },
  recommendation: {
    icon: Lightbulb,
    iconClass: "text-violet-300",
    glowClass: "bg-violet-500/10",
  },
  trend: {
    icon: TrendingUp,
    iconClass: "text-sky-300",
    glowClass: "bg-sky-500/10",
  },
};

export default function AIInsightCard({
  type = "insight",
  title,
  description,
  confidence,
  actionLabel,
  onAction,
  icon,
  compact = false,
}: AIInsightCardProps) {
  const config = typeConfig[type];
  const DefaultIcon = config.icon;

  return (
    <div
      className={[
        "group relative overflow-hidden rounded-2xl",
        "border border-white/10 bg-white/[0.035]",
        "backdrop-blur-xl transition-all duration-200",
        "hover:border-indigo-400/20 hover:bg-white/[0.05]",
        compact ? "p-4" : "p-5",
      ].join(" ")}
    >
      <div
        className={[
          "absolute -right-12 -top-12 h-32 w-32 rounded-full blur-3xl",
          config.glowClass,
        ].join(" ")}
      />

      <div className="relative flex gap-4">
        <div
          className={[
            "flex shrink-0 items-center justify-center rounded-xl",
            "border border-white/10",
            compact ? "h-9 w-9" : "h-11 w-11",
            config.glowClass,
          ].join(" ")}
        >
          {icon ?? (
            <DefaultIcon
              className={[
                compact ? "h-4 w-4" : "h-5 w-5",
                config.iconClass,
              ].join(" ")}
            />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />

                <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-300">
                  AI Insight
                </span>
              </div>

              <h3 className="mt-1 text-sm font-semibold text-white">
                {title}
              </h3>
            </div>

            {typeof confidence === "number" && (
              <span className="shrink-0 text-[10px] text-slate-500">
                {Math.round(confidence)}% confidence
              </span>
            )}
          </div>

          <p className="mt-2 text-xs leading-5 text-slate-400">
            {description}
          </p>

          {actionLabel && onAction && (
            <button
              type="button"
              onClick={onAction}
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-indigo-300 transition-colors hover:text-indigo-200"
            >
              {actionLabel}
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}