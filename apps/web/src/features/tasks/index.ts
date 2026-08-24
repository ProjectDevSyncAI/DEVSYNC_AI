export type TaskStatus =
  | "backlog"
  | "todo"
  | "in_progress"
  | "in_review"
  | "done"
  | "cancelled";

export type TaskPriority =
  | "low"
  | "medium"
  | "high"
  | "urgent";

export interface Task {
  id: string;
  key: string;
  title: string;
  description?: string;
  projectId: string;
  sprintId?: string;
  assigneeId?: string;
  reporterId?: string;
  status: TaskStatus;
  priority: TaskPriority;
  storyPoints?: number;
  labels: string[];
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface TaskFilter {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  assigneeId?: string;
  sprintId?: string;
  projectId?: string;
  search?: string;
}

export function isTaskCompleted(task: Task): boolean {
  return task.status === "done";
}

export function isTaskOverdue(task: Task): boolean {
  if (!task.dueDate || isTaskCompleted(task)) return false;

  return new Date(task.dueDate).getTime() < Date.now();
}

export function filterTasks(
  tasks: Task[],
  filter: TaskFilter,
): Task[] {
  return tasks.filter((task) => {
    if (
      filter.status?.length &&
      !filter.status.includes(task.status)
    ) {
      return false;
    }

    if (
      filter.priority?.length &&
      !filter.priority.includes(task.priority)
    ) {
      return false;
    }

    if (
      filter.assigneeId &&
      task.assigneeId !== filter.assigneeId
    ) {
      return false;
    }

    if (filter.sprintId && task.sprintId !== filter.sprintId) {
      return false;
    }

    if (filter.projectId && task.projectId !== filter.projectId) {
      return false;
    }

    if (filter.search) {
      const query = filter.search.toLowerCase();

      if (
        !task.title.toLowerCase().includes(query) &&
        !task.key.toLowerCase().includes(query)
      ) {
        return false;
      }
    }

    return true;
  });
}

export function getTaskStatusLabel(status: TaskStatus): string {
  const labels: Record<TaskStatus, string> = {
    backlog: "Backlog",
    todo: "To Do",
    in_progress: "In Progress",
    in_review: "In Review",
    done: "Done",
    cancelled: "Cancelled",
  };

  return labels[status];
}