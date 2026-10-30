
import { useMemo, useState } from "react";
import {
  Plus,
  Search,
  FolderKanban,
  CalendarDays,
  Users,
  MoreHorizontal,
  LayoutGrid,
  List,
  ArrowUpRight,
  X,
  Trash2,
  Pencil,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Code2,
} from "lucide-react";

type ProjectStatus = "On track" | "At risk" | "Completed";

type Project = {
  id: number;
  name: string;
  description: string;
  category: string;
  status: ProjectStatus;
  progress: number;
  dueDate: string;
  members: string[];
  color: string;
};

const starterProjects: Project[] = [
  {
    id: 1,
    name: "DevSync AI Platform",
    description: "An intelligent workspace for managing development projects.",
    category: "Web Application",
    status: "On track",
    progress: 76,
    dueDate: "Nov 08, 2026",
    members: ["DM", "AS", "RK"],
    color: "indigo",
  },
  {
    id: 2,
    name: "Analytics Engine",
    description: "Project analytics, performance metrics, and reporting.",
    category: "AI & Analytics",
    status: "At risk",
    progress: 48,
    dueDate: "Nov 12, 2026",
    members: ["AS", "PK"],
    color: "violet",
  },
  {
    id: 3,
    name: "API Integration",
    description: "Backend services, authentication, and API integration.",
    category: "Backend",
    status: "On track",
    progress: 91,
    dueDate: "Nov 04, 2026",
    members: ["DM", "RK", "SK"],
    color: "cyan",
  },
  {
    id: 4,
    name: "UI Design System",
    description: "Reusable components and a consistent design language.",
    category: "Frontend",
    status: "Completed",
    progress: 100,
    dueDate: "Oct 24, 2026",
    members: ["PK", "SK"],
    color: "emerald",
  },
];

const projectColors: Record<string, string> = {
  indigo: "bg-indigo-100 text-indigo-700",
  violet: "bg-violet-100 text-violet-700",
  cyan: "bg-cyan-100 text-cyan-700",
  emerald: "bg-emerald-100 text-emerald-700",
};

const progressColors: Record<string, string> = {
  indigo: "bg-indigo-500",
  violet: "bg-violet-500",
  cyan: "bg-cyan-500",
  emerald: "bg-emerald-500",
};

function StatusBadge({ status }: { status: ProjectStatus }) {
  const styles: Record<ProjectStatus, string> = {
    "On track": "bg-emerald-50 text-emerald-700",
    "At risk": "bg-amber-50 text-amber-700",
    Completed: "bg-blue-50 text-blue-700",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${styles[status]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>(starterProjects);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [menuId, setMenuId] = useState<number | null>(null);
  const [notice, setNotice] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Web Application");
  const [status, setStatus] = useState<ProjectStatus>("On track");
  const [dueDate, setDueDate] = useState("");

  const categories = useMemo(
    () => Array.from(new Set(projects.map((project) => project.category))),
    [projects],
  );

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch =
        `${project.name} ${project.description} ${project.category}`
          .toLowerCase()
          .includes(search.trim().toLowerCase());

      const matchesStatus =
        statusFilter === "All" || project.status === statusFilter;

      const matchesCategory =
        categoryFilter === "All" || project.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [projects, search, statusFilter, categoryFilter]);

  const activeCount = projects.filter(
    (project) => project.status === "On track",
  ).length;

  const atRiskCount = projects.filter(
    (project) => project.status === "At risk",
  ).length;

  const completedCount = projects.filter(
    (project) => project.status === "Completed",
  ).length;

  function resetForm() {
    setName("");
    setDescription("");
    setCategory("Web Application");
    setStatus("On track");
    setDueDate("");
    setEditingId(null);
  }

  function openCreateModal() {
    resetForm();
    setModalOpen(true);
  }

  function openEditModal(project: Project) {
    setEditingId(project.id);
    setName(project.name);
    setDescription(project.description);
    setCategory(project.category);
    setStatus(project.status);
    setDueDate(
      project.dueDate === "Not set"
        ? ""
        : /^\d{4}-\d{2}-\d{2}$/.test(project.dueDate)
          ? project.dueDate
          : "",
    );
    setMenuId(null);
    setModalOpen(true);
  }

  function saveProject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) return;

    if (editingId !== null) {
      setProjects((current) =>
        current.map((project) =>
          project.id === editingId
            ? {
                ...project,
                name: trimmedName,
                description: description.trim(),
                category,
                status,
                progress:
                  status === "Completed"
                    ? 100
                    : project.progress === 100
                      ? 0
                      : project.progress,
                dueDate: dueDate || "Not set",
              }
            : project,
        ),
      );
      setNotice(`"${trimmedName}" was updated in this page.`);
    } else {
      const project: Project = {
        id: Date.now(),
        name: trimmedName,
        description: description.trim() || "Project description not added.",
        category,
        status,
        progress: status === "Completed" ? 100 : 0,
        dueDate: dueDate || "Not set",
        members: ["DM"],
        color: ["indigo", "violet", "cyan", "emerald"][
          projects.length % 4
        ],
      };

      setProjects((current) => [project, ...current]);
      setNotice(`"${trimmedName}" was added to this page.`);
    }

    setModalOpen(false);
    resetForm();
  }

  function deleteProject(project: Project) {
    const confirmed = window.confirm(
      `Delete "${project.name}" from this page?`,
    );

    if (!confirmed) return;

    setProjects((current) =>
      current.filter((item) => item.id !== project.id),
    );
    setMenuId(null);
    setNotice(`"${project.name}" was removed from this page.`);
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      {/* Page heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600">
            <FolderKanban size={15} />
            PROJECT MANAGEMENT
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            Projects
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Organize your work, monitor progress, and keep delivery on track.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700"
        >
          <Plus size={16} />
          Create project
        </button>
      </div>

      {notice && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 size={16} />
            {notice}
          </span>
          <button
            type="button"
            onClick={() => setNotice("")}
            className="text-xs font-semibold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Total projects",
            value: projects.length,
            icon: FolderKanban,
            color: "bg-indigo-50 text-indigo-600",
          },
          {
            label: "On track",
            value: activeCount,
            icon: CheckCircle2,
            color: "bg-emerald-50 text-emerald-600",
          },
          {
            label: "At risk",
            value: atRiskCount,
            icon: CircleAlert,
            color: "bg-amber-50 text-amber-600",
          },
          {
            label: "Completed",
            value: completedCount,
            icon: CheckCircle2,
            color: "bg-blue-50 text-blue-600",
          },
        ].map((metric) => {
          const Icon = metric.icon;

          return (
            <div
              key={metric.label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500">
                    {metric.label}
                  </p>
                  <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
                    {metric.value}
                  </p>
                </div>
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${metric.color}`}
                >
                  <Icon size={21} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative w-full xl:max-w-md">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search projects by name or description..."
              aria-label="Search projects"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-xs outline-none transition focus:border-indigo-300 focus:bg-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter by status"
              className="min-w-32 rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs text-slate-600 outline-none focus:border-indigo-300"
            >
              <option value="All">All statuses</option>
              <option value="On track">On track</option>
              <option value="At risk">At risk</option>
              <option value="Completed">Completed</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              aria-label="Filter by category"
              className="min-w-32 rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs text-slate-600 outline-none focus:border-indigo-300"
            >
              <option value="All">All categories</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <div className="flex rounded-xl border border-slate-200 p-1">
              <button
                type="button"
                onClick={() => setView("grid")}
                aria-label="Grid view"
                aria-pressed={view === "grid"}
                className={`rounded-lg p-2 ${
                  view === "grid"
                    ? "bg-indigo-50 text-indigo-600"
                    : "text-slate-400 hover:bg-slate-50"
                }`}
              >
                <LayoutGrid size={16} />
              </button>
              <button
                type="button"
                onClick={() => setView("list")}
                aria-label="List view"
                aria-pressed={view === "list"}
                className={`rounded-lg p-2 ${
                  view === "list"
                    ? "bg-indigo-50 text-indigo-600"
                    : "text-slate-400 hover:bg-slate-50"
                }`}
              >
                <List size={16} />
              </button>
            </div>
          </div>
        </div>

        <p className="mt-4 text-[11px] text-slate-400">
          Showing {filteredProjects.length} of {projects.length} projects
        </p>
      </section>

      {/* Project grid/list */}
      {filteredProjects.length > 0 ? (
        <div
          className={
            view === "grid"
              ? "grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3"
              : "space-y-3"
          }
        >
          {filteredProjects.map((project) => {
            const iconColor =
              projectColors[project.color] ?? projectColors.indigo;
            const barColor =
              progressColors[project.color] ?? progressColors.indigo;

            return (
              <article
                key={project.id}
                className={`relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-200 hover:shadow-md ${
                  view === "list"
                    ? "flex flex-col gap-5 lg:flex-row lg:items-center"
                    : ""
                }`}
              >
                <div className={view === "list" ? "flex-1" : ""}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconColor}`}
                      >
                        <Code2 size={20} />
                      </div>
                      <div className="min-w-0">
                        <h2 className="truncate text-sm font-bold text-slate-900">
                          {project.name}
                        </h2>
                        <p className="mt-1 text-[10px] text-slate-400">
                          {project.category}
                        </p>
                      </div>
                    </div>

                    <div className="relative shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          setMenuId(menuId === project.id ? null : project.id)
                        }
                        aria-label={`Options for ${project.name}`}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                      >
                        <MoreHorizontal size={18} />
                      </button>

                      {menuId === project.id && (
                        <div className="absolute right-0 top-full z-20 mt-1 w-40 rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
                          <button
                            type="button"
                            onClick={() => openEditModal(project)}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-xs text-slate-600 hover:bg-slate-50"
                          >
                            <Pencil size={14} />
                            Edit project
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteProject(project)}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-xs text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 size={14} />
                            Delete project
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="mt-4 min-h-10 text-xs leading-5 text-slate-500">
                    {project.description}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                    <StatusBadge status={project.status} />
                    <span className="flex items-center gap-1.5 text-[10px] text-slate-500">
                      <CalendarDays size={13} />
                      {project.dueDate}
                    </span>
                  </div>

                  <div className="mt-5">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[11px] font-medium text-slate-500">
                        Project progress
                      </span>
                      <span className="text-xs font-bold text-slate-800">
                        {project.progress}%
                      </span>
                    </div>
                    <div
                      className="h-2 overflow-hidden rounded-full bg-slate-100"
                      role="progressbar"
                      aria-valuenow={project.progress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${project.name} progress`}
                    >
                      <div
                        className={`h-full rounded-full transition-all ${barColor}`}
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div
                  className={`mt-5 flex items-center justify-between border-t border-slate-100 pt-4 ${
                    view === "list"
                      ? "mt-0 border-t-0 pt-0 lg:w-48 lg:shrink-0"
                      : ""
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                      <Users size={13} />
                      Team members
                    </div>
                    <div className="mt-2 flex -space-x-2">
                      {project.members.map((member, index) => (
                        <span
                          key={`${project.id}-${member}-${index}`}
                          title={member}
                          className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-[9px] font-bold text-slate-600"
                        >
                          {member}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setNotice(
                        `${project.name}: ${project.progress}% complete. Detailed project routing can be added when your project-detail page is ready.`,
                      )
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-[10px] font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    View details
                    <ArrowUpRight size={13} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-16 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <FolderKanban size={25} />
          </div>
          <h3 className="mt-4 text-sm font-bold text-slate-800">
            No projects found
          </h3>
          <p className="mt-2 text-xs text-slate-500">
            Change your filters or create a new project.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setStatusFilter("All");
              setCategoryFilter("All");
            }}
            className="mt-4 text-xs font-semibold text-indigo-600 hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Footer note */}
      <div className="flex flex-col gap-2 border-t border-slate-200 py-4 text-[10px] text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <span className="flex items-center gap-2">
          <Clock3 size={13} />
          Project management workspace
        </span>
        <span>
          Local demo data · Backend persistence is not enabled in this version
        </span>
      </div>

      {/* Create/edit project modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setModalOpen(false);
              resetForm();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="project-modal-title"
            className="my-6 w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <FolderKanban size={21} />
                </div>
                <h2
                  id="project-modal-title"
                  className="mt-4 text-lg font-bold text-slate-900"
                >
                  {editingId !== null ? "Edit project" : "Create project"}
                </h2>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {editingId !== null
                    ? "Update the project details below."
                    : "Add a new project to your workspace view."}
                </p>
              </div>
              <button
                type="button"
                aria-label="Close dialog"
                onClick={() => {
                  setModalOpen(false);
                  resetForm();
                }}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={saveProject} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="project-name"
                  className="mb-2 block text-xs font-semibold text-slate-700"
                >
                  Project name *
                </label>
                <input
                  id="project-name"
                  required
                  autoFocus
                  maxLength={100}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Enter project name"
                  className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
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
                  maxLength={500}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Describe the project..."
                  className="w-full resize-y rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="project-category"
                    className="mb-2 block text-xs font-semibold text-slate-700"
                  >
                    Category
                  </label>
                  <select
                    id="project-category"
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs outline-none focus:border-indigo-400"
                  >
                    <option>Web Application</option>
                    <option>Frontend</option>
                    <option>Backend</option>
                    <option>AI & Analytics</option>
                    <option>Mobile Application</option>
                    <option>Research</option>
                    <option>Other</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="project-status"
                    className="mb-2 block text-xs font-semibold text-slate-700"
                  >
                    Status
                  </label>
                  <select
                    id="project-status"
                    value={status}
                    onChange={(event) =>
                      setStatus(event.target.value as ProjectStatus)
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs outline-none focus:border-indigo-400"
                  >
                    <option>On track</option>
                    <option>At risk</option>
                    <option>Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="project-due-date"
                  className="mb-2 block text-xs font-semibold text-slate-700"
                >
                  Due date
                </label>
                <input
                  id="project-due-date"
                  type="date"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-3 text-xs outline-none focus:border-indigo-400"
                />
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setModalOpen(false);
                    resetForm();
                  }}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-xs font-semibold text-white transition hover:bg-indigo-700"
                >
                  <Plus size={15} />
                  {editingId !== null ? "Save changes" : "Create project"}
                </button>
              </div>

              <p className="text-[10px] leading-4 text-slate-400">
                Changes are stored in this page's memory only. Reloading the
                page resets the demo projects. Backend integration is a
                separate step.
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
