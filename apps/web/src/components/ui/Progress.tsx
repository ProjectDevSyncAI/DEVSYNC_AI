interface ProgressProps {
  value: number;
  max?: number;
  showValue?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export default function Progress({
  value,
  max = 100,
  showValue = false,
  size = "sm",
  className = "",
}: ProgressProps) {
  const percentage = Math.min(
    100,
    Math.max(0, (value / max) * 100),
  );

  return (
    <div className={className}>
      <div className="flex items-center gap-3">
        <div
          className={[
            "flex-1 overflow-hidden rounded-full bg-white/[0.07]",
            size === "sm" ? "h-1.5" : "h-2.5",
          ].join(" ")}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>

        {showValue && (
          <span className="w-10 text-right text-xs font-medium text-slate-400">
            {Math.round(percentage)}%
          </span>
        )}
      </div>
    </div>
  );
}