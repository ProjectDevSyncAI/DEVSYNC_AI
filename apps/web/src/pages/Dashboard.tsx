<<<<<<< HEAD
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Clock3,
  FolderKanban,
  Layers,
  RefreshCw,
  Sparkles,
  Target,
  Users,
  Zap,
} from "lucide-react";
import { useDashboard } from "../features/dashboard/hooks/useDashboard";
import { useProjectStore } from "../store/project.store";
=======

import { useMemo, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Clock3,
  Code2,
  FolderKanban,
  MoreHorizontal,
  Plus,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

type ProjectStatus = "On track" | "At risk" | "Completed";

type Project = {
  id: number;
  name: string;
  description: string;
  category: string;
  progress: number;
  status: ProjectStatus;
  members: string[];
  dueDate: string;
  color: string;
};

type Task = {
  id: number;
  title: string;
  project: string;
  priority: "High" | "Medium" | "Low";
  status: "In progress" | "To do" | "Review";
  due: string;
};

const initialProjects: Project[] = [
  {
    id: 1,
    name: "DevSync AI Platform",
    description: "AI-powered development workspace",
    category: "Web application",
    progress: 76,
    status: "On track",
    members: ["DM", "AS", "RK"],
    dueDate: "Nov 08",
    color: "indigo",
  },
  {
    id: 2,
    name: "Analytics Engine",
    description: "Project insights and reporting",
    category: "AI & Analytics",
    progress: 48,
    status: "At risk",
    members: ["AS", "PK"],
    dueDate: "Nov 12",
    color: "violet",
  },
  {
    id: 3,
    name: "API Integration",
    description: "Backend services and authentication",
    category: "Backend",
    progress: 91,
    status: "On track",
    members: ["DM", "RK", "SK"],
    dueDate: "Nov 04",
    color: "cyan",
  },
  {
    id: 4,
    name: "UI Design System",
    description: "Reusable interface components",
    category: "Frontend",
    progress: 100,
    status: "Completed",
    members: ["PK", "SK"],
    dueDate: "Oct 24",
    color: "emerald",
  },
];

const initialTasks: Task[] = [
  {
    id: 1,
    title: "Finalize dashboard components",
    project: "DevSync AI Platform",
    priority: "High",
    status: "In progress",
    due: "Today",
  },
  {
    id: 2,
    title: "Review authentication API",
    project: "API Integration",
    priority: "High",
    status: "Review",
    due: "Today",
  },
  {
    id: 3,
    title: "Improve analytics visualizations",
    project: "Analytics Engine",
    priority: "Medium",
    status: "To do",
    due: "Tomorrow",
  },
  {
    id: 4,
    title: "Update component documentation",
    project: "UI Design System",
    priority: "Low",
    status: "In progress",
    due: "Oct 30",
  },
];

const weeklyActivity = [
  { day: "Mon", completed: 5, created: 3 },
  { day: "Tue", completed: 8, created: 5 },
  { day: "Wed", completed: 6, created: 4 },
  { day: "Thu", completed: 10, created: 6 },
  { day: "Fri", completed: 7, created: 3 },
  { day: "Sat", completed: 4, created: 2 },
  { day: "Sun", completed: 8, created: 4 },
];

const colorStyles: Record<
  string,
  { icon: string; bar: string; soft: string }
> = {
  indigo: {
    icon: "bg-indigo-100 text-indigo-700",
    bar: "bg-indigo-500",
    soft: "from-indigo-500/10 to-indigo-500/[0.02]",
  },
  violet: {
    icon: "bg-violet-100 text-violet-700",
    bar: "bg-violet-500",
    soft: "from-violet-500/10 to-violet-500/[0.02]",
  },
  cyan: {
    icon: "bg-cyan-100 text-cyan-700",
    bar: "bg-cyan-500",
    soft: "from-cyan-500/10 to-cyan-500/[0.02]",
  },
  emerald: {
    icon: "bg-emerald-100 text-emerald-700",
    bar: "bg-emerald-500",
    soft: "from-emerald-500/10 to-emerald-500/[0.02]",
  },
};
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-slate-200/80 bg-white shadow-sm ${className}`}
    >
      {children}
    </section>
  );
}

function SectionHeading({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex items-center justify-between gap-3">
      <div>
        <h2 className="text-sm font-bold text-slate-900">{title}</h2>
        {subtitle && (
          <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}

<<<<<<< HEAD
=======
function StatusBadge({ status }: { status: ProjectStatus }) {
  const styles: Record<ProjectStatus, string> = {
    "On track": "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
    "At risk": "bg-amber-50 text-amber-700 ring-amber-600/15",
    Completed: "bg-blue-50 text-blue-700 ring-blue-600/15",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 ring-inset ${styles[status]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
function ProgressBar({
  value,
  color = "bg-indigo-500",
}: {
  value: number;
  color?: string;
}) {
<<<<<<< HEAD
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div
      className="h-2 overflow-hidden rounded-full bg-slate-100"
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${clamped}% complete`}
    >
      <div
        className={`h-full rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${clamped}%` }}
=======
  return (
    <div
      className="h-1.5 overflow-hidden rounded-full bg-slate-100"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${value}% complete`}
    >
      <div
        className={`h-full rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${value}%` }}
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
      />
    </div>
  );
}

<<<<<<< HEAD
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

function formatDateTime(dateString?: string | Date | null): string {
  if (!dateString) return "Just now";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Recently";
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function Dashboard() {
  const { activeProject } = useProjectStore();
  const { data, isLoading, error, refresh } = useDashboard(activeProject?.id);

  // ─── 1. Empty State: No Active Project Selected ─────────────────────────
  if (!activeProject) {
    return (
      <div className="mx-auto max-w-[1600px] space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600">
              <Sparkles size={14} />
              YOUR WORKSPACE
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Project Dashboard
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Select an active project to view real-time operational metrics.
            </p>
          </div>
        </div>

        <Card className="p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <FolderKanban size={28} />
          </div>
          <h2 className="mt-4 text-base font-bold text-slate-900">
            No active project selected
          </h2>
          <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-slate-500">
            Please select an existing project from the organization selector or
            create a project to monitor tasks, issues, and active sprint health.
          </p>
        </Card>
      </div>
=======
export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [taskFilter, setTaskFilter] = useState("All");
  const [projectSearch, setProjectSearch] = useState("");
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [notice, setNotice] = useState("");

  const filteredProjects = useMemo(
    () =>
      projects.filter((project) =>
        `${project.name} ${project.description} ${project.category}`
          .toLowerCase()
          .includes(projectSearch.toLowerCase()),
      ),
    [projects, projectSearch],
  );

  const filteredTasks = useMemo(
    () =>
      tasks.filter((task) => {
        if (taskFilter === "All") return true;
        return task.status === taskFilter;
      }),
    [tasks, taskFilter],
  );

  const completedProjects = projects.filter(
    (project) => project.status === "Completed",
  ).length;

  const activeProjects = projects.filter(
    (project) => project.status !== "Completed",
  ).length;

  const completedTasks = tasks.filter(
    (task) => task.status === "Review",
  ).length;

  function createProject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = newProjectName.trim();
    if (!name) return;

    const project: Project = {
      id: Date.now(),
      name,
      description: newProjectDescription.trim() || "New workspace project",
      category: "New project",
      progress: 0,
      status: "On track",
      members: ["DM"],
      dueDate: "Not set",
      color: "indigo",
    };

    setProjects((current) => [project, ...current]);
    setNewProjectName("");
    setNewProjectDescription("");
    setShowCreateProject(false);
    setNotice(`"${name}" was added to this dashboard.`);
  }

  function updateTaskStatus(taskId: number) {
    setTasks((current) =>
      current.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status:
                task.status === "To do"
                  ? "In progress"
                  : task.status === "In progress"
                    ? "Review"
                    : "To do",
            }
          : task,
      ),
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
    );
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
<<<<<<< HEAD
      {/* ─── Header ──────────────────────────────────────────────────────── */}
=======
      {/* Welcome header */}
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600">
            <Sparkles size={14} />
<<<<<<< HEAD
            LIVE PROJECT DASHBOARD
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              {activeProject.name}
            </h1>
            {activeProject.key && (
              <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                {activeProject.key}
              </span>
            )}
            {activeProject.status && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {activeProject.status}
              </span>
            )}
          </div>
          <p className="mt-2 text-sm text-slate-500">
            {activeProject.description ||
              "Real-time operational overview aggregated from live database entities."}
=======
            YOUR WORKSPACE
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            Good to see you again
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Here’s what’s happening across your development workspace.
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-600 shadow-sm">
            <CalendarDays size={15} className="text-slate-400" />
            <span>
              {new Date().toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>

          <button
            type="button"
<<<<<<< HEAD
            onClick={() => void refresh()}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
            title="Reload live metrics"
          >
            <RefreshCw
              size={15}
              className={`text-slate-500 ${isLoading ? "animate-spin" : ""}`}
            />
            <span>Refresh</span>
=======
            onClick={() => setShowCreateProject(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-700"
          >
            <Plus size={16} />
            New project
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
          </button>
        </div>
      </div>

<<<<<<< HEAD
      {/* ─── Error Alert Banner ────────────────────────────────────────── */}
      {error && (
        <div
          role="alert"
          className="flex flex-col justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 sm:flex-row sm:items-center"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle size={18} className="shrink-0 text-rose-600" />
            <div>
              <p className="font-semibold text-rose-900">
                Failed to load dashboard metrics
              </p>
              <p className="text-xs text-rose-700">{error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void refresh()}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-700"
          >
            <RefreshCw size={13} />
            Retry
=======
      {notice && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 size={17} />
            {notice}
          </span>
          <button
            type="button"
            onClick={() => setNotice("")}
            className="text-xs font-semibold hover:underline"
          >
            Dismiss
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
          </button>
        </div>
      )}

<<<<<<< HEAD
      {/* ─── Multiple Active Sprints Notice ───────────────────────────── */}
      {data?.activeSprint?.hasMultipleActiveSprints && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800"
        >
          <CircleAlert size={16} className="shrink-0 text-amber-600" />
          <span>
            Multiple sprints are currently active in this project. Showing
            metrics for the most recently started active sprint (
            <strong>{data.activeSprint.name}</strong>).
          </span>
        </div>
      )}

      {/* ─── Loading Skeleton ─────────────────────────────────────────── */}
      {isLoading && !data && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((idx) => (
              <Card key={idx} className="animate-pulse p-5">
                <div className="h-10 w-10 rounded-xl bg-slate-100" />
                <div className="mt-4 h-3 w-20 rounded bg-slate-100" />
                <div className="mt-2 h-7 w-14 rounded bg-slate-200" />
                <div className="mt-2 h-2.5 w-28 rounded bg-slate-100" />
              </Card>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
            <Card className="animate-pulse p-6 xl:col-span-2">
              <div className="h-4 w-32 rounded bg-slate-200" />
              <div className="mt-2 h-3 w-48 rounded bg-slate-100" />
              <div className="mt-8 space-y-4">
                <div className="h-8 rounded bg-slate-100" />
                <div className="h-8 rounded bg-slate-100" />
                <div className="h-8 rounded bg-slate-100" />
              </div>
            </Card>
            <Card className="animate-pulse p-6">
              <div className="h-4 w-32 rounded bg-slate-200" />
              <div className="mt-2 h-3 w-48 rounded bg-slate-100" />
              <div className="mt-8 space-y-4">
                <div className="h-10 rounded bg-slate-100" />
                <div className="h-10 rounded bg-slate-100" />
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ─── Live Dashboard Content ───────────────────────────────────── */}
      {data && (
        <>
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {/* 1. Total Tasks */}
            <Card className="p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <CheckCircle2 size={21} />
                </div>
                <span className="flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-500">
                  <Activity size={12} />
                  Operational
                </span>
              </div>
              <p className="mt-5 text-xs font-medium text-slate-500">
                Total Tasks
              </p>
              <div className="mt-1 flex items-end justify-between gap-2">
                <p className="text-3xl font-bold tracking-tight text-slate-950">
                  {data.tasks.total}
                </p>
                <span className="pb-1 text-[11px] text-slate-500">
                  {data.tasks.completed} completed
                </span>
              </div>
              <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-400">
                <span>{data.tasks.inProgress} in progress</span>
                <span>·</span>
                <span>{data.tasks.todo} to do</span>
              </div>
            </Card>

            {/* 2. Overdue Tasks */}
            <Card className="p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                    data.tasks.overdue > 0
                      ? "bg-rose-50 text-rose-600"
                      : "bg-emerald-50 text-emerald-600"
                  }`}
                >
                  <Clock3 size={21} />
                </div>
                <span
                  className={`flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium ${
                    data.tasks.overdue > 0
                      ? "bg-rose-50 text-rose-700 font-semibold"
                      : "bg-slate-50 text-slate-500"
                  }`}
                >
                  {data.tasks.overdue > 0 ? "Requires action" : "On schedule"}
                </span>
              </div>
              <p className="mt-5 text-xs font-medium text-slate-500">
                Overdue Tasks
              </p>
              <div className="mt-1 flex items-end justify-between gap-2">
                <p
                  className={`text-3xl font-bold tracking-tight ${
                    data.tasks.overdue > 0 ? "text-rose-600" : "text-slate-950"
                  }`}
                >
                  {data.tasks.overdue}
                </p>
                <span className="pb-1 text-[11px] text-slate-500">
                  past due date
                </span>
              </div>
              <div className="mt-3 text-[10px] text-slate-400">
                {data.tasks.overdue > 0
                  ? "Tasks due before now, excluding completed"
                  : "No overdue tasks currently pending"}
              </div>
            </Card>

            {/* 3. Active Issues */}
            <Card className="p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <CircleAlert size={21} />
                </div>
                <span className="flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-500">
                  {data.issues.byPriority.CRITICAL > 0
                    ? `${data.issues.byPriority.CRITICAL} Critical`
                    : "No critical bugs"}
                </span>
              </div>
              <p className="mt-5 text-xs font-medium text-slate-500">
                Active Issues
              </p>
              <div className="mt-1 flex items-end justify-between gap-2">
                <p className="text-3xl font-bold tracking-tight text-slate-950">
                  {data.issues.open + data.issues.inProgress}
                </p>
                <span className="pb-1 text-[11px] text-slate-500">
                  of {data.issues.total} total
                </span>
              </div>
              <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-400">
                <span>{data.issues.resolved + data.issues.closed} resolved</span>
                <span>·</span>
                <span>{data.issues.reopened} reopened</span>
              </div>
            </Card>

            {/* 4. Active Sprint */}
            <Card className="p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                  <Target size={21} />
                </div>
                <span className="flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-500">
                  {data.activeSprint ? "Active" : "No Sprint"}
                </span>
              </div>
              <p className="mt-5 text-xs font-medium text-slate-500">
                Sprint Progress
              </p>
              <div className="mt-1 flex items-end justify-between gap-2">
                <p className="text-3xl font-bold tracking-tight text-slate-950">
                  {data.activeSprint
                    ? `${data.activeSprint.completionPercentage}%`
                    : "—"}
                </p>
                <span className="pb-1 text-[11px] text-slate-500">
                  {data.activeSprint
                    ? `${data.activeSprint.completedTasks}/${data.activeSprint.totalTasks} tasks`
                    : "No active sprint"}
                </span>
              </div>
              <div className="mt-3 truncate text-[10px] text-slate-400">
                {data.activeSprint
                  ? data.activeSprint.name
                  : "Start a sprint in Sprint Planner"}
              </div>
            </Card>
          </div>

          {/* Project Details Banner */}
          <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-950 via-indigo-950 to-violet-950 p-5 text-white sm:p-7">
            <div className="absolute -right-10 -top-24 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
            <div className="absolute bottom-[-90px] right-1/3 h-52 w-52 rounded-full bg-violet-500/20 blur-3xl" />

            <div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-semibold tracking-wide text-indigo-100">
                  <Layers size={14} />
                  PROJECT SPECIFICATION
                  <span className="rounded bg-white/15 px-1.5 py-0.5">
                    {data.project.key}
                  </span>
                </div>
                <h2 className="mt-4 text-xl font-bold tracking-tight sm:text-2xl">
                  {data.project.name}
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-indigo-100/75">
                  {data.project.description ||
                    "No project description provided. Update project settings to add mission details."}
                </p>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-4 rounded-xl border border-white/10 bg-white/[0.07] p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-400/20 text-indigo-200">
                    <Users size={22} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-indigo-100/70">
                      Team Members
                    </p>
                    <p className="mt-1 text-2xl font-bold">
                      {data.project.memberCount}
                    </p>
                  </div>
                </div>

                <div className="hidden h-10 w-px bg-white/10 sm:block" />

                <div>
                  <p className="text-[10px] text-indigo-100/60">Created</p>
                  <p className="mt-1 text-xs font-semibold">
                    {formatDate(data.project.createdAt)}
                  </p>
                </div>

                <div className="hidden h-10 w-px bg-white/10 sm:block" />

                <div>
                  <p className="text-[10px] text-indigo-100/60">Status</p>
                  <p className="mt-1 text-xs font-semibold">
                    {data.project.status}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ─── Task & Issue Breakdown Grid ──────────────────────────── */}
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
            {/* Task Status Breakdown */}
            <Card className="p-5 sm:p-6 xl:col-span-2">
              <SectionHeading
                title="Task Distribution"
                subtitle={`${data.tasks.total} operational tasks categorized across workflow statuses`}
              />

              {data.tasks.total === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 py-12 text-center">
                  <CheckCircle2
                    size={28}
                    className="mx-auto text-slate-300"
                  />
                  <p className="mt-3 text-sm font-semibold text-slate-700">
                    No tasks created yet
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Add tasks in the Task Board to start tracking project work.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {[
                    {
                      label: "Completed (DONE)",
                      count: data.tasks.completed,
                      color: "bg-emerald-500",
                      barColor: "bg-emerald-500",
                      badge: "bg-emerald-50 text-emerald-700",
                    },
                    {
                      label: "In Progress",
                      count: data.tasks.inProgress,
                      color: "bg-indigo-500",
                      barColor: "bg-indigo-500",
                      badge: "bg-indigo-50 text-indigo-700",
                    },
                    {
                      label: "In Review",
                      count: data.tasks.inReview,
                      color: "bg-violet-500",
                      barColor: "bg-violet-500",
                      badge: "bg-violet-50 text-violet-700",
                    },
                    {
                      label: "To Do",
                      count: data.tasks.todo,
                      color: "bg-sky-500",
                      barColor: "bg-sky-500",
                      badge: "bg-sky-50 text-sky-700",
                    },
                    {
                      label: "Blocked",
                      count: data.tasks.blocked,
                      color: "bg-amber-500",
                      barColor: "bg-amber-500",
                      badge: "bg-amber-50 text-amber-700",
                    },
                    {
                      label: "Cancelled",
                      count: data.tasks.cancelled,
                      color: "bg-slate-400",
                      barColor: "bg-slate-400",
                      badge: "bg-slate-100 text-slate-600",
                    },
                  ].map((item) => {
                    const percentage =
                      data.tasks.total > 0
                        ? Math.round((item.count / data.tasks.total) * 100)
                        : 0;

                    return (
                      <div key={item.label} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-2 font-medium text-slate-700">
                            <span
                              className={`h-2.5 w-2.5 rounded-sm ${item.color}`}
                            />
                            {item.label}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">
                              {item.count}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              ({percentage}%)
                            </span>
                          </div>
                        </div>
                        <ProgressBar
                          value={percentage}
                          color={item.barColor}
                        />
                      </div>
                    );
                  })}

                  {data.tasks.overdue > 0 && (
                    <div className="mt-4 flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50/70 px-4 py-2.5 text-xs text-rose-800">
                      <span className="flex items-center gap-2 font-semibold">
                        <Clock3 size={14} className="text-rose-600" />
                        Overdue Tasks
                      </span>
                      <span className="rounded-md bg-rose-600 px-2 py-0.5 text-[11px] font-bold text-white">
                        {data.tasks.overdue} tasks
                      </span>
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* Issue Status & Priority Overview */}
            <Card className="p-5 sm:p-6">
              <SectionHeading
                title="Issue Status & Health"
                subtitle={`${data.issues.total} total logged issues`}
              />

              {data.issues.total === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 py-12 text-center">
                  <CircleAlert
                    size={28}
                    className="mx-auto text-slate-300"
                  />
                  <p className="mt-3 text-sm font-semibold text-slate-700">
                    No issues reported
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Great news! No bugs or blockers have been filed for this
                    project.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Status distribution */}
                  <div>
                    <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                      Status Distribution
                    </h3>
                    <div className="space-y-2">
                      {[
                        { label: "Open", count: data.issues.open, color: "text-blue-700 bg-blue-50" },
                        { label: "In Progress", count: data.issues.inProgress, color: "text-violet-700 bg-violet-50" },
                        { label: "Resolved", count: data.issues.resolved, color: "text-emerald-700 bg-emerald-50" },
                        { label: "Closed", count: data.issues.closed, color: "text-slate-600 bg-slate-100" },
                        { label: "Reopened", count: data.issues.reopened, color: "text-amber-700 bg-amber-50" },
                      ].map((s) => (
                        <div
                          key={s.label}
                          className="flex items-center justify-between text-xs"
                        >
                          <span className="text-slate-600">{s.label}</span>
                          <span
                            className={`rounded px-2 py-0.5 text-[10px] font-semibold ${s.color}`}
                          >
                            {s.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Priority distribution */}
                  <div className="border-t border-slate-100 pt-4">
                    <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                      By Priority
                    </h3>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-2.5">
                        <span className="text-[10px] font-semibold text-rose-700">
                          CRITICAL
                        </span>
                        <p className="mt-1 text-lg font-bold text-rose-900">
                          {data.issues.byPriority.CRITICAL}
                        </p>
                      </div>
                      <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-2.5">
                        <span className="text-[10px] font-semibold text-amber-700">
                          HIGH
                        </span>
                        <p className="mt-1 text-lg font-bold text-amber-900">
                          {data.issues.byPriority.HIGH}
                        </p>
                      </div>
                      <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-2.5">
                        <span className="text-[10px] font-semibold text-indigo-700">
                          MEDIUM
                        </span>
                        <p className="mt-1 text-lg font-bold text-indigo-900">
                          {data.issues.byPriority.MEDIUM}
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5">
                        <span className="text-[10px] font-semibold text-slate-600">
                          LOW
                        </span>
                        <p className="mt-1 text-lg font-bold text-slate-900">
                          {data.issues.byPriority.LOW}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Type distribution */}
                  <div className="border-t border-slate-100 pt-4">
                    <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                      By Category
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { label: "Bug", count: data.issues.byType.BUG },
                        { label: "Feature", count: data.issues.byType.FEATURE },
                        { label: "Task", count: data.issues.byType.TASK },
                        { label: "Improvement", count: data.issues.byType.IMPROVEMENT },
                        { label: "Epic", count: data.issues.byType.EPIC },
                      ]
                        .filter((t) => t.count > 0)
                        .map((t) => (
                          <span
                            key={t.label}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-700"
                          >
                            <span>{t.label}:</span>
                            <span className="font-bold text-indigo-600">
                              {t.count}
                            </span>
                          </span>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* ─── Active Sprint Section ─────────────────────────────────── */}
          <Card className="p-5 sm:p-6">
            <SectionHeading
              title="Active Sprint Overview"
              subtitle={
                data.activeSprint
                  ? `Sprint tracking for ${data.activeSprint.name}`
                  : "No sprint is currently in progress for this project"
              }
            />

            {data.activeSprint ? (
              <div className="space-y-6">
                <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-indigo-50/30 p-4 sm:flex-row sm:items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <Target size={18} className="text-indigo-600" />
                      <h3 className="text-base font-bold text-slate-900">
                        {data.activeSprint.name}
                      </h3>
                      <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                        Active
                      </span>
                    </div>
                    {data.activeSprint.goal && (
                      <p className="mt-1 text-xs text-slate-600">
                        <strong>Goal:</strong> {data.activeSprint.goal}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <div>
                      <span className="block text-[10px] text-slate-400">
                        Timeline
                      </span>
                      <span className="font-medium text-slate-700">
                        {formatDate(data.activeSprint.startDate)} –{" "}
                        {formatDate(data.activeSprint.endDate)}
                      </span>
                    </div>
                    {data.activeSprint.capacity && (
                      <div>
                        <span className="block text-[10px] text-slate-400">
                          Capacity
                        </span>
                        <span className="font-medium text-slate-700">
                          {data.activeSprint.capacity} pts
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="mb-2 flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-600">Sprint Completion</span>
                    <span className="text-indigo-600">
                      {data.activeSprint.completionPercentage}%
                    </span>
                  </div>
                  <ProgressBar
                    value={data.activeSprint.completionPercentage}
                    color="bg-indigo-600"
                  />
                </div>

                {/* Sprint Metrics Grid */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                    <p className="text-[10px] font-medium text-slate-400">
                      Total Tasks
                    </p>
                    <p className="mt-1 text-xl font-bold text-slate-900">
                      {data.activeSprint.totalTasks}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                    <p className="text-[10px] font-medium text-slate-400">
                      Completed Tasks
                    </p>
                    <p className="mt-1 text-xl font-bold text-emerald-600">
                      {data.activeSprint.completedTasks}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                    <p className="text-[10px] font-medium text-slate-400">
                      Remaining Tasks
                    </p>
                    <p className="mt-1 text-xl font-bold text-amber-600">
                      {data.activeSprint.remainingTasks}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                    <p className="text-[10px] font-medium text-slate-400">
                      Story Points
                    </p>
                    <p className="mt-1 text-xl font-bold text-indigo-600">
                      {data.activeSprint.completedStoryPoints} /{" "}
                      {data.activeSprint.plannedStoryPoints}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 py-10 text-center">
                <Target size={28} className="mx-auto text-slate-300" />
                <p className="mt-3 text-sm font-semibold text-slate-700">
                  No active sprint running
                </p>
                <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">
                  Plan and activate a sprint from the Sprint Planner module to
                  track tasks, velocity, and story point burn rate.
                </p>
              </div>
            )}
          </Card>

          {/* ─── Footer Freshness Note ─────────────────────────────────── */}
          <div className="flex flex-col gap-2 border-t border-slate-200/80 py-4 text-[10px] text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <span className="flex items-center gap-2">
              <Zap size={13} className="text-indigo-500" />
              Live operational metrics — aggregated from Prisma entities
            </span>
            <span className="flex items-center gap-1.5">
              <Clock3 size={12} />
              Refreshed at {formatDateTime(data.timestamp)}
            </span>
          </div>
        </>
=======
      {/* AI banner */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-950 via-indigo-950 to-violet-950 p-5 text-white sm:p-7">
        <div className="absolute -right-10 -top-24 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute bottom-[-90px] right-1/3 h-52 w-52 rounded-full bg-violet-500/20 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-semibold tracking-wide text-indigo-100">
              <BrainCircuit size={14} />
              DEVSYNC AI
              <span className="rounded bg-white/15 px-1.5 py-0.5">WORKSPACE</span>
            </div>
            <h2 className="mt-4 text-xl font-bold tracking-tight sm:text-2xl">
              Build better. Ship smarter.
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-indigo-100/75">
              Keep projects organized, focus on the next task, and make your
              development workflow easier to manage.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3 rounded-xl border border-white/10 bg-white/[0.07] p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-400/20 text-indigo-200">
              <Zap size={22} />
            </div>
            <div>
              <p className="text-xs font-medium text-indigo-100/70">
                Project completion
              </p>
              <p className="mt-1 text-2xl font-bold">
                {projects.length
                  ? Math.round(
                      projects.reduce((sum, project) => sum + project.progress, 0) /
                        projects.length,
                    )
                  : 0}
                %
              </p>
            </div>
            <div className="ml-2 hidden h-10 w-px bg-white/10 sm:block" />
            <div className="hidden sm:block">
              <p className="text-[10px] text-indigo-100/60">Projects</p>
              <p className="mt-1 text-sm font-bold">{projects.length}</p>
            </div>
          </div>
        </div>
      </section>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Total projects",
            value: projects.length,
            note: `${activeProjects} active`,
            icon: FolderKanban,
            color: "bg-indigo-50 text-indigo-600",
            trend: "Workspace",
            trendIcon: ArrowUpRight,
          },
          {
            label: "Tasks to review",
            value: completedTasks,
            note: "Awaiting review",
            icon: CheckCircle2,
            color: "bg-emerald-50 text-emerald-600",
            trend: "Task status",
            trendIcon: ArrowUpRight,
          },
          {
            label: "Projects at risk",
            value: projects.filter((project) => project.status === "At risk")
              .length,
            note: "Need attention",
            icon: CircleAlert,
            color: "bg-amber-50 text-amber-600",
            trend: "Project health",
            trendIcon: ArrowDownRight,
          },
          {
            label: "Tracked tasks",
            value: tasks.length,
            note: `${tasks.filter((task) => task.status === "In progress").length} in progress`,
            icon: Target,
            color: "bg-violet-50 text-violet-600",
            trend: "Task overview",
            trendIcon: Activity,
          },
        ].map((metric) => {
          const Icon = metric.icon;
          const TrendIcon = metric.trendIcon;

          return (
            <Card
              key={metric.label}
              className="p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${metric.color}`}
                >
                  <Icon size={21} />
                </div>
                <span className="flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-500">
                  <TrendIcon size={12} />
                  {metric.trend}
                </span>
              </div>
              <p className="mt-5 text-xs font-medium text-slate-500">
                {metric.label}
              </p>
              <div className="mt-1 flex items-end justify-between gap-2">
                <p className="text-3xl font-bold tracking-tight text-slate-950">
                  {metric.value}
                </p>
                <span className="pb-1 text-[11px] text-slate-500">
                  {metric.note}
                </span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Activity chart and task summary */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Card className="p-5 sm:p-6 xl:col-span-2">
          <SectionHeading
            title="Workspace activity"
            subtitle="Illustrative weekly activity"
            action={
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-2 text-[10px] font-semibold text-slate-600">
                This week
                <ChevronDown size={13} />
              </span>
            }
          />

          <div className="mb-5 flex flex-wrap gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="h-2.5 w-2.5 rounded-sm bg-indigo-500" />
              Tasks completed
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="h-2.5 w-2.5 rounded-sm bg-violet-200" />
              Tasks created
            </div>
          </div>

          <div className="grid h-48 grid-cols-7 gap-3 sm:gap-5">
            {weeklyActivity.map((day) => {
              const total = day.completed + day.created;
              const max = 16;

              return (
                <div
                  key={day.day}
                  className="flex min-w-0 flex-col items-center justify-end"
                >
                  <span className="mb-2 text-[10px] font-medium text-slate-400">
                    {total}
                  </span>
                  <div className="flex h-36 w-full max-w-9 items-end overflow-hidden rounded-t-lg bg-slate-50">
                    <div
                      className="flex w-full flex-col justify-end overflow-hidden rounded-t-lg"
                      style={{ height: `${(total / max) * 100}%` }}
                    >
                      <div
                        className="w-full bg-violet-200"
                        style={{
                          height: `${(day.created / total) * 100}%`,
                          minHeight: day.created ? "5px" : 0,
                        }}
                      />
                      <div
                        className="w-full bg-indigo-500"
                        style={{
                          height: `${(day.completed / total) * 100}%`,
                          minHeight: day.completed ? "5px" : 0,
                        }}
                      />
                    </div>
                  </div>
                  <span className="mt-3 text-[10px] font-medium text-slate-500">
                    {day.day}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
            <span className="text-xs text-slate-500">
              Sample chart data — connect your analytics API for live metrics.
            </span>
            <span className="flex items-center gap-1 text-xs font-semibold text-indigo-600">
              <TrendingUp size={14} />
              Weekly view
            </span>
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <SectionHeading
            title="Task distribution"
            subtitle="Current tasks by status"
          />

          <div className="flex items-center justify-center py-3">
            <div
              className="relative flex h-40 w-40 items-center justify-center rounded-full"
              style={{
                background: `conic-gradient(#6366f1 0% ${tasks.length ? (tasks.filter((task) => task.status === "In progress").length / tasks.length) * 100 : 0}%, #a78bfa ${tasks.length ? (tasks.filter((task) => task.status === "In progress").length / tasks.length) * 100 : 0}% ${tasks.length ? ((tasks.filter((task) => task.status === "In progress").length + tasks.filter((task) => task.status === "To do").length) / tasks.length) * 100 : 0}%, #e2e8f0 ${tasks.length ? ((tasks.filter((task) => task.status === "In progress").length + tasks.filter((task) => task.status === "To do").length) / tasks.length) * 100 : 0}% 100%)`,
              }}
            >
              <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white">
                <span className="text-3xl font-bold text-slate-950">
                  {tasks.length}
                </span>
                <span className="mt-1 text-[10px] text-slate-500">
                  Total tasks
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-4">
            {[
              {
                label: "In progress",
                color: "bg-indigo-500",
                count: tasks.filter((task) => task.status === "In progress")
                  .length,
              },
              {
                label: "To do",
                color: "bg-violet-400",
                count: tasks.filter((task) => task.status === "To do").length,
              },
              {
                label: "In review",
                color: "bg-slate-300",
                count: tasks.filter((task) => task.status === "Review").length,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <span className={`h-2.5 w-2.5 rounded-sm ${item.color}`} />
                  {item.label}
                </div>
                <span className="text-xs font-bold text-slate-800">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Projects */}
      <Card className="p-5 sm:p-6">
        <SectionHeading
          title="Projects"
          subtitle="A quick look at your active work"
          action={
            <button
              type="button"
              onClick={() => setShowCreateProject(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
            >
              <Plus size={14} />
              Add project
            </button>
          }
        />

        <div className="relative mb-5 max-w-sm">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={projectSearch}
            onChange={(event) => setProjectSearch(event.target.value)}
            placeholder="Search projects..."
            aria-label="Search projects"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-xs outline-none transition focus:border-indigo-300 focus:bg-white"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-4">
          {filteredProjects.map((project) => {
            const colors = colorStyles[project.color] ?? colorStyles.indigo;

            return (
              <div
                key={project.id}
                className={`rounded-2xl border border-slate-200 bg-gradient-to-br ${colors.soft} p-4 transition hover:border-indigo-200 hover:shadow-sm`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors.icon}`}
                  >
                    <Code2 size={19} />
                  </div>
                  <button
                    type="button"
                    aria-label={`Project options for ${project.name}`}
                    title="Project options"
                    onClick={() =>
                      setNotice(
                        `${project.name}: ${project.progress}% complete. Project editing is not connected to the backend yet.`,
                      )
                    }
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-slate-700"
                  >
                    <MoreHorizontal size={18} />
                  </button>
                </div>

                <h3 className="mt-4 truncate text-sm font-bold text-slate-900">
                  {project.name}
                </h3>
                <p className="mt-1 min-h-9 text-xs leading-5 text-slate-500">
                  {project.description}
                </p>

                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="truncate text-[10px] font-medium text-slate-500">
                    {project.category}
                  </span>
                  <StatusBadge status={project.status} />
                </div>

                <div className="mt-5 flex items-center justify-between text-[10px]">
                  <span className="font-medium text-slate-500">Progress</span>
                  <span className="font-bold text-slate-800">
                    {project.progress}%
                  </span>
                </div>
                <div className="mt-2">
                  <ProgressBar value={project.progress} color={colors.bar} />
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-200/70 pt-3">
                  <div className="flex -space-x-2">
                    {project.members.map((member, index) => (
                      <div
                        key={`${project.id}-${member}-${index}`}
                        title={member}
                        className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-[9px] font-bold text-slate-600"
                      >
                        {member}
                      </div>
                    ))}
                  </div>
                  <span className="flex items-center gap-1 text-[10px] text-slate-500">
                    <CalendarDays size={12} />
                    {project.dueDate}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {filteredProjects.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-200 py-10 text-center">
            <FolderKanban
              size={26}
              className="mx-auto text-slate-300"
            />
            <p className="mt-3 text-sm font-semibold text-slate-700">
              No projects found
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Try another search term.
            </p>
          </div>
        )}
      </Card>

      {/* Tasks and insights */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Card className="overflow-hidden xl:col-span-2">
          <div className="p-5 sm:p-6">
            <SectionHeading
              title="My tasks"
              subtitle="Priorities and next steps"
              action={
                <select
                  value={taskFilter}
                  onChange={(event) => setTaskFilter(event.target.value)}
                  aria-label="Filter tasks by status"
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-600 outline-none focus:border-indigo-300"
                >
                  <option>All</option>
                  <option>To do</option>
                  <option>In progress</option>
                  <option>Review</option>
                </select>
              }
            />

            <div className="overflow-x-auto">
              <table className="w-full min-w-[580px] text-left">
                <thead>
                  <tr className="border-y border-slate-100 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    <th className="py-3 pr-3">Task</th>
                    <th className="px-3 py-3">Priority</th>
                    <th className="px-3 py-3">Due</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="py-3 pl-3">Update</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map((task) => (
                    <tr
                      key={task.id}
                      className="border-b border-slate-50 last:border-0 hover:bg-slate-50/70"
                    >
                      <td className="py-4 pr-3">
                        <p className="max-w-[240px] truncate text-xs font-semibold text-slate-800">
                          {task.title}
                        </p>
                        <p className="mt-1 max-w-[240px] truncate text-[10px] text-slate-400">
                          {task.project}
                        </p>
                      </td>
                      <td className="px-3 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 text-[10px] font-semibold ${
                            task.priority === "High"
                              ? "text-rose-600"
                              : task.priority === "Medium"
                                ? "text-amber-600"
                                : "text-slate-500"
                          }`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {task.priority}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-[10px] text-slate-500">
                        {task.due}
                      </td>
                      <td className="px-3 py-4">
                        <span
                          className={`whitespace-nowrap rounded-md px-2 py-1 text-[10px] font-medium ${
                            task.status === "In progress"
                              ? "bg-indigo-50 text-indigo-700"
                              : task.status === "Review"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {task.status}
                        </span>
                      </td>
                      <td className="py-4 pl-3">
                        <button
                          type="button"
                          onClick={() => updateTaskStatus(task.id)}
                          title="Cycle task status"
                          className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
                        >
                          <ArrowRight size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredTasks.length === 0 && (
              <p className="py-8 text-center text-xs text-slate-500">
                No tasks match this status.
              </p>
            )}

            <p className="mt-4 text-[10px] leading-5 text-slate-400">
              Sample tasks are shown here. Task status changes on this page
              remain local until connected to your task API.
            </p>
          </div>
        </Card>

        <div className="space-y-5">
          <Card className="p-5">
            <SectionHeading
              title="Project health"
              subtitle="Current project status"
            />

            <div className="space-y-4">
              {[
                {
                  label: "On track",
                  count: projects.filter((p) => p.status === "On track").length,
                  color: "bg-emerald-500",
                  text: "text-emerald-700",
                },
                {
                  label: "At risk",
                  count: projects.filter((p) => p.status === "At risk").length,
                  color: "bg-amber-500",
                  text: "text-amber-700",
                },
                {
                  label: "Completed",
                  count: completedProjects,
                  color: "bg-indigo-500",
                  text: "text-indigo-700",
                },
              ].map((item) => (
                <div key={item.label}>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-600">
                      {item.label}
                    </span>
                    <span className={`text-xs font-bold ${item.text}`}>
                      {item.count}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${item.color}`}
                      style={{
                        width: `${
                          projects.length
                            ? (item.count / projects.length) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="overflow-hidden border-indigo-100">
            <div className="bg-gradient-to-br from-indigo-50 to-violet-50 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">
                <BrainCircuit size={20} />
              </div>
              <h3 className="mt-4 text-sm font-bold text-slate-900">
                AI workspace insights
              </h3>
              <p className="mt-2 text-xs leading-5 text-slate-600">
                Keep an eye on projects that need attention and review tasks
                that are ready for the next step.
              </p>

              {projects.some((project) => project.status === "At risk") ? (
                <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200/80 bg-white/80 p-3">
                  <CircleAlert
                    size={16}
                    className="mt-0.5 shrink-0 text-amber-600"
                  />
                  <div>
                    <p className="text-xs font-semibold text-slate-800">
                      Review at-risk projects
                    </p>
                    <p className="mt-1 text-[10px] leading-4 text-slate-500">
                      {projects.filter((p) => p.status === "At risk").length}{" "}
                      project(s) currently need attention in this dashboard.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-4 flex items-center gap-2 rounded-xl bg-white/80 p-3 text-xs text-slate-600">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  No at-risk projects in this view.
                </div>
              )}

              <p className="mt-3 text-[10px] leading-4 text-slate-400">
                These are dashboard observations, not AI-generated analysis.
                Connect your AI endpoint to enable live insights.
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Footer note */}
      <div className="flex flex-col gap-2 border-t border-slate-200/80 py-4 text-[10px] text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <span className="flex items-center gap-2">
          <Activity size={13} />
          DevSync AI workspace overview
        </span>
        <span className="flex items-center gap-1.5">
          <Clock3 size={12} />
          Dashboard data may be illustrative until connected to the API.
        </span>
      </div>

      {/* Create project modal */}
      {showCreateProject && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowCreateProject(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-project-title"
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Plus size={21} />
                </div>
                <h2
                  id="create-project-title"
                  className="mt-4 text-lg font-bold text-slate-900"
                >
                  Create a project
                </h2>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Add a project to the current dashboard view.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateProject(false)}
                aria-label="Close dialog"
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <span className="text-lg">×</span>
              </button>
            </div>

            <form onSubmit={createProject} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="project-name"
                  className="mb-2 block text-xs font-semibold text-slate-700"
                >
                  Project name
                </label>
                <input
                  id="project-name"
                  required
                  autoFocus
                  value={newProjectName}
                  onChange={(event) => setNewProjectName(event.target.value)}
                  placeholder="e.g. Customer Portal"
                  className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                />
              </div>

              <div>
                <label
                  htmlFor="project-description"
                  className="mb-2 block text-xs font-semibold text-slate-700"
                >
                  Description
                </label>
                <textarea
                  id="project-description"
                  rows={3}
                  value={newProjectDescription}
                  onChange={(event) =>
                    setNewProjectDescription(event.target.value)
                  }
                  placeholder="What are you building?"
                  className="w-full resize-y rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                />
              </div>

              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowCreateProject(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-indigo-700"
                >
                  <Plus size={15} />
                  Create project
                </button>
              </div>

              <p className="text-[10px] leading-4 text-slate-400">
                This starter form updates local page state only. It does not
                create a record in your backend database.
              </p>
            </form>
          </div>
        </div>
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
      )}
    </div>
  );
}
