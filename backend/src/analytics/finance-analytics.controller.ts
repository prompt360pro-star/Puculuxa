import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { FinanceAnalyticsService } from './finance-analytics.service';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class FinanceAnalyticsController {
    constructor(private readonly financeAnalyticsService: FinanceAnalyticsService) { }

    @Get('finance')
    async getFinanceDashboard() {
        return this.financeAnalyticsService.getFinanceDashboard();
    }
}
