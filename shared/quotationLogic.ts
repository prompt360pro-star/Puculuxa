/**
 * Smart Quotation Engine - Puculuxa
 * Shared business logic for price calculation.
 */

export const EVENT_TYPES = {
    WEDDING: 'casamento',
    BIRTHDAY: 'aniversario',
    CORPORATE: 'corporativo',
} as const;

export type EventType = typeof EVENT_TYPES[keyof typeof EVENT_TYPES];

export const BASE_PRICES: Record<string, number> = {
    [EVENT_TYPES.WEDDING]: 25, // R$ per guest (base)
    [EVENT_TYPES.BIRTHDAY]: 20,
    [EVENT_TYPES.CORPORATE]: 30,
};

export const COMPLEMENTS = {
    CUPCAKES: { id: 'cupcakes', name: 'Cupcakes Decorados', pricePerUnit: 15 },
    DRINKS: { id: 'drinks', name: 'Serviço de Bebidas', pricePerGuest: 10 },
    DECORATION: { id: 'decoration', name: 'Decoração Temática', fixedPrice: 500 },
} as const;

export interface ComplementInput {
    id?: string;
    name?: string;
    pricePerUnit?: number;
    quantity?: number;
    pricePerGuest?: number;
    fixedPrice?: number;
}

interface CalculationInput {
    eventType: string;
    guestCount: number;
    complements?: (string | ComplementInput)[];
}

/**
 * Calculates the total quotation price based on event details.
 */
export const calculateQuotation = ({ eventType, guestCount, complements = [] }: CalculationInput) => {
    let basePrice = BASE_PRICES[eventType] || 0;
    let total = basePrice * guestCount;

    complements.forEach(compItem => {
        let comp: ComplementInput | undefined;

        if (typeof compItem === 'string') {
            const key = Object.keys(COMPLEMENTS).find(k => COMPLEMENTS[k as keyof typeof COMPLEMENTS].id === compItem);
            if (key) {
                comp = COMPLEMENTS[key as keyof typeof COMPLEMENTS] as ComplementInput;
            }
        } else {
            comp = compItem;
        }

        if (comp) {
            if (comp.pricePerUnit) {
                total += comp.pricePerUnit * (comp.quantity || 1);
            } else if (comp.pricePerGuest) {
                total += comp.pricePerGuest * guestCount;
            } else if (comp.fixedPrice) {
                total += comp.fixedPrice;
            }
        }
    });

    return {
        subtotal: total,
        tax: total * 0.05, // Exemplo de taxa
        total: total * 1.05,
    };
};
