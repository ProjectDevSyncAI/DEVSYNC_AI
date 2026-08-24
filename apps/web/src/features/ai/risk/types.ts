export type RiskLevel =
  | "low"
  | "medium"
  | "high"
  | "critical";

export type RiskCategory =
  | "schedule"
  | "scope"
  | "technical"
  | "resource"
  | "quality"
  | "dependency"
  | "security";

export interface ProjectRisk {
  id: string;
  title: string;
  description: string;
  category: RiskCategory;
  level: RiskLevel;
  probability: number;
  impact: number;
  riskScore: number;
  mitigation: string;
  ownerId?: string;
  createdAt: string;
}

export interface RiskAnalysisRequest {
  projectId: string;
  overdueTasks: number;
  blockedTasks: number;
  unresolvedIssues: number;
  openPullRequests: number;
  teamCapacity: number;
  plannedWork: number;
}

export interface RiskAnalysisResult {
  projectId: string;
  overallRisk: RiskLevel;
  score: number;
  risks: ProjectRisk[];
  analyzedAt: string;
}