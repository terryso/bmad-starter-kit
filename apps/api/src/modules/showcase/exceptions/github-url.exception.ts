import { BadRequestException } from '@nestjs/common';

/**
 * Exception thrown when the provided GitHub URL is invalid
 */
export class InvalidGitHubUrlException extends BadRequestException {
  constructor(url: string) {
    super(
      `Invalid GitHub URL: ${url}. Expected format: https://github.com/owner/repo`
    );
  }
}
