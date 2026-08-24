import React from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Layers3,
  Sparkles,
  Target,
  Users,
  Zap,
} from "lucide-react";

type Stat = {
  title: string;
  value: string;
  icon: React.ElementType;
};

const stats: Stat[] = [
  {
    title: "Sprint Capacity",
    value: "84%",
    icon: Target,
  },
  {
    title: "Planned Tasks",
    value: "32",
    icon: Layers3,
  },
  {
    title: "Team Members",
    value: "8",
    icon: Users,
  },
  {
    title: "Estimated Hours",
    value: "126h",
    icon: Clock3,
  },
];

const plan = [
  {
    title: "Authentication & Security",
    tasks: 6,
    hours: "24h",
    priority: "Critical",
  },
  {
    title: "AI Sprint Intelligence",
    tasks: 8,
    hours: "38h",
    priority: "High",
  },
  {
    title: "Dashboard Analytics",
    tasks: 7,
    hours: "28h",
    priority: "High",
  },
  {
    title: "Real-time Collaboration",
    tasks: 5,
    hours: "21h",
    priority: "Medium",
  },
  {
    title: "Quality & Testing",
    tasks: 6,
    hours: "15h",
    priority: "Medium",
  },
];

function priorityClasses(priority: string) {
  switch (priority) {
    case "Critical":
      return "bg-red-50 text-red-700 border-red-200";
    case "High":
      return "bg-orange-50 text-orange-700 border-orange-200";
    default:
      return "bg-slate-50 text-slate-600 border-slate-200";
  }
}

export default function SprintPlanner() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">
              <Sparkles className="h-3.5 w-3.5" />
              AI POWERED
            </span>
          </div>

          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                AI Sprint Planner
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Automatically turn project requirements, team capacity and
                priorities into an optimized sprint plan.
              </p>
            </div>

            <button
              type="button"
              className="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              <Sparkles className="h-4 w-4" />
              Generate Sprint
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map(({ title, value, icon: Icon }) => (
            <div
              key={title}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-sm font-medium text-slate-500">
                    {title}
                  </span>

                  <p className="mt-3 text-2xl font-bold">{value}</p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100">
                  <Icon className="h-5 w-5 text-slate-700" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_350px]">
          {/* Sprint Plan */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold">Generated Sprint Plan</h2>

                <p className="mt-1 text-sm text-slate-500">
                  September 1 – September 14, 2026
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                Optimized
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {plan.map((item, index) => (
                <div
                  key={item.title}
                  className="p-6 transition hover:bg-slate-50/70"
                >
                  <div className="flex gap-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">
                      {index + 1}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <h3 className="font-semibold">{item.title}</h3>

                        <span
                          className={`w-fit rounded-full border px-2.5 py-1 text-xs font-semibold ${priorityClasses(
                            item.priority,
                          )}`}
                        >
                          {item.priority}
                        </span>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-5 text-xs text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <Layers3 className="h-4 w-4" />
                          {item.tasks} tasks
                        </span>

                        <span className="flex items-center gap-1.5">
                          <Clock3 className="h-4 w-4" />
                          {item.hours}
                        </span>

                        <span className="flex items-center gap-1.5">
                          <Users className="h-4 w-4" />
                          Team assigned
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* AI Insights */}
          <aside className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>

                <div>
                  <h2 className="font-bold">AI Insights</h2>
                  <p className="text-xs text-slate-400">
                    Based on current project data
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-5">
                <div>
                  <p className="text-sm font-semibold">Capacity is healthy</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    The sprint is using approximately 84% of available team
                    capacity.
                  </p>
                </div>

                <div>
                  <p className="text-sm font-semibold">Prioritize security</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Authentication work has the highest dependency impact.
                  </p>
                </div>

                <div>
                  <p className="text-sm font-semibold">Avoid scope creep</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Keep approximately 16% capacity available for unexpected
                    work.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <CalendarDays className="h-5 w-5 text-slate-500" />
                <h2 className="font-bold">Sprint Timeline</h2>
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Day 1</span>
                  <span>Day 14</span>
                </div>

                <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full w-[64%] rounded-full bg-slate-900" />
                </div>

                <p className="mt-3 text-xs text-slate-500">
                  Current sprint progress:{" "}
                  <span className="font-semibold text-slate-900">64%</span>
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-900 p-6 text-white shadow-sm">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                <h2 className="font-bold">Smart Planning</h2>
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-300">
                DevSync AI continuously learns from task completion, team
                velocity and project risks to improve future sprint planning.
              </p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}