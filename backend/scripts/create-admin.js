// create-admin.js — Node CommonJS, sem ts-node
// Uso: node scripts/create-admin.js
const { Client } = require('pg');
const bcrypt = require('bcrypt');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function main() {
    const hash = await bcrypt.hash('Admin123!', 10);
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();

    const res = await client.query(
        `INSERT INTO "User" (id, email, name, password, role, "createdAt", "deletedAt", phone, "refreshToken", "pushToken")
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4, NOW(), NULL, NULL, NULL, NULL)
         ON CONFLICT (email) DO UPDATE SET role = $4, password = $3
         RETURNING email, role`,
        ['admin@puculuxa.ao', 'Administrador Puculuxa', hash, 'ADMIN']
    );

    console.log('✅ Admin criado/actualizado:', res.rows[0]);
    await client.end();
}

main().catch((e) => { console.error('❌', e.message); process.exit(1); });
