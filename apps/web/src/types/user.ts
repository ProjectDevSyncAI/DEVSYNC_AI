import type { ID, Status, TimeStamped } from "./common";

export type UserRole =
  | "admin"
  | "manager"
  | "developer"
  | "member"
  | "user";

export interface User extends TimeStamped {
  id: ID;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  status: Status;
  jobTitle?: string;
  department?: string;
  timezone?: string;
  lastActiveAt?: string;
}

export interface TeamMember {
  user: User;
  joinedAt: string;
  workload?: number;
  activeTasks?: number;
}

export interface UserPreferences {
  theme: "light" | "dark" | "system";
  compactMode: boolean;
  emailNotifications: boolean;
  desktopNotifications: boolean;
  aiSuggestions: boolean;
}