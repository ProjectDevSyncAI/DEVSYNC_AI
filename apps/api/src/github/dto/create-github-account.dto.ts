import {
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateGitHubAccountDto {
  @IsUUID()
  userId!: string;

  @IsString()
  githubUserId!: string;

  @IsString()
  @MaxLength(100)
  username!: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  accessToken?: string;

  @IsOptional()
  @IsString()
  refreshToken?: string;

  @IsOptional()
  @IsDateString()
  tokenExpiresAt?: string;

  @IsOptional()
  scopes?: Record<string, unknown>;
}