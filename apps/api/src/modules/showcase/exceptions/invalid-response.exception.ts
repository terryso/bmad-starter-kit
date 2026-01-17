import { BadRequestException } from '@nestjs/common';

/**
 * Exception thrown when the Agent SDK response is invalid
 * or cannot be parsed as expected JSON
 */
export class InvalidResponseException extends BadRequestException {
  constructor(message: string) {
    super(`Invalid response from Agent SDK: ${message}`);
  }
}
