import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  IsDateString,
  Min,
} from 'class-validator';

export class CreateSprintDto {
  @IsUUID()
  projectId!: string;

  @IsUUID()
  creatorId!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  goal?: string;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  capacity?: number;
}