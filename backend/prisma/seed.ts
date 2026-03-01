import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const config = { url: 'file:./prisma/dev.db' };
const adapter = new PrismaLibSql(config);
const prisma = new PrismaClient({ adapter });

async function main() {
    const adminPassword = await bcrypt.hash('admin123', 10);

    const admin = await prisma.user.upsert({
        where: { email: 'admin@puculuxa.com' },
        update: {},
        create: {
            email: 'admin@puculuxa.com',
            name: 'Puculuxa Admin',
            password: adminPassword,
            role: 'ADMIN',
        },
    });

    console.log({ admin });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
