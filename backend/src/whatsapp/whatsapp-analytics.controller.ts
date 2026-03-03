import { Controller, Get, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';

@Controller('analytics')
export class WhatsAppAnalyticsController {
    constructor(private readonly prisma: PrismaService) { }

    @Get('whatsapp')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    async getWhatsAppAnalytics() {
        const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const [logs24h, recent] = await Promise.all([
            (this.prisma as any).whatsAppLog.findMany({
                where: { createdAt: { gte: since24h } },
                select: {
                    id: true,
                    templateName: true,
                    status: true,
                    sentAt: true,
                    deliveredAt: true,
                    readAt: true,
                    createdAt: true,
                },
            }),
            (this.prisma as any).whatsAppLog.findMany({
                orderBy: { createdAt: 'desc' },
                take: 30,
                select: {
                    id: true,
                    templateName: true,
                    recipientPhone: true,
                    status: true,
                    orderId: true,
                    errorMessage: true,
                    createdAt: true,
                    sentAt: true,
                    deliveredAt: true,
                    readAt: true,
                },
            }),
        ]);

        // ── KPIs ──────────────────────────────────────────────────────────────
        const kpis = {
            sent24h: logs24h.filter((l: any) => l.status === 'SENT').length,
            delivered24h: logs24h.filter((l: any) => l.status === 'DELIVERED').length,
            read24h: logs24h.filter((l: any) => l.status === 'READ').length,
            failed24h: logs24h.filter((l: any) => l.status === 'FAILED').length,
            skipped24h: logs24h.filter((l: any) => l.status === 'SKIPPED').length,
        };

        // ── By Template ───────────────────────────────────────────────────────
        const templateMap = new Map<string, Record<string, number>>();
        for (const l of logs24h) {
            if (!templateMap.has(l.templateName)) {
                templateMap.set(l.templateName, { sent: 0, delivered: 0, read: 0, failed: 0, skipped: 0, pending: 0 });
            }
            const bucket = templateMap.get(l.templateName)!;
            const key = (l.status as string).toLowerCase();
            if (key in bucket) bucket[key]++;
        }
        const byTemplate24h = Array.from(templateMap.entries()).map(([templateName, counts]) => ({
            templateName,
            ...counts,
        }));

        return { kpis, byTemplate24h, recent };
    }
}
