/**
 * Smart Quotation Engine v3.1 — Puculuxa
 * Motor de inteligência: pricing, complexidade, sugestões.
 * Shared entre mobile, web e backend.
 */

// ─── Event Types (8 tipos) ───
export const EVENT_TYPES = {
    CASAMENTO: 'casamento',
    ANIVERSARIO: 'aniversario',
    CORPORATIVO: 'corporativo',
    BAPTIZADO: 'baptizado',
    BODAS: 'bodas',
    BABY_SHOWER: 'baby_shower',
    GRADUACAO: 'graduacao',
    OUTRO: 'outro',
} as const;

export type EventType = typeof EVENT_TYPES[keyof typeof EVENT_TYPES];

// ─── Base Prices (Kz por convidado) ───
export const BASE_PRICES: Record<string, number> = {
    [EVENT_TYPES.CASAMENTO]: 2500,
    [EVENT_TYPES.ANIVERSARIO]: 2000,
    [EVENT_TYPES.CORPORATIVO]: 3000,
    [EVENT_TYPES.BAPTIZADO]: 1800,
    [EVENT_TYPES.BODAS]: 2200,
    [EVENT_TYPES.BABY_SHOWER]: 1500,
    [EVENT_TYPES.GRADUACAO]: 1800,
    [EVENT_TYPES.OUTRO]: 2000,
};

// ─── Event Labels (PT-AO) ───
export const EVENT_LABELS: Record<string, string> = {
    casamento: 'Casamento',
    aniversario: 'Aniversário',
    corporativo: 'Corporativo',
    baptizado: 'Baptizado',
    bodas: 'Bodas',
    baby_shower: 'Baby Shower',
    graduacao: 'Graduação',
    outro: 'Outro',
};

// ─── Complements Catalog ───
export const COMPLEMENTS = {
    CUPCAKES: { id: 'cupcakes', name: 'Cupcakes Decorados', type: 'PER_UNIT' as const, pricePerUnit: 1500 },
    DOCINHOS: { id: 'docinhos', name: 'Mesa de Docinhos', type: 'PER_GUEST' as const, pricePerGuest: 800 },
    DRINKS: { id: 'drinks', name: 'Serviço de Bebidas', type: 'PER_GUEST' as const, pricePerGuest: 1000 },
    SALGADOS: { id: 'salgados', name: 'Salgados Premium', type: 'PER_GUEST' as const, pricePerGuest: 900 },
    DECORATION: { id: 'decoration', name: 'Decoração Temática', type: 'FIXED' as const, fixedPrice: 25000 },
    COFFEE_BREAK: { id: 'coffee_break', name: 'Coffee Break', type: 'PER_GUEST' as const, pricePerGuest: 1200 },
    LEMBRANCINHAS: { id: 'lembrancinhas', name: 'Lembrancinhas', type: 'PER_GUEST' as const, pricePerGuest: 500 },
} as const;

// ─── Event Suggestions (badge "✨ Popular") ───
export const EVENT_SUGGESTIONS: Record<string, string[]> = {
    casamento: ['cupcakes', 'docinhos', 'drinks', 'decoration'],
    aniversario: ['cupcakes', 'docinhos'],
    corporativo: ['coffee_break', 'salgados', 'drinks'],
    baptizado: ['docinhos', 'lembrancinhas'],
    bodas: ['cupcakes', 'docinhos', 'drinks'],
    baby_shower: ['cupcakes', 'docinhos', 'lembrancinhas'],
    graduacao: ['salgados', 'drinks'],
    outro: ['docinhos'],
};

// ─── Complement Input Type ───
export interface ComplementInput {
    id?: string;
    name?: string;
    type?: string;
    pricePerUnit?: number;
    pricePerGuest?: number;
    fixedPrice?: number;
    quantity?: number;
}

// ─── Complexity Score (1-5) ───
export interface ComplexityInput {
    description?: string;
    tiers?: number;           // andares do bolo
    customDesign?: boolean;
    guestCount: number;
    eventType: string;
}

export function calculateComplexity(input: ComplexityInput): number {
    let score = 1;
    if (input.tiers && input.tiers >= 3) score += 2;
    else if (input.tiers === 2) score += 1;
    if (input.customDesign) score += 1;
    if (input.guestCount > 100) score += 1;
    if (input.description && input.description.length > 100) score += 1;
    if (input.eventType === EVENT_TYPES.CASAMENTO) score += 1; // casamentos são naturalmente complexos
    return Math.min(score, 5);
}

// ─── Smart Price Calculator ───
export interface SmartPriceInput {
    eventType: string;
    guestCount: number;
    complexityScore: number;
    daysUntilEvent: number;
    isRecurringClient: boolean;
    kitchenLoad: number;        // 0-1
    complements?: (string | ComplementInput)[];
}

export interface PriceBreakdown {
    base: number;
    complementsTotal: number;
    subtotal: number;
    complexityMultiplier: number;
    urgencyMultiplier: number;
    loyaltyDiscount: number;
    capacityMultiplier: number;
    tax: number;
    total: number;
    confidence: number;          // 70-95%
    variationPercent: number;    // ±5% to ±15%
}

export function calculateSmartPrice(input: SmartPriceInput): PriceBreakdown {
    // Base
    const basePrice = BASE_PRICES[input.eventType] || 2000;
    const base = basePrice * input.guestCount;

    // Complements
    let complementsTotal = 0;
    (input.complements || []).forEach(compItem => {
        let comp: ComplementInput | undefined;
        if (typeof compItem === 'string') {
            const key = Object.keys(COMPLEMENTS).find(
                k => COMPLEMENTS[k as keyof typeof COMPLEMENTS].id === compItem,
            );
            if (key) {
                comp = COMPLEMENTS[key as keyof typeof COMPLEMENTS] as unknown as ComplementInput;
            }
        } else {
            comp = compItem;
        }
        if (comp) {
            if (comp.pricePerUnit) complementsTotal += comp.pricePerUnit * (comp.quantity || 1);
            else if (comp.pricePerGuest) complementsTotal += comp.pricePerGuest * input.guestCount;
            else if (comp.fixedPrice) complementsTotal += comp.fixedPrice;
        }
    });

    // Multipliers
    const complexityMultiplier = 1 + (input.complexityScore - 1) * 0.15;
    const urgencyMultiplier = input.daysUntilEvent < 3 ? 1.20 : input.daysUntilEvent < 7 ? 1.10 : 1.0;
    const loyaltyDiscount = input.isRecurringClient ? 0.95 : 1.0;
    const capacityMultiplier = input.kitchenLoad > 0.8 ? 1.10 : 1.0;

    const subtotal = (base + complementsTotal) * complexityMultiplier * urgencyMultiplier * loyaltyDiscount * capacityMultiplier;
    const tax = subtotal * 0.05;
    const total = subtotal + tax;

    // Confidence based on complexity
    const confidence = input.complexityScore <= 2 ? 95 : input.complexityScore <= 4 ? 85 : 70;
    const variationPercent = input.complexityScore <= 2 ? 5 : input.complexityScore <= 4 ? 10 : 15;

    return {
        base,
        complementsTotal,
        subtotal,
        complexityMultiplier,
        urgencyMultiplier,
        loyaltyDiscount,
        capacityMultiplier,
        tax,
        total,
        confidence,
        variationPercent,
    };
}

// ─── Legacy/backward compat: simple calculateQuotation ───
interface CalculationInput {
    eventType: string;
    guestCount: number;
    complements?: (string | ComplementInput)[];
}

export const calculateQuotation = ({ eventType, guestCount, complements = [] }: CalculationInput) => {
    const result = calculateSmartPrice({
        eventType,
        guestCount,
        complexityScore: 1,
        daysUntilEvent: 30,
        isRecurringClient: false,
        kitchenLoad: 0,
        complements,
    });
    return {
        subtotal: result.subtotal,
        tax: result.tax,
        total: result.total,
    };
};

// ─── Format Kz ───
export function formatKz(value: number): string {
    return `Kz ${value.toLocaleString('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
