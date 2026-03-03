import { API_BASE_URL } from '@/config';

const BASE = API_BASE_URL;

function authHeaders(): Record<string, string> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
}

export interface WhatsAppLog {
    id: string;
    orderId?: string;
    templateName: string;
    recipientPhone: string;
    status: 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED' | 'SKIPPED';
    waMessageId?: string;
    sentAt?: string;
    deliveredAt?: string;
    readAt?: string;
    errorMessage?: string;
    createdAt: string;
}

export interface SendWhatsAppPayload {
    phone: string;
    templateName: string;
    variables?: (string | number)[];
    languageCode?: string;
}

export interface SendWhatsAppResult {
    ok: boolean;
    skipped?: boolean;
    logId?: string;
    waMessageId?: string;
}

export interface PaginatedWhatsAppLogs {
    data: WhatsAppLog[];
    meta: { total: number; page: number; limit: number };
}

/**
 * Send a WhatsApp template via the admin endpoint.
 */
export async function sendWhatsAppTemplate(
    orderId: string,
    payload: SendWhatsAppPayload,
): Promise<SendWhatsAppResult> {
    const res = await fetch(`${BASE}/whatsapp/admin/send/${orderId}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`WhatsApp send failed: ${res.statusText}`);
    return res.json();
}

/**
 * Get WhatsApp send history for a specific order (admin only).
 */
export async function getWhatsAppLogsByOrder(
    orderId: string,
    page = 1,
    limit = 20,
): Promise<PaginatedWhatsAppLogs> {
    const params = new URLSearchParams({ orderId, page: String(page), limit: String(limit) });
    const res = await fetch(`${BASE}/whatsapp/logs?${params}`, {
        headers: authHeaders(),
    });
    if (!res.ok) throw new Error(`WhatsApp logs fetch failed: ${res.statusText}`);
    return res.json();
}

/**
 * Get the global recent WhatsApp log feed (admin audit).
 */
export async function getRecentWhatsAppLogs(
    page = 1,
    limit = 20,
): Promise<PaginatedWhatsAppLogs> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    const res = await fetch(`${BASE}/whatsapp/logs/recent?${params}`, {
        headers: authHeaders(),
    });
    if (!res.ok) throw new Error(`WhatsApp recent logs fetch failed: ${res.statusText}`);
    return res.json();
}
