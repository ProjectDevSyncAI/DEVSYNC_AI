import type { DashboardProject } from "../services/dashboard.service";

interface ProjectOverviewProps {
  projects: DashboardProject[];
  onProjectClick?: (
    project: DashboardProject,
  ) => void;
}

export default function ProjectOverview({
  projects,
  onProjectClick,
}: ProjectOverviewProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="font-semibold text-slate-900">
            Projects
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Track project progress and delivery.
          </p>
        </div>

        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          {projects.length} projects
        </span>
      </div>

      <div className="grid gap-4 p-5 lg:grid-cols-2">
        {projects.map((project) => (
          <button
            type="button"
            key={project.id}
            onClick={() =>
              onProjectClick?.(project)
            }
            className="group rounded-xl border border-slate-200 p-4 text-left transition hover:border-indigo-200 hover:bg-indigo-50/30"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="truncate font-semibold text-slate-800">
                  {project.name}
                </h3>

                {project.description && (
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                    {project.description}
                  </p>
                )}
              </div>

              <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold capitalize text-emerald-700">
                {project.status}
              </span>
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="font-medium text-slate-500">
                  Progress
                </span>

                <span className="font-bold text-slate-700">
                  {project.progress}%
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(
                        0,
                        project.progress,
                      ),
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
              <span>
                {project.completedTasks}/
                {project.tasks} tasks
              </span>

              <span>
                {project.members} members
              </span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}