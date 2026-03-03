import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InvoiceService {
    private readonly logger = new Logger(InvoiceService.name);

    constructor(private readonly prisma: PrismaService) { }

    // ─── Format invoice number from config ───
    private formatNumber(prefix: string, year: number, seq: number, padding: number, format: string): string {
        const paddedSeq = String(seq).padStart(padding, '0');
        return format
            .replace('{prefix}', prefix)
            .replace('{year}', String(year))
            .replace('{number}', paddedSeq);
    }

    // ─── Preview next number WITHOUT incrementing ───
    async previewNextNumber(prefix = 'PF', year?: number): Promise<string> {
        const currentYear = year ?? new Date().getFullYear();

        const config = await this.prisma.invoiceConfig.findUnique({
            where: { prefix_year: { prefix, year: currentYear } },
        });

        // Use config values if available, otherwise defaults
        const nextNumber = config?.nextNumber ?? 1;
        const padding = config?.padding ?? 5;
        const format = config?.format ?? '{prefix} {year}/{number}';

        return this.formatNumber(prefix, currentYear, nextNumber, padding, format);
    }

    // ─── Atomic reserve: increment nextNumber inside a transaction ───
    private async reserveNextNumber(prefix = 'PF', year?: number) {
        const currentYear = year ?? new Date().getFullYear();

        return this.prisma.$transaction(async (tx) => {
            // Upsert: create config if it doesn't exist yet
            const config = await tx.invoiceConfig.upsert({
                where: { prefix_year: { prefix, year: currentYear } },
                create: {
                    prefix,
                    year: currentYear,
                    nextNumber: 1,
                    padding: 5,
                    format: '{prefix} {year}/{number}',
                },
                update: {},
            });

            // Atomic increment
            const updated = await tx.invoiceConfig.update({
                where: { id: config.id },
                data: { nextNumber: { increment: 1 } },
                select: { prefix: true, year: true, nextNumber: true, padding: true, format: true },
            });

            // nextNumber is now the NEXT after increment, so the one we just reserved is (nextNumber - 1)
            const usedSeq = updated.nextNumber - 1;
            const invoiceNumber = this.formatNumber(updated.prefix, updated.year, usedSeq, updated.padding, updated.format);

            return {
                invoiceNumber,
                prefix: updated.prefix,
                year: updated.year,
                sequenceNumber: usedSeq,
            };
        });
    }

    // ─── Create invoice (idempotent — returns existing if already generated) ───
    async createInvoice(
        orderId: string,
        isGovernment = false,
        dueDate?: Date,
        prefix?: string,
    ) {
        // Idempotência: retornar existente se já houver invoice para este order
        const existing = await this.getInvoiceByOrder(orderId);
        if (existing) {
            this.logger.log(`[Invoice] Returning existing invoice ${existing.invoiceNumber} for order ${orderId}`);
            return existing;
        }

        const order = await this.prisma.order.findUnique({ where: { id: orderId } });
        if (!order) throw new Error(`Order ${orderId} não encontrada para gerar invoice`);

        // Reserve next number atomically
        const reserved = await this.reserveNextNumber(prefix ?? 'PF');

        const invoice = await this.prisma.invoice.create({
            data: {
                orderId,
                invoiceNumber: reserved.invoiceNumber,
                prefix: reserved.prefix,
                year: reserved.year,
                sequenceNumber: reserved.sequenceNumber,
                totalAmount: order.total,
                isGovernment,
                ...(dueDate ? { dueDate } : {}),
            },
        });

        this.logger.log(`[Invoice] Created ${reserved.invoiceNumber} for order ${orderId} (seq: ${reserved.sequenceNumber}, gov: ${isGovernment})`);
        return invoice;
    }

    // ─── Get invoice by order ───
    async getInvoiceByOrder(orderId: string) {
        return this.prisma.invoice.findFirst({ where: { orderId } });
    }
}
