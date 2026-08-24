import type { ReactNode } from "react";

interface SectionProps {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export default function Section({
  title,
  description,
  actions,
  children,
  className = "",
}: SectionProps) {
  return (
    <section
      className={[
        "space-y-4",
        className,
      ].join(" ")}
    >
      {(title || description || actions) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            {title && (
              <h2 className="text-sm font-semibold text-white">
                {title}
              </h2>
            )}

            {description && (
              <p className="mt-1 text-xs text-slate-600">
                {description}
              </p>
            )}
          </div>

          {actions && (
            <div className="shrink-0">
              {actions}
            </div>
          )}
        </div>
      )}

      {children}
    </section>
  );
}