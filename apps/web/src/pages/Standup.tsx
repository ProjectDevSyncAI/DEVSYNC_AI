<<<<<<< HEAD
import React, { useCallback, useEffect, useState } from "react";
=======
import React from "react";
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  FileText,
<<<<<<< HEAD
  Loader2,
=======
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
  MessageSquare,
  Mic,
  Sparkles,
  Target,
  Users,
  Zap,
} from "lucide-react";
<<<<<<< HEAD
import { standupApi, organizationApi, projectApi } from "../lib/api";
import type { Project, StandupResponse } from "../lib/api";

/* ─── helpers ─── */

type CurrentUser = {
  id?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
};

function readCurrentUser(): CurrentUser | null {
  try {
    const saved = localStorage.getItem("devsync_user");
    return saved ? (JSON.parse(saved) as CurrentUser) : null;
  } catch {
    return null;
  }
}
=======
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c

type Stat = {
  name: string;
  value: string;
  icon: React.ElementType;
};

<<<<<<< HEAD
/* ─── static demo updates shown alongside AI summary ─── */

const demoUpdates = [
=======
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
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
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
<<<<<<< HEAD
  const currentUser = readCurrentUser();

  /* ── project selection ── */
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");

  /* ── AI generation state ── */
  const [generating, setGenerating] = useState(false);
  const [standupResult, setStandupResult] =
    useState<StandupResponse | null>(null);
  const [error, setError] = useState("");

  /* load projects on mount */
  useEffect(() => {
    (async () => {
      try {
        const orgs = await organizationApi.list();
        if (orgs.length > 0) {
          const projs = await projectApi.list(orgs[0].id);
          setProjects(projs);
          if (projs.length > 0) {
            setSelectedProjectId(projs[0].id);
          }
        }
      } catch {
        // silently continue — no projects available
      }
    })();
  }, []);

  /* ── stats (computed from result) ── */
  const stats: Stat[] = [
    {
      name: "Team Updates",
      value: String(demoUpdates.length),
      icon: Users,
    },
    {
      name: "Completed",
      value: standupResult ? "✓" : "14",
      icon: CheckCircle2,
    },
    {
      name: "Blockers",
      value: String(
        demoUpdates.filter(
          (u) => u.blocker !== "None",
        ).length,
      ),
      icon: AlertCircle,
    },
    {
      name: "AI Summary",
      value: standupResult
        ? "Generated"
        : generating
          ? "Generating…"
          : "Ready",
      icon: Sparkles,
    },
  ];

  /* ── generate handler ── */
  const handleGenerate = useCallback(async () => {
    if (!currentUser?.id) {
      setError(
        "You must be logged in to generate a standup summary.",
      );
      return;
    }

    setGenerating(true);
    setError("");
    setStandupResult(null);

    try {
      const result = await standupApi.generate({
        userId: currentUser.id,
        projectId: selectedProjectId || undefined,
        date: new Date().toISOString().split("T")[0],
      });

      setStandupResult(result);
    } catch (err: any) {
      setError(
        err?.message || "Failed to generate standup summary.",
      );
    } finally {
      setGenerating(false);
    }
  }, [currentUser?.id, selectedProjectId]);

  const todayString = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

=======
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
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
<<<<<<< HEAD
              {todayString}
=======
              Tuesday · September 1, 2026
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
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

<<<<<<< HEAD
            <div className="flex flex-wrap items-center gap-3">
              {/* Project selector */}
              {projects.length > 0 && (
                <select
                  value={selectedProjectId}
                  onChange={(e) =>
                    setSelectedProjectId(e.target.value)
                  }
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium shadow-sm"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              )}

=======
            <div className="flex flex-wrap gap-3">
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
              <button
                type="button"
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold shadow-sm hover:bg-slate-50"
              >
                <Mic className="h-4 w-4" />
                Record Update
              </button>

              <button
                type="button"
<<<<<<< HEAD
                disabled={generating}
                onClick={handleGenerate}
                className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {generating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {generating
                  ? "Generating…"
                  : "Generate Summary"}
=======
                className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
              >
                <Sparkles className="h-4 w-4" />
                Generate Summary
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
              </button>
            </div>
          </div>
        </div>

<<<<<<< HEAD
        {/* Error banner */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.name}
              className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100">
                <stat.icon className="h-5 w-5 text-slate-600" />
              </div>

              <div>
                <p className="text-xs font-medium text-slate-500">
                  {stat.name}
                </p>
                <p className="mt-0.5 text-xl font-bold">
                  {stat.value}
                </p>
=======
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
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
              </div>
            </div>
          ))}
        </div>

<<<<<<< HEAD
        {/* Body — two-column layout */}
        <div className="grid gap-8 xl:grid-cols-[1fr_380px]">
          {/* Team updates */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold">Team Updates</h2>

            <div className="space-y-4">
              {demoUpdates.map((update) => (
                <div
                  key={update.name}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                      {update.initials}
                    </div>

                    <div>
                      <p className="font-semibold">
                        {update.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {update.role}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3 text-sm text-slate-600">
                    <div className="flex gap-3">
                      <span className="mt-0.5 shrink-0 text-xs font-bold text-slate-400">
                        YESTERDAY
                      </span>
                      <p className="leading-5">
                        {update.yesterday}
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <span className="mt-0.5 shrink-0 text-xs font-bold text-blue-400">
                        TODAY
                      </span>
                      <p className="leading-5">{update.today}</p>
                    </div>

                    {update.blocker !== "None" && (
                      <div className="flex gap-3">
                        <span className="mt-0.5 shrink-0 text-xs font-bold text-red-400">
                          BLOCKER
                        </span>
                        <p className="leading-5">
                          {update.blocker}
                        </p>
                      </div>
                    )}
=======
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
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
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
<<<<<<< HEAD
                    {standupResult
                      ? `Generated for ${standupResult.date}`
                      : "Click Generate Summary to create"}
=======
                    Generated automatically
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
                  </p>
                </div>
              </div>

<<<<<<< HEAD
              {/* Loading state */}
              {generating && (
                <div className="mt-6 flex items-center gap-3 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating AI standup summary…
                </div>
              )}

              {/* AI-generated standup content */}
              {standupResult && !generating && (
                <div className="mt-6 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                  {standupResult.standup}
                </div>
              )}

              {/* Default placeholder when nothing generated */}
              {!standupResult && !generating && (
                <>
                  <p className="mt-6 text-sm leading-6 text-slate-600">
                    The team is progressing well on authentication, AI
                    planning and dashboard development. Two
                    infrastructure-related blockers require attention
                    before the next deployment.
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
                </>
              )}
=======
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
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-slate-500" />
                <h2 className="font-bold">Standup Health</h2>
              </div>

              <div className="mt-6 space-y-5">
                <div>
                  <div className="flex justify-between text-sm">
<<<<<<< HEAD
                    <span className="text-slate-500">
                      Participation
                    </span>
=======
                    <span className="text-slate-500">Participation</span>
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
                    <span className="font-semibold">100%</span>
                  </div>

                  <div className="mt-2 h-2 rounded-full bg-slate-100">
                    <div className="h-full w-full rounded-full bg-slate-900" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm">
<<<<<<< HEAD
                    <span className="text-slate-500">
                      Blocker-free
                    </span>
=======
                    <span className="text-slate-500">Blocker-free</span>
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
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
<<<<<<< HEAD
                {standupResult
                  ? "Review the generated standup and share it with your team."
                  : "Resolve the staging credentials blocker before the afternoon deployment window."}
=======
                Resolve the staging credentials blocker before the afternoon
                deployment window.
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
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
<<<<<<< HEAD
              {standupResult
                ? `Summary generated on ${standupResult.date}`
                : "Standup duration: 7 minutes"}
=======
              Standup duration: 7 minutes
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}