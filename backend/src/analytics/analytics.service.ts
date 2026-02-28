import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) { }

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

    // Agregação movida do NodeJS/Frontend para o SQLite
    // Extratos de 'revenueByMonth' agrupados nativamente
    const revenueByMonthRaw = await this.prisma.$queryRaw<
      { month: string; total: number }[]
    >`
      SELECT 
        strftime('%Y-%m', createdAt) as month, 
        SUM(total) as total
      FROM "Order"
      WHERE status = 'DELIVERED'
      GROUP BY strftime('%Y-%m', createdAt)
      ORDER BY month ASC
    `;

    // Normalizing SQLite BigInt/Numeric responses
    const revenueByMonth = revenueByMonthRaw.map((row) => ({
      month: row.month,
      total: Number(row.total),
    }));

    // Sales by Category
    const categoryDataRaw = await this.prisma.$queryRaw<
      { name: string; value: number }[]
    >`
      SELECT 
        p.category as name,
        SUM(oi.price * oi.quantity) as value
      FROM "OrderItem" oi
      JOIN "Product" p ON oi.productId = p.id
      JOIN "Order" o ON oi.orderId = o.id
      WHERE o.status = 'DELIVERED'
      GROUP BY p.category
    `;

    const categoryData = categoryDataRaw.map((row) => ({
      name: row.name || 'Outros',
      value: Number(row.value),
    }));

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
      revenueByMonth,
      categoryData,
    };
  }
}
