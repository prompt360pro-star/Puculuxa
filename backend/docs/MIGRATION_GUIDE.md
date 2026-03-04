# Puculuxa — Guia de Migrations (Prisma)

## Desenvolvimento

Qualquer alteração no `schema.prisma`:

```bash
npx prisma migrate dev --name descricao_da_mudanca
```

## Produção

Aplicar migrations pendentes (sem perda de dados):

```bash
npx prisma migrate deploy
```

## Verificar Estado

```bash
npx prisma migrate status
```

## Reset Completo (⚠️ APAGA DADOS)

```bash
npx prisma migrate reset
```

## Regras

1. **NUNCA** usar `db push` em produção
2. **NUNCA** editar ficheiros de migration manualmente
3. **SEMPRE** dar nome descritivo à migration
4. Testar migration em dev antes de deploy
5. Verificar com `migrate status` antes de commit

## Scripts disponíveis

| Comando | Acção |
|---|---|
| `npm run db:migrate` | Criar e aplicar migration (dev) |
| `npm run db:migrate:prod` | Aplicar migrations pendentes (prod) |
| `npm run db:migrate:status` | Verificar estado das migrations |
| `npm run db:generate` | Regenerar Prisma Client |
| `npm run db:studio` | Abrir Prisma Studio |
| `npm run db:seed` | Executar seed |
| `npm run db:reset` | Reset completo (⚠️ apaga dados) |

## Histórico de Migrations

| Data | Migration | Descrição |
|---|---|---|
| 2026-03-03 | `baseline_full_schema` | Baseline completo — snapshot do schema após FASE 12A |
