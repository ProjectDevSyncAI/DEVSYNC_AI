<<<<<<< HEAD
import {
  dashboardApi,
  type DashboardOverviewResponse,
  type ProjectMetadataOverview,
  type TaskMetricsOverview,
  type IssueMetricsOverview,
  type ActiveSprintOverview,
} from "../../../lib/api";

export type {
  DashboardOverviewResponse,
  ProjectMetadataOverview,
  TaskMetricsOverview,
  IssueMetricsOverview,
  ActiveSprintOverview,
};

/**
 * Legacy UI component interfaces preserved for type compatibility
 */
=======
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
export interface DashboardProject {
  id: string;
  name: string;
  description?: string;
  progress: number;
  status: "active" | "completed" | "paused";
  members: number;
  tasks: number;
  completedTasks: number;
}

export interface DashboardActivity {
  id: string;
  title: string;
  description: string;
<<<<<<< HEAD
  type: "task" | "project" | "comment" | "deployment" | "member";
=======
  type:
    | "task"
    | "project"
    | "comment"
    | "deployment"
    | "member";
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
  createdAt: string;
  userName: string;
}

<<<<<<< HEAD
/**
 * Fetches real-time operational dashboard overview metrics for a given project.
 * Directly integrates with backend endpoint GET /analytics/project/:projectId/dashboard
 */
export async function getDashboardOverview(
  projectId: string,
): Promise<DashboardOverviewResponse> {
  return dashboardApi.getDashboardOverview(projectId);
}
=======
export interface DashboardStats {
  projects: number;
  activeProjects: number;
  tasks: number;
  completedTasks: number;
  overdueTasks: number;
  teamMembers: number;
}

export interface DashboardData {
  stats: DashboardStats;
  projects: DashboardProject[];
  activities: DashboardActivity[];
}

export async function getDashboardData(): Promise<DashboardData> {
  await Promise.resolve();

  return {
    stats: {
      projects: 8,
      activeProjects: 5,
      tasks: 124,
      completedTasks: 87,
      overdueTasks: 6,
      teamMembers: 18,
    },

    projects: [
      {
        id: "project-1",
        name: "DevSync AI",
        description:
          "AI-powered developer collaboration platform.",
        progress: 78,
        status: "active",
        members: 8,
        tasks: 42,
        completedTasks: 33,
      },
      {
        id: "project-2",
        name: "Mobile Application",
        description:
          "Next-generation mobile product experience.",
        progress: 54,
        status: "active",
        members: 6,
        tasks: 31,
        completedTasks: 17,
      },
      {
        id: "project-3",
        name: "Analytics Platform",
        description:
          "Real-time engineering analytics.",
        progress: 91,
        status: "active",
        members: 5,
        tasks: 24,
        completedTasks: 22,
      },
    ],

    activities: [
      {
        id: "activity-1",
        title: "Task completed",
        description:
          "Authentication flow was marked as completed.",
        type: "task",
        createdAt: new Date().toISOString(),
        userName: "Alex Morgan",
      },
      {
        id: "activity-2",
        title: "Pull request merged",
        description:
          "Dashboard redesign was successfully merged.",
        type: "deployment",
        createdAt: new Date().toISOString(),
        userName: "Jordan Lee",
      },
      {
        id: "activity-3",
        title: "New team member",
        description:
          "Taylor joined the engineering workspace.",
        type: "member",
        createdAt: new Date().toISOString(),
        userName: "Taylor Smith",
      },
    ],
  };
}
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
