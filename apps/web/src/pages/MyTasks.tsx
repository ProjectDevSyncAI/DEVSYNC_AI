<<<<<<< HEAD
import { useEffect, useMemo, useState, type FormEvent } from "react";
=======

import { useMemo, useState, type FormEvent } from "react";
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
import {
  Search,
  Plus,
  ListTodo,
  Clock3,
<<<<<<< HEAD
=======
  CircleCheck,
  AlertCircle,
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
  CalendarDays,
  MoreHorizontal,
  LayoutGrid,
  List,
<<<<<<< HEAD
  Columns3,
  X,
  Flag,
  FolderKanban,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Building,
  User,
} from "lucide-react";
import {
  taskApi,
  projectApi,
  organizationApi,
  type Task as ApiTask,
  type TaskStatus as ApiStatus,
  type TaskPriority as ApiPriority,
  type Project,
  type ProjectMemberInfo,
  type Organization,
} from "../lib/api";

type UiTaskStatus = "Todo" | "In Progress" | "In Review" | "Completed";
type UiTaskPriority = "Low" | "Medium" | "High" | "Urgent";

interface DisplayTask {
  id: string;
  title: string;
  description: string;
  projectId: string;
  projectName: string;
  projectKey: string;
  status: UiTaskStatus;
  rawStatus: ApiStatus;
  priority: UiTaskPriority;
  rawPriority: ApiPriority;
  dueDate: string;
  assigneeName: string;
  assigneeId?: string | null;
  assigneeInitials: string;
  tag: string;
}

function mapApiStatusToUi(rawStatus?: string): UiTaskStatus {
  switch (rawStatus) {
    case "IN_PROGRESS":
      return "In Progress";
    case "IN_REVIEW":
    case "REVIEW":
      return "In Review";
    case "DONE":
      return "Completed";
    case "TODO":
    case "BLOCKED":
    case "CANCELLED":
    default:
      return "Todo";
  }
}

function mapUiStatusToApi(uiStatus: UiTaskStatus): ApiStatus {
  switch (uiStatus) {
    case "In Progress":
      return "IN_PROGRESS";
    case "In Review":
      return "IN_REVIEW";
    case "Completed":
      return "DONE";
    case "Todo":
    default:
      return "TODO";
  }
}

function mapApiPriorityToUi(rawPriority?: string): UiTaskPriority {
  switch (rawPriority) {
    case "LOW":
      return "Low";
    case "HIGH":
      return "High";
    case "URGENT":
      return "Urgent";
    case "MEDIUM":
    default:
      return "Medium";
  }
}

function mapUiPriorityToApi(uiPriority: UiTaskPriority): ApiPriority {
  switch (uiPriority) {
    case "Low":
      return "LOW";
    case "High":
      return "HIGH";
    case "Urgent":
      return "URGENT";
    case "Medium":
    default:
      return "MEDIUM";
  }
}

const statusStyles: Record<UiTaskStatus, string> = {
=======
  X,
  Flag,
  Check,
  SlidersHorizontal,
} from "lucide-react";

type TaskStatus = "Todo" | "In Progress" | "In Review" | "Completed";
type TaskPriority = "Low" | "Medium" | "High" | "Urgent";

type Task = {
  id: number;
  title: string;
  description: string;
  project: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  assignee: string;
  tag: string;
};

const initialTasks: Task[] = [
  {
    id: 1,
    title: "Design dashboard analytics",
    description: "Create charts and KPI cards for the main dashboard.",
    project: "DevSync AI",
    status: "In Progress",
    priority: "High",
    dueDate: "2026-10-29",
    assignee: "DM",
    tag: "Design",
  },
  {
    id: 2,
    title: "Implement authentication flow",
    description: "Connect login, registration, and token handling.",
    project: "Core Platform",
    status: "In Review",
    priority: "Urgent",
    dueDate: "2026-10-28",
    assignee: "AK",
    tag: "Backend",
  },
  {
    id: 3,
    title: "Fix responsive sidebar",
    description: "Improve navigation behavior on smaller screens.",
    project: "DevSync AI",
    status: "Todo",
    priority: "Medium",
    dueDate: "2026-10-31",
    assignee: "DM",
    tag: "Frontend",
  },
  {
    id: 4,
    title: "Write API documentation",
    description: "Document endpoints and example request payloads.",
    project: "Core Platform",
    status: "Todo",
    priority: "Low",
    dueDate: "2026-11-03",
    assignee: "RS",
    tag: "Documentation",
  },
  {
    id: 5,
    title: "Test project creation",
    description: "Verify project creation and validation behavior.",
    project: "DevSync AI",
    status: "Completed",
    priority: "Medium",
    dueDate: "2026-10-25",
    assignee: "DM",
    tag: "Testing",
  },
  {
    id: 6,
    title: "Review sprint progress",
    description: "Check sprint tasks and update their current status.",
    project: "Sprint Planning",
    status: "In Progress",
    priority: "High",
    dueDate: "2026-10-30",
    assignee: "DM",
    tag: "Planning",
  },
];

const statusStyles: Record<TaskStatus, string> = {
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
  Todo: "bg-slate-100 text-slate-700",
  "In Progress": "bg-blue-50 text-blue-700",
  "In Review": "bg-violet-50 text-violet-700",
  Completed: "bg-emerald-50 text-emerald-700",
};

<<<<<<< HEAD
const priorityStyles: Record<UiTaskPriority, string> = {
=======
const priorityStyles: Record<TaskPriority, string> = {
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
  Low: "text-slate-500",
  Medium: "text-blue-600",
  High: "text-orange-600",
  Urgent: "text-rose-600",
};

<<<<<<< HEAD
const statuses: UiTaskStatus[] = [
=======
const statuses: TaskStatus[] = [
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
  "Todo",
  "In Progress",
  "In Review",
  "Completed",
];

<<<<<<< HEAD
const priorities: UiTaskPriority[] = ["Low", "Medium", "High", "Urgent"];

function formatDate(date: string) {
  if (!date) return "No due date";
  try {
    return new Date(date).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return date;
  }
}

function isOverdue(task: DisplayTask) {
  if (!task.dueDate || task.status === "Completed") return false;
  try {
    return new Date(task.dueDate) < new Date();
  } catch {
    return false;
  }
}

export default function MyTasks() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("ALL");
  const [projectMembers, setProjectMembers] = useState<ProjectMemberInfo[]>([]);

  const [tasks, setTasks] = useState<DisplayTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [view, setView] = useState<"board" | "list" | "grid">("board");

  // Drag and drop state
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<UiTaskStatus | null>(null);
  const [isMoving, setIsMoving] = useState(false);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form fields
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formProjectId, setFormProjectId] = useState("");
  const [formStatus, setFormStatus] = useState<UiTaskStatus>("Todo");
  const [formPriority, setFormPriority] = useState<UiTaskPriority>("Medium");
  const [formAssigneeId, setFormAssigneeId] = useState("");
  const [formDueDate, setFormDueDate] = useState("");
  const [formError, setFormError] = useState("");

  // Load organizations on mount
  useEffect(() => {
    async function init() {
      try {
        const orgList = await organizationApi.list();
        setOrganizations(orgList || []);
        if (orgList && orgList.length > 0) {
          setSelectedOrgId(orgList[0].id);
        }
      } catch (err: any) {
        setError(err?.message || "Failed to load organizations.");
      }
    }
    init();
  }, []);

  // Load projects whenever organization changes
  useEffect(() => {
    if (!selectedOrgId) {
      setProjects([]);
      setSelectedProjectId("ALL");
      return;
    }

    async function loadProjects(orgId: string) {
      try {
        const projList = await projectApi.list(orgId);
        setProjects(projList || []);
        setSelectedProjectId("ALL");
      } catch (err: any) {
        setError(err?.message || "Failed to load projects for organization.");
        setProjects([]);
      }
    }

    loadProjects(selectedOrgId);
  }, [selectedOrgId]);

  // Load tasks whenever selected project changes
  async function loadTasks() {
    setLoading(true);
    setError(null);

    // Stale state prevention: clear tasks before fetching new project data
    setTasks([]);

    try {
      const targetProjectId = selectedProjectId === "ALL" ? undefined : selectedProjectId;
      const apiTasks = await taskApi.list(targetProjectId);

      const mapped: DisplayTask[] = (apiTasks || []).map((t) => {
        const uiStatus = mapApiStatusToUi(t.status);
        const uiPriority = mapApiPriorityToUi(t.priority);

        let assigneeName = "Unassigned";
        let assigneeInitials = "—";
        if (t.assignee) {
          const u = t.assignee;
          assigneeName = [u.firstName, u.lastName].filter(Boolean).join(" ") || u.username || "Member";
          assigneeInitials = (u.firstName?.[0] ? u.firstName[0] + (u.lastName?.[0] || "") : u.username?.slice(0, 2) || "U").toUpperCase();
        }

        return {
          id: t.id,
          title: t.title,
          description: t.description ?? "",
          projectId: t.projectId,
          projectName: t.project?.name ?? "Project",
          projectKey: t.project?.key ?? "PRJ",
          status: uiStatus,
          rawStatus: t.status,
          priority: uiPriority,
          rawPriority: t.priority,
          dueDate: t.dueDate ? t.dueDate.slice(0, 10) : "",
          assigneeName,
          assigneeId: t.assigneeId,
          assigneeInitials,
          tag: t.project?.key || "General",
        };
      });

      setTasks(mapped);
    } catch (err: any) {
      setError(err?.message || "Failed to load tasks from server.");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTasks();
  }, [selectedProjectId, selectedOrgId]);

  // Load members when a specific project is selected in the modal
  useEffect(() => {
    if (!formProjectId) {
      setProjectMembers([]);
      return;
    }

    async function loadMembers(pId: string) {
      try {
        const members = await projectApi.getMembers(pId);
        setProjectMembers(members || []);
      } catch {
        setProjectMembers([]);
      }
    }

    loadMembers(formProjectId);
  }, [formProjectId]);

  // Drag and drop handlers with OPTIMISTIC UPDATE + RELIABLE ROLLBACK
  function handleDragStart(e: React.DragEvent, id: string) {
    if (isMoving) return;
    e.dataTransfer.setData("text/plain", id);
    setDraggedTaskId(id);
  }

  function handleDragOver(e: React.DragEvent, status: UiTaskStatus) {
    e.preventDefault();
    if (dragOverColumn !== status) {
      setDragOverColumn(status);
    }
  }

  function handleDragLeave() {
    setDragOverColumn(null);
  }

  async function handleDrop(e: React.DragEvent, targetStatus: UiTaskStatus) {
    e.preventDefault();
    setDragOverColumn(null);

    const rawId = e.dataTransfer.getData("text/plain") || draggedTaskId;
    setDraggedTaskId(null);

    if (!rawId || isMoving) return;

    const targetTask = tasks.find((t) => t.id === rawId);
    if (!targetTask || targetTask.status === targetStatus) return;

    const previousStatus = targetTask.status;
    const targetApiStatus = mapUiStatusToApi(targetStatus);

    // 1. Optimistic update
    setTasks((current) =>
      current.map((t) =>
        t.id === rawId ? { ...t, status: targetStatus, rawStatus: targetApiStatus } : t
      )
    );

    setIsMoving(true);
    try {
      // 2. Call backend move endpoint
      await taskApi.move(rawId, { status: targetApiStatus });
      setNotice(`Task "${targetTask.title}" moved to ${targetStatus}.`);
    } catch (err: any) {
      // 3. Reliable rollback on failure!
      setTasks((current) =>
        current.map((t) =>
          t.id === rawId
            ? { ...t, status: previousStatus, rawStatus: mapUiStatusToApi(previousStatus) }
            : t
        )
      );
      setNotice(`Failed to move task: ${err?.message || "Operation rejected by server."}`);
    } finally {
      setIsMoving(false);
    }
  }

  const completedCount = tasks.filter((t) => t.status === "Completed").length;
  const inProgressCount = tasks.filter((t) => t.status === "In Progress").length;
=======
const priorities: TaskPriority[] = ["Low", "Medium", "High", "Urgent"];

const emptyForm = {
  title: "",
  description: "",
  project: "DevSync AI",
  status: "Todo" as TaskStatus,
  priority: "Medium" as TaskPriority,
  dueDate: "",
  tag: "Frontend",
};

function formatDate(date: string) {
  if (!date) return "No due date";

  return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function isOverdue(task: Task) {
  if (!task.dueDate || task.status === "Completed") return false;

  return task.dueDate < new Date().toLocaleDateString("en-CA");
}

export default function MyTasks() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [view, setView] = useState<"list" | "grid">("list");
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  const completedCount = tasks.filter(
    (task) => task.status === "Completed"
  ).length;
  const activeCount = tasks.filter(
    (task) => task.status === "In Progress"
  ).length;
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
  const overdueCount = tasks.filter(isOverdue).length;

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tasks.filter((task) => {
      const matchesSearch =
        !query ||
        task.title.toLowerCase().includes(query) ||
        task.description.toLowerCase().includes(query) ||
<<<<<<< HEAD
        task.projectName.toLowerCase().includes(query) ||
        task.projectKey.toLowerCase().includes(query) ||
        task.assigneeName.toLowerCase().includes(query);
=======
        task.project.toLowerCase().includes(query) ||
        task.tag.toLowerCase().includes(query);
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c

      const matchesStatus =
        statusFilter === "All" || task.status === statusFilter;

      const matchesPriority =
        priorityFilter === "All" || task.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tasks, search, statusFilter, priorityFilter]);

<<<<<<< HEAD
  function resetForm() {
    setFormTitle("");
    setFormDescription("");
    setFormProjectId(
      selectedProjectId !== "ALL"
        ? selectedProjectId
        : projects[0]?.id || ""
    );
    setFormStatus("Todo");
    setFormPriority("Medium");
    setFormAssigneeId("");
    setFormDueDate("");
    setEditingTaskId(null);
    setFormError("");
  }

  function openCreateModal(initialStatus?: UiTaskStatus) {
    resetForm();
    if (initialStatus) {
      setFormStatus(initialStatus);
    }
    setShowModal(true);
  }

  function openEditModal(task: DisplayTask) {
    setEditingTaskId(task.id);
    setFormTitle(task.title);
    setFormDescription(task.description);
    setFormProjectId(task.projectId);
    setFormStatus(task.status);
    setFormPriority(task.priority);
    setFormAssigneeId(task.assigneeId || "");
    setFormDueDate(task.dueDate || "");
    setFormError("");
    setShowModal(true);
  }

  async function handleSaveTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    const title = formTitle.trim();
    if (!title) {
      setFormError("Task title is required.");
      return;
    }

    if (!formProjectId) {
      setFormError("Please select a target project.");
      return;
    }

    setIsSubmitting(true);
    const apiStatus = mapUiStatusToApi(formStatus);
    const apiPriority = mapUiPriorityToApi(formPriority);

    try {
      if (editingTaskId) {
        // Update task
        await taskApi.update(editingTaskId, {
          title,
          description: formDescription.trim() || undefined,
          status: apiStatus,
          priority: apiPriority,
          assigneeId: formAssigneeId || null,
          dueDate: formDueDate || null,
        });

        setNotice(`Task updated successfully.`);
      } else {
        // Create task
        await taskApi.create({
          projectId: formProjectId,
          title,
          description: formDescription.trim() || undefined,
          status: apiStatus,
          priority: apiPriority,
          assigneeId: formAssigneeId || undefined,
          dueDate: formDueDate || undefined,
        });

        setNotice(`Task "${title}" created successfully.`);
      }

      setShowModal(false);
      resetForm();
      await loadTasks();
    } catch (err: any) {
      setFormError(err?.message || "Failed to save task. Please verify inputs.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteTask(taskId: string) {
    if (!window.confirm("Are you sure you want to delete this task?")) return;

    try {
      await taskApi.remove(taskId);
      setTasks((current) => current.filter((t) => t.id !== taskId));
      setNotice("Task deleted successfully.");
    } catch (err: any) {
      setNotice(`Failed to delete task: ${err?.message || "Server error"}`);
    }
=======
  function openCreateModal() {
    setEditingTask(null);
    setForm(emptyForm);
    setError("");
    setShowModal(true);
  }

  function openEditModal(task: Task) {
    setEditingTask(task);
    setForm({
      title: task.title,
      description: task.description,
      project: task.project,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      tag: task.tag,
    });
    setError("");
    setShowModal(true);
  }

  function saveTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.title.trim()) {
      setError("Please enter a task title.");
      return;
    }

    if (editingTask) {
      setTasks((current) =>
        current.map((task) =>
          task.id === editingTask.id
            ? { ...task, ...form, title: form.title.trim() }
            : task
        )
      );
    } else {
      const newTask: Task = {
        ...form,
        title: form.title.trim(),
        id: Math.max(0, ...tasks.map((task) => task.id)) + 1,
        assignee: "DM",
      };

      setTasks((current) => [newTask, ...current]);
    }

    setShowModal(false);
    setEditingTask(null);
    setForm(emptyForm);
    setError("");
  }

  function updateStatus(id: number, status: TaskStatus) {
    setTasks((current) =>
      current.map((task) =>
        task.id === id ? { ...task, status } : task
      )
    );
  }

  function deleteTask(id: number) {
    if (!window.confirm("Are you sure you want to delete this task?")) {
      return;
    }

    setTasks((current) => current.filter((task) => task.id !== id));
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
  }

  return (
    <div className="min-h-screen space-y-6 bg-slate-50/70 p-4 text-slate-800 sm:p-6 lg:p-8">
<<<<<<< HEAD
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
            <FolderKanban size={15} className="text-blue-600" />
            <span>TASKS & KANBAN</span>
=======
      {/* Page heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
            <span>Workspace</span>
            <span>/</span>
            <span className="font-medium text-slate-700">My Tasks</span>
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            My Tasks
          </h1>

          <p className="mt-1 text-sm text-slate-500">
<<<<<<< HEAD
            Track real team deliveries, move cards between sprint states, and inspect priorities.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Organization & Project Context Switcher */}
          {projects.length > 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm">
              <FolderKanban size={14} className="text-slate-500" />
              <label htmlFor="tasks-project-select" className="sr-only">Filter by project</label>
              <select
                id="tasks-project-select"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="bg-transparent font-semibold text-slate-800 outline-none cursor-pointer"
              >
                <option value="ALL">All Projects ({projects.length})</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.key || "PRJ"}] {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            onClick={() => openCreateModal()}
            disabled={projects.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
          >
            <Plus size={16} />
            Create task
          </button>
        </div>
      </div>

      {/* Notice Banner */}
      {notice && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900"
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-blue-600 shrink-0" />
            {notice}
          </span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-xs font-semibold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Loading & Error States */}
      {loading && (
        <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-12 text-sm text-slate-500">
          <Loader2 className="animate-spin text-blue-600" size={20} />
          <span>Synchronizing tasks with backend API...</span>
        </div>
      )}

      {!loading && error && (
        <div className="flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-red-600 shrink-0" size={20} />
            <div>
              <p className="font-semibold">Error Loading Tasks</p>
              <p className="text-xs text-red-600 mt-0.5">{error}</p>
            </div>
          </div>
          <button
            onClick={loadTasks}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
          >
            <RefreshCw size={13} />
            Retry
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Total tasks</p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                {tasks.length}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Across filtered scope</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <ListTodo size={22} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">In Progress</p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                {inProgressCount}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Active execution</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
              <Clock3 size={22} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Completed</p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                {completedCount}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Marked DONE</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={22} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Overdue items</p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                {overdueCount}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Past target date</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <AlertTriangle size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* Directory & Board Container */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Toolbar */}
        <div className="border-b border-slate-100 p-4 sm:p-5">
          <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
            <div>
              <h2 className="text-base font-bold text-slate-900">Task Board</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Showing {filteredTasks.length} of {tasks.length} tasks
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <div className="relative sm:w-64">
                <Search
                  size={15}
=======
            Organize your work, track progress, and stay on schedule.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <Plus size={18} />
          Create task
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total tasks"
          value={tasks.length}
          subtitle="Tasks in your workspace"
          icon={<ListTodo size={20} />}
          iconClass="bg-blue-50 text-blue-600"
        />

        <SummaryCard
          title="In progress"
          value={activeCount}
          subtitle="Currently being worked on"
          icon={<Clock3 size={20} />}
          iconClass="bg-violet-50 text-violet-600"
        />

        <SummaryCard
          title="Completed"
          value={completedCount}
          subtitle="Successfully finished"
          icon={<CircleCheck size={20} />}
          iconClass="bg-emerald-50 text-emerald-600"
        />

        <SummaryCard
          title="Overdue"
          value={overdueCount}
          subtitle="Past their due date"
          icon={<AlertCircle size={20} />}
          iconClass="bg-rose-50 text-rose-600"
        />
      </div>

      {/* Task workspace */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-4 sm:p-5">
          <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Your task list
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {filteredTasks.length} of {tasks.length} tasks displayed
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative min-w-0 sm:w-64">
                <Search
                  size={17}
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
<<<<<<< HEAD
                  placeholder="Search tasks, assignees..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
=======
                  placeholder="Search tasks..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
<<<<<<< HEAD
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-blue-400"
=======
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400"
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
                aria-label="Filter by status"
              >
                <option value="All">All statuses</option>
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>

              <select
                value={priorityFilter}
                onChange={(event) => setPriorityFilter(event.target.value)}
<<<<<<< HEAD
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-blue-400"
=======
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400"
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
                aria-label="Filter by priority"
              >
                <option value="All">All priorities</option>
                {priorities.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority} priority
                  </option>
                ))}
              </select>

<<<<<<< HEAD
              <div className="flex rounded-xl border border-slate-200 p-0.5">
                <button
                  type="button"
                  onClick={() => setView("board")}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${
                    view === "board"
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Columns3 size={14} />
                  <span>Board</span>
                </button>
                <button
                  type="button"
                  onClick={() => setView("list")}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${
                    view === "list"
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <List size={14} />
                  <span>List</span>
                </button>
                <button
                  type="button"
                  onClick={() => setView("grid")}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${
                    view === "grid"
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <LayoutGrid size={14} />
                  <span>Grid</span>
=======
              <div className="flex rounded-xl border border-slate-200 p-1">
                <button
                  onClick={() => setView("list")}
                  aria-label="List view"
                  className={`rounded-lg p-2 ${
                    view === "list"
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-400 hover:text-slate-700"
                  }`}
                >
                  <List size={18} />
                </button>
                <button
                  onClick={() => setView("grid")}
                  aria-label="Grid view"
                  className={`rounded-lg p-2 ${
                    view === "grid"
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-400 hover:text-slate-700"
                  }`}
                >
                  <LayoutGrid size={18} />
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
                </button>
              </div>
            </div>
          </div>
        </div>

<<<<<<< HEAD
        {/* Empty State */}
        {!loading && filteredTasks.length === 0 ? (
=======
        {filteredTasks.length === 0 ? (
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <div className="mb-4 rounded-2xl bg-slate-100 p-4 text-slate-500">
              <ListTodo size={28} />
            </div>
<<<<<<< HEAD
            <h3 className="font-semibold text-slate-900 text-sm">No tasks found</h3>
            <p className="mt-1 max-w-sm text-xs text-slate-500">
              {tasks.length === 0
                ? "No tasks exist in this project yet. Create your first task to get started."
                : "Try adjusting your search query or filters."}
            </p>
            {tasks.length === 0 && projects.length > 0 && (
              <button
                type="button"
                onClick={() => openCreateModal()}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
              >
                <Plus size={15} />
                Create Task
              </button>
            )}
          </div>
        ) : view === "board" ? (
          /* Kanban Board View */
          <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2 xl:grid-cols-4 bg-slate-50/50">
            {(
              [
                {
                  status: "Todo" as UiTaskStatus,
                  label: "To Do",
                  topColor: "border-t-slate-400",
                  badgeBg: "bg-slate-200 text-slate-700",
                },
                {
                  status: "In Progress" as UiTaskStatus,
                  label: "In Progress",
                  topColor: "border-t-blue-500",
                  badgeBg: "bg-blue-100 text-blue-800",
                },
                {
                  status: "In Review" as UiTaskStatus,
                  label: "In Review",
                  topColor: "border-t-violet-500",
                  badgeBg: "bg-violet-100 text-violet-800",
                },
                {
                  status: "Completed" as UiTaskStatus,
                  label: "Done",
                  topColor: "border-t-emerald-500",
                  badgeBg: "bg-emerald-100 text-emerald-800",
                },
              ] as const
            ).map((col) => {
              const colTasks = filteredTasks.filter((t) => t.status === col.status);
              const isOver = dragOverColumn === col.status;

              return (
                <div
                  key={col.status}
                  onDragOver={(e) => handleDragOver(e, col.status)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, col.status)}
                  className={`flex flex-col rounded-2xl border-t-4 ${col.topColor} border border-slate-200 bg-slate-100/70 p-3 transition-colors ${
                    isOver ? "bg-blue-50/80 ring-2 ring-blue-400 ring-offset-2" : ""
                  }`}
                >
                  {/* Column Header */}
                  <div className="mb-3 flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">{col.label}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${col.badgeBg}`}>
                        {colTasks.length}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => openCreateModal(col.status)}
                      className="rounded-lg p-1 text-slate-500 transition hover:bg-white hover:text-blue-600"
                      title={`Add task to ${col.label}`}
                    >
                      <Plus size={15} />
                    </button>
                  </div>

                  {/* Task Cards */}
                  <div className="flex-1 space-y-3 overflow-y-auto max-h-[75vh] pr-0.5">
                    {colTasks.length === 0 ? (
                      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
                        Drop tasks here or click + to add
                      </div>
                    ) : (
                      colTasks.map((task) => (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, task.id)}
                          className={`group cursor-grab active:cursor-grabbing rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm transition hover:border-blue-300 hover:shadow-md ${
                            draggedTaskId === task.id ? "opacity-50" : ""
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                              {task.projectKey}
                            </span>
                            <span className={`text-[11px] font-bold ${priorityStyles[task.priority]}`}>
                              <Flag size={11} className="mr-1 inline" />
                              {task.priority}
                            </span>
                          </div>

                          <h4 className="mt-2 text-xs font-bold text-slate-900 group-hover:text-blue-600 transition">
                            {task.title}
                          </h4>

                          {task.description && (
                            <p className="mt-1 line-clamp-2 text-[11px] text-slate-500 leading-4">
                              {task.description}
                            </p>
                          )}

                          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px] text-slate-400">
                            <span className="truncate max-w-[110px] font-medium text-slate-600">
                              {task.projectName}
                            </span>
                            <div className="flex items-center gap-2">
                              {task.dueDate && (
                                <span className={`flex items-center gap-1 ${isOverdue(task) ? "text-rose-600 font-semibold" : ""}`}>
                                  <CalendarDays size={11} />
                                  {formatDate(task.dueDate)}
                                </span>
                              )}
                              <div
                                title={`Assignee: ${task.assigneeName}`}
                                className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-[9px] font-bold text-blue-700"
                              >
                                {task.assigneeInitials}
                              </div>
                            </div>
                          </div>

                          <div className="mt-2 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => openEditModal(task)}
                              className="rounded px-2 py-1 text-[11px] font-semibold text-blue-600 hover:bg-blue-50"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTask(task.id)}
                              className="rounded px-2 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : view === "list" ? (
          /* List View */
=======
            <h3 className="font-semibold text-slate-900">No tasks found</h3>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              Try changing your filters or create a new task.
            </p>
            <button
              onClick={() => {
                setSearch("");
                setStatusFilter("All");
                setPriorityFilter("All");
              }}
              className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              Clear filters
            </button>
          </div>
        ) : view === "list" ? (
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left">
              <thead className="bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
                <tr>
<<<<<<< HEAD
                  <th className="px-5 py-3 font-semibold">Task</th>
                  <th className="px-4 py-3 font-semibold">Project</th>
                  <th className="px-4 py-3 font-semibold">Assignee</th>
                  <th className="px-4 py-3 font-semibold">Priority</th>
                  <th className="px-4 py-3 font-semibold">Due date</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-50/80">
                    <td className="px-5 py-3 font-semibold text-slate-900">{task.title}</td>
                    <td className="px-4 py-3 text-slate-600">[{task.projectKey}] {task.projectName}</td>
                    <td className="px-4 py-3 text-slate-600">{task.assigneeName}</td>
                    <td className="px-4 py-3 font-semibold">
                      <span className={priorityStyles[task.priority]}>{task.priority}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(task.dueDate)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 font-semibold text-[10px] ${statusStyles[task.status]}`}>
                        {task.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openEditModal(task)}
                        className="mr-2 font-semibold text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTask(task.id)}
                        className="font-semibold text-rose-600 hover:underline"
                      >
                        Delete
                      </button>
=======
                  <th className="px-5 py-4 font-semibold">Task</th>
                  <th className="px-4 py-4 font-semibold">Project</th>
                  <th className="px-4 py-4 font-semibold">Priority</th>
                  <th className="px-4 py-4 font-semibold">Due date</th>
                  <th className="px-4 py-4 font-semibold">Status</th>
                  <th className="px-4 py-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredTasks.map((task) => (
                  <tr key={task.id} className="transition hover:bg-slate-50/70">
                    <td className="px-5 py-4">
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() =>
                            updateStatus(
                              task.id,
                              task.status === "Completed"
                                ? "Todo"
                                : "Completed"
                            )
                          }
                          title={
                            task.status === "Completed"
                              ? "Mark incomplete"
                              : "Mark completed"
                          }
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition ${
                            task.status === "Completed"
                              ? "border-emerald-500 bg-emerald-500 text-white"
                              : "border-slate-300 text-transparent hover:border-blue-500"
                          }`}
                        >
                          <Check size={12} />
                        </button>

                        <div className="min-w-0">
                          <p
                            className={`font-semibold ${
                              task.status === "Completed"
                                ? "text-slate-400 line-through"
                                : "text-slate-800"
                            }`}
                          >
                            {task.title}
                          </p>
                          <p className="mt-1 max-w-xs truncate text-xs text-slate-500">
                            {task.description}
                          </p>
                          <span className="mt-2 inline-block rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600">
                            {task.tag}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <span className="text-sm font-medium text-slate-700">
                        {task.project}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 text-sm font-semibold ${priorityStyles[task.priority]}`}
                      >
                        <Flag size={14} />
                        {task.priority}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <div
                        className={`flex items-center gap-2 text-sm ${
                          isOverdue(task)
                            ? "font-semibold text-rose-600"
                            : "text-slate-600"
                        }`}
                      >
                        <CalendarDays size={15} />
                        {formatDate(task.dueDate)}
                      </div>
                      {isOverdue(task) && (
                        <p className="mt-1 text-xs text-rose-500">Overdue</p>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      <select
                        value={task.status}
                        onChange={(event) =>
                          updateStatus(task.id, event.target.value as TaskStatus)
                        }
                        className={`rounded-full border-0 px-3 py-1.5 text-xs font-semibold outline-none ${statusStyles[task.status]}`}
                        aria-label={`Status for ${task.title}`}
                      >
                        {statuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => openEditModal(task)}
                          className="rounded-lg px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteTask(task.id)}
                          aria-label={`Delete ${task.title}`}
                          className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                        >
                          <MoreHorizontal size={18} />
                        </button>
                      </div>
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
<<<<<<< HEAD
          /* Grid View */
          <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-blue-200 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600">
                    {task.projectKey}
                  </span>
                  <span className={`text-[11px] font-bold ${priorityStyles[task.priority]}`}>
                    {task.priority}
                  </span>
                </div>
                <h3 className="mt-3 text-sm font-bold text-slate-900">{task.title}</h3>
                {task.description && (
                  <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-5">
                    {task.description}
                  </p>
                )}
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-400">
                  <span>{task.projectName}</span>
                  <span>{formatDate(task.dueDate)}</span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className={`rounded-full px-2 py-0.5 font-semibold text-[10px] ${statusStyles[task.status]}`}>
                    {task.status}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
=======
          <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredTasks.map((task) => (
              <article
                key={task.id}
                className="rounded-xl border border-slate-200 p-5 transition hover:border-blue-200 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                    {task.tag}
                  </span>
                  <span
                    className={`text-xs font-bold ${priorityStyles[task.priority]}`}
                  >
                    <Flag size={13} className="mr-1 inline" />
                    {task.priority}
                  </span>
                </div>

                <h3 className="mt-4 font-bold text-slate-900">{task.title}</h3>
                <p className="mt-2 min-h-10 text-sm leading-6 text-slate-500">
                  {task.description}
                </p>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="truncate text-xs font-medium text-slate-500">
                    {task.project}
                  </span>
                  <span className="shrink-0 text-xs text-slate-500">
                    {formatDate(task.dueDate)}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                  <select
                    value={task.status}
                    onChange={(event) =>
                      updateStatus(task.id, event.target.value as TaskStatus)
                    }
                    className={`max-w-36 rounded-full border-0 px-3 py-1.5 text-xs font-semibold outline-none ${statusStyles[task.status]}`}
                    aria-label={`Status for ${task.title}`}
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>

                  <div className="flex gap-2">
                    <button
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
                      onClick={() => openEditModal(task)}
                      className="text-xs font-semibold text-blue-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
<<<<<<< HEAD
                      type="button"
                      onClick={() => handleDeleteTask(task.id)}
=======
                      onClick={() => deleteTask(task.id)}
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
                      className="text-xs font-semibold text-rose-600 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
<<<<<<< HEAD
              </div>
=======
              </article>
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
            ))}
          </div>
        )}
      </section>

<<<<<<< HEAD
      {/* Create / Edit Modal */}
=======
      {/* Create / edit modal */}
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/40 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowModal(false);
          }}
        >
<<<<<<< HEAD
          <div className="my-8 w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {editingTaskId ? "Edit Task" : "Create New Task"}
                </h2>
                <p className="text-xs text-slate-500">
                  {editingTaskId
                    ? "Update task deliverables and assignments."
                    : "Add a new task deliverable to your project."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="space-y-4 p-6">
              {formError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                  {formError}
                </div>
              )}

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Task Title *
                </label>
                <input
                  required
                  autoFocus
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Implement authentication middleware"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
=======
          <div className="my-8 w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingTask ? "Edit task" : "Create a task"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Add details to keep your work organized.
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                aria-label="Close dialog"
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={saveTask} className="space-y-5 p-6">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Task title *
                </label>
                <input
                  autoFocus
                  required
                  value={form.title}
                  onChange={(event) =>
                    setForm({ ...form, title: event.target.value })
                  }
                  placeholder="e.g. Build project analytics"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
                />
              </div>

              <div>
<<<<<<< HEAD
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Project *
                </label>
                <select
                  required
                  disabled={Boolean(editingTaskId)}
                  value={formProjectId}
                  onChange={(e) => setFormProjectId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-blue-400 disabled:bg-slate-100"
                >
                  <option value="">Select a project...</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.key || "PRJ"}] {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
=======
                <label className="mb-2 block text-sm font-semibold text-slate-700">
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
                  Description
                </label>
                <textarea
                  rows={3}
<<<<<<< HEAD
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Describe task scope, technical context, acceptance criteria..."
                  className="w-full resize-y rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as UiTaskStatus)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-blue-400"
                  >
                    {statuses.map((s) => (
                      <option key={s} value={s}>
                        {s}
=======
                  value={form.description}
                  onChange={(event) =>
                    setForm({ ...form, description: event.target.value })
                  }
                  placeholder="Describe the task..."
                  className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Project
                  </label>
                  <input
                    value={form.project}
                    onChange={(event) =>
                      setForm({ ...form, project: event.target.value })
                    }
                    placeholder="Project name"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Category
                  </label>
                  <input
                    value={form.tag}
                    onChange={(event) =>
                      setForm({ ...form, tag: event.target.value })
                    }
                    placeholder="Frontend, Testing..."
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        status: event.target.value as TaskStatus,
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-400"
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
                      </option>
                    ))}
                  </select>
                </div>

                <div>
<<<<<<< HEAD
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Priority
                  </label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as UiTaskPriority)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-blue-400"
                  >
                    {priorities.map((p) => (
                      <option key={p} value={p}>
                        {p} priority
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Assignee
                  </label>
                  <select
                    value={formAssigneeId}
                    onChange={(e) => setFormAssigneeId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-blue-400"
                  >
                    <option value="">Unassigned</option>
                    {projectMembers.map((m) => (
                      <option key={m.userId} value={m.userId}>
                        {m.user?.firstName
                          ? `${m.user.firstName} ${m.user.lastName || ""}`
                          : m.user?.username || m.userId}
=======
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Priority
                  </label>
                  <select
                    value={form.priority}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        priority: event.target.value as TaskPriority,
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-400"
                  >
                    {priorities.map((priority) => (
                      <option key={priority} value={priority}>
                        {priority}
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
                      </option>
                    ))}
                  </select>
                </div>

<<<<<<< HEAD
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Target Due Date
                  </label>
                  <input
                    type="date"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-400"
=======
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Due date
                  </label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(event) =>
                      setForm({ ...form, dueDate: event.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400"
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
                  />
                </div>
              </div>

<<<<<<< HEAD
              <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
=======
              {error && (
                <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {error}
                </p>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
                >
                  Cancel
                </button>
                <button
                  type="submit"
<<<<<<< HEAD
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Plus size={14} />
                  )}
                  {editingTaskId ? "Save Changes" : "Create Task"}
=======
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  {editingTask ? "Save changes" : "Create task"}
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
<<<<<<< HEAD
=======

function SummaryCard({
  title,
  value,
  subtitle,
  icon,
  iconClass,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
  iconClass: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
        </div>
        <div className={`rounded-xl p-3 ${iconClass}`}>{icon}</div>
      </div>
      <p className="mt-3 text-xs text-slate-500">{subtitle}</p>
    </div>
  );
}
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
