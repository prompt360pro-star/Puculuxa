/**
 * Quotation Status Guard — Puculuxa v3.1
 * 
 * Máquina de estados formal com:
 * - Tabela de transições válidas
 * - Idempotência (double-click safe)
 * - Auditoria automática via StatusAuditLog
 * - SLA automático no SUBMITTED
 */
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// ─── Status Enum (application layer, SQLite não suporta enum nativo) ───
export enum QuotationStatus {
    DRAFT = 'DRAFT',
    SUBMITTED = 'SUBMITTED',
    IN_REVIEW = 'IN_REVIEW',
    PROPOSAL_SENT = 'PROPOSAL_SENT',
    NEGOTIATING = 'NEGOTIATING',
    ACCEPTED = 'ACCEPTED',
    REJECTED = 'REJECTED',
    EXPIRED = 'EXPIRED',
    CONVERTED = 'CONVERTED',
}

export enum QuotationVersionStatus {
    PENDING = 'PENDING',
    ACCEPTED = 'ACCEPTED',
    SUPERSEDED = 'SUPERSEDED',
}

// ─── Transições Válidas ───
const VALID_TRANSITIONS: Record<QuotationStatus, QuotationStatus[]> = {
    [QuotationStatus.DRAFT]: [QuotationStatus.SUBMITTED],
    [QuotationStatus.SUBMITTED]: [QuotationStatus.IN_REVIEW, QuotationStatus.EXPIRED],
    [QuotationStatus.IN_REVIEW]: [QuotationStatus.PROPOSAL_SENT, QuotationStatus.REJECTED],
    [QuotationStatus.PROPOSAL_SENT]: [
        QuotationStatus.ACCEPTED,
        QuotationStatus.NEGOTIATING,
        QuotationStatus.REJECTED,
        QuotationStatus.EXPIRED,
    ],
    [QuotationStatus.NEGOTIATING]: [QuotationStatus.PROPOSAL_SENT, QuotationStatus.REJECTED],
    [QuotationStatus.ACCEPTED]: [QuotationStatus.CONVERTED],
    [QuotationStatus.REJECTED]: [],
    [QuotationStatus.EXPIRED]: [],
    [QuotationStatus.CONVERTED]: [],
};

// ─── SLA defaults (horas por tipo de evento) ───
const DEFAULT_SLA_HOURS: Record<string, number> = {
    casamento: 1,
    aniversario: 2,
    corporativo: 2,
    baptizado: 2,
    bodas: 2,
    baby_shower: 3,
    graduacao: 3,
    outro: 4,
};

@Injectable()
export class QuotationStatusGuard {
    constructor(private prisma: PrismaService) { }

    /**
     * Valida e executa transição de status com auditoria.
     * Idempotente: se já está no estado alvo, retorna sem modificar.
     */
    async transition(
        quotationId: string,
        targetStatus: QuotationStatus,
        changedBy: string,
        reason?: string,
    ) {
        const quotation = await this.prisma.quotation.findUnique({
            where: { id: quotationId },
        });

        if (!quotation) {
            throw new BadRequestException(`Orçamento ${quotationId} não encontrado.`);
        }

        const currentStatus = quotation.status as QuotationStatus;

        // Idempotência: já está no estado alvo
        if (currentStatus === targetStatus) {
            return quotation;
        }

        // Validar transição
        const allowed = VALID_TRANSITIONS[currentStatus] || [];
        if (!allowed.includes(targetStatus)) {
            throw new BadRequestException(
                `Transição inválida: ${currentStatus} → ${targetStatus}. ` +
                `Transições permitidas: ${allowed.join(', ') || 'nenhuma (estado terminal)'}.`,
            );
        }

        // Executar transição + audit log numa transação
        const [updated] = await this.prisma.$transaction([
            this.prisma.quotation.update({
                where: { id: quotationId },
                data: { status: targetStatus, updatedAt: new Date() },
            }),
            this.prisma.statusAuditLog.create({
                data: {
                    quotationId,
                    fromStatus: currentStatus,
                    toStatus: targetStatus,
                    changedBy,
                    reason,
                },
            }),
        ]);

        return updated;
    }

    /**
     * Calcula o slaDeadline com base no tipo de evento e horário comercial.
     * Timer só corre em horário comercial (08:00-20:00).
     */
    calculateSlaDeadline(eventType: string, createdAt: Date = new Date()): Date {
        const hours = DEFAULT_SLA_HOURS[eventType] || 2;
        const deadline = new Date(createdAt);

        let remainingHours = hours;
        while (remainingHours > 0) {
            deadline.setHours(deadline.getHours() + 1);
            const hour = deadline.getHours();
            // Só conta horas dentro do horário comercial (8-20)
            if (hour >= 8 && hour < 20) {
                remainingHours--;
            }
        }

        return deadline;
    }

    /**
     * Verifica transições válidas a partir do estado actual.
     */
    getValidTransitions(currentStatus: QuotationStatus): QuotationStatus[] {
        return VALID_TRANSITIONS[currentStatus] || [];
    }

    /**
     * Verifica se o status é terminal (sem transições possíveis).
     */
    isTerminal(status: QuotationStatus): boolean {
        return (VALID_TRANSITIONS[status] || []).length === 0;
    }
}
