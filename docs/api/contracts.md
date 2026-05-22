# Revie MVP API Contracts (v1)

Base URL: `/v1`

## Auth

### `GET /auth/providers`
Returns enabled login providers (google, apple, linkedin).

### `POST /auth/session`
Exchanges provider auth token for app session.

### `GET /auth/:provider/start?callbackUri=<url>`
Starts provider OAuth code flow and redirects user to provider login.

### `GET /auth/:provider/callback`
OAuth callback endpoint used by provider redirects; returns app session token via redirect to callbackUri.

Request body:

```json
{
  "provider": "google",
  "idToken": "token-from-provider"
}
```

Response:

```json
{
  "accessToken": "jwt",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "displayName": "Jane Doe"
  }
}
```

## Taxonomy

### `GET /taxonomy/children?parentId=<uuid|null>`
Lists nodes under a parent.

### `POST /taxonomy/nodes`
Creates missing node in hierarchy.

Request body:

```json
{
  "nodeType": "model",
  "name": "Dining Table DT-XL",
  "parentId": "uuid"
}
```

## Products

### `GET /products/search`
Supports keyword and filters.

Query params:
- `q`: text
- `categoryId`
- `brandId`
- `productTypeId`
- `minRating`
- `sort`: `relevance|rating|recent`

### `POST /products`
Creates product when not found.

Request body:

```json
{
  "modelNodeId": "uuid",
  "canonicalName": "Wakefit Dining Table Walnut",
  "modelCode": "WF-DT-4402",
  "metadata": {
    "material": "engineered wood",
    "seats": 4
  }
}
```

## Reviews

### `POST /reviews`
Creates a review for a product (one per user per product).

Request body:

```json
{
  "productId": "uuid",
  "rating": 4,
  "title": "Solid build for the price",
  "body": "Using it for 3 months now. The frame is sturdy and easy to clean..."
}
```

### `GET /products/:productId/reviews`
Returns paginated published reviews.

### `GET /products/:productId/rating-summary`
Returns summary:
- review count
- average rating
- bayesian rating
- star histogram

## Moderation (admin)

### `GET /admin/flags`
List flagged reviews/users by risk score.

### `POST /admin/reviews/:reviewId/hide`
Hide a review from public view.

### `POST /admin/reviews/:reviewId/restore`
Restore hidden review.

### `POST /admin/users/:userId/suspend`
Suspend user from writing reviews.

## Error format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": {}
  }
}
```
