import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Bot,
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FolderKanban,
  Gauge,
  GitBranch,
  ListTodo,
  MoreHorizontal,
  Plus,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

type ActivityItem = {
  id: number;
  type: "commit" | "task" | "risk" | "deployment" | "ai";
  title: string;
  description: string;
  time: string;
};

type Project = {
  id: number;
  name: string;
  description: string;
  progress: number;
  status: "Healthy" | "At Risk" | "Delayed";
  members: number;
  tasks: number;
  completed: number;
  color: string;
};

/* -------------------------------------------------------------------------- */
/* MOCK DATA                                                                  */
/* -------------------------------------------------------------------------- */

const productivityData = [
  { day: "Mon", completed: 18, created: 14 },
  { day: "Tue", completed: 25, created: 19 },
  { day: "Wed", completed: 21, created: 17 },
  { day: "Thu", completed: 31, created: 22 },
  { day: "Fri", completed: 28, created: 20 },
  { day: "Sat", completed: 16, created: 12 },
  { day: "Sun", completed: 12, created: 9 },
];

const workloadData = [
  { name: "Engineering", value: 42 },
  { name: "Design", value: 24 },
  { name: "Marketing", value: 18 },
  { name: "Management", value: 16 },
];

const projects: Project[] = [
  {
    id: 1,
    name: "DevSync AI",
    description: "AI-powered engineering workspace",
    progress: 78,
    status: "Healthy",
    members: 12,
    tasks: 84,
    completed: 66,
    color: "from-violet-500 to-indigo-500",
  },
  {
    id: 2,
    name: "Mobile App",
    description: "Next-generation mobile experience",
    progress: 61,
    status: "Healthy",
    members: 8,
    tasks: 52,
    completed: 32,
    color: "from-cyan-500 to-blue-500",
  },
  {
    id: 3,
    name: "Analytics Platform",
    description: "Real-time business intelligence",
    progress: 43,
    status: "At Risk",
    members: 7,
    tasks: 39,
    completed: 17,
    color: "from-orange-500 to-rose-500",
  },
];

const activities: ActivityItem[] = [
  {
    id: 1,
    type: "ai",
    title: "AI detected a project risk",
    description: "API integration may miss the sprint deadline.",
    time: "8 min ago",
  },
  {
    id: 2,
    type: "commit",
    title: "New deployment pushed",
    description: "Production deployment completed successfully.",
    time: "24 min ago",
  },
  {
    id: 3,
    type: "task",
    title: "Task completed",
    description: "Authentication flow marked as completed.",
    time: "41 min ago",
  },
  {
    id: 4,
    type: "risk",
    title: "Risk probability increased",
    description: "Analytics API risk moved from 34% → 57%.",
    time: "1 hr ago",
  },
  {
    id: 5,
    type: "deployment",
    title: "Sprint milestone reached",
    description: "Sprint velocity increased by 18%.",
    time: "2 hrs ago",
  },
];

/* -------------------------------------------------------------------------- */
/* SMALL COMPONENTS                                                           */
/* -------------------------------------------------------------------------- */

function MetricCard({
  title,
  value,
  change,
  positive,
  icon: Icon,
  iconClass,
}: {
  title: string;
  value: string;
  change: string;
  positive?: boolean;
  icon: typeof Activity;
  iconClass: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-slate-100 opacity-60 blur-2xl dark:bg-slate-800" />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {title}
          </p>

          <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {value}
          </h3>

          <div className="mt-2 flex items-center gap-1.5 text-xs font-medium">
            {positive ? (
              <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5 text-rose-500" />
            )}

            <span
              className={
                positive ? "text-emerald-500" : "text-rose-500"
              }
            >
              {change}
            </span>

            <span className="text-slate-400">vs last week</span>
          </div>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClass}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: Project["status"];
}) {
  const styles = {
    Healthy:
      "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
    "At Risk":
      "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
    Delayed:
      "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

function ActivityIcon({
  type,
}: {
  type: ActivityItem["type"];
}) {
  const map = {
    commit: {
      icon: GitBranch,
      className:
        "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
    },
    task: {
      icon: CheckCircle2,
      className:
        "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
    },
    risk: {
      icon: AlertTriangle,
      className:
        "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
    },
    deployment: {
      icon: Rocket,
      className:
        "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400",
    },
    ai: {
      icon: BrainCircuit,
      className:
        "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400",
    },
  };

  const item = map[type];
  const Icon = item.icon;

  return (
    <div
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.className}`}
    >
      <Icon className="h-4.5 w-4.5" />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* DASHBOARD                                                                  */
/* -------------------------------------------------------------------------- */

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState("7D");
  const [showAllActivity, setShowAllActivity] = useState(false);

  const visibleActivities = useMemo(
    () => (showAllActivity ? activities : activities.slice(0, 4)),
    [showAllActivity]
  );

  const totalWorkload = workloadData.reduce(
    (sum, item) => sum + item.value,
    0
  );

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#070b14] dark:text-white">
      {/* ------------------------------------------------------------------ */}
      {/* HEADER                                                             */}
      {/* ------------------------------------------------------------------ */}

      <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <span>Workspace</span>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="font-medium text-slate-700 dark:text-slate-300">
                Engineering
              </span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Good morning, Deepanshu
              <span className="ml-2 inline-block">👋</span>
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400 sm:text-base">
              Here's what is happening across your engineering workspace
              today.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold shadow-sm transition hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
              <CalendarDays className="h-4 w-4" />
              Aug 24, 2026
            </button>

            <button className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100">
              <Plus className="h-4 w-4" />
              New Project
            </button>
          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* AI INSIGHT                                                       */}
        {/* ---------------------------------------------------------------- */}

        <div className="relative mt-7 overflow-hidden rounded-2xl border border-indigo-200/60 bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 p-[1px] shadow-xl shadow-indigo-500/10">
          <div className="relative overflow-hidden rounded-[15px] bg-white/95 px-5 py-4 backdrop-blur-xl dark:bg-slate-950/90 sm:px-6">
            <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-indigo-500/10 blur-3xl" />

            <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg">
                  <Sparkles className="h-5 w-5" />
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-slate-900 dark:text-white">
                      AI Workspace Insight
                    </h2>

                    <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                      Live Analysis
                    </span>
                  </div>

                  <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-400">
                    Your team completed <strong>18% more tasks</strong> this
                    week. However, one project has an elevated delivery risk
                    that may impact the next sprint.
                  </p>
                </div>
              </div>

              <button className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20">
                <Bot className="h-4 w-4" />
                Ask DevSync AI
              </button>
            </div>
          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* METRICS                                                          */}
        {/* ---------------------------------------------------------------- */}

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Active Projects"
            value="08"
            change="+2.4%"
            positive
            icon={FolderKanban}
            iconClass="bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400"
          />

          <MetricCard
            title="Tasks Completed"
            value="147"
            change="+18.2%"
            positive
            icon={CheckCircle2}
            iconClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
          />

          <MetricCard
            title="Team Velocity"
            value="84%"
            change="+7.8%"
            positive
            icon={Gauge}
            iconClass="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
          />

          <MetricCard
            title="Open Risks"
            value="06"
            change="-12.5%"
            positive
            icon={ShieldCheck}
            iconClass="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
          />
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* MAIN ANALYTICS                                                   */}
        {/* ---------------------------------------------------------------- */}

        <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.8fr)]">
          {/* PRODUCTIVITY CHART */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-indigo-500" />
                  <h2 className="font-semibold">Team Productivity</h2>
                </div>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Tasks created vs completed
                </p>
              </div>

              <div className="flex rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
                {["7D", "30D", "90D"].map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                      timeRange === range
                        ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                        : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-7 h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={productivityData}>
                  <defs>
                    <linearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopOpacity={0.28} />
                      <stop offset="100%" stopOpacity={0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    vertical={false}
                    strokeDasharray="4 4"
                    className="stroke-slate-200 dark:stroke-slate-800"
                  />

                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                    className="fill-slate-400"
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                    className="fill-slate-400"
                  />

                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid rgba(148,163,184,.2)",
                      background: "rgba(15,23,42,.95)",
                      color: "#fff",
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="completed"
                    stroke="#6366f1"
                    strokeWidth={3}
                    fill="url(#completedGradient)"
                    name="Completed"
                  />

                  <Area
                    type="monotone"
                    dataKey="created"
                    stroke="#94a3b8"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    fill="transparent"
                    name="Created"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-3 flex items-center gap-5 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
                Completed
              </span>

              <span className="flex items-center gap-2">
                <span className="h-0.5 w-4 bg-slate-400" />
                Created
              </span>
            </div>
          </div>

          {/* WORKLOAD */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-cyan-500" />
                  <h2 className="font-semibold">Team Workload</h2>
                </div>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Current allocation
                </p>
              </div>

              <button className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white">
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </div>

            <div className="relative mx-auto mt-5 h-[190px] w-full max-w-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={workloadData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={58}
                    outerRadius={82}
                    paddingAngle={4}
                    stroke="none"
                  >
                    {workloadData.map((_, index) => (
                      <Cell
                        key={index}
                        fill={
                          ["#6366f1", "#06b6d4", "#f59e0b", "#10b981"][
                            index
                          ]
                        }
                      />
                    ))}
                  </Pie>

                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold">{totalWorkload}%</span>
                <span className="text-xs text-slate-400">allocated</span>
              </div>
            </div>

            <div className="mt-2 space-y-3">
              {workloadData.map((item, index) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{
                        backgroundColor: [
                          "#6366f1",
                          "#06b6d4",
                          "#f59e0b",
                          "#10b981",
                        ][index],
                      }}
                    />

                    <span className="text-slate-600 dark:text-slate-400">
                      {item.name}
                    </span>
                  </div>

                  <span className="font-semibold">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* PROJECTS                                                         */}
        {/* ---------------------------------------------------------------- */}

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col justify-between gap-3 border-b border-slate-200 px-5 py-5 dark:border-slate-800 sm:flex-row sm:items-center sm:px-6">
            <div>
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-violet-500" />
                <h2 className="font-semibold">Project Health</h2>
              </div>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                AI-powered overview of your active projects
              </p>
            </div>

            <button className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
              View all projects
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid divide-y divide-slate-200 dark:divide-slate-800 md:grid-cols-3 md:divide-x md:divide-y-0">
            {projects.map((project) => (
              <div
                key={project.id}
                className="group p-5 transition hover:bg-slate-50 dark:hover:bg-slate-800/40 sm:p-6"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${project.color} text-sm font-bold text-white shadow-md`}
                    >
                      {project.name
                        .split(" ")
                        .map((word) => word[0])
                        .join("")
                        .slice(0, 2)}
                    </div>

                    <div>
                      <h3 className="font-semibold">{project.name}</h3>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        {project.description}
                      </p>
                    </div>
                  </div>

                  <button className="rounded-lg p-1.5 text-slate-400 opacity-0 transition group-hover:opacity-100 hover:bg-slate-200 dark:hover:bg-slate-700">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <StatusBadge status={project.status} />

                  <span className="text-sm font-bold">
                    {project.progress}%
                  </span>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${project.color} transition-all duration-700`}
                    style={{ width: `${project.progress}%` }}
                  />
                </div>

                <div className="mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <ListTodo className="h-3.5 w-3.5" />
                    {project.completed}/{project.tasks} tasks
                  </span>

                  <span className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    {project.members}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* BOTTOM GRID                                                      */}
        {/* ---------------------------------------------------------------- */}

        <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(340px,1fr)]">
          {/* ACTIVITY */}

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-5 dark:border-slate-800 sm:px-6">
              <div>
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-indigo-500" />
                  <h2 className="font-semibold">Recent Activity</h2>
                </div>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  What's happening across your workspace
                </p>
              </div>

              <button
                onClick={() => setShowAllActivity((value) => !value)}
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
              >
                {showAllActivity ? "Show less" : "View all"}
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {visibleActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex gap-4 px-5 py-4 transition hover:bg-slate-50 dark:hover:bg-slate-800/30 sm:px-6"
                >
                  <ActivityIcon type={activity.type} />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col justify-between gap-1 sm:flex-row">
                      <h3 className="text-sm font-semibold">
                        {activity.title}
                      </h3>

                      <span className="shrink-0 text-xs text-slate-400">
                        {activity.time}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {activity.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI COMMAND CENTER */}

          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-950 p-6 text-white shadow-xl">
            <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-violet-500/20 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-indigo-500/20 blur-3xl" />

            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 backdrop-blur">
                  <BrainCircuit className="h-5 w-5 text-violet-300" />
                </div>

                <span className="flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                  AI Online
                </span>
              </div>

              <h2 className="mt-6 text-xl font-bold">
                DevSync AI Command Center
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-300">
                Let AI analyze your projects, predict risks, plan sprints,
                summarize standups and identify what your team should focus on
                next.
              </p>

              <div className="mt-6 space-y-2.5">
                {[
                  {
                    icon: AlertTriangle,
                    text: "Analyze project risks",
                  },
                  {
                    icon: Zap,
                    text: "Generate next sprint",
                  },
                  {
                    icon: Users,
                    text: "Create standup summary",
                  },
                  {
                    icon: TrendingUp,
                    text: "Analyze team velocity",
                  },
                ].map((item) => {
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.text}
                      className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-left text-sm transition hover:border-white/20 hover:bg-white/10"
                    >
                      <span className="flex items-center gap-3">
                        <Icon className="h-4 w-4 text-violet-300" />
                        {item.text}
                      </span>

                      <ChevronRight className="h-4 w-4 text-slate-500" />
                    </button>
                  );
                })}
              </div>

              <button className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-slate-100">
                <Sparkles className="h-4 w-4" />
                Open AI Workspace
              </button>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* FOOTER STATUS                                                    */}
        {/* ---------------------------------------------------------------- */}

        <div className="mt-6 flex flex-col justify-between gap-3 pb-8 text-xs text-slate-400 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            All systems operational
          </div>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Clock3 className="h-3.5 w-3.5" />
              Last synced 2 min ago
            </span>

            <span className="flex items-center gap-1.5">
              <GitBranch className="h-3.5 w-3.5" />
              main
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}