import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { PaymentMethod, PayoutStatus, PayoutProvider, PayoutSource } from '@prisma/client';

export class CreateDraftPayoutDto {
    from?: string; // ISO DateTime
    to?: string;   // ISO DateTime
    methods?: PaymentMethod[];
}

export class ReportProviderPayoutDto {
    providerPayoutRef?: string;
    feeAmount?: number;
    netAmount?: number;
    grossAmount?: number;
    periodStart?: string; // ISO
    periodEnd?: string;   // ISO
    notes?: string;
}

export class MarkPayoutAsPaidDto {
    bankReference!: string;
    valueDate!: string; // ISO
    statementUrl?: string;
    notes?: string;
}

const PUCULUXA_BANK_DETAILS = {
    bankName: "Banco BAI",
    bankIban: "AO06 0040 0000 0000 0000 0000 0", // Mock ou ENV
};

@Injectable()
export class PayoutService {
    private readonly logger = new Logger(PayoutService.name);

    constructor(private readonly prisma: PrismaService) { }

    /**
     * a) listPayouts(page, limit, status?)
     * Retorna paginado + totals
     */
    async listPayouts(page: number = 1, limit: number = 20, status?: PayoutStatus) {
        const skip = (page - 1) * limit;

        const whereClause = status ? { status } : {};

        const [items, total] = await Promise.all([
            this.prisma.payout.findMany({
                where: whereClause,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.payout.count({ where: whereClause }),
        ]);

        return {
            data: items,
            meta: {
                total,
                page,
                lastPage: Math.ceil(total / limit),
            },
        };
    }

    /**
     * b) getPayoutById(id)
     * Include items + payment summary
     */
    async getPayoutById(id: string) {
        const payout = await this.prisma.payout.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        payment: {
                            include: {
                                order: {
                                    select: {
                                        id: true,
                                        financialStatus: true,
                                        total: true,
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!payout) {
            throw new NotFoundException(`Payout ${id} not found`);
        }

        return payout;
    }

    /**
     * c) createDraftPayoutFromPayments(dto)
     */
    async createDraftPayoutFromPayments(dto: CreateDraftPayoutDto) {
        const {
            from,
            to,
            methods = ['APPYPAY_GPO', 'APPYPAY_REF'] as PaymentMethod[]
        } = dto;

        const whereClause: Prisma.PaymentWhereInput = {
            status: 'SUCCESS',
            method: { in: methods },
            payoutItem: {
                is: null // Payment without related PayoutItem
            }
        };

        if (from || to) {
            whereClause.createdAt = {};
            if (from) whereClause.createdAt.gte = new Date(from);
            if (to) whereClause.createdAt.lte = new Date(to);
        }

        return this.prisma.$transaction(async (tx) => {
            // Find eligible payments
            const eligiblePayments = await tx.payment.findMany({
                where: whereClause,
            });

            if (eligiblePayments.length === 0) {
                throw new BadRequestException('No eligible un-settled payments found for the specified criteria.');
            }

            // Calculate totals
            const grossAmount = eligiblePayments.reduce((acc, p) => acc + p.amount, 0);

            // Create Payout (DRAFT)
            const payout = await tx.payout.create({
                data: {
                    provider: PayoutProvider.APPYPAY,
                    source: PayoutSource.MANUAL,
                    status: PayoutStatus.DRAFT,
                    grossAmount,
                    items: {
                        create: eligiblePayments.map((p) => ({
                            paymentId: p.id,
                            amount: p.amount,
                        })),
                    },
                },
            });

            this.logger.log(`Created Payout DRAFT ${payout.id} with ${eligiblePayments.length} payments. Gross: ${grossAmount}`);
            return payout;
        });
    }

    /**
     * d) reportProviderPayout(payoutId, dto)
     */
    async reportProviderPayout(payoutId: string, dto: ReportProviderPayoutDto) {
        const payout = await this.getPayoutById(payoutId);

        if (payout.status === 'PAID') {
            throw new BadRequestException('Cannot report values for a Payout that is already PAID.');
        }

        // Default current sums
        const grossAmount = dto.grossAmount ?? payout.grossAmount;
        const feeAmount = dto.feeAmount ?? payout.feeAmount;
        const netAmount = dto.netAmount ?? payout.netAmount;

        // Check discrepancy
        let newStatus: PayoutStatus = PayoutStatus.REPORTED;
        if (grossAmount > 0 && netAmount > 0 && feeAmount > 0) {
            // Tolerate ~1.0 AOA float precision issues
            const calculatedNet = grossAmount - feeAmount;
            if (Math.abs(calculatedNet - netAmount) > 1.0) {
                newStatus = PayoutStatus.DISCREPANCY;
                this.logger.warn(`Discrepancy detected in Payout ${payoutId}: (Gross=${grossAmount} - Fee=${feeAmount}) != Net=${netAmount}`);
            }
        }

        const updated = await this.prisma.payout.update({
            where: { id: payoutId },
            data: {
                status: newStatus,
                providerPayoutRef: dto.providerPayoutRef ?? payout.providerPayoutRef,
                feeAmount,
                netAmount,
                grossAmount,
                periodStart: dto.periodStart ? new Date(dto.periodStart) : null,
                periodEnd: dto.periodEnd ? new Date(dto.periodEnd) : null,
                notes: dto.notes ?? payout.notes,
            },
        });

        return updated;
    }

    /**
     * e) markPayoutAsPaid(payoutId, dto)
     */
    async markPayoutAsPaid(payoutId: string, dto: MarkPayoutAsPaidDto) {
        const payout = await this.getPayoutById(payoutId);

        // Keep DISCREPANCY visible if it was flagged, otherwise PAID
        const status = payout.status === 'DISCREPANCY' ? PayoutStatus.DISCREPANCY : PayoutStatus.PAID;

        const updated = await this.prisma.payout.update({
            where: { id: payoutId },
            data: {
                status,
                bankName: PUCULUXA_BANK_DETAILS.bankName,
                bankIban: PUCULUXA_BANK_DETAILS.bankIban,
                bankReference: dto.bankReference,
                valueDate: new Date(dto.valueDate),
                statementUrl: dto.statementUrl ?? payout.statementUrl,
                notes: dto.notes ?? payout.notes,
            },
        });

        this.logger.log(`Payout ${payoutId} marked as PAID in bank.`);
        return updated;
    }

    /**
     * f) computeUnsettledTotals()
     */
    async computeUnsettledTotals() {
        const unsettledPayments = await this.prisma.payment.findMany({
            where: {
                status: 'SUCCESS',
                method: { in: ['APPYPAY_GPO', 'APPYPAY_REF'] },
                payoutItem: {
                    is: null
                }
            },
            select: {
                amount: true
            }
        });

        const unsettledCount = unsettledPayments.length;
        const unsettledGross = unsettledPayments.reduce((acc, p) => acc + p.amount, 0);

        return {
            unsettledCount,
            unsettledGross,
        };
    }
}
