# RigRevenue Render deployment manifest

- `Dockerfile` — production Bun image and health check.
- `render.yaml` — Render web service plus managed PostgreSQL Blueprint.
- `.dockerignore` — excludes local databases, audit captures, and development dependencies.
- `ENVIRONMENT.md` — exhaustive required and optional environment variable reference.
- `deployment/client-dist/` — built browser application bundle.
- `deployment/src/` — external HTTP server, action dispatcher, production action layer, and PostgreSQL Drizzle schema.
- `deployment/postgres/001_initial.sql` — full fresh-database migration.
- `deployment/package.json`, `deployment/bun.lock`, `deployment/tsconfig.json` — reproducible build inputs.
- `deployment/.env.example` — local configuration template with placeholders only.
- `deployment/README.md` — Render and local deployment steps.

The standalone service preserves the existing email/password account flow, ledger, hourly shifts, driver setup, receipts/documents, maps/routing, truck-service lookup, IFTA, invoices, company profile, Sam, news, and rate-confirmation extraction. Binary uploads are stored in PostgreSQL and served through expiring signed URLs.
