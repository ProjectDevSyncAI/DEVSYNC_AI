export type ThemeMode = "light" | "dark" | "system";

export interface UserSettings {
  userId: string;
  theme: ThemeMode;
  language: string;
  timezone: string;
  compactMode: boolean;
  animations: boolean;
  emailNotifications: boolean;
  desktopNotifications: boolean;
  soundNotifications: boolean;
}

export interface WorkspaceSettings {
  workspaceId: string;
  name: string;
  defaultTaskStatus: string;
  defaultPriority: string;
  autoAssignTasks: boolean;
  enableAiFeatures: boolean;
  enableGithubIntegration: boolean;
  enableRealtime: boolean;
}

export function getDefaultUserSettings(userId: string): UserSettings {
  return {
    userId,
    theme: "system",
    language: "en",
    timezone: "UTC",
    compactMode: false,
    animations: true,
    emailNotifications: true,
    desktopNotifications: true,
    soundNotifications: true,
  };
}

export function getDefaultWorkspaceSettings(
  workspaceId: string,
): WorkspaceSettings {
  return {
    workspaceId,
    name: "My Workspace",
    defaultTaskStatus: "todo",
    defaultPriority: "medium",
    autoAssignTasks: false,
    enableAiFeatures: true,
    enableGithubIntegration: true,
    enableRealtime: true,
  };
}