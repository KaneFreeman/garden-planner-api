# Copilot instructions (garden-planner-api)

## Project overview
- NestJS 11 + TypeScript API server.
- MongoDB via Mongoose.
- Swagger is enabled only in development.
- Logging via Winston (console + file).

## Tech stack
- NestJS 11, TypeScript (strict)
- Mongoose for persistence
- Swagger/OpenAPI in dev
- Winston logging

## Package manager
- Use `npm` commands in this repo.
- Do not use `yarn`.

## Source layout
- `src/main.ts`: app bootstrap, logging, CORS, swagger
- `src/app.module.ts`: root module
- Feature modules in `src/` (auth, garden, plant, task, users, etc.)
- Shared utilities in `src/shared/` and `src/util/`

## Runtime config
- See `.env.example` for required values:
  - `MONGO_URL`
  - `API_PORT`
  - `DOMAIN`
  - mail settings (`FROM_EMAIL_*`)
- Docker uses `.env.production` referenced by `docker-compose.yml`.

## Scripts (preferred)
- `npm run start` (dev)
- `npm run start:dev` (watch)
- `npm run start:prod`
- `npm run build` (production build to `dist-prod/`)
- `npm run lint`
- `npm run format`
- `npm run docker:up` / `npm run docker:down` / `npm run docker:restart`

## Formatting and linting
- Prettier with single quotes; trailing commas enabled in `.prettierrc`.
- ESLint with `@typescript-eslint` and Prettier integration.
- Avoid `any` (ESLint enforces this).

## Coding conventions
- Follow NestJS patterns: controller -> service -> module.
- Keep DTOs in `dto/` subfolders; schemas in `schemas/`.
- Prefer dependency injection over manual instantiation.
- Keep logging via Nest/Winston; do not log secrets.

## What not to touch
- `dist/` and `dist-prod/` are build outputs; do not edit them.
