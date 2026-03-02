"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateQuotation = exports.EVENT_SUGGESTIONS = exports.COMPLEMENTS = exports.EVENT_LABELS = exports.BASE_PRICES = exports.EVENT_TYPES = void 0;
exports.calculateComplexity = calculateComplexity;
exports.calculateSmartPrice = calculateSmartPrice;
exports.formatKz = formatKz;
exports.EVENT_TYPES = {
    CASAMENTO: 'casamento',
    ANIVERSARIO: 'aniversario',
    CORPORATIVO: 'corporativo',
    BAPTIZADO: 'baptizado',
    BODAS: 'bodas',
    BABY_SHOWER: 'baby_shower',
    GRADUACAO: 'graduacao',
    OUTRO: 'outro',
};
exports.BASE_PRICES = {
    [exports.EVENT_TYPES.CASAMENTO]: 2500,
    [exports.EVENT_TYPES.ANIVERSARIO]: 2000,
    [exports.EVENT_TYPES.CORPORATIVO]: 3000,
    [exports.EVENT_TYPES.BAPTIZADO]: 1800,
    [exports.EVENT_TYPES.BODAS]: 2200,
    [exports.EVENT_TYPES.BABY_SHOWER]: 1500,
    [exports.EVENT_TYPES.GRADUACAO]: 1800,
    [exports.EVENT_TYPES.OUTRO]: 2000,
};
exports.EVENT_LABELS = {
    casamento: 'Casamento',
    aniversario: 'Aniversário',
    corporativo: 'Corporativo',
    baptizado: 'Baptizado',
    bodas: 'Bodas',
    baby_shower: 'Baby Shower',
    graduacao: 'Graduação',
    outro: 'Outro',
};
exports.COMPLEMENTS = {
    CUPCAKES: { id: 'cupcakes', name: 'Cupcakes Decorados', type: 'PER_UNIT', pricePerUnit: 1500 },
    DOCINHOS: { id: 'docinhos', name: 'Mesa de Docinhos', type: 'PER_GUEST', pricePerGuest: 800 },
    DRINKS: { id: 'drinks', name: 'Serviço de Bebidas', type: 'PER_GUEST', pricePerGuest: 1000 },
    SALGADOS: { id: 'salgados', name: 'Salgados Premium', type: 'PER_GUEST', pricePerGuest: 900 },
    DECORATION: { id: 'decoration', name: 'Decoração Temática', type: 'FIXED', fixedPrice: 25000 },
    COFFEE_BREAK: { id: 'coffee_break', name: 'Coffee Break', type: 'PER_GUEST', pricePerGuest: 1200 },
    LEMBRANCINHAS: { id: 'lembrancinhas', name: 'Lembrancinhas', type: 'PER_GUEST', pricePerGuest: 500 },
};
exports.EVENT_SUGGESTIONS = {
    casamento: ['cupcakes', 'docinhos', 'drinks', 'decoration'],
    aniversario: ['cupcakes', 'docinhos'],
    corporativo: ['coffee_break', 'salgados', 'drinks'],
    baptizado: ['docinhos', 'lembrancinhas'],
    bodas: ['cupcakes', 'docinhos', 'drinks'],
    baby_shower: ['cupcakes', 'docinhos', 'lembrancinhas'],
    graduacao: ['salgados', 'drinks'],
    outro: ['docinhos'],
};
function calculateComplexity(input) {
    let score = 1;
    if (input.tiers && input.tiers >= 3)
        score += 2;
    else if (input.tiers === 2)
        score += 1;
    if (input.customDesign)
        score += 1;
    if (input.guestCount > 100)
        score += 1;
    if (input.description && input.description.length > 100)
        score += 1;
    if (input.eventType === exports.EVENT_TYPES.CASAMENTO)
        score += 1;
    return Math.min(score, 5);
}
function calculateSmartPrice(input) {
    const basePrice = exports.BASE_PRICES[input.eventType] || 2000;
    const base = basePrice * input.guestCount;
    let complementsTotal = 0;
    (input.complements || []).forEach(compItem => {
        let comp;
        if (typeof compItem === 'string') {
            const key = Object.keys(exports.COMPLEMENTS).find(k => exports.COMPLEMENTS[k].id === compItem);
            if (key) {
                comp = exports.COMPLEMENTS[key];
            }
        }
        else {
            comp = compItem;
        }
        if (comp) {
            if (comp.pricePerUnit)
                complementsTotal += comp.pricePerUnit * (comp.quantity || 1);
            else if (comp.pricePerGuest)
                complementsTotal += comp.pricePerGuest * input.guestCount;
            else if (comp.fixedPrice)
                complementsTotal += comp.fixedPrice;
        }
    });
    const complexityMultiplier = 1 + (input.complexityScore - 1) * 0.15;
    const urgencyMultiplier = input.daysUntilEvent < 3 ? 1.20 : input.daysUntilEvent < 7 ? 1.10 : 1.0;
    const loyaltyDiscount = input.isRecurringClient ? 0.95 : 1.0;
    const capacityMultiplier = input.kitchenLoad > 0.8 ? 1.10 : 1.0;
    const subtotal = (base + complementsTotal) * complexityMultiplier * urgencyMultiplier * loyaltyDiscount * capacityMultiplier;
    const tax = subtotal * 0.05;
    const total = subtotal + tax;
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
const calculateQuotation = ({ eventType, guestCount, complements = [] }) => {
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
exports.calculateQuotation = calculateQuotation;
function formatKz(value) {
    return `Kz ${value.toLocaleString('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
//# sourceMappingURL=quotationLogic.js.map