import { IsString, IsNotEmpty, Matches } from 'class-validator';

/**
 * DTO for validating GitHub URL input
 */
export class GitHubUrlDto {
  @IsString()
  @IsNotEmpty({ message: 'GitHub URL is required' })
  @Matches(
    /(?:https?:\/\/)?(?:www\.)?github\.com\/[^\/]+\/[^\/\.]+(?:\.git)?/,
    {
      message: 'Invalid GitHub URL format. Expected: https://github.com/owner/repo',
    }
  )
  url!: string;
}
