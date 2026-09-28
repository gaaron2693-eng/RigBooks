# RigBooks production environment

The Render Blueprint wires most values automatically. These are every environment variable read by the standalone production server.

## Required

| Variable | Set by | Description |
|---|---|---|
| `DATABASE_URL` | `render.yaml` from `rigbooks-postgres` | PostgreSQL connection string. RigBooks applies `deployment/postgres/001_initial.sql` once on startup, under an advisory lock. |
| `SESSION_PEPPER` | Render-generated secret | High-entropy secret used to sign short-lived private receipt, logo, and document URLs. Changing it invalidates outstanding file links but does not delete data. |
| `OPENAI_API_KEY` | You, in the Render setup form | Server-side API key used by Sam the Semi, rate-confirmation image extraction, trucking news/search, weather context, and other bounded AI responses. Never expose it in the client. |

## Optional / platform-provided

| Variable | Default | Description |
|---|---:|---|
| `OPENAI_MODEL` | `gpt-4.1-mini` | OpenAI model used for structured extraction and assistant responses. The model must support structured outputs, images, and web search for all RigBooks features. |
| `MAX_UPLOAD_BYTES` | `18000000` | Maximum accepted HTTP request size in bytes. The default supports the app's base64 image upload limit with JSON overhead. |
| `PORT` | `3000` locally; supplied by Render | Listening port. Render injects this automatically. |
| `NODE_ENV` | `production` in the Docker image | Runtime mode. It is already set by the Dockerfile. |

No Muse/private-artifact runtime token is required. User accounts and sessions are stored in PostgreSQL. Uploaded receipt, document, and logo bytes are also stored in PostgreSQL so they survive stateless web-service restarts.
