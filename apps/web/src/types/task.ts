import type {
  ID,
  Priority,
  TimeStamped,
} from "./common";

export type TaskStatus =
  | "backlog"
  | "todo"
  | "in_progress"
  | "in_review"
  | "done";

export interface Task extends TimeStamped {
  id: ID;
  projectId: ID;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  assigneeId?: ID;
  reporterId: ID;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  labels: string[];
  sprintId?: ID;
  commentsCount: number;
  attachmentsCount: number;
}

export interface TaskComment {
  id: ID;
  taskId: ID;
  authorId: ID;
  content: string;
  createdAt: string;
  updatedAt?: string;
}

export interface TaskFilter {
  search?: string;
  status?: TaskStatus[];
  priority?: Priority[];
  assigneeIds?: ID[];
  projectIds?: ID[];
  sprintIds?: ID[];
}