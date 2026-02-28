import { Controller, Get, UseGuards, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor, CacheKey, CacheTTL } from '@nestjs/cache-manager';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @UseInterceptors(CacheInterceptor)
  @CacheKey('dashboard_stats_main')
  @CacheTTL(300000) // 5 minutes cache TTL overridden safely
  async getDashboardStats() {
    return this.analyticsService.getDashboardStats();
  }
}
