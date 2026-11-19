import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, MaxLength } from 'class-validator';

export class RequestEmailVerificationDto {
  @ApiPropertyOptional({
    description: 'Target email address for email-change verification. Omit for initial verification.',
    example: 'new-email@example.com',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Must be a valid email address' })
  @MaxLength(320, { message: 'Email address cannot exceed 320 characters' })
  email?: string;
}
