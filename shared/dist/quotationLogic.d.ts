export declare const EVENT_TYPES: {
    readonly WEDDING: "casamento";
    readonly BIRTHDAY: "aniversario";
    readonly CORPORATE: "corporativo";
};
export type EventType = typeof EVENT_TYPES[keyof typeof EVENT_TYPES];
export declare const BASE_PRICES: Record<string, number>;
export declare const COMPLEMENTS: {
    readonly CUPCAKES: {
        readonly id: "cupcakes";
        readonly name: "Cupcakes Decorados";
        readonly pricePerUnit: 15;
    };
    readonly DRINKS: {
        readonly id: "drinks";
        readonly name: "Serviço de Bebidas";
        readonly pricePerGuest: 10;
    };
    readonly DECORATION: {
        readonly id: "decoration";
        readonly name: "Decoração Temática";
        readonly fixedPrice: 500;
    };
};
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
export declare const calculateQuotation: ({ eventType, guestCount, complements }: CalculationInput) => {
    subtotal: number;
    tax: number;
    total: number;
};
export {};
