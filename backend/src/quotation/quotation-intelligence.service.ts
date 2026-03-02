import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
    calculateComplexity,
    calculateSmartPrice,
    EVENT_SUGGESTIONS,
    COMPLEMENTS,
    EVENT_LABELS,
    formatKz,
} from '@puculuxa/shared';

// ─── Types ───
export interface SuggestedProduct {
    id: string;
    name: string;
    price: number | null;
    image: string | null;
    popularityScore: number;
    isSuggested: boolean;
}

export interface ClientProfile {
    totalOrders: number;
    totalSpent: number;
    avgTicket: number;
    tier: string;
    isRecurring: boolean;
    lastOrderDate: string | null;
    preferredEventType: string | null;
}

export interface AdminBrief {
    clientProfile: ClientProfile;
    suggestedProducts: SuggestedProduct[];
    feasibility: { viable: boolean; kitchenLoad: number; minPrepDays: number };
    complexityScore: number;
    estimatedPrice: string;
    summary: string;
}

@Injectable()
export class QuotationIntelligenceService {
    constructor(private prisma: PrismaService) { }

    // ─── Suggest Products by Event Type ───
    async suggestProducts(eventType: string, guestCount: number): Promise<SuggestedProduct[]> {
        const suggestedIds = EVENT_SUGGESTIONS[eventType] || [];
        const products = await this.prisma.product.findMany({
            where: { deletedAt: null },
            orderBy: { popularityScore: 'desc' },
            take: 12,
        });

        return products.map((p) => ({
            id: p.id,
            name: p.name,
            price: p.price,
            image: p.image,
            popularityScore: p.popularityScore,
            isSuggested: suggestedIds.some(
                (sid) => p.name.toLowerCase().includes(sid) || p.category?.toLowerCase().includes(sid),
            ),
        }));
    }

    // ─── Client Profile ───
    async getClientProfile(userId: string | null): Promise<ClientProfile> {
        if (!userId) {
            return {
                totalOrders: 0,
                totalSpent: 0,
                avgTicket: 0,
                tier: 'NOVO',
                isRecurring: false,
                lastOrderDate: null,
                preferredEventType: null,
            };
        }

        const orders = await this.prisma.order.findMany({
            where: { userId, deletedAt: null },
            orderBy: { createdAt: 'desc' },
        });

        const totalSpent = orders.reduce((sum, o) => sum + o.total, 0);
        const avgTicket = orders.length > 0 ? totalSpent / orders.length : 0;

        // Determine tier
        let tier = 'BRONZE';
        if (orders.length >= 5) tier = 'GOLD';
        else if (orders.length >= 2) tier = 'SILVER';

        // Find preferred event type from quotations
        const quotations = await this.prisma.quotation.findMany({
            where: { customerId: userId, deletedAt: null },
            select: { eventType: true },
        });
        const eventCounts: Record<string, number> = {};
        quotations.forEach((q) => {
            eventCounts[q.eventType] = (eventCounts[q.eventType] || 0) + 1;
        });
        const preferredEventType = Object.entries(eventCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

        const loyalty = await this.prisma.loyaltyPoints.findUnique({ where: { userId } });

        return {
            totalOrders: orders.length,
            totalSpent,
            avgTicket,
            tier: loyalty?.tier || tier,
            isRecurring: orders.length >= 2,
            lastOrderDate: orders[0]?.createdAt?.toISOString() || null,
            preferredEventType,
        };
    }

    // ─── Check Kitchen Feasibility ───
    async checkFeasibility(eventDate: Date | null): Promise<{ viable: boolean; kitchenLoad: number; minPrepDays: number }> {
        if (!eventDate) return { viable: true, kitchenLoad: 0, minPrepDays: 0 };

        const dateOnly = new Date(eventDate.toISOString().split('T')[0]);
        const capacity = await this.prisma.kitchenCapacity.findUnique({
            where: { date: dateOnly },
        });

        const load = capacity ? capacity.bookedOrders / capacity.maxOrders : 0;
        const daysUntil = Math.ceil((eventDate.getTime() - Date.now()) / 86400000);

        return {
            viable: load < 1.0 && daysUntil >= 1,
            kitchenLoad: load,
            minPrepDays: daysUntil,
        };
    }

    // ─── Generate Admin Brief ───
    async generateAdminBrief(quotationId: string): Promise<AdminBrief> {
        const quotation = await this.prisma.quotation.findUnique({
            where: { id: quotationId },
            include: { customer: true },
        });

        if (!quotation) throw new Error('Quotation not found');

        const clientProfile = await this.getClientProfile(quotation.customerId);
        const suggestedProducts = await this.suggestProducts(quotation.eventType, quotation.guestCount);
        const feasibility = await this.checkFeasibility(quotation.eventDate);

        const complexityScore = calculateComplexity({
            description: quotation.description || undefined,
            guestCount: quotation.guestCount,
            eventType: quotation.eventType,
        });

        const priceResult = calculateSmartPrice({
            eventType: quotation.eventType,
            guestCount: quotation.guestCount,
            complexityScore,
            daysUntilEvent: feasibility.minPrepDays,
            isRecurringClient: clientProfile.isRecurring,
            kitchenLoad: feasibility.kitchenLoad,
        });

        // Build summary
        const clientLabel = clientProfile.isRecurring
            ? `Cliente recorrente (${clientProfile.totalOrders}º pedido), ${clientProfile.tier}, ticket médio ${formatKz(clientProfile.avgTicket)}`
            : 'Novo cliente';

        const eventLabel = EVENT_LABELS[quotation.eventType] || quotation.eventType;
        const urgencyLabel = feasibility.minPrepDays < 3 ? '⚠️ URGENTE' : feasibility.minPrepDays < 7 ? '⏰ Prazo curto' : '✅ Normal';

        const summary =
            `${clientLabel}. ${eventLabel} para ${quotation.guestCount} convidados. ` +
            `Complexidade: ${complexityScore}/5. ${urgencyLabel}. ` +
            `Cozinha: ${Math.round(feasibility.kitchenLoad * 100)}% capacidade. ` +
            `Estimativa: ${formatKz(priceResult.total)} (±${priceResult.variationPercent}%).`;

        return {
            clientProfile,
            suggestedProducts,
            feasibility,
            complexityScore,
            estimatedPrice: formatKz(priceResult.total),
            summary,
        };
    }

    // ─── Increment Product Popularity ───
    async incrementPopularity(productIds: string[]) {
        for (const id of productIds) {
            await this.prisma.product.update({
                where: { id },
                data: { popularityScore: { increment: 1 } },
            });
        }
    }
}
