import { IsString, Matches } from 'class-validator';

/**
 * 验证 CUID 格式的项目 ID
 * CUID 格式: 以 'cl' 开头，后跟 23 个字符（字母数字），总共 25 个字符
 */
export class GetProjectByIdDto {
  @IsString()
  @Matches(/^cl[a-z0-9]{23}$/, {
    message: 'Invalid project ID format',
  })
  id: string;
}
