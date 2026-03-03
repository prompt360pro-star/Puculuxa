import { API_BASE_URL } from '@/config';

const BASE_URL = API_BASE_URL;

function getAuthHeaders(): Record<string, string> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
}

export interface FinanceKpis {
    cashReceivedThisMonth: number;
    cashReceivedTotal: number;
    receivablesOpen: number;
    receivablesOverdue: number;
    creditExposure: number;
    avgDaysToPay: string;
}

export interface FinanceBreakdown {
    byPaymentMode: Record<string, number>;
    byFinancialStatus: Record<string, number>;
    agingBuckets: Record<string, number>;
}

export interface AwaitingProofItem {
    paymentId: string;
    orderId: string;
    amount: number;
    proofUrl: string | null;
    customerName: string | null;
    createdAt: string;
}

export interface OverdueCreditItem {
    orderId: string;
    debtorEntityName: string | null;
    invoiceNumber: string | null;
    creditDueDate: string | null;
    total: number;
}

export interface RecentPayment {
    id: string;
    orderId: string;
    amount: number;
    method: string;
    status: string;
    createdAt: string;
}

export interface FinanceDashboardData {
    kpis: FinanceKpis;
    breakdown: FinanceBreakdown;
    actionItems: {
        awaitingProof: AwaitingProofItem[];
        overdueCredits: OverdueCreditItem[];
    };
    recent: {
        payments: RecentPayment[];
    };
}

export async function getFinanceData(): Promise<FinanceDashboardData> {
    const response = await fetch(`${BASE_URL}/analytics/finance`, {
        headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Erro ao carregar dados financeiros');
    return response.json() as Promise<FinanceDashboardData>;
}
