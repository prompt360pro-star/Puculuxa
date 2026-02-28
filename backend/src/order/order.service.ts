import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';

export enum OrderStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  PRODUCING = 'PRODUCING',
  READY = 'READY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

@Injectable()
export class OrderService {
  constructor(
    private prisma: PrismaService,
    private events: EventsGateway,
  ) { }

  async findAll(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: true, items: true },
      }),
      this.prisma.order.count(),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  findMyOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    });
  }

  findOne(id: string) {
    return this.prisma.order.findUnique({
      where: { id },
      include: {
        user: true,
        items: true,
      },
    });
  }

  async create(data: {
    userId: string;
    total: number;
    items: {
      productId: string;
      name: string;
      price: number;
      quantity: number;
    }[];
  }) {
    const newOrder = await this.prisma.order.create({
      data: {
        userId: data.userId,
        items: {
          create: data.items.map((item) => ({
            productId: item.productId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          })),
        },
        total: data.total,
        status: OrderStatus.PENDING,
      },
      include: { user: true, items: true },
    });

    this.events.notifyAdmins('new_order', newOrder);
    return newOrder;
  }

  async updateStatus(id: string, status: OrderStatus) {
    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: { status },
      include: { user: true },
    });
    this.events.notifyAdmins('order_status_update', updatedOrder);
    return updatedOrder;
  }
}
