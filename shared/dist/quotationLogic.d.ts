export declare const EVENT_TYPES: {
    readonly CASAMENTO: "casamento";
    readonly ANIVERSARIO: "aniversario";
    readonly CORPORATIVO: "corporativo";
    readonly BAPTIZADO: "baptizado";
    readonly BODAS: "bodas";
    readonly BABY_SHOWER: "baby_shower";
    readonly GRADUACAO: "graduacao";
    readonly OUTRO: "outro";
};
export type EventType = typeof EVENT_TYPES[keyof typeof EVENT_TYPES];
export declare const BASE_PRICES: Record<string, number>;
export declare const EVENT_LABELS: Record<string, string>;
export declare const COMPLEMENTS: {
    readonly CUPCAKES: {
        readonly id: "cupcakes";
        readonly name: "Cupcakes Decorados";
        readonly type: "PER_UNIT";
        readonly pricePerUnit: 1500;
    };
    readonly DOCINHOS: {
        readonly id: "docinhos";
        readonly name: "Mesa de Docinhos";
        readonly type: "PER_GUEST";
        readonly pricePerGuest: 800;
    };
    readonly DRINKS: {
        readonly id: "drinks";
        readonly name: "Serviço de Bebidas";
        readonly type: "PER_GUEST";
        readonly pricePerGuest: 1000;
    };
    readonly SALGADOS: {
        readonly id: "salgados";
        readonly name: "Salgados Premium";
        readonly type: "PER_GUEST";
        readonly pricePerGuest: 900;
    };
    readonly DECORATION: {
        readonly id: "decoration";
        readonly name: "Decoração Temática";
        readonly type: "FIXED";
        readonly fixedPrice: 25000;
    };
    readonly COFFEE_BREAK: {
        readonly id: "coffee_break";
        readonly name: "Coffee Break";
        readonly type: "PER_GUEST";
        readonly pricePerGuest: 1200;
    };
    readonly LEMBRANCINHAS: {
        readonly id: "lembrancinhas";
        readonly name: "Lembrancinhas";
        readonly type: "PER_GUEST";
        readonly pricePerGuest: 500;
    };
};
export declare const EVENT_SUGGESTIONS: Record<string, string[]>;
export interface ComplementInput {
    id?: string;
    name?: string;
    type?: string;
    pricePerUnit?: number;
    pricePerGuest?: number;
    fixedPrice?: number;
    quantity?: number;
}
export interface ComplexityInput {
    description?: string;
    tiers?: number;
    customDesign?: boolean;
    guestCount: number;
    eventType: string;
}
export declare function calculateComplexity(input: ComplexityInput): number;
export interface SmartPriceInput {
    eventType: string;
    guestCount: number;
    complexityScore: number;
    daysUntilEvent: number;
    isRecurringClient: boolean;
    kitchenLoad: number;
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
    confidence: number;
    variationPercent: number;
}
export declare function calculateSmartPrice(input: SmartPriceInput): PriceBreakdown;
interface CalculationInput {
    eventType: string;
    guestCount: number;
    complements?: (string | ComplementInput)[];
}
export declare const calculateQuotation: ({ eventType, guestCount, complements }: CalculationInput) => {
    subtotal: number;
    tax: number;
    total: number;
};
export declare function formatKz(value: number): string;
export {};
