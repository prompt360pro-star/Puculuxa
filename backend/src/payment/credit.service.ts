import {
    Injectable,
    Logger,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { InvoiceService } from './invoice.service';
import { PaymentService } from './payment.service';

export interface ApproveCreditDto {
    creditDueDate: Date;
    debtorEntityName?: string;
    debtorEntityNif?: string;
    debtorProcessRef?: string;
    creditNotes?: string;
}

@Injectable()
export class CreditService {
    private readonly logger = new Logger(CreditService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly invoiceService: InvoiceService
    ) { }

    // ─── a) Mark order as IN_CREDIT ───
    async markOrderAsCredit(orderId: string, adminId: string, dto: ApproveCreditDto) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
        });

        if (!order) throw new NotFoundException(`Order ${orderId} não encontrada`);

        if (order.financialStatus === 'PAID') {
            throw new BadRequestException('Este pedido já está completamente pago — não pode ser marcado a crédito');
        }

        if (order.financialStatus === 'IN_CREDIT' || order.financialStatus === 'OVERDUE') {
            throw new BadRequestException(`Order já está em ${order.financialStatus}`);
        }

        const updatedOrder = await this.prisma.order.update({
            where: { id: orderId },
            data: {
                paymentMode: 'GOVERNMENT_CREDIT',
                financialStatus: 'IN_CREDIT',
                creditApprovedAt: new Date(),
                creditApprovedById: adminId,
                creditDueDate: new Date(dto.creditDueDate),
                ...(dto.debtorEntityName ? { debtorEntityName: dto.debtorEntityName } : {}),
                ...(dto.debtorEntityNif ? { debtorEntityNif: dto.debtorEntityNif } : {}),
                ...(dto.debtorProcessRef ? { debtorProcessRef: dto.debtorProcessRef } : {}),
                ...(dto.creditNotes ? { creditNotes: dto.creditNotes } : {}),
            },
        });

        // Generate NE invoice for institutional credit (idempotent)
        const invoice = await this.invoiceService.createInvoice(orderId, false, new Date(dto.creditDueDate), 'NE');

        this.logger.log(
            `[Credit] Order ${orderId} → IN_CREDIT — Entity: ${dto.debtorEntityName}, Due: ${dto.creditDueDate}, Invoice: ${invoice.invoiceNumber}`,
        );

        return { order: updatedOrder, invoice };
    }

    // ─── b) Mark credit as PAID (creates accounting record) ───
    async markCreditAsPaid(orderId: string, adminId: string, reason?: string) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
        });

        if (!order) throw new NotFoundException(`Order ${orderId} não encontrada`);

        if (!['IN_CREDIT', 'OVERDUE'].includes(order.financialStatus)) {
            throw new BadRequestException(`Order não está em crédito (status actual: ${order.financialStatus})`);
        }

        // Create accounting Payment record (no gateway, manual confirmation)
        const payment = await this.prisma.payment.create({
            data: {
                orderId,
                amount: order.total,
                method: 'GOVERNMENT_CREDIT',
                status: 'SUCCESS',
                merchantRef: `PUC-GOV-${Date.now()}`,
                metadata: {
                    confirmedBy: adminId,
                    reason: reason ?? 'Liquidação manual por admin',
                    confirmedAt: new Date().toISOString(),
                },
            },
        });

        // Update order to PAID
        const updatedOrder = await this.prisma.order.update({
            where: { id: orderId },
            data: { financialStatus: 'PAID' },
        });

        this.logger.log(`[Credit] Order ${orderId} credit liquidated — payment: ${payment.id}`);
        return updatedOrder;
    }

    // ─── c) Cron: detect OVERDUE orders daily at 07:30 ───
    @Cron('30 7 * * *')
    async refreshOverdueStatuses(): Promise<number> {
        try {
            const now = new Date();

            const result = await this.prisma.order.updateMany({
                where: {
                    financialStatus: 'IN_CREDIT',
                    creditDueDate: { lt: now },
                },
                data: { financialStatus: 'OVERDUE' },
            });

            if (result.count > 0) {
                this.logger.warn(`[Credit] OVERDUE scan: ${result.count} order(s) marked OVERDUE`);
            } else {
                this.logger.log('[Credit] OVERDUE scan: no new overdues today');
            }

            return result.count;
        } catch (error: any) {
            this.logger.error(
                `[Cron] CreditService.refreshOverdueStatuses failed: ${error?.message}`,
                error?.stack,
            );
            return 0;
        }
    }

    // ─── d) Get overdue orders (for admin list, paginated) ───
    async getOverdueOrders(page: number = 1, limit: number = 20) {
        const skip = (page - 1) * limit;

        const [total, data] = await Promise.all([
            this.prisma.order.count({ where: { financialStatus: 'OVERDUE' } }),
            this.prisma.order.findMany({
                where: { financialStatus: 'OVERDUE' },
                orderBy: { creditDueDate: 'asc' },
                skip,
                take: limit,
                select: {
                    id: true,
                    debtorEntityName: true,
                    debtorEntityNif: true,
                    debtorProcessRef: true,
                    creditDueDate: true,
                    creditNotes: true,
                    total: true,
                    financialStatus: true,
                    createdAt: true,
                    invoices: { select: { invoiceNumber: true } },
                },
            }),
        ]);

        return {
            data,
            meta: {
                total,
                page,
                limit,
                lastPage: Math.max(1, Math.ceil(total / limit)),
            },
        };
    }
}
