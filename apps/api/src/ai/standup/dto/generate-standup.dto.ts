import {
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class GenerateStandupDto {
  @IsUUID()
  userId!: string;

  @IsUUID()
  @IsOptional()
  projectId?: string;

  @IsString()
  @IsOptional()
  date?: string;
}