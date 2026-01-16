import { IsOptional, IsString, MinLength, MaxLength } from 'class-validator';

/**
 * DTO for updating user profile
 *
 * Only the name field can be updated.
 * Email is read-only as it's the unique identifier for login.
 *
 * Note: If name is not provided (undefined), the operation returns current user data
 * without making any changes (no-op behavior).
 */
export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(1, { message: '姓名不能为空' })
  @MaxLength(50, { message: '姓名不能超过50个字符' })
  name?: string;
}
