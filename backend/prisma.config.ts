import { defineConfig } from '@prisma/config';

export default defineConfig({
    datasource: {
        url: 'file:./prisma/dev.db',
    },
    migrations: {
        seed: 'ts-node --compiler-options {"module":"CommonJS"} prisma/seed.ts',
    }
});
