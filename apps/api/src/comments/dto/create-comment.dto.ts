import { IsNotEmpty, IsOptional, IsUUID, IsString } from 'class-validator';

export class CreateCommentDto {
<<<<<<< HEAD
  @IsOptional()
  @IsUUID()
  projectId?: string;
=======
  @IsUUID()
  projectId!: string;
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c

  @IsOptional()
  @IsUUID()
  taskId?: string;

  @IsOptional()
  @IsUUID()
  issueId?: string;

  @IsOptional()
  @IsUUID()
  pullRequestId?: string;

<<<<<<< HEAD
  @IsOptional()
  @IsUUID()
  authorId?: string;
=======
  @IsUUID()
  authorId!: string;
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c

  @IsString()
  @IsNotEmpty()
  content!: string;
}
<<<<<<< HEAD

=======
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
