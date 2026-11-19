<<<<<<< HEAD
import type { Issue, Sprint } from "../../lib/api";

export interface SprintCalculatedMetrics {
  totalTasks: number;
  completedTasks: number;
  remainingTasks: number;
  plannedStoryPoints: number;
  completedStoryPoints: number;
  completionPercentage: number;
}

export interface UnresolvedBugMetrics {
  count: number;
  ratio: number;
  percentage: string;
  hasIssues: boolean;
}

export interface IssueResolutionMetrics {
  resolved: number;
  closed: number;
  totalResolved: number;
  total: number;
  percentage: number;
}

/**
 * Calculates sprint operational metrics from task records associated with the sprint.
 * - Planned story points: sum of non-null storyPoints for all sprint tasks.
 * - Delivered story points: sum of non-null storyPoints for tasks with status DONE.
 * - Completion percentage: completedTasks / totalTasks * 100.
 */
export function calculateSprintMetrics(sprint: Sprint): SprintCalculatedMetrics {
  const tasks = sprint.tasks ?? [];
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "DONE").length;
  const remainingTasks = Math.max(0, totalTasks - completedTasks);

  const plannedStoryPoints = tasks.reduce(
    (sum, t) => sum + (t.storyPoints ?? 0),
    0,
  );
  const completedStoryPoints = tasks
    .filter((t) => t.status === "DONE")
    .reduce((sum, t) => sum + (t.storyPoints ?? 0), 0);

  const completionPercentage =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return {
    totalTasks,
    completedTasks,
    remainingTasks,
    plannedStoryPoints,
    completedStoryPoints,
    completionPercentage,
  };
}

/**
 * Calculates the unresolved bug ratio:
 * Unresolved BUG issues (statuses: OPEN, IN_PROGRESS, REOPENED) divided by total project issues.
 * Safely handles 0 total issues without producing NaN or Infinity.
 */
export function calculateUnresolvedBugMetrics(
  issues: Issue[],
): UnresolvedBugMetrics {
  const total = issues.length;
  if (total === 0) {
    return {
      count: 0,
      ratio: 0,
      percentage: "0.0%",
      hasIssues: false,
    };
  }

  const unresolvedBugs = issues.filter(
    (i) =>
      i.type === "BUG" &&
      (i.status === "OPEN" ||
        i.status === "IN_PROGRESS" ||
        i.status === "REOPENED"),
  ).length;

  const ratio = unresolvedBugs / total;
  const percentage = `${(ratio * 100).toFixed(1)}%`;

  return {
    count: unresolvedBugs,
    ratio,
    percentage,
    hasIssues: true,
  };
}

/**
 * Calculates issue resolution counts and resolution percentage.
 */
export function calculateIssueResolutionMetrics(
  issues: Issue[],
): IssueResolutionMetrics {
  const total = issues.length;
  const resolved = issues.filter((i) => i.status === "RESOLVED").length;
  const closed = issues.filter((i) => i.status === "CLOSED").length;
  const totalResolved = resolved + closed;
  const percentage =
    total > 0 ? Math.round((totalResolved / total) * 100) : 0;

  return {
    resolved,
    closed,
    totalResolved,
    total,
    percentage,
  };
}

/**
 * Calculates generic completion rate safely avoiding division by zero.
 */
=======
export interface AnalyticsMetric {
  id: string;
  label: string;
  value: number;
  change: number;
  unit?: string;
  trend: "up" | "down" | "neutral";
}

export interface AnalyticsPoint {
  label: string;
  value: number;
}

export interface AnalyticsSummary {
  metrics: AnalyticsMetric[];
  activity: AnalyticsPoint[];
  generatedAt: string;
}

export const defaultAnalytics: AnalyticsSummary = {
  metrics: [
    {
      id: "velocity",
      label: "Team Velocity",
      value: 84,
      change: 12.4,
      unit: "pts",
      trend: "up",
    },
    {
      id: "completion",
      label: "Completion Rate",
      value: 78,
      change: 6.2,
      unit: "%",
      trend: "up",
    },
    {
      id: "cycle-time",
      label: "Avg Cycle Time",
      value: 3.4,
      change: -8.1,
      unit: "days",
      trend: "up",
    },
    {
      id: "blocked",
      label: "Blocked Tasks",
      value: 7,
      change: -22.5,
      trend: "up",
    },
  ],
  activity: [
    { label: "Mon", value: 42 },
    { label: "Tue", value: 56 },
    { label: "Wed", value: 48 },
    { label: "Thu", value: 71 },
    { label: "Fri", value: 64 },
    { label: "Sat", value: 35 },
    { label: "Sun", value: 28 },
  ],
  generatedAt: new Date().toISOString(),
};

>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
export function calculateCompletionRate(
  completed: number,
  total: number,
): number {
  if (total <= 0) return 0;
  return Math.round((completed / total) * 100);
}
<<<<<<< HEAD
=======

export function calculatePercentageChange(
  current: number,
  previous: number,
): number {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
