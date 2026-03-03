import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FinanceAnalyticsService {
    constructor(private readonly prisma: PrismaService) { }

    async getFinanceDashboard() {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // ─── Run all queries in parallel ───
        const [
            cashThisMonth,
            cashTotal,
            openOrders,
            overdueOrders,
            creditOrders,
            allOrders,
            awaitingProofPayments,
            recentPayments,
        ] = await Promise.all([
            // Cash received this month
            this.prisma.payment.aggregate({
                where: { status: 'SUCCESS', createdAt: { gte: startOfMonth } },
                _sum: { amount: true },
            }),
            // Cash received total
            this.prisma.payment.aggregate({
                where: { status: 'SUCCESS' },
                _sum: { amount: true },
            }),
            // Open receivables (all non-PAID)
            this.prisma.order.aggregate({
                where: { financialStatus: { not: 'PAID' } },
                _sum: { total: true },
            }),
            // Overdue value
            this.prisma.order.aggregate({
                where: { financialStatus: 'OVERDUE' },
                _sum: { total: true },
            }),
            // Credit exposure (IN_CREDIT + OVERDUE)
            this.prisma.order.aggregate({
                where: { financialStatus: { in: ['IN_CREDIT', 'OVERDUE'] } },
                _sum: { total: true },
            }),
            // All orders with payments (for aging + avgDaysToPay + breakdown)
            this.prisma.order.findMany({
                select: {
                    id: true,
                    total: true,
                    createdAt: true,
                    financialStatus: true,
                    paymentMode: true,
                    payments: {
                        where: { status: 'SUCCESS' },
                        orderBy: { createdAt: 'asc' },
                        take: 1,
                        select: { createdAt: true },
                    },
                },
            }),
            // Awaiting proof payments
            this.prisma.payment.findMany({
                where: { status: 'AWAITING_PROOF' },
                orderBy: { createdAt: 'desc' },
                take: 10,
                select: {
                    id: true,
                    orderId: true,
                    amount: true,
                    proofUrl: true,
                    createdAt: true,
                    order: { select: { user: { select: { name: true } } } },
                },
            }),
            // Recent payments
            this.prisma.payment.findMany({
                orderBy: { createdAt: 'desc' },
                take: 10,
                select: { id: true, orderId: true, amount: true, method: true, status: true, createdAt: true },
            }),
        ]);

        // Overdue credits list
        const overdueCredits = await this.prisma.order.findMany({
            where: { financialStatus: 'OVERDUE' },
            orderBy: { creditDueDate: 'asc' },
            take: 10,
            select: {
                id: true,
                debtorEntityName: true,
                creditDueDate: true,
                total: true,
                invoices: { select: { invoiceNumber: true }, take: 1 },
            },
        });

        // ─── Compute breakdown & aging from allOrders ───
        const byFinancialStatus: Record<string, number> = {
            UNPAID: 0, PARTIALLY_PAID: 0, PAID: 0, IN_CREDIT: 0, OVERDUE: 0,
        };
        const byPaymentMode: Record<string, number> = {
            APPYPAY_GPO: 0, BANK_TRANSFER: 0, GOVERNMENT_CREDIT: 0, OTHER: 0,
        };
        const agingBuckets: Record<string, number> = { '0_7': 0, '8_30': 0, '31_60': 0, '61_plus': 0 };
        const daysToPay: number[] = [];

        for (const order of allOrders) {
            // Status breakdown
            const fs = order.financialStatus as string;
            if (fs in byFinancialStatus) byFinancialStatus[fs]++;
            else byFinancialStatus['UNPAID']++;

            // Payment mode breakdown
            const pm = order.paymentMode as string | null;
            if (pm && pm in byPaymentMode) byPaymentMode[pm]++;
            else if (pm) byPaymentMode['OTHER']++;

            // Aging (unpaid only)
            if (fs !== 'PAID') {
                const daysOpen = Math.floor((now.getTime() - order.createdAt.getTime()) / 86_400_000);
                if (daysOpen <= 7) agingBuckets['0_7']++;
                else if (daysOpen <= 30) agingBuckets['8_30']++;
                else if (daysOpen <= 60) agingBuckets['31_60']++;
                else agingBuckets['61_plus']++;
            }

            // Avg days to pay
            if (order.payments.length > 0) {
                const days = Math.floor(
                    (order.payments[0].createdAt.getTime() - order.createdAt.getTime()) / 86_400_000,
                );
                daysToPay.push(days);
            }
        }

        const avgDaysToPay = daysToPay.length > 0
            ? (daysToPay.reduce((a, b) => a + b, 0) / daysToPay.length).toFixed(1)
            : 'N/A';

        return {
            kpis: {
                cashReceivedThisMonth: cashThisMonth._sum.amount ?? 0,
                cashReceivedTotal: cashTotal._sum.amount ?? 0,
                receivablesOpen: openOrders._sum.total ?? 0,
                receivablesOverdue: overdueOrders._sum.total ?? 0,
                creditExposure: creditOrders._sum.total ?? 0,
                avgDaysToPay,
            },
            breakdown: {
                byPaymentMode,
                byFinancialStatus,
                agingBuckets,
            },
            actionItems: {
                awaitingProof: awaitingProofPayments.map((p) => ({
                    paymentId: p.id,
                    orderId: p.orderId,
                    amount: p.amount,
                    proofUrl: p.proofUrl,
                    customerName: (p as any).order?.user?.name ?? null,
                    createdAt: p.createdAt.toISOString(),
                })),
                overdueCredits: overdueCredits.map((o) => ({
                    orderId: o.id,
                    debtorEntityName: o.debtorEntityName,
                    invoiceNumber: o.invoices[0]?.invoiceNumber ?? null,
                    creditDueDate: o.creditDueDate?.toISOString() ?? null,
                    total: o.total,
                })),
            },
            recent: {
                payments: recentPayments.map((p) => ({
                    id: p.id,
                    orderId: p.orderId,
                    amount: p.amount,
                    method: p.method,
                    status: p.status,
                    createdAt: p.createdAt.toISOString(),
                })),
            },
        };
    }
}
