import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export enum OrderStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
        items: true,
      },
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

  create(data: {
    userId: string;
    total: number;
    items: {
      productId: string;
      name: string;
      price: number;
      quantity: number;
    }[];
  }) {
    return this.prisma.order.create({
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
    });
  }

  updateStatus(id: string, status: OrderStatus) {
    return this.prisma.order.update({
      where: { id },
      data: { status },
    });
  }
}
