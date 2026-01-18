import { IsString, Matches } from 'class-validator';

/**
 * 验证 CUID 格式的项目 ID
 * CUID 格式: 以固定前缀开头（如 'cmk', 'cl' 等），后跟 20+ 个字符（字母数字）
 * 实际使用的是 @paralleldrive/cuid2，默认前缀可能变化
 */
export class GetProjectByIdDto {
  @IsString()
  @Matches(/^[a-z]{2,3}[a-z0-9]{20,}$/, {
    message: 'Invalid project ID format',
  })
  id: string;
}
