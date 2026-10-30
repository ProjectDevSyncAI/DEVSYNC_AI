
import { useMemo, useState, type FormEvent } from "react";
import {
  Search,
  Plus,
  Users,
  UserCheck,
  BriefcaseBusiness,
  Clock3,
  Mail,
  MoreHorizontal,
  X,
  LayoutGrid,
  List,
} from "lucide-react";

type TeamMember = {
  id: number;
  name: string;
  email: string;
  role: string;
  department: string;
  status: "Active" | "Away";
  tasks: number;
  completed: number;
  color: string;
  initials: string;
};

const initialMembers: TeamMember[] = [
  {
    id: 1,
    name: "Deepanshu Mittal",
    email: "deepanshu@example.com",
    role: "Project Lead",
    department: "Management",
    status: "Active",
    tasks: 12,
    completed: 9,
    color: "bg-blue-100 text-blue-700",
    initials: "DM",
  },
  {
    id: 2,
    name: "Aarav Sharma",
    email: "aarav@example.com",
    role: "Frontend Developer",
    department: "Engineering",
    status: "Active",
    tasks: 10,
    completed: 7,
    color: "bg-violet-100 text-violet-700",
    initials: "AS",
  },
  {
    id: 3,
    name: "Riya Singh",
    email: "riya@example.com",
    role: "UI/UX Designer",
    department: "Design",
    status: "Active",
    tasks: 8,
    completed: 6,
    color: "bg-pink-100 text-pink-700",
    initials: "RS",
  },
  {
    id: 4,
    name: "Karan Verma",
    email: "karan@example.com",
    role: "Backend Developer",
    department: "Engineering",
    status: "Away",
    tasks: 11,
    completed: 5,
    color: "bg-emerald-100 text-emerald-700",
    initials: "KV",
  },
  {
    id: 5,
    name: "Ananya Gupta",
    email: "ananya@example.com",
    role: "QA Engineer",
    department: "Quality Assurance",
    status: "Active",
    tasks: 9,
    completed: 8,
    color: "bg-orange-100 text-orange-700",
    initials: "AG",
  },
  {
    id: 6,
    name: "Rahul Meena",
    email: "rahul@example.com",
    role: "AI Engineer",
    department: "AI & Data",
    status: "Away",
    tasks: 7,
    completed: 3,
    color: "bg-cyan-100 text-cyan-700",
    initials: "RM",
  },
];

const roles = [
  "Project Lead",
  "Frontend Developer",
  "Backend Developer",
  "UI/UX Designer",
  "QA Engineer",
  "AI Engineer",
  "Other",
];

const departments = [
  "Management",
  "Engineering",
  "Design",
  "Quality Assurance",
  "AI & Data",
  "Other",
];

const avatarColors = [
  "bg-blue-100 text-blue-700",
  "bg-violet-100 text-violet-700",
  "bg-pink-100 text-pink-700",
  "bg-emerald-100 text-emerald-700",
  "bg-orange-100 text-orange-700",
  "bg-cyan-100 text-cyan-700",
];

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default function Team() {
  const [members, setMembers] = useState<TeamMember[]>(initialMembers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All roles");
  const [departmentFilter, setDepartmentFilter] = useState("All departments");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "Frontend Developer",
    department: "Engineering",
  });

  const activeCount = members.filter(
    (member) => member.status === "Active"
  ).length;

  const totalTasks = members.reduce((sum, member) => sum + member.tasks, 0);

  const completedTasks = members.reduce(
    (sum, member) => sum + member.completed,
    0
  );

  const filteredMembers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return members.filter((member) => {
      const matchesSearch =
        !query ||
        member.name.toLowerCase().includes(query) ||
        member.email.toLowerCase().includes(query) ||
        member.role.toLowerCase().includes(query) ||
        member.department.toLowerCase().includes(query);

      const matchesRole =
        roleFilter === "All roles" || member.role === roleFilter;

      const matchesDepartment =
        departmentFilter === "All departments" ||
        member.department === departmentFilter;

      return matchesSearch && matchesRole && matchesDepartment;
    });
  }, [members, search, roleFilter, departmentFilter]);

  function addMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const name = form.name.trim();
    const email = form.email.trim();

    if (!name || !email) {
      setError("Please enter the member's name and email.");
      return;
    }

    if (members.some((member) => member.email.toLowerCase() === email.toLowerCase())) {
      setError("A team member with this email already exists.");
      return;
    }

    const initials = getInitials(name);
    const color = avatarColors[members.length % avatarColors.length];

    setMembers((current) => [
      ...current,
      {
        id: Math.max(0, ...current.map((member) => member.id)) + 1,
        name,
        email,
        role: form.role,
        department: form.department,
        status: "Active",
        tasks: 0,
        completed: 0,
        initials,
        color,
      },
    ]);

    setForm({
      name: "",
      email: "",
      role: "Frontend Developer",
      department: "Engineering",
    });
    setShowModal(false);
  }

  function removeMember(id: number) {
    if (!window.confirm("Remove this member from the displayed team?")) return;

    setMembers((current) => current.filter((member) => member.id !== id));
  }

  return (
    <div className="min-h-screen space-y-6 bg-slate-50/70 p-4 text-slate-800 sm:p-6 lg:p-8">
      {/* Heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
            <span>Workspace</span>
            <span>/</span>
            <span className="font-medium text-slate-700">Team</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Team Members
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Discover your teammates and keep track of team workload.
          </p>
        </div>

        <button
          onClick={() => {
            setError("");
            setShowModal(true);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <Plus size={18} />
          Add team member
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total members"
          value={members.length}
          subtitle="People in this team"
          icon={<Users size={21} />}
          color="bg-blue-50 text-blue-600"
        />
        <SummaryCard
          title="Active members"
          value={activeCount}
          subtitle="Currently marked active"
          icon={<UserCheck size={21} />}
          color="bg-emerald-50 text-emerald-600"
        />
        <SummaryCard
          title="Total assigned tasks"
          value={totalTasks}
          subtitle="Across all displayed members"
          icon={<BriefcaseBusiness size={21} />}
          color="bg-violet-50 text-violet-600"
        />
        <SummaryCard
          title="Tasks completed"
          value={completedTasks}
          subtitle="Reported completed tasks"
          icon={<Clock3 size={21} />}
          color="bg-orange-50 text-orange-600"
        />
      </div>

      {/* Directory */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-4 sm:p-5">
          <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Team directory
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Showing {filteredMembers.length} of {members.length} members
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <div className="relative sm:w-64">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search team..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400"
                aria-label="Filter by role"
              >
                <option>All roles</option>
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>

              <select
                value={departmentFilter}
                onChange={(event) => setDepartmentFilter(event.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400"
                aria-label="Filter by department"
              >
                <option>All departments</option>
                {departments.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>

              <div className="flex rounded-xl border border-slate-200 p-1">
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
              </div>
            </div>
          </div>
        </div>

        {filteredMembers.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Users className="mx-auto mb-3 text-slate-400" size={32} />
            <h3 className="font-semibold text-slate-900">No members found</h3>
            <p className="mt-1 text-sm text-slate-500">
              Try another search or change your filters.
            </p>
            <button
              onClick={() => {
                setSearch("");
                setRoleFilter("All roles");
                setDepartmentFilter("All departments");
              }}
              className="mt-3 text-sm font-semibold text-blue-600 hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : view === "grid" ? (
          <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredMembers.map((member) => {
              const progress =
                member.tasks > 0
                  ? Math.round((member.completed / member.tasks) * 100)
                  : 0;

              return (
                <article
                  key={member.id}
                  className="rounded-2xl border border-slate-200 p-5 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-bold ${member.color}`}
                      >
                        {member.initials}
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate font-bold text-slate-900">
                          {member.name}
                        </h3>
                        <p className="mt-1 truncate text-xs text-slate-500">
                          {member.role}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => removeMember(member.id)}
                      title="Remove member"
                      aria-label={`Remove ${member.name}`}
                      className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    >
                      <MoreHorizontal size={19} />
                    </button>
                  </div>

                  <div className="mt-5 flex items-center gap-2 text-sm text-slate-500">
                    <Mail size={15} className="shrink-0" />
                    <span className="truncate">{member.email}</span>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-2">
                    <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-600">
                      {member.department}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold ${
                        member.status === "Active"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          member.status === "Active"
                            ? "bg-emerald-500"
                            : "bg-amber-500"
                        }`}
                      />
                      {member.status}
                    </span>
                  </div>

                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <div className="mb-2 flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-500">
                        Task completion
                      </span>
                      <span className="font-bold text-slate-800">
                        {progress}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-blue-600 transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      {member.completed} completed of {member.tasks} tasks
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Member</th>
                  <th className="px-4 py-4 font-semibold">Role</th>
                  <th className="px-4 py-4 font-semibold">Department</th>
                  <th className="px-4 py-4 font-semibold">Tasks</th>
                  <th className="px-4 py-4 font-semibold">Status</th>
                  <th className="px-4 py-4 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-xl text-xs font-bold ${member.color}`}
                        >
                          {member.initials}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">
                            {member.name}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {member.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      {member.role}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      {member.department}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      {member.completed}/{member.tasks} completed
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                          member.status === "Active"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {member.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={() => removeMember(member.id)}
                        className="text-xs font-semibold text-rose-600 hover:underline"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Add member modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="my-8 w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Add team member
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Add a member to the displayed team directory.
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                aria-label="Close dialog"
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={addMember} className="space-y-5 p-6">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Full name *
                </label>
                <input
                  required
                  autoFocus
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                  placeholder="Enter full name"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Email address *
                </label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm({ ...form, email: event.target.value })
                  }
                  placeholder="name@example.com"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Role
                </label>
                <select
                  value={form.role}
                  onChange={(event) =>
                    setForm({ ...form, role: event.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-400"
                >
                  {roles.filter((role) => role !== "Other").map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Department
                </label>
                <select
                  value={form.department}
                  onChange={(event) =>
                    setForm({ ...form, department: event.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-400"
                >
                  {departments.filter((department) => department !== "Other").map((department) => (
                    <option key={department} value={department}>
                      {department}
                    </option>
                  ))}
                </select>
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
                  Add member
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
  color,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
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
        <div className={`rounded-xl p-3 ${color}`}>{icon}</div>
      </div>
      <p className="mt-3 text-xs text-slate-500">{subtitle}</p>
    </div>
  );
}
