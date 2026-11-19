import type { ReactNode } from "react";

export interface AppRoute {
  path: string;
  label: string;
  description?: string;
  element?: ReactNode;
  protected?: boolean;
  roles?: string[];
}

export const appRoutes: AppRoute[] = [
  {
    path: "/",
    label: "Dashboard",
    description: "Workspace overview",
    protected: true,
  },
  {
    path: "/projects",
    label: "Projects",
    description: "Manage engineering projects",
    protected: true,
  },
  {
    path: "/tasks",
    label: "My Tasks",
    description: "Track assigned work",
    protected: true,
  },
  {
    path: "/sprints",
    label: "Sprint Planner",
    description: "Plan and manage sprints",
    protected: true,
  },
  {
    path: "/standup",
    label: "AI Standup",
    description: "Generate intelligent standups",
    protected: true,
  },
  {
    path: "/risks",
    label: "Risk Engine",
    description: "Monitor project risks",
    protected: true,
  },
  {
    path: "/login",
    label: "Login",
    protected: false,
  },
  {
    path: "/register",
    label: "Register",
    protected: false,
  },
<<<<<<< HEAD
  {
    path: "/verify-email",
    label: "Verify Email",
    description: "Confirm email verification token",
    protected: false,
  },
=======
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
];