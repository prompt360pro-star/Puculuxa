import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { startOfMonth } from 'date-fns/startOfMonth';
import { subMonths } from 'date-fns/subMonths';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) { }

  async getDashboardStats() {
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));

    // Execute queries in parallel
    const [
      totalQuotations,
      thisMonthQuotationsCount,
      lastMonthQuotationsCount,
      convertedQuotationsCount,
      nonDraftQuotationsCount,
      thisMonthRevenueAgg,
      lastMonthRevenueAgg,
      avgResponseHoursRaw,
      quotationsStatusGroups,
      expiringQuotations,
      slaBreachedQuotations,
      pendingReviewCount,
      awaitingResponseCount,
    ] = await Promise.all([
      // 1. KPIs
      this.prisma.quotation.count({ where: { deletedAt: null } }),

      this.prisma.quotation.count({
        where: { createdAt: { gte: currentMonthStart }, deletedAt: null },
      }),

      this.prisma.quotation.count({
        where: {
          createdAt: { gte: lastMonthStart, lt: currentMonthStart },
          deletedAt: null,
        },
      }),

      this.prisma.quotation.count({
        where: { status: 'CONVERTED', deletedAt: null },
      }),

      this.prisma.quotation.count({
        where: { status: { not: 'DRAFT' }, deletedAt: null },
      }),

      this.prisma.order.aggregate({
        _sum: { total: true },
        where: { createdAt: { gte: currentMonthStart } },
      }),

      this.prisma.order.aggregate({
        _sum: { total: true },
        where: { createdAt: { gte: lastMonthStart, lt: currentMonthStart } },
      }),

      this.prisma.$queryRaw<[{ avgHours: number | null }]>`
        SELECT AVG(
          EXTRACT(EPOCH FROM (p."createdAt" - s."createdAt")) / 3600
        ) as avgHours
        FROM StatusAuditLog s
        INNER JOIN StatusAuditLog p ON s."quotationId" = p."quotationId"
        WHERE s."toStatus" = 'SUBMITTED' AND p."toStatus" = 'PROPOSAL_SENT'
      `,

      // 2. FUNNEL
      this.prisma.quotation.groupBy({
        by: ['status'],
        _count: { id: true },
        where: { deletedAt: null },
      }),

      // 3. ACTION ITEMS
      this.prisma.quotation.findMany({
        where: {
          status: { in: ['SUBMITTED', 'PROPOSAL_SENT'] },
          deletedAt: null,
          slaDeadline: {
            gt: now,
            lte: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Next 24h
          },
        },
        select: {
          id: true,
          eventType: true,
          slaDeadline: true,
          status: true,
          customerName: true,
        },
        orderBy: { slaDeadline: 'asc' },
        take: 10,
      }),

      this.prisma.quotation.findMany({
        where: {
          status: { in: ['SUBMITTED', 'IN_REVIEW'] },
          deletedAt: null,
          slaDeadline: { lt: now },
        },
        select: {
          id: true,
          eventType: true,
          slaDeadline: true,
          status: true,
          customerName: true,
        },
        orderBy: { slaDeadline: 'asc' },
        take: 10,
      }),

      this.prisma.quotation.count({
        where: { status: 'SUBMITTED', deletedAt: null },
      }),

      this.prisma.quotation.count({
        where: { status: 'PROPOSAL_SENT', deletedAt: null },
      }),
    ]);

    // Format KPIs
    let monthOverMonth = null;
    if (lastMonthQuotationsCount > 0) {
      const growth = ((thisMonthQuotationsCount - lastMonthQuotationsCount) / lastMonthQuotationsCount) * 100;
      monthOverMonth = `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%`;
    } else if (thisMonthQuotationsCount > 0) {
      monthOverMonth = '+100%';
    }

    let conversionRate = '0%';
    if (nonDraftQuotationsCount > 0) {
      const rate = (convertedQuotationsCount / nonDraftQuotationsCount) * 100;
      conversionRate = `${rate.toFixed(1)}%`;
    }

    const revenueThisMonth = thisMonthRevenueAgg._sum.total || 0;
    const revenueLastMonth = lastMonthRevenueAgg._sum.total || 0;
    let revenueGrowth = null;
    if (revenueLastMonth > 0) {
      const growth = ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100;
      revenueGrowth = `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%`;
    } else if (revenueThisMonth > 0) {
      revenueGrowth = '+100%';
    }

    const avgResponseHoursStr =
      avgResponseHoursRaw[0]?.avgHours !== null && avgResponseHoursRaw[0]?.avgHours !== undefined
        ? avgResponseHoursRaw[0].avgHours.toFixed(1)
        : 'N/A';

    // Format Funnel
    const funnelObj = {
      submitted: 0,
      inReview: 0,
      proposalSent: 0,
      negotiating: 0,
      accepted: 0,
      converted: 0,
      rejected: 0,
      expired: 0,
    };

    quotationsStatusGroups.forEach((group) => {
      switch (group.status) {
        case 'SUBMITTED': funnelObj.submitted = group._count.id; break;
        case 'IN_REVIEW': funnelObj.inReview = group._count.id; break;
        case 'PROPOSAL_SENT': funnelObj.proposalSent = group._count.id; break;
        case 'NEGOTIATING': funnelObj.negotiating = group._count.id; break;
        case 'ACCEPTED': funnelObj.accepted = group._count.id; break;
        case 'CONVERTED': funnelObj.converted = group._count.id; break;
        case 'REJECTED': funnelObj.rejected = group._count.id; break;
        case 'EXPIRED': funnelObj.expired = group._count.id; break;
      }
    });

    return {
      kpis: {
        totalQuotations,
        thisMonth: thisMonthQuotationsCount,
        monthOverMonth,
        conversionRate,
        revenueThisMonth,
        revenueGrowth,
        avgResponseHours: avgResponseHoursStr,
      },
      funnel: funnelObj,
      actionItems: {
        expiringIn24h: expiringQuotations,
        slaBreached: slaBreachedQuotations,
        pendingReview: pendingReviewCount,
        awaitingResponse: awaitingResponseCount,
      },
    };
  }
}
