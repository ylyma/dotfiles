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
