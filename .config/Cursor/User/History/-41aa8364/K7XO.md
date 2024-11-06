# hgx-exchange

## Dependencies

- Docker
- node v16 (for development)

## Getting started

```bash
# Install npm dependencies
$ npm ci

# Set environment variables
$ cp .env.sample .env

```

## Dockering (dependencies)

```bash
# Spins up mysql database via docker
$ npm run docker:up-db

# Spins up app and mysql database via docker
$ npm run docker:up-app-with-db
```

## Running the app (when dependencies already running)

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# REPL mode (Refer https://trilon.io/blog/nestjs-9-is-now-available#REPL-read-eval-print-loop-)
$ npm run start:repl

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```
## API Documentation

This project uses Swagger/Redoc for documentation

### Accessing Documentation
- **Swagger UI**: Interactive documentation available at http://localhost:3000/api
- **Swagger JSON**: Download the Swagger JSON file at http://localhost:3000/api-json
- **ReDoc**: Readonly documentation viewer available at http://localhost:3000/redoc  

### Authentication
All API endpoints (except `/auth`) require authentication using one of two methods:
1. API Key authentication:
    - Include your API key in the `apikey` header
    - Manage API keys via `/api-key` endpoints
2. Bearer Token authentication
    - Include a JWT token in the `Authorization` header with the format: `Bearer <token>`
    - Obrain tokens through the authentication endpoints

To authenticate in Swagger UI:
1. Click the "Authorize" button at the top of the page
2. Enter credentials in the corresponding fields
3. Click "Authorize"

To obtain a JWT token, use the authentication endpoints under the "Authentication (Public APIs)" tag.

### Available API Endpoints

| Resource Group | Description | Key Endpoints |
|----------------|-------------|--------------|
| System | System-wide operations | GET / (Health check) |
| Orders | Order creation and management | POST /orders, GET /orders, PATCH /orders/{id}/cancel-order, GET /orders/book/{tradingPairId} |
| Trade | Trade execution and history | POST /trades/manual-trades, GET /trades/{tradingPairId}/price-change, GET /trades |
| Asset | Asset definitions and metadata | POST /assets, GET /assets, PATCH /assets/{id} |
| Trading Pairs | Trading pair configuration | POST /trading-pairs, POST /trading-pairs/bulk, GET /trading-pairs |
| Investor | Investor account management | POST /investors, GET /investors, GET /investors/count |
| Holdings | Asset holdings management | POST /holdings, PATCH /holdings/{id}, GET /holdings |
| Pricing History | Historical pricing data | GET /pricing-history/graph/{id}, POST /pricing-history/recalculate-all |
| Access - Member Firm | Member firm management | POST /member-firm, GET /member-firm, PATCH /member-firm/{id} |
| Access - Representative | Representative management | POST /representative, GET /representative, PATCH /representative/{id} |
| Access - Api Key | API key management | POST /api-key, GET /api-key, DELETE /api-key/{id} |
| Notices | System notifications | POST /notices, GET /notices/banner, GET /notices/slug/{slug} |
| File | File storage operations | POST /file, GET /file, DELETE /file/{id} |
| Bucket | Storage bucket management | POST /bucket, GET /bucket |
| Import | Bulk import operations | POST /import-jobs/orders, GET /import-jobs/orders |
| Jobs | Background process management | GET /jobs/update-expired-order-status, GET /jobs/calculate-pricing-graph |
| Authentication (Public APIs) | Login and token management | POST /auth/login, POST /auth/pre-login, POST /auth/forgot-password |

### Common Query Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| fields | Select specific fields to return | fields=id,name,type |
| filter | Filter resources by field values | filter=isActive||eq||true |
| s | Full-text search across resource | s=abc |
| sort | Sort results by field | sort=createdAt,DESC |
| join | Include related resources | join=investor |
| limit | Limit number of results | limit=25 |
| page | Request specific page | page=2 |
| offset | Offset results by count | offset=25 |
| cache | Reset cache if enabled | cache=1 |

### Common Response Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Resource created successfully |
| 400 | Bad request - validation errors or business rule violations |
| 401 | Unauthorized - invalid or missing credentials |
| 403 | Forbidden - insufficient permissions |
| 404 | Resource not found |
| 500 | Internal server error |

### CSRF Protection
For state-changing operations (POST, PUT, PATCH, DELETE), a CSRF token must be included in the X-CSRF-Token header. Obtain this token from the /auth/csrf endpoint.

### Authorization Rules

The API implements role-based permissions with three primary user types:
- Super Admin: Full access to all resources
- Member Firm: Access to firm's investors and related data
- Member Firm Representative: Access to assigned investors and related data
## Using migration CLI

We are using [typeorm](https://github.com/typeorm/typeorm) to make database life a breeze (can refer to <https://orkhan.gitbook.io/typeorm/docs/using-cli>)

```bash
# Generate empty migration file
$ npm run migration:create src/migrations/migration-name-without-file-extension

# Generate migration file after changing entity(s)
$ npm run migration:generate src/migrations/migration-name-without-file-extension
# After generating file, remove unnecessary lines that were generated and only keep the ones that are relevant to the changes that you made

# Show all migrations and whether they've been run
$ npm run migration:show

# Run all pending migrations
$ npm run typeorm migration:run

# Revert most recently executed migration
$ npm run typeorm migration:revert
```
