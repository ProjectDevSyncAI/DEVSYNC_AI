import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class ConfirmEmailVerificationDto {
  @ApiProperty({
    description: 'Cryptographically random 64-character hexadecimal verification token',
    example: 'a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0',
  })
  @IsNotEmpty({ message: 'Verification token is required' })
  @IsString({ message: 'Verification token must be a string' })
  @Length(64, 64, { message: 'Verification token must be exactly 64 hexadecimal characters' })
  @Matches(/^[a-f0-9]{64}$/i, { message: 'Verification token must contain only hexadecimal characters' })
  token!: string;
}
