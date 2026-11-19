import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

import {
  IssuePriority,
  IssueStatus,
  IssueType,
} from '../../generated/prisma/client.js';

export class CreateIssueDto {
  @IsUUID()
  projectId!: string;

  @IsOptional()
  @IsUUID()
  repositoryId?: string;

  @IsOptional()
  @IsUUID()
  assigneeId?: string;

<<<<<<< HEAD
  @IsOptional()
  @IsUUID()
  reporterId?: string;

  @IsOptional()
  @IsUUID()
  creatorId?: string;
=======
  @IsUUID()
  reporterId!: string;

  @IsUUID()
  creatorId!: string;
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c

  @IsString()
  @MaxLength(250)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(IssueType)
  type?: IssueType;

  @IsOptional()
  @IsEnum(IssueStatus)
  status?: IssueStatus;

  @IsOptional()
  @IsEnum(IssuePriority)
  priority?: IssuePriority;

  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedHours?: number;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}