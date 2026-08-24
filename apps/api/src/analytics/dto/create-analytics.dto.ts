import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateAnalyticsDto {
  @IsUUID()
  projectId!: string;

  @IsDateString()
  date!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  completedTasks?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  openedIssues?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  resolvedIssues?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  commits?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  pullRequests?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  mergedPullRequests?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  activeDevelopers?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  deploymentCount?: number;

  @IsOptional()
  @IsNumber()
  averageCycleTime?: number;

  @IsOptional()
  @IsNumber()
  velocity?: number;
}