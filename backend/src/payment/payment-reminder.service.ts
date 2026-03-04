import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { PaymentMethod, PaymentStatus, FinancialStatus, PaymentReminderType, ReminderChannel } from '@prisma/client';

// ────────────────────────────────────────────────────────────────────────────
// Feature flags (env-based)
// ────────────────────────────────────────────────────────────────────────────
const WA_ENABLED = process.env.WHATSAPP_REMINDERS_ENABLED === 'true';
const COOLDOWN_HOURS = parseInt(process.env.WHATSAPP_REMINDERS_COOLDOWN_HOURS || '12', 10);

// ────────────────────────────────────────────────────────────────────────────
// Bank details constant (used in template vars for bank-transfer reminder)
// ────────────────────────────────────────────────────────────────────────────
const PUCULUXA_BANK = {
    beneficiary: 'Puculuxa Lda',
    bank: 'BAI — Banco Angolano de Investimentos',
    iban: 'AO06.0040.0000.6084.3134.1016.1',
    nif: '5417123456',
    contactPhone: process.env.PUCULUXA_CONTACT_PHONE || 'Contacte-nos',
};

@Injectable()
export class PaymentReminderService {
    private readonly logger = new Logger(PaymentReminderService.name);

    constructor(
        private prisma: PrismaService,
        private events: EventsGateway,
        private whatsapp: WhatsAppService,
    ) { }

    @Cron('0 9 * * *') // 09:00 todos os dias
    async processDailyReminders() {
        try {
            this.logger.log(`[PaymentReminder] Daily run at ${new Date().toISOString()}`);
            await this.processPendingGpo();
            await this.processAwaitingProofWithoutUrl();
            await this.processAwaitingProofWithUrl();
            await this.processCreditsDueSoonOrOverdue();
            this.logger.log('[PaymentReminder] Daily run complete.');
        } catch (error: any) {
            this.logger.error(
                `[Cron] PaymentReminderService.processDailyReminders failed: ${error?.message}`,
                error?.stack,
            );
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Resolve the best available phone number for a WhatsApp dispatch.
     * Priority: order.user.phone → null (graceful skip).
     * Normalises Angola format: 9XXXXXXXX → 2449XXXXXXXX, +244... → 244...
     */
    private resolveRecipientPhone(user?: { phone?: string | null } | null): string | null {
        const raw = user?.phone;
        if (!raw) return null;

        let clean = raw.replace(/[\s+\-()]/g, '');

        // 9-digit Angolan number without country code
        if (/^9\d{8}$/.test(clean)) clean = `244${clean}`;

        // Validate: must be 244 + 9 digits = 12 digits total
        if (!/^244\d{9}$/.test(clean)) return null;

        return clean;
    }

    /**
     * Build a deterministic, time-windowed idempotency key.
     * Bucket = floor(currentHour / cooldownHours) — changes every N hours.
     */
    private buildReminderKey(templateName: string, orderId: string): string {
        const bucket = Math.floor(new Date().getHours() / COOLDOWN_HOURS);
        const day = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        return `WA:REMINDER:${templateName}:${orderId}:${day}B${bucket}`;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // A) GPO pendente (B2C)
    // ─────────────────────────────────────────────────────────────────────────
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
            include: {
                order: {
                    include: {
                        user: true,
                        invoices: { take: 1, orderBy: { createdAt: 'desc' } },
                    },
                },
            },
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

            // PUSH (existing)
            if (p.order.user?.pushToken) {
                await this.sendExpoPush(
                    p.order.user.pushToken,
                    'Pagamento pendente',
                    'Confirme o pagamento na app Multicaixa Express para concluir a encomenda.',
                    { screen: 'OrderTracking', orderId: p.orderId },
                );
            }

            // WHATSAPP (new)
            if (WA_ENABLED) {
                const phone = this.resolveRecipientPhone(p.order.user);
                if (phone) {
                    const invoiceNumber = p.order.invoices?.[0]?.invoiceNumber ?? p.orderId.slice(-8).toUpperCase();
                    await this.whatsapp.sendTemplateMessage({
                        to: phone,
                        templateName: 'puculuxa_gpo_pending_v1',
                        orderId: p.orderId,
                        variables: [String(p.amount), invoiceNumber],
                        idempotencyKey: this.buildReminderKey('GPO_PENDING', p.orderId),
                    });
                    this.logger.log(`[Reminder-WA] GPO pending dispatched for order ${p.orderId}`);
                }
            }

            await this.prisma.paymentReminderLog.create({
                data: {
                    type: PaymentReminderType.PAYMENT_PENDING_GPO,
                    channel: WA_ENABLED ? ReminderChannel.WHATSAPP : ReminderChannel.PUSH,
                    orderId: p.orderId,
                    paymentId: p.id,
                    userId: p.order.userId,
                    meta: WA_ENABLED ? { channels: ['PUSH', 'WHATSAPP'] } : { channels: ['PUSH'] },
                },
            });
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // B) Transferência sem comprovativo uploadado
    // ─────────────────────────────────────────────────────────────────────────
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
            include: {
                order: {
                    include: {
                        user: true,
                        invoices: { take: 1, orderBy: { createdAt: 'desc' } },
                    },
                },
            },
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

            // PUSH (existing)
            if (p.order.user?.pushToken) {
                await this.sendExpoPush(
                    p.order.user.pushToken,
                    'Envie o comprovativo',
                    'Para concluir, envie o comprovativo de pagamento da transferência.',
                    { screen: 'OrderTracking', orderId: p.orderId },
                );
            }

            // WHATSAPP — send bank details so client can actually transfer
            if (WA_ENABLED) {
                const phone = this.resolveRecipientPhone(p.order.user);
                if (phone) {
                    const invoiceNumber = p.order.invoices?.[0]?.invoiceNumber ?? p.orderId.slice(-8).toUpperCase();
                    await this.whatsapp.sendTemplateMessage({
                        to: phone,
                        templateName: 'puculuxa_bank_details_v1',
                        orderId: p.orderId,
                        variables: [
                            PUCULUXA_BANK.beneficiary,
                            PUCULUXA_BANK.bank,
                            PUCULUXA_BANK.iban,
                            PUCULUXA_BANK.nif,
                            String(p.amount),
                            invoiceNumber,
                            p.merchantRef ?? p.orderId.slice(-6).toUpperCase(),
                        ],
                        idempotencyKey: this.buildReminderKey('BANK_DETAILS', p.orderId),
                    });
                    this.logger.log(`[Reminder-WA] Bank details dispatched for order ${p.orderId}`);
                }
            }

            await this.prisma.paymentReminderLog.create({
                data: {
                    type: PaymentReminderType.PAYMENT_AWAITING_PROOF,
                    channel: WA_ENABLED ? ReminderChannel.WHATSAPP : ReminderChannel.PUSH,
                    orderId: p.orderId,
                    paymentId: p.id,
                    userId: p.order.userId,
                    meta: WA_ENABLED ? { channels: ['PUSH', 'WHATSAPP'] } : { channels: ['PUSH'] },
                },
            });
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // C) Comprovativo recebido, a aguardar validação → INTERNAL only
    // ─────────────────────────────────────────────────────────────────────────
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

    // ─────────────────────────────────────────────────────────────────────────
    // D) Crédito due soon / overdue
    // ─────────────────────────────────────────────────────────────────────────
    private async processCreditsDueSoonOrOverdue() {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const now = new Date();
        const threeDaysAhead = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

        const credits = await this.prisma.order.findMany({
            where: { financialStatus: FinancialStatus.IN_CREDIT },
            include: {
                user: true,
                invoices: { take: 1, orderBy: { createdAt: 'desc' } },
            },
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

            // INTERNAL websocket (always)
            await this.prisma.paymentReminderLog.create({
                data: {
                    type,
                    channel: ReminderChannel.INTERNAL,
                    orderId: order.id,
                    meta: WA_ENABLED ? { channels: ['INTERNAL', 'WHATSAPP'] } : { channels: ['INTERNAL'] },
                },
            });

            this.events.notifyAdmins('credit_followup_required', {
                orderId: order.id,
                debtor: order.debtorEntityName,
                dueDate: order.creditDueDate,
                total: order.total,
                type,
            });

            // WHATSAPP — institutional credit reminder (best effort)
            if (WA_ENABLED && isOverdue) {
                const phone = this.resolveRecipientPhone(order.user);
                if (phone) {
                    const daysLate = Math.max(0, Math.floor((now.getTime() - order.creditDueDate.getTime()) / 86400000));
                    const invoiceNumber = order.invoices?.[0]?.invoiceNumber ?? order.id.slice(-8).toUpperCase();
                    await this.whatsapp.sendTemplateMessage({
                        to: phone,
                        templateName: 'puculuxa_credit_overdue_v1',
                        orderId: order.id,
                        variables: [
                            order.debtorEntityName ?? 'Entidade',
                            String(order.total),
                            invoiceNumber,
                            String(daysLate),
                            PUCULUXA_BANK.contactPhone,
                        ],
                        idempotencyKey: this.buildReminderKey('CREDIT_OVERDUE', order.id),
                    });
                    this.logger.log(`[Reminder-WA] Credit overdue dispatched for order ${order.id}`);
                }
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Expo Push delivery (unchanged)
    // ─────────────────────────────────────────────────────────────────────────
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
                const req = https.request(
                    {
                        hostname: 'exp.host',
                        path: '/--/api/v2/push/send',
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Accept: 'application/json',
                            'accept-encoding': 'gzip, deflate',
                        },
                    },
                    (res) => {
                        let raw = '';
                        res.on('data', (c) => (raw += c));
                        res.on('end', () => resolve());
                    },
                );
                req.on('error', reject);
                req.write(payload);
                req.end();
            });
        } catch (err) {
            this.logger.error(`[Push] Expo delivery failed: ${err}`);
        }
    }
}
