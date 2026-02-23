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

interface CalculationInput {
    eventType: string;
    guestCount: number;
    complements?: any[];
}

/**
 * Calculates the total quotation price based on event details.
 */
export const calculateQuotation = ({ eventType, guestCount, complements = [] }: CalculationInput) => {
    let basePrice = BASE_PRICES[eventType] || 0;
    let total = basePrice * guestCount;

    complements.forEach(comp => {
        if (comp.pricePerUnit) {
            total += comp.pricePerUnit * (comp.quantity || 1);
        } else if (comp.pricePerGuest) {
            total += comp.pricePerGuest * guestCount;
        } else if (comp.fixedPrice) {
            total += comp.fixedPrice;
        }
    });

    return {
        subtotal: total,
        tax: total * 0.05, // Exemplo de taxa
        total: total * 1.05,
    };
};
