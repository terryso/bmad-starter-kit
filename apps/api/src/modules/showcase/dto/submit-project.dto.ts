import { IsString, IsNotEmpty, Matches } from 'class-validator';

/**
 * DTO for submitting a GitHub project URL
 */
export class SubmitProjectDto {
  @IsString()
  @IsNotEmpty({ message: 'GitHub URL 不能为空' })
  @Matches(
    /(?:https?:\/\/)?(?:www\.)?github\.com\/[^\/]+\/[^\/\.]+(?:\.git)?/,
    {
      message: '无效的 GitHub URL 格式，正确格式: https://github.com/owner/repo',
    }
  )
  githubUrl!: string;
}
