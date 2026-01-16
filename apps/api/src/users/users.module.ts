import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * UsersModule
 *
 * Provides user-related functionality including:
 * - User profile retrieval
 * - User management (future)
 *
 * This module uses PrismaService (globally available) for database operations.
 * JwtAuthGuard is imported from AuthModule for route protection.
 */
@Module({
  imports: [PrismaModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
