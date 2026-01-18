import { IsEmail, IsString, IsNotEmpty, MinLength, Matches, IsEnum, IsOptional } from 'class-validator';
import { Role } from '@prisma/client';

/**
 * DTO for user registration
 * Validates email format, password strength, and name presence
 * Supports optional role and adminSecret for admin user registration
 */
export class RegisterDto {
  @IsEmail({}, { message: '邮箱格式不正确' })
  @IsNotEmpty({ message: '邮箱不能为空' })
  email: string;

  @IsString({ message: '密码必须是字符串' })
  @MinLength(8, { message: '密码长度不能少于 8 位' })
  @Matches(/[a-z]/, { message: '密码必须包含至少一个小写字母' })
  @Matches(/[A-Z]/, { message: '密码必须包含至少一个大写字母' })
  @Matches(/[0-9]/, { message: '密码必须包含至少一个数字' })
  @IsNotEmpty({ message: '密码不能为空' })
  password: string;

  @IsString({ message: '姓名必须是字符串' })
  @IsNotEmpty({ message: '姓名不能为空' })
  name: string;

  /**
   * Optional role for registration.
   * When set to ADMIN, requires ADMIN_REGISTRATION_SECRET to match.
   * This allows tests to create admin users without exposing security issues.
   */
  @IsEnum(Role, { message: '角色必须是 USER 或 ADMIN' })
  @IsOptional()
  role?: Role;

  /**
   * Secret required when registering as ADMIN.
   * In production, this should be set via environment variable.
   * In tests, this can be set to a known value for creating admin users.
   */
  @IsString({ message: '注册密钥必须是字符串' })
  @IsOptional()
  adminSecret?: string;
}
