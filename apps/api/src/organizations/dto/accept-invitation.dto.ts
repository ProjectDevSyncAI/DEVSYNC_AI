import { IsNotEmpty, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class AcceptInvitationDto {
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  token!: string;
}
