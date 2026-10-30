import { useMemo, useState } from "react";
import {
  Activity,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Circle,
  Clock3,
  Filter,
  Flag,
  Layers3,
  MoreHorizontal,
  Plus,
  Search,
  Sparkles,
  Target,
  Users,
  X,
  Zap,
} from "lucide-react";

type TaskStatus = "To Do" | "In Progress" | "Done";
type Priority = "High" | "Medium" | "Low";

type SprintTask = {
  id: string;
  title: string;
  project: string;
  assignee: string;
  initials: string;
  priority: Priority;
  status: TaskStatus;
  points: number;
  due: string;
};

const initialTasks: SprintTask[] = [
  {
    id: "DS-121",
    title: "Implement authentication flow",
    project: "Web Platform",
    assignee: "Aarav Sharma",
    initials: "AS",
    priority: "High",
    status: "Done",
    points: 5,
    due: "Oct 26",
  },
  {
    id: "DS-122",
    title: "Build project dashboard UI",
    project: "Web Platform",
    assignee: "Priya Singh",
    initials: "PS",
    priority: "High",
    status: "In Progress",
    points: 8,
    due: "Oct 29",
  },
  {
    id: "DS-123",
    title: "Connect task management API",
    project: "API Platform",
    assignee: "Rohan Verma",
    initials: "RV",
    priority: "High",
    status: "In Progress",
    points: 8,
    due: "Oct 30",
  },
  {
    id: "DS-124",
    title: "Create responsive navigation",
    project: "Web Platform",
    assignee: "Neha Gupta",
    initials: "NG",
    priority: "Medium",
    status: "Done",
    points: 3,
    due: "Oct 27",
  },
  {
    id: "DS-125",
    title: "Add project search and filters",
    project: "Web Platform",
    assignee: "Kabir Mehta",
    initials: "KM",
    priority: "Medium",
    status: "To Do",
    points: 5,
    due: "Oct 31",
  },
  {
    id: "DS-126",
    title: "Write API integration tests",
    project: "API Platform",
    assignee: "Ananya Rao",
    initials: "AR",
    priority: "High",
    status: "To Do",
    points: 5,
    due: "Nov 01",
  },
  {
    id: "DS-127",
    title: "Polish empty states and loaders",
    project: "Web Platform",
    assignee: "Ishaan Jain",
    initials: "IJ",
    priority: "Low",
    status: "In Progress",
    points: 3,
    due: "Nov 02",
  },
  {
    id: "DS-128",
    title: "Update developer documentation",
    project: "API Platform",
    assignee: "Priya Singh",
    initials: "PS",
    priority: "Low",
    status: "To Do",
    points: 2,
    due: "Nov 03",
  },
];

const initialSprints = [
  {
    id: "SPR-08",
    name: "Sprint 08 · Foundation",
    start: "Oct 13",
    end: "Oct 26",
    status: "Completed",
  },
  {
    id: "SPR-09",
    name: "Sprint 09 · Product Delivery",
    start: "Oct 27",
    end: "Nov 09",
    status: "Active",
  },
  {
    id: "SPR-10",
    name: "Sprint 10 · Stabilization",
    start: "Nov 10",
    end: "Nov 23",
    status: "Planned",
  },
];

const statusConfig: Record<
  TaskStatus,
  { color: string; dot: string; icon: typeof Circle }
> = {
  "To Do": {
    color: "bg-slate-100 text-slate-600",
    dot: "bg-slate-400",
    icon: Circle,
  },
  "In Progress": {
    color: "bg-blue-50 text-blue-700",
    dot: "bg-blue-500",
    icon: Clock3,
  },
  Done: {
    color: "bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
    icon: CheckCircle2,
  },
};

const priorityConfig: Record<
  Priority,
  { color: string; icon: typeof ArrowUp }
> = {
  High: { color: "text-rose-600", icon: ArrowUp },
  Medium: { color: "text-amber-600", icon: ArrowUp },
  Low: { color: "text-slate-500", icon: ArrowDown },
};

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}
    >
      {children}
    </section>
  );
}

function Metric({
  title,
  value,
  detail,
  icon: Icon,
  tone,
}: {
  title: string;
  value: string | number;
  detail: string;
  icon: typeof Target;
  tone: string;
}) {
  return (
    <Card className="p-5 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
        </div>
        <div className={`rounded-xl p-3 ${tone}`}>
          <Icon size={21} />
        </div>
      </div>
      <p className="mt-4 text-xs text-slate-500">{detail}</p>
    </Card>
  );
}

export default function SprintPlanner() {
  const [tasks, setTasks] = useState<SprintTask[]>(initialTasks);
  const [sprints, setSprints] = useState(initialSprints);
  const [activeSprintId, setActiveSprintId] = useState("SPR-09");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [view, setView] = useState<"Board" | "List">("Board");
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddSprint, setShowAddSprint] = useState(false);
  const [notice, setNotice] = useState("");

  const activeSprint =
    sprints.find((sprint) => sprint.id === activeSprintId) ?? sprints[0];

  const completedTasks = tasks.filter((task) => task.status === "Done");
  const inProgressTasks = tasks.filter(
    (task) => task.status === "In Progress",
  );
  const todoTasks = tasks.filter((task) => task.status === "To Do");

  const totalPoints = tasks.reduce((sum, task) => sum + task.points, 0);
  const completedPoints = completedTasks.reduce(
    (sum, task) => sum + task.points,
    0,
  );
  const progress = tasks.length
    ? Math.round((completedTasks.length / tasks.length) * 100)
    : 0;

  const filteredTasks = useMemo(() => {
    const query = search.toLowerCase().trim();

    return tasks.filter((task) => {
      const matchesSearch =
        !query ||
        [task.id, task.title, task.project, task.assignee].some((value) =>
          value.toLowerCase().includes(query),
        );

      return (
        matchesSearch &&
        (statusFilter === "All" || task.status === statusFilter) &&
        (priorityFilter === "All" || task.priority === priorityFilter)
      );
    });
  }, [tasks, search, statusFilter, priorityFilter]);

  function moveTask(id: string, status: TaskStatus) {
    setTasks((current) =>
      current.map((task) => (task.id === id ? { ...task, status } : task)),
    );
    setNotice(`Task ${id} moved to ${status}.`);
  }

  function addTask(formData: FormData) {
    const title = String(formData.get("title") || "").trim();
    const assignee = String(formData.get("assignee") || "").trim();
    const project = String(formData.get("project") || "").trim();

    if (!title || !assignee || !project) return;

    const initials = assignee
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    const task: SprintTask = {
      id: `DS-${Date.now().toString().slice(-5)}`,
      title,
      project,
      assignee,
      initials,
      priority: formData.get("priority") as Priority,
      status: "To Do",
      points: Number(formData.get("points") || 3),
      due: String(formData.get("due") || "Not set"),
    };

    setTasks((current) => [...current, task]);
    setShowAddTask(false);
    setNotice("Task added to the current sprint.");
    setSearch("");
    setStatusFilter("All");
    setPriorityFilter("All");
  }

  function addSprint(formData: FormData) {
    const name = String(formData.get("name") || "").trim();
    const start = String(formData.get("start") || "").trim();
    const end = String(formData.get("end") || "").trim();

    if (!name || !start || !end) return;

    const sprint = {
      id: `SPR-${String(sprints.length + 8).padStart(2, "0")}`,
      name,
      start,
      end,
      status: "Planned",
    };

    setSprints((current) => [...current, sprint]);
    setActiveSprintId(sprint.id);
    setShowAddSprint(false);
    setNotice("Sprint created in this demo.");
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-[1600px] space-y-6 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-blue-700">
              <Layers3 size={16} />
              <span>Project management</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-500">Sprint Planner</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Sprint Planner
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
              Plan iterations, balance team workload, and track sprint delivery
              from backlog to completion.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setShowAddSprint(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              <CalendarDays size={17} />
              New sprint
            </button>
            <button
              type="button"
              onClick={() => setShowAddTask(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <Plus size={17} />
              Add task
            </button>
          </div>
        </div>

        {/* Demo disclosure */}
        <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
          <div className="rounded-lg bg-blue-100 p-2 text-blue-700">
            <Sparkles size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold text-blue-900">
              Sprint workspace preview
            </p>
            <p className="mt-1 text-sm leading-5 text-blue-800/80">
              This page uses sample tasks and local React state. Task changes,
              sprint creation, and progress calculations are not synchronized
              with your backend yet.
            </p>
          </div>
        </div>

        {/* Sprint selector */}
        <Card className="p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
                <CalendarDays size={25} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Selected iteration
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-bold">{activeSprint.name}</h2>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      activeSprint.status === "Active"
                        ? "bg-emerald-50 text-emerald-700"
                        : activeSprint.status === "Completed"
                          ? "bg-slate-100 text-slate-600"
                          : "bg-blue-50 text-blue-700"
                    }`}
                  >
                    {activeSprint.status}
                  </span>
                </div>
                <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                  <Clock3 size={15} />
                  {activeSprint.start} – {activeSprint.end}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="text-sm font-medium text-slate-500">
                Sprint
              </label>
              <div className="relative min-w-56">
                <select
                  value={activeSprintId}
                  onChange={(event) => {
                    setActiveSprintId(event.target.value);
                    setNotice("Selected sprint changed.");
                  }}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-4 pr-10 text-sm font-semibold outline-none focus:border-blue-400"
                >
                  {sprints.map((sprint) => (
                    <option key={sprint.id} value={sprint.id}>
                      {sprint.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-5 border-t border-slate-100 pt-5 sm:grid-cols-3">
            <div>
              <p className="text-xs font-medium text-slate-500">Sprint goal</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                Deliver core product workflows
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">
                Planned capacity
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                {totalPoints} story points
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">
                Sprint completion
              </p>
              <div className="mt-2 flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-blue-600 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-sm font-bold">{progress}%</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Metrics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric
            title="Total tasks"
            value={tasks.length}
            detail="Tasks in this demo sprint"
            icon={Layers3}
            tone="bg-blue-50 text-blue-600"
          />
          <Metric
            title="Completed"
            value={completedTasks.length}
            detail={`${completedPoints} story points delivered`}
            icon={CheckCircle2}
            tone="bg-emerald-50 text-emerald-600"
          />
          <Metric
            title="In progress"
            value={inProgressTasks.length}
            detail="Tasks currently being worked on"
            icon={Activity}
            tone="bg-violet-50 text-violet-600"
          />
          <Metric
            title="Remaining"
            value={todoTasks.length}
            detail={`${Math.max(totalPoints - completedPoints, 0)} points not completed`}
            icon={Target}
            tone="bg-orange-50 text-orange-600"
          />
        </div>

        {/* Progress and team capacity */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <Card className="p-5 sm:p-6 xl:col-span-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">Sprint progress</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Track delivery against the current task backlog.
                </p>
              </div>
              <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
                <Target size={20} />
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-slate-50 p-5">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-500">Tasks completed</p>
                  <p className="mt-1 text-3xl font-bold">
                    {completedTasks.length}
                    <span className="text-lg font-medium text-slate-400">
                      {" "}
                      / {tasks.length}
                    </span>
                  </p>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700">
                  {progress}% complete
                </span>
              </div>
              <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-3 flex justify-between text-xs text-slate-500">
                <span>Start</span>
                <span>{tasks.length - completedTasks.length} tasks remaining</span>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                {
                  label: "To do",
                  value: todoTasks.length,
                  color: "bg-slate-400",
                },
                {
                  label: "In progress",
                  value: inProgressTasks.length,
                  color: "bg-blue-500",
                },
                {
                  label: "Done",
                  value: completedTasks.length,
                  color: "bg-emerald-500",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-slate-100 p-4"
                >
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                    <span className="text-sm text-slate-500">{item.label}</span>
                  </div>
                  <p className="mt-2 text-2xl font-bold">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50/70 p-4">
              <Zap size={18} className="mt-0.5 shrink-0 text-amber-600" />
              <div>
                <p className="text-sm font-semibold text-amber-900">
                  Sprint planning tip
                </p>
                <p className="mt-1 text-sm leading-5 text-amber-800/80">
                  Prioritize high-impact work, make ownership clear, and review
                  unfinished tasks before committing to additional work.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-5 sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold">Team workload</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Assigned story points by member.
                </p>
              </div>
              <Users size={20} className="text-slate-400" />
            </div>

            <div className="mt-5 space-y-5">
              {Array.from(
                tasks.reduce((map, task) => {
                  const current = map.get(task.assignee) ?? {
                    name: task.assignee,
                    initials: task.initials,
                    points: 0,
                    done: 0,
                  };
                  current.points += task.points;
                  if (task.status === "Done") current.done += task.points;
                  map.set(task.assignee, current);
                  return map;
                }, new Map<string, { name: string; initials: string; points: number; done: number }>()),
              )
                .map(([, member]) => member)
                .sort((a, b) => b.points - a.points)
                .slice(0, 5)
                .map((member) => (
                  <div key={member.name}>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-700">
                          {member.initials}
                        </div>
                        <span className="truncate text-sm font-medium text-slate-700">
                          {member.name}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-slate-700">
                        {member.points} pts
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-blue-500"
                        style={{
                          width: `${
                            Math.max(
                              ...tasks.map((task) =>
                                tasks
                                  .filter((item) => item.assignee === task.assignee)
                                  .reduce((sum, item) => sum + item.points, 0),
                              ),
                              1,
                            )
                              ? (member.points /
                                  Math.max(
                                    ...Array.from(
                                      tasks.reduce((map, task) => {
                                        map.set(
                                          task.assignee,
                                          (map.get(task.assignee) ?? 0) +
                                            task.points,
                                        );
                                        return map;
                                      }, new Map<string, number>()),
                                    ).map(([, points]) => points),
                                    1,
                                  )) *
                                100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      {member.done} points completed
                    </p>
                  </div>
                ))}
            </div>

            <p className="mt-5 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-400">
              Workload is calculated from the sample tasks shown on this page.
            </p>
          </Card>
        </div>

        {/* Task board */}
        <Card className="overflow-hidden">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:p-6 xl:flex-row xl:items-center">
            <div>
              <h2 className="text-lg font-bold">Sprint task board</h2>
              <p className="mt-1 text-sm text-slate-500">
                Move tasks through the sprint workflow.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                {(["Board", "List"] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setView(item)}
                    className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                      view === item
                        ? "bg-white text-blue-700 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setShowAddTask(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Plus size={16} />
                Task
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/70 p-4 sm:flex-row sm:flex-wrap sm:items-center sm:p-5">
            <div className="relative min-w-0 flex-1 sm:min-w-64">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search tasks or assignees..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-400"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-slate-400" />
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                aria-label="Filter tasks by status"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400"
              >
                <option value="All">All statuses</option>
                <option value="To Do">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="Done">Done</option>
              </select>
              <select
                value={priorityFilter}
                onChange={(event) => setPriorityFilter(event.target.value)}
                aria-label="Filter tasks by priority"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400"
              >
                <option value="All">All priorities</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          {view === "Board" ? (
            <div className="grid grid-cols-1 gap-4 bg-slate-50/60 p-4 lg:grid-cols-3 sm:p-5">
              {(
                [
                  {
                    status: "To Do" as TaskStatus,
                    subtitle: "Ready to start",
                  },
                  {
                    status: "In Progress" as TaskStatus,
                    subtitle: "Currently underway",
                  },
                  {
                    status: "Done" as TaskStatus,
                    subtitle: "Completed work",
                  },
                ] as const
              ).map((column) => {
                const columnTasks = filteredTasks.filter(
                  (task) => task.status === column.status,
                );
                const StatusIcon = statusConfig[column.status].icon;

                return (
                  <div
                    key={column.status}
                    className="min-w-0 rounded-2xl border border-slate-200 bg-slate-100/70 p-3"
                  >
                    <div className="mb-3 flex items-center justify-between gap-2 px-1 py-1">
                      <div className="flex items-center gap-2">
                        <StatusIcon
                          size={17}
                          className={
                            column.status === "Done"
                              ? "text-emerald-600"
                              : column.status === "In Progress"
                                ? "text-blue-600"
                                : "text-slate-500"
                          }
                        />
                        <span className="text-sm font-bold text-slate-800">
                          {column.status}
                        </span>
                        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-500">
                          {columnTasks.length}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowAddTask(true)}
                        aria-label={`Add task to ${column.status}`}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-slate-700"
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    <p className="mb-3 px-1 text-xs text-slate-500">
                      {column.subtitle}
                    </p>

                    <div className="space-y-3">
                      {columnTasks.map((task) => {
                        const PriorityIcon =
                          priorityConfig[task.priority].icon;

                        return (
                          <article
                            key={task.id}
                            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-xs font-semibold text-blue-600">
                                {task.id}
                              </span>
                              <button
                                type="button"
                                aria-label={`View actions for ${task.title}`}
                                onClick={() =>
                                  setNotice(
                                    `${task.title} · ${task.points} story points`,
                                  )
                                }
                                className="rounded-md p-1 text-slate-400 hover:bg-slate-100"
                              >
                                <MoreHorizontal size={17} />
                              </button>
                            </div>

                            <h3 className="mt-2 text-sm font-semibold leading-5 text-slate-900">
                              {task.title}
                            </h3>
                            <p className="mt-2 text-xs text-slate-500">
                              {task.project}
                            </p>

                            <div className="mt-4 flex flex-wrap items-center gap-2">
                              <span
                                className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold ${priorityConfig[task.priority].color} bg-slate-50`}
                              >
                                <PriorityIcon size={12} />
                                {task.priority}
                              </span>
                              <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
                                {task.points} pts
                              </span>
                            </div>

                            <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                              <div className="flex min-w-0 items-center gap-2">
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-[10px] font-bold text-indigo-700">
                                  {task.initials}
                                </div>
                                <span className="truncate text-xs text-slate-600">
                                  {task.assignee}
                                </span>
                              </div>
                              <span className="shrink-0 text-[11px] text-slate-400">
                                {task.due}
                              </span>
                            </div>

                            <div className="mt-3">
                              <label className="sr-only">
                                Update task status
                              </label>
                              <select
                                value={task.status}
                                onChange={(event) =>
                                  moveTask(
                                    task.id,
                                    event.target.value as TaskStatus,
                                  )
                                }
                                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs font-semibold text-slate-600 outline-none focus:border-blue-400"
                              >
                                <option value="To Do">Move to To Do</option>
                                <option value="In Progress">
                                  Move to In Progress
                                </option>
                                <option value="Done">Move to Done</option>
                              </select>
                            </div>
                          </article>
                        );
                      })}

                      {columnTasks.length === 0 && (
                        <div className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center">
                          <p className="text-sm text-slate-500">
                            No matching tasks
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400">
                    <th className="px-6 py-4 font-semibold">Task</th>
                    <th className="px-4 py-4 font-semibold">Assignee</th>
                    <th className="px-4 py-4 font-semibold">Priority</th>
                    <th className="px-4 py-4 font-semibold">Points</th>
                    <th className="px-4 py-4 font-semibold">Due</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTasks.map((task) => {
                    const PriorityIcon =
                      priorityConfig[task.priority].icon;

                    return (
                      <tr key={task.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <p className="text-xs font-semibold text-blue-600">
                            {task.id}
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-800">
                            {task.title}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {task.project}
                          </p>
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-600">
                          {task.assignee}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-semibold ${priorityConfig[task.priority].color}`}
                          >
                            <PriorityIcon size={13} />
                            {task.priority}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm font-semibold">
                          {task.points}
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-500">
                          {task.due}
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={task.status}
                            onChange={(event) =>
                              moveTask(
                                task.id,
                                event.target.value as TaskStatus,
                              )
                            }
                            className={`rounded-lg border-0 px-3 py-2 text-xs font-semibold outline-none ${statusConfig[task.status].color}`}
                          >
                            <option value="To Do">To Do</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Done">Done</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredTasks.length === 0 && (
                <div className="p-10 text-center text-sm text-slate-500">
                  No tasks match the selected filters.
                </div>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 text-xs text-slate-500 sm:px-6">
            <span>
              Showing {filteredTasks.length} of {tasks.length} tasks
            </span>
            <span>Changes are held locally in this demo</span>
          </div>
        </Card>

        {/* Sprint workflow */}
        <Card className="p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-violet-50 p-3 text-violet-600">
              <Flag size={21} />
            </div>
            <div>
              <h2 className="text-lg font-bold">Sprint workflow</h2>
              <p className="mt-1 text-sm text-slate-500">
                A simple view of the iteration lifecycle.
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              {
                title: "Plan",
                description: "Define the sprint goal and select backlog tasks.",
                number: "01",
              },
              {
                title: "Execute",
                description: "Track progress, ownership, and delivery blockers.",
                number: "02",
              },
              {
                title: "Review",
                description: "Review completed work and carry forward unfinished tasks.",
                number: "03",
              },
            ].map((step, index) => (
              <div
                key={step.number}
                className="relative rounded-xl border border-slate-100 bg-slate-50 p-4"
              >
                <span className="text-xs font-bold tracking-wider text-blue-600">
                  STEP {step.number}
                </span>
                <h3 className="mt-2 font-bold text-slate-900">{step.title}</h3>
                <p className="mt-1 text-sm leading-5 text-slate-500">
                  {step.description}
                </p>
                {index < 2 && (
                  <ArrowRight
                    size={16}
                    className="absolute right-4 top-5 hidden text-slate-300 sm:block"
                  />
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Notifications */}
        {notice && (
          <div
            role="status"
            className="fixed bottom-5 right-5 z-[60] flex max-w-sm items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xl"
          >
            <CheckCircle2
              size={19}
              className="mt-0.5 shrink-0 text-emerald-600"
            />
            <p className="flex-1 text-sm font-medium text-slate-700">
              {notice}
            </p>
            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={() => setNotice("")}
              className="text-slate-400 hover:text-slate-700"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Add task modal */}
        {showAddTask && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setShowAddTask(false);
            }}
          >
            <form
              onSubmit={(event) => {
                event.preventDefault();
                addTask(new FormData(event.currentTarget));
              }}
              className="my-auto w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 p-5 sm:p-6">
                <div>
                  <h2 className="text-xl font-bold">Add sprint task</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Create a task for this demo sprint.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddTask(false)}
                  aria-label="Close task form"
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                >
                  <X size={19} />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 sm:p-6">
                <label className="sm:col-span-2">
                  <span className="mb-1.5 block text-sm font-semibold">
                    Task title *
                  </span>
                  <input
                    name="title"
                    required
                    maxLength={120}
                    placeholder="Enter task title"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-blue-400"
                  />
                </label>
                <label>
                  <span className="mb-1.5 block text-sm font-semibold">
                    Assignee *
                  </span>
                  <input
                    name="assignee"
                    required
                    maxLength={100}
                    placeholder="Team member name"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-blue-400"
                  />
                </label>
                <label>
                  <span className="mb-1.5 block text-sm font-semibold">
                    Project *
                  </span>
                  <input
                    name="project"
                    required
                    maxLength={100}
                    placeholder="Project name"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-blue-400"
                  />
                </label>
                <label>
                  <span className="mb-1.5 block text-sm font-semibold">
                    Priority
                  </span>
                  <select
                    name="priority"
                    defaultValue="Medium"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-blue-400"
                  >
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </label>
                <label>
                  <span className="mb-1.5 block text-sm font-semibold">
                    Story points
                  </span>
                  <select
                    name="points"
                    defaultValue="3"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-blue-400"
                  >
                    <option value="1">1 point</option>
                    <option value="2">2 points</option>
                    <option value="3">3 points</option>
                    <option value="5">5 points</option>
                    <option value="8">8 points</option>
                    <option value="13">13 points</option>
                  </select>
                </label>
                <label className="sm:col-span-2">
                  <span className="mb-1.5 block text-sm font-semibold">
                    Due date
                  </span>
                  <input
                    name="due"
                    placeholder="e.g. Nov 05"
                    maxLength={30}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-blue-400"
                  />
                </label>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 p-5 sm:flex-row sm:justify-end sm:px-6">
                <button
                  type="button"
                  onClick={() => setShowAddTask(false)}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Add task
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Add sprint modal */}
        {showAddSprint && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setShowAddSprint(false);
            }}
          >
            <form
              onSubmit={(event) => {
                event.preventDefault();
                addSprint(new FormData(event.currentTarget));
              }}
              className="my-auto w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 p-5 sm:p-6">
                <div>
                  <h2 className="text-xl font-bold">Create a sprint</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Add an iteration to your sprint selector.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddSprint(false)}
                  aria-label="Close sprint form"
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                >
                  <X size={19} />
                </button>
              </div>

              <div className="space-y-4 p-5 sm:p-6">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold">
                    Sprint name *
                  </span>
                  <input
                    name="name"
                    required
                    maxLength={100}
                    placeholder="e.g. Sprint 11 · New Features"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-blue-400"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold">
                    Start date *
                  </span>
                  <input
                    name="start"
                    required
                    type="date"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-blue-400"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold">
                    End date *
                  </span>
                  <input
                    name="end"
                    required
                    type="date"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-blue-400"
                  />
                </label>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 p-5 sm:flex-row sm:justify-end sm:px-6">
                <button
                  type="button"
                  onClick={() => setShowAddSprint(false)}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Create sprint
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
