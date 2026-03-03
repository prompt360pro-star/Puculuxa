import { API_BASE_URL } from '@/config';

const BASE_URL = API_BASE_URL;

function getAuthHeaders(): Record<string, string> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
}

export interface PaginatedMeta {
    total: number;
    page: number;
    limit: number;
    lastPage: number;
}

export interface AwaitingProofPayment {
    id: string;
    orderId: string;
    amount: number;
    method: string;
    status: string;
    proofUrl: string | null;
    merchantRef: string | null;
    createdAt: string;
    customerName: string | null;
    invoiceNumber: string | null;
}

export interface OverdueCredit {
    id: string;
    debtorEntityName: string | null;
    debtorEntityNif: string | null;
    debtorProcessRef: string | null;
    creditDueDate: string;
    creditNotes: string | null;
    total: number;
    financialStatus: string;
    createdAt: string;
    invoices: { invoiceNumber: string }[];
}

export const reconciliationService = {
    // ─── A) Comprovativos Pendentes ───
    async getAwaitingProofPayments(page: number = 1, limit: number = 20): Promise<{ data: AwaitingProofPayment[], meta: PaginatedMeta }> {
        const response = await fetch(`${BASE_URL}/payments/admin/awaiting-proof?page=${page}&limit=${limit}`, {
            headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error('Erro ao buscar comprovativos');
        return response.json();
    },

    async validatePayment(paymentId: string, approved: boolean, reason?: string): Promise<any> {
        const response = await fetch(`${BASE_URL}/payments/${paymentId}/validate`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ approved, reason }),
        });
        if (!response.ok) throw new Error('Erro ao validar pagamento');
        return response.json();
    },

    // ─── B) Crédito Vencido ───
    async getOverdueCredits(page: number = 1, limit: number = 20): Promise<{ data: OverdueCredit[], meta: PaginatedMeta }> {
        const response = await fetch(`${BASE_URL}/credits/overdue?page=${page}&limit=${limit}`, {
            headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error('Erro ao buscar créditos em atraso');
        return response.json();
    },

    async markCreditPaid(orderId: string, reason: string): Promise<any> {
        const response = await fetch(`${BASE_URL}/credits/${orderId}/mark-paid`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ reason }),
        });
        if (!response.ok) throw new Error('Erro ao marcar crédito como pago');
        return response.json();
    },
};
