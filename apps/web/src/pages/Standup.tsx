import React from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  FileText,
  MessageSquare,
  Mic,
  Sparkles,
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
    name: "Team Updates",
    value: "8",
    icon: Users,
  },
  {
    name: "Completed",
    value: "14",
    icon: CheckCircle2,
  },
  {
    name: "Blockers",
    value: "2",
    icon: AlertCircle,
  },
  {
    name: "AI Summary",
    value: "Ready",
    icon: Sparkles,
  },
];

const updates = [
  {
    initials: "AK",
    name: "Arjun Kumar",
    role: "Lead Developer",
    yesterday:
      "Completed authentication middleware and reviewed the API architecture.",
    today: "Finalize protected routes and begin integration testing.",
    blocker: "Waiting for staging environment credentials.",
  },
  {
    initials: "DB",
    name: "Deepanshu",
    role: "AI Engineer",
    yesterday:
      "Improved sprint recommendation logic and connected project activity data.",
    today: "Implement AI risk scoring and improve recommendations.",
    blocker: "None",
  },
  {
    initials: "RS",
    name: "Riya Sharma",
    role: "Frontend Engineer",
    yesterday:
      "Completed the project dashboard and responsive navigation system.",
    today: "Build the analytics and risk intelligence screens.",
    blocker: "None",
  },
  {
    initials: "MK",
    name: "Mohit Kapoor",
    role: "Backend Engineer",
    yesterday:
      "Optimized database queries and added project activity endpoints.",
    today: "Finish activity aggregation and API caching.",
    blocker: "Database migration pending review.",
  },
];

export default function Standup() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">
              <Sparkles className="h-3.5 w-3.5" />
              AI STANDUP
            </span>

            <span className="text-xs text-slate-400">
              Tuesday · September 1, 2026
            </span>
          </div>

          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Daily Standup
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Collect updates from your team and turn them into an
                intelligent project summary automatically.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold shadow-sm hover:bg-slate-50"
              >
                <Mic className="h-4 w-4" />
                Record Update
              </button>

              <button
                type="button"
                className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
              >
                <Sparkles className="h-4 w-4" />
                Generate Summary
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

                  <p className="mt-3 text-2xl font-bold">{value}</p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100">
                  <Icon className="h-5 w-5 text-slate-700" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          {/* Team Updates */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 p-6">
              <div>
                <h2 className="text-lg font-bold">Team Updates</h2>

                <p className="mt-1 text-sm text-slate-500">
                  Today's engineering standup
                </p>
              </div>

              <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                8 / 8 submitted
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {updates.map((update) => (
                <div key={update.name} className="p-6">
                  <div className="flex gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                      {update.initials}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h3 className="font-semibold">{update.name}</h3>
                          <p className="text-xs text-slate-400">
                            {update.role}
                          </p>
                        </div>

                        <span className="flex items-center gap-1 text-xs text-emerald-600">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Submitted
                        </span>
                      </div>

                      <div className="mt-5 grid gap-4 md:grid-cols-3">
                        <div className="rounded-xl bg-slate-50 p-4">
                          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                            <CheckCircle2 className="h-4 w-4" />
                            Yesterday
                          </div>

                          <p className="mt-3 text-sm leading-6 text-slate-600">
                            {update.yesterday}
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-4">
                          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                            <Target className="h-4 w-4" />
                            Today
                          </div>

                          <p className="mt-3 text-sm leading-6 text-slate-600">
                            {update.today}
                          </p>
                        </div>

                        <div
                          className={`rounded-xl p-4 ${
                            update.blocker === "None"
                              ? "bg-emerald-50"
                              : "bg-red-50"
                          }`}
                        >
                          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                            <AlertCircle className="h-4 w-4" />
                            Blocker
                          </div>

                          <p className="mt-3 text-sm leading-6 text-slate-600">
                            {update.blocker}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* AI Summary */}
          <aside className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>

                <div>
                  <h2 className="font-bold">AI Summary</h2>
                  <p className="text-xs text-slate-400">
                    Generated automatically
                  </p>
                </div>
              </div>

              <p className="mt-6 text-sm leading-6 text-slate-600">
                The team is progressing well on authentication, AI planning
                and dashboard development. Two infrastructure-related
                blockers require attention before the next deployment.
              </p>

              <div className="mt-5 space-y-3">
                <div className="flex gap-3 rounded-xl bg-emerald-50 p-4">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />

                  <p className="text-xs leading-5 text-emerald-800">
                    Overall sprint velocity is healthy.
                  </p>
                </div>

                <div className="flex gap-3 rounded-xl bg-red-50 p-4">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />

                  <p className="text-xs leading-5 text-red-800">
                    Two blockers could affect deployment timing.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-slate-500" />
                <h2 className="font-bold">Standup Health</h2>
              </div>

              <div className="mt-6 space-y-5">
                <div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Participation</span>
                    <span className="font-semibold">100%</span>
                  </div>

                  <div className="mt-2 h-2 rounded-full bg-slate-100">
                    <div className="h-full w-full rounded-full bg-slate-900" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Blocker-free</span>
                    <span className="font-semibold">75%</span>
                  </div>

                  <div className="mt-2 h-2 rounded-full bg-slate-100">
                    <div className="h-full w-[75%] rounded-full bg-slate-900" />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-900 p-6 text-white">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                <h2 className="font-bold">Next Action</h2>
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-300">
                Resolve the staging credentials blocker before the afternoon
                deployment window.
              </p>

              <button
                type="button"
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100"
              >
                <FileText className="h-4 w-4" />
                Create Action Item
              </button>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-500">
              <Clock3 className="h-4 w-4 shrink-0" />
              Standup duration: 7 minutes
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}