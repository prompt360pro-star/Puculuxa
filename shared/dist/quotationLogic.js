"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateQuotation = exports.COMPLEMENTS = exports.BASE_PRICES = exports.EVENT_TYPES = void 0;
exports.EVENT_TYPES = {
    WEDDING: 'casamento',
    BIRTHDAY: 'aniversario',
    CORPORATE: 'corporativo',
};
exports.BASE_PRICES = {
    [exports.EVENT_TYPES.WEDDING]: 25,
    [exports.EVENT_TYPES.BIRTHDAY]: 20,
    [exports.EVENT_TYPES.CORPORATE]: 30,
};
exports.COMPLEMENTS = {
    CUPCAKES: { id: 'cupcakes', name: 'Cupcakes Decorados', pricePerUnit: 15 },
    DRINKS: { id: 'drinks', name: 'Serviço de Bebidas', pricePerGuest: 10 },
    DECORATION: { id: 'decoration', name: 'Decoração Temática', fixedPrice: 500 },
};
const calculateQuotation = ({ eventType, guestCount, complements = [] }) => {
    let basePrice = exports.BASE_PRICES[eventType] || 0;
    let total = basePrice * guestCount;
    complements.forEach(compItem => {
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
            if (comp.pricePerUnit) {
                total += comp.pricePerUnit * (comp.quantity || 1);
            }
            else if (comp.pricePerGuest) {
                total += comp.pricePerGuest * guestCount;
            }
            else if (comp.fixedPrice) {
                total += comp.fixedPrice;
            }
        }
    });
    return {
        subtotal: total,
        tax: total * 0.05,
        total: total * 1.05,
    };
};
exports.calculateQuotation = calculateQuotation;
//# sourceMappingURL=quotationLogic.js.map