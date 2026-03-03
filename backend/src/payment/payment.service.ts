import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AppyPayProvider } from './providers/appypay.provider';

@Injectable()
export class PaymentService {
    private readonly logger = new Logger(PaymentService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly appyPay: AppyPayProvider,
    ) { }

    // ─── Gerar merchantRef único ───
    private generateMerchantRef(): string {
        const ts = Date.now();
        const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `PUC-${ts}-${rand}`;
    }

    // ─── Gerar idempotency key ───
    private generateIdempotencyKey(orderId: string, amount: number, method: string): string {
        return crypto
            .createHash('sha256')
            .update(`${orderId}:${amount}:${method}`)
            .digest('hex');
    }

    // ─── Calcular financialStatus baseado nos pagamentos bem-sucedidos ───
    private async recalculateFinancialStatus(orderId: string): Promise<void> {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { payments: true },
        });

        if (!order) return;

        const totalPaid = order.payments
            .filter((p) => p.status === 'SUCCESS')
            .reduce((sum, p) => sum + p.amount, 0);

        let financialStatus: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';
        if (totalPaid <= 0) {
            financialStatus = 'UNPAID';
        } else if (totalPaid >= order.total) {
            financialStatus = 'PAID';
        } else {
            financialStatus = 'PARTIALLY_PAID';
        }

        await this.prisma.order.update({
            where: { id: orderId },
            data: { financialStatus },
        });

        this.logger.log(`[Payment] Order ${orderId} financialStatus → ${financialStatus} (paid: ${totalPaid}/${order.total})`);
    }

    // ─── a) createPayment ───
    async createPayment(
        orderId: string,
        amount: number,
        method: string,
        metadata?: Record<string, any>,
    ) {
        const merchantRef = this.generateMerchantRef();
        const idempotencyKey = this.generateIdempotencyKey(orderId, amount, method);

        // Verificar idempotência: se já existe pagamento com esta key, retornar existente
        const existing = await this.prisma.payment.findUnique({
            where: { idempotencyKey },
        });
        if (existing) {
            this.logger.warn(`[Payment] Idempotent payment found for key ${idempotencyKey} — returning existing`);
            return existing;
        }

        const payment = await this.prisma.payment.create({
            data: {
                orderId,
                amount,
                method: method as any,
                status: 'PENDING',
                merchantRef,
                idempotencyKey,
                metadata: metadata ?? undefined,
            },
        });

        this.logger.log(`[Payment] Created payment ${payment.id} for order ${orderId} (${method}, ${amount} AOA)`);
        return payment;
    }

    // ─── b) initiateGpoPayment ───
    async initiateGpoPayment(orderId: string, phoneNumber: string) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { user: true },
        });

        if (!order) throw new NotFoundException(`Order ${orderId} não encontrada`);

        const payment = await this.createPayment(orderId, order.total, 'APPYPAY_GPO');

        let chargeResponse;
        try {
            chargeResponse = await this.appyPay.createGpoCharge({
                amount: order.total,
                merchantTransactionId: payment.merchantRef!,
                description: `Pagamento Puculuxa — Encomenda #${orderId.slice(-8).toUpperCase()}`,
                phoneNumber,
                customerName: order.user?.name || 'Cliente Puculuxa',
            });

            // Atualizar payment com o providerRef retornado pelo AppyPay
            await this.prisma.payment.update({
                where: { id: payment.id },
                data: { providerRef: chargeResponse.id },
            });

            // Atualizar Order.paymentMode
            await this.prisma.order.update({
                where: { id: orderId },
                data: { paymentMode: 'APPYPAY_GPO' },
            });
        } catch (error: any) {
            this.logger.error(`[Payment] GPO charge failed for order ${orderId}: ${error.message}`);
            await this.failPayment(payment.id, error.message);
            throw error;
        }

        return { payment, chargeResponse };
    }

    // ─── c) confirmPayment ───
    async confirmPayment(paymentId: string, providerRef?: string) {
        const payment = await this.prisma.payment.findUnique({
            where: { id: paymentId },
        });

        if (!payment) throw new NotFoundException(`Payment ${paymentId} não encontrado`);

        const updated = await this.prisma.payment.update({
            where: { id: paymentId },
            data: {
                status: 'SUCCESS',
                ...(providerRef ? { providerRef } : {}),
            },
        });

        // Recalcular financialStatus da order
        await this.recalculateFinancialStatus(payment.orderId);

        this.logger.log(`[Payment] Payment ${paymentId} confirmed — order ${payment.orderId}`);
        return updated;
    }

    // ─── d) failPayment ───
    async failPayment(paymentId: string, reason?: string) {
        await this.prisma.payment.update({
            where: { id: paymentId },
            data: { status: 'FAILED' },
        });

        this.logger.warn(`[Payment] Payment ${paymentId} FAILED${reason ? ': ' + reason : ''}`);
    }

    // ─── f) findByProviderRefOrMerchantRef (used by webhook) ───
    async findByProviderRefOrMerchantRef(providerRef: string, merchantRef: string) {
        return this.prisma.payment.findFirst({
            where: {
                OR: [
                    { providerRef },
                    { merchantRef },
                ],
            },
        });
    }

    // ─── e) getPaymentsByOrder ───
    async getPaymentsByOrder(orderId: string) {
        return this.prisma.payment.findMany({
            where: { orderId },
            orderBy: { createdAt: 'asc' },
        });
    }

    // ─── g) createBankTransferPayment ───
    async createBankTransferPayment(orderId: string, amount: number) {
        const ts = Date.now();
        const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
        const merchantRef = `PUC-BT-${ts}-${rand}`;

        // Bank transfer payments get their own idempotency key (BT specific)
        const idempotencyKey = crypto
            .createHash('sha256')
            .update(`${orderId}:${amount}:BANK_TRANSFER:${ts}`)
            .digest('hex');

        const payment = await this.prisma.payment.create({
            data: {
                orderId,
                amount,
                method: 'BANK_TRANSFER' as any,
                status: 'AWAITING_PROOF' as any,
                merchantRef,
                idempotencyKey,
            },
        });

        this.logger.log(`[Payment] Bank transfer payment ${payment.id} created for order ${orderId}`);
        return payment;
    }
}
