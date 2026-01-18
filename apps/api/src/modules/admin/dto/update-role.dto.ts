import { IsEnum, IsNotEmpty } from 'class-validator';
import { Role } from '@prisma/client';

/**
 * Update User Role DTO
 *
 * Used when an admin modifies a user's role.
 */
export class UpdateRoleDto {
  /**
   * New role to assign to the user
   * Must be either USER or ADMIN
   */
  @IsEnum(Role, {
    message: 'Role must be either USER or ADMIN',
  })
  @IsNotEmpty({ message: 'Role is required' })
  role: Role;
}
