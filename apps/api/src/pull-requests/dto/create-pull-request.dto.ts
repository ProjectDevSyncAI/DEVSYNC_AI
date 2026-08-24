import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export enum PullRequestStatus {
  OPEN = 'OPEN',
  MERGED = 'MERGED',
  CLOSED = 'CLOSED',
}

export enum PullRequestReviewStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  CHANGES_REQUESTED = 'CHANGES_REQUESTED',
}

export class CreatePullRequestDto {
  @IsUUID()
  repositoryId!: string;

  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @IsUUID()
  authorId?: string;

  @IsString()
  githubId!: string;

  @IsInt()
  number!: number;

  @IsString()
  @MaxLength(250)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @MaxLength(150)
  sourceBranch!: string;

  @IsString()
  @MaxLength(150)
  targetBranch!: string;

  @IsOptional()
  @IsEnum(PullRequestStatus)
  status?: PullRequestStatus;

  @IsOptional()
  @IsEnum(PullRequestReviewStatus)
  reviewStatus?: PullRequestReviewStatus;

  @IsOptional()
  @IsInt()
  additions?: number;

  @IsOptional()
  @IsInt()
  deletions?: number;

  @IsOptional()
  @IsInt()
  changedFiles?: number;

  openedAt!: string;
}