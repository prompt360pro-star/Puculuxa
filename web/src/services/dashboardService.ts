import { API_BASE_URL } from '@/config';

const BASE_URL = API_BASE_URL;

export interface DashboardStats {
    newQuotes: number;
    inProduction: number;
    conversionRate: string;
    revenue: string;
    feedbacks: number;
    averageRating: string;
    counters: Record<string, number>;
}

export interface RecentOrder {
    id: string;
    customer: string;
    type: string;
    status: string;
    total: string;
    date: string;
}

interface RawDashboardOrder {
    id: string;
    user?: { name: string };
    status: string;
    total: number;
    createdAt: string;
}

export interface DashboardData {
    stats: DashboardStats;
    orders: RecentOrder[];
}

export const DashboardService = {
    /**
     * Fetches all dashboard data in a single API call
     */
    async getAll(token?: string): Promise<DashboardData> {
        const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('puculuxa_token') : null);

        const response = await fetch(`${BASE_URL}/analytics/dashboard`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            next: { revalidate: 60 } // Cache for 1 minute
        });

        if (!response.ok) throw new Error('Falha ao carregar dados do dashboard');
        const data = await response.json();

        return {
            stats: this.parseStats(data),
            orders: this.parseRecentOrders(data)
        };
    },

    parseStats(data: { counters: Record<string, number> }): DashboardStats {
        return {
            newQuotes: data.counters.quotations,
            inProduction: data.counters.orders,
            conversionRate: data.counters.quotations > 0
                ? `${Math.round((data.counters.orders / data.counters.quotations) * 100)}%`
                : '0%',
            revenue: `Kz ${data.counters.revenue.toLocaleString('pt-BR')}`,
            feedbacks: data.counters.feedbacks,
            averageRating: data.counters.averageRating.toFixed(1),
            counters: data.counters
        };
    },

    parseRecentOrders(data: { recentOrders: RawDashboardOrder[] }): RecentOrder[] {
        return data.recentOrders.map((o: RawDashboardOrder) => ({
            id: o.id.substring(0, 8),
            customer: o.user?.name || 'Cliente',
            type: 'Pedido de Doces',
            status: o.status,
            total: `Kz ${o.total.toLocaleString('pt-BR')}`,
            date: new Date(o.createdAt).toLocaleDateString('pt-BR')
        }));
    },

    // Legacy methods for backwards compatibility
    async getStats(token?: string): Promise<DashboardStats> {
        const data = await this.getAll(token);
        return data.stats;
    },

    async getRecentOrders(token?: string): Promise<RecentOrder[]> {
        const data = await this.getAll(token);
        return data.orders;
    }
};
