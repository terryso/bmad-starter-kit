import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GithubFetcherService } from './github-fetcher.service';

@Module({
  imports: [ConfigModule],
  providers: [GithubFetcherService],
  exports: [GithubFetcherService],
})
export class ShowcaseModule {}
