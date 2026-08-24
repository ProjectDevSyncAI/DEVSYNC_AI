import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export enum ReviewStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  CHANGES_REQUESTED = 'CHANGES_REQUESTED',
  COMMENTED = 'COMMENTED',
}

export class CreateReviewDto {
  @IsUUID()
  pullRequestId!: string;

  @IsUUID()
  reviewerId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  githubId?: string;

  @IsEnum(ReviewStatus)
  status!: ReviewStatus;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  submittedAt?: string;
}