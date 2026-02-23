import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    const [
      totalProducts,
      totalOrders,
      totalUsers,
      totalQuotations,
      totalFeedbacks,
    ] = await Promise.all([
      this.prisma.product.count(),
      this.prisma.order.count(),
      this.prisma.user.count(),
      this.prisma.quotation.count(),
      this.prisma.feedback.count(),
    ]);

    const totalRevenue = await this.prisma.order.aggregate({
      _sum: {
        total: true,
      },
    });

    const avgRating = await this.prisma.feedback.aggregate({
      _avg: {
        rating: true,
      },
    });

    const recentOrders = await this.prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { user: true },
    });

    const revenueByMonth = await this.prisma.order.findMany({
      select: {
        total: true,
        createdAt: true,
      },
      where: {
        status: 'COMPLETED',
      },
    });

    return {
      counters: {
        products: totalProducts,
        orders: totalOrders,
        users: totalUsers,
        quotations: totalQuotations,
        feedbacks: totalFeedbacks,
        averageRating: avgRating._avg.rating || 0,
        revenue: totalRevenue._sum.total || 0,
      },
      recentOrders,
      revenueByMonth, // No frontend isso poderá ser agrupado
    };
  }
}
