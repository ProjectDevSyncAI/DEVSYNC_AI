import {
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateWebhookEventDto {
  @IsString()
  @MaxLength(255)
  deliveryId!: string;

  @IsString()
  @MaxLength(100)
  eventType!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  action?: string;

  @IsOptional()
  @IsString()
  repositoryId?: string;

  @IsObject()
  payload!: Record<string, unknown>;
}