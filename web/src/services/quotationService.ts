import { AuthWebService } from './authService';
import { API_BASE_URL } from '@/config';

const BASE_URL = API_BASE_URL;

const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${AuthWebService.getToken()}`
});

// ─── Types ───
export interface QuotationVersion {
    id: string;
    version: number;
    price: number;
    response: string | null;
    changedBy: string;
    changes: string | null;
    status: string;
    createdAt: string;
}

export interface QuotationComplement {
    id: string;
    name: string;
    type: string;
    unitPrice: number;
    quantity: number;
    subtotal: number;
}

export interface QuotationItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    productId: string | null;
}

export interface AuditEntry {
    id: string;
    fromStatus: string;
    toStatus: string;
    changedBy: string;
    reason: string | null;
    createdAt: string;
}

export interface AdminBrief {
    complexityScore: number;
    clientProfile: {
        totalOrders: number;
        totalSpent: number;
        tier: string;
        preferredEventType: string | null;
        isRecurring: boolean;
    };
    feasibility: {
        isPossible: boolean;
        daysUntilEvent: number;
        currentLoad: number;
        isUrgent: boolean;
    };
    suggestedProducts: { id: string; name: string; price: number | null; popularityScore: number }[];
    estimatedPrice: string;
    summary: string;
}

export interface Quotation {
    id: string;
    eventType: string;
    guestCount: number;
    eventDate: string | null;
    description: string | null;
    referenceImage: string | null;
    complexityScore: number | null;
    source: string;
    status: string;
    estimatedTotal: number;
    slaDeadline: string | null;
    escalatedAt: string | null;
    convertedOrderId: string | null;
    customerName: string | null;
    customerPhone: string | null;
    notes: string | null;
    rejectionReason: string | null;
    createdAt: string;
    updatedAt: string;
    versions?: QuotationVersion[];
    complements?: QuotationComplement[];
    items?: QuotationItem[];
    auditLog?: AuditEntry[];
    customer?: { id: string; name: string; email: string; phone: string } | null;
}

export interface PaginatedResponse<T> {
    data: T[];
    meta: { total: number; page: number; limit: number; lastPage: number };
}

// ─── Service ───
export const QuotationWebService = {
    async getAll(page = 1, limit = 20, status?: string): Promise<PaginatedResponse<Quotation>> {
        try {
            let url = `${BASE_URL}/quotations?page=${page}&limit=${limit}`;
            if (status && status !== 'all') url += `&status=${status}`;
            const response = await fetch(url, { headers: getHeaders() });
            if (!response.ok) throw new Error('Failed to fetch quotations');
            return await response.json();
        } catch (error) {
            console.error('Error fetching quotations:', error);
            return { data: [], meta: { total: 0, page: 1, limit: 20, lastPage: 1 } };
        }
    },

    async getOne(id: string): Promise<Quotation | null> {
        try {
            const response = await fetch(`${BASE_URL}/quotations/${id}`, { headers: getHeaders() });
            if (!response.ok) throw new Error('Failed to fetch quotation');
            return await response.json();
        } catch (error) {
            console.error('Error fetching quotation:', error);
            return null;
        }
    },

    async getBrief(id: string): Promise<AdminBrief | null> {
        try {
            const response = await fetch(`${BASE_URL}/quotations/${id}/brief`, { headers: getHeaders() });
            if (!response.ok) throw new Error('Failed to fetch brief');
            return await response.json();
        } catch (error) {
            console.error('Error fetching brief:', error);
            return null;
        }
    },

    async updateStatus(id: string, status: string, reason?: string) {
        const response = await fetch(`${BASE_URL}/quotations/${id}/status`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify({ status, reason }),
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.message || 'Failed to update status');
        }
        return await response.json();
    },

    async sendProposal(id: string, price: number, response?: string, changes?: string) {
        const res = await fetch(`${BASE_URL}/quotations/${id}/proposal`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ price, response, changes }),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || 'Failed to send proposal');
        }
        return await res.json();
    },

    async convertToOrder(id: string) {
        const res = await fetch(`${BASE_URL}/quotations/${id}/convert`, {
            method: 'POST',
            headers: getHeaders(),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || 'Failed to convert to order');
        }
        return await res.json();
    },

    getPdfUrl(id: string) {
        return `${BASE_URL}/quotations/${id}/pdf`;
    }
};
