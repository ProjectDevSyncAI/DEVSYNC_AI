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

export function calculateCompletionRate(
  completed: number,
  total: number,
): number {
  if (total <= 0) return 0;
  return Math.round((completed / total) * 100);
}

export function calculatePercentageChange(
  current: number,
  previous: number,
): number {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}