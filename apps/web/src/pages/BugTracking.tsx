
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

const severityStyles: Record<Severity, string> = {
  Critical: "bg-red-50 text-red-700 ring-red-200",
  High: "bg-orange-50 text-orange-700 ring-orange-200",
  Medium: "bg-amber-50 text-amber-700 ring-amber-200",
  Low: "bg-emerald-50 text-emerald-700 ring-emerald-200"
};

const statusStyles: Record<Status, string> = {
  Open: "bg-blue-50 text-blue-700",
  "In Progress": "bg-violet-50 text-violet-700",
  Resolved: "bg-emerald-50 text-emerald-700"
};

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

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

        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <Plus size={18} /> Report a Bug
        </button>
      </header>

      {/* Statistics */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { label: "Total Issues", value: stats.total, icon: Bug, color: "bg-blue-50 text-blue-600" },
          { label: "Open Issues", value: stats.open, icon: AlertTriangle, color: "bg-orange-50 text-orange-600" },
          { label: "In Progress", value: stats.progress, icon: Clock, color: "bg-violet-50 text-violet-600" },
          { label: "Resolved", value: stats.resolved, icon: CheckCircle2, color: "bg-emerald-50 text-emerald-600" },
          { label: "Critical Issues", value: stats.critical, icon: ShieldAlert, color: "bg-red-50 text-red-600" }
        ].map(item => (
          <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500">{item.label}</span>
              <span className={`rounded-xl p-2.5 ${item.color}`}>
                <item.icon size={20}/>
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
            <Activity className="text-blue-600"/>
          </div>

          <div className="mt-7 space-y-5">
            {[
              { label: "Open", value: stats.open, color: "bg-blue-500" },
              { label: "In Progress", value: stats.progress, color: "bg-violet-500" },
              { label: "Resolved", value: stats.resolved, color: "bg-emerald-500" }
            ].map(item => (
              <div key={item.label}>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="font-medium">{item.label}</span>
                  <span className="text-slate-500">{item.value}</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${item.color}`}
                    style={{ width: `${bugs.length ? item.value / bugs.length * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-red-100 bg-gradient-to-br from-red-50 to-orange-50 p-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-600 text-white">
            <ShieldAlert size={22}/>
          </div>
          <h2 className="mt-5 text-lg font-bold">Critical Issue Watch</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Monitor critical issues that may affect application stability and
            delivery timelines.
          </p>
          <p className="mt-5 text-4xl font-bold text-red-600">{stats.critical}</p>
          <p className="mt-1 text-xs text-slate-500">Unresolved critical issues</p>
        </div>
      </section>

      {/* Filters */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center">
          <div>
            <h2 className="font-bold">Issue Register</h2>
            <p className="mt-1 text-sm text-slate-500">
              Review and manage reported defects.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search issues..."
                className={`${inputClass} pl-10 sm:w-56`}
              />
            </div>

            <div className="relative">
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
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-4">Issue</th>
                <th className="px-5 py-4">Project</th>
                <th className="px-5 py-4">Severity</th>
                <th className="px-5 py-4">Assignee</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
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
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Report a Bug</h2>
                <p className="mt-1 text-sm text-slate-500">Provide details about the issue.</p>
              </div>
              <button onClick={() => setShowCreate(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
                <X/>
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <label className="block text-sm font-semibold">
                Bug title *
                <input value={title} onChange={e => setTitle(e.target.value)}
                  placeholder="Describe the issue briefly"
                  className={`${inputClass} mt-2 font-normal`}/>
              </label>

              <label className="block text-sm font-semibold">
                Description *
                <textarea value={description} onChange={e => setDescription(e.target.value)}
                  rows={4} placeholder="Explain the issue and reproduction steps..."
                  className={`${inputClass} mt-2 font-normal`}/>
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-semibold">
                  Project
                  <select value={project} onChange={e => setProject(e.target.value)}
                    className={`${inputClass} mt-2 font-normal`}>
                    <option>DevSync AI</option>
                    <option>Mobile App</option>
                    <option>Analytics Platform</option>
                  </select>
                </label>

                <label className="block text-sm font-semibold">
                  Severity
                  <select value={severity} onChange={e => setSeverity(e.target.value as Severity)}
                    className={`${inputClass} mt-2 font-normal`}>
                    <option>Critical</option><option>High</option>
                    <option>Medium</option><option>Low</option>
                  </select>
                </label>
              </div>

              <label className="block text-sm font-semibold">
                Category
                <select value={category} onChange={e => setCategory(e.target.value)}
                  className={`${inputClass} mt-2 font-normal`}>
                  <option>UI</option><option>Authentication</option>
                  <option>API</option><option>Database</option>
                  <option>Notifications</option><option>Performance</option>
                </select>
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-5">
              <button onClick={() => setShowCreate(false)}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">
                Cancel
              </button>
              <button onClick={createBug} disabled={!title.trim() || !description.trim()}
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
                Create Issue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex justify-between gap-3">
              <div>
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
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
