
import { useMemo, useState, type FormEvent } from "react";
import {
  Search,
  Plus,
  ListTodo,
  Clock3,
  CircleCheck,
  AlertCircle,
  CalendarDays,
  MoreHorizontal,
  LayoutGrid,
  List,
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
  Todo: "bg-slate-100 text-slate-700",
  "In Progress": "bg-blue-50 text-blue-700",
  "In Review": "bg-violet-50 text-violet-700",
  Completed: "bg-emerald-50 text-emerald-700",
};

const priorityStyles: Record<TaskPriority, string> = {
  Low: "text-slate-500",
  Medium: "text-blue-600",
  High: "text-orange-600",
  Urgent: "text-rose-600",
};

const statuses: TaskStatus[] = [
  "Todo",
  "In Progress",
  "In Review",
  "Completed",
];

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
  const overdueCount = tasks.filter(isOverdue).length;

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tasks.filter((task) => {
      const matchesSearch =
        !query ||
        task.title.toLowerCase().includes(query) ||
        task.description.toLowerCase().includes(query) ||
        task.project.toLowerCase().includes(query) ||
        task.tag.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "All" || task.status === statusFilter;

      const matchesPriority =
        priorityFilter === "All" || task.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tasks, search, statusFilter, priorityFilter]);

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
  }

  return (
    <div className="min-h-screen space-y-6 bg-slate-50/70 p-4 text-slate-800 sm:p-6 lg:p-8">
      {/* Page heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
            <span>Workspace</span>
            <span>/</span>
            <span className="font-medium text-slate-700">My Tasks</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            My Tasks
          </h1>

          <p className="mt-1 text-sm text-slate-500">
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
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search tasks..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400"
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
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400"
                aria-label="Filter by priority"
              >
                <option value="All">All priorities</option>
                {priorities.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority} priority
                  </option>
                ))}
              </select>

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
                </button>
              </div>
            </div>
          </div>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <div className="mb-4 rounded-2xl bg-slate-100 p-4 text-slate-500">
              <ListTodo size={28} />
            </div>
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
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left">
              <thead className="bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
                <tr>
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
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
                      onClick={() => openEditModal(task)}
                      className="text-xs font-semibold text-blue-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="text-xs font-semibold text-rose-600 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Create / edit modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/40 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowModal(false);
          }}
        >
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
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Description
                </label>
                <textarea
                  rows={3}
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
                      </option>
                    ))}
                  </select>
                </div>

                <div>
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
                      </option>
                    ))}
                  </select>
                </div>

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
                  />
                </div>
              </div>

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
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  {editingTask ? "Save changes" : "Create task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

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
