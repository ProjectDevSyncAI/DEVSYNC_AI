import {
  ArrowRight,
  Check,
  Clock3,
  Sparkles,
  X,
} from "lucide-react";

interface AIRecommendationProps {
  title: string;
  description: string;
  impact?: "low" | "medium" | "high";
  effort?: "low" | "medium" | "high";
  onAccept?: () => void;
  onDismiss?: () => void;
}

const impactStyles = {
  low: "text-slate-400",
  medium: "text-amber-300",
  high: "text-emerald-300",
};

export default function AIRecommendation({
  title,
  description,
  impact = "medium",
  effort = "medium",
  onAccept,
  onDismiss,
}: AIRecommendationProps) {
  return (
    <div className="rounded-2xl border border-indigo-400/10 bg-indigo-500/[0.035] p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-300">
          <Sparkles className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-300">
              AI Recommendation
            </span>
          </div>

          <h3 className="mt-1 text-sm font-semibold text-white">
            {title}
          </h3>

          <p className="mt-2 text-xs leading-5 text-slate-400">
            {description}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-4">
            <span className="text-[11px] text-slate-500">
              Impact:{" "}
              <strong className={impactStyles[impact]}>
                {impact}
              </strong>
            </span>

            <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
              <Clock3 className="h-3 w-3" />
              Effort: {effort}
            </span>
          </div>

          <div className="mt-4 flex items-center gap-2">
            {onAccept && (
              <button
                type="button"
                onClick={onAccept}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-500"
              >
                <Check className="h-3.5 w-3.5" />
                Apply
              </button>
            )}

            {onDismiss && (
              <button
                type="button"
                onClick={onDismiss}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs text-slate-400 hover:bg-white/[0.05] hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
                Dismiss
              </button>
            )}

            <button
              type="button"
              className="ml-auto inline-flex items-center gap-1 text-xs text-indigo-300 hover:text-indigo-200"
            >
              Details
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}