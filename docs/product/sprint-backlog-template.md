# Revie MVP Sprint Backlog Template

## Sprint 1 (Foundation + Auth + Taxonomy)

### Story R1-1
Title: Social sign-in integration (Google/Apple/LinkedIn)

Acceptance criteria:
- User can sign in using each enabled provider.
- Session token is stored securely.
- Unauthorized users cannot access write endpoints.

### Story R1-2
Title: Taxonomy browse and create

Acceptance criteria:
- User can browse category -> brand -> product type -> model.
- Authenticated user can create missing node.
- Invalid parent/child combinations are rejected.

## Sprint 2 (Products + Reviews)

### Story R2-1
Title: Create product under model

Acceptance criteria:
- Authenticated user can create product details including model code.
- Duplicate product under same model is prevented.

### Story R2-2
Title: Submit and view reviews

Acceptance criteria:
- Rating is limited to 1-5.
- One review per user per product.
- Product page displays summary and review list.

## Sprint 3 (Search + Anti-Abuse)

### Story R3-1
Title: Search with filters

Acceptance criteria:
- Search supports keyword and hierarchy filters.
- No-result state offers create-product CTA for logged-in users.

### Story R3-2
Title: Fraud signal pipeline

Acceptance criteria:
- Rate limit events generate fraud signals.
- Duplicate text and velocity rules flag suspicious reviews.
- Flagged items visible in moderation queue.

## Sprint 4 (Moderation + Release)

### Story R4-1
Title: Moderation dashboard

Acceptance criteria:
- Moderator can hide/restore reviews.
- Moderator can suspend users.
- All moderation actions are audited.

### Story R4-2
Title: Release hardening

Acceptance criteria:
- Staging deploy is automated.
- Production release requires approval.
- Monitoring/alerts active for API, web, worker.

## Import-Friendly CSV (copy to CSV file)

```csv
Issue Type,Summary,Description,Epic,Priority
Story,Social sign-in integration,Google Apple LinkedIn login and session flow,MVP-Foundation,High
Story,Taxonomy browse and create,Hierarchy browse and node create with validation,MVP-Foundation,High
Story,Create product under model,Product creation with duplicate checks,MVP-Reviews,High
Story,Submit and view reviews,Rating and review posting plus product summary,MVP-Reviews,High
Story,Search with filters,Keyword plus hierarchy filters and no result CTA,MVP-Search,Medium
Story,Fraud signal pipeline,Velocity and duplicate checks with flags,MVP-Trust,High
Story,Moderation dashboard,Hide restore review and suspend user with audit,MVP-Moderation,High
Story,Release hardening,Staging prod pipeline and observability,MVP-Release,Medium
```
