import { IsNotEmpty, IsOptional, IsUUID, IsString } from 'class-validator';

export class CreateCommentDto {
  @IsUUID()
  projectId!: string;

  @IsOptional()
  @IsUUID()
  taskId?: string;

  @IsOptional()
  @IsUUID()
  issueId?: string;

  @IsOptional()
  @IsUUID()
  pullRequestId?: string;

  @IsUUID()
  authorId!: string;

  @IsString()
  @IsNotEmpty()
  content!: string;
}
