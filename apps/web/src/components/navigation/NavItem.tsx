import {
  ChevronRight,
  type LucideIcon,
} from "lucide-react";

interface NavItemProps {
  label: string;
  icon: LucideIcon;
  active?: boolean;
  collapsed?: boolean;
  badge?: string | number;
  onClick?: () => void;
  expandable?: boolean;
}

export default function NavItem({
  label,
  icon: Icon,
  active = false,
  collapsed = false,
  badge,
  onClick,
  expandable = false,
}: NavItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={[
        "group flex w-full items-center gap-3 rounded-xl",
        "text-left transition-all duration-150",
        collapsed
          ? "justify-center px-2 py-2.5"
          : "px-3 py-2.5",
        active
          ? "bg-indigo-500/10 text-indigo-200"
          : "text-slate-500 hover:bg-white/[0.04] hover:text-slate-200",
      ].join(" ")}
    >
      <Icon
        className={[
          "h-4 w-4 shrink-0 transition-colors",
          active
            ? "text-indigo-400"
            : "text-slate-600 group-hover:text-slate-300",
        ].join(" ")}
      />

      {!collapsed && (
        <>
          <span className="min-w-0 flex-1 truncate text-xs font-medium">
            {label}
          </span>

          {badge !== undefined && (
            <span className="rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[9px] font-medium text-slate-500">
              {badge}
            </span>
          )}

          {expandable && (
            <ChevronRight className="h-3.5 w-3.5 text-slate-700" />
          )}
        </>
      )}
    </button>
  );
}