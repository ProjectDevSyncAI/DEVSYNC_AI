import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MaxLength } from 'class-validator';

export class ResendEmailVerificationDto {
  @ApiProperty({
    description: 'Email address of the unverified account',
    example: 'developer@example.com',
  })
  @IsNotEmpty({ message: 'Email address is required' })
  @IsEmail({}, { message: 'Must be a valid email address' })
  @MaxLength(320, { message: 'Email address cannot exceed 320 characters' })
  email!: string;
}
