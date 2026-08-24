import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateSprintPlanDto {
  @IsUUID()
  projectId!: string;

  @IsString()
  @IsOptional()
  goal?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  issueIds?: string[];

  @IsInt()
  @Min(1)
  @IsOptional()
  durationDays?: number;
}