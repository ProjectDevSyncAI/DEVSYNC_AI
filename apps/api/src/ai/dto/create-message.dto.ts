import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateMessageDto {
  @IsUUID()
  conversationId!: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsString()
  role!: string;

  @IsString()
  content!: string;
}
