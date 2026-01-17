import { RequestTimeoutException } from '@nestjs/common';

/**
 * Exception thrown when the Agent SDK call times out
 */
export class AgentTimeoutException extends RequestTimeoutException {
  constructor(owner: string, repo: string) {
    super(
      `Agent SDK timeout while fetching ${owner}/${repo}. Please try again.`
    );
  }
}
