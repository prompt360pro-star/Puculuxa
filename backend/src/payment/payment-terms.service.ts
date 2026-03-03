import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaClient, PaymentStatus } from '@prisma/client';

export class OverrideTermsDto {
    segment?: any;
    depositPercent?: number;
    depositDueDays?: number;
    balanceDueDays?: number;
}

@Injectable()
export class PaymentTermsService {
    private readonly logger = new Logger(PaymentTermsService.name);

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Resolve a configuração baseada no Segmento e EventType.
     * Ordem de fallback:
     * 1) segment + eventType (se existir configurado)
     * 2) segment + null (default do segmento)
     * 3) Erro se não existir fallback (na prática, Seed deve garantir).
     */
    async resolveConfig(segment: any, eventType?: string | null) {
        if (eventType) {
            const specific = await (this.prisma as any).paymentTermsConfig.findUnique({
                where: {
                    segment_eventType: {
                        segment,
                        eventType,
                    },
                },
            });
            if (specific) return specific;
        }

        const defaultConfig = await (this.prisma as any).paymentTermsConfig.findUnique({
            where: {
                segment_eventType: {
                    segment,
                    eventType: null, // Hack literal no prisma, 'null' string-level omit ou unique index mapping
                },
            },
        });

        // Como o Prisma unique usa null nos indíces condicionalmente de acordo com a base de dados
        if (!defaultConfig) {
            // Fallback manual query
            const backups = await (this.prisma as any).paymentTermsConfig.findMany({
                where: { segment, eventType: null }
            });
            if (backups.length > 0) return backups[0];

            throw new NotFoundException(`Nenhuma configuração de termos de pagamento encontrada para o segmento: ${segment}`);
        }

        return defaultConfig;
    }

    /**
     * Aplica o snapshot financeiro num Order.
     */
    async applyTermsToOrder(orderId: string, adminId?: string, override?: OverrideTermsDto) {
        const order = await this.prisma.order.findUnique({ where: { id: orderId } });
        if (!order) throw new NotFoundException(`Order ${orderId} não encontrado`);

        const segment = override?.segment ?? (order as any).clientSegment;
        const config = await this.resolveConfig(segment, (order as any).eventType);

        const depositPercentApplied = override?.depositPercent ?? config.depositPercent;
        let depositDueDays = override?.depositDueDays ?? config.depositDueDays;
        let balanceDueDays = override?.balanceDueDays ?? config.balanceDueDays;

        // Regras de Governo: Sinal sempre 0, vai directo para Crédito
        if (segment === 'GOVERNMENT') {
            depositDueDays = 0;
            balanceDueDays = 0;
        }

        const now = new Date();
        const depositAmount = parseFloat(((order.total * depositPercentApplied) / 100).toFixed(2));

        const depositDueDate = new Date(now);
        depositDueDate.setDate(depositDueDate.getDate() + depositDueDays);

        const balanceDueDate = new Date(now);
        balanceDueDate.setDate(balanceDueDate.getDate() + balanceDueDays);

        let creditDueDate = (order as any).creditDueDate;
        // Se Governo, auto-sugerir data de crédito (padrão Angolano 60~90 dias)
        if (segment === 'GOVERNMENT' && !creditDueDate) {
            creditDueDate = new Date(now);
            creditDueDate.setDate(creditDueDate.getDate() + config.creditDueDays);
        }

        const updated = await this.prisma.order.update({
            where: { id: orderId },
            data: {
                clientSegment: segment,
                depositPercentApplied: segment === 'GOVERNMENT' ? 0 : depositPercentApplied,
                depositAmount: segment === 'GOVERNMENT' ? 0 : depositAmount,
                depositDueDate: segment === 'GOVERNMENT' ? null : depositDueDate,
                balanceDueDate: segment === 'GOVERNMENT' ? null : balanceDueDate,
                creditDueDate: creditDueDate,
                termsAppliedAt: now,
                termsAppliedById: adminId || 'SYSTEM',
            } as any,
        });

        this.logger.log(`Termos de Pagamento aplicados para a Order ${orderId} - Segmento: ${segment}`);
        return updated;
    }

    /**
     * Extrato Dinâmico da Order (Para View UI Mobile e Finance).
     */
    async getOrderPaymentSummary(orderId: string) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { payments: true }
        }) as any;

        if (!order) throw new NotFoundException('Order não encontrado');

        // 1) Descobre quanto já foi pago 
        const totalPaid = order.payments
            .filter((p: any) => p.status === 'SUCCESS')
            .reduce((sum: number, p: any) => sum + p.amount, 0);

        const remainingTotal = Math.max(order.total - totalPaid, 0);
        const depositRequired = (order as any).depositAmount ?? 0;

        // 2) Distribui dinheiro recebido
        const depositPaid = Math.min(totalPaid, depositRequired);
        const depositRemaining = Math.max(depositRequired - depositPaid, 0);

        // Saldo restante vs dinheiro (depois do sinal preenchido)
        const balanceRemaining = Math.max(order.total - Math.max(totalPaid, depositRequired), 0);
        const isDepositSatisfied = totalPaid >= depositRequired;

        // 3) Regras de Atraso (Aging)
        const now = new Date();
        let isOverdueDeposit = false;
        if ((order as any).depositDueDate && now > (order as any).depositDueDate && depositRemaining > 0) {
            isOverdueDeposit = true;
        }

        let isOverdueBalance = false;
        if ((order as any).balanceDueDate && now > (order as any).balanceDueDate && balanceRemaining > 0) {
            isOverdueBalance = true;
        }

        return {
            orderId: order.id,
            total: order.total,
            totalPaid,
            remainingTotal,
            deposit: {
                required: depositRequired,
                paid: depositPaid,
                remaining: depositRemaining,
                dueDate: (order as any).depositDueDate,
                isSatisfied: isDepositSatisfied,
                isOverdue: isOverdueDeposit,
            },
            balance: {
                remaining: balanceRemaining,
                dueDate: (order as any).balanceDueDate,
                isOverdue: isOverdueBalance,
            },
            segment: (order as any).clientSegment,
            termsAppliedAt: (order as any).termsAppliedAt,
        };
    }
}
