export type IssuePriority = "low" | "medium" | "high" | "critical";

export type IssueStatus =
  | "open"
  | "in_progress"
  | "resolved"
  | "closed";

export type IssueType =
  | "bug"
  | "feature"
  | "improvement"
  | "question"
  | "security";

export interface Issue {
  id: string;
  key: string;
  title: string;
  description?: string;
  type: IssueType;
  priority: IssuePriority;
  status: IssueStatus;
  projectId: string;
  assigneeId?: string;
  reporterId?: string;
  labels: string[];
  comments: number;
  createdAt: string;
  updatedAt: string;
}

export interface IssueFilter {
  status?: IssueStatus[];
  priority?: IssuePriority[];
  type?: IssueType[];
  assigneeId?: string;
  search?: string;
}

export function isCriticalIssue(issue: Issue): boolean {
  return issue.priority === "critical";
}

export function filterIssues(
  issues: Issue[],
  filter: IssueFilter,
): Issue[] {
  return issues.filter((issue) => {
    if (filter.status?.length && !filter.status.includes(issue.status)) {
      return false;
    }

    if (
      filter.priority?.length &&
      !filter.priority.includes(issue.priority)
    ) {
      return false;
    }

    if (filter.type?.length && !filter.type.includes(issue.type)) {
      return false;
    }

    if (filter.assigneeId && issue.assigneeId !== filter.assigneeId) {
      return false;
    }

    if (filter.search) {
      const query = filter.search.toLowerCase();

      if (
        !issue.title.toLowerCase().includes(query) &&
        !issue.key.toLowerCase().includes(query)
      ) {
        return false;
      }
    }

    return true;
  });
}