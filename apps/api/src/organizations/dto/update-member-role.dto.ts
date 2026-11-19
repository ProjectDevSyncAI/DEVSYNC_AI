import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class UpdateMemberRoleDto {
  @IsNotEmpty()
  @IsString()
  @IsIn(['OWNER', 'ADMIN', 'MANAGER', 'ENGINEER', 'VIEWER'], {
    message: 'Role must be one of: OWNER, ADMIN, MANAGER, ENGINEER, VIEWER',
  })
  role!: 'OWNER' | 'ADMIN' | 'MANAGER' | 'ENGINEER' | 'VIEWER';
}
