import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const hash = await bcrypt.hash('Admin123!', 10);

    const user = await prisma.user.upsert({
        where: { email: 'admin@puculuxa.ao' },
        update: { password: hash, role: 'ADMIN' },
        create: {
            email: 'admin@puculuxa.ao',
            name: 'Administrador Puculuxa',
            password: hash,
            role: 'ADMIN',
        },
    });

    console.log('✅ Admin pronto:', user.email, '| Role:', user.role);
    await prisma.$disconnect();
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
