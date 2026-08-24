import type { ReactNode } from "react";

interface AuthCardProps {
  children: ReactNode;
  className?: string;
}

export default function AuthCard({
  children,
  className = "",
}: AuthCardProps) {
  return (
    <section
      className={[
        "w-full max-w-md rounded-2xl border",
        "border-slate-200 bg-white p-6 shadow-xl",
        "shadow-slate-200/40 sm:p-8",
        className,
      ].join(" ")}
    >
      {children}
    </section>
  );
}