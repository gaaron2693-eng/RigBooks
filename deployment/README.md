# RigRevenue — Render deployment bundle


This folder is the standalone production server plus the already-built RigRevenue browser bundle. It does not require the private Muse artifact runtime.


## Deploy with the Render Blueprint


1. Put this repository in a Git provider supported by Render.
2. In Render, create a **Blueprint** and select the repository.
3. Render reads the root `render.yaml`, creates the `rigbooks` Docker web service and `rigbooks-postgres` managed PostgreSQL database, and generates `SESSION_PEPPER`.
4. Supply `OPENAI_API_KEY` when Render prompts for the secret marked `sync: false`.
5. Deploy. The `/health` endpoint becomes healthy after the database is reachable and the initial migration has completed.


If the free service/database plan is unavailable on the account or region, choose an available plan in Render; no source changes are required.


## What is included


- `client-dist/` — compiled, production browser assets.
- `src/server.ts` — Bun HTTP server, typed action dispatcher, static-file server, signed blob delivery, OpenAI adapter, health check, and migration runner.
- `src/actions.ts` — standalone copy of the complete RigRevenue action layer.
- `src/schema.ts` — Drizzle PostgreSQL schema.
- `postgres/001_initial.sql` — idempotently tracked fresh-database migration containing the full application schema and durable blob table.
- `postgres/schema.sql` — convenient copy of the complete PostgreSQL schema for review or manual provisioning.
- `package.json`, `bun.lock`, `tsconfig.json` — reproducible server build.
- `dist/server.js` and `SHA256SUMS` — prebuilt server bundle and checksums for the main built artifacts.
- Root `Dockerfile`, `render.yaml`, `.dockerignore`, and `ENVIRONMENT.md` — deployment contract.


## Local production test


Create a PostgreSQL database, copy `.env.example` values into your shell, then run:


```bash
bun install --frozen-lockfile
bun run typecheck
bun run build
bun run start
```


The server automatically creates a `schema_migrations` table and applies `postgres/001_initial.sql` only once. Do not re-run the initial SQL manually against a database that has already started successfully.


## Important


The included database starts empty. Existing private-runtime SQLite rows and blob files are not silently copied into PostgreSQL. If production data later needs migration, export it explicitly and handle personal/financial documents through a reviewed transfer process.

Auto-deploy test - 2026-10-03
