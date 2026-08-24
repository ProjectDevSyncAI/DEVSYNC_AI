import type { ReactNode } from "react";

interface AuthHeaderProps {
  title: string;
  description?: string;
  badge?: string;
  children?: ReactNode;
}

export default function AuthHeader({
  title,
  description,
  badge,
  children,
}: AuthHeaderProps) {
  return (
    <div className="mb-8 text-center">
      {badge && (
        <span className="mb-4 inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
          {badge}
        </span>
      )}

      <h1 className="text-3xl font-bold tracking-tight text-slate-900">
        {title}
      </h1>

      {description && (
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
          {description}
        </p>
      )}

      {children}
    </div>
  );
}