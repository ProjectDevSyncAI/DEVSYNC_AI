export type PullRequestState =
  | "open"
  | "closed"
  | "merged"
  | "draft";

export interface PullRequestReview {
  id: string;
  reviewerId: string;
  status: "approved" | "changes_requested" | "commented";
  comment?: string;
  createdAt: string;
}

export interface PullRequest {
  id: string;
  number: number;
  title: string;
  description?: string;
  repositoryId: string;
  authorId: string;
  sourceBranch: string;
  targetBranch: string;
  state: PullRequestState;
  additions: number;
  deletions: number;
  changedFiles: number;
  reviews: PullRequestReview[];
  checksPassed: boolean;
  mergeable: boolean;
  createdAt: string;
  updatedAt: string;
}

export function isPullRequestReady(
  pullRequest: PullRequest,
): boolean {
  const hasChangesRequested = pullRequest.reviews.some(
    (review) => review.status === "changes_requested",
  );

  const hasApproval = pullRequest.reviews.some(
    (review) => review.status === "approved",
  );

  return (
    pullRequest.state === "open" &&
    pullRequest.checksPassed &&
    pullRequest.mergeable &&
    hasApproval &&
    !hasChangesRequested
  );
}

export function getChangedLines(pullRequest: PullRequest): number {
  return pullRequest.additions + pullRequest.deletions;
}