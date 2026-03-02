import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const config = { url: 'file:./prisma/dev.db' };
const adapter = new PrismaLibSql(config);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('Starting seed...');

    // Admin password
    const adminPassword = await bcrypt.hash('admin123', 10);

    // Create Admin User
    const admin = await prisma.user.upsert({
        where: { email: 'admin@puculuxa.com' },
        update: {},
        create: {
            email: 'admin@puculuxa.com',
            name: 'Puculuxa Admin',
            password: adminPassword,
            role: 'ADMIN',
            phone: '900000000',
        },
    });
    console.log('Created admin:', admin.email);

    // Create Loyalty Points for Admin
    await prisma.loyaltyPoints.upsert({
        where: { userId: admin.id },
        update: {},
        create: {
            userId: admin.id,
            points: 500,
            tier: 'GOLD',
        }
    });
    console.log('Created Loyalty Points for admin');

    // Create Products
    const productsData = [
        { name: 'Bolo de Casamento Clássico', category: 'Bolos', price: 150000, description: 'Bolo de 3 andares com massa branca e recheio de nozes.', image: 'https://images.unsplash.com/photo-1535141192574-5d4897c12636?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
        { name: 'Bolo de Chocolate Intenso', category: 'Bolos', price: 25000, description: 'Bolo de chocolate com recheio de brigadeiro e cobertura de ganache.', image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
        { name: 'Kit Salgados Premium (100un)', category: 'Salgados', price: 18000, description: 'Coxinha, Rissole de Carne, Bolinho de Queijo e Croquete.', image: 'https://images.unsplash.com/photo-1596450514735-11112b5aff1c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
        { name: 'Caixa de Doces Finos (50un)', category: 'Doces', price: 12000, description: 'Brigadeiro gourmet, beijinho, camafeu de nozes e casadinho.', image: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
        { name: 'Sumo Natural de Maracujá (1L)', category: 'Bebidas', price: 3500, description: 'Sumo 100% natural feito com fruta fresca.', image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
    ];

    const createdProducts = [];
    for (const prod of productsData) {
        let p = await prisma.product.findFirst({ where: { name: prod.name } });
        if (!p) {
            p = await prisma.product.create({ data: prod });
        }
        createdProducts.push(p);
    }
    console.log(`Ensured ${createdProducts.length} base products exist`);

    // Create an Order with OrderItems for Admin (if no orders exist)
    const existingOrders = await prisma.order.count();
    if (existingOrders === 0 && createdProducts.length >= 3) {
        const order = await prisma.order.create({
            data: {
                userId: admin.id,
                total: (createdProducts[1].price || 0) + (createdProducts[2].price || 0),
                status: 'COMPLETED',
                items: {
                    create: [
                        {
                            productId: createdProducts[1].id,
                            name: createdProducts[1].name,
                            price: createdProducts[1].price || 0,
                            quantity: 1,
                        },
                        {
                            productId: createdProducts[2].id,
                            name: createdProducts[2].name,
                            price: createdProducts[2].price || 0,
                            quantity: 1,
                        }
                    ]
                }
            }
        });
        console.log('Created sample Order:', order.id);

        // Create Reviews
        await prisma.review.create({
            data: {
                productId: createdProducts[1].id,
                userId: admin.id,
                rating: 5,
                comment: 'Excelente bolo, muito fofo e saboroso!',
            }
        });

        await prisma.review.create({
            data: {
                productId: createdProducts[2].id,
                userId: admin.id,
                rating: 4,
                comment: 'Os salgados estavam bem quentes, muito bom.',
            }
        });

        await prisma.review.create({
            data: {
                productId: createdProducts[0].id,
                userId: admin.id,
                rating: 5,
                comment: 'O bolo de casamento foi o maior sucesso da festa!',
            }
        });

        console.log('Created sample Reviews');
    }

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
