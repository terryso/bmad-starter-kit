import { IsEmail, IsString, IsNotEmpty, MinLength, Matches } from 'class-validator';
import { CreateUserDto } from '@bmad-starter-kit/shared';

/**
 * DTO for user registration
 * Extends CreateUserDto from shared package with validation decorators
 * Validates email format, password strength, and name presence
 */
export class RegisterDto implements CreateUserDto {
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
}
