import {
    Controller,
    Get,
    Post,
    Param,
    Body,
    Query,
    UseGuards,
} from '@nestjs/common';
import { PayoutService, CreateDraftPayoutDto, ReportProviderPayoutDto, MarkPayoutAsPaidDto } from './payout.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { PayoutStatus } from '@prisma/client';

@Controller('payouts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class PayoutController {
    constructor(private readonly payoutService: PayoutService) { }

    @Get()
    async listPayouts(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('status') status?: PayoutStatus,
    ) {
        const pageNum = page ? parseInt(page, 10) : 1;
        const limitNum = limit ? parseInt(limit, 10) : 20;
        return this.payoutService.listPayouts(pageNum, limitNum, status);
    }

    @Get(':id')
    async getPayoutById(@Param('id') id: string) {
        return this.payoutService.getPayoutById(id);
    }

    @Post('draft')
    async createDraftPayout(@Body() dto: CreateDraftPayoutDto) {
        return this.payoutService.createDraftPayoutFromPayments(dto);
    }

    @Post(':id/report')
    async reportProviderPayout(
        @Param('id') id: string,
        @Body() dto: ReportProviderPayoutDto,
    ) {
        return this.payoutService.reportProviderPayout(id, dto);
    }

    @Post(':id/mark-paid')
    async markPayoutAsPaid(
        @Param('id') id: string,
        @Body() dto: MarkPayoutAsPaidDto,
    ) {
        return this.payoutService.markPayoutAsPaid(id, dto);
    }
}
