# Revie MVP Architecture

## Components

- Web app (`apps/web`): public browse/search/read.
- Mobile app (`apps/mobile`): authenticated write flows.
- API (`apps/api`): auth, taxonomy, product, review, moderation endpoints.
- Worker (`apps/worker`): fraud checks, scoring jobs, periodic cleanup.
- PostgreSQL: source of truth for users, hierarchy, products, reviews.
- Redis: queue backend for background jobs.

## Key Flows

1. User signs in via social provider.
2. User finds product via hierarchy/search.
3. If missing, user creates hierarchy node(s) and product.
4. User posts rating + review.
5. Worker recomputes rating summaries and risk signals.
6. Public users consume aggregate rating + review content.

## Anti-Abuse (MVP)

- Per IP and per user rate limits.
- Device fingerprint hash tracking.
- Duplicate text detection.
- Velocity spikes flagged to moderation queue.

## Deployment Topology

- Vercel: web
- Render/Fly: API + worker
- Managed Postgres + managed Redis
- GitHub Actions for CI/CD
