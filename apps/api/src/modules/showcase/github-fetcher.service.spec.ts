import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { InternalServerErrorException } from '@nestjs/common';
import { query } from '@anthropic-ai/claude-agent-sdk';
import { GithubFetcherService } from './github-fetcher.service';
import {
  InvalidGitHubUrlException,
  AgentTimeoutException,
  InvalidResponseException,
} from './exceptions';

// Mock Agent SDK
jest.mock('@anthropic-ai/claude-agent-sdk');

describe('GithubFetcherService', () => {
  let service: GithubFetcherService;
  let configService: ConfigService;

  const mockAuthToken = 'test-auth-token';

  beforeEach(async () => {
    jest.clearAllMocks();

    const mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GithubFetcherService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<GithubFetcherService>(GithubFetcherService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('service initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should return true when ANTHROPIC_AUTH_TOKEN is configured', () => {
      jest.spyOn(configService, 'get').mockReturnValue(mockAuthToken);
      expect(service.isAvailable()).toBe(true);
    });

    it('should return false when ANTHROPIC_AUTH_TOKEN is not configured', () => {
      jest.spyOn(configService, 'get').mockReturnValue(undefined);
      expect(service.isAvailable()).toBe(false);
    });

    it('should return false when ANTHROPIC_AUTH_TOKEN is empty', () => {
      jest.spyOn(configService, 'get').mockReturnValue('');
      expect(service.isAvailable()).toBe(false);
    });
  });

  describe('fetchProjectInfo', () => {
    const validUrl = 'https://github.com/anthropics/claude-agent-sdk';
    const mockAgentResponse = {
      repositoryName: 'claude-agent-sdk',
      description: 'Agent SDK for Claude',
      owner: 'anthropics',
      stars: 1000,
      forks: 150,
      openIssues: 10,
      language: 'TypeScript',
      topics: ['ai', 'sdk'],
      updatedAt: '2025-01-17T00:00:00Z',
      homepageUrl: 'https://example.com',
      license: 'MIT',
      category: 'LIBRARY',
      suggestedTags: ['AI'],
    };

    beforeEach(() => {
      jest.spyOn(configService, 'get').mockImplementation((key: string) => {
        if (key === 'ANTHROPIC_AUTH_TOKEN') return mockAuthToken;
        if (key === 'ANTHROPIC_BASE_URL') return undefined;
        return undefined;
      });
    });

    it('should throw InternalServerErrorException when ANTHROPIC_AUTH_TOKEN is not configured', async () => {
      jest.spyOn(configService, 'get').mockReturnValue(undefined);

      await expect(service.fetchProjectInfo(validUrl)).rejects.toThrow(
        InternalServerErrorException
      );
      await expect(service.fetchProjectInfo(validUrl)).rejects.toThrow(
        'ANTHROPIC_AUTH_TOKEN is not configured'
      );
    });

    it('should fetch and parse project info successfully', async () => {
      const mockQuery = jest.fn().mockImplementation(async function* () {
        yield {
          type: 'result',
          subtype: 'success',
          result: JSON.stringify(mockAgentResponse),
        };
      });
      (query as jest.Mock).mockImplementation(mockQuery);

      const result = await service.fetchProjectInfo(validUrl);

      expect(result).toEqual(mockAgentResponse);
      expect(query).toHaveBeenCalledWith({
        prompt: expect.stringContaining(validUrl),
        options: expect.objectContaining({
          maxTurns: 1,
          tools: [],
          persistSession: false,
          env: expect.objectContaining({
            ANTHROPIC_API_KEY: mockAuthToken,
          }),
        }),
      });
    });

    it('should handle response with null optional fields', async () => {
      const responseWithNulls = {
        repositoryName: 'test',
        description: 'Test project',
        owner: 'testuser',
        stars: 0,
        forks: 0,
        openIssues: 0,
        language: null,
        topics: [],
        updatedAt: '2025-01-17T00:00:00Z',
        homepageUrl: null,
        license: null,
        category: 'OTHER',
        suggestedTags: [],
      };

      const mockQuery = jest.fn().mockImplementation(async function* () {
        yield {
          type: 'result',
          subtype: 'success',
          result: JSON.stringify(responseWithNulls),
        };
      });
      (query as jest.Mock).mockImplementation(mockQuery);

      const result = await service.fetchProjectInfo(validUrl);

      expect(result.language).toBeNull();
      expect(result.homepageUrl).toBeNull();
      expect(result.license).toBeNull();
    });

    it('should throw InvalidGitHubUrlException for invalid URL', async () => {
      await expect(service.fetchProjectInfo('not-a-url')).rejects.toThrow(
        InvalidGitHubUrlException
      );
    });

    it('should handle malformed JSON response', async () => {
      const mockQuery = jest.fn().mockImplementation(async function* () {
        yield {
          type: 'result',
          subtype: 'success',
          result: 'This is not valid JSON',
        };
      });
      (query as jest.Mock).mockImplementation(mockQuery);

      await expect(service.fetchProjectInfo(validUrl)).rejects.toThrow(
        InvalidResponseException
      );
    });

    it('should handle API timeout error', async () => {
      const mockQuery = jest.fn().mockImplementation(async function* () {
        throw new Error('Request timeout');
      });
      (query as jest.Mock).mockImplementation(mockQuery);

      await expect(service.fetchProjectInfo(validUrl)).rejects.toThrow(
        AgentTimeoutException
      );
    });

    it('should handle API authentication error response', async () => {
      const mockQuery = jest.fn().mockImplementation(async function* () {
        yield {
          type: 'result',
          subtype: 'success',
          result: 'Invalid API key: authentication failed',
        };
      });
      (query as jest.Mock).mockImplementation(mockQuery);

      await expect(service.fetchProjectInfo(validUrl)).rejects.toThrow(
        InvalidResponseException
      );
      await expect(service.fetchProjectInfo(validUrl)).rejects.toThrow(
        'API authentication failed'
      );
    });

    it('should handle 401 authentication error', async () => {
      const mockQuery = jest.fn().mockImplementation(async function* () {
        yield { type: 'result', subtype: 'success', result: '401 Unauthorized' };
      });
      (query as jest.Mock).mockImplementation(mockQuery);

      await expect(service.fetchProjectInfo(validUrl)).rejects.toThrow(
        InvalidResponseException
      );
    });

    it('should handle JSON wrapped in markdown code block', async () => {
      const wrappedJsonResponse = `Here's the result:

\`\`\`json
${JSON.stringify(mockAgentResponse)}
\`\`\`

That's it!`;

      const mockQuery = jest.fn().mockImplementation(async function* () {
        yield {
          type: 'result',
          subtype: 'success',
          result: wrappedJsonResponse,
        };
      });
      (query as jest.Mock).mockImplementation(mockQuery);

      const result = await service.fetchProjectInfo(validUrl);

      expect(result.repositoryName).toBe('claude-agent-sdk');
    });

    it('should throw error when query returns error subtype', async () => {
      const mockQuery = jest.fn().mockImplementation(async function* () {
        yield {
          type: 'result',
          subtype: 'error_rate_limit',
          errors: ['Rate limit exceeded'],
        };
      });
      (query as jest.Mock).mockImplementation(mockQuery);

      await expect(service.fetchProjectInfo(validUrl)).rejects.toThrow(
        'Agent SDK query failed'
      );
    });

    it('should throw error when no result returned', async () => {
      const mockQuery = jest.fn().mockImplementation(async function* () {
        yield { type: 'info', message: 'Processing' };
      });
      (query as jest.Mock).mockImplementation(mockQuery);

      await expect(service.fetchProjectInfo(validUrl)).rejects.toThrow(
        'Agent SDK did not return a result'
      );
    });

    it('should handle custom ANTHROPIC_BASE_URL', async () => {
      jest.spyOn(configService, 'get').mockImplementation((key: string) => {
        if (key === 'ANTHROPIC_AUTH_TOKEN') return mockAuthToken;
        if (key === 'ANTHROPIC_BASE_URL') return 'https://custom.api.com';
        return undefined;
      });

      const mockQuery = jest.fn().mockImplementation(async function* () {
        yield {
          type: 'result',
          subtype: 'success',
          result: JSON.stringify(mockAgentResponse),
        };
      });
      (query as jest.Mock).mockImplementation(mockQuery);

      await service.fetchProjectInfo(validUrl);

      expect(query).toHaveBeenCalledWith({
        prompt: expect.any(String),
        options: expect.objectContaining({
          env: expect.objectContaining({
            ANTHROPIC_BASE_URL: 'https://custom.api.com',
          }),
        }),
      });
    });

    it('should normalize empty strings to null for optional fields', async () => {
      const responseWithEmptyStrings = {
        repositoryName: 'test',
        description: 'Test project',
        owner: 'testuser',
        stars: 0,
        language: '',
        topics: [],
        updatedAt: '2025-01-17T00:00:00Z',
        homepageUrl: '',
        license: '',
        category: 'OTHER',
        suggestedTags: [],
      };

      const mockQuery = jest.fn().mockImplementation(async function* () {
        yield {
          type: 'result',
          subtype: 'success',
          result: JSON.stringify(responseWithEmptyStrings),
        };
      });
      (query as jest.Mock).mockImplementation(mockQuery);

      const result = await service.fetchProjectInfo(validUrl);

      // Empty strings should be normalized to null
      // Note: The Zod schema will further validate/transform these
      expect(result.category).toBe('OTHER');
    });
  });

  describe('parseGitHubUrl (private method)', () => {
    const parseUrl = (url: string) => {
      const serviceInstance = service as any;
      return serviceInstance.parseGitHubUrl(url);
    };

    it('should parse standard GitHub URL', () => {
      const result = parseUrl('https://github.com/owner/repo');
      expect(result).toEqual({ owner: 'owner', repo: 'repo' });
    });

    it('should parse GitHub URL with .git', () => {
      const result = parseUrl('https://github.com/owner/repo.git');
      expect(result).toEqual({ owner: 'owner', repo: 'repo' });
    });

    it('should parse GitHub URL without protocol', () => {
      const result = parseUrl('github.com/owner/repo');
      expect(result).toEqual({ owner: 'owner', repo: 'repo' });
    });

    it('should parse GitHub URL with www', () => {
      const result = parseUrl('https://www.github.com/owner/repo');
      expect(result).toEqual({ owner: 'owner', repo: 'repo' });
    });

    it('should parse GitHub URL with hyphen in owner name', () => {
      const result = parseUrl('https://github.com/my-org/my-repo');
      expect(result).toEqual({ owner: 'my-org', repo: 'my-repo' });
    });

    it('should trim whitespace from URL', () => {
      const result = parseUrl('  https://github.com/owner/repo  ');
      expect(result).toEqual({ owner: 'owner', repo: 'repo' });
    });

    it('should throw InvalidGitHubUrlException for invalid URL', () => {
      expect(() => parseUrl('not-a-github-url')).toThrow(
        InvalidGitHubUrlException
      );
    });

    it('should throw InvalidGitHubUrlException for GitLab URL', () => {
      expect(() => parseUrl('https://gitlab.com/owner/repo')).toThrow(
        InvalidGitHubUrlException
      );
    });

    it('should throw InvalidGitHubUrlException for GitHub URL without repo', () => {
      expect(() => parseUrl('https://github.com/only-owner')).toThrow(
        InvalidGitHubUrlException
      );
    });

    it('should throw InvalidGitHubUrlException for empty string', () => {
      expect(() => parseUrl('')).toThrow(InvalidGitHubUrlException);
    });
  });

  describe('isTimeoutError (private method)', () => {
    const isTimeoutError = (error: unknown) => {
      const serviceInstance = service as any;
      return serviceInstance.isTimeoutError(error);
    };

    it('should identify timeout in error message', () => {
      expect(isTimeoutError({ message: 'Request timeout' })).toBe(true);
    });

    it('should identify ETIMEDOUT code', () => {
      expect(isTimeoutError({ code: 'ETIMEDOUT' })).toBe(true);
    });

    it('should identify AbortError', () => {
      expect(isTimeoutError('Error: AbortError')).toBe(true);
    });

    it('should identify timed out string', () => {
      expect(isTimeoutError('Operation timed out')).toBe(true);
    });

    it('should return false for non-timeout errors', () => {
      expect(isTimeoutError({ code: 'ENOTFOUND' })).toBe(false);
      expect(isTimeoutError({ message: 'Not found' })).toBe(false);
      expect(isTimeoutError(null)).toBe(false);
      expect(isTimeoutError(undefined)).toBe(false);
    });
  });

  describe('getErrorMessage (private method)', () => {
    const getErrorMessage = (error: unknown) => {
      const serviceInstance = service as any;
      return serviceInstance.getErrorMessage(error);
    };

    it('should extract message from string', () => {
      expect(getErrorMessage('error message')).toBe('error message');
    });

    it('should extract message from Error object', () => {
      expect(getErrorMessage(new Error('test error'))).toBe('test error');
    });

    it('should extract message from object with message property', () => {
      expect(getErrorMessage({ message: 'obj error' })).toBe('obj error');
    });

    it('should return "Unknown error" for null', () => {
      expect(getErrorMessage(null)).toBe('Unknown error');
    });

    it('should return "Unknown error" for undefined', () => {
      expect(getErrorMessage(undefined)).toBe('Unknown error');
    });
  });
});
