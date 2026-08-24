import type { DashboardActivity } from "../services/dashboard.service";

interface RecentActivityProps {
  activities: DashboardActivity[];
}

export default function RecentActivity({
  activities,
}: RecentActivityProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="font-semibold text-slate-900">
          Recent activity
        </h2>

        <p className="mt-1 text-xs text-slate-500">
          Latest updates across your workspace.
        </p>
      </div>

      <div className="divide-y divide-slate-100">
        {activities.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-slate-400">
            No recent activity.
          </div>
        ) : (
          activities.map((activity) => (
            <article
              key={activity.id}
              className="flex gap-4 px-5 py-4 transition hover:bg-slate-50"
            >
              <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-600">
                {activity.userName
                  .slice(0, 1)
                  .toUpperCase()}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-800">
                    {activity.title}
                  </h3>

                  <span className="text-xs text-slate-400">
                    {formatTime(activity.createdAt)}
                  </span>
                </div>

                <p className="mt-1 text-sm text-slate-500">
                  {activity.description}
                </p>

                <p className="mt-2 text-xs font-medium text-slate-400">
                  {activity.userName}
                </p>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function formatTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}