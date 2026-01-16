import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshAuthGuard } from './guards/jwt-refresh-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { AdminGuard } from './guards/admin.guard';

/**
 * AuthModule handles authentication-related functionality
 * including user registration, login, and token management
 *
 * PrismaService is globally available via @Global decorator in PrismaModule,
 * so it doesn't need to be imported here
 */

// Get JWT_SECRET or throw error in production
// In test environment, allow fallback to prevent test failures
const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV !== 'test') {
    throw new Error(
      'JWT_SECRET environment variable is required. ' +
      'Set it in your .env file with a strong random value.'
    );
  }
  return secret || 'test-secret-key-do-not-use-in-production';
};

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: getJwtSecret(),
      signOptions: {
        expiresIn: '15m',
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtRefreshStrategy, JwtAuthGuard, JwtRefreshAuthGuard, RolesGuard, AdminGuard],
  exports: [AuthService, JwtAuthGuard, RolesGuard, AdminGuard],
})
export class AuthModule {}
