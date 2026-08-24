export type SprintStatus =
  | "planned"
  | "active"
  | "completed"
  | "cancelled";

export interface Sprint {
  id: string;
  name: string;
  goal: string;
  projectId: string;
  status: SprintStatus;
  startDate: string;
  endDate: string;
  capacity: number;
  committedPoints: number;
  completedPoints: number;
  taskIds: string[];
}

export interface SprintVelocity {
  sprintId: string;
  committed: number;
  completed: number;
  velocity: number;
}

export function calculateSprintProgress(
  completed: number,
  committed: number,
): number {
  if (committed <= 0) return 0;

  return Math.min(
    100,
    Math.round((completed / committed) * 100),
  );
}

export function calculateVelocity(
  completedPoints: number,
  sprintDays: number,
): number {
  if (sprintDays <= 0) return 0;

  return Number((completedPoints / sprintDays).toFixed(2));
}

export function isSprintOverdue(sprint: Sprint): boolean {
  if (sprint.status === "completed" || sprint.status === "cancelled") {
    return false;
  }

  return new Date(sprint.endDate).getTime() < Date.now();
}