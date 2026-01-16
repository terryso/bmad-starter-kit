import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload, UserRole } from '@bmad-starter-kit/shared';

/**
 * Login result interface
 */
interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: Omit<User, 'password'>;
}

/**
 * AuthService handles user authentication operations
 * including registration, login, and token management
 */
@Injectable()
export class AuthService {
  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService,
  ) {}

  /**
   * Register a new user
   * @param email User email address (must be unique)
   * @param password User password (will be hashed with bcrypt, salt rounds = 10)
   * @param name User display name
   * @returns User object without password field
   * @throws ConflictException if email already exists
   */
  async register(
    email: string,
    password: string,
    name: string,
  ): Promise<Omit<User, 'password'>> {
    // 1. Check if email already exists
    const existingUser = await this.prismaService.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('该邮箱已被注册');
    }

    // 2. Hash password with bcrypt (salt rounds = 10)
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Create user in database
    const user = await this.prismaService.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    // 4. Return user without password field
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Validate user credentials (for login)
   * @param email User email address
   * @param password Plain text password
   * @returns User object without password field, or null if invalid
   */
  async validateUser(
    email: string,
    password: string,
  ): Promise<Omit<User, 'password'> | null> {
    const user = await this.prismaService.user.findUnique({
      where: { email },
    });

    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    // Return user without password field
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Login user with email and password
   * @param email User email address
   * @param password Plain text password
   * @returns Login result with access token, refresh token, and user data
   * @throws UnauthorizedException if credentials are invalid
   */
  async login(email: string, password: string): Promise<LoginResult> {
    const user = await this.validateUser(email, password);

    if (!user) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    // Token Payload - include role for authorization
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role as UserRole,
    };

    // Generate Access Token (1 hour) - explicit expiration
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '1h',
    });

    // Generate Refresh Token (7 days)
    const refreshToken = await this.jwtService.signAsync(payload, {
      expiresIn: '7d',
    });

    return {
      accessToken,
      refreshToken,
      user,
    };
  }

  /**
   * Find user by email
   * @param email User email address
   * @returns User object with all fields or null if not found
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.prismaService.user.findUnique({
      where: { email },
    });
  }

  /**
   * Compare password with hashed password
   * @param password Plain text password
   * @param hashedPassword Hashed password from database
   * @returns true if passwords match
   */
  async comparePassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  /**
   * Logout user (clears refresh token cookie)
   * Note: JWT tokens are stateless, so we mainly clear the cookie
   * The access token will expire naturally after 1 hour
   * @returns Success message
   */
  async logout(): Promise<{ message: string }> {
    // In a stateless JWT system, the server doesn't need to do anything
    // The client just needs to clear the cookie
    // For additional security, we could implement a token blacklist (optional, future)
    return { message: '登出成功' };
  }

  /**
   * Refresh access token using refresh token
   * @param userId User ID from refresh token payload
   * @param email User email from refresh token payload
   * @returns New access token
   * @throws UnauthorizedException if user not found
   */
  async refreshTokens(userId: string, email: string): Promise<{ accessToken: string; user: Omit<User, 'password'> }> {
    // Verify user still exists
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.email !== email) {
      throw new UnauthorizedException('无效的刷新令牌');
    }

    // Generate new access token (1 hour) - include role for authorization
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role as UserRole,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '1h',
    });

    // Return user without password field
    const { password: _, ...userWithoutPassword } = user;

    return {
      accessToken,
      user: userWithoutPassword,
    };
  }
}
