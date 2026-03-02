import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

/**
 * EventReminder Service — Motor de Recompra v3.1
 *
 * Sequência de reminders automáticos:
 *  30d antes → SMS/Push "Está a planear um evento?"
 *   7d antes → "Ainda há tempo! Reserve agora."
 *   3d antes → "Últimos detalhes para o teu evento!"
 */
@Injectable()
export class EventReminderService {
    private readonly logger = new Logger(EventReminderService.name);

    constructor(private prisma: PrismaService) { }

    // ─── Cron: corre todos os dias às 08:00 AM ───
    @Cron(CronExpression.EVERY_DAY_AT_8AM)
    async processReminders() {
        const now = new Date();
        this.logger.log(`[EventReminder] Processing reminders at ${now.toISOString()}`);

        const dueReminders = await this.prisma.eventReminder.findMany({
            where: {
                status: { in: ['PENDING', 'SENT_30D', 'SENT_7D'] },
                nextReminder: { lte: now },
            },
            include: { user: true },
        });

        this.logger.log(`[EventReminder] Found ${dueReminders.length} reminders to process`);

        for (const reminder of dueReminders) {
            await this.sendReminder(reminder);
        }
    }

    // ─── Cron: auto-expirar orçamentos após 7 dias sem resposta ───
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async expireStaleQuotations() {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        const stale = await this.prisma.quotation.findMany({
            where: {
                status: { in: ['SUBMITTED', 'PROPOSAL_SENT'] },
                slaDeadline: { lte: new Date() },
                updatedAt: { lte: sevenDaysAgo },
                deletedAt: null,
            },
        });

        this.logger.log(`[Expiry] Found ${stale.length} stale quotations to expire`);

        for (const q of stale) {
            await this.prisma.$transaction([
                this.prisma.quotation.update({
                    where: { id: q.id },
                    data: { status: 'EXPIRED', updatedAt: new Date() },
                }),
                this.prisma.statusAuditLog.create({
                    data: {
                        quotationId: q.id,
                        fromStatus: q.status,
                        toStatus: 'EXPIRED',
                        changedBy: 'SYSTEM',
                        reason: 'SLA ultrapassado — expirado automaticamente após 7 dias.',
                    },
                }),
            ]);
        }
    }

    // ─── Process single reminder ───
    private async sendReminder(reminder: any) {
        const eventDate = new Date(reminder.eventDate);
        const daysUntil = Math.ceil((eventDate.getTime() - Date.now()) / 86400000);

        let message: string;
        let nextStatus: string;
        let nextReminderDays: number | null;

        if (daysUntil > 14) {
            // 30d reminder
            message = `🎂 Olá ${reminder.user.name}! O teu evento "${reminder.eventName}" está a ${daysUntil} dias. Já pensaste no bolo? Reserve agora na Puculuxa!`;
            nextStatus = 'SENT_30D';
            nextReminderDays = daysUntil - 23; // next at 7d
        } else if (daysUntil > 4) {
            // 7d reminder
            message = `⏰ ${reminder.user.name}, faltam apenas ${daysUntil} dias para "${reminder.eventName}"! Ainda há tempo para garantir o teu bolo Puculuxa. Encomenda já!`;
            nextStatus = 'SENT_7D';
            nextReminderDays = daysUntil - 4; // next at 3d
        } else if (daysUntil >= 0) {
            // 3d reminder (final)
            message = `🎉 ${reminder.user.name}, faltam ${daysUntil} dias para "${reminder.eventName}"! Confirma os últimos detalhes com a Puculuxa.`;
            nextStatus = 'SENT_3D';
            nextReminderDays = null; // terminal
        } else {
            // Event passed — mark completed
            await this.prisma.eventReminder.update({
                where: { id: reminder.id },
                data: { status: 'COMPLETED' },
            });
            return;
        }

        // Log the reminder (actual push/SMS delivery plugs in here)
        this.logger.log(`[EventReminder] Sending to ${reminder.user.email}: ${message}`);

        // Update reminder state
        await this.prisma.eventReminder.update({
            where: { id: reminder.id },
            data: {
                status: nextStatus,
                nextReminder: nextReminderDays
                    ? new Date(Date.now() + nextReminderDays * 86400000)
                    : new Date(Date.now() + 999 * 86400000), // far future if terminal
            },
        });
    }

    // ─── Create reminder after order converts ───
    async scheduleReminderForOrder(
        userId: string,
        eventName: string,
        eventType: string,
        eventDate: Date,
        sourceOrderId: string,
    ) {
        const daysUntil = Math.ceil((eventDate.getTime() - Date.now()) / 86400000);
        // Schedule next reminder at: event_date + 300 days (for next year)
        const nextYearEventDate = new Date(eventDate);
        nextYearEventDate.setFullYear(nextYearEventDate.getFullYear() + 1);
        const reminderDate = new Date(nextYearEventDate.getTime() - 30 * 86400000);

        await this.prisma.eventReminder.create({
            data: {
                userId,
                eventName,
                eventType,
                eventDate: nextYearEventDate,
                nextReminder: reminderDate,
                status: 'PENDING',
                sourceOrderId,
            },
        });

        this.logger.log(`[EventReminder] Scheduled recompra reminder for user ${userId} — ${eventName} next year`);
    }
}
