import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaClient } from '@prisma/client';

export class CreateFollowUpDto {
    channel?: any;
    outcome?: any;
    note!: string;
    nextFollowUpAt?: Date | string;
    attachmentUrl?: string;
}

@Injectable()
export class FollowUpService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Regista um novo log de follow-up e actualiza a data na Order (lastPaymentFollowUpAt).
     */
    async createFollowUp(orderId: string, adminId: string, dto: CreateFollowUpDto) {
        const order = await this.prisma.order.findUnique({ where: { id: orderId } });
        if (!order) throw new NotFoundException(`Order ${orderId} not found`);

        const now = new Date();

        // 1. Criar Log
        const log = await (this.prisma as any).paymentFollowUpLog.create({
            data: {
                orderId,
                createdById: adminId,
                channel: dto.channel ?? 'PHONE',
                outcome: dto.outcome ?? 'OTHER',
                note: dto.note,
                nextFollowUpAt: dto.nextFollowUpAt ? new Date(dto.nextFollowUpAt) : null,
                attachmentUrl: dto.attachmentUrl,
            },
        });

        // 2. Marcar Order touched
        await this.prisma.order.update({
            where: { id: orderId },
            data: {
                lastPaymentFollowUpAt: now,
            } as any,
        });

        return log;
    }

    /**
     * Lista todos os logs de uma Order específica (Timeline).
     */
    async listFollowUps(orderId: string) {
        return (this.prisma as any).paymentFollowUpLog.findMany({
            where: { orderId },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Retorna os Follow-ups planeados que já venceram (Logs due today ou orders OVERDUE sem tracking recente).
     */
    async listNextFollowUpsDue() {
        const now = new Date();

        // logs onde nextFollowUpAt <= now ("A seguir")
        const dueLogs = await (this.prisma as any).paymentFollowUpLog.findMany({
            where: {
                nextFollowUpAt: { lte: now },
            },
            include: { order: true },
            orderBy: { nextFollowUpAt: 'asc' },
            take: 50,
        });

        return dueLogs;
    }
}
