import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiError, ValidationError } from '@bmad-starter-kit/shared';

/**
 * Custom exception filter to standardize error responses
 * Converts ValidationPipe errors to ApiError format matching architecture spec
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = '服务器内部错误';
    let error = 'Internal Server Error';
    let errors: ValidationError[] | undefined = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        error = status === 409 ? 'Conflict' : 'Error';
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || message;
        error = responseObj.error || error;

        // Convert ValidationPipe array errors to ValidationError format
        if (Array.isArray(message)) {
          message = '验证失败';
          errors = this.convertValidationErrors(responseObj.message);
        }
      }
    }

    const apiError: ApiError = {
      statusCode: status,
      message,
      error,
      errors,
    };

    // Log error for debugging
    console.error(`[${new Date().toISOString()}] ${request.method} ${request.url}`, {
      status,
      message,
      error: errors || error,
    });

    response.status(status).json(apiError);
  }

  /**
   * Convert class-validator error array to ValidationError format
   */
  private convertValidationErrors(
    errors: string[],
  ): ValidationError[] {
    return errors.map((msg) => {
      // Parse message like "email 邮箱格式不正确" or "password 密码长度不能少于 8 位"
      const parts = msg.split(' ');
      if (parts.length >= 2) {
        const field = parts[0];
        const message = parts.slice(1).join(' ');
        return { field, message };
      }
      return { field: 'unknown', message: msg };
    });
  }
}
