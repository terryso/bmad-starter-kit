import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from '../../prisma/prisma.module';
import { GithubFetcherService } from './github-fetcher.service';
import { SyncCacheService } from './services/sync-cache.service';
import { ShowcaseService } from './showcase.service';
import { ShowcaseController } from './showcase.controller';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    ThrottlerModule, // For rate limiting
  ],
  controllers: [ShowcaseController],
  providers: [
    GithubFetcherService,
    SyncCacheService,
    ShowcaseService,
  ],
  exports: [GithubFetcherService, SyncCacheService, ShowcaseService],
})
export class ShowcaseModule {}
