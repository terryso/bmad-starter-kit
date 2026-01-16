import { AllExceptionsFilter } from './validation-exception.filter';
import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;

  // Helper function to create mock ArgumentsHost
  const createMockArgumentsHost = (mockResponse: any, mockRequest: any): ArgumentsHost => {
    return {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as unknown as ArgumentsHost;
  };

  beforeEach(() => {
    filter = new AllExceptionsFilter();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('HttpException handling', () => {
    it('should handle HttpException with string response', () => {
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      const mockRequest = {
        method: 'GET',
        url: '/api/v1/test',
      };

      const exception = new HttpException('Not Found', HttpStatus.NOT_FOUND);
      const host = createMockArgumentsHost(mockResponse, mockRequest);

      filter.catch(exception, host);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: 404,
        message: 'Not Found',
        error: 'Error',
      });
    });

    it('should handle HttpException with object response', () => {
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      const mockRequest = {
        method: 'POST',
        url: '/api/v1/users',
      };

      const exception = new HttpException(
        { message: 'Custom error', error: 'Custom Error Type' },
        HttpStatus.BAD_REQUEST,
      );
      const host = createMockArgumentsHost(mockResponse, mockRequest);

      filter.catch(exception, host);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: 400,
        message: 'Custom error',
        error: 'Custom Error Type',
        errors: undefined,
      });
    });

    it('should handle ConflictException (409)', () => {
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      const mockRequest = {
        method: 'POST',
        url: '/api/v1/auth/register',
      };

      const exception = new HttpException(
        { message: '该邮箱已被注册', error: 'Conflict' },
        HttpStatus.CONFLICT,
      );
      const host = createMockArgumentsHost(mockResponse, mockRequest);

      filter.catch(exception, host);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: 409,
        message: '该邮箱已被注册',
        error: 'Conflict',
        errors: undefined,
      });
    });

    it('should handle ValidationPipe error array', () => {
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      const mockRequest = {
        method: 'POST',
        url: '/api/v1/auth/register',
      };

      const exception = new HttpException(
        {
          message: ['email 邮箱格式不正确', 'password 密码长度不能少于 8 位'],
          error: 'Bad Request',
        },
        HttpStatus.BAD_REQUEST,
      );
      const host = createMockArgumentsHost(mockResponse, mockRequest);

      filter.catch(exception, host);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: 400,
        message: '验证失败',
        error: 'Bad Request',
        errors: [
          { field: 'email', message: '邮箱格式不正确' },
          { field: 'password', message: '密码长度不能少于 8 位' },
        ],
      });
    });

    it('should handle validation error with single word message', () => {
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      const mockRequest = {
        method: 'POST',
        url: '/api/v1/test',
      };

      const exception = new HttpException(
        {
          message: ['InvalidInput'],
          error: 'Bad Request',
        },
        HttpStatus.BAD_REQUEST,
      );
      const host = createMockArgumentsHost(mockResponse, mockRequest);

      filter.catch(exception, host);

      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: 400,
        message: '验证失败',
        error: 'Bad Request',
        errors: [{ field: 'unknown', message: 'InvalidInput' }],
      });
    });
  });

  describe('Non-HttpException handling', () => {
    it('should handle generic Error', () => {
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      const mockRequest = {
        method: 'GET',
        url: '/api/v1/error',
      };

      const exception = new Error('Unexpected error');
      const host = createMockArgumentsHost(mockResponse, mockRequest);

      filter.catch(exception, host);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: 500,
        message: '服务器内部错误',
        error: 'Internal Server Error',
        errors: undefined,
      });
    });

    it('should handle unknown exception type', () => {
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      const mockRequest = {
        method: 'GET',
        url: '/api/v1/error',
      };

      const exception = 'string exception';
      const host = createMockArgumentsHost(mockResponse, mockRequest);

      filter.catch(exception, host);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: 500,
        message: '服务器内部错误',
        error: 'Internal Server Error',
        errors: undefined,
      });
    });
  });

  describe('convertValidationErrors', () => {
    it('should parse validation error messages correctly', () => {
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      const mockRequest = {
        method: 'POST',
        url: '/api/v1/test',
      };

      const exception = new HttpException(
        {
          message: ['email 邮箱格式不正确', 'password 密码太短'],
          error: 'Bad Request',
        },
        HttpStatus.BAD_REQUEST,
      );
      const host = createMockArgumentsHost(mockResponse, mockRequest);

      filter.catch(exception, host);

      const callArgs = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(callArgs.errors).toEqual([
        { field: 'email', message: '邮箱格式不正确' },
        { field: 'password', message: '密码太短' },
      ]);
    });

    it('should handle error message without space', () => {
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      const mockRequest = {
        method: 'POST',
        url: '/api/v1/test',
      };

      const exception = new HttpException(
        {
          message: ['InvalidFormat'],
          error: 'Bad Request',
        },
        HttpStatus.BAD_REQUEST,
      );
      const host = createMockArgumentsHost(mockResponse, mockRequest);

      filter.catch(exception, host);

      const callArgs = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(callArgs.errors).toEqual([{ field: 'unknown', message: 'InvalidFormat' }]);
    });
  });
});
