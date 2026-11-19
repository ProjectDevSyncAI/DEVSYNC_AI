import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class PreviewInvitationDto {
  @IsNotEmpty()
  @IsString()
  @Matches(/^[a-f0-9]{32,128}$/i, {
    message: 'Invalid invitation token format',
  })
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  token!: string;
}
