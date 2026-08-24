import type { HTMLAttributes, ReactNode } from "react";

interface CardProps
  extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  interactive?: boolean;
}

export default function Card({
  children,
  interactive = false,
  className = "",
  ...props
}: CardProps) {
  return (
    <div
      className={[
        "rounded-2xl border border-white/10",
        "bg-white/[0.035] backdrop-blur-xl",
        "shadow-[0_20px_60px_rgba(0,0,0,0.18)]",
        interactive
          ? "transition duration-200 hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/[0.05]"
          : "",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "flex items-center justify-between gap-4 p-5",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <h3 className="text-sm font-semibold text-white">
      {children}
    </h3>
  );
}

export function CardDescription({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <p className="mt-1 text-xs leading-5 text-slate-500">
      {children}
    </p>
  );
}

export function CardContent({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={["px-5 pb-5", className].join(" ")}>
      {children}
    </div>
  );
}