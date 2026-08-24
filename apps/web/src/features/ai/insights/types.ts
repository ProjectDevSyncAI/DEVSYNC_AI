export type InsightSeverity =
  | "info"
  | "success"
  | "warning"
  | "critical";

export type InsightCategory =
  | "productivity"
  | "delivery"
  | "quality"
  | "team"
  | "risk"
  | "performance";

export interface AIInsight {
  id: string;
  title: string;
  description: string;
  category: InsightCategory;
  severity: InsightSeverity;
  confidence: number;
  impact: string;
  recommendation: string;
  createdAt: string;
}

export interface InsightsRequest {
  projectId: string;
  completedTasks: number;
  totalTasks: number;
  blockedTasks: number;
  overdueTasks: number;
  teamMembers: number;
  velocity?: number;
}

export interface InsightsResult {
  projectId: string;
  insights: AIInsight[];
  healthScore: number;
  generatedAt: string;
}