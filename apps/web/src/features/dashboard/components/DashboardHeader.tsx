interface DashboardHeaderProps {
  userName?: string;
  title?: string;
  description?: string;
}

export default function DashboardHeader({
  userName = "there",
  title = "Good to see you",
  description = "Here's what's happening across your workspace.",
}: DashboardHeaderProps) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="mb-1 text-sm font-medium text-indigo-600">
          Welcome back, {userName}
        </p>

        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          {title}
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          {description}
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          Workspace status
        </p>

        <div className="mt-1 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />

          <span className="text-sm font-semibold text-slate-700">
            All systems operational
          </span>
        </div>
      </div>
    </header>
  );
}