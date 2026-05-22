# Revie (The Honest Review)

Monorepo starter for the Revie MVP.

## Apps

- `apps/web`: Public web app (Next.js)
- `apps/mobile`: iOS/Android app (Expo)
- `apps/api`: Backend API (NestJS-style TypeScript scaffold)
- `apps/worker`: Background jobs (fraud checks, score recompute)

## Packages

- `packages/types`: Shared domain and API types
- `packages/validation`: Shared Zod schemas
- `packages/utils`: Shared utility helpers
- `packages/config`: Shared lint/tsconfig presets

## Quick start

1. Install dependencies
   - `pnpm install`
2. Run all apps in dev mode
   - `pnpm dev`
3. Build all packages
   - `pnpm build`

## Included docs

- Architecture notes: `docs/architecture/mvp-architecture.md`
- API contracts: `docs/api/contracts.md`
- Sprint backlog template: `docs/product/sprint-backlog-template.md`
- SQL schema migration: `infra/migrations/0001_initial_schema.sql`

## Notes

This scaffold focuses on MVP speed and clean separation between app layers.
