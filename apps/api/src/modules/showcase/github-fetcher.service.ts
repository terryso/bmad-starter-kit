import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GitHubProjectResponseSchema,
  GitHubProjectResponse,
} from './schemas/project-response.schema';
import {
  InvalidGitHubUrlException,
  AgentTimeoutException,
  InvalidResponseException,
} from './exceptions';

/**
 * Regular expression to parse GitHub URLs
 * Supports formats:
 * - https://github.com/owner/repo
 * - https://github.com/owner/repo.git
 * - github.com/owner/repo
 * - https://www.github.com/owner/repo
 */
const GITHUB_URL_REGEX =
  /(?:https?:\/\/)?(?:www\.)?github\.com\/([^\/]+)\/([^\/\.]+)(?:\.git)?/;

/**
 * GitHub API repository data shape
 */
interface GitHubAPIRepoData {
  name: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  language: string | null;
  topics: string[];
  license: { name: string } | null;
  homepage: string | null;
  updated_at: string;
}

/**
 * System prompt for GitHub project analysis
 */
const SYSTEM_PROMPT = `你是 GitHub 项目分析专家。你的任务是分析用户提供的 GitHub 仓库链接，提取项目信息并以 JSON 格式返回。

## 你需要提取的信息

1. **repositoryName**: 仓库名称
2. **description**: 项目描述（从 README 提取，1-2 句话）
3. **owner**: 仓库所有者用户名
4. **stars**: 星标数量
5. **forks**: Fork 数量
6. **openIssues**: Open Issues 数量
7. **language**: 主要编程语言（重要：请仔细检查代码仓库的实际文件，特别是查看项目根目录的配置文件如 package.json, tsconfig.json, pyproject.toml, go.mod, pom.xml 等，以及 src/ 目录下的源代码文件扩展名。不要仅凭项目名称或用途推断语言）
8. **topics**: GitHub 主题标签数组
9. **updatedAt**: 最后更新时间 (ISO 8601 格式)
10. **homepageUrl**: 官网 URL（如果没有则用 null）
11. **license**: 开源协议（如果没有则用 null）
12. **category**: 建议分类，必须是以下枚举值之一:
   - "WEB_APP": Web 应用
   - "CLI": 命令行工具
   - "LIBRARY": 代码库/SDK
   - "API": API 服务
   - "MOBILE": 移动应用
   - "OTHER": 其他
11. **suggestedTags**: 建议的展示标签数组

## 分类判断规则

- **WEB_APP**: 前端框架、全栈框架、Web 应用
- **CLI**: 命令行工具、CLI 工具包
- **LIBRARY**: SDK、库、框架、工具包
- **API**: API 服务、后端服务
- **MOBILE**: iOS/Android 应用、React Native/Flutter 项目
- **OTHER**: 文档、配置、示例代码等

## 输出格式

**只输出 JSON，不要输出任何其他文本。**

JSON 示例：
\`\`\`json
{
  "repositoryName": "react",
  "description": "A JavaScript library for building user interfaces",
  "owner": "facebook",
  "stars": 200000,
  "forks": 45000,
  "openIssues": 1200,
  "language": "JavaScript",
  "topics": ["react", "javascript", "library"],
  "updatedAt": "2024-01-15T10:30:00Z",
  "homepageUrl": "https://react.dev",
  "license": "MIT",
  "category": "LIBRARY",
  "suggestedTags": ["frontend", "ui", "javascript"]
}
\`\`\`

如果某字段无法获取，使用 null 或空数组。
`;

/**
 * Error thrown when ANTHROPIC_AUTH_TOKEN is not configured
 */
class MissingAuthTokenException extends InternalServerErrorException {
  constructor() {
    super(
      'ANTHROPIC_AUTH_TOKEN is not configured. Please add it to your environment variables.'
    );
  }
}

/**
 * Service for fetching GitHub project information using Claude Agent SDK
 */
@Injectable()
export class GithubFetcherService {
  private readonly logger = new Logger(GithubFetcherService.name);
  private readonly TIMEOUT = 30000; // 30 seconds

  constructor(private configService: ConfigService) {}

  /**
   * Validate that auth token is configured before making requests
   */
  private validateAuthToken(): void {
    const authToken = this.configService.get<string>('ANTHROPIC_AUTH_TOKEN');
    if (!authToken) {
      throw new MissingAuthTokenException();
    }
  }

  /**
   * Fetch project information from a GitHub URL
   * @param githubUrl - GitHub repository URL
   * @returns Structured project information
   * @throws InvalidGitHubUrlException if URL is invalid
   * @throws AgentTimeoutException if API call times out
   * @throws InvalidResponseException if response is invalid
   */
  async fetchProjectInfo(githubUrl: string): Promise<GitHubProjectResponse> {
    // 0. Validate auth token is configured
    this.validateAuthToken();

    // 1. Parse URL
    const { owner, repo } = this.parseGitHubUrl(githubUrl);

    this.logger.log(`Fetching info for ${owner}/${repo}`);

    // 2. First, try to fetch structured data from GitHub API (more reliable)
    const githubApiData = await this.fetchFromGitHubAPI(owner, repo);

    // 3. Build prompt
    const prompt = this.buildPrompt(githubUrl, githubApiData);

    // 4. Get auth token and optional custom base URL
    const authToken = this.configService.get<string>('ANTHROPIC_AUTH_TOKEN')!;
    const baseUrl = this.configService.get<string>('ANTHROPIC_BASE_URL');

    try {
      // 5. Dynamically import and call Agent SDK query (ESM-only package)
      const { query } = await import('@anthropic-ai/claude-agent-sdk');

      const response = query({
        prompt,
        options: {
          maxTurns: 1, // Only need one response
          tools: [], // Disable all built-in tools, we only need text analysis
          persistSession: false, // Don't persist session
          env: {
            ...process.env,
            ...(baseUrl && { ANTHROPIC_BASE_URL: baseUrl }),
            ANTHROPIC_API_KEY: authToken,
          },
        },
      });

      // 5. Collect result from async generator
      let resultText: string | null = null;

      for await (const message of response) {
        if (message.type === 'result' && message.subtype === 'success') {
          resultText = (message as any).result as string;
          break;
        }
        if (message.type === 'result' && message.subtype?.startsWith('error_')) {
          const errors = (message as any).errors as string[];
          throw new Error(`Agent SDK query failed: ${errors.join(', ')}`);
        }
      }

      if (!resultText) {
        throw new Error('Agent SDK did not return a result');
      }

      this.logger.debug(`Agent SDK response: ${resultText.substring(0, 200)}...`);

      // 6. Parse JSON response
      const jsonData = this.parseJsonResponse(resultText);

      // 7. Normalize empty strings to null for optional fields
      const normalizedData = this.normalizeOptionalFields(jsonData);

      // 8. Zod validation
      const validatedData = GitHubProjectResponseSchema.parse(normalizedData);

      return validatedData;
    } catch (error) {
      this.handleFetchError(error, owner, repo);
    }
  }

  /**
   * Normalize empty string values to null for optional fields
   */
  private normalizeOptionalFields(data: any): any {
    return {
      ...data,
      homepageUrl: data.homepageUrl === '' ? null : data.homepageUrl,
      license: data.license === '' ? null : data.license,
    };
  }

  /**
   * Parse GitHub URL to extract owner and repo
   * @throws InvalidGitHubUrlException if URL is invalid
   */
  private parseGitHubUrl(url: string): { owner: string; repo: string } {
    const trimmedUrl = url.trim();
    const match = trimmedUrl.match(GITHUB_URL_REGEX);

    if (!match) {
      throw new InvalidGitHubUrlException(trimmedUrl);
    }

    return { owner: match[1], repo: match[2] };
  }

  /**
   * Build prompt for Agent SDK
   */
  private buildPrompt(githubUrl: string, githubApiData?: GitHubAPIRepoData): string {
    let prompt = `${SYSTEM_PROMPT}

请分析以下 GitHub 仓库：${githubUrl}`;

    // If we have GitHub API data, include it for reference
    if (githubApiData) {
      prompt += `

**参考信息（来自 GitHub API）：**
- 仓库名称: ${githubApiData.name}
- 描述: ${githubApiData.description || '无'}
- 星标数: ${githubApiData.stargazers_count}
- Fork 数: ${githubApiData.forks_count}
- Open Issues: ${githubApiData.open_issues_count}
- 主要语言: ${githubApiData.language || '未知'}
- 主题标签: ${githubApiData.topics?.join(', ') || '无'}
- 开源协议: ${githubApiData.license?.name || '无'}
- 主页: ${githubApiData.homepage || '无'}
- 更新时间: ${githubApiData.updated_at}

请根据这些参考信息返回 JSON，但请根据你浏览仓库时的实际观察来修正语言和分类（API 的语言信息可能不够准确）。`;
    }

    return prompt;
  }

  /**
   * Fetch repository data from GitHub API (no auth required for public repos)
   */
  private async fetchFromGitHubAPI(
    owner: string,
    repo: string
  ): Promise<GitHubAPIRepoData | undefined> {
    const url = `https://api.github.com/repos/${owner}/${repo}`;

    try {
      const response = await fetch(url, {
        headers: {
          Accept: 'application/vnd.github.v3+json',
          // Optionally add GitHub token if available (higher rate limits)
          ...(this.configService.get<string>('GITHUB_TOKEN')
            ? { Authorization: `Bearer ${this.configService.get<string>('GITHUB_TOKEN')}` }
            : {}),
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (!response.ok) {
        this.logger.warn(`GitHub API request failed: ${response.status}`);
        return undefined;
      }

      const data = (await response.json()) as GitHubAPIRepoData;
      this.logger.debug(`GitHub API data fetched: stars=${data.stargazers_count}, language=${data.language}`);
      return data;
    } catch (error) {
      this.logger.warn(`GitHub API fetch failed: ${this.getErrorMessage(error)}`);
      return undefined;
    }
  }

  /**
   * Parse JSON response from Agent SDK
   * Handles both plain JSON and JSON wrapped in markdown code blocks
   * @throws InvalidResponseException if parsing fails
   */
  private parseJsonResponse(response: string): unknown {
    // Check for API authentication errors first
    const apiErrorPatterns = [
      /Invalid API key/i,
      /authentication/i,
      /unauthorized/i,
      /401/i,
      /403/i,
      /API key/i,
    ];

    for (const pattern of apiErrorPatterns) {
      if (pattern.test(response)) {
        this.logger.error('API authentication failed');
        throw new InvalidResponseException(
          'API authentication failed: Please check ANTHROPIC_AUTH_TOKEN configuration'
        );
      }
    }

    // Try to parse JSON directly
    try {
      return JSON.parse(response);
    } catch (firstError) {
      // Try to extract JSON from markdown code block
      const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        try {
          return JSON.parse(jsonMatch[1]);
        } catch (secondError) {
          this.logger.error('JSON parsing failed', {
            response: response.substring(0, 500),
          });
          throw new InvalidResponseException(
            'Failed to parse JSON response from Agent SDK'
          );
        }
      }
      this.logger.error('JSON parsing failed - no JSON found', {
        response: response.substring(0, 500),
      });
      throw new InvalidResponseException(
        'Agent SDK response did not contain valid JSON'
      );
    }
  }

  /**
   * Handle fetch errors
   * @throws AgentTimeoutException for timeout errors
   * @throws InternalServerErrorException for other errors
   */
  private handleFetchError(error: unknown, owner: string, repo: string): never {
    if (this.isTimeoutError(error)) {
      this.logger.error(`Timeout fetching ${owner}/${repo}`);
      throw new AgentTimeoutException(owner, repo);
    }

    if (error instanceof InvalidGitHubUrlException) {
      throw error;
    }

    if (error instanceof InvalidResponseException) {
      throw error;
    }

    if (error instanceof MissingAuthTokenException) {
      throw error;
    }

    const errorMessage = this.getErrorMessage(error);
    this.logger.error(`Error fetching ${owner}/${repo}: ${errorMessage}`, error);

    throw new InternalServerErrorException(
      `Failed to fetch repository information: ${errorMessage}`
    );
  }

  /**
   * Check if error is a timeout error
   */
  private isTimeoutError(error: unknown): boolean {
    if (!error) return false;

    // Check string error
    if (typeof error === 'string') {
      return (
        error.includes('timeout') ||
        error.includes('ETIMEDOUT') ||
        error.includes('AbortError') ||
        error.includes('timed out')
      );
    }

    // Check Error object
    if (error instanceof Error) {
      return (
        error.message.includes('timeout') ||
        error.message.includes('ETIMEDOUT') ||
        (error as any).code === 'ETIMEDOUT' ||
        error.name === 'AbortError'
      );
    }

    // Check object with code, message, or name properties
    if (typeof error === 'object') {
      const err = error as {
        code?: string;
        message?: string;
        name?: string;
      };
      return (
        err.code === 'ETIMEDOUT' ||
        err.message?.toLowerCase().includes('timeout') ||
        err.name === 'AbortError'
      );
    }

    return false;
  }

  /**
   * Extract error message from unknown error type
   */
  private getErrorMessage(error: unknown): string {
    if (typeof error === 'string') {
      return error;
    }
    if (error instanceof Error) {
      return error.message;
    }
    if (error && typeof error === 'object' && 'message' in error) {
      return String(error.message);
    }
    return 'Unknown error';
  }

  /**
   * Check if Agent SDK is available
   */
  isAvailable(): boolean {
    return !!this.configService.get<string>('ANTHROPIC_AUTH_TOKEN');
  }
}
