import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateInsightDto {
  @IsUUID()
  projectId!: string;

  @IsString()
  title!: string;

  @IsString()
  content!: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}
