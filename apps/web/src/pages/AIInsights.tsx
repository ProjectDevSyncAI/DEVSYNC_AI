
import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Lightbulb,
  RefreshCw,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";

type InsightCategory = "All" | "Productivity" | "Risks" | "Planning";

type Insight = {
  id: number;
  category: Exclude<InsightCategory, "All">;
  title: string;
  description: string;
  impact: "High" | "Medium" | "Low";
  recommendation: string;
  time: string;
};

const insights: Insight[] = [
  {
    id: 1,
    category: "Risks",
    title: "Potential delivery bottleneck",
    description:
      "Several tasks may depend on a small number of contributors. Review ownership and dependencies before the next milestone.",
    impact: "High",
    recommendation:
      "Review task dependencies and distribute work where possible.",
    time: "Priority review",
  },
  {
    id: 2,
    category: "Productivity",
    title: "Improve focus time",
    description:
      "Grouping similar work into focused blocks may reduce context switching and improve execution.",
    impact: "Medium",
    recommendation:
      "Try dedicated focus blocks for code reviews, implementation, and testing.",
    time: "Productivity tip",
  },
  {
    id: 3,
    category: "Planning",
    title: "Review upcoming milestones",
    description:
      "A short milestone review can help surface unfinished work before it affects delivery plans.",
    impact: "High",
    recommendation:
      "Check due dates, blockers, and task ownership during your next planning session.",
    time: "Planning review",
  },
  {
    id: 4,
    category: "Productivity",
    title: "Keep task status current",
    description:
      "Consistent task updates help teammates understand progress and identify work that needs attention.",
    impact: "Low",
    recommendation:
      "Update task statuses at the end of each work session.",
    time: "Team workflow",
  },
];

const filters: InsightCategory[] = [
  "All",
  "Productivity",
  "Risks",
  "Planning",
];

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof Activity;
  tone: "indigo" | "emerald" | "amber" | "violet";
}) {
  const tones = {
    indigo:
      "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300",
    emerald:
      "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300",
    amber:
      "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300",
    violet:
      "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {value}
          </p>
        </div>
        <div className={`rounded-xl p-3 ${tones[tone]}`}>
          <Icon size={20} />
        </div>
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
        {detail}
      </p>
    </div>
  );
}

function ImpactBadge({ impact }: { impact: Insight["impact"] }) {
  const classes = {
    High: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
    Medium:
      "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
    Low: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold ${classes[impact]}`}
    >
      {impact} impact
    </span>
  );
}

export default function AIInsights() {
  const [activeFilter, setActiveFilter] =
    useState<InsightCategory>("All");
  const [search, setSearch] = useState("");
  const [dismissed, setDismissed] = useState<number[]>([]);
  const [completed, setCompleted] = useState<number[]>([]);
  const [refreshMessage, setRefreshMessage] = useState("");

  const visibleInsights = useMemo(() => {
    const query = search.trim().toLowerCase();

    return insights.filter((insight) => {
      const matchesFilter =
        activeFilter === "All" || insight.category === activeFilter;
      const matchesSearch =
        !query ||
        insight.title.toLowerCase().includes(query) ||
        insight.description.toLowerCase().includes(query) ||
        insight.recommendation.toLowerCase().includes(query);
      const isVisible = !dismissed.includes(insight.id);

      return matchesFilter && matchesSearch && isVisible;
    });
  }, [activeFilter, search, dismissed]);

  function refreshInsights() {
    setRefreshMessage(
      "Your insight cards have been refreshed. Connect your project data to generate live analysis."
    );
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-7">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-950 p-6 text-white shadow-xl shadow-indigo-950/10 sm:p-9">
        <div className="absolute -right-12 -top-24 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-7 lg:flex-row lg:items-center">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-300/20 bg-white/[0.08] px-3 py-1.5 text-xs font-semibold text-indigo-200">
              <Sparkles size={14} />
              INTELLIGENCE CENTER
            </div>

            <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
              AI Insights
              <span className="text-indigo-300">.</span>
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
              Turn project activity into clearer decisions. Review workflow
              suggestions, potential risks, and planning opportunities in one
              place.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={refreshInsights}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-indigo-950 transition hover:bg-indigo-50"
              >
                <RefreshCw size={16} />
                Refresh insights
              </button>

              <span className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-4 py-3 text-xs text-slate-300">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                Demo insights
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:min-w-[300px]">
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur">
              <div className="flex items-center gap-2 text-indigo-200">
                <BrainCircuit size={17} />
                <span className="text-xs">Recommendations</span>
              </div>
              <p className="mt-4 text-3xl font-bold">04</p>
              <p className="mt-1 text-[11px] text-slate-400">
                Sample suggestions
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur">
              <div className="flex items-center gap-2 text-amber-200">
                <AlertTriangle size={17} />
                <span className="text-xs">Priority reviews</span>
              </div>
              <p className="mt-4 text-3xl font-bold">02</p>
              <p className="mt-1 text-[11px] text-slate-400">
                Suggested reviews
              </p>
            </div>
          </div>
        </div>
      </section>

      {refreshMessage && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-800 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-200"
        >
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          <p className="flex-1">{refreshMessage}</p>
          <button
            type="button"
            onClick={() => setRefreshMessage("")}
            aria-label="Dismiss message"
            className="text-current opacity-70 hover:opacity-100"
          >
            ×
          </button>
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Project health"
          value="Monitor"
          detail="Review progress and blockers before drawing conclusions."
          icon={Activity}
          tone="indigo"
        />
        <MetricCard
          label="Delivery focus"
          value="High"
          detail="Prioritize milestone readiness and task ownership."
          icon={Target}
          tone="emerald"
        />
        <MetricCard
          label="Risk reviews"
          value="02"
          detail="Two sample recommendations suggest a closer review."
          icon={AlertTriangle}
          tone="amber"
        />
        <MetricCard
          label="Workflow ideas"
          value="04"
          detail="Sample recommendations available for review."
          icon={Lightbulb}
          tone="violet"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.8fr)]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Recommendations
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Review suggestions and mark actions as completed.
              </p>
            </div>

            <div className="relative">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search insights..."
                aria-label="Search insights"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-xs outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 sm:w-52"
              />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={[
                  "rounded-lg px-3 py-2 text-xs font-semibold transition",
                  activeFilter === filter
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700",
                ].join(" ")}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="mt-5 space-y-3">
            {visibleInsights.map((insight) => {
              const isCompleted = completed.includes(insight.id);

              return (
                <article
                  key={insight.id}
                  className="rounded-xl border border-slate-200 p-4 transition hover:border-indigo-200 dark:border-slate-800 dark:hover:border-indigo-500/30"
                >
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div className="flex min-w-0 gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                        {insight.category === "Risks" ? (
                          <AlertTriangle size={19} />
                        ) : insight.category === "Planning" ? (
                          <Target size={19} />
                        ) : (
                          <Zap size={19} />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3
                            className={[
                              "text-sm font-bold text-slate-900 dark:text-white",
                              isCompleted ? "line-through opacity-60" : "",
                            ].join(" ")}
                          >
                            {insight.title}
                          </h3>
                          {isCompleted && (
                            <span className="text-[10px] font-semibold text-emerald-600">
                              Completed
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                          {insight.description}
                        </p>
                      </div>
                    </div>

                    <ImpactBadge impact={insight.impact} />
                  </div>

                  <div className="mt-4 rounded-xl bg-slate-50 p-3 dark:bg-slate-950/70">
                    <div className="flex items-start gap-2">
                      <Lightbulb
                        size={15}
                        className="mt-0.5 shrink-0 text-amber-500"
                      />
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                          Suggested action
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-700 dark:text-slate-300">
                          {insight.recommendation}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <span className="flex items-center gap-1.5 text-[10px] text-slate-400">
                      <Clock3 size={12} />
                      {insight.time}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setDismissed((current) => [
                            ...current,
                            insight.id,
                          ])
                        }
                        className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        Dismiss
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setCompleted((current) =>
                            current.includes(insight.id)
                              ? current.filter((id) => id !== insight.id)
                              : [...current, insight.id]
                          )
                        }
                        className={[
                          "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition",
                          isCompleted
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                            : "bg-indigo-600 text-white hover:bg-indigo-700",
                        ].join(" ")}
                      >
                        <CheckCircle2 size={14} />
                        {isCompleted ? "Undo" : "Mark done"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}

            {visibleInsights.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-300 px-5 py-12 text-center dark:border-slate-700">
                <Search
                  size={24}
                  className="mx-auto text-slate-400"
                />
                <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                  No insights found
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Try another search or select a different category.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setActiveFilter("All");
                  }}
                  className="mt-3 text-xs font-semibold text-indigo-600"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-900 dark:text-white">
                  Focus areas
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Suggested areas for review
                </p>
              </div>
              <TrendingUp size={19} className="text-indigo-500" />
            </div>

            <div className="mt-5 space-y-5">
              {[
                {
                  label: "Milestone readiness",
                  detail: "Review upcoming deliverables",
                  value: 82,
                  color: "bg-indigo-500",
                },
                {
                  label: "Task ownership",
                  detail: "Check assignment distribution",
                  value: 68,
                  color: "bg-violet-500",
                },
                {
                  label: "Workflow consistency",
                  detail: "Keep task updates current",
                  value: 74,
                  color: "bg-emerald-500",
                },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {item.label}
                      </p>
                      <p className="mt-1 text-[10px] text-slate-400">
                        {item.detail}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      {item.value}%
                    </span>
                  </div>

                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className={`h-full rounded-full ${item.color}`}
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-5 rounded-xl bg-amber-50 p-3 text-[11px] leading-5 text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
              These percentages are illustrative UI values, not calculated
              project analytics.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 dark:text-white">
                  Action tracker
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Your review progress
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {completed.length}
                  <span className="text-lg font-medium text-slate-400">
                    {" "}
                    / {insights.length}
                  </span>
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Sample recommendations reviewed
                </p>
              </div>
              <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
                <Target size={20} />
              </div>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{
                  width: `${(completed.length / insights.length) * 100}%`,
                }}
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setActiveFilter("All");
                setSearch("");
                setDismissed([]);
              }}
              className="mt-5 flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-xs font-semibold text-slate-600 transition hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-300"
            >
              Restore dismissed insights
              <ArrowRight size={15} />
            </button>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 p-5 text-white shadow-lg shadow-indigo-950/10">
            <div className="flex items-center gap-2 text-indigo-100">
              <Sparkles size={17} />
              <span className="text-xs font-semibold uppercase tracking-wide">
                AI workspace
              </span>
            </div>

            <h2 className="mt-3 text-lg font-bold">
              Better decisions start with better context.
            </h2>

            <p className="mt-2 text-xs leading-5 text-indigo-100">
              Connect project activity and a real AI analysis service to
              replace these examples with data-driven recommendations.
            </p>

            <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-white/90">
              <ArrowUpRight size={15} />
              Ready for integration
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white">
              Insight workflow
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              A simple review process for your team.
            </p>
          </div>

          <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
            <Activity size={14} />
            Sample workflow
          </span>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {[
            {
              number: "01",
              title: "Observe",
              text: "Review task progress, ownership, and project activity.",
              icon: Search,
            },
            {
              number: "02",
              title: "Prioritize",
              text: "Identify which risks or opportunities deserve attention.",
              icon: Target,
            },
            {
              number: "03",
              title: "Act",
              text: "Assign an owner and track the next step.",
              icon: CheckCircle2,
            },
          ].map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="relative rounded-xl border border-slate-200 p-4 dark:border-slate-800"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-500">
                    {step.number}
                  </span>
                  <Icon size={18} className="text-slate-400" />
                </div>

                <h3 className="mt-4 text-sm font-bold text-slate-900 dark:text-white">
                  {step.title}
                </h3>
                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                  {step.text}
                </p>

                {index < 2 && (
                  <ArrowDownRight
                    size={16}
                    className="absolute -bottom-5 right-4 z-10 hidden text-slate-300 md:block"
                  />
                )}
              </div>
            );
          })}
        </div>
      </section>

      <div className="flex items-center justify-between gap-3 text-[10px] text-slate-400">
        <span>DevSync AI · Intelligence Center</span>
        <span className="inline-flex items-center gap-1">
          <ChevronDown size={12} />
          Demo data only
        </span>
      </div>
    </div>
  );
}
