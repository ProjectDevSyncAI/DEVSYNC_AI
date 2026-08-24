import React from "react";
import {
  ArrowLeft,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  CircleDot,
  Clock3,
  Code2,
  GitBranch,
  Layers3,
  MoreHorizontal,
  Plus,
  Settings2,
  Target,
  Users,
  Zap,
} from "lucide-react";

type Stat = {
  name: string;
  value: string;
  icon: React.ElementType;
};

const stats: Stat[] = [
  {
    name: "Total Tasks",
    value: "24",
    icon: Layers3,
  },
  {
    name: "Completed",
    value: "18",
    icon: CheckCircle2,
  },
  {
    name: "In Progress",
    value: "4",
    icon: Clock3,
  },
  {
    name: "Team Members",
    value: "8",
    icon: Users,
  },
];

const tasks = [
  {
    title: "Authentication system",
    description: "Implement JWT authentication and protected routes.",
    status: "Completed",
    priority: "High",
    assignee: "AK",
  },
  {
    title: "AI Sprint Planner",
    description: "Generate sprint plans using project requirements.",
    status: "In Progress",
    priority: "High",
    assignee: "DB",
  },
  {
    title: "Standup Generator",
    description: "Generate intelligent daily standup summaries.",
    status: "In Progress",
    priority: "Medium",
    assignee: "RS",
  },
  {
    title: "Analytics Dashboard",
    description: "Create project health and productivity analytics.",
    status: "Todo",
    priority: "Medium",
    assignee: "MK",
  },
];

const activity = [
  {
    text: "AI Sprint Planner generated a new sprint",
    time: "12 min ago",
    icon: Zap,
  },
  {
    text: "Arjun completed Authentication system",
    time: "38 min ago",
    icon: CheckCircle2,
  },
  {
    text: "New commit pushed to main branch",
    time: "1 hr ago",
    icon: GitBranch,
  },
  {
    text: "Project health score updated",
    time: "2 hrs ago",
    icon: BarChart3,
  },
];

function statusClasses(status: string) {
  switch (status) {
    case "Completed":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "In Progress":
      return "bg-blue-50 text-blue-700 border-blue-200";
    default:
      return "bg-slate-50 text-slate-600 border-slate-200";
  }
}

function priorityClasses(priority: string) {
  switch (priority) {
    case "High":
      return "text-red-600";
    case "Medium":
      return "text-amber-600";
    default:
      return "text-slate-500";
  }
}

export default function ProjectDetail() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            type="button"
            className="mb-5 flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Projects
          </button>

          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  ACTIVE PROJECT
                </span>

                <span className="flex items-center gap-1 text-xs text-emerald-600">
                  <CircleDot className="h-3.5 w-3.5" />
                  Healthy
                </span>
              </div>

              <h1 className="text-3xl font-bold tracking-tight">
                DevSync AI Platform
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                AI-powered project management workspace for planning,
                collaboration, standups and engineering intelligence.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold shadow-sm transition hover:border-slate-300 hover:shadow"
              >
                <Settings2 className="h-4 w-4" />
                Settings
              </button>

              <button
                type="button"
                className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >
                <Plus className="h-4 w-4" />
                Add Task
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map(({ name, value, icon: Icon }) => (
            <div
              key={name}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-sm font-medium text-slate-500">
                    {name}
                  </span>

                  <p className="mt-3 text-2xl font-bold tracking-tight">
                    {value}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100">
                  <Icon className="h-5 w-5 text-slate-700" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          {/* Main */}
          <section className="space-y-6">
            {/* Overview */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold">Project Overview</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Current project delivery status
                  </p>
                </div>

                <MoreHorizontal className="h-5 w-5 text-slate-400" />
              </div>

              <div className="grid gap-5 md:grid-cols-3">
                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Target className="h-4 w-4" />
                    Sprint Progress
                  </div>

                  <p className="mt-3 text-2xl font-bold">76%</p>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full w-[76%] rounded-full bg-slate-900" />
                  </div>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <CalendarDays className="h-4 w-4" />
                    Sprint Deadline
                  </div>

                  <p className="mt-3 text-2xl font-bold">6 days</p>
                  <p className="mt-1 text-xs text-slate-400">
                    September 2, 2026
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Code2 className="h-4 w-4" />
                    Code Health
                  </div>

                  <p className="mt-3 text-2xl font-bold">94%</p>
                  <p className="mt-1 text-xs text-emerald-600">
                    Excellent condition
                  </p>
                </div>
              </div>
            </div>

            {/* Tasks */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 p-6">
                <div>
                  <h2 className="text-lg font-bold">Project Tasks</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Track work across the current sprint
                  </p>
                </div>

                <button
                  type="button"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold hover:bg-slate-50"
                >
                  View All
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {tasks.map((task) => (
                  <div
                    key={task.title}
                    className="flex flex-col gap-4 p-5 transition hover:bg-slate-50/70 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex min-w-0 items-start gap-4">
                      <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                        <Code2 className="h-4 w-4 text-slate-600" />
                      </div>

                      <div className="min-w-0">
                        <h3 className="font-semibold">{task.title}</h3>

                        <p className="mt-1 text-sm text-slate-500">
                          {task.description}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                          <span
                            className={`rounded-full border px-2.5 py-1 font-medium ${statusClasses(
                              task.status,
                            )}`}
                          >
                            {task.status}
                          </span>

                          <span
                            className={`font-semibold ${priorityClasses(
                              task.priority,
                            )}`}
                          >
                            {task.priority} priority
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                        {task.assignee}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Team */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="font-bold">Team</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    8 active members
                  </p>
                </div>

                <Users className="h-5 w-5 text-slate-400" />
              </div>

              <div className="space-y-4">
                {[
                  ["AK", "Arjun Kumar", "Lead Developer"],
                  ["DB", "Deepanshu", "AI Engineer"],
                  ["RS", "Riya Sharma", "Frontend"],
                  ["MK", "Mohit Kapoor", "Backend"],
                ].map(([initials, name, role]) => (
                  <div key={name} className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                      {initials}
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{name}</p>
                      <p className="text-xs text-slate-500">{role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Activity */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5">
                <h2 className="font-bold">Recent Activity</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Latest project events
                </p>
              </div>

              <div className="space-y-5">
                {activity.map(({ text, time, icon: Icon }) => (
                  <div key={text} className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                      <Icon className="h-4 w-4 text-slate-600" />
                    </div>

                    <div>
                      <p className="text-sm leading-5 text-slate-700">{text}</p>
                      <p className="mt-1 text-xs text-slate-400">{time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}