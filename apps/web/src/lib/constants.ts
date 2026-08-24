export const APP_NAME = "DevSync AI";

export const APP_DESCRIPTION =
  "AI-powered engineering intelligence platform for modern development teams.";

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000";

export const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";

export const STORAGE_KEYS = {
  AUTH_TOKEN: "devsync_auth_token",
  USER: "devsync_user",
  ACTIVE_PROJECT: "devsync_active_project",
  ACTIVE_WORKSPACE: "devsync_active_workspace",
  THEME: "devsync_theme",
} as const;

export const ROUTES = {
  LOGIN: "/login",
  REGISTER: "/register",
  DASHBOARD: "/dashboard",
  PROJECTS: "/projects",
  TASKS: "/tasks",
  SETTINGS: "/settings",
  NOT_FOUND: "*",
} as const;

export const PROJECT_STATUS = {
  ACTIVE: "ACTIVE",
  ARCHIVED: "ARCHIVED",
  COMPLETED: "COMPLETED",
} as const;

export const TASK_STATUS = {
  TODO: "TODO",
  IN_PROGRESS: "IN_PROGRESS",
  REVIEW: "REVIEW",
  DONE: "DONE",
} as const;

export const TASK_PRIORITY = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL",
} as const;

export const RISK_SEVERITY = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL",
} as const;

export const RISK_STATUS = {
  OPEN: "OPEN",
  ACKNOWLEDGED: "ACKNOWLEDGED",
  MITIGATED: "MITIGATED",
  RESOLVED: "RESOLVED",
  IGNORED: "IGNORED",
} as const;

export const QUERY_KEYS = {
  PROJECTS: "projects",
  PROJECT: "project",
  TASKS: "tasks",
  RISKS: "risks",
  CONVERSATIONS: "conversations",
  DOCUMENTS: "documents",
  RELEASE_NOTES: "release-notes",
  STANDUPS: "standups",
  SPRINTS: "sprints",
  DASHBOARD: "dashboard",
  ANALYTICS: "analytics",
} as const;