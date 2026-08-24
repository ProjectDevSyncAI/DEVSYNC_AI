import { IsBoolean, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateBranchDto {
  @IsUUID()
  repositoryId!: string;

  @IsString()
  @MaxLength(150)
  name!: string;

  @IsString()
  @MaxLength(100)
  sha!: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}