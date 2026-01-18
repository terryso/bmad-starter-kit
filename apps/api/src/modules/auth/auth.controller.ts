import { Controller, Post, Body, HttpCode, HttpStatus, Res, UseGuards, Get } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ApiResponse, LoginResponseDto, JwtPayload } from '@bmad-starter-kit/shared';
import { User } from '@prisma/client';
import { Public } from '../../common/decorators';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshAuthGuard } from './guards/jwt-refresh-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

/**
 * AuthController handles authentication-related HTTP requests
 * Base path: /api/v1/auth (actual route: /api/v1/auth/* due to global prefix)
 *
 * ### Public Routes
 * The register and login endpoints are marked with @Public() decorator.
 * This is a preventive measure - if a global JwtAuthGuard is applied to the app
 * in the future, these routes will remain accessible without authentication.
 */
@Controller('v1/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * User registration endpoint
   * POST /api/v1/auth/register
   *
   * Rate limited: 5 requests per 15 minutes per IP to prevent abuse
   *
   * @param dto Registration data containing email, password, and name
   * @returns ApiResponse with created user (without password)
   * @throws 400 if validation fails
   * @throws 409 if email already exists
   * @throws 429 if rate limit exceeded
   */
  @Post('register')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 5, ttl: 90000 } }) // 5 requests per 15 minutes
  async register(
    @Body() dto: RegisterDto,
  ): Promise<ApiResponse<Omit<User, 'password'>>> {
    const user = await this.authService.register(dto.email, dto.password, dto.name, dto.role, dto.adminSecret);

    return {
      statusCode: HttpStatus.CREATED,
      message: '注册成功',
      data: user,
    };
  }

  /**
   * User login endpoint
   * POST /api/v1/auth/login
   *
   * Rate limited: 5 requests per 15 minutes per IP to prevent brute force attacks
   *
   * @param dto Login data containing email and password
   * @param response Express Response object for setting cookies
   * @returns ApiResponse with access token and user data
   * @throws 400 if validation fails
   * @throws 401 if email or password is incorrect
   * @throws 429 if rate limit exceeded
   */
  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 90000 } }) // 5 requests per 15 minutes
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<ApiResponse<LoginResponseDto>> {
    const result = await this.authService.login(dto.email, dto.password);

    // Set HttpOnly Cookie with Refresh Token
    // sameSite: 'none' 用于跨域场景 (如 Surge + Render)，必须配合 secure: true
    const sameSiteValue = process.env.COOKIE_SAME_SITE || 'lax';
    const isSecure = process.env.NODE_ENV === 'production' || sameSiteValue === 'none';
    response.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: sameSiteValue as 'strict' | 'lax' | 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
      path: '/',
    });

    return {
      statusCode: HttpStatus.OK,
      message: '登录成功',
      data: {
        accessToken: result.accessToken,
        user: result.user,
      },
    };
  }

  /**
   * Refresh access token endpoint
   * POST /api/v1/auth/refresh
   *
   * Uses the refresh token from HttpOnly cookie to issue a new access token
   * This endpoint allows users to stay logged in for 7 days without re-entering credentials
   *
   * @param user User data from refresh token payload (populated by JwtRefreshStrategy)
   * @returns New access token and user data
   * @throws 401 if refresh token is invalid or expired
   */
  @Post('refresh')
  @Public()
  @UseGuards(JwtRefreshAuthGuard)
  @HttpCode(HttpStatus.OK)
  async refresh(
    @CurrentUser() user: { userId: string; email: string },
  ): Promise<ApiResponse<{ accessToken: string; user: Omit<User, 'password'> }>> {
    const result = await this.authService.refreshTokens(user.userId, user.email);

    return {
      statusCode: HttpStatus.OK,
      message: '刷新成功',
      data: result,
    };
  }

  /**
   * User logout endpoint
   * POST /api/v1/auth/logout
   *
   * Clears the HttpOnly refresh token cookie
   * Access token will expire naturally after 15 minutes
   *
   * @param user Current authenticated user from JWT
   * @param response Express Response object for clearing cookies
   * @returns Success message
   * @throws 401 if not authenticated (handled by JwtAuthGuard)
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard) // 需要登录才能登出
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser() _user: JwtPayload, // User populated by JwtAuthGuard, used for authentication only
    @Res({ passthrough: true }) response: Response,
  ): Promise<ApiResponse<{ message: string }>> {
    await this.authService.logout();

    // Clear the HttpOnly Cookie by setting maxAge to 0
    // Note: Parameters must match the cookie setting exactly
    const sameSiteValue = process.env.COOKIE_SAME_SITE || 'lax';
    const isSecure = process.env.NODE_ENV === 'production' || sameSiteValue === 'none';
    response.clearCookie('refresh_token', {
      httpOnly: true,
      secure: isSecure,
      sameSite: sameSiteValue as 'strict' | 'lax' | 'none',
      path: '/',
    });

    return {
      statusCode: HttpStatus.OK,
      message: '登出成功',
      data: { message: '登出成功' },
    };
  }
}
