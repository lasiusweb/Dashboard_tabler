# FirstCrop ERP — Agent Instructions

## Project Overview

FirstCrop is a manufacturing ERP system for microbial agricultural products (bio-fertilizers, bio-pesticides, etc.). Built on Tabler dashboard framework with a NestJS API, Prisma ORM, and LangGraph AI agent.

## Architecture

```
Monorepo (pnpm + Turborepo)
├── core/          → @firstcrop/core (Tabler CSS/JS — DO NOT modify unless framework-level change)
├── preview/       → @firstcrop/preview (Astro dashboard pages)
├── docs/          → @firstcrop/docs (Astro documentation)
├── shared/        → @firstcrop/shared (Astro components, UI, data, layouts — imported via @shared alias)
├── packages/
│   ├── api/       → @firstcrop/api (NestJS REST API — port 3002)
│   ├── db/        → @firstcrop/db (Prisma schema + client — import PrismaClient from here)
│   ├── auth/      → @firstcrop/auth (Better Auth — uses @firstcrop/db)
│   └── agent/     → @firstcrop/agent (LangGraph AI agent — uses @firstcrop/db)
├── docker-compose.yml
├── Dockerfile       (Tabler dev)
└── Dockerfile.api   (NestJS API)
```

## Package Manager

- **pnpm** (v11.17.0 pinned via `packageManager` field)
- Run `pnpm install` from repo root
- Never use npm or yarn

## Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all dev servers (Turborepo) |
| `pnpm build` | Build all packages |
| `pnpm check` | Lint + type-check |
| `pnpm lint` | Markdown lint + Prettier check |
| `pnpm type-check` | TypeScript type-check across all packages |
| `pnpm test` | Run all tests (vitest) |
| `cd packages/api && pnpm dev` | Start NestJS API only |
| `cd preview && pnpm dev` | Start Astro preview only |

## Key Conventions

### Prisma Client

- **Always import from `@firstcrop/db`**, never directly from `@prisma/client`
- This ensures a single connection pool across packages

```typescript
import { PrismaClient } from '@firstcrop/db';
```

### API Controllers

- All controllers use DTOs with `class-validator` decorators
- DTOs are in `packages/api/src/dto/`
- The `ValidationPipe` is enabled globally — DTOs are enforced
- Use `@Body() body: CreateXxxDto` not `@Body() body: any`

### Astro Pages

- Pages live in `preview/pages/`
- Shared components: `@shared/components/` or `@shared/ui/`
- Shared layouts: `@shared/layouts/DefaultLayout.astro`
- Data files: `@data/` (alias to `shared/data/`)
- Pages are static HTML output — avoid client-side JS unless necessary

### Naming

- Package names: `@firstcrop/<name>`
- Prisma models: PascalCase (`SalesOrder`, `Batch`)
- API routes: kebab-case (`/api/orders`, `/api/inventory/movements`)
- File names: kebab-case for pages (`manufacturing-batches.astro`), camelCase for TS

### Testing

- Framework: Vitest
- Run: `pnpm test` from root
- Core SCSS tests: `cd core && pnpm run test:scss`
- Core JS tests: `cd core && pnpm run test:js`
- API service tests: `cd packages/api && pnpm test` (unit specs colocated as `*.spec.ts` in `src/modules/`, mock PrismaService)

## Forbidden Paths

- `core/scss/` — framework-level only, require explicit approval
- `core/js/` — framework-level only
- `node_modules/` — never modify
- `.turbo/` — cache directory
- `pnpm-lock.yaml` — only modify via `pnpm install`

## Git Workflow

- Branch: `dev` (default, all work goes here)
- Commits: conventional commits (`feat:`, `fix:`, `chore:`, `docs:`)
- PRs: squash merge to `dev`
- No direct commits to `dev` without review for large changes

## Environment Variables

Copy `.env.example` to `.env` at repo root. Key variables:

- `DATABASE_URL` — PostgreSQL connection string
- `REDIS_URL` — Redis connection string
- `API_PORT` — API port (default: 3002)
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — OAuth

## Docker

- `docker-compose.yml` — full stack (PostgreSQL, Redis, API, Tabler)
- `Dockerfile` — Tabler dev server
- `Dockerfile.api` — NestJS API production build
- Start: `docker compose up`

## Common Pitfalls

1. **Importing PrismaClient directly** → breaks connection pooling. Use `@firstcrop/db`.
2. **Editing core/** → affects the entire framework. Be surgical.
3. **Hardcoded values in API** → use per-entity config (e.g., product GST rate, not 18%).
4. **Missing DTOs** → the ValidationPipe silently skips if no DTO class is provided.
5. **Client-side JS in Astro pages** → defeats static performance. Use `client:*` directives only when needed.
