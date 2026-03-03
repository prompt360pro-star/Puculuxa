import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { PaymentMethod, PaymentStatus, FinancialStatus, PaymentReminderType, ReminderChannel } from '@prisma/client';

@Injectable()
export class PaymentReminderService {
    private readonly logger = new Logger(PaymentReminderService.name);

    constructor(
        private prisma: PrismaService,
        private events: EventsGateway,
    ) { }

    @Cron('0 9 * * *') // 09:00 todos os dias
    async processDailyReminders() {
        this.logger.log(`[PaymentReminder] Executing daily reminders at ${new Date().toISOString()}`);

        await this.processPendingGpo();
        await this.processAwaitingProofWithoutUrl();
        await this.processAwaitingProofWithUrl();
        await this.processCreditsDueSoonOrOverdue();

        this.logger.log(`[PaymentReminder] Daily reminders finished.`);
    }

    // ─── A) GPO pendente (B2C) ───
    private async processPendingGpo() {
        const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);

        const payments = await this.prisma.payment.findMany({
            where: {
                method: PaymentMethod.APPYPAY_GPO,
                status: PaymentStatus.PENDING,
                createdAt: { lte: tenMinsAgo, gte: twentyFourHoursAgo },
            },
            include: { order: { include: { user: true } } },
        });

        for (const p of payments) {
            const hasLog = await this.prisma.paymentReminderLog.findFirst({
                where: {
                    paymentId: p.id,
                    type: PaymentReminderType.PAYMENT_PENDING_GPO,
                    sentAt: { gte: twelveHoursAgo },
                },
            });

            if (hasLog) continue;

            if (p.order.user?.pushToken) {
                await this.sendExpoPush(
                    p.order.user.pushToken,
                    'Pagamento pendente',
                    'Confirme o pagamento na app Multicaixa Express para concluir a encomenda.',
                    { screen: 'OrderTracking', orderId: p.orderId }
                );
            }

            await this.prisma.paymentReminderLog.create({
                data: {
                    type: PaymentReminderType.PAYMENT_PENDING_GPO,
                    channel: ReminderChannel.PUSH,
                    orderId: p.orderId,
                    paymentId: p.id,
                    userId: p.order.userId,
                },
            });
        }
    }

    // ─── B) Transferência sem comprovativo ───
    private async processAwaitingProofWithoutUrl() {
        const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
        const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const payments = await this.prisma.payment.findMany({
            where: {
                method: PaymentMethod.BANK_TRANSFER,
                status: PaymentStatus.AWAITING_PROOF,
                proofUrl: null,
                createdAt: { gte: fourteenDaysAgo, lte: twelveHoursAgo },
            },
            include: { order: { include: { user: true } } },
        });

        for (const p of payments) {
            const hasLog = await this.prisma.paymentReminderLog.findFirst({
                where: {
                    paymentId: p.id,
                    type: PaymentReminderType.PAYMENT_AWAITING_PROOF,
                    sentAt: { gte: twentyFourHoursAgo },
                },
            });

            if (hasLog) continue;

            if (p.order.user?.pushToken) {
                await this.sendExpoPush(
                    p.order.user.pushToken,
                    'Envie o comprovativo',
                    'Para concluir, envie o comprovativo de pagamento da transferência.',
                    { screen: 'OrderTracking', orderId: p.orderId }
                );
            }

            await this.prisma.paymentReminderLog.create({
                data: {
                    type: PaymentReminderType.PAYMENT_AWAITING_PROOF,
                    channel: ReminderChannel.PUSH,
                    orderId: p.orderId,
                    paymentId: p.id,
                    userId: p.order.userId,
                },
            });
        }
    }

    // ─── C) Transferência com comprovativo mas sem validação ───
    private async processAwaitingProofWithUrl() {
        const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
        const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);

        const payments = await this.prisma.payment.findMany({
            where: {
                method: PaymentMethod.BANK_TRANSFER,
                status: PaymentStatus.AWAITING_PROOF,
                proofUrl: { not: null },
                createdAt: { gte: fourteenDaysAgo },
            },
            include: { order: { include: { invoices: true } } },
        });

        for (const p of payments) {
            const hasLog = await this.prisma.paymentReminderLog.findFirst({
                where: {
                    paymentId: p.id,
                    type: PaymentReminderType.PAYMENT_AWAITING_VALIDATION,
                    sentAt: { gte: twelveHoursAgo },
                },
            });

            if (hasLog) continue;

            await this.prisma.paymentReminderLog.create({
                data: {
                    type: PaymentReminderType.PAYMENT_AWAITING_VALIDATION,
                    channel: ReminderChannel.INTERNAL,
                    orderId: p.orderId,
                    paymentId: p.id,
                },
            });

            this.events.notifyAdmins('payment_validation_pending', {
                orderId: p.orderId,
                paymentId: p.id,
                amount: p.amount,
                invoiceNumber: p.order.invoices?.[0]?.invoiceNumber || 'N/A',
            });
        }
    }

    // ─── D) Crédito due soon / overdue ───
    private async processCreditsDueSoonOrOverdue() {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const now = new Date();
        const threeDaysAhead = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

        const credits = await this.prisma.order.findMany({
            where: { financialStatus: FinancialStatus.IN_CREDIT },
        });

        for (const order of credits) {
            if (!order.creditDueDate) continue;

            const isOverdue = order.creditDueDate < now;
            const isDueSoon = order.creditDueDate >= now && order.creditDueDate <= threeDaysAhead;

            if (!isOverdue && !isDueSoon) continue;

            const type = isOverdue ? PaymentReminderType.CREDIT_OVERDUE : PaymentReminderType.CREDIT_DUE_SOON;

            const hasLog = await this.prisma.paymentReminderLog.findFirst({
                where: {
                    orderId: order.id,
                    type,
                    sentAt: { gte: twentyFourHoursAgo },
                },
            });

            if (hasLog) continue;

            await this.prisma.paymentReminderLog.create({
                data: {
                    type,
                    channel: ReminderChannel.INTERNAL,
                    orderId: order.id,
                },
            });

            this.events.notifyAdmins('credit_followup_required', {
                orderId: order.id,
                debtor: order.debtorEntityName,
                dueDate: order.creditDueDate,
                total: order.total,
                type,
            });
        }
    }

    // ─── Expo Push API Delivery ───
    private async sendExpoPush(
        pushToken: string,
        title: string,
        body: string,
        data?: Record<string, unknown>,
    ): Promise<void> {
        if (!pushToken.startsWith('ExponentPushToken[')) return;

        const payload = JSON.stringify({
            to: pushToken,
            title,
            body,
            data: data || {},
            sound: 'default',
            priority: 'high',
            channelId: 'puculuxa_reminders',
        });

        try {
            const https = await import('https');
            await new Promise<void>((resolve, reject) => {
                const req = https.request({
                    hostname: 'exp.host',
                    path: '/--/api/v2/push/send',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'accept-encoding': 'gzip, deflate',
                    },
                }, (res) => {
                    let raw = '';
                    res.on('data', c => raw += c);
                    res.on('end', () => resolve());
                });
                req.on('error', reject);
                req.write(payload);
                req.end();
            });
        } catch (err) {
            this.logger.error(`[Push] Expo delivery failed: ${err}`);
        }
    }
}
