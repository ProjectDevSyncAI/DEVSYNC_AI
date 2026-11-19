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

<<<<<<< HEAD
  @IsOptional()
  @IsUUID()
  creatorId?: string;
=======
  @IsUUID()
  creatorId!: string;
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c

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