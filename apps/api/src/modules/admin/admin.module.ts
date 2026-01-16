import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PrismaModule } from '../../prisma/prisma.module';

/**
 * Admin Module
 *
 * Provides administrative functionality for managing users and system data.
 * This module handles:
 * - User listing with pagination and filtering
 * - Future: System statistics
 * - Future: User management operations
 *
 * ## Security
 * - All routes require ADMIN role
 * - Uses AuthModule's guards (JwtAuthGuard, RolesGuard)
 *
 * ## Dependencies
 * - PrismaModule: For database access
 * - AuthModule: For authentication and authorization (imported in AppModule)
 *
 * @see AdminController
 * @see AdminService
 */
@Module({
  imports: [PrismaModule],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
