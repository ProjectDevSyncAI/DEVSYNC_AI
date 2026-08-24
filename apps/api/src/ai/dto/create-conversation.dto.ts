import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateConversationDto {
  @IsUUID()
  userId!: string;

  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsString()
  title!: string;
}
