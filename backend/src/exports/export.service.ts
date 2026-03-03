import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExportService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Helper: formatKz(number)
     * Formata 1200.5 para "1200.50" (ou como a contabilidade preferir, s/ símbolo).
     */
    formatKz(value: number): string {
        if (value === null || value === undefined) return '0.00';
        return Number(value).toFixed(2);
    }

    /**
     * Helper: formatDateISO
     */
    formatDateISO(date: Date | string | null): string {
        if (!date) return '';
        const d = new Date(date);
        return isNaN(d.getTime()) ? '' : d.toISOString();
    }

    /**
     * Helper: sanitizeText
     * Evita quebra de linha ou aspas inviabilizem o CSV.
     */
    sanitizeText(text: any): string {
        if (text === null || text === undefined) return '';
        const str = String(text);
        // Se tiver vírgula, aspa dupla ou quebra de linha, envolve com aspas e escapa as aspas.
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    }

    /**
     * Helper: toCsv
     * Gera o conteúdo final do CSV.
     */
    toCsv(rows: Record<string, any>[], headers: string[]): string {
        if (!rows || rows.length === 0) {
            return headers.join(',') + '\n';
        }

        const csvLines = [];
        // Header
        csvLines.push(headers.join(','));

        // Linhas
        for (const row of rows) {
            const line = headers.map((h) => this.sanitizeText(row[h])).join(',');
            csvLines.push(line);
        }

        return csvLines.join('\n');
    }

    /**
     * Validação de Data Range (Máximo 180 dias)
     */
    validateDateRange(from: string, to: string, maxDays = 180): { fromDate: Date; toDate: Date } {
        if (!from || !to) {
            throw new BadRequestException('Os parâmetros "from" e "to" são obrigatórios.');
        }

        const fromDate = new Date(from);
        const toDate = new Date(to);

        if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
            throw new BadRequestException('Formato de data inválido. Use YYYY-MM-DD.');
        }

        if (fromDate > toDate) {
            throw new BadRequestException('A data "from" não pode ser maior que "to".');
        }

        const diffMs = toDate.getTime() - fromDate.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays > maxDays) {
            throw new BadRequestException(`O intervalo máximo permitido é de ${maxDays} dias.`);
        }

        return { fromDate, toDate };
    }

    // ---------------------------------------------------------
    // Métodos de Exportação
    // ---------------------------------------------------------

    /**
     * A) Payments Ledger
     */
    async exportPayments(from: string, to: string, status?: any, method?: any): Promise<string> {
        const { fromDate, toDate } = this.validateDateRange(from, to);

        // Assegura que toDate cubra o dia inteiro
        const endOfDay = new Date(toDate);
        endOfDay.setHours(23, 59, 59, 999);

        const where: any = {
            createdAt: { gte: fromDate, lte: endOfDay },
        };
        if (status) where.status = status;
        if (method) where.method = method;

        const payments = await this.prisma.payment.findMany({
            where,
            include: {
                order: {
                    select: {
                        id: true,
                        total: true,
                        financialStatus: true,
                        paymentMode: true,
                        createdAt: true,
                    },
                },
            },
            orderBy: { createdAt: 'asc' },
        });

        const headers = [
            'paymentId',
            'createdAt',
            'status',
            'method',
            'amount',
            'currency',
            'merchantRef',
            'providerRef',
            'orderId',
            'orderTotal',
            'orderFinancialStatus',
            'orderPaymentMode',
        ];

        const rows = payments.map((p) => ({
            paymentId: p.id,
            createdAt: this.formatDateISO(p.createdAt),
            status: p.status,
            method: p.method,
            amount: this.formatKz(p.amount),
            currency: 'AOA', // default Puculuxa
            merchantRef: p.merchantRef,
            providerRef: p.providerRef,
            orderId: p.orderId,
            orderTotal: p.order ? this.formatKz(p.order.total) : '',
            orderFinancialStatus: p.order?.financialStatus || '',
            orderPaymentMode: p.order?.paymentMode || '',
        }));

        return this.toCsv(rows, headers);
    }

    /**
     * B) Invoices Ledger
     */
    async exportInvoices(from: string, to: string, prefix?: string): Promise<string> {
        const { fromDate, toDate } = this.validateDateRange(from, to);
        const endOfDay = new Date(toDate);
        endOfDay.setHours(23, 59, 59, 999);

        const where: any = {
            issuedAt: { gte: fromDate, lte: endOfDay },
        };
        if (prefix) where.prefix = prefix;

        const invoices = await this.prisma.invoice.findMany({
            where,
            orderBy: { issuedAt: 'asc' },
        });

        const headers = [
            'invoiceId',
            'invoiceNumber',
            'prefix',
            'year',
            'sequenceNumber',
            'issuedAt',
            'dueDate',
            'isGovernment',
            'orderId',
            'totalAmount',
        ];

        const rows = invoices.map((i) => ({
            invoiceId: i.id,
            invoiceNumber: i.invoiceNumber,
            prefix: i.prefix,
            year: i.year,
            sequenceNumber: i.sequenceNumber,
            issuedAt: this.formatDateISO(i.issuedAt),
            dueDate: this.formatDateISO(i.dueDate),
            isGovernment: i.isGovernment ? 'YES' : 'NO',
            orderId: i.orderId,
            totalAmount: this.formatKz(i.totalAmount),
        }));

        return this.toCsv(rows, headers);
    }

    /**
     * C) Payouts Ledger
     */
    async exportPayouts(from: string, to: string, status?: any): Promise<string> {
        const { fromDate, toDate } = this.validateDateRange(from, to);
        const endOfDay = new Date(toDate);
        endOfDay.setHours(23, 59, 59, 999);

        const where: any = {
            // Usa valueDate preferencialmente para reporting de fecho de caixa,
            // fallback para createdAt se o user quiser filtrar por data de criação.
            // Assumiremos createdAt simplificado aqui para apanhar os drafts
            createdAt: { gte: fromDate, lte: endOfDay },
        };
        if (status) where.status = status;

        const payouts = await this.prisma.payout.findMany({
            where,
            include: {
                _count: {
                    select: { items: true },
                },
            },
            orderBy: { createdAt: 'asc' },
        });

        const headers = [
            'payoutId',
            'provider',
            'status',
            'source',
            'providerPayoutRef',
            'periodStart',
            'periodEnd',
            'grossAmount',
            'feeAmount',
            'netAmount',
            'bankName',
            'bankIban',
            'bankReference',
            'valueDate',
            'createdAt',
            'itemsCount',
        ];

        const rows = payouts.map((p: any) => ({
            payoutId: p.id,
            provider: p.provider,
            status: p.status,
            source: p.source,
            providerPayoutRef: p.providerPayoutRef,
            periodStart: this.formatDateISO(p.periodStart),
            periodEnd: this.formatDateISO(p.periodEnd),
            grossAmount: this.formatKz(p.grossAmount),
            feeAmount: this.formatKz(p.feeAmount),
            netAmount: this.formatKz(p.netAmount),
            bankName: p.bankName,
            bankIban: p.bankIban,
            bankReference: p.bankReference,
            valueDate: this.formatDateISO(p.valueDate),
            createdAt: this.formatDateISO(p.createdAt),
            itemsCount: (p as any)._count?.items || 0,
        }));

        return this.toCsv(rows, headers);
    }

    /**
     * D) Payout Items (Auditoria de um settlement específico)
     */
    async exportPayoutItems(payoutId: string): Promise<string> {
        if (!payoutId) throw new BadRequestException('payoutId é obrigatório.');

        const items = await this.prisma.payoutItem.findMany({
            where: { payoutId },
            include: {
                payment: true,
            },
            orderBy: { createdAt: 'asc' },
        });

        const headers = [
            'payoutId',
            'paymentId',
            'paymentCreatedAt',
            'paymentMethod',
            'merchantRef',
            'providerRef',
            'amount',
        ];

        const rows = items.map((i: any) => ({
            payoutId: i.payoutId,
            paymentId: i.paymentId,
            paymentCreatedAt: this.formatDateISO(i.payment?.createdAt),
            paymentMethod: i.payment?.method || '',
            merchantRef: i.payment?.merchantRef || '',
            providerRef: i.payment?.providerRef || '',
            amount: this.formatKz(i.amount),
        }));

        return this.toCsv(rows, headers);
    }
}
