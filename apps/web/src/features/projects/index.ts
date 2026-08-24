export type ProjectStatus =
  | "planning"
  | "active"
  | "on_hold"
  | "completed"
  | "archived";

export type ProjectVisibility = "private" | "internal" | "public";

export interface Project {
  id: string;
  key: string;
  name: string;
  description?: string;
  organizationId: string;
  ownerId: string;
  status: ProjectStatus;
  visibility: ProjectVisibility;
  progress: number;
  memberCount: number;
  taskCount: number;
  completedTaskCount: number;
  startDate?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectFilter {
  status?: ProjectStatus[];
  visibility?: ProjectVisibility[];
  organizationId?: string;
  search?: string;
}

export function calculateProjectProgress(
  completedTasks: number,
  totalTasks: number,
): number {
  if (totalTasks <= 0) return 0;

  return Math.min(
    100,
    Math.max(0, Math.round((completedTasks / totalTasks) * 100)),
  );
}

export function filterProjects(
  projects: Project[],
  filter: ProjectFilter,
): Project[] {
  return projects.filter((project) => {
    if (
      filter.status?.length &&
      !filter.status.includes(project.status)
    ) {
      return false;
    }

    if (
      filter.visibility?.length &&
      !filter.visibility.includes(project.visibility)
    ) {
      return false;
    }

    if (
      filter.organizationId &&
      project.organizationId !== filter.organizationId
    ) {
      return false;
    }

    if (filter.search) {
      const query = filter.search.toLowerCase();

      if (
        !project.name.toLowerCase().includes(query) &&
        !project.key.toLowerCase().includes(query)
      ) {
        return false;
      }
    }

    return true;
  });
}