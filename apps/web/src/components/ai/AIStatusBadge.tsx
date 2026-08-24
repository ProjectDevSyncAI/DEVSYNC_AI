import { BrainCircuit, Sparkles } from "lucide-react";

interface AIStatusBadgeProps {
  status?: "ready" | "thinking" | "offline" | "error";
  label?: string;
}

const config = {
  ready: {
    label: "AI Ready",
    dot: "bg-emerald-400",
    text: "text-emerald-300",
  },
  thinking: {
    label: "AI Thinking",
    dot: "bg-indigo-400 animate-pulse",
    text: "text-indigo-300",
  },
  offline: {
    label: "AI Offline",
    dot: "bg-slate-500",
    text: "text-slate-400",
  },
  error: {
    label: "AI Error",
    dot: "bg-red-400",
    text: "text-red-300",
  },
};

export default function AIStatusBadge({
  status = "ready",
  label,
}: AIStatusBadgeProps) {
  const current = config[status];

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
      <span className="relative flex h-2 w-2">
        <span
          className={[
            "absolute inline-flex h-full w-full rounded-full opacity-60",
            status === "thinking" ? "animate-ping" : "",
            current.dot.replace(" animate-pulse", ""),
          ].join(" ")}
        />

        <span
          className={[
            "relative inline-flex h-2 w-2 rounded-full",
            current.dot,
          ].join(" ")}
        />
      </span>

      <BrainCircuit className="h-3.5 w-3.5 text-indigo-400" />

      <span className={["text-xs font-medium", current.text].join(" ")}>
        {label ?? current.label}
      </span>

      {status === "ready" && (
        <Sparkles className="h-3 w-3 text-indigo-400" />
      )}
    </span>
  );
}