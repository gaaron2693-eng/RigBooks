import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { z } from "zod";

export { z };

export type ActionsModule = Record<string, unknown>;

export type Viewer = {
  authenticated: true;
  shareId: string;
  spaceSlug: string;
  viewerFbid: string;
  ownerFbid: string;
  isOwner: boolean;
  tokenExpiresAt: number;
  tokenId: string;
  displayName?: string;
};

type BatchableDb<TSchema extends Record<string, unknown>> = NodePgDatabase<TSchema> & {
  batch(queries: ReadonlyArray<PromiseLike<unknown>>): Promise<unknown[]>;
};

export type Ctx = {
  db<TSchema extends Record<string, unknown> = Record<string, never>>(): BatchableDb<TSchema>;
  viewer: Viewer | null;
  blobs: {
    put(key: string, data: string | ArrayBuffer | ArrayBufferView | Blob, options?: { contentType?: string; public?: boolean }): Promise<void>;
    getUrl(key: string, options?: { expiresInSeconds?: number; public?: boolean }): Promise<string>;
    delete(key: string): Promise<void>;
  };
  invalidateQueries(): void;
  inference: {
    complete<T extends z.ZodType>(prompt: string, options: { schema: T; images?: Array<{ dataBase64: string; mimeType: "image/jpeg" | "image/png"; filename?: string }> }): Promise<z.infer<T>>;
  };
  tool: {
    web_search(query: string): Promise<unknown>;
    weather(query: string, options?: unknown): Promise<{ content: { text: string; sources: Array<{ title: string; url: string }> } }>;
  };
};

export function defineAction<Req extends z.ZodType, Res extends z.ZodType>(spec: {
  request: Req;
  response: Res;
  handler: (ctx: Ctx, args: z.infer<Req>) => Promise<z.infer<Res>> | z.infer<Res>;
}): typeof spec {
  return spec;
}
