import { IsEmail, IsString, IsNotEmpty } from 'class-validator';

/**
 * Login DTO
 * Validates user login request data
 */
export class LoginDto {
  @IsEmail({}, { message: '邮箱格式不正确' })
  @IsNotEmpty({ message: '邮箱不能为空' })
  email: string;

  @IsString({ message: '密码必须是字符串' })
  @IsNotEmpty({ message: '密码不能为空' })
  password: string;
}
