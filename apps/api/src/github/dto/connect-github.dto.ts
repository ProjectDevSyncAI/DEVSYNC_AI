import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class ConnectGithubDto {
  @IsUUID()
  userId!: string;

  @IsString()
  @MaxLength(100)
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
  tokenExpiresAt?: string;

  @IsOptional()
  scopes?: unknown;
}
