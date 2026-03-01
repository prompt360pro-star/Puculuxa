import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FeedbackService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    orderId: string;
    userId: string;
    rating: number;
    comment?: string;
  }) {
    return this.prisma.feedback.create({
      data,
    });
  }

  async findAll() {
    return this.prisma.feedback.findMany({
      include: {
        user: { select: { name: true, email: true } },
        order: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getProductReviews(productId: string) {
    // Futura expansão: feedbacks por produto específico
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _pid = productId;
    return this.findAll();
  }

  async replyToFeedback(id: string, adminReply: string) {
    return this.prisma.feedback.update({
      where: { id },
      data: {
        adminReply,
        repliedAt: new Date(),
      },
    });
  }
}
