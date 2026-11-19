import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(2)
  username!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;
<<<<<<< HEAD

  @IsOptional()
  @IsString()
  avatarUrl?: string | null;
=======
    avatarUrl: string | null | undefined;
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
}