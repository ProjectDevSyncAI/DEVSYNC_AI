import {
  ChevronRight,
  Home,
} from "lucide-react";
import type { ReactNode } from "react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: ReactNode;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  onNavigate?: (href: string) => void;
}

export default function Breadcrumbs({
  items,
  onNavigate,
}: BreadcrumbsProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex min-w-0 items-center gap-1.5 overflow-hidden"
    >
      <button
        type="button"
        onClick={() => onNavigate?.("/dashboard")}
        className="shrink-0 rounded-md p-1 text-slate-600 hover:bg-white/[0.05] hover:text-slate-300"
        aria-label="Home"
      >
        <Home className="h-3.5 w-3.5" />
      </button>

      {items.map((item, index) => {
        const last = index === items.length - 1;

        return (
          <div
            key={`${item.label}-${index}`}
            className="flex min-w-0 items-center gap-1.5"
          >
            <ChevronRight className="h-3 w-3 shrink-0 text-slate-700" />

            {item.href && !last ? (
              <button
                type="button"
                onClick={() =>
                  onNavigate?.(item.href!)
                }
                className="truncate text-xs text-slate-600 hover:text-slate-300"
              >
                {item.label}
              </button>
            ) : (
              <span
                className={[
                  "flex min-w-0 items-center gap-1.5 truncate text-xs",
                  last
                    ? "font-medium text-slate-300"
                    : "text-slate-600",
                ].join(" ")}
              >
                {item.icon}
                {item.label}
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
}