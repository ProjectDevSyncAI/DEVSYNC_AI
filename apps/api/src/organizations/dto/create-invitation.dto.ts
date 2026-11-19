import { IsEmail, IsEnum, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';
import { OrganizationRole } from '../../generated/prisma/client.js';

export class CreateInvitationDto {
  @IsNotEmpty()
  @IsEmail()
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email!: string;

  @IsNotEmpty()
  @IsEnum(OrganizationRole)
  role!: OrganizationRole;
}
