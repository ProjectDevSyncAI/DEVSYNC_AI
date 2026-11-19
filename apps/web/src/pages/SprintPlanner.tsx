<<<<<<< HEAD
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
=======
import { useMemo, useState } from "react";
import {
  Activity,
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
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
<<<<<<< HEAD
  Loader2,
  MoreHorizontal,
  Play,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  StopCircle,
  Target,
  Trash2,
=======
  MoreHorizontal,
  Plus,
  Search,
  Sparkles,
  Target,
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
  Users,
  X,
  Zap,
} from "lucide-react";
<<<<<<< HEAD
import {
  organizationApi,
  projectApi,
  sprintApi,
  type Project,
  type ProjectMemberInfo,
  type Sprint,
  type SprintStatus,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from "../lib/api";
import { useProjectStore } from "../store/project.store";
import { useSprintStore } from "../store/sprint.store";
import { useTaskStore } from "../store/task.store";

type UiTaskColumn = "To Do" | "In Progress" | "Done";
type UiPriority = "Urgent" | "High" | "Medium" | "Low";

const statusConfig: Record<
  UiTaskColumn,
=======

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
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
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
<<<<<<< HEAD
  UiPriority,
  { color: string; icon: typeof ArrowUp }
> = {
  Urgent: { color: "text-rose-700 font-bold", icon: ArrowUp },
=======
  Priority,
  { color: string; icon: typeof ArrowUp }
> = {
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
  High: { color: "text-rose-600", icon: ArrowUp },
  Medium: { color: "text-amber-600", icon: ArrowUp },
  Low: { color: "text-slate-500", icon: ArrowDown },
};

<<<<<<< HEAD
function mapApiPriorityToUi(p: TaskPriority): UiPriority {
  switch (p) {
    case "URGENT":
      return "Urgent";
    case "HIGH":
      return "High";
    case "MEDIUM":
      return "Medium";
    case "LOW":
      return "Low";
    default:
      return "Medium";
  }
}

function mapUiPriorityToApi(p: UiPriority): TaskPriority {
  switch (p) {
    case "Urgent":
      return "URGENT";
    case "High":
      return "HIGH";
    case "Medium":
      return "MEDIUM";
    case "Low":
      return "LOW";
  }
}

function mapApiStatusToColumn(status: TaskStatus): UiTaskColumn {
  switch (status) {
    case "DONE":
      return "Done";
    case "IN_PROGRESS":
    case "IN_REVIEW":
      return "In Progress";
    case "TODO":
    case "BLOCKED":
    case "CANCELLED":
    default:
      return "To Do";
  }
}

function mapColumnToApiStatus(column: UiTaskColumn): TaskStatus {
  switch (column) {
    case "Done":
      return "DONE";
    case "In Progress":
      return "IN_PROGRESS";
    case "To Do":
      return "TODO";
  }
}

function formatSprintDate(dateStr?: string | null): string {
  if (!dateStr) return "Not set";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

=======
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
<<<<<<< HEAD
  const {
    sprints,
    activeSprintId,
    isLoading: sprintsLoading,
    isCreating: sprintCreating,
    isUpdating: sprintUpdating,
    error: sprintError,
    setProjectId: setSprintProjectId,
    setActiveSprintId,
    fetchSprints,
    createSprint,
    updateSprint,
    startSprint,
    completeSprint,
    deleteSprint,
    clearError: clearSprintError,
  } = useSprintStore();

  const {
    tasks,
    isLoading: tasksLoading,
    isCreating: taskCreating,
    isUpdating: taskUpdating,
    error: taskError,
    setProjectId: setTaskProjectId,
    fetchTasks,
    createTask,
    updateTask,
    clearError: clearTaskError,
  } = useTaskStore();

  const { projects, fetchProjects } = useProjectStore();

  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [projectMembers, setProjectMembers] = useState<ProjectMemberInfo[]>([]);

  // Task filtering
=======
  const [tasks, setTasks] = useState<SprintTask[]>(initialTasks);
  const [sprints, setSprints] = useState(initialSprints);
  const [activeSprintId, setActiveSprintId] = useState("SPR-09");
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [view, setView] = useState<"Board" | "List">("Board");
<<<<<<< HEAD
  const [scopeFilter, setScopeFilter] = useState<"sprint" | "all">("sprint");

  // Modals
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddSprint, setShowAddSprint] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);

  // AI Sprint Planner state
  const [aiGoal, setAiGoal] = useState("");
  const [aiDuration, setAiDuration] = useState(14);
  const [generatingAiPlan, setGeneratingAiPlan] = useState(false);
  const [aiPlanResult, setAiPlanResult] = useState<string | null>(null);

  // User notice banner
  const [notice, setNotice] = useState("");

  // 1. Initial load of organizations & projects
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const orgs = await organizationApi.list();
        if (orgs.length > 0 && isMounted) {
          await fetchProjects(orgs[0].id);
        }
      } catch {
        // Handled by project store
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [fetchProjects]);

  // 2. Select initial project
  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      const firstId = projects[0].id;
      setSelectedProjectId(firstId);
    }
  }, [projects, selectedProjectId]);

  // 3. Load sprint and task data when selectedProjectId changes
  const loadProjectData = useCallback(
    async (projId: string) => {
      if (!projId) return;

      setSprintProjectId(projId);
      setTaskProjectId(projId);

      try {
        const [, , members] = await Promise.all([
          fetchSprints(projId),
          fetchTasks(projId),
          projectApi.getMembers(projId).catch(() => []),
        ]);
        setProjectMembers(members);
      } catch {
        // Errors handled by stores
      }
    },
    [setSprintProjectId, setTaskProjectId, fetchSprints, fetchTasks],
  );

  useEffect(() => {
    if (selectedProjectId) {
      loadProjectData(selectedProjectId);
    }
  }, [selectedProjectId, loadProjectData]);

  // Active sprint selection
  const activeSprint: Sprint | null = useMemo(() => {
    if (sprints.length === 0) return null;
    return sprints.find((s) => s.id === activeSprintId) || sprints[0];
  }, [sprints, activeSprintId]);

  // Selected project object
  const currentProject = useMemo(() => {
    return projects.find((p) => p.id === selectedProjectId) || null;
  }, [projects, selectedProjectId]);

  // Member map for quick lookup
  const memberMap = useMemo(() => {
    const map = new Map<string, ProjectMemberInfo["user"]>();
    for (const m of projectMembers) {
      map.set(m.userId, m.user);
    }
    return map;
  }, [projectMembers]);

  // Filter tasks based on scope (current sprint vs all project tasks)
  const scopedTasks = useMemo(() => {
    if (scopeFilter === "sprint") {
      if (!activeSprint) return [];
      return tasks.filter((t) => t.sprintId === activeSprint.id);
    }
    return tasks;
  }, [tasks, scopeFilter, activeSprint]);

  // Metrics derived from sprint tasks
  const sprintTasks = useMemo(() => {
    if (!activeSprint) return [];
    return tasks.filter((t) => t.sprintId === activeSprint.id);
  }, [tasks, activeSprint]);

  const completedTasks = useMemo(
    () => sprintTasks.filter((t) => t.status === "DONE"),
    [sprintTasks],
  );
  const inProgressTasks = useMemo(
    () =>
      sprintTasks.filter(
        (t) => t.status === "IN_PROGRESS" || t.status === "IN_REVIEW",
      ),
    [sprintTasks],
  );
  const todoTasks = useMemo(
    () =>
      sprintTasks.filter(
        (t) =>
          t.status === "TODO" ||
          t.status === "BLOCKED" ||
          t.status === "CANCELLED",
      ),
    [sprintTasks],
  );

  const totalPoints = useMemo(
    () => sprintTasks.reduce((sum, t) => sum + (t.storyPoints ?? 0), 0),
    [sprintTasks],
  );
  const completedPoints = useMemo(
    () => completedTasks.reduce((sum, t) => sum + (t.storyPoints ?? 0), 0),
    [completedTasks],
  );
  const progress = useMemo(
    () =>
      sprintTasks.length > 0
        ? Math.round((completedTasks.length / sprintTasks.length) * 100)
        : 0,
    [sprintTasks.length, completedTasks.length],
  );

  // Search & filter
  const filteredTasks = useMemo(() => {
    const query = search.toLowerCase().trim();

    return scopedTasks.filter((task) => {
      const assigneeUser = task.assigneeId
        ? memberMap.get(task.assigneeId)
        : null;
      const assigneeName = assigneeUser
        ? `${assigneeUser.firstName} ${assigneeUser.lastName}`
        : "Unassigned";

      const matchesSearch =
        !query ||
        [task.id, task.title, assigneeName].some((value) =>
          value.toLowerCase().includes(query),
        );

      const column = mapApiStatusToColumn(task.status);
      const priorityUi = mapApiPriorityToUi(task.priority);

      const matchesStatus = statusFilter === "All" || column === statusFilter;
      const matchesPriority =
        priorityFilter === "All" || priorityUi === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [scopedTasks, search, statusFilter, priorityFilter, memberMap]);

  // Actions
  async function handleMoveTask(taskId: string, targetColumn: UiTaskColumn) {
    const nextStatus = mapColumnToApiStatus(targetColumn);
    try {
      await updateTask(taskId, { status: nextStatus });
      setNotice(`Task status updated to ${targetColumn}.`);
    } catch {
      // Error handled by store
    }
  }

  async function handleAssignToSprint(taskId: string, sprintId: string | null) {
    try {
      await updateTask(taskId, { sprintId });
      setNotice(
        sprintId
          ? "Task assigned to sprint."
          : "Task moved to project backlog.",
      );
    } catch {
      // Error handled by store
    }
  }

  async function handleCreateTask(formData: FormData) {
    const title = String(formData.get("title") || "").trim();
    if (!title || !selectedProjectId) return;

    const assigneeIdVal = String(formData.get("assigneeId") || "");
    const priorityVal = formData.get("priority") as UiPriority;
    const pointsVal = Number(formData.get("points") || 0);
    const dueDateVal = String(formData.get("due") || "");
    const targetSprintId = String(formData.get("sprintId") || "");

    try {
      await createTask({
        projectId: selectedProjectId,
        sprintId: targetSprintId || activeSprint?.id || undefined,
        assigneeId: assigneeIdVal || undefined,
        title,
        priority: mapUiPriorityToApi(priorityVal || "Medium"),
        storyPoints: pointsVal > 0 ? pointsVal : undefined,
        dueDate: dueDateVal ? new Date(dueDateVal).toISOString() : undefined,
      });

      setShowAddTask(false);
      setNotice("Task created successfully.");
    } catch {
      // Error handled by store
    }
  }

  async function handleCreateSprint(formData: FormData) {
    const name = String(formData.get("name") || "").trim();
    const startDate = String(formData.get("start") || "").trim();
    const endDate = String(formData.get("end") || "").trim();
    const goal = String(formData.get("goal") || "").trim();
    const capacityVal = Number(formData.get("capacity") || 0);

    if (!name || !startDate || !endDate || !selectedProjectId) return;

    try {
      const created = await createSprint({
        projectId: selectedProjectId,
        name,
        goal: goal || undefined,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        capacity: capacityVal > 0 ? capacityVal : undefined,
      });

      setActiveSprintId(created.id);
      setShowAddSprint(false);
      setNotice(`Sprint "${created.name}" created.`);
    } catch {
      // Error handled by store
    }
  }

  async function handleStartSprint() {
    if (!activeSprint) return;
    try {
      await startSprint(activeSprint.id);
      setNotice(`Sprint "${activeSprint.name}" is now ACTIVE.`);
    } catch {
      // Error handled by store
    }
  }

  async function handleCompleteSprint() {
    if (!activeSprint) return;
    try {
      await completeSprint(activeSprint.id);
      setNotice(`Sprint "${activeSprint.name}" marked as COMPLETED.`);
    } catch {
      // Error handled by store
    }
  }

  async function handleDeleteSprint() {
    if (!activeSprint) return;
    if (
      !window.confirm(
        `Are you sure you want to delete sprint "${activeSprint.name}"? Assigned tasks will return to the backlog.`,
      )
    ) {
      return;
    }
    try {
      await deleteSprint(activeSprint.id);
      setNotice("Sprint deleted.");
    } catch {
      // Error handled by store
    }
  }

  async function handleGenerateSprintPlan() {
    if (!selectedProjectId) {
      setNotice("Please select a project first.");
      return;
    }
    setGeneratingAiPlan(true);
    setAiPlanResult(null);
    try {
      const res = await sprintApi.generatePlan({
        projectId: selectedProjectId,
        goal: aiGoal || undefined,
        durationDays: Number(aiDuration) || 14,
      });
      setAiPlanResult(res.plan);
      setNotice("AI sprint plan created successfully!");
    } catch (err: any) {
      setNotice(err?.message || "Failed to generate AI sprint plan.");
    } finally {
      setGeneratingAiPlan(false);
    }
  }

  const isLoading = sprintsLoading || tasksLoading;
  const activeError = sprintError || taskError;

=======
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

>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
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
<<<<<<< HEAD
              backed by your DevSync AI database.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {projects.length > 0 && (
              <select
                value={selectedProjectId}
                onChange={(e) => {
                  setSelectedProjectId(e.target.value);
                }}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={() => setShowAiModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
            >
              <Sparkles size={17} />
              AI Plan Sprint
            </button>

=======
              from backlog to completion.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
            <button
              type="button"
              onClick={() => setShowAddSprint(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              <CalendarDays size={17} />
              New sprint
            </button>
<<<<<<< HEAD

            <button
              type="button"
              onClick={() => setShowAddTask(true)}
              disabled={!activeSprint}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
=======
            <button
              type="button"
              onClick={() => setShowAddTask(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
            >
              <Plus size={17} />
              Add task
            </button>
          </div>
        </div>

<<<<<<< HEAD
        {/* Live sync banner */}
        <div className="flex items-start justify-between gap-3 rounded-xl border border-emerald-100 bg-emerald-50/70 p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700">
              <Sparkles size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-900">
                Connected to Live Sprint Engine
              </p>
              <p className="mt-1 text-sm leading-5 text-emerald-800/80">
                Sprints, tasks, and team workloads are synchronized with your
                DevSync AI backend and PostgreSQL database.
              </p>
            </div>
          </div>
          {isLoading && (
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-700">
              <Loader2 size={14} className="animate-spin" />
              Syncing…
            </div>
          )}
        </div>

        {/* Error banner */}
        {activeError && (
          <div className="flex items-start justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold">Sprint Error</p>
                <p className="text-xs text-rose-700 mt-0.5">{activeError}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => loadProjectData(selectedProjectId)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
              >
                <RefreshCw size={13} />
                Retry
              </button>
              <button
                type="button"
                onClick={() => {
                  clearSprintError();
                  clearTaskError();
                }}
                className="p-1 text-rose-500 hover:text-rose-800"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        )}

        {/* Sprint selector / Iteration banner */}
        {activeSprint ? (
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
                        activeSprint.status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-700"
                          : activeSprint.status === "COMPLETED"
                            ? "bg-slate-100 text-slate-600"
                            : activeSprint.status === "CANCELLED"
                              ? "bg-rose-50 text-rose-700"
                              : "bg-blue-50 text-blue-700"
                      }`}
                    >
                      {activeSprint.status}
                    </span>
                  </div>
                  <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                    <Clock3 size={15} />
                    {formatSprintDate(activeSprint.startDate)} –{" "}
                    {formatSprintDate(activeSprint.endDate)}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  {activeSprint.status === "PLANNED" && (
                    <button
                      type="button"
                      disabled={sprintUpdating}
                      onClick={handleStartSprint}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      <Play size={14} />
                      Start sprint
                    </button>
                  )}
                  {activeSprint.status === "ACTIVE" && (
                    <button
                      type="button"
                      disabled={sprintUpdating}
                      onClick={handleCompleteSprint}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-900 disabled:opacity-50"
                    >
                      <StopCircle size={14} />
                      Complete sprint
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleDeleteSprint}
                    aria-label="Delete sprint"
                    className="rounded-xl border border-slate-200 p-2 text-slate-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="relative min-w-56">
                  <select
                    value={activeSprint.id}
                    onChange={(event) => {
                      setActiveSprintId(event.target.value);
                      setNotice("Selected sprint changed.");
                    }}
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-4 pr-10 text-sm font-semibold outline-none focus:border-blue-400"
                  >
                    {sprints.map((sprint) => (
                      <option key={sprint.id} value={sprint.id}>
                        {sprint.name} ({sprint.status})
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
                  {activeSprint.goal || "No sprint goal defined."}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">
                  Planned capacity
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-800">
                  {activeSprint.capacity
                    ? `${activeSprint.capacity} points capacity (${totalPoints} allocated)`
                    : `${totalPoints} story points allocated`}
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
        ) : (
          <Card className="p-8 text-center">
            <CalendarDays className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="mt-3 text-base font-semibold text-slate-800">
              No Sprints Planned
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              There are no iterations in this project yet. Create your first sprint
              to start tracking delivery.
            </p>
            <button
              type="button"
              onClick={() => setShowAddSprint(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Plus size={16} />
              Create sprint
            </button>
          </Card>
        )}
=======
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
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c

        {/* Metrics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric
<<<<<<< HEAD
            title="Sprint tasks"
            value={sprintTasks.length}
            detail="Tasks currently assigned to this iteration"
=======
            title="Total tasks"
            value={tasks.length}
            detail="Tasks in this demo sprint"
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
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
<<<<<<< HEAD
            detail="Tasks underway in active workflows"
=======
            detail="Tasks currently being worked on"
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
            icon={Activity}
            tone="bg-violet-50 text-violet-600"
          />
          <Metric
            title="Remaining"
            value={todoTasks.length}
<<<<<<< HEAD
            detail={`${Math.max(totalPoints - completedPoints, 0)} points remaining`}
=======
            detail={`${Math.max(totalPoints - completedPoints, 0)} points not completed`}
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
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
<<<<<<< HEAD
                  Track delivery against the current sprint backlog.
=======
                  Track delivery against the current task backlog.
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
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
<<<<<<< HEAD
                      / {sprintTasks.length}
=======
                      / {tasks.length}
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
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
<<<<<<< HEAD
                <span>
                  {sprintTasks.length - completedTasks.length} tasks remaining
                </span>
=======
                <span>{tasks.length - completedTasks.length} tasks remaining</span>
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
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
<<<<<<< HEAD
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${item.color}`}
                    />
=======
                    <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
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
<<<<<<< HEAD
              {projectMembers.length > 0 ? (
                projectMembers.map((member) => {
                  const memberTasks = sprintTasks.filter(
                    (t) => t.assigneeId === member.userId,
                  );
                  const memberPoints = memberTasks.reduce(
                    (sum, t) => sum + (t.storyPoints ?? 0),
                    0,
                  );
                  const memberDone = memberTasks
                    .filter((t) => t.status === "DONE")
                    .reduce((sum, t) => sum + (t.storyPoints ?? 0), 0);
                  const initials = `${member.user.firstName?.[0] || ""}${
                    member.user.lastName?.[0] || ""
                  }`.toUpperCase();

                  const percentOfTotal =
                    totalPoints > 0
                      ? Math.round((memberPoints / totalPoints) * 100)
                      : 0;

                  return (
                    <div key={member.userId}>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-700">
                            {initials || "U"}
                          </div>
                          <span className="truncate text-sm font-medium text-slate-700">
                            {member.user.firstName} {member.user.lastName}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-slate-700">
                          {memberPoints} pts
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-blue-500"
                          style={{ width: `${percentOfTotal}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-slate-400">
                        {memberDone} points completed ({memberTasks.length} tasks)
                      </p>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-400">
                  No project members found.
                </p>
              )}
            </div>

            <p className="mt-5 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-400">
              Workload is calculated from live sprint tasks and assigned story
              points.
=======
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
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
            </p>
          </Card>
        </div>

<<<<<<< HEAD
        {/* Task board & Backlog switcher */}
        <Card className="overflow-hidden">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:p-6 xl:flex-row xl:items-center">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold">Tasks</h2>
                <div className="flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setScopeFilter("sprint")}
                    className={`rounded px-2.5 py-1 transition ${
                      scopeFilter === "sprint"
                        ? "bg-white text-blue-700 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Sprint Tasks ({sprintTasks.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setScopeFilter("all")}
                    className={`rounded px-2.5 py-1 transition ${
                      scopeFilter === "all"
                        ? "bg-white text-blue-700 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    All Project Tasks ({tasks.length})
                  </button>
                </div>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {scopeFilter === "sprint"
                  ? "Move tasks through the current sprint workflow."
                  : "View all tasks across this project including the backlog."}
=======
        {/* Task board */}
        <Card className="overflow-hidden">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:p-6 xl:flex-row xl:items-center">
            <div>
              <h2 className="text-lg font-bold">Sprint task board</h2>
              <p className="mt-1 text-sm text-slate-500">
                Move tasks through the sprint workflow.
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
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
<<<<<<< HEAD
                placeholder="Search tasks by title or assignee..."
=======
                placeholder="Search tasks or assignees..."
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
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
<<<<<<< HEAD
                <option value="Urgent">Urgent</option>
=======
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
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
<<<<<<< HEAD
                    status: "To Do" as UiTaskColumn,
                    subtitle: "Ready to start",
                  },
                  {
                    status: "In Progress" as UiTaskColumn,
                    subtitle: "Currently underway",
                  },
                  {
                    status: "Done" as UiTaskColumn,
=======
                    status: "To Do" as TaskStatus,
                    subtitle: "Ready to start",
                  },
                  {
                    status: "In Progress" as TaskStatus,
                    subtitle: "Currently underway",
                  },
                  {
                    status: "Done" as TaskStatus,
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
                    subtitle: "Completed work",
                  },
                ] as const
              ).map((column) => {
                const columnTasks = filteredTasks.filter(
<<<<<<< HEAD
                  (task) => mapApiStatusToColumn(task.status) === column.status,
=======
                  (task) => task.status === column.status,
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
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
<<<<<<< HEAD
                        const priorityUi = mapApiPriorityToUi(task.priority);
                        const PriorityIcon = priorityConfig[priorityUi].icon;
                        const assigneeUser = task.assigneeId
                          ? memberMap.get(task.assigneeId)
                          : null;
                        const assigneeName = assigneeUser
                          ? `${assigneeUser.firstName} ${assigneeUser.lastName}`
                          : "Unassigned";
                        const initials = assigneeUser
                          ? `${assigneeUser.firstName?.[0] || ""}${
                              assigneeUser.lastName?.[0] || ""
                            }`.toUpperCase()
                          : "?";

                        const currentColumn = mapApiStatusToColumn(task.status);
=======
                        const PriorityIcon =
                          priorityConfig[task.priority].icon;
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c

                        return (
                          <article
                            key={task.id}
                            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-xs font-semibold text-blue-600">
<<<<<<< HEAD
                                {task.id.slice(0, 8)}
                              </span>
                              <div className="flex items-center gap-1">
                                {activeSprint &&
                                  (task.sprintId === activeSprint.id ? (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleAssignToSprint(task.id, null)
                                      }
                                      title="Remove from sprint to backlog"
                                      className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 hover:bg-slate-100"
                                    >
                                      Backlog
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleAssignToSprint(
                                          task.id,
                                          activeSprint.id,
                                        )
                                      }
                                      title="Assign to current sprint"
                                      className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 hover:bg-blue-100"
                                    >
                                      + Sprint
                                    </button>
                                  ))}
                              </div>
=======
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
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
                            </div>

                            <h3 className="mt-2 text-sm font-semibold leading-5 text-slate-900">
                              {task.title}
                            </h3>
<<<<<<< HEAD
                            <p className="mt-1 text-xs text-slate-500">
                              {currentProject?.name || "Project"}
=======
                            <p className="mt-2 text-xs text-slate-500">
                              {task.project}
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
                            </p>

                            <div className="mt-4 flex flex-wrap items-center gap-2">
                              <span
<<<<<<< HEAD
                                className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold ${priorityConfig[priorityUi].color} bg-slate-50`}
                              >
                                <PriorityIcon size={12} />
                                {priorityUi}
                              </span>
                              <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
                                {task.storyPoints ?? 0} pts
=======
                                className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold ${priorityConfig[task.priority].color} bg-slate-50`}
                              >
                                <PriorityIcon size={12} />
                                {task.priority}
                              </span>
                              <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
                                {task.points} pts
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
                              </span>
                            </div>

                            <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                              <div className="flex min-w-0 items-center gap-2">
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-[10px] font-bold text-indigo-700">
<<<<<<< HEAD
                                  {initials}
                                </div>
                                <span className="truncate text-xs text-slate-600">
                                  {assigneeName}
                                </span>
                              </div>
                              <span className="shrink-0 text-[11px] text-slate-400">
                                {formatSprintDate(task.dueDate)}
=======
                                  {task.initials}
                                </div>
                                <span className="truncate text-xs text-slate-600">
                                  {task.assignee}
                                </span>
                              </div>
                              <span className="shrink-0 text-[11px] text-slate-400">
                                {task.due}
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
                              </span>
                            </div>

                            <div className="mt-3">
                              <label className="sr-only">
                                Update task status
                              </label>
                              <select
<<<<<<< HEAD
                                value={currentColumn}
                                onChange={(event) =>
                                  handleMoveTask(
                                    task.id,
                                    event.target.value as UiTaskColumn,
=======
                                value={task.status}
                                onChange={(event) =>
                                  moveTask(
                                    task.id,
                                    event.target.value as TaskStatus,
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
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
<<<<<<< HEAD
                    const priorityUi = mapApiPriorityToUi(task.priority);
                    const PriorityIcon = priorityConfig[priorityUi].icon;
                    const assigneeUser = task.assigneeId
                      ? memberMap.get(task.assigneeId)
                      : null;
                    const assigneeName = assigneeUser
                      ? `${assigneeUser.firstName} ${assigneeUser.lastName}`
                      : "Unassigned";

                    const currentColumn = mapApiStatusToColumn(task.status);
=======
                    const PriorityIcon =
                      priorityConfig[task.priority].icon;
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c

                    return (
                      <tr key={task.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <p className="text-xs font-semibold text-blue-600">
<<<<<<< HEAD
                            {task.id.slice(0, 8)}
=======
                            {task.id}
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-800">
                            {task.title}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
<<<<<<< HEAD
                            {currentProject?.name}
                          </p>
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-600">
                          {assigneeName}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-semibold ${priorityConfig[priorityUi].color}`}
                          >
                            <PriorityIcon size={13} />
                            {priorityUi}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm font-semibold">
                          {task.storyPoints ?? 0}
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-500">
                          {formatSprintDate(task.dueDate)}
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={currentColumn}
                            onChange={(event) =>
                              handleMoveTask(
                                task.id,
                                event.target.value as UiTaskColumn,
                              )
                            }
                            className={`rounded-lg border-0 px-3 py-2 text-xs font-semibold outline-none ${statusConfig[currentColumn].color}`}
=======
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
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
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
<<<<<<< HEAD
              Showing {filteredTasks.length} of {scopedTasks.length} tasks
            </span>
            <span>Synchronized with PostgreSQL</span>
          </div>
        </Card>

        {/* Sprint workflow explanation */}
=======
              Showing {filteredTasks.length} of {tasks.length} tasks
            </span>
            <span>Changes are held locally in this demo</span>
          </div>
        </Card>

        {/* Sprint workflow */}
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
        <Card className="p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-violet-50 p-3 text-violet-600">
              <Flag size={21} />
            </div>
            <div>
              <h2 className="text-lg font-bold">Sprint workflow</h2>
              <p className="mt-1 text-sm text-slate-500">
<<<<<<< HEAD
                The iteration lifecycle backed by DevSync AI.
=======
                A simple view of the iteration lifecycle.
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              {
                title: "Plan",
<<<<<<< HEAD
                description:
                  "Define the sprint goal, capacity, and assign backlog tasks.",
=======
                description: "Define the sprint goal and select backlog tasks.",
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
                number: "01",
              },
              {
                title: "Execute",
<<<<<<< HEAD
                description:
                  "Start the sprint, track progress, and update task statuses.",
                number: "02",
              },
              {
                title: "Complete",
                description:
                  "Complete the sprint, evaluate velocity, and carry over unfinished work.",
=======
                description: "Track progress, ownership, and delivery blockers.",
                number: "02",
              },
              {
                title: "Review",
                description: "Review completed work and carry forward unfinished tasks.",
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
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
<<<<<<< HEAD
                handleCreateTask(new FormData(event.currentTarget));
=======
                addTask(new FormData(event.currentTarget));
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
              }}
              className="my-auto w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 p-5 sm:p-6">
                <div>
                  <h2 className="text-xl font-bold">Add sprint task</h2>
                  <p className="mt-1 text-sm text-slate-500">
<<<<<<< HEAD
                    Create a task for the current project and sprint.
=======
                    Create a task for this demo sprint.
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
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
<<<<<<< HEAD
                    Assignee
                  </span>
                  <select
                    name="assigneeId"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-blue-400"
                  >
                    <option value="">Unassigned</option>
                    {projectMembers.map((m) => (
                      <option key={m.userId} value={m.userId}>
                        {m.user.firstName} {m.user.lastName} (@{m.user.username})
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="mb-1.5 block text-sm font-semibold">
                    Sprint
                  </span>
                  <select
                    name="sprintId"
                    defaultValue={activeSprint?.id || ""}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-blue-400"
                  >
                    <option value="">No sprint (Backlog)</option>
                    {sprints.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
=======
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
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
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
<<<<<<< HEAD
                    <option value="Urgent">Urgent</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
=======
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
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
<<<<<<< HEAD
                    type="date"
=======
                    placeholder="e.g. Nov 05"
                    maxLength={30}
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
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
<<<<<<< HEAD
                  disabled={taskCreating}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {taskCreating && (
                    <Loader2 size={16} className="animate-spin" />
                  )}
=======
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
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
<<<<<<< HEAD
                handleCreateSprint(new FormData(event.currentTarget));
=======
                addSprint(new FormData(event.currentTarget));
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
              }}
              className="my-auto w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 p-5 sm:p-6">
                <div>
                  <h2 className="text-xl font-bold">Create a sprint</h2>
                  <p className="mt-1 text-sm text-slate-500">
<<<<<<< HEAD
                    Add a new iteration to {currentProject?.name || "the project"}.
=======
                    Add an iteration to your sprint selector.
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
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
<<<<<<< HEAD
                    placeholder="e.g. Sprint 11 · Core API Stabilization"
=======
                    placeholder="e.g. Sprint 11 · New Features"
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-blue-400"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold">
<<<<<<< HEAD
                    Sprint goal (optional)
                  </span>
                  <input
                    name="goal"
                    maxLength={250}
                    placeholder="e.g. Complete authentication flow and deliver MVP dashboard"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-blue-400"
                  />
                </label>
                <div className="grid grid-cols-2 gap-4">
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
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold">
                    Capacity (points, optional)
                  </span>
                  <input
                    name="capacity"
                    type="number"
                    min={0}
                    placeholder="e.g. 40"
=======
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
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
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
<<<<<<< HEAD
                  disabled={sprintCreating}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {sprintCreating && (
                    <Loader2 size={16} className="animate-spin" />
                  )}
=======
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
                  Create sprint
                </button>
              </div>
            </form>
          </div>
        )}
<<<<<<< HEAD

        {/* AI Sprint Planner Modal */}
        {showAiModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setShowAiModal(false);
            }}
          >
            <div className="my-auto w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-violet-100 p-2 text-violet-700">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">AI Sprint Planner</h2>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Generate intelligent sprint breakdown, scope, and priority recommendations
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAiModal(false)}
                  aria-label="Close AI planner modal"
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                >
                  <X size={19} />
                </button>
              </div>

              <div className="space-y-4 p-5 sm:p-6">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold">
                    Sprint Goal (optional)
                  </label>
                  <input
                    value={aiGoal}
                    onChange={(e) => setAiGoal(e.target.value)}
                    placeholder="e.g. Complete authentication & ship initial MVP dashboard"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-violet-400"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold">
                    Sprint Duration (days)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={aiDuration}
                    onChange={(e) => setAiDuration(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-violet-400"
                  />
                </div>

                {generatingAiPlan && (
                  <div className="flex items-center justify-center gap-3 rounded-xl border border-violet-100 bg-violet-50/60 p-6 text-sm font-medium text-violet-700">
                    <Loader2 size={20} className="animate-spin" />
                    Analyzing project issues and engineering velocity…
                  </div>
                )}

                {aiPlanResult && !generatingAiPlan && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <h3 className="mb-2 text-sm font-bold text-slate-900">
                      Recommended Sprint Plan:
                    </h3>
                    <div className="max-h-72 overflow-y-auto whitespace-pre-wrap text-xs leading-relaxed text-slate-700">
                      {aiPlanResult}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 p-5 sm:flex-row sm:justify-end sm:px-6">
                <button
                  type="button"
                  onClick={() => setShowAiModal(false)}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={generatingAiPlan}
                  onClick={handleGenerateSprintPlan}
                  className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
                >
                  {generatingAiPlan ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Sparkles size={16} />
                  )}
                  {generatingAiPlan ? "Generating Plan…" : "Generate AI Plan"}
                </button>
              </div>
            </div>
          </div>
        )}
=======
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
      </div>
    </div>
  );
}
