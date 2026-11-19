<<<<<<< HEAD
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  Bug,
  CheckCircle2,
  ChevronDown,
  Clock,
  Filter,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  Trash2,
  User,
  X,
  Activity,
} from "lucide-react";
import {
  bugAnalyzerApi,
  organizationApi,
  projectApi,
  type Issue,
  type IssuePriority,
  type IssueStatus,
  type IssueType,
  type Project,
  type ProjectMemberInfo,
} from "../lib/api";
import { useIssueStore } from "../store/issue.store";
import { useProjectStore } from "../store/project.store";

type Severity = "Critical" | "High" | "Medium" | "Low";
type UiStatus = "Open" | "In Progress" | "Resolved" | "Closed" | "Reopened";
=======

import { useMemo, useState } from "react";
import {
  Bug, Plus, Search, Filter, AlertTriangle, CheckCircle2,
  Clock, X, Trash2, ArrowUpRight, ShieldAlert, Activity,
  Calendar, User, FolderKanban, ChevronDown, MoreHorizontal
} from "lucide-react";

type Severity = "Critical" | "High" | "Medium" | "Low";
type Status = "Open" | "In Progress" | "Resolved";

interface BugItem {
  id: number;
  title: string;
  description: string;
  project: string;
  severity: Severity;
  status: Status;
  assignee: string;
  reporter: string;
  createdAt: string;
  category: string;
}

const initialBugs: BugItem[] = [
  {
    id: 1001,
    title: "Authentication session expires unexpectedly",
    description: "Users are redirected to the login page during normal application usage.",
    project: "DevSync AI",
    severity: "Critical",
    status: "Open",
    assignee: "Alex Morgan",
    reporter: "Sarah Chen",
    createdAt: "2026-10-29",
    category: "Authentication"
  },
  {
    id: 1002,
    title: "Analytics chart overflows on mobile",
    description: "The project performance chart exceeds the available screen width.",
    project: "DevSync AI",
    severity: "High",
    status: "In Progress",
    assignee: "Emily Davis",
    reporter: "Alex Morgan",
    createdAt: "2026-10-28",
    category: "UI"
  },
  {
    id: 1003,
    title: "Notification count not updating",
    description: "The notification badge does not refresh after reading an alert.",
    project: "Mobile App",
    severity: "Medium",
    status: "Open",
    assignee: "James Wilson",
    reporter: "Sarah Chen",
    createdAt: "2026-10-27",
    category: "Notifications"
  },
  {
    id: 1004,
    title: "Settings button alignment",
    description: "The save button is slightly misaligned on the preferences page.",
    project: "Analytics Platform",
    severity: "Low",
    status: "Resolved",
    assignee: "Emily Davis",
    reporter: "James Wilson",
    createdAt: "2026-10-26",
    category: "UI"
  }
];
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c

const severityStyles: Record<Severity, string> = {
  Critical: "bg-red-50 text-red-700 ring-red-200",
  High: "bg-orange-50 text-orange-700 ring-orange-200",
  Medium: "bg-amber-50 text-amber-700 ring-amber-200",
<<<<<<< HEAD
  Low: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

const statusStyles: Record<UiStatus, string> = {
  Open: "bg-blue-50 text-blue-700",
  "In Progress": "bg-violet-50 text-violet-700",
  Resolved: "bg-emerald-50 text-emerald-700",
  Closed: "bg-slate-100 text-slate-700",
  Reopened: "bg-amber-50 text-amber-700",
=======
  Low: "bg-emerald-50 text-emerald-700 ring-emerald-200"
};

const statusStyles: Record<Status, string> = {
  Open: "bg-blue-50 text-blue-700",
  "In Progress": "bg-violet-50 text-violet-700",
  Resolved: "bg-emerald-50 text-emerald-700"
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
};

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

<<<<<<< HEAD
function mapApiPriorityToSeverity(p: IssuePriority): Severity {
  switch (p) {
    case "CRITICAL":
      return "Critical";
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

function mapSeverityToApiPriority(s: Severity): IssuePriority {
  switch (s) {
    case "Critical":
      return "CRITICAL";
    case "High":
      return "HIGH";
    case "Medium":
      return "MEDIUM";
    case "Low":
      return "LOW";
  }
}

function mapApiStatusToUi(s: IssueStatus): UiStatus {
  switch (s) {
    case "OPEN":
      return "Open";
    case "IN_PROGRESS":
      return "In Progress";
    case "RESOLVED":
      return "Resolved";
    case "CLOSED":
      return "Closed";
    case "REOPENED":
      return "Reopened";
    default:
      return "Open";
  }
}

function mapUiStatusToApi(s: UiStatus): IssueStatus {
  switch (s) {
    case "Open":
      return "OPEN";
    case "In Progress":
      return "IN_PROGRESS";
    case "Resolved":
      return "RESOLVED";
    case "Closed":
      return "CLOSED";
    case "Reopened":
      return "REOPENED";
  }
}

export default function BugTracking() {
  const {
    issues,
    isLoading: issuesLoading,
    isCreating,
    isUpdating,
    error: issueError,
    setProjectId,
    fetchIssues,
    createIssue,
    updateIssue,
    deleteIssue,
    clearError,
  } = useIssueStore();

  const {
    projects,
    fetchProjects,
  } = useProjectStore();

  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [projectMembers, setProjectMembers] = useState<ProjectMemberInfo[]>([]);

  // Search & in-memory filters
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");

  // Selected for review detail modal
  const [selected, setSelected] = useState<Issue | null>(null);

  // Create issue modal & fields
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<Severity>("Medium");
  const [category, setCategory] = useState<IssueType>("BUG");
  const [assigneeId, setAssigneeId] = useState<string>("");

  // AI analysis state
  const [analyzingBug, setAnalyzingBug] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

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
        // Handled by store error
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [fetchProjects]);

  // 2. Default to first project when loaded
  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      const firstId = projects[0].id;
      setSelectedProjectId(firstId);
      setProjectId(firstId);
    }
  }, [projects, selectedProjectId, setProjectId]);

  // 3. Fetch issues & project members when selectedProjectId changes
  const loadProjectData = useCallback(
    async (projId: string) => {
      if (!projId) return;
      try {
        await Promise.allSettled([
          fetchIssues(projId),
          projectApi.getMembers(projId).then((members) => {
            setProjectMembers(members);
          }),
        ]);
      } catch {
        // Handled by store
      }
    },
    [fetchIssues]
  );

  useEffect(() => {
    if (selectedProjectId) {
      loadProjectData(selectedProjectId);
    }
  }, [selectedProjectId, loadProjectData]);

  // Handle switching projects cleanly
  const handleSelectProject = (newProjectId: string) => {
    if (newProjectId === selectedProjectId) return;
    setSelected(null);
    setSelectedProjectId(newProjectId);
    setProjectId(newProjectId); // Clears old issues immediately
    loadProjectData(newProjectId);
  };

  // Statistics derived purely from real issues
  const stats = useMemo(() => {
    const total = issues.length;
    const open = issues.filter((b) => b.status === "OPEN" || b.status === "REOPENED").length;
    const progress = issues.filter((b) => b.status === "IN_PROGRESS").length;
    const resolved = issues.filter((b) => b.status === "RESOLVED" || b.status === "CLOSED").length;
    const critical = issues.filter(
      (b) => b.priority === "CRITICAL" && b.status !== "RESOLVED" && b.status !== "CLOSED"
    ).length;
    return { total, open, progress, resolved, critical };
  }, [issues]);

  // Client-side in-memory filtered list
  const filteredBugs = useMemo(() => {
    const query = search.toLowerCase().trim();

    return issues.filter((b) => {
      const assigneeName = b.assignee
        ? [b.assignee.firstName, b.assignee.lastName].filter(Boolean).join(" ") ||
          b.assignee.username
        : "Unassigned";

      const reporterName = b.reporter
        ? [b.reporter.firstName, b.reporter.lastName].filter(Boolean).join(" ") ||
          b.reporter.username
        : "Unknown";

      const matchesSearch =
        !query ||
        b.title.toLowerCase().includes(query) ||
        (b.description && b.description.toLowerCase().includes(query)) ||
        assigneeName.toLowerCase().includes(query) ||
        reporterName.toLowerCase().includes(query);

      const matchesSeverity =
        severityFilter === "All" ||
        mapApiPriorityToSeverity(b.priority) === severityFilter;

      const matchesStatus =
        statusFilter === "All" ||
        mapApiStatusToUi(b.status) === statusFilter;

      const matchesType =
        typeFilter === "All" || b.type === typeFilter;

      return matchesSearch && matchesSeverity && matchesStatus && matchesType;
    });
  }, [issues, search, severityFilter, statusFilter, typeFilter]);

  // Create issue
  async function handleCreateBug() {
    if (!title.trim() || !description.trim() || !selectedProjectId) return;

    try {
      await createIssue({
        projectId: selectedProjectId,
        title: title.trim(),
        description: description.trim(),
        priority: mapSeverityToApiPriority(severity),
        type: category,
        status: "OPEN",
        assigneeId: assigneeId ? assigneeId : null,
      });

      setTitle("");
      setDescription("");
      setAssigneeId("");
      setShowCreate(false);
    } catch {
      // Error handled by issue store
    }
  }

  // Change issue status
  async function handleChangeStatus(id: string, uiStatus: UiStatus) {
    try {
      const apiStatus = mapUiStatusToApi(uiStatus);
      const updated = await updateIssue(id, { status: apiStatus });
      if (selected?.id === id) {
        setSelected(updated);
      }
    } catch {
      // Error handled by issue store with rollback
    }
  }

  // Change issue assignee
  async function handleChangeAssignee(id: string, newAssigneeId: string | null) {
    try {
      const updated = await updateIssue(id, { assigneeId: newAssigneeId });
      if (selected?.id === id) {
        setSelected(updated);
      }
    } catch {
      // Handled by store
    }
  }

  // Delete issue
  async function handleDeleteBug(id: string) {
    try {
      await deleteIssue(id);
      setSelected(null);
    } catch {
      // Handled by store
    }
  }

  // AI root cause analysis
  async function handleAnalyzeWithAi(desc: string) {
    if (!desc.trim()) return;
    setAnalyzingBug(true);
    setAiAnalysis(null);
    try {
      const res = await bugAnalyzerApi.analyze(desc, selectedProjectId || undefined);
      setAiAnalysis(res.analysis);
    } catch (err: any) {
      setAiAnalysis(err?.message || "Failed to analyze bug with AI.");
    } finally {
      setAnalyzingBug(false);
    }
  }

  const selectedProjectName =
    projects.find((p) => p.id === selectedProjectId)?.name || "Current Project";

  return (
    <div className="min-h-screen space-y-7 bg-slate-50 p-4 text-slate-900 sm:p-6 lg:p-8">
=======
export default function BugTracking() {
  const [bugs, setBugs] = useState(initialBugs);
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selected, setSelected] = useState<BugItem | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [project, setProject] = useState("DevSync AI");
  const [severity, setSeverity] = useState<Severity>("Medium");
  const [category, setCategory] = useState("UI");

  const stats = {
    total: bugs.length,
    open: bugs.filter(b => b.status === "Open").length,
    progress: bugs.filter(b => b.status === "In Progress").length,
    resolved: bugs.filter(b => b.status === "Resolved").length,
    critical: bugs.filter(b => b.severity === "Critical" && b.status !== "Resolved").length
  };

  const filteredBugs = useMemo(() => bugs.filter(b => {
    const query = search.toLowerCase();
    const matchesSearch =
      `${b.title} ${b.project} ${b.assignee} ${b.category}`
        .toLowerCase().includes(query);

    return matchesSearch &&
      (severityFilter === "All" || b.severity === severityFilter) &&
      (statusFilter === "All" || b.status === statusFilter);
  }), [bugs, search, severityFilter, statusFilter]);

  function createBug() {
    if (!title.trim() || !description.trim()) return;

    const bug: BugItem = {
      id: Date.now(),
      title: title.trim(),
      description: description.trim(),
      project,
      severity,
      status: "Open",
      assignee: "Unassigned",
      reporter: "You",
      createdAt: new Date().toISOString().slice(0, 10),
      category
    };

    setBugs(current => [bug, ...current]);
    setTitle("");
    setDescription("");
    setShowCreate(false);
  }

  function changeStatus(id: number, status: Status) {
    setBugs(current => current.map(b =>
      b.id === id ? { ...b, status } : b
    ));

    setSelected(current =>
      current?.id === id ? { ...current, status } : current
    );
  }

  function deleteBug(id: number) {
    setBugs(current => current.filter(b => b.id !== id));
    setSelected(null);
  }

  return (
    <div className="min-h-screen space-y-7 bg-slate-50 p-4 text-slate-900 sm:p-6 lg:p-8">

>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
      {/* Header */}
      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
            Engineering <span>/</span>
            <span className="font-medium text-blue-600">Bug Tracking</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Bug Tracking Center
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Monitor defects, prioritize issues and improve software quality.
          </p>
        </div>

<<<<<<< HEAD
        <div className="flex flex-wrap items-center gap-3">
          {projects.length > 0 && (
            <select
              value={selectedProjectId}
              onChange={(e) => handleSelectProject(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm outline-none focus:border-blue-500"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}

          {issuesLoading && (
            <span className="flex items-center gap-1.5 text-xs text-slate-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Syncing...
            </span>
          )}

          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus size={18} /> Report a Bug
          </button>
        </div>
      </header>

      {/* Error Banner */}
      {issueError && (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
            <span>{issueError}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                clearError();
                if (selectedProjectId) loadProjectData(selectedProjectId);
              }}
              className="inline-flex items-center gap-1 text-xs font-semibold underline hover:text-red-900"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Retry
            </button>
            <button
              onClick={clearError}
              className="rounded-lg p-1 hover:bg-red-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

=======
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <Plus size={18} /> Report a Bug
        </button>
      </header>

>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
      {/* Statistics */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { label: "Total Issues", value: stats.total, icon: Bug, color: "bg-blue-50 text-blue-600" },
          { label: "Open Issues", value: stats.open, icon: AlertTriangle, color: "bg-orange-50 text-orange-600" },
          { label: "In Progress", value: stats.progress, icon: Clock, color: "bg-violet-50 text-violet-600" },
          { label: "Resolved", value: stats.resolved, icon: CheckCircle2, color: "bg-emerald-50 text-emerald-600" },
<<<<<<< HEAD
          { label: "Critical Issues", value: stats.critical, icon: ShieldAlert, color: "bg-red-50 text-red-600" },
        ].map((item) => (
=======
          { label: "Critical Issues", value: stats.critical, icon: ShieldAlert, color: "bg-red-50 text-red-600" }
        ].map(item => (
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
          <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500">{item.label}</span>
              <span className={`rounded-xl p-2.5 ${item.color}`}>
<<<<<<< HEAD
                <item.icon size={20} />
=======
                <item.icon size={20}/>
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
              </span>
            </div>
            <p className="mt-4 text-3xl font-bold">{item.value}</p>
          </div>
        ))}
      </section>

      {/* Quality overview */}
      <section className="grid gap-5 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 xl:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold">Issue Resolution Overview</h2>
              <p className="mt-1 text-sm text-slate-500">Current bug lifecycle distribution</p>
            </div>
<<<<<<< HEAD
            <Activity className="text-blue-600" />
=======
            <Activity className="text-blue-600"/>
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
          </div>

          <div className="mt-7 space-y-5">
            {[
<<<<<<< HEAD
              { label: "Open / Reopened", value: stats.open, color: "bg-blue-500" },
              { label: "In Progress", value: stats.progress, color: "bg-violet-500" },
              { label: "Resolved / Closed", value: stats.resolved, color: "bg-emerald-500" },
            ].map((item) => (
=======
              { label: "Open", value: stats.open, color: "bg-blue-500" },
              { label: "In Progress", value: stats.progress, color: "bg-violet-500" },
              { label: "Resolved", value: stats.resolved, color: "bg-emerald-500" }
            ].map(item => (
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
              <div key={item.label}>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="font-medium">{item.label}</span>
                  <span className="text-slate-500">{item.value}</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${item.color}`}
<<<<<<< HEAD
                    style={{ width: `${stats.total ? (item.value / stats.total) * 100 : 0}%` }}
=======
                    style={{ width: `${bugs.length ? item.value / bugs.length * 100 : 0}%` }}
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-red-100 bg-gradient-to-br from-red-50 to-orange-50 p-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-600 text-white">
<<<<<<< HEAD
            <ShieldAlert size={22} />
          </div>
          <h2 className="mt-5 text-lg font-bold">Critical Issue Watch</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Monitor critical defects that may impact system stability and delivery milestones.
=======
            <ShieldAlert size={22}/>
          </div>
          <h2 className="mt-5 text-lg font-bold">Critical Issue Watch</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Monitor critical issues that may affect application stability and
            delivery timelines.
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
          </p>
          <p className="mt-5 text-4xl font-bold text-red-600">{stats.critical}</p>
          <p className="mt-1 text-xs text-slate-500">Unresolved critical issues</p>
        </div>
      </section>

<<<<<<< HEAD
      {/* Filters & Register */}
=======
      {/* Filters */}
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center">
          <div>
            <h2 className="font-bold">Issue Register</h2>
            <p className="mt-1 text-sm text-slate-500">
<<<<<<< HEAD
              Review and manage defects in <span className="font-medium text-slate-700">{selectedProjectName}</span>.
=======
              Review and manage reported defects.
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
<<<<<<< HEAD
              <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
=======
              <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
                placeholder="Search issues..."
                className={`${inputClass} pl-10 sm:w-56`}
              />
            </div>

            <div className="relative">
<<<<<<< HEAD
              <Filter size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className={`${inputClass} appearance-none pl-9 pr-8 sm:w-36`}
              >
                <option value="All">All Severity</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
              <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`${inputClass} sm:w-36`}
            >
              <option value="All">All Status</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
              <option value="Reopened">Reopened</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className={`${inputClass} sm:w-36`}
            >
              <option value="All">All Types</option>
              <option value="BUG">Bug</option>
              <option value="FEATURE">Feature</option>
              <option value="IMPROVEMENT">Improvement</option>
              <option value="DOCUMENTATION">Documentation</option>
              <option value="SECURITY">Security</option>
              <option value="PERFORMANCE">Performance</option>
              <option value="OTHER">Other</option>
=======
              <Filter size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
              <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value)}
                className={`${inputClass} appearance-none pl-9 pr-8 sm:w-40`}>
                <option value="All">All Severity</option>
                <option>Critical</option><option>High</option>
                <option>Medium</option><option>Low</option>
              </select>
              <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"/>
            </div>

            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className={`${inputClass} sm:w-40`}>
              <option value="All">All Status</option>
              <option>Open</option><option>In Progress</option><option>Resolved</option>
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-4">Issue</th>
<<<<<<< HEAD
                <th className="px-5 py-4">Type</th>
=======
                <th className="px-5 py-4">Project</th>
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
                <th className="px-5 py-4">Severity</th>
                <th className="px-5 py-4">Assignee</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
<<<<<<< HEAD
              {filteredBugs.map((bug) => {
                const uiSev = mapApiPriorityToSeverity(bug.priority);
                const uiStat = mapApiStatusToUi(bug.status);
                const assigneeDisplay = bug.assignee
                  ? [bug.assignee.firstName, bug.assignee.lastName].filter(Boolean).join(" ") ||
                    bug.assignee.username
                  : "Unassigned";

                return (
                  <tr key={bug.id} className="transition hover:bg-slate-50">
                    <td className="px-5 py-4 max-w-xs sm:max-w-md">
                      <p className="font-semibold text-slate-900 truncate">{bug.title}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        #{bug.id.slice(0, 8)} · {bug.createdAt ? bug.createdAt.slice(0, 10) : "Today"}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-slate-600 font-medium">
                      <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                        {bug.type || "BUG"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${severityStyles[uiSev]}`}>
                        {uiSev}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      <span className="inline-flex items-center gap-1.5">
                        <User size={14} className="text-slate-400" />
                        {assigneeDisplay}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <select
                        value={uiStat}
                        disabled={isUpdating}
                        onChange={(e) => handleChangeStatus(bug.id, e.target.value as UiStatus)}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-800 outline-none focus:border-blue-400"
                      >
                        <option value="Open">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Closed">Closed</option>
                        <option value="Reopened">Reopened</option>
                      </select>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => setSelected(bug)}
                        className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-800"
                      >
                        Review <ArrowUpRight size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredBugs.length === 0 && !issuesLoading && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                    {issues.length === 0
                      ? "No issues reported for this project yet. Click 'Report a Bug' above to add one."
                      : "No matching issues found for the current search and filters."}
                  </td>
                </tr>
              )}

              {issuesLoading && issues.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-blue-500" />
                    <p className="mt-2 text-xs">Loading issues from server...</p>
=======
              {filteredBugs.map(bug => (
                <tr key={bug.id} className="transition hover:bg-slate-50">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-900">{bug.title}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      #{bug.id} · {bug.category} · {bug.createdAt}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-slate-600">{bug.project}</td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${severityStyles[bug.severity]}`}>
                      {bug.severity}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-600">{bug.assignee}</td>
                  <td className="px-5 py-4">
                    <select
                      value={bug.status}
                      onChange={e => changeStatus(bug.id, e.target.value as Status)}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-medium text-slate-800"
                    >
                      <option>Open</option>
                      <option>In Progress</option>
                      <option>Resolved</option>
                    </select>
                  </td>
                  <td className="px-5 py-4">
                    <button onClick={() => setSelected(bug)}
                      className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-800">
                      Review <ArrowUpRight size={15}/>
                    </button>
                  </td>
                </tr>
              ))}

              {filteredBugs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                    No matching issues found.
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

<<<<<<< HEAD
      {/* Create Issue Modal */}
=======
      {/* Create modal */}
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Report a Bug</h2>
<<<<<<< HEAD
                <p className="mt-1 text-sm text-slate-500">Provide details about the issue for {selectedProjectName}.</p>
              </div>
              <button onClick={() => setShowCreate(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
                <X />
=======
                <p className="mt-1 text-sm text-slate-500">Provide details about the issue.</p>
              </div>
              <button onClick={() => setShowCreate(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
                <X/>
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <label className="block text-sm font-semibold">
                Bug title *
<<<<<<< HEAD
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Describe the issue briefly"
                  className={`${inputClass} mt-2 font-normal`}
                />
=======
                <input value={title} onChange={e => setTitle(e.target.value)}
                  placeholder="Describe the issue briefly"
                  className={`${inputClass} mt-2 font-normal`}/>
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
              </label>

              <label className="block text-sm font-semibold">
                Description *
<<<<<<< HEAD
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Explain the issue and reproduction steps..."
                  className={`${inputClass} mt-2 font-normal`}
                />
=======
                <textarea value={description} onChange={e => setDescription(e.target.value)}
                  rows={4} placeholder="Explain the issue and reproduction steps..."
                  className={`${inputClass} mt-2 font-normal`}/>
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-semibold">
<<<<<<< HEAD
                  Severity
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as Severity)}
                    className={`${inputClass} mt-2 font-normal`}
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
=======
                  Project
                  <select value={project} onChange={e => setProject(e.target.value)}
                    className={`${inputClass} mt-2 font-normal`}>
                    <option>DevSync AI</option>
                    <option>Mobile App</option>
                    <option>Analytics Platform</option>
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
                  </select>
                </label>

                <label className="block text-sm font-semibold">
<<<<<<< HEAD
                  Category / Type
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as IssueType)}
                    className={`${inputClass} mt-2 font-normal`}
                  >
                    <option value="BUG">Bug</option>
                    <option value="FEATURE">Feature</option>
                    <option value="IMPROVEMENT">Improvement</option>
                    <option value="DOCUMENTATION">Documentation</option>
                    <option value="SECURITY">Security</option>
                    <option value="PERFORMANCE">Performance</option>
                    <option value="OTHER">Other</option>
=======
                  Severity
                  <select value={severity} onChange={e => setSeverity(e.target.value as Severity)}
                    className={`${inputClass} mt-2 font-normal`}>
                    <option>Critical</option><option>High</option>
                    <option>Medium</option><option>Low</option>
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
                  </select>
                </label>
              </div>

              <label className="block text-sm font-semibold">
<<<<<<< HEAD
                Assignee
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className={`${inputClass} mt-2 font-normal`}
                >
                  <option value="">Unassigned</option>
                  {projectMembers.map((m) => {
                    const name =
                      [m.user.firstName, m.user.lastName].filter(Boolean).join(" ") ||
                      m.user.username;
                    return (
                      <option key={m.userId} value={m.userId}>
                        {name} ({m.user.email || m.user.username})
                      </option>
                    );
                  })}
=======
                Category
                <select value={category} onChange={e => setCategory(e.target.value)}
                  className={`${inputClass} mt-2 font-normal`}>
                  <option>UI</option><option>Authentication</option>
                  <option>API</option><option>Database</option>
                  <option>Notifications</option><option>Performance</option>
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
                </select>
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-5">
<<<<<<< HEAD
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateBug}
                disabled={!title.trim() || !description.trim() || isCreating}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCreating && <Loader2 className="h-4 w-4 animate-spin" />}
=======
              <button onClick={() => setShowCreate(false)}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">
                Cancel
              </button>
              <button onClick={createBug} disabled={!title.trim() || !description.trim()}
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
                Create Issue
              </button>
            </div>
          </div>
        </div>
      )}

<<<<<<< HEAD
      {/* Details & Review Modal */}
=======
      {/* Details modal */}
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex justify-between gap-3">
              <div>
<<<<<<< HEAD
                <p className="text-sm font-medium text-blue-600">Issue #{selected.id.slice(0, 8)}</p>
                <h2 className="mt-1 text-xl font-bold">{selected.title}</h2>
              </div>
              <button onClick={() => setSelected(null)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
                <X />
              </button>
            </div>

            <p className="mt-5 text-sm leading-6 text-slate-600 whitespace-pre-wrap">
              {selected.description || "No description provided."}
            </p>

            <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-400">Project</p>
                <p className="mt-1 font-semibold">{selectedProjectName}</p>
              </div>

              <div>
                <p className="text-slate-400">Assignee</p>
                <select
                  value={selected.assigneeId || ""}
                  onChange={(e) => handleChangeAssignee(selected.id, e.target.value || null)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-800"
                >
                  <option value="">Unassigned</option>
                  {projectMembers.map((m) => {
                    const name =
                      [m.user.firstName, m.user.lastName].filter(Boolean).join(" ") ||
                      m.user.username;
                    return (
                      <option key={m.userId} value={m.userId}>
                        {name}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <p className="text-slate-400">Reporter</p>
                <p className="mt-1 font-semibold">
                  {selected.reporter
                    ? [selected.reporter.firstName, selected.reporter.lastName].filter(Boolean).join(" ") ||
                      selected.reporter.username
                    : "Authenticated Member"}
                </p>
              </div>

              <div>
                <p className="text-slate-400">Type</p>
                <p className="mt-1 font-semibold">{selected.type || "BUG"}</p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${severityStyles[mapApiPriorityToSeverity(selected.priority)]}`}>
                {mapApiPriorityToSeverity(selected.priority)}
              </span>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[mapApiStatusToUi(selected.status)]}`}>
                {mapApiStatusToUi(selected.status)}
              </span>
            </div>

            {/* AI Bug Analysis Section */}
            <div className="mt-5 rounded-xl border border-violet-100 bg-violet-50/60 p-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-bold text-violet-700">
                  <Sparkles size={14} /> AI ROOT CAUSE ANALYZER
                </span>
                <button
                  type="button"
                  disabled={analyzingBug}
                  onClick={() => handleAnalyzeWithAi(selected.description || selected.title)}
                  className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-violet-700 disabled:opacity-50"
                >
                  {analyzingBug ? (
                    <span className="flex items-center gap-1">
                      <Loader2 size={12} className="animate-spin" /> Analyzing…
                    </span>
                  ) : (
                    "Analyze with AI"
                  )}
                </button>
              </div>

              {aiAnalysis && (
                <div className="mt-3 max-h-48 overflow-y-auto rounded-lg bg-white p-3 text-xs leading-relaxed text-slate-700">
                  <div className="whitespace-pre-wrap">{aiAnalysis}</div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-between gap-3 border-t border-slate-100 pt-5">
              <button
                onClick={() => handleDeleteBug(selected.id)}
                className="flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                <Trash2 size={16} /> Delete Issue
              </button>
              <button
                onClick={() => setSelected(null)}
                className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
              >
=======
                <p className="text-sm font-medium text-blue-600">Issue #{selected.id}</p>
                <h2 className="mt-1 text-xl font-bold">{selected.title}</h2>
              </div>
              <button onClick={() => setSelected(null)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
                <X/>
              </button>
            </div>

            <p className="mt-5 text-sm leading-6 text-slate-600">{selected.description}</p>

            <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-slate-400">Project</p><p className="mt-1 font-semibold">{selected.project}</p></div>
              <div><p className="text-slate-400">Assignee</p><p className="mt-1 font-semibold">{selected.assignee}</p></div>
              <div><p className="text-slate-400">Reporter</p><p className="mt-1 font-semibold">{selected.reporter}</p></div>
              <div><p className="text-slate-400">Category</p><p className="mt-1 font-semibold">{selected.category}</p></div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${severityStyles[selected.severity]}`}>{selected.severity}</span>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[selected.status]}`}>{selected.status}</span>
            </div>

            <div className="mt-6 flex justify-between gap-3 border-t border-slate-100 pt-5">
              <button onClick={() => deleteBug(selected.id)}
                className="flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50">
                <Trash2 size={16}/> Delete Issue
              </button>
              <button onClick={() => setSelected(null)}
                className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white">
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
