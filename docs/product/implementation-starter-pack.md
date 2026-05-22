# Revie Starter Pack Runbook

## 1. Monorepo Bootstrap Commands

Run from repository root:

```bash
pnpm install
pnpm dev
```

Run apps individually:

```bash
pnpm --filter @revie/web dev
pnpm --filter @revie/mobile dev
pnpm --filter @revie/api dev
pnpm --filter @revie/worker dev
```

## 2. Database Setup

Apply schema migration using your preferred migration runner, or directly:

```bash
psql "$DATABASE_URL" -f infra/migrations/0001_initial_schema.sql
```

## 3. API Endpoint Starter List

Implemented placeholder endpoints in API scaffold:

- `GET /health`
- `POST /v1/reviews`

Planned contract set is documented in `docs/api/contracts.md`.

## 4. Sprint Board Import

Use the CSV block from `docs/product/sprint-backlog-template.md` and import into Jira or GitHub Projects.

## 5. First Deployment Steps

1. Connect `apps/web` to Vercel.
2. Connect `apps/api` and `apps/worker` to Render/Fly.
3. Provision managed PostgreSQL and Redis.
4. Add env vars in all platforms.
5. Enable GitHub Actions workflows under `.github/workflows`.

## 6. App Store / Play Store Preparation

1. Add privacy policy and terms URLs.
2. Implement account deletion request path.
3. Configure Sign in with Apple for iOS if third-party login is present.
4. Build mobile binaries with Expo EAS.
