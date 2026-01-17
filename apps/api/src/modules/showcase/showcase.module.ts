import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from '../../prisma/prisma.module';
import { GithubFetcherService } from './github-fetcher.service';
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
    ShowcaseService,
  ],
  exports: [GithubFetcherService, ShowcaseService],
})
export class ShowcaseModule {}
