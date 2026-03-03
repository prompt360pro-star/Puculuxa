import path from 'path';
import dotenv from 'dotenv';
import { defineConfig } from '@prisma/config';

dotenv.config({ path: path.resolve(__dirname, '.env') });

export default defineConfig({
    datasource: {
        url: process.env.DATABASE_URL,
    },
    migrations: {
        seed: 'ts-node --compiler-options {"module":"CommonJS"} prisma/seed.ts',
    }
});
