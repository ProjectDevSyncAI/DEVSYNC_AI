import { IsOptional, IsString, IsUUID } from 'class-validator';

export class GenerateReleaseNotesDto {
  @IsUUID()
  projectId!: string;

  @IsOptional()
  @IsString()
  version?: string;

  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;
}
