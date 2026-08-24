import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateCommitDto {
  @IsUUID()
  repositoryId!: string;

  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @IsUUID()
  authorId?: string;

  @IsString()
  @MaxLength(100)
  sha!: string;

  @IsString()
  message!: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  branch?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  additions?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  deletions?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  changedFiles?: number;

  @IsDateString()
  committedAt!: string;
}