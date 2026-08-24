import {
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export enum RiskSeverityDto {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export class CreateRiskDto {
  @IsUUID()
  projectId!: string;

  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsEnum(RiskSeverityDto)
  severity!: RiskSeverityDto;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  probability?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  impact?: number;

  @IsOptional()
  @IsNumber()
  riskScore?: number;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsObject()
  evidence?: Record<string, unknown>;
}