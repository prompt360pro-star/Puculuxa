import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting seed...');

    // 1. Create SlaConfigs
    await prisma.slaConfig.upsert({
        where: { eventType: 'CASAMENTO' },
        update: {},
        create: {
            eventType: 'CASAMENTO',
            deadlineHours: 4,
        },
    });

    await prisma.slaConfig.upsert({
        where: { eventType: 'ANIVERSARIO' },
        update: {},
        create: {
            eventType: 'ANIVERSARIO',
            deadlineHours: 2,
        },
    });

    // 2. Create Users
    const adminPassword = await bcrypt.hash('Admin123!', 10);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@puculuxa.ao' },
        update: {},
        create: {
            email: 'admin@puculuxa.ao',
            name: 'Administrador Puculuxa',
            password: adminPassword,
            role: 'ADMIN',
        },
    });

    const customerPassword = await bcrypt.hash('Cliente123!', 10);
    const customer = await prisma.user.upsert({
        where: { email: 'cliente@test.ao' },
        update: {},
        create: {
            email: 'cliente@test.ao',
            name: 'Cliente Exemplo',
            password: customerPassword,
            role: 'CUSTOMER',
        },
    });

    // 3. Create Products
    const categories = ['bolos', 'doces'];
    const products = [
        {
            name: 'Bolo de Aniversário Especial',
            category: 'bolos',
            price: 25000,
            description: 'Bolo personalizado de 2 andares',
            popularityScore: 100,
        },
        {
            name: 'Bolo de Casamento Clássico',
            category: 'bolos',
            price: 150000,
            description: 'Bolo de casamento 3 andares com flores de açúcar',
            popularityScore: 150,
        },
        {
            name: 'Docinhos Variados Gourmet',
            category: 'doces',
            price: 500, // Preço por unidade
            description: 'Brigadeiros, beijinhos, e camafeus (unidade)',
            popularityScore: 80,
        },
    ];

    for (const p of products) {
        await prisma.product.create({
            data: {
                name: p.name,
                category: p.category,
                price: p.price,
                description: p.description,
                popularityScore: p.popularityScore,
            },
        });
    }

    // 4. Create Kitchen Capacity for Tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    await prisma.kitchenCapacity.upsert({
        where: { date: tomorrow },
        update: {},
        create: {
            date: tomorrow,
            maxOrders: 10,
            bookedOrders: 2,
        },
    });

    // 5. Create default InvoiceConfig for current year
    const currentYear = new Date().getFullYear();
    await prisma.invoiceConfig.upsert({
        where: { prefix_year: { prefix: 'PF', year: currentYear } },
        update: {},
        create: {
            prefix: 'PF',
            year: currentYear,
            nextNumber: 1,
            padding: 5,
            format: '{prefix} {year}/{number}',
        },
    });

    // 6. Create Base Financial Configs for Angola (FASE 11C)
    // B2C Default
    await (prisma as any).paymentTermsConfig.upsert({
        where: { segment_eventType: { segment: 'B2C', eventType: null } },
        update: {},
        create: {
            segment: 'B2C',
            depositPercent: 50,
            depositDueDays: 1,
            balanceDueDays: 3,
            allowGpo: true,
            allowBankTransfer: true,
            allowCredit: false,
        },
    });

    // B2B Default
    await (prisma as any).paymentTermsConfig.upsert({
        where: { segment_eventType: { segment: 'B2B', eventType: null } },
        update: {},
        create: {
            segment: 'B2B',
            depositPercent: 50,
            depositDueDays: 3,
            balanceDueDays: 15,
            allowGpo: true,
            allowBankTransfer: true,
            allowCredit: false,
        },
    });

    // GOVERNMENT Default
    await (prisma as any).paymentTermsConfig.upsert({
        where: { segment_eventType: { segment: 'GOVERNMENT', eventType: null } },
        update: {},
        create: {
            segment: 'GOVERNMENT',
            depositPercent: 0,
            depositDueDays: 0,
            balanceDueDays: 0,
            creditDueDays: 60,
            allowGpo: false,
            allowBankTransfer: true,
            allowCredit: true,
        },
    });

    console.log('Seed completed successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
