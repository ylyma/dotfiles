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

### Tags
The API is organized into the following tags

| Resource Group | Description |
|----------------|-------------|
| Orders | Order creation, management, and book views |
| Trade | Trade execution and history |
| Asset | Asset definitions and attachments |
| Trading Pairs | Trading pair management |
| Investor | Investor account management |
| Holdings | Asset holdings management |
| Pricing History | Historical pricing data |
| Notices | System announcements |
| Authentication | Login, token management |
| File | File uploads and management |
| Import | Bulk import operations |

### Response Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created successfully |
| 400 | Bad request - validation errors or business rule violations |
| 401 | Unauthorized - invalid or missing credentials |
| 403 | Forbidden - insufficient permissions |
| 404 | Resource not found |
| 500 | Internal server error |

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
