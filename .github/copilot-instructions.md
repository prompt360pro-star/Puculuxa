# Copilot / AI Agent Instructions for Puculuxa

This short guide helps an AI coding agent become productive in this monorepo quickly.

- **Repo layout / big picture**: This is a Node.js monorepo with workspaces: `backend`, `web`, `mobile`, and `shared`. The root [package.json](package.json#L1-L80) runs concurrent frontend+backend dev via `npm run dev`.
- **Backend (API)**: NestJS app in [backend/src](backend/src). Entry: [backend/src/main.ts](backend/src/main.ts#L1-L120) — global prefix `api`, CORS configured from `CORS_ORIGINS` env, and a strict `ValidationPipe` (whitelist + forbidNonWhitelisted).
  - Main modules are wired in [backend/src/app.module.ts](backend/src/app.module.ts#L1-L120) — `QuotationModule`, `ProductModule`, `OrderModule`, `AuthModule`, `CommonModule`, `AnalyticsModule`, `FeedbackModule`, and `DatabaseModule` (Prisma).
- **Database**: Prisma schema at [backend/prisma/schema.prisma](backend/prisma/schema.prisma#L1-L120). Datasource is `sqlite` reading `DATABASE_URL`. Seed logic is in [backend/prisma/seed.ts](backend/prisma/seed.ts) (invoked via Prisma CLI).
- **Shared code**: Local workspace package `@puculuxa/shared` (see [shared/package.json](shared/package.json#L1-L40)) contains reusable logic (e.g., `quotationLogic.ts`, tokens). The web and backend depend on this package.

- **How to run (developer flows)**:
  - Full dev (starts backend + web concurrently): `npm run dev` from repo root. (root scripts: [package.json](package.json#L1-L60))
  - Backend only (dev watch): `npm run start:dev --workspace=backend` or use the root `npm run dev:backend`.
  - Web only: `npm run dev --workspace=web` or `npm run dev:web` from root.
  - Prisma: run Prisma CLI from `backend` (`npx prisma migrate` / `npx prisma db seed`) — seed uses `backend/prisma/seed.ts`.
  - Tests: backend uses Jest (`npm run test` in `backend`). E2E config at `backend/test/jest-e2e.json`.

- **Common patterns & conventions**:
  - Modules are organized by feature under `backend/src/<feature>` with `*.module.ts`, `*.controller.ts`, `*.service.ts`, and `dto/` for DTOs (e.g., see `auth/dto`). Follow that structure when adding features.
  - Validation is enforced centrally with `ValidationPipe` — DTOs should use `class-validator` decorators and rely on `whitelist` / `forbidNonWhitelisted` behavior.
  - Authentication uses JWT with `jwt.strategy.ts`, `jwt-auth.guard.ts`, and a `roles.guard.ts` — use these for protected routes.
  - File uploads and media: `cloudinary`, `multer`, and `multer-storage-cloudinary` are used in `common/image.service.ts`.
  - PDF generation util exists in `common/pdf.service.ts` — prefer reusing it rather than adding new low-level PDF libraries.

- **Code-editing guidance (what to change and where)**:
  - Add business logic to `*.service.ts`. Keep controllers slim; controllers map requests to service methods.
  - Add DTOs under `dto/` and ensure tests cover validation rules.
  - When changing the DB schema, update `backend/prisma/schema.prisma` and run Prisma migrate/generate; update seed logic if needed.

- **Integration points & external deps**:
  - Auth: JWT and Passport; see `@nestjs/jwt` and `passport-jwt` usage in `backend/src/auth`.
  - Persistence: Prisma + SQLite locally; `@prisma/client` and `prisma` tools in backend devDependencies.
  - Frontend: Next.js app at `web/` expects API at `/api/*` (backend uses `app.setGlobalPrefix('api')`). CORS origins are configured in `main.ts`.

- **Quick examples**:
  - To call the quotations controller in code, look at `backend/src/quotation/quotation.controller.ts` and its service at `backend/src/quotation/quotation.service.ts`.
  - To understand shared logic usage, open `shared/quotationLogic.ts` and see how `web` and `backend` import `@puculuxa/shared`.

- **Testing & linting**:
  - Backend unit tests: `npm run test` (in `backend`). Jest config is in `backend/package.json`.
  - Linting: `npm run lint` in `backend` and `eslint` in `web`.

If any of the above is unclear or you'd like more examples (e.g., how to run the Prisma seed, or where specific DTOs live), tell me which area to expand and I'll update this file.
