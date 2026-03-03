import { API_BASE_URL } from '@/config';

const BASE = API_BASE_URL;

function authHeaders(): Record<string, string> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
}

export interface WhatsAppAnalyticsKpis {
    sent24h: number;
    delivered24h: number;
    read24h: number;
    failed24h: number;
    skipped24h: number;
}

export interface WhatsAppTemplateBreakdown {
    templateName: string;
    sent: number;
    delivered: number;
    read: number;
    failed: number;
    skipped: number;
    pending: number;
}

export interface WhatsAppRecentLog {
    id: string;
    templateName: string;
    recipientPhone: string;
    status: string;
    orderId: string | null;
    errorMessage: string | null;
    createdAt: string;
    sentAt: string | null;
    deliveredAt: string | null;
    readAt: string | null;
}

export interface WhatsAppAnalyticsData {
    kpis: WhatsAppAnalyticsKpis;
    byTemplate24h: WhatsAppTemplateBreakdown[];
    recent: WhatsAppRecentLog[];
}

export async function getWhatsAppAnalytics(): Promise<WhatsAppAnalyticsData> {
    const res = await fetch(`${BASE}/analytics/whatsapp`, {
        headers: authHeaders(),
    });
    if (!res.ok) throw new Error(`WhatsApp analytics fetch failed: ${res.statusText}`);
    return res.json();
}

export async function retryWhatsAppLog(logId: string): Promise<{ ok: boolean; error?: string; skipped?: boolean }> {
    const res = await fetch(`${BASE}/whatsapp/admin/retry/${logId}`, {
        method: 'POST',
        headers: authHeaders(),
    });
    if (!res.ok) throw new Error(`Retry failed: ${res.statusText}`);
    return res.json();
}
