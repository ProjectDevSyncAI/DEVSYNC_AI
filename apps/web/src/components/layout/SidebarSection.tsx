import type { ReactNode } from "react";

interface SidebarSectionProps {
  title: string;
  children: ReactNode;
  collapsed?: boolean;
}

export default function SidebarSection({
  title,
  children,
  collapsed = false,
}: SidebarSectionProps) {
  return (
    <div className="mb-5">
      {!collapsed && (
        <p className="mb-2 px-3 text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-600">
          {title}
        </p>
      )}

      <div className="space-y-1">
        {children}
      </div>
    </div>
  );
}