import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

import {
  PullRequestReviewStatus,
  PullRequestStatus,
} from './create-pull-request.dto.js';

export class UpdatePullRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(250)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  sourceBranch?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  targetBranch?: string;

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

  @IsOptional()
  mergedAt?: string;

  @IsOptional()
  closedAt?: string;
}