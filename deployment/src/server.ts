import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { z } from "zod";
import { Actions } from "./actions";
import * as schema from "./schema";
import type { Ctx } from "./runtime";

const databaseUrl = requiredEnv("DATABASE_URL");
const sessionPepper = requiredEnv("SESSION_PEPPER");
const openAiApiKey = process.env.OPENAI_API_KEY?.trim() || "";
const openAiModel = process.env.OPENAI_MODEL || "gpt-4.1-mini";
const port = Number(process.env.PORT || 3000);
const maxUploadBytes = Number(process.env.MAX_UPLOAD_BYTES || 18_000_000);
const pool = new Pool({ connectionString: databaseUrl, ssl: databaseUrl.includes("localhost") ? false : { rejectUnauthorized: false } });
const drizzleDb = drizzle(pool, { schema });
const db = Object.assign(drizzleDb, { batch: async (queries: Array<PromiseLike<unknown>>) => Promise.all(queries) });
const clientRoot = normalize(join(import.meta.dir, "..", "client-dist"));
const migrationPath = normalize(join(import.meta.dir, "..", "postgres", "001_initial.sql"));

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

async function hmac(value: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(sessionPepper), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return Buffer.from(signature).toString("base64url");
}

async function toBytes(data: string | ArrayBuffer | ArrayBufferView | Blob): Promise<Uint8Array> {
  if (typeof data === "string") return new TextEncoder().encode(data);
  if (data instanceof Blob) return new Uint8Array(await data.arrayBuffer());
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
}

async function callOpenAI(body: unknown): Promise<any> {
  if (!openAiApiKey) throw new Error("AI features are not configured on this server (OPENAI_API_KEY is not set).");
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${openAiApiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => null) as any;
  if (!response.ok) throw new Error(payload?.error?.message || `AI provider returned ${response.status}.`);
  return payload;
}

function responseText(payload: any): string {
  if (typeof payload?.output_text === "string") return payload.output_text;
  const chunks: string[] = [];
  for (const item of payload?.output ?? []) {
    for (const content of item?.content ?? []) if (typeof content?.text === "string") chunks.push(content.text);
  }
  return chunks.join("\n");
}

function responseSources(payload: any): Array<{ title: string; url: string }> {
  const found = new Map<string, string>();
  for (const item of payload?.output ?? []) {
    for (const content of item?.content ?? []) {
      for (const annotation of content?.annotations ?? []) {
        const url = annotation?.url;
        if (typeof url === "string" && /^https:\/\//.test(url)) found.set(url, typeof annotation?.title === "string" ? annotation.title : url);
      }
    }
  }
  return Array.from(found, ([url, title]) => ({ title, url }));
}

const inference: Ctx["inference"] = {
  async complete(prompt, options) {
    const inputContent: Array<Record<string, unknown>> = [{ type: "input_text", text: prompt }];
    for (const image of options.images ?? []) inputContent.push({ type: "input_image", image_url: `data:${image.mimeType};base64,${image.dataBase64}` });
    const jsonSchema = z.toJSONSchema(options.schema, { io: "output" });
    const payload = await callOpenAI({
      model: openAiModel,
      input: [{ role: "user", content: inputContent }],
      text: { format: { type: "json_schema", name: "rigbooks_response", schema: jsonSchema, strict: false } },
    });
    const text = responseText(payload).trim();
    let parsed: unknown;
    try { parsed = JSON.parse(text); } catch { throw new Error("AI provider returned an unreadable response."); }
    return options.schema.parse(parsed);
  },
};

const tools: Ctx["tool"] = {
  async web_search(query) {
    const payload = await callOpenAI({ model: openAiModel, tools: [{ type: "web_search" }], input: query });
    return { text: responseText(payload), sources: responseSources(payload) };
  },
  async weather(query, options) {
    const payload = await callOpenAI({ model: openAiModel, tools: [{ type: "web_search" }], input: `Find current road-weather information for this driver request. Query: ${query}. Location context: ${JSON.stringify(options ?? null)}` });
    return { content: { text: responseText(payload), sources: responseSources(payload) } };
  },
};

const blobs: Ctx["blobs"] = {
  async put(key, data, options) {
    const bytes = await toBytes(data);
    await pool.query(
      `INSERT INTO file_blobs (blob_key, content_type, data, updated_at) VALUES ($1,$2,$3,NOW()) ON CONFLICT (blob_key) DO UPDATE SET content_type=EXCLUDED.content_type, data=EXCLUDED.data, updated_at=NOW()`,
      [key, options?.contentType || "application/octet-stream", Buffer.from(bytes)],
    );
  },
  async getUrl(key, options) {
    const expires = Math.floor(Date.now() / 1000) + Math.min(options?.expiresInSeconds ?? 3600, 86_400);
    const sig = await hmac(`${key}:${expires}`);
    return `/files/${encodeURIComponent(key)}?expires=${expires}&sig=${sig}`;
  },
  async delete(key) { await pool.query("DELETE FROM file_blobs WHERE blob_key=$1", [key]); },
};

const ctx: Ctx = { db: (() => db) as Ctx["db"], viewer: null, blobs, invalidateQueries() {}, inference, tool: tools };

async function migrate(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("SELECT pg_advisory_lock(hashtext('rigbooks-migrations'))");
    await client.query("CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())");
    const name = "001_initial.sql";
    const exists = await client.query("SELECT 1 FROM schema_migrations WHERE name=$1", [name]);
    if (exists.rowCount === 0) {
      const sql = await readFile(migrationPath, "utf8");
      await client.query("BEGIN");
      try { await client.query(sql); await client.query("INSERT INTO schema_migrations(name) VALUES ($1)", [name]); await client.query("COMMIT"); }
      catch (error) { await client.query("ROLLBACK"); throw error; }
    }
  } finally {
    await client.query("SELECT pg_advisory_unlock(hashtext('rigbooks-migrations'))").catch(() => undefined);
    client.release();
  }
}

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
}

async function serveBlob(url: URL): Promise<Response> {
  const key = decodeURIComponent(url.pathname.slice("/files/".length));
  const expires = Number(url.searchParams.get("expires"));
  const sig = url.searchParams.get("sig") || "";
  if (!key || !Number.isFinite(expires) || expires < Date.now() / 1000 || sig !== await hmac(`${key}:${expires}`)) return new Response("Not found", { status: 404 });
  const result = await pool.query<{ content_type: string; data: Buffer }>("SELECT content_type, data FROM file_blobs WHERE blob_key=$1", [key]);
  const row = result.rows[0];
  if (!row) return new Response("Not found", { status: 404 });
  return new Response(row.data, { headers: { "Content-Type": row.content_type, "Cache-Control": "private, max-age=300", "X-Content-Type-Options": "nosniff" } });
}

async function serveStatic(pathname: string): Promise<Response> {
  const requested = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const fullPath = normalize(join(clientRoot, requested));
  const safePath = fullPath.startsWith(clientRoot) ? fullPath : join(clientRoot, "index.html");
  let file = Bun.file(safePath);
  if (!await file.exists()) file = Bun.file(join(clientRoot, "index.html"));
  const mime: Record<string, string> = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".svg": "image/svg+xml", ".woff2": "font/woff2" };
  return new Response(file, { headers: { "Content-Type": mime[extname(file.name || safePath)] || "application/octet-stream", "Cache-Control": requested === "index.html" ? "no-cache" : "public, max-age=31536000, immutable", "Content-Security-Policy": "default-src 'self'; img-src 'self' data: blob: https://tile.openstreetmap.org; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; script-src 'self'; connect-src 'self' https://api.openai.com https://nominatim.openstreetmap.org https://router.project-osrm.org https://valhalla1.openstreetmap.de https://overpass-api.de https://overpass.kumi.systems https://overpass.private.coffee; font-src 'self' data: https://fonts.gstatic.com; frame-ancestors 'self'" } });
}

await migrate();

const server = Bun.serve({
  port,
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/health") {
      try { await pool.query("SELECT 1"); return json({ ok: true }); } catch { return json({ ok: false }, 503); }
    }
    if (url.pathname.startsWith("/files/") && request.method === "GET") return serveBlob(url);
    if (url.pathname === "/actions" && request.method === "POST") {
      const declaredLength = Number(request.headers.get("content-length") || 0);
      if (declaredLength > maxUploadBytes) return json({ error: "Request is too large." }, 413);
      let body: { action?: unknown; args?: unknown };
      try { body = await request.json() as typeof body; } catch { return json({ error: "Invalid JSON request." }, 400); }
      if (typeof body.action !== "string" || !(body.action in Actions)) return json({ error: "Action not found." }, 404);
      const definition = Actions[body.action as keyof typeof Actions] as any;
      const parsed = definition.request.safeParse(body.args ?? {});
      if (!parsed.success) return json({ error: "Request validation failed.", details: z.treeifyError(parsed.error) }, 422);
      try {
        const output = await definition.handler(ctx, parsed.data);
        return json({ data: definition.response.parse(output) });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Request failed.";
        console.error(JSON.stringify({ action: body.action, error: message }));
        const status = /sign in|session|password|account/i.test(message) ? 401 : 500;
        return json({ error: message }, status);
      }
    }
    if (request.method === "GET" || request.method === "HEAD") return serveStatic(url.pathname);
    return new Response("Method not allowed", { status: 405 });
  },
});

console.log(`RigBooks listening on ${server.url}`);
