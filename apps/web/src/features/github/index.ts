export interface GitHubRepository {
  id: string;
  name: string;
  fullName: string;
  description?: string;
  url: string;
  defaultBranch: string;
  stars: number;
  forks: number;
  openIssues: number;
  language?: string;
  private: boolean;
}

export interface GitHubCommit {
  sha: string;
  message: string;
  author: string;
  authorAvatar?: string;
  branch: string;
  url: string;
  createdAt: string;
}

export interface GitHubBranch {
  name: string;
  protected: boolean;
  aheadBy: number;
  behindBy: number;
  lastCommit?: string;
}

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  body?: string;
  author: string;
  state: "open" | "closed" | "merged";
  sourceBranch: string;
  targetBranch: string;
  url: string;
  createdAt: string;
  updatedAt: string;
}

export function getGitHubRepositoryUrl(
  owner: string,
  repository: string,
): string {
  return `https://github.com/${owner}/${repository}`;
}

export function isBranchBehind(branch: GitHubBranch): boolean {
  return branch.behindBy > 0;
}