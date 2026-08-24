import React from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Clock3,
  ShieldAlert,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

type Stat = {
  name: string;
  value: string;
  icon: React.ElementType;
};

const stats: Stat[] = [
  {
    name: "Active Risks",
    value: "7",
    icon: ShieldAlert,
  },
  {
    name: "Critical",
    value: "2",
    icon: AlertTriangle,
  },
  {
    name: "Mitigated",
    value: "14",
    icon: CheckCircle2,
  },
  {
    name: "Risk Score",
    value: "28",
    icon: TrendingUp,
  },
];

const risks = [
  {
    title: "Backend API latency",
    description:
      "Recent API response times are above the target threshold during peak usage.",
    severity: "Critical",
    probability: "High",
    owner: "DB",
    trend: "up",
  },
  {
    title: "Sprint capacity",
    description:
      "The current sprint has more planned work than the team's estimated capacity.",
    severity: "High",
    probability: "Medium",
    owner: "AK",
    trend: "up",
  },
  {
    title: "AI response quality",
    description:
      "Generated sprint recommendations may require additional validation.",
    severity: "Medium",
    probability: "Medium",
    owner: "RS",
    trend: "down",
  },
  {
    title: "Deployment dependency",
    description:
      "Production deployment depends on completion of infrastructure configuration.",
    severity: "Low",
    probability: "Low",
    owner: "MK",
    trend: "down",
  },
];

function severityClasses(severity: string) {
  switch (severity) {
    case "Critical":
      return "border-red-200 bg-red-50 text-red-700";
    case "High":
      return "border-orange-200 bg-orange-50 text-orange-700";
    case "Medium":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}

export default function Risks() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-3 flex items-center gap-2">
            <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600">
              AI RISK ENGINE
            </span>

            <span className="text-xs text-slate-400">
              Real-time project intelligence
            </span>
          </div>

          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Risk Intelligence
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Identify delivery risks before they become blockers using
                project activity, sprint health and engineering signals.
              </p>
            </div>

            <button
              type="button"
              className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
            >
              <Zap className="h-4 w-4" />
              Run AI Analysis
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map(({ name, value, icon: Icon }) => (
            <div
              key={name}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-sm font-medium text-slate-500">
                    {name}
                  </span>

                  <p className="mt-3 text-2xl font-bold">{value}</p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100">
                  <Icon className="h-5 w-5 text-slate-700" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_350px]">
          {/* Risk list */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 p-6">
              <div>
                <h2 className="text-lg font-bold">Detected Risks</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Prioritized by impact and probability
                </p>
              </div>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                7 active
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {risks.map((risk) => (
                <div
                  key={risk.title}
                  className="p-6 transition hover:bg-slate-50/70"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex gap-4">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${severityClasses(
                          risk.severity,
                        )}`}
                      >
                        <AlertTriangle className="h-5 w-5" />
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="font-semibold">{risk.title}</h3>

                          <span
                            className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${severityClasses(
                              risk.severity,
                            )}`}
                          >
                            {risk.severity}
                          </span>
                        </div>

                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                          {risk.description}
                        </p>

                        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                          <span>
                            Probability:{" "}
                            <strong className="text-slate-700">
                              {risk.probability}
                            </strong>
                          </span>

                          <span className="flex items-center gap-1">
                            Owner:
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
                              {risk.owner}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {risk.trend === "up" ? (
                        <ArrowUp className="h-4 w-4 text-red-500" />
                      ) : (
                        <ArrowDown className="h-4 w-4 text-emerald-500" />
                      )}

                      <span className="text-xs font-medium text-slate-500">
                        Trend
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Intelligence */}
          <aside className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900">
                  <Target className="h-5 w-5 text-white" />
                </div>

                <div>
                  <h2 className="font-bold">AI Recommendation</h2>
                  <p className="text-xs text-slate-400">
                    Updated 4 minutes ago
                  </p>
                </div>
              </div>

              <p className="text-sm leading-6 text-slate-600">
                Consider reducing sprint scope by approximately 15% and
                prioritizing the backend latency issue before adding new
                features.
              </p>

              <button
                type="button"
                className="mt-5 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Apply Recommendation
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="font-bold">Risk Distribution</h2>

              <div className="mt-6 space-y-5">
                {[
                  ["Critical", 2, "w-[30%]"],
                  ["High", 3, "w-[45%]"],
                  ["Medium", 5, "w-[65%]"],
                  ["Low", 7, "w-[80%]"],
                ].map(([label, count, width]) => (
                  <div key={label}>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-slate-500">{label}</span>
                      <span className="font-semibold">{count}</span>
                    </div>

                    <div className="h-2 rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full bg-slate-900 ${width}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-slate-500" />
                <span className="font-semibold">Team Exposure</span>
              </div>

              <p className="mt-4 text-3xl font-bold">28%</p>

              <p className="mt-1 text-sm text-slate-500">
                of current work is exposed to identified risks.
              </p>

              <div className="mt-5 flex items-center gap-2 text-xs text-emerald-600">
                <Clock3 className="h-4 w-4" />
                Improving from last sprint
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}