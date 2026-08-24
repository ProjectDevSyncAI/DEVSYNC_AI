export class CreatePullRequestReviewDto {
  pullRequestId!: string;
  reviewerId!: string;
  githubId?: string;
  status!: string;
  body?: string;
  submittedAt?: string;
}