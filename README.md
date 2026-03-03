# Puculuxa — Sistema Operacional de Encomendas Inteligentes

## Quick Start (Docker)

```bash
# 1. Clonar e configurar
git clone <repo>
cd puculuxa
cp backend/.env.example backend/.env
# Editar .env com os valores reais

# 2. Subir tudo
npm run docker:up

# 3. Migrar e semear a base de dados
npm run db:migrate:prod
npm run db:seed:prod

# 4. Aceder
# API: http://localhost:3000
# Admin Dashboard: http://localhost:3001
# Health Check: http://localhost:3000/health
# DB Studio: npx prisma studio (local)
```

## Desenvolvimento Local

```bash
# Backend
cd backend
npm install
cp ../.env.example .env
npm run db:start  # Só o PostgreSQL
npm run db:migrate
npm run db:seed
npm run start:dev

# Web
cd web
npm install
npm run dev

# Mobile
cd mobile
npm install
npx expo start
```
