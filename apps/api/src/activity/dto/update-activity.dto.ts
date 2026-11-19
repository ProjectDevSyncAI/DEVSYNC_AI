import {
<<<<<<< HEAD
  IsObject,
=======
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateActivityDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  type?: string;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  title?: string;

  @IsOptional()
  @IsString()
<<<<<<< HEAD
  @MaxLength(2000, { message: 'Activity description cannot exceed 2000 characters' })
=======
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  entityType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  entityId?: string;

  @IsOptional()
<<<<<<< HEAD
  @IsObject({ message: 'Metadata must be a valid JSON object' })
  metadata?: Record<string, unknown>;
}
=======
  metadata?: Record<string, unknown>;
}
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
