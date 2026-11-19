import {
  AlertTriangle,
  BarChart3,
  Calendar,
  CheckCircle2,
  CircleAlert,
  Clock3,
  FolderKanban,
  Layers,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  calculateSprintMetrics,
  calculateUnresolvedBugMetrics,
} from "../features/analytics";
import { useAnalytics } from "../features/analytics/hooks/useAnalytics";

function formatDate(dateString?: string | Date | null): string {
  if (!dateString) return "Not specified";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return String(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(dateString?: string | Date | null): string {
  if (!dateString) return "Just now";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Recently";
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function Analytics() {
  const { data, isLoading, error, activeProject, refresh } = useAnalytics();

  // ─── 1. Empty State: No Active Project ──────────────────────────────────
  if (!activeProject) {
    return (
      <div className="mx-auto max-w-[1400px] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <BarChart3 size={15} />
              <span>Project Intelligence & Analytics</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Engineering Analytics & Velocity
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Operational delivery metrics, iteration progress, and issue categorization.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#0d121f] p-12 text-center text-white">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <FolderKanban size={28} />
          </div>
          <h2 className="mt-4 text-base font-bold">No active project selected</h2>
          <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-slate-400">
            Please select an existing project from the organization selector or create a project
            to view its sprint delivery, iteration velocity, and issue health.
          </p>
        </div>
      </div>
    );
  }

  // Calculate unresolved bug ratio using actual issues
  const unresolvedBugMetrics = calculateUnresolvedBugMetrics(data?.issues ?? []);

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <BarChart3 size={15} />
            <span>Project Intelligence & Analytics</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {activeProject.name}
            </h1>
            {activeProject.key && (
              <span className="rounded-lg bg-slate-800 px-2.5 py-1 text-xs font-mono font-bold text-indigo-300 border border-slate-700">
                {activeProject.key}
              </span>
            )}
            {activeProject.status && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400 border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                {activeProject.status}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time delivery progress, iteration story points, and issue health.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-[#0d121f] border border-slate-800 px-3 py-2 rounded-xl text-xs text-slate-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live Operational Data</span>
            {data?.overview.timestamp && (
              <span className="text-[10px] text-slate-500 hidden sm:inline">
                ({formatTime(data.overview.timestamp)})
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => void refresh()}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
            title="Reload live analytics"
          >
            <RefreshCw
              size={14}
              className={`${isLoading ? "animate-spin" : ""}`}
            />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ─── Error Alert Banner ────────────────────────────────────────── */}
      {error && (
        <div
          role="alert"
          className="flex flex-col justify-between gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200 sm:flex-row sm:items-center"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle size={18} className="shrink-0 text-rose-400" />
            <div>
              <p className="font-semibold text-rose-300">
                Failed to load analytics metrics
              </p>
              <p className="text-xs text-rose-400/90">{error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void refresh()}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-700"
          >
            <RefreshCw size={13} />
            Retry
          </button>
        </div>
      )}

      {/* ─── Multiple Active Sprints Notice ───────────────────────────── */}
      {data?.overview.activeSprint?.hasMultipleActiveSprints && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-200"
        >
          <CircleAlert size={16} className="shrink-0 text-amber-400" />
          <span>
            Multiple sprints are currently active in this project. Sprint KPI metrics
            highlight the most recently started active sprint (
            <strong>{data.overview.activeSprint.name}</strong>).
          </span>
        </div>
      )}

      {/* ─── Loading Skeleton ─────────────────────────────────────────── */}
      {isLoading && !data && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-2xl border border-slate-800 bg-[#0d121f] p-5 space-y-3"
              >
                <div className="h-3 w-28 rounded bg-slate-800" />
                <div className="h-7 w-20 rounded bg-slate-700" />
                <div className="h-2.5 w-32 rounded bg-slate-800" />
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 animate-pulse rounded-2xl border border-slate-800 bg-[#0d121f] p-6 space-y-4">
              <div className="h-4 w-40 rounded bg-slate-700" />
              <div className="h-3 w-64 rounded bg-slate-800" />
              <div className="space-y-3 pt-4">
                <div className="h-10 rounded bg-slate-800" />
                <div className="h-10 rounded bg-slate-800" />
              </div>
            </div>
            <div className="animate-pulse rounded-2xl border border-slate-800 bg-[#0d121f] p-6 space-y-4">
              <div className="h-4 w-32 rounded bg-slate-700" />
              <div className="h-3 w-48 rounded bg-slate-800" />
              <div className="space-y-3 pt-2">
                <div className="h-8 rounded bg-slate-800" />
                <div className="h-8 rounded bg-slate-800" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Live Analytics Content ───────────────────────────────────── */}
      {data && (
        <>
          {/* KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* 1. Active Sprint Completion */}
            <div className="rounded-2xl border border-slate-800 bg-[#0d121f] p-5">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Active Sprint Completion</span>
                <TrendingUp size={16} className="text-emerald-400" />
              </div>
              <p className="mt-3 text-2xl font-bold text-white">
                {data.overview.activeSprint
                  ? `${data.overview.activeSprint.completionPercentage}%`
                  : "No active sprint"}
              </p>
              <p className="mt-1 text-[11px] text-slate-400">
                {data.overview.activeSprint
                  ? `${data.overview.activeSprint.completedTasks} of ${data.overview.activeSprint.totalTasks} tasks completed`
                  : "Start a sprint in Sprint Planner"}
              </p>
            </div>

            {/* 2. Sprint Story Point Delivery */}
            <div className="rounded-2xl border border-slate-800 bg-[#0d121f] p-5">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Story Point Delivery</span>
                <Target size={16} className="text-indigo-400" />
              </div>
              <p className="mt-3 text-2xl font-bold text-white">
                {data.overview.activeSprint
                  ? `${data.overview.activeSprint.completedStoryPoints} / ${data.overview.activeSprint.plannedStoryPoints} pts`
                  : "0 pts"}
              </p>
              <p className="mt-1 text-[11px] text-indigo-300">
                {data.overview.activeSprint
                  ? data.overview.activeSprint.plannedStoryPoints > 0
                    ? `${Math.round(
                        (data.overview.activeSprint.completedStoryPoints /
                          data.overview.activeSprint.plannedStoryPoints) *
                          100,
                      )}% of planned points burned`
                    : "0 points planned"
                  : "No active sprint points"}
              </p>
            </div>

            {/* 3. Issue Resolution */}
            <div className="rounded-2xl border border-slate-800 bg-[#0d121f] p-5">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Issue Resolution</span>
                <CheckCircle2 size={16} className="text-violet-400" />
              </div>
              <p className="mt-3 text-2xl font-bold text-white">
                {data.overview.issues.resolved + data.overview.issues.closed} /{" "}
                {data.overview.issues.total}
              </p>
              <p className="mt-1 text-[11px] text-slate-400">
                {data.overview.issues.total > 0
                  ? `${data.overview.issues.resolved} resolved · ${
                      data.overview.issues.closed
                    } closed (${Math.round(
                      ((data.overview.issues.resolved +
                        data.overview.issues.closed) /
                        data.overview.issues.total) *
                        100,
                    )}%)`
                  : "No issues logged for project"}
              </p>
            </div>

            {/* 4. Unresolved Bug Ratio */}
            <div className="rounded-2xl border border-slate-800 bg-[#0d121f] p-5">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Unresolved Bug Ratio</span>
                <AlertTriangle size={16} className="text-amber-400" />
              </div>
              <p className="mt-3 text-2xl font-bold text-white">
                {unresolvedBugMetrics.percentage}
              </p>
              <p className="mt-1 text-[11px] text-slate-400">
                {unresolvedBugMetrics.hasIssues
                  ? `${unresolvedBugMetrics.count} unresolved bugs across ${data.overview.issues.total} total issues`
                  : "No issues logged for project"}
              </p>
            </div>
          </div>

          {/* ─── Sprint Delivery and Issue Breakdown ───────────────────── */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Sprint Delivery & Iterations */}
            <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-[#0d121f] p-6 text-white space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold">Sprint Delivery & Iterations</h2>
                  <p className="text-xs text-slate-400">
                    Planned vs. Delivered story points and task completion across sprints
                  </p>
                </div>
                <span className="text-[11px] text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
                  {data.sprints.length} Total Iteration{data.sprints.length === 1 ? "" : "s"}
                </span>
              </div>

              {data.sprints.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-800 py-12 text-center">
                  <Calendar size={28} className="mx-auto text-slate-600" />
                  <p className="mt-3 text-sm font-semibold text-slate-300">
                    No sprints created yet for this project
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Plan and start sprints in the Sprint Planner module to monitor iteration delivery.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 pt-2">
                  {data.sprints.map((sprint) => {
                    const metrics = calculateSprintMetrics(sprint);

                    return (
                      <div
                        key={sprint.id}
                        className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-2.5"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white">
                              {sprint.name}
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                                sprint.status === "ACTIVE"
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                  : sprint.status === "COMPLETED"
                                    ? "bg-indigo-500/10 text-indigo-300 border-indigo-500/20"
                                    : sprint.status === "PLANNED"
                                      ? "bg-sky-500/10 text-sky-300 border-sky-500/20"
                                      : "bg-slate-800 text-slate-400 border-slate-700"
                              }`}
                            >
                              {sprint.status}
                            </span>
                          </div>

                          <div className="text-slate-400 text-[11px]">
                            <span>{formatDate(sprint.startDate)} – {formatDate(sprint.endDate)}</span>
                            <span className="mx-1.5">·</span>
                            <span>
                              <strong className="text-indigo-400">
                                {metrics.completedStoryPoints}
                              </strong>{" "}
                              / {metrics.plannedStoryPoints} pts
                            </span>
                            <span className="mx-1.5">·</span>
                            <span>
                              {metrics.completedTasks} / {metrics.totalTasks} tasks
                            </span>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="space-y-1">
                          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
                            <div
                              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-500"
                              style={{ width: `${metrics.completionPercentage}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-500">
                            <span>{metrics.completionPercentage}% complete</span>
                            <span>{metrics.remainingTasks} remaining tasks</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Issue Health & Work Breakdown */}
            <div className="rounded-2xl border border-slate-800 bg-[#0d121f] p-6 text-white space-y-4">
              <h2 className="text-base font-bold">Work Categorization</h2>
              <p className="text-xs text-slate-400">
                Categorization of project tasks and issues
              </p>

              {data.overview.issues.total === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-800 py-12 text-center">
                  <CircleAlert size={28} className="mx-auto text-slate-600" />
                  <p className="mt-3 text-sm font-semibold text-slate-300">
                    No issues reported
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    No bugs or blockers currently filed for this project.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 pt-1">
                  {/* Category Breakdown */}
                  <div className="space-y-2">
                    {[
                      {
                        type: "Bug",
                        count: data.overview.issues.byType.BUG,
                        color: "bg-rose-500",
                      },
                      {
                        type: "Feature",
                        count: data.overview.issues.byType.FEATURE,
                        color: "bg-indigo-500",
                      },
                      {
                        type: "Task",
                        count: data.overview.issues.byType.TASK,
                        color: "bg-sky-500",
                      },
                      {
                        type: "Improvement",
                        count: data.overview.issues.byType.IMPROVEMENT,
                        color: "bg-amber-500",
                      },
                      {
                        type: "Epic",
                        count: data.overview.issues.byType.EPIC,
                        color: "bg-violet-500",
                      },
                    ].map((dist) => {
                      const percentage =
                        data.overview.issues.total > 0
                          ? Math.round(
                              (dist.count / data.overview.issues.total) * 100,
                            )
                          : 0;

                      return (
                        <div
                          key={dist.type}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`h-2.5 w-2.5 rounded-full ${dist.color}`} />
                            <span className="text-xs font-medium text-slate-200">
                              {dist.type}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-slate-400">{dist.count}</span>
                            <span className="font-bold text-white">
                              {percentage}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Priority Breakdown */}
                  <div className="border-t border-slate-800 pt-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Issues By Priority
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-2">
                        <span className="text-[10px] font-semibold text-rose-400">
                          Critical
                        </span>
                        <p className="text-base font-bold text-rose-300">
                          {data.overview.issues.byPriority.CRITICAL}
                        </p>
                      </div>
                      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-2">
                        <span className="text-[10px] font-semibold text-amber-400">
                          High
                        </span>
                        <p className="text-base font-bold text-amber-300">
                          {data.overview.issues.byPriority.HIGH}
                        </p>
                      </div>
                      <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-2">
                        <span className="text-[10px] font-semibold text-indigo-400">
                          Medium
                        </span>
                        <p className="text-base font-bold text-indigo-300">
                          {data.overview.issues.byPriority.MEDIUM}
                        </p>
                      </div>
                      <div className="rounded-lg border border-slate-700 bg-slate-800/40 p-2">
                        <span className="text-[10px] font-semibold text-slate-400">
                          Low
                        </span>
                        <p className="text-base font-bold text-slate-300">
                          {data.overview.issues.byPriority.LOW}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ─── Team & Project Execution Overview ─────────────────────── */}
          <div className="rounded-2xl border border-slate-800 bg-[#0d121f] p-6 text-white space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold flex items-center gap-2">
                  <Users size={18} className="text-indigo-400" />
                  <span>Project Governance & Task Execution Summary</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Operational distribution across workflow statuses and project membership
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span>
                  Team Members:{" "}
                  <strong className="text-white">
                    {data.overview.project.memberCount}
                  </strong>
                </span>
                <span>·</span>
                <span>
                  Created:{" "}
                  <strong className="text-white">
                    {formatDate(data.overview.project.createdAt)}
                  </strong>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                <span className="text-[10px] font-medium text-slate-400">
                  Total Tasks
                </span>
                <p className="mt-1 text-lg font-bold text-white">
                  {data.overview.tasks.total}
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                <span className="text-[10px] font-medium text-slate-400">
                  Completed
                </span>
                <p className="mt-1 text-lg font-bold text-emerald-400">
                  {data.overview.tasks.completed}
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                <span className="text-[10px] font-medium text-slate-400">
                  In Progress
                </span>
                <p className="mt-1 text-lg font-bold text-indigo-400">
                  {data.overview.tasks.inProgress}
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                <span className="text-[10px] font-medium text-slate-400">
                  In Review
                </span>
                <p className="mt-1 text-lg font-bold text-violet-400">
                  {data.overview.tasks.inReview}
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                <span className="text-[10px] font-medium text-slate-400">
                  To Do
                </span>
                <p className="mt-1 text-lg font-bold text-sky-400">
                  {data.overview.tasks.todo}
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                <span className="text-[10px] font-medium text-slate-400">
                  Blocked / Overdue
                </span>
                <p className="mt-1 text-lg font-bold text-rose-400">
                  {data.overview.tasks.blocked + data.overview.tasks.overdue}
                </p>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-800/60">
              Metrics are computed directly from operational database records (Prisma entities).
              Individual engineer throughput rankings and artificial productivity scores are excluded to maintain strict data integrity.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
