import { Controller, Get, UseGuards, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor, CacheKey, CacheTTL } from '@nestjs/cache-manager';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) { }

  @Get('dashboard')
  @UseInterceptors(CacheInterceptor)
  @CacheKey('dashboard_stats_main')
  @CacheTTL(60000) // Lower TTL to 1 minute for near real-time dashboards
  async getDashboardStats() {
    return this.analyticsService.getDashboardStats();
  }
}
