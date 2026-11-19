import type {
  ID,
  Priority,
  TimeStamped,
} from "./common";

export type TaskStatus =
<<<<<<< HEAD
  | "TODO"
  | "IN_PROGRESS"
  | "IN_REVIEW"
  | "BLOCKED"
  | "DONE"
  | "CANCELLED";
=======
  | "backlog"
  | "todo"
  | "in_progress"
  | "in_review"
  | "done";
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c

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