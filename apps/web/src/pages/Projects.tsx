<<<<<<< HEAD
import { useEffect, useMemo, useState } from "react";
=======

import { useMemo, useState } from "react";
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
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
<<<<<<< HEAD
  Building,
  RefreshCw,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import {
  projectApi,
  organizationApi,
  type Organization,
  type Project,
  type CreateProjectPayload,
} from "../lib/api";

type ProjectDisplayStatus = "On track" | "At risk" | "Completed" | "Planning";

interface DisplayProject {
  id: string;
  name: string;
  key: string;
  description: string;
  status: ProjectDisplayStatus;
  rawStatus: string;
=======
  Code2,
} from "lucide-react";

type ProjectStatus = "On track" | "At risk" | "Completed";

type Project = {
  id: number;
  name: string;
  description: string;
  category: string;
  status: ProjectStatus;
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
  progress: number;
  dueDate: string;
  members: string[];
  color: string;
<<<<<<< HEAD
  targetDate: string;
}

function mapBackendStatusToDisplay(status?: string): ProjectDisplayStatus {
  switch (status?.toUpperCase()) {
    case "COMPLETED":
      return "Completed";
    case "ON_HOLD":
    case "ARCHIVED":
      return "At risk";
    case "PLANNING":
      return "Planning";
    case "ACTIVE":
    default:
      return "On track";
  }
}

function mapDisplayStatusToBackend(status: ProjectDisplayStatus): string {
  switch (status) {
    case "Completed":
      return "COMPLETED";
    case "At risk":
      return "ON_HOLD";
    case "Planning":
      return "PLANNING";
    case "On track":
    default:
      return "ACTIVE";
  }
}

function StatusBadge({ status }: { status: ProjectDisplayStatus }) {
  const styles: Record<ProjectDisplayStatus, string> = {
    "On track": "bg-emerald-50 text-emerald-700",
    "At risk": "bg-amber-50 text-amber-700",
    Completed: "bg-blue-50 text-blue-700",
    Planning: "bg-purple-50 text-purple-700",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${styles[status] || styles["On track"]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

const colorCycle = ["indigo", "violet", "cyan", "emerald"];
=======
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

>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
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

<<<<<<< HEAD
export default function Projects() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [projects, setProjects] = useState<DisplayProject[]>([]);

  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [orgError, setOrgError] = useState<string | null>(null);
  const [projectError, setProjectError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [view, setView] = useState<"grid" | "list">("grid");

  // Project modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingProject, setEditingProject] = useState<DisplayProject | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  // Create organization modal state
  const [orgModalOpen, setOrgModalOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgSlug, setNewOrgSlug] = useState("");
  const [newOrgDesc, setNewOrgDesc] = useState("");
  const [isCreatingOrg, setIsCreatingOrg] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ProjectDisplayStatus>("On track");
  const [targetDate, setTargetDate] = useState("");

  // Load organizations
  async function loadOrganizations() {
    setLoadingOrgs(true);
    setOrgError(null);
    try {
      const orgList = await organizationApi.list();
      setOrganizations(orgList || []);
      if (orgList && orgList.length > 0) {
        // Keep currently selected if still valid, otherwise pick first
        setSelectedOrgId((current) => {
          if (current && orgList.some((o) => o.id === current)) {
            return current;
          }
          return orgList[0].id;
        });
      } else {
        setSelectedOrgId(null);
        setProjects([]);
      }
    } catch (err: any) {
      setOrgError(err?.message || "Failed to load organizations from server.");
      setOrganizations([]);
      setSelectedOrgId(null);
      setProjects([]);
    } finally {
      setLoadingOrgs(false);
    }
  }

  useEffect(() => {
    loadOrganizations();
  }, []);

  // Load projects whenever selected organization changes
  useEffect(() => {
    if (!selectedOrgId) {
      setProjects([]);
      return;
    }

    async function loadProjects(orgId: string) {
      setLoadingProjects(true);
      setProjectError(null);
      try {
        const apiProjects = await projectApi.list(orgId);
        const mapped: DisplayProject[] = (apiProjects || []).map((p, idx) => {
          const displayStatus = mapBackendStatusToDisplay(p.status);
          const memberInitials = (p.members || []).map((m) => {
            const u = m.user;
            if (u?.firstName && u?.lastName) {
              return `${u.firstName[0]}${u.lastName[0]}`.toUpperCase();
            }
            return (u?.username || "U").slice(0, 2).toUpperCase();
          });

          return {
            id: p.id,
            name: p.name,
            key: p.key || p.name.slice(0, 4).toUpperCase(),
            description: p.description ?? "No description provided.",
            status: displayStatus,
            rawStatus: p.status || "ACTIVE",
            progress:
              p.status === "COMPLETED"
                ? 100
                : p.status === "PLANNING"
                  ? 10
                  : p.status === "ON_HOLD"
                    ? 45
                    : 65,
            dueDate: p.targetDate
              ? new Date(p.targetDate).toLocaleDateString()
              : p.createdAt
                ? new Date(p.createdAt).toLocaleDateString()
                : "Not set",
            members: memberInitials,
            color: colorCycle[idx % colorCycle.length],
            targetDate: p.targetDate ? p.targetDate.slice(0, 10) : "",
          };
        });
        setProjects(mapped);
      } catch (err: any) {
        setProjectError(err?.message || "Failed to load projects for this organization.");
        setProjects([]);
      } finally {
        setLoadingProjects(false);
      }
    }

    loadProjects(selectedOrgId);
  }, [selectedOrgId]);

  const currentOrg = useMemo(
    () => organizations.find((o) => o.id === selectedOrgId),
    [organizations, selectedOrgId],
=======
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
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
  );

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch =
<<<<<<< HEAD
        `${project.name} ${project.key} ${project.description}`
=======
        `${project.name} ${project.description} ${project.category}`
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
          .toLowerCase()
          .includes(search.trim().toLowerCase());

      const matchesStatus =
        statusFilter === "All" || project.status === statusFilter;

<<<<<<< HEAD
      return matchesSearch && matchesStatus;
    });
  }, [projects, search, statusFilter]);
=======
      const matchesCategory =
        categoryFilter === "All" || project.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [projects, search, statusFilter, categoryFilter]);
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c

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
<<<<<<< HEAD
    setKey("");
    setDescription("");
    setStatus("On track");
    setTargetDate("");
    setEditingProject(null);
=======
    setDescription("");
    setCategory("Web Application");
    setStatus("On track");
    setDueDate("");
    setEditingId(null);
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
  }

  function openCreateModal() {
    resetForm();
    setModalOpen(true);
  }

<<<<<<< HEAD
  function handleNameChange(val: string) {
    setName(val);
    if (!editingProject && !key) {
      // Auto-generate key from name
      const clean = val.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase();
      if (clean) setKey(clean);
    }
  }

  async function handleCreateProject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedOrgId) {
      setNotice("Please select or create an organization first.");
      return;
    }

    const trimmedName = name.trim();
    const trimmedKey = (key.trim() || trimmedName.slice(0, 4)).toUpperCase();
    if (!trimmedName || !trimmedKey) return;

    setIsSubmitting(true);
    try {
      if (editingProject) {
        const updated = await projectApi.update(editingProject.id, {
          name: trimmedName,
          description: description.trim(),
          status: mapDisplayStatusToBackend(status),
          targetDate: targetDate || undefined,
        });

        setProjects((current) =>
          current.map((project) =>
            project.id === updated.id
              ? {
                  ...project,
                  name: updated.name,
                  description: updated.description ?? "No description provided.",
                  status: mapBackendStatusToDisplay(updated.status),
                  rawStatus: updated.status || "ACTIVE",
                  progress:
                    updated.status === "COMPLETED"
                      ? 100
                      : updated.status === "PLANNING"
                        ? 10
                        : updated.status === "ON_HOLD"
                          ? 45
                          : 65,
                  dueDate: updated.targetDate
                    ? new Date(updated.targetDate).toLocaleDateString()
                    : "Not set",
                  targetDate: updated.targetDate
                    ? updated.targetDate.slice(0, 10)
                    : "",
                }
              : project,
          ),
        );

        setNotice(`Project "${updated.name}" updated successfully.`);
        setModalOpen(false);
        resetForm();
        return;
      }

      const payload: CreateProjectPayload = {
        name: trimmedName,
        key: trimmedKey,
        description: description.trim() || undefined,
        status: mapDisplayStatusToBackend(status),
        targetDate: targetDate || undefined,
      };

      const created = await projectApi.create(selectedOrgId, payload);
      setNotice(`Project "${created.name}" created successfully.`);
      setModalOpen(false);
      resetForm();

      // Refresh project list from real API
      const apiProjects = await projectApi.list(selectedOrgId);
      const mapped: DisplayProject[] = (apiProjects || []).map((p, idx) => ({
        id: p.id,
        name: p.name,
        key: p.key || p.name.slice(0, 4).toUpperCase(),
        description: p.description ?? "No description provided.",
        status: mapBackendStatusToDisplay(p.status),
        rawStatus: p.status || "ACTIVE",
        progress: p.status === "COMPLETED" ? 100 : 50,
        dueDate: p.targetDate
          ? new Date(p.targetDate).toLocaleDateString()
          : "Not set",
        members: [],
        color: colorCycle[idx % colorCycle.length],
        targetDate: p.targetDate ? p.targetDate.slice(0, 10) : "",
      }));
      setProjects(mapped);
    } catch (err: any) {
      setNotice(`Failed to create project: ${err?.message || "Unknown error"}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCreateOrganization(e: React.FormEvent) {
    e.preventDefault();
    if (!newOrgName.trim() || !newOrgSlug.trim()) return;

    setIsCreatingOrg(true);
    try {
      const created = await organizationApi.create({
        name: newOrgName.trim(),
        slug: newOrgSlug.trim().toLowerCase(),
        description: newOrgDesc.trim() || undefined,
      });

      setNotice(`Organization "${created.name}" created successfully.`);
      setOrgModalOpen(false);
      setNewOrgName("");
      setNewOrgSlug("");
      setNewOrgDesc("");

      // Reload organizations and select new org
      await loadOrganizations();
      setSelectedOrgId(created.id);
    } catch (err: any) {
      setNotice(`Failed to create organization: ${err?.message || "Unknown error"}`);
    } finally {
      setIsCreatingOrg(false);
    }
  }

  function handleAttemptDelete(proj: DisplayProject) {
    setNotice("Notice: Project deletion is not currently supported by the backend REST API.");
    setMenuId(null);
  }

  function handleAttemptEdit(proj: DisplayProject) {
    setEditingProject(proj);
    setName(proj.name);
    setKey(proj.key);
    setDescription(
      proj.description === "No description provided." ? "" : proj.description,
    );
    setStatus(proj.status);
    setTargetDate(proj.targetDate || "");
=======
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
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
    setMenuId(null);
    setModalOpen(true);
  }

<<<<<<< HEAD
=======
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

>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
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
<<<<<<< HEAD
            Organize real workspace projects, track velocity, and maintain delivery milestones.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Organization selector */}
          {organizations.length > 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm">
              <Building size={14} className="text-slate-500" />
              <label htmlFor="org-select" className="sr-only">Select organization</label>
              <select
                id="org-select"
                value={selectedOrgId || ""}
                onChange={(e) => setSelectedOrgId(e.target.value)}
                className="bg-transparent font-semibold text-slate-800 outline-none cursor-pointer"
              >
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name} {org.role ? `(${org.role})` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            onClick={() => setOrgModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <Plus size={14} />
            New Org
          </button>

          <button
            type="button"
            disabled={!selectedOrgId}
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
          >
            <Plus size={16} />
            Create project
          </button>
        </div>
      </div>

      {/* Notice Banner */}
      {notice && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-900"
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-indigo-600 shrink-0" />
=======
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
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
            {notice}
          </span>
          <button
            type="button"
            onClick={() => setNotice("")}
<<<<<<< HEAD
            className="text-xs font-semibold hover:underline shrink-0"
=======
            className="text-xs font-semibold hover:underline"
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
          >
            Dismiss
          </button>
        </div>
      )}

<<<<<<< HEAD
      {/* Organization Loading & Error State */}
      {loadingOrgs && (
        <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-12 text-sm text-slate-500">
          <Loader2 className="animate-spin text-indigo-600" size={20} />
          <span>Loading organization workspace...</span>
        </div>
      )}

      {!loadingOrgs && orgError && (
        <div className="flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-red-600 shrink-0" size={20} />
            <div>
              <p className="font-semibold">Failed to load organizations</p>
              <p className="text-xs text-red-600 mt-0.5">{orgError}</p>
            </div>
          </div>
          <button
            onClick={loadOrganizations}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
          >
            <RefreshCw size={13} />
            Retry
          </button>
        </div>
      )}

      {/* Empty Organization State */}
      {!loadingOrgs && !orgError && organizations.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-16 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <Building size={26} />
          </div>
          <h3 className="mt-4 text-base font-bold text-slate-800">
            No Organizations Found
          </h3>
          <p className="mx-auto mt-2 max-w-md text-xs text-slate-500 leading-5">
            You are not currently a member of any organization. Create an organization to start collaborating and managing projects.
          </p>
          <button
            type="button"
            onClick={() => setOrgModalOpen(true)}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
          >
            <Plus size={16} />
            Create Your First Organization
          </button>
        </div>
      )}

      {/* Active Organization Context & Project Summary */}
      {selectedOrgId && (
        <>
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
                label: "At risk / On hold",
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
                      <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                        {metric.value}
                      </p>
                    </div>

                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl ${metric.color}`}
                    >
                      <Icon size={22} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Filter & View Toolbar */}
          <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search projects by name, key, or description..."
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-xs text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 p-1 text-xs">
                {["All", "On track", "At risk", "Completed"].map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setStatusFilter(status)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                      statusFilter === status
                        ? "bg-indigo-600 text-white"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>

              <div className="flex items-center rounded-xl border border-slate-200 p-1">
                <button
                  type="button"
                  onClick={() => setView("grid")}
                  className={`rounded-lg p-1.5 transition ${
                    view === "grid"
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                  aria-label="Grid view"
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setView("list")}
                  className={`rounded-lg p-1.5 transition ${
                    view === "list"
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                  aria-label="List view"
                >
                  <List size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Loading & Project List */}
          {loadingProjects && (
            <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-16 text-sm text-slate-500">
              <Loader2 className="animate-spin text-indigo-600" size={20} />
              <span>Fetching projects from API...</span>
            </div>
          )}

          {!loadingProjects && projectError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
              <p className="font-semibold">Error Loading Projects</p>
              <p className="text-xs text-red-600 mt-1">{projectError}</p>
            </div>
          )}

          {!loadingProjects && !projectError && filteredProjects.length > 0 && (
            <div
              className={
                view === "grid"
                  ? "grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
                  : "space-y-3"
              }
            >
              {filteredProjects.map((project) => {
                const colorClass =
                  projectColors[project.color] || projectColors.indigo;
                const barColor =
                  progressColors[project.color] || progressColors.indigo;

                return (
                  <article
                    key={project.id}
                    className={`group relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                      view === "list"
                        ? "flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
                        : "flex flex-col justify-between"
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold text-xs ${colorClass}`}
                          >
                            {project.key.slice(0, 3)}
                          </span>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              {project.key}
                            </span>
                            <h2 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition">
                              {project.name}
                            </h2>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <StatusBadge status={project.status} />

                          <div className="relative">
                            <button
                              type="button"
                              onClick={() =>
                                setMenuId(menuId === project.id ? null : project.id)
                              }
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            >
                              <MoreHorizontal size={15} />
                            </button>

                            {menuId === project.id && (
                              <div className="absolute right-0 top-8 z-20 w-36 rounded-xl border border-slate-200 bg-white p-1 text-xs shadow-lg">
                                <button
                                  type="button"
                                  onClick={() => handleAttemptEdit(project)}
                                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-slate-700 hover:bg-slate-50"
                                >
                                  <Pencil size={13} />
                                  Edit details
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleAttemptDelete(project)}
                                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 size={13} />
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <p className="mt-3 text-xs leading-5 text-slate-500 line-clamp-2">
                        {project.description}
                      </p>

                      <div className="mt-4 flex items-center gap-4 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <CalendarDays size={13} />
                          {project.dueDate}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-[10px] font-semibold text-slate-600 mb-1">
                          <span>Status: {project.rawStatus}</span>
                          <span>{project.progress}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${barColor}`}
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div
                      className={`mt-5 flex items-center justify-between border-t border-slate-100 pt-4 ${
                        view === "list" ? "mt-0 border-t-0 pt-0 lg:w-48 lg:shrink-0" : ""
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                          <Users size={13} />
                          {project.members.length > 0
                            ? `${project.members.length} member(s)`
                            : "No members assigned"}
                        </div>
                        {project.members.length > 0 && (
                          <div className="mt-1.5 flex -space-x-1.5">
                            {project.members.slice(0, 4).map((member, i) => (
                              <span
                                key={i}
                                className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-slate-200 text-[8px] font-bold text-slate-700"
                              >
                                {member}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setNotice(
                            `Selected project "${project.name}" [Key: ${project.key}]. Real database ID: ${project.id}`,
                          )
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-[10px] font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                      >
                        Details
                        <ArrowUpRight size={13} />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {!loadingProjects && !projectError && filteredProjects.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <FolderKanban size={25} />
              </div>
              <h3 className="mt-4 text-sm font-bold text-slate-800">
                No projects found
              </h3>
              <p className="mt-2 text-xs text-slate-500">
                {projects.length === 0
                  ? "No projects have been created in this organization yet."
                  : "No projects match your search or filter."}
              </p>
              {projects.length === 0 ? (
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                >
                  <Plus size={15} />
                  Create First Project
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("All");
                  }}
                  className="mt-4 text-xs font-semibold text-indigo-600 hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </>
      )}

      {/* Create / Edit Project Modal */}
=======
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
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
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
<<<<<<< HEAD
                  {editingProject ? "Edit Project" : "Create Project"}
                </h2>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {editingProject ? "Update the project details in" : "Add a new project to"}{" "}
                  <span className="font-semibold text-slate-800">
                    {currentOrg?.name || "your organization"}
                  </span>
                  .
=======
                  {editingId !== null ? "Edit project" : "Create project"}
                </h2>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {editingId !== null
                    ? "Update the project details below."
                    : "Add a new project to your workspace view."}
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
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

<<<<<<< HEAD
            <form onSubmit={handleCreateProject} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="project-name"
                  className="mb-1.5 block text-xs font-semibold text-slate-700"
=======
            <form onSubmit={saveProject} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="project-name"
                  className="mb-2 block text-xs font-semibold text-slate-700"
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
                >
                  Project name *
                </label>
                <input
                  id="project-name"
                  required
                  autoFocus
                  maxLength={100}
                  value={name}
<<<<<<< HEAD
                  onChange={(event) => handleNameChange(event.target.value)}
                  placeholder="e.g. Core API Service"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                />
              </div>

              <div>
                <label
                  htmlFor="project-key"
                  className="mb-1.5 block text-xs font-semibold text-slate-700"
                >
                  Project Key * (2-10 uppercase characters)
                </label>
                <input
                  id="project-key"
                  required
                  maxLength={10}
                  disabled={!!editingProject}
                  value={key}
                  onChange={(event) => setKey(event.target.value.toUpperCase())}
                  placeholder="e.g. CORE"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-mono uppercase outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
=======
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Enter project name"
                  className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
                />
              </div>

              <div>
                <label
                  htmlFor="project-description"
<<<<<<< HEAD
                  className="mb-1.5 block text-xs font-semibold text-slate-700"
=======
                  className="mb-2 block text-xs font-semibold text-slate-700"
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
                >
                  Description
                </label>
                <textarea
                  id="project-description"
                  rows={3}
                  maxLength={500}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
<<<<<<< HEAD
                  placeholder="Describe the scope and objectives of this project..."
                  className="w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 text-xs outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
=======
                  placeholder="Describe the project..."
                  className="w-full resize-y rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
<<<<<<< HEAD
                    htmlFor="project-status"
                    className="mb-1.5 block text-xs font-semibold text-slate-700"
                  >
                    Initial Status
                  </label>
                  <select
                    id="project-status"
                    value={status}
                    onChange={(event) =>
                      setStatus(event.target.value as ProjectDisplayStatus)
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs outline-none focus:border-indigo-400"
                  >
                    <option>On track</option>
                    <option>Planning</option>
                    <option>At risk</option>
                    <option>Completed</option>
=======
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
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
                  </select>
                </div>

                <div>
                  <label
<<<<<<< HEAD
                    htmlFor="project-due-date"
                    className="mb-1.5 block text-xs font-semibold text-slate-700"
                  >
                    Target Date
                  </label>
                  <input
                    id="project-due-date"
                    type="date"
                    value={targetDate}
                    onChange={(event) => setTargetDate(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs outline-none focus:border-indigo-400"
                  />
                </div>
              </div>

=======
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

>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
              <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setModalOpen(false);
                    resetForm();
                  }}
<<<<<<< HEAD
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
=======
                  className="rounded-xl border border-slate-200 px-4 py-3 text-xs font-semibold text-slate-600 hover:bg-slate-50"
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
                >
                  Cancel
                </button>
                <button
                  type="submit"
<<<<<<< HEAD
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : editingProject ? (
                    <CheckCircle2 size={15} />
                  ) : (
                    <Plus size={15} />
                  )}
                  {isSubmitting
                    ? "Saving..."
                    : editingProject
                      ? "Save Changes"
                      : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Organization Modal */}
      {orgModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setOrgModalOpen(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="org-modal-title"
            className="my-6 w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Building size={21} />
                </div>
                <h2
                  id="org-modal-title"
                  className="mt-4 text-lg font-bold text-slate-900"
                >
                  Create Organization
                </h2>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Register a new organization workspace. You will become the organization OWNER.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOrgModalOpen(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateOrganization} className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Organization Name *
                </label>
                <input
                  required
                  value={newOrgName}
                  onChange={(e) => {
                    setNewOrgName(e.target.value);
                    if (!newOrgSlug) {
                      setNewOrgSlug(
                        e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "-"),
                      );
                    }
                  }}
                  placeholder="e.g. Acme Innovations"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Organization Slug * (unique identifier)
                </label>
                <input
                  required
                  value={newOrgSlug}
                  onChange={(e) =>
                    setNewOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                  }
                  placeholder="e.g. acme-innovations"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-mono outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={newOrgDesc}
                  onChange={(e) => setNewOrgDesc(e.target.value)}
                  placeholder="Brief summary of your organization..."
                  className="w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 text-xs outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                />
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setOrgModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingOrg}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isCreatingOrg ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Building size={15} />
                  )}
                  Create Organization
                </button>
              </div>
=======
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
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
