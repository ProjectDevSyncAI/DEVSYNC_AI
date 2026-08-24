import {
  ArrowDown,
  ArrowUp,
  Minus,
} from "lucide-react";

interface TrendIndicatorProps {
  value: number;
  label?: string;
  inverse?: boolean;
}

export default function TrendIndicator({
  value,
  label,
  inverse = false,
}: TrendIndicatorProps) {
  const isPositive = inverse ? value < 0 : value > 0;
  const isNeutral = value === 0;

  return (
    <span
      className={[
        "inline-flex items-center gap-1 text-xs font-medium",
        isNeutral
          ? "text-slate-400"
          : isPositive
            ? "text-emerald-300"
            : "text-red-300",
      ].join(" ")}
    >
      {isNeutral ? (
        <Minus className="h-3.5 w-3.5" />
      ) : value > 0 ? (
        <ArrowUp className="h-3.5 w-3.5" />
      ) : (
        <ArrowDown className="h-3.5 w-3.5" />
      )}

      {Math.abs(value)}%

      {label && (
        <span className="font-normal text-slate-500">
          {label}
        </span>
      )}
    </span>
  );
}