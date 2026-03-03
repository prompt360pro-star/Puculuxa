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
