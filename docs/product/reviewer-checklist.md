# Reviewer Checklist

## Setup

- Copy .env.example to .env and populate OAuth provider keys.
- Start infrastructure with docker compose up -d.
- Install dependencies with corepack pnpm install.
- Start API with corepack pnpm --filter @revie/api dev.

## API Contract Verification

- Confirm GET /auth/providers returns google, apple, linkedin.
- Confirm POST /auth/session returns accessToken and user object with valid provider token.
- Confirm POST /v1/taxonomy/nodes enforces hierarchy constraints.
- Confirm POST /v1/products creates new product and blocks duplicates.
- Confirm POST /v1/reviews allows one review per user per product.
- Confirm GET /v1/products/:productId/rating-summary reflects posted review.
- Confirm admin endpoints require admin authorization.

## Happy Path Collection

- Import docs/testing/revie-mvp-happy-path.postman_collection.json.
- Import docs/testing/revie-local.postman_environment.json.
- Run requests 1 to 10 in sequence.
- Verify created IDs are captured in collection variables.

## Regression Checks

- Typecheck all workspaces with corepack pnpm -r typecheck.
- Confirm web auth callback stores token in local storage.
- Confirm mobile auth flow launches provider sign-in and returns callback token.
