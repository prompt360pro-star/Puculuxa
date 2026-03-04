import { PaymentStatus, PaymentMethod, PayoutStatus } from '@prisma/client';
import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ExportService } from './export.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import type { Response } from 'express';

@Controller('exports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class ExportController {
    constructor(private readonly exportService: ExportService) { }

    @Get('payments.csv')
    async exportPayments(
        @Res() res: Response,
        @Query('from') from: string,
        @Query('to') to: string,
        @Query('status') status?: string,
        @Query('method') method?: string,
    ) {
        const csv = await this.exportService.exportPayments(
            from,
            to,
            status as PaymentStatus,
            method as PaymentMethod
        );

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="payments_ledger_${from}_${to}.csv"`,
        );
        res.send(csv);
    }

    @Get('invoices.csv')
    async exportInvoices(
        @Query('from') from: string,
        @Query('to') to: string,
        @Query('prefix') prefix: string,
        @Res() res: Response,
    ) {
        const csv = await this.exportService.exportInvoices(from, to, prefix);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="invoices_ledger_${from}_${to}.csv"`,
        );
        res.send(csv);
    }

    @Get('payouts.csv')
    async exportPayouts(
        @Res() res: Response,
        @Query('from') from: string,
        @Query('to') to: string,
        @Query('status') status?: string,
    ) {
        const csv = await this.exportService.exportPayouts(from, to, status as PayoutStatus);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="payouts_ledger_${from}_${to}.csv"`,
        );
        res.send(csv);
    }

    @Get('payout-items.csv')
    async exportPayoutItems(
        @Query('payoutId') payoutId: string,
        @Res() res: Response,
    ) {
        const csv = await this.exportService.exportPayoutItems(payoutId);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="payout_items_${payoutId}.csv"`,
        );
        res.send(csv);
    }
}
