import type {
  ID,
  Priority,
  RiskLevel,
  Status,
  TimeStamped,
} from "./common";

export type ProjectStatus =
  | "planning"
  | "active"
  | "on_hold"
  | "completed"
  | "archived";

export interface Project extends TimeStamped {
  id: ID;
  name: string;
  key: string;
  description?: string;
  status: ProjectStatus;
  priority: Priority;
  progress: number;
  startDate?: string;
  targetDate?: string;
  ownerId: ID;
  memberIds: ID[];
  repository?: string;
  technologies: string[];
  health: "healthy" | "warning" | "critical";
  riskLevel: RiskLevel;
  taskCount: number;
  completedTaskCount: number;
}

export interface ProjectActivity {
  id: ID;
  projectId: ID;
  type:
    | "commit"
    | "task"
    | "deployment"
    | "comment"
    | "member"
    | "status";
  title: string;
  description?: string;
  actorId: ID;
  createdAt: string;
}

export interface ProjectMetric {
  label: string;
  value: number | string;
  change?: number;
  trend?: "up" | "down" | "neutral";
  icon?: string;
}