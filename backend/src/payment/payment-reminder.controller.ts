import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('analytics/payment-reminders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentReminderController {
    constructor(private prisma: PrismaService) { }

    @Get()
    @Roles('ADMIN')
    async getRecentReminders() {
        return this.prisma.paymentReminderLog.findMany({
            orderBy: { sentAt: 'desc' },
            take: 50,
            select: {
                id: true,
                type: true,
                channel: true,
                orderId: true,
                paymentId: true,
                userId: true,
                sentAt: true,
                target: true,
            },
        });
    }
}
