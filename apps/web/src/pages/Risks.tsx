import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Filter,
  Gauge,
  Plus,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Target,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";

type RiskLevel = "Critical" | "High" | "Medium" | "Low";
type RiskStatus = "Open" | "Mitigating" | "Resolved";
type RiskCategory =
  | "Technical"
  | "Schedule"
  | "Resource"
  | "Security"
  | "Scope";

type Risk = {
  id: string;
  title: string;
  description: string;
  category: RiskCategory;
  level: RiskLevel;
  status: RiskStatus;
  probability: number;
  impact: number;
  owner: string;
  project: string;
  dueDate: string;
  mitigation: string;
};

const initialRisks: Risk[] = [
  {
    id: "RSK-104",
    title: "API integration delays",
    description:
      "External service integration may delay the planned delivery of core features.",
    category: "Technical",
    level: "Critical",
    status: "Mitigating",
    probability: 85,
    impact: 95,
    owner: "Aarav Sharma",
    project: "API Platform",
    dueDate: "Oct 30, 2026",
    mitigation:
      "Validate API contracts, add integration tests, and prepare a fallback implementation.",
  },
  {
    id: "RSK-103",
    title: "Sprint delivery slippage",
    description:
      "Several open tasks could push sprint completion beyond the target date.",
    category: "Schedule",
    level: "High",
    status: "Open",
    probability: 72,
    impact: 78,
    owner: "Priya Singh",
    project: "DevSync Web",
    dueDate: "Oct 31, 2026",
    mitigation:
      "Reprioritize unfinished work, identify blockers, and review capacity with the team.",
  },
  {
    id: "RSK-102",
    title: "Limited engineering capacity",
    description:
      "Parallel project commitments may reduce the team's available development time.",
    category: "Resource",
    level: "High",
    status: "Mitigating",
    probability: 68,
    impact: 74,
    owner: "Rohan Verma",
    project: "Mobile App",
    dueDate: "Nov 02, 2026",
    mitigation:
      "Rebalance ownership and protect dedicated development time for critical work.",
  },
  {
    id: "RSK-101",
    title: "Authentication edge cases",
    description:
      "Uncovered session-expiration scenarios could affect the reliability of login flows.",
    category: "Security",
    level: "High",
    status: "Open",
    probability: 55,
    impact: 88,
    owner: "Neha Gupta",
    project: "DevSync Web",
    dueDate: "Nov 03, 2026",
    mitigation:
      "Test token expiration, unauthorized responses, and session renewal before release.",
  },
  {
    id: "RSK-100",
    title: "Changing feature requirements",
    description:
      "Late stakeholder changes may increase the amount of work required for release.",
    category: "Scope",
    level: "Medium",
    status: "Open",
    probability: 48,
    impact: 60,
    owner: "Kabir Mehta",
    project: "Analytics Hub",
    dueDate: "Nov 05, 2026",
    mitigation:
      "Document acceptance criteria and route new requests through scope review.",
  },
  {
    id: "RSK-099",
    title: "Test coverage gaps",
    description:
      "Insufficient automated regression tests could allow defects into production.",
    category: "Technical",
    level: "Medium",
    status: "Mitigating",
    probability: 40,
    impact: 65,
    owner: "Ananya Rao",
    project: "API Platform",
    dueDate: "Nov 06, 2026",
    mitigation:
      "Prioritize tests for critical user journeys and add regression checks to CI.",
  },
  {
    id: "RSK-098",
    title: "Documentation backlog",
    description:
      "Missing implementation notes may slow onboarding and handovers.",
    category: "Resource",
    level: "Low",
    status: "Resolved",
    probability: 15,
    impact: 25,
    owner: "Ishaan Jain",
    project: "Analytics Hub",
    dueDate: "Oct 25, 2026",
    mitigation:
      "Add concise setup instructions and assign documentation ownership.",
  },
];

const levelStyles: Record<RiskLevel, string> = {
  Critical: "border-rose-200 bg-rose-50 text-rose-700",
  High: "border-orange-200 bg-orange-50 text-orange-700",
  Medium: "border-amber-200 bg-amber-50 text-amber-700",
  Low: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const statusStyles: Record<RiskStatus, string> = {
  Open: "bg-slate-100 text-slate-700",
  Mitigating: "bg-blue-50 text-blue-700",
  Resolved: "bg-emerald-50 text-emerald-700",
};

const categories: RiskCategory[] = [
  "Technical",
  "Schedule",
  "Resource",
  "Security",
  "Scope",
];

const levelOrder: Record<RiskLevel, number> = {
  Critical: 4,
  High: 3,
  Medium: 2,
  Low: 1,
};

function getRiskLevel(score: number): RiskLevel {
  if (score >= 75) return "Critical";
  if (score >= 55) return "High";
  if (score >= 30) return "Medium";
  return "Low";
}

function calculateRiskScore(risk: Risk) {
  return Math.round((risk.probability * risk.impact) / 100);
}

function getRiskScoreColor(score: number) {
  if (score >= 75) return "bg-rose-500";
  if (score >= 55) return "bg-orange-500";
  if (score >= 30) return "bg-amber-500";
  return "bg-emerald-500";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function MetricCard({
  title,
  value,
  detail,
  icon: Icon,
  tone,
  trend,
}: {
  title: string;
  value: string | number;
  detail: string;
  icon: LucideIcon;
  tone: "rose" | "orange" | "blue" | "emerald";
  trend?: "up" | "down";
}) {
  const tones = {
    rose: "bg-rose-50 text-rose-600",
    orange: "bg-orange-50 text-orange-600",
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
        </div>
        <div className={`rounded-xl p-3 ${tones[tone]}`}>
          <Icon size={21} />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
        {trend === "up" && (
          <ArrowUpRight size={14} className="text-rose-500" />
        )}
        {trend === "down" && (
          <ArrowDownRight size={14} className="text-emerald-600" />
        )}
        <span>{detail}</span>
      </div>
    </div>
  );
}

function LevelBadge({ level }: { level: RiskLevel }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${levelStyles[level]}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          level === "Critical"
            ? "bg-rose-500"
            : level === "High"
              ? "bg-orange-500"
              : level === "Medium"
                ? "bg-amber-500"
                : "bg-emerald-500"
        }`}
      />
      {level}
    </span>
  );
}

export default function RiskEngine() {
  const [risks, setRisks] = useState<Risk[]>(initialRisks);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("All levels");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [categoryFilter, setCategoryFilter] = useState("All categories");
  const [sortBy, setSortBy] = useState("score");
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [notice, setNotice] = useState("");

  const stats = useMemo(() => {
    const open = risks.filter((risk) => risk.status !== "Resolved");
    const critical = open.filter((risk) => risk.level === "Critical").length;
    const high = open.filter((risk) => risk.level === "High").length;
    const mitigating = risks.filter(
      (risk) => risk.status === "Mitigating",
    ).length;
    const resolved = risks.filter(
      (risk) => risk.status === "Resolved",
    ).length;

    const averageScore = open.length
      ? Math.round(
          open.reduce((sum, risk) => sum + calculateRiskScore(risk), 0) /
            open.length,
        )
      : 0;

    return {
      open: open.length,
      critical,
      high,
      mitigating,
      resolved,
      averageScore,
    };
  }, [risks]);

  const filteredRisks = useMemo(() => {
    const normalizedSearch = search.toLowerCase().trim();

    return risks
      .filter((risk) => {
        const matchesSearch =
          !normalizedSearch ||
          [
            risk.id,
            risk.title,
            risk.description,
            risk.owner,
            risk.project,
            risk.category,
          ].some((value) => value.toLowerCase().includes(normalizedSearch));

        const matchesLevel =
          levelFilter === "All levels" || risk.level === levelFilter;
        const matchesStatus =
          statusFilter === "All statuses" || risk.status === statusFilter;
        const matchesCategory =
          categoryFilter === "All categories" ||
          risk.category === categoryFilter;

        return (
          matchesSearch && matchesLevel && matchesStatus && matchesCategory
        );
      })
      .sort((a, b) => {
        if (sortBy === "score") {
          return calculateRiskScore(b) - calculateRiskScore(a);
        }
        if (sortBy === "probability") {
          return b.probability - a.probability;
        }
        if (sortBy === "impact") {
          return b.impact - a.impact;
        }
        return levelOrder[b.level] - levelOrder[a.level];
      });
  }, [risks, search, levelFilter, statusFilter, categoryFilter, sortBy]);

  const categoryCounts = useMemo(
    () =>
      categories.map((category) => ({
        category,
        count: risks.filter(
          (risk) => risk.category === category && risk.status !== "Resolved",
        ).length,
      })),
    [risks],
  );

  function updateRiskStatus(id: string, status: RiskStatus) {
    setRisks((current) =>
      current.map((risk) =>
        risk.id === id ? { ...risk, status } : risk,
      ),
    );

    setSelectedRisk((current) =>
      current?.id === id ? { ...current, status } : current,
    );

    setNotice(`Risk ${id} updated to ${status.toLowerCase()}.`);
  }

  function addRisk(formData: FormData) {
    const title = String(formData.get("title") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const category = String(
      formData.get("category") || "Technical",
    ) as RiskCategory;
    const probability = Number(formData.get("probability") || 50);
    const impact = Number(formData.get("impact") || 50);
    const owner = String(formData.get("owner") || "").trim();
    const project = String(formData.get("project") || "").trim();
    const mitigation = String(formData.get("mitigation") || "").trim();

    if (!title || !owner || !project) return;

    const score = Math.round((probability * impact) / 100);
    const newRisk: Risk = {
      id: `RSK-${Date.now().toString().slice(-5)}`,
      title,
      description: description || "No additional description provided.",
      category,
      level: getRiskLevel(score),
      status: "Open",
      probability,
      impact,
      owner,
      project,
      dueDate: "Not scheduled",
      mitigation: mitigation || "Mitigation plan to be defined.",
    };

    setRisks((current) => [newRisk, ...current]);
    setShowCreateForm(false);
    setNotice("Risk created successfully in this demo.");
    setSearch("");
    setLevelFilter("All levels");
    setStatusFilter("All statuses");
    setCategoryFilter("All categories");
  }

  function resetFilters() {
    setSearch("");
    setLevelFilter("All levels");
    setStatusFilter("All statuses");
    setCategoryFilter("All categories");
    setSortBy("score");
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-[1600px] space-y-6 p-4 sm:p-6 lg:p-8">
        {/* Page heading */}
        <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-blue-700">
              <Shield size={16} />
              <span>Project intelligence</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-500">Risk Engine</span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Risk Engine
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
              Identify potential blockers, prioritize project risks, and keep
              mitigation actions moving before they affect delivery.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                resetFilters();
                setNotice("Filters reset.");
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              <Activity size={16} />
              Reset filters
            </button>
            <button
              type="button"
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <Plus size={17} />
              Add risk
            </button>
          </div>
        </div>

        {/* Demo data disclosure */}
        <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/80 p-4">
          <div className="mt-0.5 rounded-lg bg-blue-100 p-2 text-blue-700">
            <Zap size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold text-blue-900">
              Risk monitoring preview
            </p>
            <p className="mt-1 text-sm leading-5 text-blue-800/80">
              This page currently uses sample data and local state. Scores are
              calculated from the probability and impact values shown here;
              they are not live AI predictions or backend-synchronized records.
            </p>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Active risks"
            value={stats.open}
            detail="All unresolved risks"
            icon={ShieldAlert}
            tone="blue"
          />
          <MetricCard
            title="Critical risks"
            value={stats.critical}
            detail="Require immediate attention"
            icon={AlertTriangle}
            tone="rose"
          />
          <MetricCard
            title="High-priority risks"
            value={stats.high}
            detail="Elevated delivery exposure"
            icon={AlertCircle}
            tone="orange"
          />
          <MetricCard
            title="Mitigation in progress"
            value={stats.mitigating}
            detail={`${stats.resolved} resolved in this demo`}
            icon={ShieldCheck}
            tone="emerald"
          />
        </div>

        {/* Overview and category distribution */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 xl:col-span-2">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">Risk exposure overview</h2>
                <p className="mt-1 text-sm text-slate-500">
                  A quick view of the current sample risk portfolio.
                </p>
              </div>
              <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                {stats.open} active risks
              </span>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-500">
                    Average exposure score
                  </span>
                  <Gauge size={19} className="text-blue-600" />
                </div>
                <div className="mt-4 flex items-end gap-2">
                  <span className="text-4xl font-bold tracking-tight">
                    {stats.averageScore}
                  </span>
                  <span className="mb-1 text-sm text-slate-400">/ 100</span>
                </div>
                <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={`h-full rounded-full transition-all ${getRiskScoreColor(stats.averageScore)}`}
                    style={{ width: `${stats.averageScore}%` }}
                  />
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-500">
                  Average of probability × impact scores for unresolved risks.
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-500">
                    Mitigation coverage
                  </span>
                  <Target size={19} className="text-emerald-600" />
                </div>
                <div className="mt-4 flex items-end gap-2">
                  <span className="text-4xl font-bold tracking-tight">
                    {stats.open
                      ? Math.round((stats.mitigating / stats.open) * 100)
                      : 0}
                    %
                  </span>
                  <span className="mb-1 text-sm text-slate-400">
                    of active risks
                  </span>
                </div>
                <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{
                      width: `${
                        stats.open
                          ? (stats.mitigating / stats.open) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-500">
                  Active risks currently marked as mitigating.
                </p>
              </div>
            </div>

            <div className="mt-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800">
                  Active risk severity
                </h3>
                <span className="text-xs text-slate-400">By count</span>
              </div>

              <div className="space-y-4">
                {(
                  [
                    {
                      level: "Critical" as RiskLevel,
                      color: "bg-rose-500",
                    },
                    {
                      level: "High" as RiskLevel,
                      color: "bg-orange-500",
                    },
                    {
                      level: "Medium" as RiskLevel,
                      color: "bg-amber-500",
                    },
                    {
                      level: "Low" as RiskLevel,
                      color: "bg-emerald-500",
                    },
                  ]
                ).map((item) => {
                  const count = risks.filter(
                    (risk) =>
                      risk.level === item.level &&
                      risk.status !== "Resolved",
                  ).length;
                  const percentage = stats.open
                    ? (count / stats.open) * 100
                    : 0;

                  return (
                    <div
                      key={item.level}
                      className="grid grid-cols-[76px_1fr_28px] items-center gap-3"
                    >
                      <span className="text-sm text-slate-600">
                        {item.level}
                      </span>
                      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full ${item.color}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-right text-sm font-semibold text-slate-800">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold">Risk categories</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Unresolved risks by area.
                </p>
              </div>
              <div className="rounded-xl bg-violet-50 p-2.5 text-violet-600">
                <TrendingUp size={20} />
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {categoryCounts.map(({ category, count }) => {
                const percentage = stats.open
                  ? (count / stats.open) * 100
                  : 0;

                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() =>
                      setCategoryFilter(
                        categoryFilter === category
                          ? "All categories"
                          : category,
                      )
                    }
                    className={`w-full rounded-xl border p-3 text-left transition ${
                      categoryFilter === category
                        ? "border-blue-300 bg-blue-50"
                        : "border-transparent hover:border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-slate-700">
                        {category}
                      </span>
                      <span className="text-sm font-bold text-slate-900">
                        {count}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-blue-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 rounded-xl border border-dashed border-slate-200 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <CheckCircle2 size={17} className="text-emerald-600" />
                Resolved risks
              </div>
              <p className="mt-2 text-2xl font-bold">{stats.resolved}</p>
              <p className="mt-1 text-xs text-slate-500">
                Marked resolved in the current demo dataset.
              </p>
            </div>
          </section>
        </div>

        {/* Risk register */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:p-6 xl:flex-row xl:items-center">
            <div>
              <h2 className="text-lg font-bold">Risk register</h2>
              <p className="mt-1 text-sm text-slate-500">
                Search, prioritize, and manage the risks in your projects.
              </p>
            </div>
            <div className="relative w-full xl:max-w-sm">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search risks, owners, projects..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
              <Filter size={16} />
              Filters
            </div>

            <select
              value={levelFilter}
              onChange={(event) => setLevelFilter(event.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400"
              aria-label="Filter by risk level"
            >
              <option>All levels</option>
              <option>Critical</option>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400"
              aria-label="Filter by status"
            >
              <option>All statuses</option>
              <option>Open</option>
              <option>Mitigating</option>
              <option>Resolved</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400"
              aria-label="Filter by category"
            >
              <option>All categories</option>
              {categories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>

            <div className="ml-auto flex items-center gap-2">
              <span className="hidden text-xs text-slate-500 sm:inline">
                Sort by
              </span>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400"
                aria-label="Sort risks"
              >
                <option value="score">Exposure score</option>
                <option value="level">Severity</option>
                <option value="probability">Probability</option>
                <option value="impact">Impact</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-white text-xs uppercase tracking-wider text-slate-400">
                  <th className="px-6 py-4 font-semibold">Risk</th>
                  <th className="px-4 py-4 font-semibold">Severity</th>
                  <th className="px-4 py-4 font-semibold">Exposure</th>
                  <th className="px-4 py-4 font-semibold">Owner</th>
                  <th className="px-4 py-4 font-semibold">Due date</th>
                  <th className="px-4 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 text-right font-semibold">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRisks.map((risk) => {
                  const score = calculateRiskScore(risk);

                  return (
                    <tr
                      key={risk.id}
                      className="transition hover:bg-slate-50/80"
                    >
                      <td className="max-w-[340px] px-6 py-4">
                        <button
                          type="button"
                          onClick={() => setSelectedRisk(risk)}
                          className="text-left"
                        >
                          <span className="text-xs font-semibold text-blue-600">
                            {risk.id}
                          </span>
                          <span className="mt-1 block font-semibold text-slate-900 hover:text-blue-700">
                            {risk.title}
                          </span>
                          <span className="mt-1 block max-w-[310px] truncate text-xs text-slate-500">
                            {risk.description}
                          </span>
                          <span className="mt-2 inline-flex rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600">
                            {risk.category} · {risk.project}
                          </span>
                        </button>
                      </td>

                      <td className="px-4 py-4">
                        <LevelBadge level={risk.level} />
                      </td>

                      <td className="px-4 py-4">
                        <div className="w-28">
                          <div className="mb-1.5 flex items-center justify-between">
                            <span className="text-sm font-bold text-slate-800">
                              {score}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              /100
                            </span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={`h-full rounded-full ${getRiskScoreColor(score)}`}
                              style={{ width: `${score}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[11px] font-bold text-blue-700">
                            {getInitials(risk.owner)}
                          </div>
                          <span className="text-sm font-medium text-slate-700">
                            {risk.owner}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5 whitespace-nowrap text-sm text-slate-600">
                          <Clock3 size={14} className="text-slate-400" />
                          {risk.dueDate}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[risk.status]}`}
                        >
                          {risk.status}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedRisk(risk)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                        >
                          Details
                          <ArrowRight size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredRisks.length === 0 && (
              <div className="flex flex-col items-center px-6 py-16 text-center">
                <div className="rounded-2xl bg-slate-100 p-4 text-slate-400">
                  <Search size={26} />
                </div>
                <h3 className="mt-4 font-semibold text-slate-800">
                  No risks found
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Try another search term or adjust your filters.
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <span>
              Showing {filteredRisks.length} of {risks.length} risks
            </span>
            <span>Risk register · Demo data</span>
          </div>
        </section>

        {/* Risk scoring explanation */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
              <Gauge size={22} />
            </div>
            <div>
              <h2 className="font-bold">How risk exposure is calculated</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Exposure score = probability × impact ÷ 100. Probability and
                impact are represented on a 0–100 scale. The displayed
                severity is assigned using the score thresholds below.
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              {
                level: "Critical" as RiskLevel,
                range: "75–100",
              },
              {
                level: "High" as RiskLevel,
                range: "55–74",
              },
              {
                level: "Medium" as RiskLevel,
                range: "30–54",
              },
              {
                level: "Low" as RiskLevel,
                range: "0–29",
              },
            ].map((item) => (
              <div
                key={item.level}
                className="rounded-xl border border-slate-100 bg-slate-50 p-3"
              >
                <LevelBadge level={item.level} />
                <p className="mt-2 text-sm font-bold text-slate-800">
                  {item.range}
                </p>
                <p className="mt-1 text-xs text-slate-500">Exposure score</p>
              </div>
            ))}
          </div>
        </section>

        {notice && (
          <div className="fixed bottom-5 right-5 z-40 flex max-w-sm items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
            <CheckCircle2 size={19} className="mt-0.5 text-emerald-600" />
            <p className="flex-1 text-sm font-medium text-slate-700">
              {notice}
            </p>
            <button
              type="button"
              onClick={() => setNotice("")}
              aria-label="Dismiss notification"
              className="text-slate-400 hover:text-slate-700"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Risk details modal */}
        {selectedRisk && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setSelectedRisk(null);
              }
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="risk-dialog-title"
              className="my-auto w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5 sm:p-6">
                <div>
                  <span className="text-xs font-bold text-blue-600">
                    {selectedRisk.id}
                  </span>
                  <h2
                    id="risk-dialog-title"
                    className="mt-1 text-xl font-bold text-slate-900"
                  >
                    {selectedRisk.title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {selectedRisk.description}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedRisk(null)}
                  aria-label="Close risk details"
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  <X size={19} />
                </button>
              </div>

              <div className="space-y-5 p-5 sm:p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <LevelBadge level={selectedRisk.level} />
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[selectedRisk.status]}`}
                  >
                    {selectedRisk.status}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    {selectedRisk.category}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    {
                      label: "Exposure score",
                      value: calculateRiskScore(selectedRisk),
                    },
                    {
                      label: "Probability",
                      value: `${selectedRisk.probability}%`,
                    },
                    {
                      label: "Impact",
                      value: `${selectedRisk.impact}%`,
                    },
                    {
                      label: "Due date",
                      value: selectedRisk.dueDate,
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-xl border border-slate-100 bg-slate-50 p-3"
                    >
                      <p className="text-xs text-slate-500">{item.label}</p>
                      <p className="mt-2 break-words text-lg font-bold text-slate-900">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>

                <div>
                  <p className="text-sm font-bold text-slate-800">
                    Mitigation plan
                  </p>
                  <p className="mt-2 rounded-xl border border-blue-100 bg-blue-50/70 p-4 text-sm leading-6 text-slate-700">
                    {selectedRisk.mitigation}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-100 p-4">
                    <p className="text-xs font-medium text-slate-500">
                      Assigned owner
                    </p>
                    <p className="mt-2 font-semibold text-slate-800">
                      {selectedRisk.owner}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-100 p-4">
                    <p className="text-xs font-medium text-slate-500">
                      Project
                    </p>
                    <p className="mt-2 font-semibold text-slate-800">
                      {selectedRisk.project}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-sm font-bold text-slate-800">
                    Update risk status
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(
                      ["Open", "Mitigating", "Resolved"] as RiskStatus[]
                    ).map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() =>
                          updateRiskStatus(selectedRisk.id, status)
                        }
                        className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                          selectedRisk.status === status
                            ? "border-blue-600 bg-blue-600 text-white"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {status === "Resolved" && (
                          <Check size={14} className="mr-1 inline" />
                        )}
                        {status}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-slate-400">
                    Status changes apply only to this page's local demo state.
                  </p>
                </div>
              </div>

              <div className="flex justify-end border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-6">
                <button
                  type="button"
                  onClick={() => setSelectedRisk(null)}
                  className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
                >
                  Close details
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add risk modal */}
        {showCreateForm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setShowCreateForm(false);
              }
            }}
          >
            <form
              onSubmit={(event) => {
                event.preventDefault();
                addRisk(new FormData(event.currentTarget));
              }}
              className="my-auto max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 p-5 sm:p-6">
                <div>
                  <h2 className="text-xl font-bold">Add a new risk</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Record a potential issue and its mitigation plan.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  aria-label="Close add risk form"
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                >
                  <X size={19} />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 sm:p-6">
                <label className="sm:col-span-2">
                  <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Risk title *
                  </span>
                  <input
                    name="title"
                    required
                    maxLength={120}
                    placeholder="e.g. Database migration delay"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                  />
                </label>

                <label className="sm:col-span-2">
                  <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Description
                  </span>
                  <textarea
                    name="description"
                    rows={2}
                    maxLength={500}
                    placeholder="Describe what could go wrong..."
                    className="w-full resize-y rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                  />
                </label>

                <label>
                  <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Category
                  </span>
                  <select
                    name="category"
                    defaultValue="Technical"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-blue-400"
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Project *
                  </span>
                  <input
                    name="project"
                    required
                    maxLength={100}
                    placeholder="Project name"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                  />
                </label>

                <label>
                  <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Owner *
                  </span>
                  <input
                    name="owner"
                    required
                    maxLength={100}
                    placeholder="Responsible person"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                  />
                </label>

                <div className="hidden sm:block" />

                <label>
                  <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Probability: <span id="probability-value">50</span>%
                  </span>
                  <input
                    name="probability"
                    type="range"
                    min="0"
                    max="100"
                    defaultValue="50"
                    onChange={(event) => {
                      const output =
                        event.currentTarget.parentElement?.querySelector(
                          "#probability-value",
                        );
                      if (output) output.textContent = event.currentTarget.value;
                    }}
                    className="w-full accent-blue-600"
                  />
                  <span className="mt-1 block text-xs text-slate-400">
                    Likelihood of the risk occurring.
                  </span>
                </label>

                <label>
                  <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Impact: <span id="impact-value">50</span>%
                  </span>
                  <input
                    name="impact"
                    type="range"
                    min="0"
                    max="100"
                    defaultValue="50"
                    onChange={(event) => {
                      const output =
                        event.currentTarget.parentElement?.querySelector(
                          "#impact-value",
                        );
                      if (output) output.textContent = event.currentTarget.value;
                    }}
                    className="w-full accent-blue-600"
                  />
                  <span className="mt-1 block text-xs text-slate-400">
                    Potential effect on delivery or quality.
                  </span>
                </label>

                <label className="sm:col-span-2">
                  <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Mitigation plan
                  </span>
                  <textarea
                    name="mitigation"
                    rows={3}
                    maxLength={1000}
                    placeholder="What action will reduce the risk?"
                    className="w-full resize-y rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                  />
                </label>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/70 p-5 sm:flex-row sm:justify-end sm:px-6">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Create risk
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
