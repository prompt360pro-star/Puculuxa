/**
 * Dados Bancários Oficiais da Puculuxa
 * Single source of truth — usar em todos os contextos (controller, PDF, invoice)
 */
export const PUCULUXA_BANK_DETAILS = {
    bank: 'Banco BAI',
    iban: '004000006429367510193',
    nif: '5001857010',
    beneficiary: 'Puculuxa, Lda',
    currency: 'AOA',
} as const;
