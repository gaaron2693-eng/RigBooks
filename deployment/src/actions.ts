import { defineAction, z, type ActionsModule, type Ctx, type Viewer } from "./runtime";
import { and, asc, desc, eq, gte, inArray, isNull, lte, sql } from "drizzle-orm";
import * as schema from "./schema";

const driverTypeSchema = z.enum(["company_driver", "lease_purchase", "owner_operator", "hourly_driver"]);
const vehicleTypeSchema = z.enum(["dump_truck", "cement_mixer", "straight_truck", "hotshot", "tractor_trailer"]);
const payModeSchema = z.enum(["flat", "percentage", "per_mile"]);
const accessRoleSchema = z.enum(["standard", "creator", "tester"]);
const authProviderSchema = z.enum(["google", "apple", "muse", "email"]);
const clientIdSchema = z.string().trim().min(16).max(128);
const emailSchema = z.string().trim().email().max(160);
const passwordSchema = z.string().min(10).max(128);
const hosStatusSchema = z.enum(["off_duty", "sleeper", "driving", "on_duty"]);
const hosEventSchema = z.object({ id: z.number(), status: hosStatusSchema, startedAt: z.string() });
const hosDetailedEventSchema = hosEventSchema.extend({
  createdAt: z.string(),
  annotations: z.array(z.object({ id: z.number(), body: z.string(), createdAt: z.string() })),
  edits: z.array(z.object({ id: z.number(), originalStatus: hosStatusSchema, newStatus: hosStatusSchema, originalStartedAt: z.string(), newStartedAt: z.string(), reason: z.string(), editedBy: z.string(), createdAt: z.string() })),
});
const dvirComponentSchema = z.enum(["service_brakes", "parking_brake", "steering_mechanism", "lighting_reflectors", "tires", "horn", "windshield_wipers", "rear_vision_mirrors", "coupling_devices", "wheels_rims", "emergency_equipment"]);
const dvirDefectSchema = z.object({
  id: z.number(), component: dvirComponentSchema, note: z.string().nullable(), photoUrl: z.string().nullable(),
  repairRequired: z.boolean(), repairedAt: z.string().nullable(), repairSignedBy: z.string().nullable(), repairNote: z.string().nullable(), createdAt: z.string(),
});
const dvirReportSchema = z.object({
  id: z.number(), reportType: z.enum(["pre_trip", "post_trip"]), odometer: z.number(), signedBy: z.string(), noDefects: z.boolean(), createdAt: z.string(), defects: z.array(dvirDefectSchema),
});
const sessionTokenSchema = z.string().regex(/^[a-f0-9]{64}$/);
const samScopeSchema = z.enum([
  "app_help",
  "driver_data",
  "weather",
  "diesel",
  "trip_planning",
  "maintenance",
  "hos",
  "trucking_terms",
  "prayer",
  "courtesy",
  "out_of_scope",
]);
const samResponseSchema = z.object({
  reply: z.string(),
  scope: samScopeSchema,
  sources: z.array(z.object({ title: z.string(), url: z.string().url() })),
});

const categorySchema = z.enum([
  "fuel",
  "tolls",
  "maintenance",
  "insurance",
  "truck_payment",
  "other",
]);

const loadSchema = z.object({
  id: z.number(),
  reference: z.string().nullable(),
  broker: z.string().nullable(),
  origin: z.string(),
  destination: z.string(),
  deliveredOn: z.string(),
  loadedMiles: z.number(),
  deadheadMiles: z.number(),
  totalMiles: z.number(),
  grossPay: z.number(),
  grossPerMile: z.number(),
  payMode: payModeSchema,
  loadGross: z.number().nullable(),
  payPercent: z.number().nullable(),
  perMileRate: z.number().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string(),
});

const expenseSchema = z.object({
  id: z.number(),
  category: categorySchema,
  description: z.string().nullable(),
  expenseDate: z.string(),
  amount: z.number(),
  gallons: z.number().nullable(),
  fuelState: z.string().nullable(),
  receiptUrl: z.string().nullable(),
  createdAt: z.string(),
});

const activitySchema = z.object({
  type: z.enum(["load", "expense", "shift"]),
  id: z.number(),
  date: z.string(),
  title: z.string(),
  detail: z.string(),
  amount: z.number(),
});

const shiftSchema = z.object({
  id: z.number(),
  workDate: z.string(),
  clockInAt: z.string(),
  clockOutAt: z.string().nullable(),
  hours: z.number(),
  notes: z.string().nullable(),
});

const hourlyDaySchema = z.object({
  date: z.string(),
  hours: z.number(),
  regularHours: z.number(),
  overtimeHours: z.number(),
  grossPay: z.number(),
});

const hourlySummarySchema = z.object({
  totalHours: z.number(),
  regularHours: z.number(),
  overtimeHours: z.number(),
  grossPay: z.number(),
  hourlyRate: z.number(),
  openShift: shiftSchema.nullable(),
  days: z.array(hourlyDaySchema),
});

const truckPlaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.enum(["truck_stop", "repair", "rest_area", "cat_scale"]),
  address: z.string().nullable(),
  lat: z.number(),
  lng: z.number(),
  distanceMiles: z.number(),
});

const scannedLoadSchema = z.object({
  origin: z.string().nullable(),
  destination: z.string().nullable(),
  loadedMiles: z.number().nullable(),
  grossPay: z.number().nullable(),
  reference: z.string().nullable(),
  broker: z.string().nullable(),
});

const truckingNewsItemSchema = z.object({
  title: z.string(),
  summary: z.string(),
  category: z.enum(["regulations", "fuel", "rates", "industry"]),
  source: z.string(),
  sourceUrl: z.string().url(),
  publishedLabel: z.string().nullable(),
});

const documentCategorySchema = z.enum(["bol", "insurance", "registration", "other"]);
const invoiceStatusSchema = z.enum(["draft", "sent", "paid"]);
const detentionStatusSchema = z.enum(["active", "pending", "sent", "paid"]);
const detentionClaimSchema = z.object({
  id: z.number(), facilityType: z.enum(["shipper", "receiver"]), facilityName: z.string(),
  brokerName: z.string().nullable(), brokerEmail: z.string().nullable(), loadReference: z.string().nullable(),
  freeMinutes: z.number(), hourlyRate: z.number(), arrivalAt: z.string(),
  arrivalLat: z.number(), arrivalLng: z.number(), arrivalAccuracyMeters: z.number().nullable(),
  departureAt: z.string().nullable(), departureLat: z.number().nullable(), departureLng: z.number().nullable(),
  departureAccuracyMeters: z.number().nullable(), status: detentionStatusSchema,
  totalWaitMinutes: z.number(), billableMinutes: z.number(), billableHours: z.number(), amountOwed: z.number(),
  createdAt: z.string(),
});
const yardEntityTypeSchema = z.enum(["broker", "shipper", "receiver"]);
const yardRatingDetailSchema = z.object({
  detention: z.number().nullable(), payment: z.number().nullable(), honesty: z.number().nullable(),
  wait: z.number().nullable(), treatment: z.number().nullable(),
});
const yardScoreItemSchema = z.object({
  entityType: yardEntityTypeSchema,
  entityName: z.string(),
  ratingCount: z.number(),
  overall: z.number(),
  details: yardRatingDetailSchema,
  myRating: yardRatingDetailSchema.nullable(),
  updatedAt: z.string(),
});
const companyProfileSchema = z.object({
  companyName: z.string(), address: z.string().nullable(), phone: z.string().nullable(),
  email: z.string().nullable(), ein: z.string().nullable(), mcNumber: z.string().nullable(),
  dotNumber: z.string().nullable(), logoUrl: z.string().nullable(),
});
const accountSchema = z.object({
  id: z.number(), displayName: z.string(), email: z.string().nullable(), authProvider: authProviderSchema,
  role: accessRoleSchema, accessLabel: z.string().nullable(), createdAt: z.string(),
});
const driverReplySchema = z.object({
  id: z.number(), postId: z.number(), driverName: z.string(), body: z.string(), createdAt: z.string(),
});
const driverPostSchema = z.object({
  id: z.number(), driverName: z.string(), body: z.string(), createdAt: z.string(), likeCount: z.number(),
  likedByViewer: z.boolean(), replies: z.array(driverReplySchema),
});
const roadRouteSchema = z.object({
  originLabel: z.string(), destinationLabel: z.string(), distanceMiles: z.number(), durationMinutes: z.number(),
  shape: z.array(z.object({ lat: z.number(), lng: z.number() })),
  maneuvers: z.array(z.object({ instruction: z.string(), distanceMiles: z.number(), timeMinutes: z.number() })),
  truckStops: z.array(truckPlaceSchema),
  attribution: z.string(),
});

function viewerIdentity(viewer: Viewer): string {
  return viewer.source === "local" ? `local:${viewer.userId}` : viewer.viewerFbid;
}

function viewerDisplayName(viewer: Viewer | undefined): string | null {
  return viewer?.source === "cloudflare" ? (viewer.displayName ?? null) : null;
}

async function findAccountForViewer(ctx: Ctx, viewer: Viewer): Promise<typeof schema.accounts.$inferSelect | undefined> {
  return (await ctx.db<typeof schema>().select().from(schema.accounts).where(eq(schema.accounts.viewerFbid, viewerIdentity(viewer))).limit(1))[0];
}

async function hashSessionToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return bytesToHex(new Uint8Array(digest));
}

async function issueSession(ctx: Ctx, accountId: number): Promise<string> {
  const token = bytesToHex(crypto.getRandomValues(new Uint8Array(32)));
  await ctx.db<typeof schema>().insert(schema.accountSessions).values({
    accountId,
    sessionTokenHash: await hashSessionToken(token),
  });
  return token;
}

async function findAccountForToken(ctx: Ctx, token: string | undefined): Promise<typeof schema.accounts.$inferSelect | undefined> {
  if (!token || !sessionTokenSchema.safeParse(token).success) return undefined;
  const db = ctx.db<typeof schema>();
  const tokenHash = await hashSessionToken(token);
  const session = (await db.select().from(schema.accountSessions).where(eq(schema.accountSessions.sessionTokenHash, tokenHash)).limit(1))[0];
  if (!session) return undefined;
  const account = (await db.select().from(schema.accounts).where(eq(schema.accounts.id, session.accountId)).limit(1))[0];
  if (account) await db.update(schema.accountSessions).set({ lastUsedAt: new Date() }).where(eq(schema.accountSessions.id, session.id));
  return account;
}

async function requireAccount(ctx: Ctx, sessionToken: string): Promise<typeof schema.accounts.$inferSelect> {
  const row = await findAccountForToken(ctx, sessionToken);
  if (!row) throw new Error("Your RigRevenue session has ended. Sign in again.");
  return row;
}

// Stripe test-mode plans. These are TEST price ids — swap for live price ids at go-live.
const stripeTestPriceByPlan = {
  weekly: "price_1UMGyPLA9b278vpHi1GBC7m9",
  monthly: "price_1UMGyPLA9b278vpH48MWbxmT",
  yearly: "price_1UMGyQLA9b278vpHMo3Q2tUV",
} as const;
const stripeTestPlanByPrice: Record<string, "weekly" | "monthly" | "yearly"> = {
  price_1UMGyPLA9b278vpHi1GBC7m9: "weekly",
  price_1UMGyPLA9b278vpH48MWbxmT: "monthly",
  price_1UMGyQLA9b278vpHMo3Q2tUV: "yearly",
};
const planSchema = z.enum(["weekly", "monthly", "yearly"]);

function stripeSecretKey(): string {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) throw new Error("Stripe payments are not connected yet.");
  if (!key.startsWith("sk_test_")) throw new Error("Stripe is not in test mode.");
  return key;
}

function stripeAuthHeader(key: string): string {
  return `Basic ${Buffer.from(`${key}:`).toString("base64")}`;
}

async function stripeApi(path: string, method: "GET" | "POST", params?: Record<string, string>): Promise<any> {
  const key = stripeSecretKey();
  const response = await fetch(`https://api.stripe.com/v1${path}`, {
    method,
    headers: { Authorization: stripeAuthHeader(key), "Content-Type": "application/x-www-form-urlencoded" },
    body: method === "POST" ? new URLSearchParams(params ?? {}) : undefined,
  });
  const payload = await response.json().catch(() => null) as any;
  if (!response.ok) throw new Error(payload?.error?.message || `Stripe returned ${response.status}.`);
  return payload;
}

async function accountHasProAccess(ctx: Ctx, account: { id: number; role: string }): Promise<boolean> {
  if (account.role !== "standard") return true;
  const row = (await ctx.db<typeof schema>().select().from(schema.stripeSubscriptions).where(eq(schema.stripeSubscriptions.accountId, account.id)).limit(1))[0];
  return !!row && (row.status === "active" || row.status === "trialing");
}

async function getOrCreateStripeCustomer(ctx: Ctx, account: typeof schema.accounts.$inferSelect): Promise<string> {
  const db = ctx.db<typeof schema>();
  const existing = (await db.select().from(schema.stripeSubscriptions).where(eq(schema.stripeSubscriptions.accountId, account.id)).limit(1))[0];
  if (existing?.stripeCustomerId) return existing.stripeCustomerId;
  const params: Record<string, string> = { name: account.displayName, "metadata[accountId]": String(account.id) };
  if (account.email) params.email = account.email;
  const customer = await stripeApi("/customers", "POST", params);
  const customerId = String(customer.id);
  if (existing) await db.update(schema.stripeSubscriptions).set({ stripeCustomerId: customerId, updatedAt: new Date() }).where(eq(schema.stripeSubscriptions.id, existing.id));
  else await db.insert(schema.stripeSubscriptions).values({ accountId: account.id, stripeCustomerId: customerId, status: "none" });
  return customerId;
}

let prePassColumnReady = false;
async function ensurePrePassColumn(ctx: Ctx): Promise<void> {
  if (prePassColumnReady) return;
  try {
    await ctx.db<typeof schema>().run(sql.raw('ALTER TABLE "truck_profiles" ADD COLUMN "has_prepass" integer NOT NULL DEFAULT 0'));
  } catch (error) {
    if (!String(error).toLowerCase().includes("duplicate column")) throw error;
  }
  prePassColumnReady = true;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
}

async function derivePasswordHash(password: string, saltHex: string): Promise<string> {
  const saltPairs = saltHex.match(/.{1,2}/g) ?? [];
  const salt = new Uint8Array(saltPairs.map((pair) => Number.parseInt(pair, 16)));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: 310_000 }, key, 256);
  return bytesToHex(new Uint8Array(bits));
}

function safeEqualHex(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return mismatch === 0;
}

async function moveUnownedLedgerToAccount(ctx: Ctx, accountId: number): Promise<void> {
  const db = ctx.db<typeof schema>();
  await db.batch([
    db.update(schema.loads).set({ accountId }).where(isNull(schema.loads.accountId)),
    db.update(schema.expenses).set({ accountId }).where(isNull(schema.expenses.accountId)),
    db.update(schema.paySettings).set({ accountId }).where(isNull(schema.paySettings.accountId)),
    db.update(schema.iftaEntries).set({ accountId }).where(isNull(schema.iftaEntries.accountId)),
    db.update(schema.invoices).set({ accountId }).where(isNull(schema.invoices.accountId)),
    db.update(schema.documents).set({ accountId }).where(isNull(schema.documents.accountId)),
    db.update(schema.companyProfile).set({ accountId }).where(isNull(schema.companyProfile.accountId)),
  ]);
}

type OverpassElement = {
  type?: string;
  id?: number;
  lat?: number;
  lon?: number;
  center?: { lat?: number; lon?: number };
  tags?: Record<string, string>;
};

function distanceMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const radians = (value: number) => value * Math.PI / 180;
  const dLat = radians(lat2 - lat1);
  const dLng = radians(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(dLng / 2) ** 2;
  return 3958.8 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function cleanOptional(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function stateFromLocation(value: string): string | null {
  const match = value.toUpperCase().match(/(?:,|\s)\s*([A-Z]{2})(?:\s+\d{5}(?:-\d{4})?)?\s*$/);
  return match?.[1] ?? null;
}

function addDays(dateText: string, days: number): string {
  const date = new Date(`${dateText}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

async function hashCompCode(code: string): Promise<string> {
  const normalized = code.trim().toUpperCase();
  const bytes = new TextEncoder().encode(normalized);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, "0")).join("");
}

function decodePolyline6(encoded: string): Array<{ lat: number; lng: number }> {
  const points: Array<{ lat: number; lng: number }> = [];
  let index = 0; let lat = 0; let lng = 0;
  while (index < encoded.length) {
    let shift = 0; let result = 0; let byte = 0;
    do { const code = encoded.charCodeAt(index); index += 1; byte = code - 63; result |= (byte & 31) << shift; shift += 5; } while (byte >= 32 && index < encoded.length);
    lat += (result & 1) ? ~(result >> 1) : result >> 1;
    shift = 0; result = 0;
    do { const code = encoded.charCodeAt(index); index += 1; byte = code - 63; result |= (byte & 31) << shift; shift += 5; } while (byte >= 32 && index < encoded.length);
    lng += (result & 1) ? ~(result >> 1) : result >> 1;
    points.push({ lat: lat / 1e6, lng: lng / 1e6 });
  }
  return points;
}

function generateCompCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  const body = Array.from(bytes, (value) => alphabet[value % alphabet.length] ?? "X").join("");
  return `RIG-${body.slice(0, 5)}-${body.slice(5)}`;
}

function toLoad(row: typeof schema.loads.$inferSelect): z.infer<typeof loadSchema> {
  const loadedMiles = row.loadedMilesTenths / 10;
  const deadheadMiles = row.deadheadMilesTenths / 10;
  const totalMiles = loadedMiles + deadheadMiles;
  const grossPay = row.grossPayCents / 100;
  return {
    id: row.id,
    reference: row.reference,
    broker: row.broker,
    origin: row.origin,
    destination: row.destination,
    deliveredOn: row.deliveredOn,
    loadedMiles,
    deadheadMiles,
    totalMiles,
    grossPay,
    grossPerMile: totalMiles > 0 ? grossPay / totalMiles : 0,
    payMode: row.payMode,
    loadGross: row.loadGrossCents == null ? null : row.loadGrossCents / 100,
    payPercent: row.payPercentBasisPoints == null ? null : row.payPercentBasisPoints / 100,
    perMileRate: row.perMileRateCents == null ? null : row.perMileRateCents / 100,
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
  };
}

function toDetentionClaim(
  row: typeof schema.detentionClaims.$inferSelect,
  now = new Date(),
): z.infer<typeof detentionClaimSchema> {
  const end = row.departureAt ?? now;
  const totalWaitMinutes = Math.max(0, Math.floor((end.getTime() - row.arrivalAt.getTime()) / 60_000));
  const billableMinutes = Math.max(0, totalWaitMinutes - row.freeMinutes);
  return {
    id: row.id,
    facilityType: row.facilityType,
    facilityName: row.facilityName,
    brokerName: row.brokerName,
    brokerEmail: row.brokerEmail,
    loadReference: row.loadReference,
    freeMinutes: row.freeMinutes,
    hourlyRate: row.hourlyRateCents / 100,
    arrivalAt: row.arrivalAt.toISOString(),
    arrivalLat: row.arrivalLatE6 / 1_000_000,
    arrivalLng: row.arrivalLngE6 / 1_000_000,
    arrivalAccuracyMeters: row.arrivalAccuracyMeters,
    departureAt: row.departureAt?.toISOString() ?? null,
    departureLat: row.departureLatE6 == null ? null : row.departureLatE6 / 1_000_000,
    departureLng: row.departureLngE6 == null ? null : row.departureLngE6 / 1_000_000,
    departureAccuracyMeters: row.departureAccuracyMeters,
    status: row.status,
    totalWaitMinutes,
    billableMinutes,
    billableHours: billableMinutes / 60,
    amountOwed: Math.round(billableMinutes * row.hourlyRateCents / 60) / 100,
    createdAt: row.createdAt.toISOString(),
  };
}

function normalizeYardBusinessName(value: string): string {
  return value.trim().toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

async function loadCompanyProfile(ctx: Ctx, sessionToken: string): Promise<z.infer<typeof companyProfileSchema>> {
  const account = await requireAccount(ctx, sessionToken);
  const row = (await ctx.db<typeof schema>().select().from(schema.companyProfile).where(eq(schema.companyProfile.accountId, account.id)).limit(1))[0];
  let logoUrl: string | null = null;
  if (row?.logoBlobKey) {
    try { logoUrl = await ctx.blobs.getUrl(row.logoBlobKey, { expiresInSeconds: 3600 }); } catch { logoUrl = null; }
  }
  return {
    companyName: row?.companyName ?? "", address: row?.address ?? null, phone: row?.phone ?? null,
    email: row?.email ?? null, ein: row?.ein ?? null, mcNumber: row?.mcNumber ?? null,
    dotNumber: row?.dotNumber ?? null, logoUrl,
  };
}

async function toExpense(
  ctx: Ctx,
  row: typeof schema.expenses.$inferSelect,
): Promise<z.infer<typeof expenseSchema>> {
  let receiptUrl: string | null = null;
  if (row.receiptBlobKey) {
    try {
      receiptUrl = await ctx.blobs.getUrl(row.receiptBlobKey, { expiresInSeconds: 3600 });
    } catch {
      receiptUrl = null;
    }
  }
  return {
    id: row.id,
    category: row.category,
    description: row.description,
    expenseDate: row.expenseDate,
    amount: row.amountCents / 100,
    gallons: row.gallonsThousandths == null ? null : row.gallonsThousandths / 1000,
    fuelState: row.fuelState,
    receiptUrl,
    createdAt: row.createdAt.toISOString(),
  };
}

function toShift(row: typeof schema.workShifts.$inferSelect, now = new Date()): z.infer<typeof shiftSchema> {
  const end = row.clockOutAt ?? now;
  const hours = Math.max(0, (end.getTime() - row.clockInAt.getTime()) / 3_600_000);
  return {
    id: row.id,
    workDate: row.workDate,
    clockInAt: row.clockInAt.toISOString(),
    clockOutAt: row.clockOutAt?.toISOString() ?? null,
    hours,
    notes: row.notes,
  };
}

function summarizeHourlyShifts(
  rows: Array<typeof schema.workShifts.$inferSelect>,
  hourlyRateCents: number,
): z.infer<typeof hourlySummarySchema> {
  const now = new Date();
  const completed = rows.filter((row) => row.clockOutAt !== null);
  const openRow = rows.find((row) => row.clockOutAt === null);
  const byDate = new Map<string, number>();
  for (const row of completed) {
    const hours = Math.max(0, ((row.clockOutAt?.getTime() ?? row.clockInAt.getTime()) - row.clockInAt.getTime()) / 3_600_000);
    byDate.set(row.workDate, (byDate.get(row.workDate) ?? 0) + hours);
  }
  let regularRemaining = 40;
  const days = Array.from(byDate.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([date, hours]) => {
    const regularHours = Math.min(regularRemaining, hours);
    const overtimeHours = Math.max(0, hours - regularHours);
    regularRemaining = Math.max(0, regularRemaining - regularHours);
    return {
      date,
      hours,
      regularHours,
      overtimeHours,
      grossPay: (regularHours * hourlyRateCents + overtimeHours * hourlyRateCents * 1.5) / 100,
    };
  });
  return {
    totalHours: days.reduce((sum, day) => sum + day.hours, 0),
    regularHours: days.reduce((sum, day) => sum + day.regularHours, 0),
    overtimeHours: days.reduce((sum, day) => sum + day.overtimeHours, 0),
    grossPay: days.reduce((sum, day) => sum + day.grossPay, 0),
    hourlyRate: hourlyRateCents / 100,
    openShift: openRow ? toShift(openRow, now) : null,
    days,
  };
}

const TRUCK_NEWS_RSS_FEEDS = [
  { url: "https://www.freightwaves.com/feed", source: "FreightWaves" },
  { url: "https://www.truckinginfo.com/rss", source: "Heavy Duty Trucking" },
];

function decodeRssEntities(text: string): string {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_match, digits) => String.fromCharCode(Number(digits)));
}

function rssTagValue(block: string, tag: string): string | null {
  const match = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "i"));
  return match?.[1] ? decodeRssEntities(match[1]).trim() : null;
}

function classifyTruckNewsItem(title: string, summary: string): z.infer<typeof truckingNewsItemSchema>["category"] {
  const text = `${title} ${summary}`.toLowerCase();
  if (/(fmcsa|regulation|mandate|epa|emission|lawmakers|congress|speed limiter|eld|compliance)/.test(text)) return "regulations";
  if (/(diesel|fuel price|gas price|def shortage|per gallon)/.test(text)) return "fuel";
  if (/(spot rate|contract rate|freight rate|tender rejection|tonnage|load board)/.test(text)) return "rates";
  return "industry";
}

async function fetchTruckNewsFromRss(): Promise<z.infer<typeof truckingNewsItemSchema>[]> {
  const items: z.infer<typeof truckingNewsItemSchema>[] = [];
  const seen = new Set<string>();
  for (const feed of TRUCK_NEWS_RSS_FEEDS) {
    if (items.length >= 10) break;
    let xml = "";
    try {
      const response = await fetch(feed.url, {
        headers: { "User-Agent": "RigRevenue/1.0 (trucking news)" },
        signal: AbortSignal.timeout(12000),
      });
      if (!response.ok) continue;
      xml = await response.text();
    } catch {
      continue;
    }
    const blocks = xml.match(/<item(?:\s[^>]*)?>[\s\S]*?<\/item>/gi) ?? [];
    for (const block of blocks) {
      if (items.length >= 10) break;
      const title = rssTagValue(block, "title");
      const link = rssTagValue(block, "link");
      if (!title || !link || seen.has(link)) continue;
      let sourceUrl: string;
      try {
        const parsed = new URL(link);
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") continue;
        sourceUrl = parsed.toString();
      } catch {
        continue;
      }
      seen.add(link);
      const rawSummary = rssTagValue(block, "description") ?? "";
      const summary = rawSummary.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 280)
        || "Read the full story at the source.";
      const pubDate = rssTagValue(block, "pubDate");
      const parsedDate = pubDate ? new Date(pubDate) : null;
      items.push({
        title,
        summary,
        category: classifyTruckNewsItem(title, summary),
        source: feed.source,
        sourceUrl,
        publishedLabel: parsedDate && !Number.isNaN(parsedDate.getTime())
          ? parsedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })
          : null,
      });
    }
  }
  return items;
}

// ---- Market Zone: live USDA reefer rates + AAA diesel prices (no API keys) ----
const USDA_REEFER_URL = "https://agtransport.usda.gov/resource/25pi-t6xr.json?$limit=5000";
const AAA_DIESEL_URL = "https://gasprices.aaa.com/state-gas-price-averages/";

type UsdaReeferRow = {
  date?: string; region?: string; origin?: string; destination?: string;
  distance?: string; commodity?: string; weeklow?: string; weekhigh?: string;
  midpoint?: string; rpm?: string; availability?: string;
};

const MARKET_REGION_LABELS: Record<string, string> = {
  "PNW": "Pacific Northwest",
  "CALIFORNIA": "California",
  "ARIZONA": "Arizona",
  "SOUTHEAST": "Southeast",
  "MID-ATLANTIC": "Mid-Atlantic",
  "MEXICO-TEXAS": "Mexico–Texas border",
};

function marketNum(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function titleCaseMarket(value: string): string {
  const small = new Set(["and", "of", "the", "for", "in", "on", "at", "to", "a", "an"]);
  return value.toLowerCase().split(/(\s+|[-\/])/).map((part, index) => {
    if (/^\s+$/.test(part) || /^[-/]$/.test(part)) return part;
    if (index > 0 && small.has(part)) return part;
    return part.charAt(0).toUpperCase() + part.slice(1);
  }).join("");
}

function shortOrigin(origin: string): string {
  const cleaned = titleCaseMarket(origin.replace(/\s+/g, " ").trim());
  if (cleaned.length <= 46) return cleaned;
  const cut = cleaned.slice(0, 44);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 20 ? lastSpace : 44)}…`;
}

type MarketHeat = "hot" | "warm" | "cold";

function outboundHeat(avgAvail: number | null, avgRpm: number | null): MarketHeat {
  if ((avgAvail != null && avgAvail >= 4.5) || (avgRpm != null && avgRpm >= 5)) return "hot";
  if (avgAvail != null && avgAvail <= 2.5) return "cold";
  return "warm";
}

function inboundHeat(avgRpm: number | null, avgLoad: number | null): MarketHeat {
  if ((avgRpm != null && avgRpm >= 4.5) || (avgLoad != null && avgLoad >= 8000)) return "hot";
  if (avgRpm != null && avgRpm <= 3.2) return "cold";
  return "warm";
}

async function fetchUsdaReeferRows(): Promise<UsdaReeferRow[]> {
  try {
    const response = await fetch(USDA_REEFER_URL, {
      headers: { "User-Agent": "RigRevenue/1.0 (market zone)" },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) return [];
    const data = await response.json() as unknown;
    return Array.isArray(data) ? data as UsdaReeferRow[] : [];
  } catch {
    return [];
  }
}

async function fetchAaaDieselPrices(): Promise<Array<{ state: string; price: number }>> {
  try {
    const response = await fetch(AAA_DIESEL_URL, {
      headers: { "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15" },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) return [];
    const html = await response.text();
    const rows = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) ?? [];
    const prices: Array<{ state: string; price: number }> = [];
    for (const row of rows) {
      const cells = [...row.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((m) => (m[1] ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim());
      if (cells.length < 5) continue;
      const state = cells[0] ?? "";
      const dieselCell = cells[4] ?? "";
      if (!state || /^(state|regular)$/i.test(state)) continue;
      const price = marketNum(dieselCell.replace(/[$,]/g, ""));
      if (price != null && price > 0 && price < 20) prices.push({ state, price: Math.round(price * 100) / 100 });
    }
    const seen = new Set<string>();
    return prices.filter((p) => (seen.has(p.state) ? false : (seen.add(p.state), true)));
  } catch {
    return [];
  }
}

export const Actions = {
  getAccountStatus: defineAction({
    request: z.object({ legacyClientId: clientIdSchema, sessionToken: sessionTokenSchema.optional() }),
    response: z.object({
      authenticated: z.boolean(),
      suggestedName: z.string().nullable(),
      account: accountSchema.nullable(),
      legacyRole: accessRoleSchema,
      sessionToken: sessionTokenSchema.nullable(),
    }),
    async handler(ctx, args) {
      const viewer = ctx.viewer;
      const db = ctx.db<typeof schema>();
      let account = await findAccountForToken(ctx, args.sessionToken);
      let activeToken = account && args.sessionToken ? args.sessionToken : null;
      if (!account && viewer) {
        account = await findAccountForViewer(ctx, viewer);
        if (account) activeToken = await issueSession(ctx, account.id);
      }
      const legacy = (await db.select().from(schema.subscriptionAccess).where(eq(schema.subscriptionAccess.clientId, args.legacyClientId)).limit(1))[0];
      const inheritedRole: z.infer<typeof accessRoleSchema> = viewer?.isOwner ? "creator" : (legacy?.role ?? "standard");
      const inheritedLabel = viewer?.isOwner ? "RigRevenue creator" : (legacy?.label ?? null);
      if (account && account.role === "standard" && inheritedRole !== "standard") {
        await db.update(schema.accounts).set({ role: inheritedRole, accessLabel: inheritedLabel, updatedAt: new Date() }).where(eq(schema.accounts.id, account.id));
        account.role = inheritedRole;
        account.accessLabel = inheritedLabel;
        if (inheritedRole === "creator") await moveUnownedLedgerToAccount(ctx, account.id);
      }
      return {
        authenticated: Boolean(account),
        suggestedName: viewerDisplayName(viewer),
        account: account ? { id: account.id, displayName: account.displayName, email: account.email, authProvider: account.authProvider, role: account.role, accessLabel: account.accessLabel, createdAt: account.createdAt.toISOString() } : null,
        legacyRole: inheritedRole,
        sessionToken: activeToken,
      };
    },
  }),

  createEmailAccount: defineAction({
    request: z.object({
      displayName: z.string().trim().min(2).max(80),
      email: emailSchema,
      password: passwordSchema,
      legacyClientId: clientIdSchema,
    }),
    response: z.object({ account: accountSchema, sessionToken: sessionTokenSchema }),
    async handler(ctx, args) {
      const viewer = ctx.viewer;
      const db = ctx.db<typeof schema>();
      const normalizedEmail = args.email.trim().toLowerCase();
      const existingEmail = (await db.select({ id: schema.accounts.id }).from(schema.accounts).where(eq(schema.accounts.email, normalizedEmail)).limit(1))[0];
      if (existingEmail) throw new Error("An account already uses that email. Sign in instead.");
      const currentAccount = viewer ? await findAccountForViewer(ctx, viewer) : undefined;
      if (currentAccount) throw new Error("You are already signed in.");
      const legacy = (await db.select().from(schema.subscriptionAccess).where(eq(schema.subscriptionAccess.clientId, args.legacyClientId)).limit(1))[0];
      const role: z.infer<typeof accessRoleSchema> = viewer?.isOwner ? "creator" : (legacy?.role ?? "standard");
      const accessLabel = viewer?.isOwner ? "RigRevenue creator" : (legacy?.label ?? null);
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const passwordSalt = bytesToHex(salt);
      const passwordHash = await derivePasswordHash(args.password, passwordSalt);
      const result = await db.insert(schema.accounts).values({
        viewerFbid: `email:${crypto.randomUUID()}`,
        displayName: args.displayName.trim(),
        email: normalizedEmail,
        authProvider: "email",
        passwordHash,
        passwordSalt,
        role,
        accessLabel,
      }).returning();
      const account = result[0];
      if (!account) throw new Error("Could not create your RigRevenue account.");
      const sessionToken = await issueSession(ctx, account.id);
      if (role === "creator") await moveUnownedLedgerToAccount(ctx, account.id);
      ctx.invalidateQueries();
      return { account: { id: account.id, displayName: account.displayName, email: account.email, authProvider: account.authProvider, role: account.role, accessLabel: account.accessLabel, createdAt: account.createdAt.toISOString() }, sessionToken };
    },
  }),

  signInWithEmail: defineAction({
    request: z.object({ email: emailSchema, password: passwordSchema }),
    response: z.object({ account: accountSchema, sessionToken: sessionTokenSchema }),
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      const normalizedEmail = args.email.trim().toLowerCase();
      const account = (await db.select().from(schema.accounts).where(eq(schema.accounts.email, normalizedEmail)).limit(1))[0];
      if (!account?.passwordHash || !account.passwordSalt) throw new Error("Email or password is incorrect.");
      const suppliedHash = await derivePasswordHash(args.password, account.passwordSalt);
      if (!safeEqualHex(account.passwordHash, suppliedHash)) throw new Error("Email or password is incorrect.");
      const sessionToken = await issueSession(ctx, account.id);
      ctx.invalidateQueries();
      return { account: { id: account.id, displayName: account.displayName, email: account.email, authProvider: account.authProvider, role: account.role, accessLabel: account.accessLabel, createdAt: account.createdAt.toISOString() }, sessionToken };
    },
  }),

  signOut: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema.optional() }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      if (args.sessionToken) {
        const tokenHash = await hashSessionToken(args.sessionToken);
        await ctx.db<typeof schema>().delete(schema.accountSessions).where(eq(schema.accountSessions.sessionTokenHash, tokenHash));
      }
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  changePassword: defineAction({
    request: z.object({
      sessionToken: sessionTokenSchema,
      currentPassword: passwordSchema,
      newPassword: passwordSchema,
    }),
    response: z.object({ ok: z.literal(true), sessionToken: sessionTokenSchema }),
    async handler(ctx, args): Promise<{ ok: true; sessionToken: string }> {
      const account = await requireAccount(ctx, args.sessionToken);
      if (account.authProvider !== "email" || !account.passwordHash || !account.passwordSalt) throw new Error("Password changes are only available for email sign-in accounts.");
      const currentHash = await derivePasswordHash(args.currentPassword, account.passwordSalt);
      if (!safeEqualHex(account.passwordHash, currentHash)) throw new Error("Your current password is incorrect.");
      const repeatedHash = await derivePasswordHash(args.newPassword, account.passwordSalt);
      if (safeEqualHex(account.passwordHash, repeatedHash)) throw new Error("Choose a new password that is different from your current password.");
      const replacementSalt = bytesToHex(crypto.getRandomValues(new Uint8Array(16)));
      const replacementHash = await derivePasswordHash(args.newPassword, replacementSalt);
      const db = ctx.db<typeof schema>();
      await db.update(schema.accounts).set({ passwordHash: replacementHash, passwordSalt: replacementSalt, updatedAt: new Date() }).where(eq(schema.accounts.id, account.id));
      await db.delete(schema.accountSessions).where(eq(schema.accountSessions.accountId, account.id));
      const sessionToken = await issueSession(ctx, account.id);
      ctx.invalidateQueries();
      return { ok: true, sessionToken };
    },
  }),

  deleteMyAccount: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      const account = await requireAccount(ctx, args.sessionToken);
      await ctx.db<typeof schema>().delete(schema.accounts).where(eq(schema.accounts.id, account.id));
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  createAccount: defineAction({
    request: z.object({
      displayName: z.string().trim().min(2).max(80),
      email: z.string().trim().email().max(160),
      authProvider: z.enum(["google", "apple"]),
      legacyClientId: clientIdSchema,
    }),
    response: accountSchema,
    async handler(ctx, args) {
      const viewer = ctx.viewer;
      if (!viewer) throw new Error("Sign in to Muse before creating a RigRevenue account.");
      const db = ctx.db<typeof schema>();
      const viewerId = viewerIdentity(viewer);
      const existing = (await db.select().from(schema.accounts).where(eq(schema.accounts.viewerFbid, viewerId)).limit(1))[0];
      if (existing) return { id: existing.id, displayName: existing.displayName, email: existing.email, authProvider: existing.authProvider, role: existing.role, accessLabel: existing.accessLabel, createdAt: existing.createdAt.toISOString() };
      const legacy = (await db.select().from(schema.subscriptionAccess).where(eq(schema.subscriptionAccess.clientId, args.legacyClientId)).limit(1))[0];
      const role: z.infer<typeof accessRoleSchema> = viewer.isOwner ? "creator" : (legacy?.role ?? "standard");
      const accessLabel = viewer.isOwner ? "RigRevenue creator" : (legacy?.label ?? null);
      const result = await db.insert(schema.accounts).values({
        viewerFbid: viewerId,
        displayName: args.displayName.trim(),
        email: args.email.trim().toLowerCase(),
        authProvider: args.authProvider,
        role,
        accessLabel,
      }).returning();
      const account = result[0];
      if (!account) throw new Error("Could not create your RigRevenue account.");
      if (role === "creator") await moveUnownedLedgerToAccount(ctx, account.id);
      ctx.invalidateQueries();
      return { id: account.id, displayName: account.displayName, email: account.email, authProvider: account.authProvider, role: account.role, accessLabel: account.accessLabel, createdAt: account.createdAt.toISOString() };
    },
  }),

  updateAccount: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema, displayName: z.string().trim().min(2).max(80), email: z.string().trim().email().max(160) }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      const account = await requireAccount(ctx, args.sessionToken);
      await ctx.db<typeof schema>().update(schema.accounts).set({ displayName: args.displayName.trim(), email: args.email.trim().toLowerCase(), updatedAt: new Date() }).where(eq(schema.accounts.id, account.id));
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  getSubscriptionAccess: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema, clientId: clientIdSchema }),
    response: z.object({
      role: accessRoleSchema,
      label: z.string().nullable(),
      lifetimePro: z.boolean(),
      proUnlocked: z.boolean(),
      creatorClaimed: z.boolean(),
      earlyAccess: z.boolean(),
    }),
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      const account = await requireAccount(ctx, args.sessionToken);
      const creatorRows = await db.select({ id: schema.accounts.id }).from(schema.accounts).where(eq(schema.accounts.role, "creator")).limit(1);
      return {
        role: account.role,
        label: account.accessLabel,
        lifetimePro: account.role !== "standard",
        proUnlocked: true,
        creatorClaimed: Boolean(creatorRows[0]),
        earlyAccess: account.role === "standard",
      };
    },
  }),

  claimCreatorAccess: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema, clientId: clientIdSchema }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      const db = ctx.db<typeof schema>();
      const account = await requireAccount(ctx, args.sessionToken);
      const creatorRows = await db.select({ id: schema.accounts.id }).from(schema.accounts).where(eq(schema.accounts.role, "creator")).limit(1);
      const existingCreator = creatorRows[0];
      if (existingCreator && existingCreator.id !== account.id) throw new Error("Creator access has already been claimed.");
      await db.update(schema.accounts).set({ role: "creator", accessLabel: "RigRevenue creator", updatedAt: new Date() }).where(eq(schema.accounts.id, account.id));
      const legacyRows = await db.select({ id: schema.subscriptionAccess.id }).from(schema.subscriptionAccess).where(eq(schema.subscriptionAccess.clientId, args.clientId)).limit(1);
      if (!legacyRows[0]) await db.insert(schema.subscriptionAccess).values({ clientId: args.clientId, role: "creator", label: "RigRevenue creator" });
      await db.batch([
        db.update(schema.loads).set({ accountId: account.id }).where(isNull(schema.loads.accountId)),
        db.update(schema.expenses).set({ accountId: account.id }).where(isNull(schema.expenses.accountId)),
        db.update(schema.paySettings).set({ accountId: account.id }).where(isNull(schema.paySettings.accountId)),
        db.update(schema.iftaEntries).set({ accountId: account.id }).where(isNull(schema.iftaEntries.accountId)),
        db.update(schema.invoices).set({ accountId: account.id }).where(isNull(schema.invoices.accountId)),
        db.update(schema.documents).set({ accountId: account.id }).where(isNull(schema.documents.accountId)),
        db.update(schema.companyProfile).set({ accountId: account.id }).where(isNull(schema.companyProfile.accountId)),
      ]);
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  createCompInvite: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema, clientId: clientIdSchema, label: z.string().trim().min(1).max(80) }),
    response: z.object({ code: z.string(), label: z.string() }),
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      const account = await requireAccount(ctx, args.sessionToken);
      if (account.role !== "creator") throw new Error("Only the creator can issue lifetime tester access.");
      const code = generateCompCode();
      const codeHash = await hashCompCode(code);
      await db.insert(schema.compInvites).values({
        codeHash,
        codeHint: code.slice(-5),
        label: args.label.trim(),
        createdByClientId: args.clientId,
      });
      return { code, label: args.label.trim() };
    },
  }),

  redeemCompInvite: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema, clientId: clientIdSchema, code: z.string().trim().min(8).max(40) }),
    response: z.object({ ok: z.literal(true), label: z.string() }),
    async handler(ctx, args): Promise<{ ok: true; label: string }> {
      const db = ctx.db<typeof schema>();
      const account = await requireAccount(ctx, args.sessionToken);
      const codeHash = await hashCompCode(args.code);
      const inviteRows = await db.select().from(schema.compInvites).where(eq(schema.compInvites.codeHash, codeHash)).limit(1);
      const invite = inviteRows[0];
      if (!invite) throw new Error("That tester code is not valid.");
      if (invite.redeemedByClientId && invite.redeemedByClientId !== args.clientId) throw new Error("That tester code has already been used.");
      await db.update(schema.accounts).set({ role: "tester", accessLabel: invite.label, updatedAt: new Date() }).where(eq(schema.accounts.id, account.id));
      const legacyRows = await db.select({ id: schema.subscriptionAccess.id }).from(schema.subscriptionAccess).where(eq(schema.subscriptionAccess.clientId, args.clientId)).limit(1);
      if (!legacyRows[0]) await db.insert(schema.subscriptionAccess).values({ clientId: args.clientId, role: "tester", label: invite.label });
      await db.update(schema.compInvites).set({ redeemedByClientId: args.clientId, redeemedAt: new Date() }).where(eq(schema.compInvites.id, invite.id));
      ctx.invalidateQueries();
      return { ok: true, label: invite.label };
    },
  }),

  getHosState: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema }),
    response: z.object({
      currentStatus: hosStatusSchema,
      events: z.array(hosDetailedEventSchema),
      certifications: z.array(z.object({ logDate: z.string(), signedBy: z.string(), createdAt: z.string() })),
      motionPromptMinutes: z.number(),
      gpsPromptsEnabled: z.boolean(),
      serverNow: z.string(),
    }),
    async handler(ctx, args) {
      const account = await requireAccount(ctx, args.sessionToken);
      const db = ctx.db<typeof schema>();
      const since = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
      const rows = await db.select().from(schema.hosStatusEvents).where(and(eq(schema.hosStatusEvents.accountId, account.id), gte(schema.hosStatusEvents.startedAt, since))).orderBy(asc(schema.hosStatusEvents.startedAt));
      const eventIds = rows.map((row) => row.id);
      const [settingsRows, annotations, edits, certifications] = await Promise.all([
        db.select().from(schema.hosSettings).where(eq(schema.hosSettings.accountId, account.id)).limit(1),
        eventIds.length ? db.select().from(schema.hosEventAnnotations).where(and(eq(schema.hosEventAnnotations.accountId, account.id), inArray(schema.hosEventAnnotations.eventId, eventIds))).orderBy(asc(schema.hosEventAnnotations.createdAt)) : Promise.resolve([]),
        eventIds.length ? db.select().from(schema.hosEventEdits).where(and(eq(schema.hosEventEdits.accountId, account.id), inArray(schema.hosEventEdits.eventId, eventIds))).orderBy(asc(schema.hosEventEdits.createdAt)) : Promise.resolve([]),
        db.select().from(schema.hosDailyCertifications).where(eq(schema.hosDailyCertifications.accountId, account.id)).orderBy(desc(schema.hosDailyCertifications.logDate)).limit(10),
      ]);
      const settings = settingsRows[0];
      return {
        currentStatus: rows[rows.length - 1]?.status ?? "off_duty",
        events: rows.map((row) => ({
          id: row.id, status: row.status, startedAt: row.startedAt.toISOString(), createdAt: row.createdAt.toISOString(),
          annotations: annotations.filter((item) => item.eventId === row.id).map((item) => ({ id: item.id, body: item.body, createdAt: item.createdAt.toISOString() })),
          edits: edits.filter((item) => item.eventId === row.id).map((item) => ({ id: item.id, originalStatus: item.originalStatus, newStatus: item.newStatus, originalStartedAt: item.originalStartedAt.toISOString(), newStartedAt: item.newStartedAt.toISOString(), reason: item.reason, editedBy: item.editedBy, createdAt: item.createdAt.toISOString() })),
        })),
        certifications: certifications.map((item) => ({ logDate: item.logDate, signedBy: item.signedBy, createdAt: item.createdAt.toISOString() })),
        motionPromptMinutes: settings?.motionPromptMinutes ?? 5,
        gpsPromptsEnabled: settings?.gpsPromptsEnabled ?? true,
        serverNow: new Date().toISOString(),
      };
    },
  }),

  changeHosStatus: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema, status: hosStatusSchema }),
    response: z.object({ ok: z.literal(true), event: hosEventSchema }),
    async handler(ctx, args): Promise<{ ok: true; event: z.infer<typeof hosEventSchema> }> {
      const account = await requireAccount(ctx, args.sessionToken);
      const db = ctx.db<typeof schema>();
      const latest = (await db.select().from(schema.hosStatusEvents).where(eq(schema.hosStatusEvents.accountId, account.id)).orderBy(desc(schema.hosStatusEvents.startedAt)).limit(1))[0];
      if (latest?.status === args.status) return { ok: true, event: { id: latest.id, status: latest.status, startedAt: latest.startedAt.toISOString() } };
      const inserted = await db.insert(schema.hosStatusEvents).values({ accountId: account.id, status: args.status, startedAt: new Date() }).returning();
      const event = inserted[0];
      if (!event) throw new Error("Could not save that duty status.");
      ctx.invalidateQueries();
      return { ok: true, event: { id: event.id, status: event.status, startedAt: event.startedAt.toISOString() } };
    },
  }),

  editHosEvent: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema, eventId: z.number().int().positive(), status: hosStatusSchema.exclude(["driving"]), startedAt: z.string().datetime(), reason: z.string().trim().min(3).max(500) }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      const account = await requireAccount(ctx, args.sessionToken);
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.hosStatusEvents).where(eq(schema.hosStatusEvents.accountId, account.id)).orderBy(asc(schema.hosStatusEvents.startedAt));
      const index = rows.findIndex((row) => row.id === args.eventId);
      const event = index >= 0 ? rows[index] : undefined;
      if (!event) throw new Error("That duty-status event was not found.");
      if (event.status === "driving") throw new Error("Drive time is automatically recorded and cannot be edited. You may add an annotation instead. 49 CFR 395.30.");
      const nextStartedAt = new Date(args.startedAt);
      if (Number.isNaN(nextStartedAt.getTime())) throw new Error("Enter a valid start time.");
      const previous = index > 0 ? rows[index - 1] : undefined;
      const next = index + 1 < rows.length ? rows[index + 1] : undefined;
      if (previous && nextStartedAt <= previous.startedAt) throw new Error("Start time must be after the prior duty-status event.");
      if (next && nextStartedAt >= next.startedAt) throw new Error("Start time must be before the next duty-status event.");
      if (nextStartedAt.getTime() > Date.now()) throw new Error("A duty-status event cannot start in the future.");
      const reason = args.reason.trim();
      await db.batch([
        db.insert(schema.hosEventEdits).values({ eventId: event.id, accountId: account.id, originalStatus: event.status, newStatus: args.status, originalStartedAt: event.startedAt, newStartedAt: nextStartedAt, reason, editedBy: account.displayName }),
        db.update(schema.hosStatusEvents).set({ status: args.status, startedAt: nextStartedAt }).where(and(eq(schema.hosStatusEvents.id, event.id), eq(schema.hosStatusEvents.accountId, account.id))),
      ]);
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  annotateHosEvent: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema, eventId: z.number().int().positive(), body: z.string().trim().min(1).max(500) }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      const account = await requireAccount(ctx, args.sessionToken);
      const db = ctx.db<typeof schema>();
      const event = (await db.select({ id: schema.hosStatusEvents.id }).from(schema.hosStatusEvents).where(and(eq(schema.hosStatusEvents.id, args.eventId), eq(schema.hosStatusEvents.accountId, account.id))).limit(1))[0];
      if (!event) throw new Error("That duty-status event was not found.");
      await db.insert(schema.hosEventAnnotations).values({ eventId: event.id, accountId: account.id, body: args.body.trim() });
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  certifyHosLog: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema, logDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), signedBy: z.string().trim().min(2).max(100) }),
    response: z.object({ ok: z.literal(true), createdAt: z.string() }),
    async handler(ctx, args): Promise<{ ok: true; createdAt: string }> {
      const account = await requireAccount(ctx, args.sessionToken);
      const db = ctx.db<typeof schema>();
      const existing = (await db.select().from(schema.hosDailyCertifications).where(and(eq(schema.hosDailyCertifications.accountId, account.id), eq(schema.hosDailyCertifications.logDate, args.logDate))).limit(1))[0];
      if (existing) return { ok: true, createdAt: existing.createdAt.toISOString() };
      const rows = await db.insert(schema.hosDailyCertifications).values({ accountId: account.id, logDate: args.logDate, signedBy: args.signedBy.trim() }).returning();
      const row = rows[0];
      if (!row) throw new Error("Could not certify this log.");
      ctx.invalidateQueries();
      return { ok: true, createdAt: row.createdAt.toISOString() };
    },
  }),

  getDvirState: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema }),
    response: z.object({ reports: z.array(dvirReportSchema), unresolvedPostTripDefects: z.array(dvirDefectSchema) }),
    async handler(ctx, args): Promise<{ reports: Array<z.infer<typeof dvirReportSchema>>; unresolvedPostTripDefects: Array<z.infer<typeof dvirDefectSchema>> }> {
      const account = await requireAccount(ctx, args.sessionToken);
      const db = ctx.db<typeof schema>();
      const reports = await db.select().from(schema.dvirReports).where(eq(schema.dvirReports.accountId, account.id)).orderBy(desc(schema.dvirReports.createdAt)).limit(50);
      const reportIds = reports.map((report) => report.id);
      const defects = reportIds.length ? await db.select().from(schema.dvirDefects).where(and(eq(schema.dvirDefects.accountId, account.id), inArray(schema.dvirDefects.reportId, reportIds))).orderBy(asc(schema.dvirDefects.createdAt)) : [];
      const postIds = new Set(reports.filter((report) => report.reportType === "post_trip").map((report) => report.id));
      const serializeDefect = async (defect: typeof schema.dvirDefects.$inferSelect): Promise<z.infer<typeof dvirDefectSchema>> => ({
        id: defect.id, component: dvirComponentSchema.parse(defect.component), note: defect.note,
        photoUrl: defect.photoBlobKey ? await ctx.blobs.getUrl(defect.photoBlobKey, { expiresInSeconds: 3600 }) : null,
        repairRequired: defect.repairRequired, repairedAt: defect.repairedAt?.toISOString() ?? null,
        repairSignedBy: defect.repairSignedBy, repairNote: defect.repairNote, createdAt: defect.createdAt.toISOString(),
      });
      const reportResults = await Promise.all(reports.map(async (report) => ({
        id: report.id, reportType: report.reportType, odometer: report.odometerTenths / 10, signedBy: report.signedBy, noDefects: report.noDefects, createdAt: report.createdAt.toISOString(),
        defects: await Promise.all(defects.filter((defect) => defect.reportId === report.id).map(serializeDefect)),
      })));
      const unresolvedPostTripDefects = await Promise.all(defects.filter((defect) => postIds.has(defect.reportId) && defect.repairRequired && !defect.repairedAt).map(serializeDefect));
      return { reports: reportResults, unresolvedPostTripDefects };
    },
  }),

  createDvirReport: defineAction({
    request: z.object({
      sessionToken: sessionTokenSchema, reportType: z.enum(["pre_trip", "post_trip"]), odometer: z.number().finite().min(0).max(10000000), signedBy: z.string().trim().min(2).max(100), noDefects: z.boolean(),
      defects: z.array(z.object({ component: dvirComponentSchema, note: z.string().trim().max(500).optional(), photoDataBase64: z.string().max(12_000_000).optional(), photoMimeType: z.enum(["image/jpeg", "image/png"]).optional() })).max(11),
    }),
    response: z.object({ id: z.number(), createdAt: z.string() }),
    async handler(ctx, args) {
      const account = await requireAccount(ctx, args.sessionToken);
      if (args.noDefects !== (args.defects.length === 0)) throw new Error("Choose All good or select each defect found.");
      const db = ctx.db<typeof schema>();
      const reportRows = await db.insert(schema.dvirReports).values({ accountId: account.id, reportType: args.reportType, odometerTenths: Math.round(args.odometer * 10), signedBy: args.signedBy.trim(), noDefects: args.noDefects }).returning();
      const report = reportRows[0];
      if (!report) throw new Error("Could not save the inspection report.");
      for (const defect of args.defects) {
        let photoBlobKey: string | null = null;
        if (defect.photoDataBase64 && defect.photoMimeType) {
          const bytes = Buffer.from(defect.photoDataBase64, "base64");
          if (bytes.byteLength > 8_000_000) throw new Error("A defect photo is too large.");
          const ext = defect.photoMimeType === "image/png" ? "png" : "jpg";
          photoBlobKey = `dvir/${report.id}/${crypto.randomUUID()}.${ext}`;
          await ctx.blobs.put(photoBlobKey, bytes, { contentType: defect.photoMimeType });
        }
        await db.insert(schema.dvirDefects).values({ reportId: report.id, accountId: account.id, component: defect.component, note: defect.note?.trim() || null, photoBlobKey, repairRequired: args.reportType === "post_trip" });
      }
      ctx.invalidateQueries();
      return { id: report.id, createdAt: report.createdAt.toISOString() };
    },
  }),

  signOffDvirRepairs: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema, defectIds: z.array(z.number().int().positive()).min(1).max(20), signedBy: z.string().trim().min(2).max(100), note: z.string().trim().min(2).max(500) }),
    response: z.object({ ok: z.literal(true), repairedAt: z.string() }),
    async handler(ctx, args): Promise<{ ok: true; repairedAt: string }> {
      const account = await requireAccount(ctx, args.sessionToken);
      const db = ctx.db<typeof schema>();
      const defects = await db.select().from(schema.dvirDefects).where(and(eq(schema.dvirDefects.accountId, account.id), inArray(schema.dvirDefects.id, args.defectIds)));
      if (defects.length !== new Set(args.defectIds).size || defects.some((item) => !item.repairRequired || item.repairedAt)) throw new Error("One or more defects cannot be signed off.");
      const repairedAt = new Date();
      await db.update(schema.dvirDefects).set({ repairedAt, repairSignedBy: args.signedBy.trim(), repairNote: args.note.trim() }).where(and(eq(schema.dvirDefects.accountId, account.id), inArray(schema.dvirDefects.id, args.defectIds)));
      ctx.invalidateQueries();
      return { ok: true, repairedAt: repairedAt.toISOString() };
    },
  }),

  saveHosSettings: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema, motionPromptMinutes: z.number().int().min(1).max(30), gpsPromptsEnabled: z.boolean() }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      const account = await requireAccount(ctx, args.sessionToken);
      const db = ctx.db<typeof schema>();
      const existing = (await db.select({ id: schema.hosSettings.id }).from(schema.hosSettings).where(eq(schema.hosSettings.accountId, account.id)).limit(1))[0];
      const values = { accountId: account.id, motionPromptMinutes: args.motionPromptMinutes, gpsPromptsEnabled: args.gpsPromptsEnabled, updatedAt: new Date() };
      if (existing) await db.update(schema.hosSettings).set(values).where(eq(schema.hosSettings.id, existing.id));
      else await db.insert(schema.hosSettings).values(values);
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  getPaySettings: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema,}),
    response: z.object({
      driverType: driverTypeSchema,
      vehicleType: vehicleTypeSchema.nullable(),
      hourlyRate: z.number(),
      payMode: payModeSchema,
      defaultPayPercent: z.number(),
      defaultPerMile: z.number(),
      weeklyTruckPayment: z.number(),
      weeklyMaintenanceEscrow: z.number(),
      weeklyInsurance: z.number(),
      weeklyOtherDeductions: z.number(),
      configured: z.boolean(),
    }),
    async handler(ctx, args) {
      const account = await requireAccount(ctx, args.sessionToken);
      const rows = await ctx.db<typeof schema>().select().from(schema.paySettings).where(eq(schema.paySettings.accountId, account.id)).limit(1);
      const settings = rows[0];
      if (!settings) {
        return { driverType: "owner_operator" as const, vehicleType: null, hourlyRate: 0, payMode: "flat" as const, defaultPayPercent: 100, defaultPerMile: 0, weeklyTruckPayment: 0, weeklyMaintenanceEscrow: 0, weeklyInsurance: 0, weeklyOtherDeductions: 0, configured: false };
      }
      return {
        driverType: settings.driverType,
        vehicleType: settings.vehicleType,
        hourlyRate: settings.hourlyRateCents / 100,
        payMode: settings.payMode,
        defaultPayPercent: settings.defaultPayPercentBasisPoints / 100,
        defaultPerMile: settings.defaultPerMileCents / 100,
        weeklyTruckPayment: settings.weeklyTruckPaymentCents / 100,
        weeklyMaintenanceEscrow: settings.weeklyMaintenanceEscrowCents / 100,
        weeklyInsurance: settings.weeklyInsuranceCents / 100,
        weeklyOtherDeductions: settings.weeklyOtherDeductionsCents / 100,
        configured: true,
      };
    },
  }),

  savePaySettings: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema,
      driverType: driverTypeSchema,
      vehicleType: vehicleTypeSchema.nullable(),
      hourlyRate: z.number().finite().min(0).max(1000),
      payMode: payModeSchema,
      defaultPayPercent: z.number().finite().positive().max(100),
      defaultPerMile: z.number().finite().min(0).max(100),
      weeklyTruckPayment: z.number().finite().min(0).max(100000),
      weeklyMaintenanceEscrow: z.number().finite().min(0).max(100000),
      weeklyInsurance: z.number().finite().min(0).max(100000),
      weeklyOtherDeductions: z.number().finite().min(0).max(100000),
      fuelCostPerMile: z.number().finite().min(0).max(100),
      maintenanceCostPerMile: z.number().finite().min(0).max(100),
      insuranceCostPerMile: z.number().finite().min(0).max(100),
      truckCostPerMile: z.number().finite().min(0).max(100),
      otherCostPerMile: z.number().finite().min(0).max(100),
      factoringFeePercent: z.number().finite().min(0).max(25),
    }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      const db = ctx.db<typeof schema>();
      const account = await requireAccount(ctx, args.sessionToken);
      if (args.driverType === "hourly_driver" && (!args.vehicleType || args.hourlyRate <= 0)) {
        throw new Error("Choose a vehicle type and enter an hourly rate.");
      }
      const existing = await db.select({ id: schema.paySettings.id }).from(schema.paySettings).where(eq(schema.paySettings.accountId, account.id)).limit(1);
      const values = {
        accountId: account.id,
        driverType: args.driverType,
        vehicleType: args.driverType === "hourly_driver" ? args.vehicleType : null,
        hourlyRateCents: args.driverType === "hourly_driver" ? Math.round(args.hourlyRate * 100) : 0,
        payMode: args.payMode,
        defaultPayPercentBasisPoints: Math.round(args.defaultPayPercent * 100),
        defaultPerMileCents: Math.round(args.defaultPerMile * 100),
        weeklyTruckPaymentCents: Math.round(args.weeklyTruckPayment * 100),
        weeklyMaintenanceEscrowCents: Math.round(args.weeklyMaintenanceEscrow * 100),
        weeklyInsuranceCents: Math.round(args.weeklyInsurance * 100),
        weeklyOtherDeductionsCents: Math.round(args.weeklyOtherDeductions * 100),
        fuelCostPerMileCents: Math.round(args.fuelCostPerMile * 100),
        maintenanceCostPerMileCents: Math.round(args.maintenanceCostPerMile * 100),
        insuranceCostPerMileCents: Math.round(args.insuranceCostPerMile * 100),
        truckCostPerMileCents: Math.round(args.truckCostPerMile * 100),
        otherCostPerMileCents: Math.round(args.otherCostPerMile * 100),
        factoringFeeBasisPoints: Math.round(args.factoringFeePercent * 100),
        updatedAt: new Date(),
      };
      if (existing[0]) {
        await db.update(schema.paySettings).set(values).where(eq(schema.paySettings.id, existing[0].id));
      } else {
        await db.insert(schema.paySettings).values(values);
      }
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  getHourlyWeek: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema, weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }),
    response: z.object({ summary: hourlySummarySchema, shifts: z.array(shiftSchema) }),
    async handler(ctx, args) {
      const account = await requireAccount(ctx, args.sessionToken);
      const db = ctx.db<typeof schema>();
      const pay = (await db.select().from(schema.paySettings).where(eq(schema.paySettings.accountId, account.id)).limit(1))[0];
      const weekEnd = addDays(args.weekStart, 6);
      const rows = await db.select().from(schema.workShifts)
        .where(and(eq(schema.workShifts.accountId, account.id), gte(schema.workShifts.workDate, args.weekStart), lte(schema.workShifts.workDate, weekEnd)))
        .orderBy(desc(schema.workShifts.clockInAt));
      return { summary: summarizeHourlyShifts(rows, pay?.hourlyRateCents ?? 0), shifts: rows.map((row) => toShift(row)) };
    },
  }),

  clockIn: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema, workDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), notes: z.string().trim().max(240).optional() }),
    response: z.object({ shift: shiftSchema }),
    async handler(ctx, args) {
      const account = await requireAccount(ctx, args.sessionToken);
      const db = ctx.db<typeof schema>();
      const pay = (await db.select().from(schema.paySettings).where(eq(schema.paySettings.accountId, account.id)).limit(1))[0];
      if (pay?.driverType !== "hourly_driver") throw new Error("Switch your pay profile to Hourly driver before clocking in.");
      const open = (await db.select().from(schema.workShifts).where(and(eq(schema.workShifts.accountId, account.id), isNull(schema.workShifts.clockOutAt))).limit(1))[0];
      if (open) throw new Error("You already have an open shift.");
      const row = (await db.insert(schema.workShifts).values({ accountId: account.id, workDate: args.workDate, clockInAt: new Date(), notes: cleanOptional(args.notes) }).returning())[0];
      if (!row) throw new Error("Could not start your shift.");
      ctx.invalidateQueries();
      return { shift: toShift(row) };
    },
  }),

  clockOut: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema }),
    response: z.object({ shift: shiftSchema }),
    async handler(ctx, args) {
      const account = await requireAccount(ctx, args.sessionToken);
      const db = ctx.db<typeof schema>();
      const open = (await db.select().from(schema.workShifts).where(and(eq(schema.workShifts.accountId, account.id), isNull(schema.workShifts.clockOutAt))).orderBy(desc(schema.workShifts.clockInAt)).limit(1))[0];
      if (!open) throw new Error("There is no open shift to end.");
      const endedAt = new Date();
      await db.update(schema.workShifts).set({ clockOutAt: endedAt }).where(eq(schema.workShifts.id, open.id));
      ctx.invalidateQueries();
      return { shift: toShift({ ...open, clockOutAt: endedAt }) };
    },
  }),

  createManualShift: defineAction({
    request: z.object({
      sessionToken: sessionTokenSchema,
      workDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      clockInAt: z.string().datetime(),
      clockOutAt: z.string().datetime(),
      notes: z.string().trim().max(240).optional(),
    }),
    response: z.object({ shift: shiftSchema }),
    async handler(ctx, args) {
      const account = await requireAccount(ctx, args.sessionToken);
      const start = new Date(args.clockInAt);
      const end = new Date(args.clockOutAt);
      const hours = (end.getTime() - start.getTime()) / 3_600_000;
      if (!Number.isFinite(hours) || hours <= 0 || hours > 24) throw new Error("Clock-out must be after clock-in and no more than 24 hours later.");
      const row = (await ctx.db<typeof schema>().insert(schema.workShifts).values({ accountId: account.id, workDate: args.workDate, clockInAt: start, clockOutAt: end, notes: cleanOptional(args.notes) }).returning())[0];
      if (!row) throw new Error("Could not save that shift.");
      ctx.invalidateQueries();
      return { shift: toShift(row) };
    },
  }),

  deleteShift: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema, id: z.number().int().positive() }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      const account = await requireAccount(ctx, args.sessionToken);
      await ctx.db<typeof schema>().delete(schema.workShifts).where(and(eq(schema.workShifts.id, args.id), eq(schema.workShifts.accountId, account.id)));
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  getDashboard: defineAction({ 
    request: z.object({ sessionToken: sessionTokenSchema, fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable() }),
    response: z.object({
      revenue: z.number(),
      expenses: z.number(),
      net: z.number(),
      totalMiles: z.number(),
      profitPerMile: z.number(),
      loadCount: z.number(),
      grossSettlement: z.number(),
      weeklyDeductions: z.object({ truckPayment: z.number(), maintenanceEscrow: z.number(), insurance: z.number(), other: z.number(), total: z.number() }),
      netTakeHome: z.number(),
      recent: z.array(activitySchema),
    }),
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      const account = await requireAccount(ctx, args.sessionToken);
      const loadRows = args.fromDate
        ? await db.select().from(schema.loads).where(and(eq(schema.loads.accountId, account.id), gte(schema.loads.deliveredOn, args.fromDate)))
        : await db.select().from(schema.loads).where(eq(schema.loads.accountId, account.id));
      const expenseRows = args.fromDate
        ? await db.select().from(schema.expenses).where(and(eq(schema.expenses.accountId, account.id), gte(schema.expenses.expenseDate, args.fromDate)))
        : await db.select().from(schema.expenses).where(eq(schema.expenses.accountId, account.id));
      const payRows = await db.select().from(schema.paySettings).where(eq(schema.paySettings.accountId, account.id)).limit(1);

      const revenueCents = loadRows.reduce((sum, row) => sum + row.grossPayCents, 0);
      const expenseCents = expenseRows.reduce((sum, row) => sum + row.amountCents, 0);
      const totalMilesTenths = loadRows.reduce(
        (sum, row) => sum + row.loadedMilesTenths + row.deadheadMilesTenths,
        0,
      );
      const totalMiles = totalMilesTenths / 10;
      const net = (revenueCents - expenseCents) / 100;
      const pay = payRows[0];
      const truckPayment = (pay?.weeklyTruckPaymentCents ?? 0) / 100;
      const maintenanceEscrow = (pay?.weeklyMaintenanceEscrowCents ?? 0) / 100;
      const insurance = (pay?.weeklyInsuranceCents ?? 0) / 100;
      const other = (pay?.weeklyOtherDeductionsCents ?? 0) / 100;
      const deductionTotal = truckPayment + maintenanceEscrow + insurance + other;
      const grossSettlement = revenueCents / 100;
      const recent: z.infer<typeof activitySchema>[] = [
        ...loadRows.map((row) => ({
          type: "load" as const,
          id: row.id,
          date: row.deliveredOn,
          title: `${row.origin} → ${row.destination}`,
          detail: row.reference ? `Load ${row.reference}` : `${(row.loadedMilesTenths + row.deadheadMilesTenths) / 10} mi`,
          amount: row.grossPayCents / 100,
        })),
        ...expenseRows.map((row) => ({
          type: "expense" as const,
          id: row.id,
          date: row.expenseDate,
          title: row.description || row.category.replace("_", " "),
          detail: row.category.replace("_", " "),
          amount: -(row.amountCents / 100),
        })),
      ]
        .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)
        .slice(0, 8);

      return {
        revenue: revenueCents / 100,
        expenses: expenseCents / 100,
        net,
        totalMiles,
        profitPerMile: totalMiles > 0 ? net / totalMiles : 0,
        loadCount: loadRows.length,
        grossSettlement,
        weeklyDeductions: { truckPayment, maintenanceEscrow, insurance, other, total: deductionTotal },
        netTakeHome: grossSettlement - deductionTotal,
        recent,
      };
    },
  }),

  listLoads: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema, limit: z.number().int().positive().max(250).default(100) }),
    response: z.object({ loads: z.array(loadSchema) }),
    async handler(ctx, args) {
      const account = await requireAccount(ctx, args.sessionToken);
      const rows = await ctx
        .db<typeof schema>()
        .select()
        .from(schema.loads)
        .where(eq(schema.loads.accountId, account.id))
        .orderBy(desc(schema.loads.deliveredOn), desc(schema.loads.id))
        .limit(args.limit);
      return { loads: rows.map(toLoad) };
    },
  }),

  createLoad: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema,
      reference: z.string().max(80).optional(),
      broker: z.string().max(120).optional(),
      origin: z.string().trim().min(2).max(120),
      destination: z.string().trim().min(2).max(120),
      deliveredOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      loadedMiles: z.number().finite().positive().max(100000),
      deadheadMiles: z.number().finite().min(0).max(100000).default(0),
      payMode: payModeSchema.default("flat"),
      grossPay: z.number().finite().positive().max(10000000).optional(),
      loadGross: z.number().finite().positive().max(10000000).optional(),
      payPercent: z.number().finite().positive().max(100).optional(),
      perMileRate: z.number().finite().positive().max(100).optional(),
      notes: z.string().max(1000).optional(),
    }),
    response: z.object({ id: z.number() }),
    async handler(ctx, args) {
      const loadGrossCents = args.loadGross == null ? null : Math.round(args.loadGross * 100);
      const payPercentBasisPoints = args.payPercent == null ? null : Math.round(args.payPercent * 100);
      const perMileRateCents = args.perMileRate == null ? null : Math.round(args.perMileRate * 100);
      const grossPayCents = args.payMode === "percentage"
        ? (loadGrossCents != null && payPercentBasisPoints != null ? Math.round(loadGrossCents * payPercentBasisPoints / 10000) : 0)
        : args.payMode === "per_mile"
          ? (perMileRateCents != null ? Math.round((args.loadedMiles + args.deadheadMiles) * perMileRateCents) : 0)
          : Math.round((args.grossPay ?? 0) * 100);
      if (grossPayCents <= 0) throw new Error("Enter the load pay details.");
      const db = ctx.db<typeof schema>();
      const account = await requireAccount(ctx, args.sessionToken);
      const result = await db.insert(schema.loads).values({
        accountId: account.id,
        reference: cleanOptional(args.reference),
        broker: cleanOptional(args.broker),
        origin: args.origin.trim(),
        destination: args.destination.trim(),
        deliveredOn: args.deliveredOn,
        loadedMilesTenths: Math.round(args.loadedMiles * 10),
        deadheadMilesTenths: Math.round(args.deadheadMiles * 10),
        grossPayCents,
        payMode: args.payMode,
        loadGrossCents: args.payMode === "percentage" ? loadGrossCents : null,
        payPercentBasisPoints: args.payMode === "percentage" ? payPercentBasisPoints : null,
        perMileRateCents: args.payMode === "per_mile" ? perMileRateCents : null,
        notes: cleanOptional(args.notes),
      }).returning({ id: schema.loads.id });
      const inserted = result[0];
      if (!inserted) throw new Error("Could not save the load.");
      const originState = stateFromLocation(args.origin);
      const destinationState = stateFromLocation(args.destination);
      await db.insert(schema.iftaEntries).values({
        accountId: account.id,
        loadId: inserted.id,
        stateCode: originState && originState === destinationState ? originState : "UN",
        milesTenths: Math.round((args.loadedMiles + args.deadheadMiles) * 10),
        gallonsThousandths: 0,
        source: "load",
        entryDate: args.deliveredOn,
      });
      ctx.invalidateQueries();
      return { id: inserted.id };
    },
  }),

  listExpenses: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema, limit: z.number().int().positive().max(250).default(100) }),
    response: z.object({ expenses: z.array(expenseSchema) }),
    async handler(ctx, args) {
      const account = await requireAccount(ctx, args.sessionToken);
      const rows = await ctx
        .db<typeof schema>()
        .select()
        .from(schema.expenses)
        .where(eq(schema.expenses.accountId, account.id))
        .orderBy(desc(schema.expenses.expenseDate), desc(schema.expenses.id))
        .limit(args.limit);
      return { expenses: await Promise.all(rows.map((row) => toExpense(ctx, row))) };
    },
  }),

  createExpense: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema,
      category: categorySchema,
      description: z.string().max(160).optional(),
      expenseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      amount: z.number().finite().positive().max(10000000),
      gallons: z.number().finite().positive().max(10000).optional(),
      fuelState: z.string().trim().regex(/^[A-Za-z]{2}$/).optional(),
      receiptDataBase64: z.string().max(16_000_000).optional(),
      receiptMimeType: z.enum(["image/jpeg", "image/png", "image/webp"]).optional(),
    }),
    response: z.object({ id: z.number() }),
    async handler(ctx, args) {
      let receiptBlobKey: string | null = null;
      if (args.receiptDataBase64 && args.receiptMimeType) {
        const bytes = Buffer.from(args.receiptDataBase64, "base64");
        if (bytes.byteLength > 10_000_000) throw new Error("Receipt image is too large.");
        const extension = args.receiptMimeType === "image/png" ? "png" : args.receiptMimeType === "image/webp" ? "webp" : "jpg";
        receiptBlobKey = `receipts/${crypto.randomUUID()}.${extension}`;
        await ctx.blobs.put(receiptBlobKey, bytes, { contentType: args.receiptMimeType });
      }

      const account = await requireAccount(ctx, args.sessionToken);
      const result = await ctx.db<typeof schema>().insert(schema.expenses).values({
        accountId: account.id,
        category: args.category,
        description: cleanOptional(args.description),
        expenseDate: args.expenseDate,
        amountCents: Math.round(args.amount * 100),
        gallonsThousandths: args.gallons == null ? null : Math.round(args.gallons * 1000),
        fuelState: args.category === "fuel" ? args.fuelState?.toUpperCase() ?? null : null,
        receiptBlobKey,
      }).returning({ id: schema.expenses.id });
      const inserted = result[0];
      if (!inserted) {
        if (receiptBlobKey) await ctx.blobs.delete(receiptBlobKey);
        throw new Error("Could not save the expense.");
      }
      if (args.category === "fuel" && args.gallons && args.fuelState) {
        await ctx.db<typeof schema>().insert(schema.iftaEntries).values({
          accountId: account.id,
          stateCode: args.fuelState.toUpperCase(),
          milesTenths: 0,
          gallonsThousandths: Math.round(args.gallons * 1000),
          source: "fuel",
          entryDate: args.expenseDate,
        });
      }
      ctx.invalidateQueries();
      return { id: inserted.id };
    },
  }),

  deleteLoad: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema, id: z.number().int().positive() }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      const account = await requireAccount(ctx, args.sessionToken);
      await ctx.db<typeof schema>().delete(schema.loads).where(and(eq(schema.loads.id, args.id), eq(schema.loads.accountId, account.id)));
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  deleteExpense: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema, id: z.number().int().positive() }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      const db = ctx.db<typeof schema>();
      const account = await requireAccount(ctx, args.sessionToken);
      const rows = await db.select({ receiptBlobKey: schema.expenses.receiptBlobKey }).from(schema.expenses).where(and(eq(schema.expenses.id, args.id), eq(schema.expenses.accountId, account.id))).limit(1);
      const receiptBlobKey = rows[0]?.receiptBlobKey;
      await db.delete(schema.expenses).where(and(eq(schema.expenses.id, args.id), eq(schema.expenses.accountId, account.id)));
      if (receiptBlobKey) await ctx.blobs.delete(receiptBlobKey);
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  getCompanyProfile: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema,}),
    response: companyProfileSchema,
    async handler(ctx, args) {
      return loadCompanyProfile(ctx, args.sessionToken);
    },
  }),

  saveCompanyProfile: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema,
      companyName: z.string().trim().min(1).max(160), address: z.string().max(300).optional(),
      phone: z.string().max(40).optional(), email: z.string().email().max(160).optional().or(z.literal("")),
      ein: z.string().max(30).optional(), mcNumber: z.string().max(30).optional(), dotNumber: z.string().max(30).optional(),
      logoDataBase64: z.string().max(8_000_000).optional(), logoMimeType: z.enum(["image/jpeg", "image/png", "image/webp"]).optional(),
    }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      const db = ctx.db<typeof schema>();
      const account = await requireAccount(ctx, args.sessionToken);
      const existing = (await db.select().from(schema.companyProfile).where(eq(schema.companyProfile.accountId, account.id)).limit(1))[0];
      let logoBlobKey = existing?.logoBlobKey ?? null;
      if (args.logoDataBase64 && args.logoMimeType) {
        const bytes = Buffer.from(args.logoDataBase64, "base64");
        if (bytes.byteLength > 5_000_000) throw new Error("Company logo is too large.");
        const ext = args.logoMimeType === "image/png" ? "png" : args.logoMimeType === "image/webp" ? "webp" : "jpg";
        const nextKey = `company/logo-${crypto.randomUUID()}.${ext}`;
        await ctx.blobs.put(nextKey, bytes, { contentType: args.logoMimeType });
        if (logoBlobKey) await ctx.blobs.delete(logoBlobKey);
        logoBlobKey = nextKey;
      }
      const values = {
        companyName: args.companyName.trim(), address: cleanOptional(args.address), phone: cleanOptional(args.phone),
        email: cleanOptional(args.email), ein: cleanOptional(args.ein), mcNumber: cleanOptional(args.mcNumber),
        dotNumber: cleanOptional(args.dotNumber), logoBlobKey, updatedAt: new Date(),
      };
      if (existing) await db.update(schema.companyProfile).set(values).where(eq(schema.companyProfile.id, existing.id));
      else await db.insert(schema.companyProfile).values({ accountId: account.id, ...values });
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  listDocuments: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema,}),
    response: z.object({ documents: z.array(z.object({ id: z.number(), title: z.string(), category: documentCategorySchema, expiresOn: z.string().nullable(), fileUrl: z.string(), filename: z.string(), createdAt: z.string() })) }),
    async handler(ctx, args) {
      const account = await requireAccount(ctx, args.sessionToken);
      const rows = await ctx.db<typeof schema>().select().from(schema.documents).where(eq(schema.documents.accountId, account.id)).orderBy(desc(schema.documents.createdAt));
      const documents = await Promise.all(rows.map(async (row) => ({
        id: row.id, title: row.title, category: row.category, expiresOn: row.expiresOn,
        fileUrl: await ctx.blobs.getUrl(row.blobKey, { expiresInSeconds: 3600 }), filename: row.filename,
        createdAt: row.createdAt.toISOString(),
      })));
      return { documents };
    },
  }),

  uploadDocument: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema,
      title: z.string().trim().min(1).max(160), category: documentCategorySchema,
      expiresOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      fileDataBase64: z.string().max(16_000_000), mimeType: z.enum(["image/jpeg", "image/png", "image/webp", "application/pdf"]),
      filename: z.string().trim().min(1).max(180),
    }),
    response: z.object({ id: z.number() }),
    async handler(ctx, args) {
      const bytes = Buffer.from(args.fileDataBase64, "base64");
      if (bytes.byteLength > 10_000_000) throw new Error("Document is too large.");
      const ext = args.mimeType === "application/pdf" ? "pdf" : args.mimeType === "image/png" ? "png" : args.mimeType === "image/webp" ? "webp" : "jpg";
      const blobKey = `documents/${crypto.randomUUID()}.${ext}`;
      await ctx.blobs.put(blobKey, bytes, { contentType: args.mimeType });
      const account = await requireAccount(ctx, args.sessionToken);
      const result = await ctx.db<typeof schema>().insert(schema.documents).values({
        accountId: account.id,
        title: args.title.trim(), category: args.category, expiresOn: args.expiresOn || null,
        blobKey, mimeType: args.mimeType, filename: args.filename,
      }).returning({ id: schema.documents.id });
      const inserted = result[0];
      if (!inserted) { await ctx.blobs.delete(blobKey); throw new Error("Could not save the document."); }
      ctx.invalidateQueries();
      return { id: inserted.id };
    },
  }),

  deleteDocument: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema, id: z.number().int().positive() }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      const db = ctx.db<typeof schema>();
      const account = await requireAccount(ctx, args.sessionToken);
      const row = (await db.select({ blobKey: schema.documents.blobKey }).from(schema.documents).where(and(eq(schema.documents.id, args.id), eq(schema.documents.accountId, account.id))).limit(1))[0];
      await db.delete(schema.documents).where(and(eq(schema.documents.id, args.id), eq(schema.documents.accountId, account.id)));
      if (row?.blobKey) await ctx.blobs.delete(row.blobKey);
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  getIftaReport: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema, year: z.number().int().min(2020).max(2100), quarter: z.number().int().min(1).max(4) }),
    response: z.object({ rows: z.array(z.object({ stateCode: z.string(), miles: z.number(), gallons: z.number() })), totalMiles: z.number(), totalGallons: z.number(), unassignedMiles: z.number(), company: companyProfileSchema }),
    async handler(ctx, args) {
      const startMonth = (args.quarter - 1) * 3 + 1;
      const from = `${args.year}-${String(startMonth).padStart(2, "0")}-01`;
      const untilDate = new Date(Date.UTC(args.year, startMonth + 2, 0));
      const until = untilDate.toISOString().slice(0, 10);
      const account = await requireAccount(ctx, args.sessionToken);
      const all = await ctx.db<typeof schema>().select().from(schema.iftaEntries).where(eq(schema.iftaEntries.accountId, account.id));
      const selected = all.filter((row) => row.entryDate >= from && row.entryDate <= until);
      const grouped = new Map<string, { milesTenths: number; gallonsThousandths: number }>();
      selected.forEach((row) => {
        const current = grouped.get(row.stateCode) ?? { milesTenths: 0, gallonsThousandths: 0 };
        current.milesTenths += row.milesTenths;
        current.gallonsThousandths += row.gallonsThousandths;
        grouped.set(row.stateCode, current);
      });
      const rows = Array.from(grouped.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([stateCode, value]) => ({ stateCode, miles: value.milesTenths / 10, gallons: value.gallonsThousandths / 1000 }));
      const company = await loadCompanyProfile(ctx, args.sessionToken);
      return {
        rows, totalMiles: selected.reduce((sum, row) => sum + row.milesTenths, 0) / 10,
        totalGallons: selected.reduce((sum, row) => sum + row.gallonsThousandths, 0) / 1000,
        unassignedMiles: selected.filter((row) => row.stateCode === "UN").reduce((sum, row) => sum + row.milesTenths, 0) / 10,
        company,
      };
    },
  }),

  addIftaGpsSegment: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema, lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180), miles: z.number().finite().positive().max(500), entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }),
    response: z.object({ stateCode: z.string() }),
    async handler(ctx, args) {
      const url = new URL("https://nominatim.openstreetmap.org/reverse");
      url.searchParams.set("lat", String(args.lat)); url.searchParams.set("lon", String(args.lng)); url.searchParams.set("format", "jsonv2");
      const response = await fetch(url, { headers: { "User-Agent": "RigRevenue/1.0" } });
      if (!response.ok) throw new Error("Could not identify the state for this GPS segment.");
      const data = await response.json() as { address?: { "ISO3166-2-lvl4"?: string; state_code?: string } };
      const iso = data.address?.["ISO3166-2-lvl4"];
      const stateCode = (iso?.split("-")[1] ?? data.address?.state_code ?? "UN").toUpperCase();
      const account = await requireAccount(ctx, args.sessionToken);
      await ctx.db<typeof schema>().insert(schema.iftaEntries).values({ accountId: account.id, stateCode, milesTenths: Math.round(args.miles * 10), gallonsThousandths: 0, source: "gps", entryDate: args.entryDate });
      ctx.invalidateQueries();
      return { stateCode };
    },
  }),

  startDetentionClaim: defineAction({
    request: z.object({
      sessionToken: sessionTokenSchema,
      facilityType: z.enum(["shipper", "receiver"]),
      facilityName: z.string().trim().min(2).max(160),
      brokerName: z.string().trim().max(160).optional(),
      brokerEmail: z.string().trim().email().max(160).optional().or(z.literal("")),
      loadReference: z.string().trim().max(100).optional(),
      freeMinutes: z.number().int().min(0).max(1440).default(120),
      hourlyRate: z.number().finite().positive().max(10000),
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
      accuracyMeters: z.number().finite().min(0).max(100000).optional(),
    }),
    response: z.object({ id: z.number(), arrivalAt: z.string() }),
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      const account = await requireAccount(ctx, args.sessionToken);
      const existing = (await db.select({ id: schema.detentionClaims.id }).from(schema.detentionClaims).where(and(eq(schema.detentionClaims.accountId, account.id), eq(schema.detentionClaims.status, "active"))).limit(1))[0];
      if (existing) throw new Error("Finish your current detention stop before starting another one.");
      const arrivalAt = new Date();
      const rows = await db.insert(schema.detentionClaims).values({
        accountId: account.id,
        facilityType: args.facilityType,
        facilityName: args.facilityName.trim(),
        brokerName: cleanOptional(args.brokerName),
        brokerEmail: cleanOptional(args.brokerEmail),
        loadReference: cleanOptional(args.loadReference),
        freeMinutes: args.freeMinutes,
        hourlyRateCents: Math.round(args.hourlyRate * 100),
        arrivalAt,
        arrivalLatE6: Math.round(args.lat * 1_000_000),
        arrivalLngE6: Math.round(args.lng * 1_000_000),
        arrivalAccuracyMeters: args.accuracyMeters == null ? null : Math.round(args.accuracyMeters),
        status: "active",
        updatedAt: arrivalAt,
      }).returning({ id: schema.detentionClaims.id });
      const row = rows[0];
      if (!row) throw new Error("Could not start the detention clock.");
      ctx.invalidateQueries();
      return { id: row.id, arrivalAt: arrivalAt.toISOString() };
    },
  }),

  finishDetentionClaim: defineAction({
    request: z.object({
      sessionToken: sessionTokenSchema,
      id: z.number().int().positive(),
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
      accuracyMeters: z.number().finite().min(0).max(100000).optional(),
    }),
    response: detentionClaimSchema,
    async handler(ctx, args): Promise<z.infer<typeof detentionClaimSchema>> {
      const db = ctx.db<typeof schema>();
      const account = await requireAccount(ctx, args.sessionToken);
      const row = (await db.select().from(schema.detentionClaims).where(and(eq(schema.detentionClaims.id, args.id), eq(schema.detentionClaims.accountId, account.id))).limit(1))[0];
      if (!row) throw new Error("Detention stop not found.");
      if (row.status !== "active" || row.departureAt) throw new Error("That detention clock has already stopped.");
      const departureAt = new Date();
      await db.update(schema.detentionClaims).set({
        departureAt,
        departureLatE6: Math.round(args.lat * 1_000_000),
        departureLngE6: Math.round(args.lng * 1_000_000),
        departureAccuracyMeters: args.accuracyMeters == null ? null : Math.round(args.accuracyMeters),
        status: "pending",
        updatedAt: departureAt,
      }).where(and(eq(schema.detentionClaims.id, args.id), eq(schema.detentionClaims.accountId, account.id)));
      ctx.invalidateQueries();
      return toDetentionClaim({ ...row, departureAt, departureLatE6: Math.round(args.lat * 1_000_000), departureLngE6: Math.round(args.lng * 1_000_000), departureAccuracyMeters: args.accuracyMeters == null ? null : Math.round(args.accuracyMeters), status: "pending", updatedAt: departureAt }, departureAt);
    },
  }),

  listDetentionClaims: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema }),
    response: z.object({ claims: z.array(detentionClaimSchema), company: companyProfileSchema }),
    async handler(ctx, args) {
      const account = await requireAccount(ctx, args.sessionToken);
      const rows = await ctx.db<typeof schema>().select().from(schema.detentionClaims).where(eq(schema.detentionClaims.accountId, account.id)).orderBy(desc(schema.detentionClaims.createdAt));
      const company = await loadCompanyProfile(ctx, args.sessionToken);
      const now = new Date();
      return { claims: rows.map((row) => toDetentionClaim(row, now)), company };
    },
  }),

  markDetentionStatus: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema, id: z.number().int().positive(), status: z.enum(["pending", "sent", "paid"]) }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      const db = ctx.db<typeof schema>();
      const account = await requireAccount(ctx, args.sessionToken);
      const row = (await db.select({ departureAt: schema.detentionClaims.departureAt }).from(schema.detentionClaims).where(and(eq(schema.detentionClaims.id, args.id), eq(schema.detentionClaims.accountId, account.id))).limit(1))[0];
      if (!row) throw new Error("Detention claim not found.");
      if (!row.departureAt) throw new Error("Stamp departure before changing this claim.");
      await db.update(schema.detentionClaims).set({ status: args.status, updatedAt: new Date() }).where(and(eq(schema.detentionClaims.id, args.id), eq(schema.detentionClaims.accountId, account.id)));
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  deleteDetentionClaim: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema, id: z.number().int().positive() }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      const account = await requireAccount(ctx, args.sessionToken);
      await ctx.db<typeof schema>().delete(schema.detentionClaims).where(and(eq(schema.detentionClaims.id, args.id), eq(schema.detentionClaims.accountId, account.id)));
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  createInvoice: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema, loadId: z.number().int().positive(), recipientEmail: z.string().email().optional().or(z.literal("")), dueDays: z.number().int().min(0).max(120).default(30), notes: z.string().max(500).optional() }),
    response: z.object({ id: z.number() }),
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      const account = await requireAccount(ctx, args.sessionToken);
      const load = (await db.select().from(schema.loads).where(and(eq(schema.loads.id, args.loadId), eq(schema.loads.accountId, account.id))).limit(1))[0];
      if (!load) throw new Error("Load not found.");
      const invoiceNumber = `RB-${load.deliveredOn.replaceAll("-", "")}-${load.id}`;
      const existing = (await db.select({ id: schema.invoices.id }).from(schema.invoices).where(eq(schema.invoices.invoiceNumber, invoiceNumber)).limit(1))[0];
      if (existing) return { id: existing.id };
      const result = await db.insert(schema.invoices).values({
        accountId: account.id,
        loadId: load.id, invoiceNumber, recipientEmail: cleanOptional(args.recipientEmail), dueDate: addDays(load.deliveredOn, args.dueDays), notes: cleanOptional(args.notes),
      }).returning({ id: schema.invoices.id });
      const inserted = result[0];
      if (!inserted) throw new Error("Could not create the invoice.");
      ctx.invalidateQueries();
      return { id: inserted.id };
    },
  }),

  listInvoices: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema,}),
    response: z.object({ invoices: z.array(z.object({ id: z.number(), invoiceNumber: z.string(), recipientEmail: z.string().nullable(), dueDate: z.string(), status: invoiceStatusSchema, notes: z.string().nullable(), load: loadSchema, company: companyProfileSchema })) }),
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      const account = await requireAccount(ctx, args.sessionToken);
      const rows = await db.select().from(schema.invoices).where(eq(schema.invoices.accountId, account.id)).orderBy(desc(schema.invoices.createdAt));
      const company = await loadCompanyProfile(ctx, args.sessionToken);
      const invoices = await Promise.all(rows.map(async (invoice) => {
        const load = (await db.select().from(schema.loads).where(eq(schema.loads.id, invoice.loadId)).limit(1))[0];
        if (!load) return null;
        return { id: invoice.id, invoiceNumber: invoice.invoiceNumber, recipientEmail: invoice.recipientEmail, dueDate: invoice.dueDate, status: invoice.status, notes: invoice.notes, load: toLoad(load), company };
      }));
      return { invoices: invoices.filter((value): value is NonNullable<typeof value> => value !== null) };
    },
  }),

  markInvoiceStatus: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema, id: z.number().int().positive(), status: invoiceStatusSchema }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      const account = await requireAccount(ctx, args.sessionToken);
      await ctx.db<typeof schema>().update(schema.invoices).set({ status: args.status, sentAt: args.status === "sent" ? new Date() : undefined }).where(and(eq(schema.invoices.id, args.id), eq(schema.invoices.accountId, account.id)));
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  listDriverFeed: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema, limit: z.number().int().min(1).max(100).default(40) }),
    response: z.object({ posts: z.array(driverPostSchema), memberCount: z.number(), asOf: z.string() }),
    async handler(ctx, args): Promise<{ posts: Array<z.infer<typeof driverPostSchema>>; memberCount: number; asOf: string }> {
      const account = await requireAccount(ctx, args.sessionToken);
      const db = ctx.db<typeof schema>();
      const [postRows, memberRows] = await Promise.all([
        db.select().from(schema.driverPosts).orderBy(desc(schema.driverPosts.createdAt)).limit(args.limit),
        db.select({ id: schema.accounts.id }).from(schema.accounts),
      ]);
      const memberCount = memberRows.length;
      if (postRows.length === 0) return { posts: [], memberCount, asOf: new Date().toISOString() };
      const postIds = postRows.map((row) => row.id);
      const [replyRows, likeRows] = await Promise.all([
        db.select().from(schema.driverReplies).where(inArray(schema.driverReplies.postId, postIds)).orderBy(asc(schema.driverReplies.createdAt)),
        db.select().from(schema.driverPostLikes).where(inArray(schema.driverPostLikes.postId, postIds)),
      ]);
      const accountIds = Array.from(new Set([...postRows.map((row) => row.accountId), ...replyRows.map((row) => row.accountId)]));
      const accountRows = accountIds.length > 0
        ? await db.select({ id: schema.accounts.id, displayName: schema.accounts.displayName }).from(schema.accounts).where(inArray(schema.accounts.id, accountIds))
        : [];
      const names = new Map(accountRows.map((row) => [row.id, row.displayName]));
      const posts = postRows.map((post) => {
        const likes = likeRows.filter((like) => like.postId === post.id);
        return {
          id: post.id,
          driverName: names.get(post.accountId) ?? "RigRevenue driver",
          body: post.body,
          createdAt: post.createdAt.toISOString(),
          likeCount: likes.length,
          likedByViewer: likes.some((like) => like.accountId === account.id),
          replies: replyRows.filter((reply) => reply.postId === post.id).map((reply) => ({
            id: reply.id,
            postId: reply.postId,
            driverName: names.get(reply.accountId) ?? "RigRevenue driver",
            body: reply.body,
            createdAt: reply.createdAt.toISOString(),
          })),
        };
      });
      return { posts, memberCount, asOf: new Date().toISOString() };
    },
  }),

  createDriverPost: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema, body: z.string().trim().min(1).max(600) }),
    response: z.object({ id: z.number() }),
    async handler(ctx, args) {
      const account = await requireAccount(ctx, args.sessionToken);
      const rows = await ctx.db<typeof schema>().insert(schema.driverPosts).values({ accountId: account.id, body: args.body.trim() }).returning({ id: schema.driverPosts.id });
      const row = rows[0];
      if (!row) throw new Error("Could not publish that post.");
      ctx.invalidateQueries();
      return { id: row.id };
    },
  }),

  createDriverReply: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema, postId: z.number().int().positive(), body: z.string().trim().min(1).max(400) }),
    response: z.object({ id: z.number() }),
    async handler(ctx, args) {
      const account = await requireAccount(ctx, args.sessionToken);
      const db = ctx.db<typeof schema>();
      const post = (await db.select({ id: schema.driverPosts.id }).from(schema.driverPosts).where(eq(schema.driverPosts.id, args.postId)).limit(1))[0];
      if (!post) throw new Error("That post is no longer available.");
      const rows = await db.insert(schema.driverReplies).values({ postId: args.postId, accountId: account.id, body: args.body.trim() }).returning({ id: schema.driverReplies.id });
      const row = rows[0];
      if (!row) throw new Error("Could not publish that reply.");
      ctx.invalidateQueries();
      return { id: row.id };
    },
  }),

  toggleDriverPostLike: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema, postId: z.number().int().positive() }),
    response: z.object({ liked: z.boolean() }),
    async handler(ctx, args) {
      const account = await requireAccount(ctx, args.sessionToken);
      const db = ctx.db<typeof schema>();
      const post = (await db.select({ id: schema.driverPosts.id }).from(schema.driverPosts).where(eq(schema.driverPosts.id, args.postId)).limit(1))[0];
      if (!post) throw new Error("That post is no longer available.");
      const existing = (await db.select({ id: schema.driverPostLikes.id }).from(schema.driverPostLikes).where(and(eq(schema.driverPostLikes.postId, args.postId), eq(schema.driverPostLikes.accountId, account.id))).limit(1))[0];
      if (existing) {
        await db.delete(schema.driverPostLikes).where(eq(schema.driverPostLikes.id, existing.id));
        ctx.invalidateQueries();
        return { liked: false };
      }
      await db.insert(schema.driverPostLikes).values({ postId: args.postId, accountId: account.id });
      ctx.invalidateQueries();
      return { liked: true };
    },
  }),

  deleteDriverPost: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema, postId: z.number().int().positive() }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      const account = await requireAccount(ctx, args.sessionToken);
      const db = ctx.db<typeof schema>();
      const post = (await db.select({ id: schema.driverPosts.id, accountId: schema.driverPosts.accountId }).from(schema.driverPosts).where(eq(schema.driverPosts.id, args.postId)).limit(1))[0];
      if (!post) return { ok: true };
      if (account.role !== "creator" && post.accountId !== account.id) throw new Error("You can only delete your own posts.");
      await db.delete(schema.driverPosts).where(eq(schema.driverPosts.id, post.id));
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  deleteDriverReply: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema, replyId: z.number().int().positive() }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      const account = await requireAccount(ctx, args.sessionToken);
      const db = ctx.db<typeof schema>();
      const reply = (await db.select({ id: schema.driverReplies.id, accountId: schema.driverReplies.accountId }).from(schema.driverReplies).where(eq(schema.driverReplies.id, args.replyId)).limit(1))[0];
      if (!reply) return { ok: true };
      if (account.role !== "creator" && reply.accountId !== account.id) throw new Error("You can only delete your own replies.");
      await db.delete(schema.driverReplies).where(eq(schema.driverReplies.id, reply.id));
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  listYardScoreboard: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema, search: z.string().trim().max(80).default("") }),
    response: z.object({ items: z.array(yardScoreItemSchema), totalRatings: z.number(), ratedBusinesses: z.number(), asOf: z.string() }),
    async handler(ctx, args): Promise<{ items: Array<z.infer<typeof yardScoreItemSchema>>; totalRatings: number; ratedBusinesses: number; asOf: string }> {
      const account = await requireAccount(ctx, args.sessionToken);
      const rows = await ctx.db<typeof schema>().select().from(schema.communityRatings).orderBy(desc(schema.communityRatings.updatedAt));
      const groups = new Map<string, typeof rows>();
      for (const row of rows) {
        const key = `${row.entityType}:${row.normalizedName}`;
        const group = groups.get(key) ?? [];
        group.push(row);
        groups.set(key, group);
      }
      const round = (value: number): number => Math.round(value * 10) / 10;
      const average = (values: Array<number | null>): number | null => {
        const valid = values.filter((value): value is number => value !== null);
        return valid.length ? round(valid.reduce((sum, value) => sum + value, 0) / valid.length) : null;
      };
      const query = normalizeYardBusinessName(args.search);
      const items: Array<z.infer<typeof yardScoreItemSchema>> = [];
      for (const group of groups.values()) {
        const newest = group[0];
        if (!newest || (query && !newest.normalizedName.includes(query))) continue;
        const detention = average(group.map((row) => row.detentionScore));
        const payment = average(group.map((row) => row.paymentScore));
        const honesty = average(group.map((row) => row.honestyScore));
        const wait = average(group.map((row) => row.waitScore));
        const treatment = average(group.map((row) => row.treatmentScore));
        const scores = newest.entityType === "broker"
          ? [detention, payment, honesty].filter((value): value is number => value !== null)
          : [wait, treatment].filter((value): value is number => value !== null);
        const mine = group.find((row) => row.accountId === account.id);
        items.push({
          entityType: newest.entityType,
          entityName: newest.entityName,
          ratingCount: group.length,
          overall: scores.length ? round(scores.reduce((sum, value) => sum + value, 0) / scores.length) : 0,
          details: { detention, payment, honesty, wait, treatment },
          myRating: mine ? { detention: mine.detentionScore, payment: mine.paymentScore, honesty: mine.honestyScore, wait: mine.waitScore, treatment: mine.treatmentScore } : null,
          updatedAt: newest.updatedAt.toISOString(),
        });
      }
      items.sort((a, b) => b.overall - a.overall || b.ratingCount - a.ratingCount || a.entityName.localeCompare(b.entityName));
      return { items, totalRatings: rows.length, ratedBusinesses: groups.size, asOf: new Date().toISOString() };
    },
  }),

  saveYardRating: defineAction({
    request: z.discriminatedUnion("entityType", [
      z.object({ sessionToken: sessionTokenSchema, entityType: z.literal("broker"), entityName: z.string().trim().min(2).max(100), detention: z.number().int().min(1).max(5), payment: z.number().int().min(1).max(5), honesty: z.number().int().min(1).max(5) }),
      z.object({ sessionToken: sessionTokenSchema, entityType: z.enum(["shipper", "receiver"]), entityName: z.string().trim().min(2).max(100), wait: z.number().int().min(1).max(5), treatment: z.number().int().min(1).max(5) }),
    ]),
    response: z.object({ id: z.number(), updated: z.boolean() }),
    async handler(ctx, args): Promise<{ id: number; updated: boolean }> {
      const account = await requireAccount(ctx, args.sessionToken);
      const normalizedName = normalizeYardBusinessName(args.entityName);
      if (normalizedName.length < 2) throw new Error("Enter the broker, shipper, or receiver name.");
      const db = ctx.db<typeof schema>();
      const existing = (await db.select({ id: schema.communityRatings.id }).from(schema.communityRatings).where(and(
        eq(schema.communityRatings.accountId, account.id),
        eq(schema.communityRatings.entityType, args.entityType),
        eq(schema.communityRatings.normalizedName, normalizedName),
      )).limit(1))[0];
      const values = args.entityType === "broker"
        ? { entityName: args.entityName.trim(), normalizedName, detentionScore: args.detention, paymentScore: args.payment, honestyScore: args.honesty, waitScore: null, treatmentScore: null, updatedAt: new Date() }
        : { entityName: args.entityName.trim(), normalizedName, detentionScore: null, paymentScore: null, honestyScore: null, waitScore: args.wait, treatmentScore: args.treatment, updatedAt: new Date() };
      if (existing) {
        await db.update(schema.communityRatings).set(values).where(eq(schema.communityRatings.id, existing.id));
        ctx.invalidateQueries();
        return { id: existing.id, updated: true };
      }
      const insertedRows = await db.insert(schema.communityRatings).values({ accountId: account.id, entityType: args.entityType, ...values }).returning({ id: schema.communityRatings.id });
      const inserted = insertedRows[0];
      if (!inserted) throw new Error("Could not save that rating.");
      ctx.invalidateQueries();
      return { id: inserted.id, updated: false };
    },
  }),

  getTruckProfile: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema,}),
    response: z.object({ configured: z.boolean(), truckName: z.string(), currentOdometer: z.number(), lastPmOdometer: z.number(), pmInterval: z.number(), nextPmDue: z.number(), milesRemaining: z.number(), status: z.enum(["ok", "soon", "due"]), heightInches: z.number(), weightPounds: z.number(), lengthFeet: z.number(), widthInches: z.number(), hasPrePass: z.boolean() }),
    async handler(ctx, args) {
      const account = await requireAccount(ctx, args.sessionToken);
      await ensurePrePassColumn(ctx);
      const row = (await ctx.db<typeof schema>().select().from(schema.truckProfiles).where(eq(schema.truckProfiles.accountId, account.id)).limit(1))[0];
      if (!row) return { configured: false, truckName: "My truck", currentOdometer: 0, lastPmOdometer: 0, pmInterval: 15000, nextPmDue: 15000, milesRemaining: 15000, status: "ok" as const, heightInches: 162, weightPounds: 80000, lengthFeet: 75, widthInches: 102, hasPrePass: false };
      const currentOdometer = row.currentOdometerTenths / 10;
      const lastPmOdometer = row.lastPmOdometerTenths / 10;
      const pmInterval = row.pmIntervalTenths / 10;
      const nextPmDue = lastPmOdometer + pmInterval;
      const milesRemaining = nextPmDue - currentOdometer;
      return { configured: true, truckName: row.truckName, currentOdometer, lastPmOdometer, pmInterval, nextPmDue, milesRemaining, status: milesRemaining <= 0 ? "due" as const : milesRemaining <= Math.min(1000, pmInterval * 0.1) ? "soon" as const : "ok" as const, heightInches: row.heightInches, weightPounds: row.weightPounds, lengthFeet: row.lengthFeet, widthInches: row.widthInches, hasPrePass: row.hasPrePass };
    },
  }),

  saveTruckProfile: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema, truckName: z.string().trim().min(1).max(80), currentOdometer: z.number().finite().min(0).max(10000000), lastPmOdometer: z.number().finite().min(0).max(10000000), pmInterval: z.number().finite().positive().max(1000000), heightInches: z.number().int().min(96).max(180).optional(), weightPounds: z.number().int().min(10000).max(200000).optional(), lengthFeet: z.number().int().min(20).max(150).optional(), widthInches: z.number().int().min(72).max(144).optional(), hasPrePass: z.boolean().optional() }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      const account = await requireAccount(ctx, args.sessionToken);
      if (args.lastPmOdometer > args.currentOdometer) throw new Error("Last PM reading cannot be higher than the current odometer.");
      await ensurePrePassColumn(ctx);
      const db = ctx.db<typeof schema>();
      const row = (await db.select().from(schema.truckProfiles).where(eq(schema.truckProfiles.accountId, account.id)).limit(1))[0];
      const values = { accountId: account.id, truckName: args.truckName.trim(), currentOdometerTenths: Math.round(args.currentOdometer * 10), lastPmOdometerTenths: Math.round(args.lastPmOdometer * 10), pmIntervalTenths: Math.round(args.pmInterval * 10), heightInches: args.heightInches ?? row?.heightInches ?? 162, weightPounds: args.weightPounds ?? row?.weightPounds ?? 80000, lengthFeet: args.lengthFeet ?? row?.lengthFeet ?? 75, widthInches: args.widthInches ?? row?.widthInches ?? 102, hasPrePass: args.hasPrePass ?? row?.hasPrePass ?? false, updatedAt: new Date() };
      if (row) await db.update(schema.truckProfiles).set(values).where(eq(schema.truckProfiles.id, row.id));
      else await db.insert(schema.truckProfiles).values(values);
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  saveTruckRouteProfile: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema, truckName: z.string().trim().min(1).max(80), heightInches: z.number().int().min(96).max(180), weightPounds: z.number().int().min(10000).max(200000), lengthFeet: z.number().int().min(20).max(150), widthInches: z.number().int().min(72).max(144), hasPrePass: z.boolean() }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      const account = await requireAccount(ctx, args.sessionToken); await ensurePrePassColumn(ctx); const db = ctx.db<typeof schema>();
      const row = (await db.select().from(schema.truckProfiles).where(eq(schema.truckProfiles.accountId, account.id)).limit(1))[0];
      const values = { accountId: account.id, truckName: args.truckName.trim(), heightInches: args.heightInches, weightPounds: args.weightPounds, lengthFeet: args.lengthFeet, widthInches: args.widthInches, hasPrePass: args.hasPrePass, currentOdometerTenths: row?.currentOdometerTenths ?? 0, lastPmOdometerTenths: row?.lastPmOdometerTenths ?? 0, pmIntervalTenths: row?.pmIntervalTenths ?? 150000, updatedAt: new Date() };
      if (row) await db.update(schema.truckProfiles).set(values).where(eq(schema.truckProfiles.id, row.id)); else await db.insert(schema.truckProfiles).values(values);
      ctx.invalidateQueries(); return { ok: true };
    },
  }),

  planRoadForTruckers: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema, origin: z.string().trim().min(2).max(180), destination: z.string().trim().min(2).max(180) }),
    response: roadRouteSchema,
    async handler(ctx, args): Promise<z.infer<typeof roadRouteSchema>> {
      const account = await requireAccount(ctx, args.sessionToken);
      if (!(await accountHasProAccess(ctx, account))) throw new Error("Road for Truckers requires RigRevenue Pro.");
      await ensurePrePassColumn(ctx);
      const truck = (await ctx.db<typeof schema>().select().from(schema.truckProfiles).where(eq(schema.truckProfiles.accountId, account.id)).limit(1))[0];
      if (!truck) throw new Error("Add your truck profile before planning a route.");
      const geocode = async (query: string) => {
        const url = new URL("https://nominatim.openstreetmap.org/search"); url.searchParams.set("q", query); url.searchParams.set("format", "jsonv2"); url.searchParams.set("limit", "1");
        const response = await fetch(url, { headers: { "User-Agent": "RigRevenue/1.0" } });
        if (!response.ok) throw new Error("A route location could not be found.");
        const rows = await response.json() as Array<{ lat?: string; lon?: string; display_name?: string }>;
        const row = rows[0]; const lat = Number(row?.lat); const lng = Number(row?.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) throw new Error("A route location could not be found.");
        return { lat, lng, label: row?.display_name ?? query };
      };
      const [origin, destination] = await Promise.all([geocode(args.origin), geocode(args.destination)]);
      const routeResponse = await fetch("https://valhalla1.openstreetmap.de/route", { method: "POST", headers: { "Content-Type": "application/json", "X-Client-Id": "rigrevenue", "User-Agent": "RigRevenue/1.0" }, body: JSON.stringify({ locations: [{ lat: origin.lat, lon: origin.lng }, { lat: destination.lat, lon: destination.lng }], costing: "truck", costing_options: { truck: { height: truck.heightInches * 0.0254, width: truck.widthInches * 0.0254, length: truck.lengthFeet * 0.3048, weight: truck.weightPounds * 0.000453592, axle_load: Math.min(20, truck.weightPounds * 0.000453592 / 5), hazmat: false } }, units: "miles", language: "en-US" }) });
      if (!routeResponse.ok) throw new Error("A truck-safe route could not be calculated right now.");
      const routeData = await routeResponse.json() as { trip?: { summary?: { length?: number; time?: number }; legs?: Array<{ shape?: string; maneuvers?: Array<{ instruction?: string; length?: number; time?: number }> }> } };
      const leg = routeData.trip?.legs?.[0]; const summary = routeData.trip?.summary;
      if (!leg?.shape || typeof summary?.length !== "number" || typeof summary.time !== "number") throw new Error("A truck-safe route could not be calculated right now.");
      const fullShape = decodePolyline6(leg.shape); const step = Math.max(1, Math.ceil(fullShape.length / 300)); const shape = fullShape.filter((_, index) => index % step === 0);
      const midpoint = shape[Math.floor(shape.length / 2)] ?? origin;
      const around = `(around:50000,${midpoint.lat},${midpoint.lng})`;
      const overpassQuery = `[out:json][timeout:20];(nwr["amenity"="truck_stop"]${around};nwr["amenity"="weighbridge"]["brand"~"CAT",i]${around};nwr["amenity"="weighbridge"]["name"~"CAT Scale",i]${around};);out center tags;`;
      let elements: OverpassElement[] = [];
      try { const response = await fetch("https://overpass-api.de/api/interpreter", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "RigRevenue/1.0" }, body: new URLSearchParams({ data: overpassQuery }) }); if (response.ok) elements = ((await response.json()) as { elements?: OverpassElement[] }).elements ?? []; } catch { elements = []; }
      const truckStops = elements.flatMap((element) => {
        const lat = element.lat ?? element.center?.lat; const lng = element.lon ?? element.center?.lon; if (typeof lat !== "number" || typeof lng !== "number") return [];
        const nearest = shape.filter((_, index) => index % 10 === 0).reduce((best, point) => Math.min(best, distanceMiles(point.lat, point.lng, lat, lng)), Number.POSITIVE_INFINITY);
        if (nearest > 8) return [];
        const tags = element.tags ?? {}; const isCat = tags.amenity === "weighbridge"; const category = isCat ? "cat_scale" as const : "truck_stop" as const;
        const address = [tags["addr:housenumber"], tags["addr:street"], tags["addr:city"], tags["addr:state"]].filter(Boolean).join(" ") || null;
        return [{ id: `${element.type ?? "node"}-${element.id ?? `${lat}-${lng}`}`, name: tags.name || tags.brand || (isCat ? "CAT Scale" : "Truck stop"), category, address, lat, lng, distanceMiles: Math.round(nearest * 10) / 10 }];
      }).sort((a, b) => a.distanceMiles - b.distanceMiles).slice(0, 12);
      return { originLabel: origin.label, destinationLabel: destination.label, distanceMiles: Math.round(summary.length * 10) / 10, durationMinutes: Math.round(summary.time / 60), shape, maneuvers: (leg.maneuvers ?? []).map((item) => ({ instruction: item.instruction ?? "Continue", distanceMiles: Math.round((item.length ?? 0) * 10) / 10, timeMinutes: Math.max(1, Math.round((item.time ?? 0) / 60)) })), truckStops, attribution: "Route and place data © OpenStreetMap contributors" };
    },
  }),

  askSam: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema,
      message: z.string().trim().min(1).max(600),
      history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(1000) })).max(8).default([]),
      lat: z.number().min(-90).max(90).optional(),
      lng: z.number().min(-180).max(180).optional(),
    }),
    response: samResponseSchema,
    async handler(ctx, args): Promise<z.infer<typeof samResponseSchema>> {
      const account = await requireAccount(ctx, args.sessionToken);
      const courtesyText = args.message.trim().toLowerCase().replace(/[.!?]+$/g, "").trim();
      if (/^(hello|hi|hey)( sam| there)?$/.test(courtesyText)) {
        return { reply: "hi, how are you?", scope: "courtesy", sources: [] };
      }
      if (/^(thanks|thank you|thx)( sam| so much| a lot)?$/.test(courtesyText)) {
        return { reply: "you're welcome.", scope: "courtesy", sources: [] };
      }

      const intent = await ctx.inference.complete(
        `Classify this question for Sam the Semi, RigRevenue' in-app assistant. Choose exactly one scope: app_help (how to use RigRevenue), driver_data (the signed-in driver's loads, expenses, earnings, settlements, deductions, or profit), weather (current or forecast road weather), diesel (diesel prices), trip_planning (planning a safe, efficient truck trip or pre-trip readiness), maintenance (truck maintenance, PM timing, inspections, or mechanical care), hos (hours-of-service rules, clocks, breaks, sleeper berth, or logs), trucking_terms (definitions of trucking language, pay terms, or industry shorthand), prayer (a driver asks for a prayer or spiritual encouragement), or out_of_scope. Message: ${args.message}`,
        { schema: samScopeSchema.exclude(["courtesy"]) },
      );
      if (intent === "out_of_scope") return { reply: "I can help with RigRevenue, your numbers, trip planning, maintenance, HOS, trucking terms, road weather, diesel prices, and prayers. Pick a topic above or ask me in your own words.", scope: intent, sources: [] };

      let context = "";
      let sources: Array<{ title: string; url: string }> = [];
      let searchBackedAnswer = false;
      if (intent === "app_help") {
        context = `RigRevenue guide: Overview shows gross, expenses, net, miles and profit per mile. Loads logs a run manually or from a rate-con photo. Expenses stores fuel and costs with receipt images. Roadside finds truck stops, repair and rest areas. Business is for owner-operators and has load boards, IFTA, invoices, document vault, My Company and news. Driver setup holds account, membership, profile and pay defaults. Lease-purchase supports percentage or per-mile settlement pay plus weekly truck payment, maintenance escrow, insurance and other deductions. Offline entries queue on the device and sync when online.`;
      } else if (intent === "driver_data") {
        const db = ctx.db<typeof schema>();
        const [loadRows, expenseRows, payRows] = await Promise.all([
          db.select().from(schema.loads).where(eq(schema.loads.accountId, account.id)).orderBy(desc(schema.loads.deliveredOn)).limit(250),
          db.select().from(schema.expenses).where(eq(schema.expenses.accountId, account.id)).orderBy(desc(schema.expenses.expenseDate)).limit(250),
          db.select().from(schema.paySettings).where(eq(schema.paySettings.accountId, account.id)).limit(1),
        ]);
        context = `Today is ${new Date().toISOString().slice(0, 10)}. Driver pay settings: ${JSON.stringify(payRows[0] ?? null)}. Loads: ${JSON.stringify(loadRows.map((row) => ({ date: row.deliveredOn, origin: row.origin, destination: row.destination, grossPay: row.grossPayCents / 100, miles: (row.loadedMilesTenths + row.deadheadMilesTenths) / 10 })))}. Expenses: ${JSON.stringify(expenseRows.map((row) => ({ date: row.expenseDate, category: row.category, amount: row.amountCents / 100 })))}.`;
      } else if (intent === "weather") {
        const weather = await ctx.tool.weather(args.message, { hourly_hours: 24, location: args.lat != null && args.lng != null ? { lat: args.lat, lon: args.lng } : undefined });
        context = `Managed current weather result: ${JSON.stringify(weather.content)}`;
        sources = weather.content.sources.map((source) => ({ title: source.title, url: source.url }));
      } else if (intent === "diesel") {
        let place = "the driver's requested area";
        if (args.lat != null && args.lng != null) {
          try {
            const url = new URL("https://nominatim.openstreetmap.org/reverse");
            url.searchParams.set("lat", String(args.lat)); url.searchParams.set("lon", String(args.lng)); url.searchParams.set("format", "jsonv2");
            const response = await fetch(url, { headers: { "User-Agent": "RigRevenue/1.0" } });
            const data = response.ok ? await response.json() as { display_name?: string } : null;
            place = data?.display_name ?? `${args.lat}, ${args.lng}`;
          } catch { place = `${args.lat}, ${args.lng}`; }
        }
        const search = await ctx.tool.web_search(`current cheapest diesel prices truck stops near or along ${place}; driver request: ${args.message}`);
        context = `Current web search results for diesel prices: ${JSON.stringify(search)}`;
      } else if (intent === "trip_planning") {
        context = `Trip-planning guidance: Ask for origin, destination, delivery time, planned fuel range, and any special load limits that are missing. Direct the driver to RigRevenue Road for a truck route, route weather, truck stops, repair, rest areas, and CAT scales. Remind the driver to confirm truck dimensions in Driver setup, inspect the truck, check fuel and legal HOS availability, review weather and restrictions, and leave a time buffer. Never invent a route, mileage, restriction, or arrival time.`;
      } else if (intent === "maintenance") {
        await ensurePrePassColumn(ctx);
        const truck = (await ctx.db<typeof schema>().select().from(schema.truckProfiles).where(eq(schema.truckProfiles.accountId, account.id)).limit(1))[0];
        context = truck
          ? `RigRevenue truck profile: ${JSON.stringify({ truckName: truck.truckName, currentOdometer: truck.currentOdometerTenths / 10, lastPmOdometer: truck.lastPmOdometerTenths / 10, pmInterval: truck.pmIntervalTenths / 10, nextPmDue: (truck.lastPmOdometerTenths + truck.pmIntervalTenths) / 10 })}. Explain preventive care clearly. Do not diagnose a dangerous mechanical problem remotely; advise stopping safely and using a qualified mechanic when safety may be affected.`
          : `No truck maintenance profile is saved yet. Explain how to add current odometer, last PM odometer, and PM interval in Driver setup. Give only general preventive-maintenance guidance and do not diagnose a dangerous mechanical problem remotely; advise stopping safely and using a qualified mechanic when safety may be affected.`;
      } else if (intent === "hos") {
        const search = await ctx.tool.web_search(`current official FMCSA hours of service rules property-carrying commercial drivers; driver question: ${args.message}`);
        context = `Current web search results about federal HOS rules: ${JSON.stringify(search)}`;
        searchBackedAnswer = true;
      } else if (intent === "trucking_terms") {
        context = `Explain trucking terminology in plain driver language. Common RigRevenue-relevant terms include deadhead (unpaid or non-revenue miles driven without a load), detention (time held beyond an agreed free period), lumper (a third-party loading or unloading service), rate confirmation (the written load terms and agreed carrier pay), gross (money before expenses or deductions), net (money after expenses or deductions), and profit per mile (net divided by all miles). If asked about a term not safely known, say so rather than guessing.`;
      } else if (intent === "prayer") {
        context = `Offer a brief, sincere Christian prayer suitable for a truck driver. Match the requested moment—before a trip, after a safe arrival, for family at home, during stress, or at bedtime. Do not claim guaranteed protection or outcomes. Keep it warm and respectful.`;
      }

      const prompt = `You are Sam the Semi, a friendly, concise, trucker-aware assistant inside RigRevenue. Answer only within the selected scope: ${intent}. Use the supplied context only; do not invent values, prices, conditions, routes, rules, or app behavior. For driver data, calculate exactly from the rows and clearly state the date range used. For diesel, include specific stations and prices only when the search context explicitly supports them; otherwise say live prices were not available and suggest trying a route or current location. For weather, emphasize hazards relevant to driving. For HOS, make clear that the answer is general guidance, use the current search context, and tell the driver to verify their operation and exceptions with FMCSA or their carrier. Keep the answer under 140 words. Conversation: ${JSON.stringify(args.history)}. Driver question: ${args.message}. Context: ${context}`;
      if (searchBackedAnswer) {
        const result = await ctx.inference.complete(
          `${prompt} Return up to three useful source links only when their complete URLs appear verbatim in the search context; otherwise return no sources.`,
          { schema: z.object({ reply: z.string(), sources: z.array(z.object({ title: z.string(), url: z.string().url() })).max(3) }) },
        );
        return { reply: result.reply, scope: intent, sources: result.sources };
      }
      const answer = await ctx.inference.complete(prompt, { schema: z.string() });
      return { reply: answer, scope: intent, sources };
    },
  }),

  getTruckingNews: defineAction({
    request: z.object({}),
    response: z.object({ items: z.array(truckingNewsItemSchema), asOf: z.string() }),
    async handler(ctx) {
      // Free RSS feeds load without any API key. AI curation stays as the fallback when a key is configured.
      const rssItems = await fetchTruckNewsFromRss();
      if (rssItems.length > 0) return { items: rssItems, asOf: new Date().toISOString() };
      try {
        const result = await ctx.tool.web_search("latest US trucking industry news regulations diesel fuel prices freight rates owner operators");
        const items = await ctx.inference.complete(
          `Select up to 10 recent, useful US trucking headlines from these search results. Cover regulations, fuel prices, freight rates, and major industry updates when available. Summaries should be factual and no more than two sentences. Use only a source URL that appears verbatim in the search results. Do not invent publication dates; use null when the search result does not clearly show one.\n\nSearch results:\n${JSON.stringify(result)}`,
          { schema: z.array(truckingNewsItemSchema).max(10) },
        );
        if (items.length > 0) return { items, asOf: new Date().toISOString() };
      } catch {
        // Fall through to the honest empty state below.
      }
      return { items: [], asOf: new Date().toISOString() };
    },
  }),

  scanLoadDocument: defineAction({
    request: z.object({
      imageDataBase64: z.string().max(16_000_000),
      mimeType: z.enum(["image/jpeg", "image/png"]),
      filename: z.string().max(180).optional(),
    }),
    response: scannedLoadSchema,
    async handler(ctx, args): Promise<z.infer<typeof scannedLoadSchema>> {
      return ctx.inference.complete(
        "Read this trucking rate confirmation or load sheet. Extract the pickup location, delivery location, loaded miles, total carrier/load pay, load/reference number, and broker or customer. Preserve useful city/state or full address text. Use null for anything not visible or uncertain. Money and miles must be numbers without symbols.",
        {
          schema: scannedLoadSchema,
          images: [{ dataBase64: args.imageDataBase64, mimeType: args.mimeType, filename: args.filename }],
        },
      );
    },
  }),

  calculateDeadhead: defineAction({
    request: z.object({
      currentLat: z.number().min(-90).max(90),
      currentLng: z.number().min(-180).max(180),
      pickup: z.string().trim().min(2).max(180),
    }),
    response: z.object({ miles: z.number(), pickupLabel: z.string() }),
    async handler(_ctx, args) {
      const searchUrl = new URL("https://nominatim.openstreetmap.org/search");
      searchUrl.searchParams.set("q", args.pickup);
      searchUrl.searchParams.set("format", "jsonv2");
      searchUrl.searchParams.set("limit", "1");
      const geocodeResponse = await fetch(searchUrl, { headers: { "User-Agent": "RigRevenue/1.0" } });
      if (!geocodeResponse.ok) throw new Error("Pickup location could not be found.");
      const candidates = await geocodeResponse.json() as Array<{ lat?: string; lon?: string; display_name?: string }>;
      const pickup = candidates[0];
      const pickupLat = Number(pickup?.lat);
      const pickupLng = Number(pickup?.lon);
      if (!Number.isFinite(pickupLat) || !Number.isFinite(pickupLng)) throw new Error("Pickup location could not be found.");
      const routeUrl = `https://router.project-osrm.org/route/v1/driving/${args.currentLng},${args.currentLat};${pickupLng},${pickupLat}?overview=false`;
      const routeResponse = await fetch(routeUrl, { headers: { "User-Agent": "RigRevenue/1.0" } });
      if (!routeResponse.ok) throw new Error("Deadhead route could not be calculated.");
      const routeData = await routeResponse.json() as { code?: string; routes?: Array<{ distance?: number }> };
      const meters = routeData.routes?.[0]?.distance;
      if (routeData.code !== "Ok" || typeof meters !== "number") throw new Error("Deadhead route could not be calculated.");
      return { miles: Math.round((meters / 1609.344) * 10) / 10, pickupLabel: pickup?.display_name || args.pickup };
    },
  }),

  findTruckServices: defineAction({
    request: z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
      radiusMiles: z.number().min(5).max(75).default(35),
    }),
    response: z.object({ places: z.array(truckPlaceSchema), asOf: z.string() }),
    async handler(_ctx, args) {
      const radiusMeters = Math.round(args.radiusMiles * 1609.344);
      const around = `(around:${radiusMeters},${args.lat},${args.lng})`;
      const query = `[out:json][timeout:25];(nwr["amenity"="truck_stop"]${around};nwr["highway"="rest_area"]${around};nwr["highway"="services"]${around};nwr["shop"="truck_repair"]${around};nwr["shop"="car_repair"]["hgv"="yes"]${around};nwr["amenity"="weighbridge"]["brand"~"CAT",i]${around};nwr["amenity"="weighbridge"]["name"~"CAT Scale",i]${around};);out center tags;`;
      const endpoints = [
        "https://overpass-api.de/api/interpreter",
        "https://overpass.kumi.systems/api/interpreter",
        "https://overpass.private.coffee/api/interpreter",
      ];
      // Race the public mirrors in parallel so one slow instance can't stall the map.
      // Each request gets 15 seconds; the first healthy response wins and the rest are aborted.
      const fetchFromMirror = (endpoint: string, signal: AbortSignal): Promise<{ elements?: OverpassElement[] } | null> =>
        fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "RigRevenue/1.0" },
          body: new URLSearchParams({ data: query }),
          signal,
        }).then(async (response) => {
          if (!response.ok) return null;
          const candidate = await response.json() as { elements?: OverpassElement[]; remark?: string };
          return candidate.remark ? null : candidate;
        }).catch(() => null);
      const controllers = endpoints.map(() => new AbortController());
      const timeouts = controllers.map((controller) => setTimeout(() => controller.abort(), 15000));
      let payload: { elements?: OverpassElement[] } | null = null;
      try {
        const firstValid = await Promise.any(endpoints.map(async (endpoint, index) => {
          const result = await fetchFromMirror(endpoint, controllers[index]?.signal ?? new AbortController().signal);
          if (!result || !Array.isArray(result.elements)) throw new Error("mirror failed");
          return result;
        }));
        payload = firstValid;
      } catch {
        payload = null;
      } finally {
        timeouts.forEach(clearTimeout);
        controllers.forEach((controller) => controller.abort());
      }
      if (!payload) throw new Error("Truck services are temporarily unavailable.");
      const places = (payload.elements ?? []).flatMap((element) => {
        const lat = element.lat ?? element.center?.lat;
        const lng = element.lon ?? element.center?.lon;
        if (typeof lat !== "number" || typeof lng !== "number") return [];
        const tags = element.tags ?? {};
        const category = tags.amenity === "weighbridge" && /CAT/i.test(`${tags.brand ?? ""} ${tags.name ?? ""}`)
          ? "cat_scale" as const
          : tags.amenity === "truck_stop"
            ? "truck_stop" as const
            : tags.shop === "truck_repair" || tags.shop === "car_repair"
              ? "repair" as const
              : "rest_area" as const;
        const defaultName = category === "cat_scale" ? "CAT Scale" : category === "truck_stop" ? "Truck stop" : category === "repair" ? "Truck repair" : "Rest area";
        const address = [tags["addr:housenumber"], tags["addr:street"], tags["addr:city"], tags["addr:state"]].filter(Boolean).join(" ") || null;
        return [{
          id: `${element.type ?? "node"}-${element.id ?? `${lat}-${lng}`}`,
          name: tags.name || tags.brand || defaultName,
          category,
          address,
          lat,
          lng,
          distanceMiles: Math.round(distanceMiles(args.lat, args.lng, lat, lng) * 10) / 10,
        }];
      }).sort((a, b) => a.distanceMiles - b.distanceMiles).slice(0, 40);
      return { places, asOf: new Date().toISOString() };
    },
  }),

  getMarketZones: defineAction({
    request: z.object({}),
    response: z.object({
      ok: z.boolean(),
      weekEnding: z.string().nullable(),
      source: z.string(),
      outbound: z.array(z.object({
        region: z.string(),
        label: z.string(),
        heat: z.enum(["hot", "warm", "cold"]),
        avgRpm: z.number().nullable(),
        avgLoad: z.number().nullable(),
        availability: z.number().nullable(),
        lanes: z.number(),
        sampleLane: z.object({ destination: z.string(), midpoint: z.number() }).nullable(),
      })),
      inbound: z.array(z.object({
        city: z.string(),
        heat: z.enum(["hot", "warm", "cold"]),
        avgRpm: z.number().nullable(),
        avgLoad: z.number().nullable(),
        lanes: z.number(),
      })),
      topLanes: z.array(z.object({
        origin: z.string(),
        destination: z.string(),
        midpoint: z.number().nullable(),
        rpm: z.number().nullable(),
        miles: z.number().nullable(),
        availability: z.number().nullable(),
      })),
      error: z.string().nullable(),
    }),
    async handler() {
      const rows = await fetchUsdaReeferRows();
      if (rows.length === 0) {
        return { ok: false, weekEnding: null, source: "USDA AgTransport", outbound: [], inbound: [], topLanes: [], error: "Live market data is temporarily unavailable. Try again in a few minutes." };
      }
      const weekEnding = rows[0]?.date ? rows[0].date.slice(0, 10) : null;
      const byRegion = new Map<string, UsdaReeferRow[]>();
      const byDest = new Map<string, UsdaReeferRow[]>();
      for (const row of rows) {
        if (row.region) {
          const list = byRegion.get(row.region) ?? [];
          list.push(row);
          byRegion.set(row.region, list);
        }
        if (row.destination) {
          const list = byDest.get(row.destination) ?? [];
          list.push(row);
          byDest.set(row.destination, list);
        }
      }
      const avg = (values: Array<number | null>): number | null => {
        const valid = values.filter((v): v is number => v != null);
        return valid.length ? Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 100) / 100 : null;
      };
      const outbound = [...byRegion.entries()].map(([region, list]) => {
        const rpms = list.map((r) => {
          const direct = marketNum(r.rpm);
          if (direct != null) return direct;
          const mid = marketNum(r.midpoint);
          const dist = marketNum(r.distance);
          return mid != null && dist ? mid / dist : null;
        });
        const avgRpm = avg(rpms);
        const avgLoad = avg(list.map((r) => marketNum(r.midpoint)));
        const availability = avg(list.map((r) => marketNum(r.availability)));
        const richest = [...list].sort((a, b) => (marketNum(b.midpoint) ?? 0) - (marketNum(a.midpoint) ?? 0))[0];
        const richestMid = richest ? marketNum(richest.midpoint) : null;
        return {
          region,
          label: MARKET_REGION_LABELS[region] ?? titleCaseMarket(region),
          heat: outboundHeat(availability, avgRpm),
          avgRpm,
          avgLoad: avgLoad != null ? Math.round(avgLoad) : null,
          availability,
          lanes: list.length,
          sampleLane: richest && richestMid != null ? { destination: titleCaseMarket(richest.destination ?? ""), midpoint: Math.round(richestMid) } : null,
        };
      }).sort((a, b) => {
        const order = { hot: 0, warm: 1, cold: 2 } as const;
        return order[a.heat] - order[b.heat] || (b.avgRpm ?? 0) - (a.avgRpm ?? 0);
      });
      const inbound = [...byDest.entries()].map(([city, list]) => {
        const rpms = list.map((r) => {
          const direct = marketNum(r.rpm);
          if (direct != null) return direct;
          const mid = marketNum(r.midpoint);
          const dist = marketNum(r.distance);
          return mid != null && dist ? mid / dist : null;
        });
        const avgRpm = avg(rpms);
        const avgLoad = avg(list.map((r) => marketNum(r.midpoint)));
        return {
          city: titleCaseMarket(city),
          heat: inboundHeat(avgRpm, avgLoad),
          avgRpm,
          avgLoad: avgLoad != null ? Math.round(avgLoad) : null,
          lanes: list.length,
        };
      }).sort((a, b) => {
        const order = { hot: 0, warm: 1, cold: 2 } as const;
        return order[a.heat] - order[b.heat] || (b.avgLoad ?? 0) - (a.avgLoad ?? 0);
      });
      const topLanes = [...rows]
        .sort((a, b) => (marketNum(b.midpoint) ?? 0) - (marketNum(a.midpoint) ?? 0))
        .slice(0, 12)
        .map((r) => ({
          origin: shortOrigin(r.origin ?? ""),
          destination: titleCaseMarket(r.destination ?? ""),
          midpoint: marketNum(r.midpoint) != null ? Math.round(marketNum(r.midpoint) as number) : null,
          rpm: (() => {
            const direct = marketNum(r.rpm);
            if (direct != null) return Math.round(direct * 100) / 100;
            const mid = marketNum(r.midpoint);
            const dist = marketNum(r.distance);
            return mid != null && dist ? Math.round((mid / dist) * 100) / 100 : null;
          })(),
          miles: marketNum(r.distance) != null ? Math.round(marketNum(r.distance) as number) : null,
          availability: marketNum(r.availability),
        }));
      return { ok: true, weekEnding, source: "USDA AgTransport", outbound, inbound, topLanes, error: null };
    },
  }),

  getDieselPrices: defineAction({
    request: z.object({}),
    response: z.object({
      ok: z.boolean(),
      asOf: z.string().nullable(),
      source: z.string(),
      national: z.number().nullable(),
      states: z.array(z.object({ state: z.string(), price: z.number() })),
      error: z.string().nullable(),
    }),
    async handler() {
      const states = await fetchAaaDieselPrices();
      if (states.length === 0) {
        return { ok: false, asOf: null, source: "AAA", national: null, states: [], error: "Diesel prices are temporarily unavailable. Try again in a few minutes." };
      }
      const national = Math.round((states.reduce((sum, s) => sum + s.price, 0) / states.length) * 100) / 100;
      return { ok: true, asOf: new Date().toISOString().slice(0, 10), source: "AAA", national, states: states.sort((a, b) => a.price - b.price), error: null };
    },
  }),

  getSubscriptionStatus: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema }),
    response: z.object({
      hasPro: z.boolean(),
      lifetimePro: z.boolean(),
      plan: planSchema.nullable(),
      status: z.string(),
      renewsAt: z.string().nullable(),
      cancelAtPeriodEnd: z.boolean(),
    }),
    async handler(ctx, args) {
      const account = await requireAccount(ctx, args.sessionToken);
      const row = (await ctx.db<typeof schema>().select().from(schema.stripeSubscriptions).where(eq(schema.stripeSubscriptions.accountId, account.id)).limit(1))[0];
      return {
        hasPro: await accountHasProAccess(ctx, account),
        lifetimePro: account.role !== "standard",
        plan: row?.plan ?? null,
        status: row?.status ?? "none",
        renewsAt: row?.currentPeriodEnd ? row.currentPeriodEnd.toISOString() : null,
        cancelAtPeriodEnd: row?.cancelAtPeriodEnd ?? false,
      };
    },
  }),

  createCheckoutSession: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema, plan: planSchema }),
    response: z.object({ url: z.string().url() }),
    async handler(ctx, args) {
      const account = await requireAccount(ctx, args.sessionToken);
      const customerId = await getOrCreateStripeCustomer(ctx, account);
      const session = await stripeApi("/checkout/sessions", "POST", {
        "mode": "subscription",
        "customer": customerId,
        "payment_method_types[0]": "card",
        "payment_method_types[1]": "cashapp",
        "line_items[0][price]": stripeTestPriceByPlan[args.plan],
        "line_items[0][quantity]": "1",
        "client_reference_id": String(account.id),
        "metadata[accountId]": String(account.id),
        "subscription_data[metadata][accountId]": String(account.id),
        "subscription_data[trial_period_days]": "3",
        "success_url": "https://rigrevenue.onrender.com/?checkout=success&session_id={CHECKOUT_SESSION_ID}",
        "cancel_url": "https://rigrevenue.onrender.com/?checkout=cancelled",
      });
      if (!session.url) throw new Error("Stripe did not return a checkout URL.");
      return { url: session.url };
    },
  }),

  verifyCheckoutSession: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema, sessionId: z.string().min(1).max(200) }),
    response: z.object({ hasPro: z.boolean(), plan: planSchema.nullable(), renewsAt: z.string().nullable() }),
    async handler(ctx, args) {
      const account = await requireAccount(ctx, args.sessionToken);
      const db = ctx.db<typeof schema>();
      const session = await stripeApi(`/checkout/sessions/${encodeURIComponent(args.sessionId)}`, "GET");
      const sessionAccountId = Number(session?.metadata?.accountId ?? session?.client_reference_id) || null;
      if (sessionAccountId !== account.id) throw new Error("This checkout session belongs to a different account.");
      let plan: "weekly" | "monthly" | "yearly" | null = null;
      let renewsAt: string | null = null;
      const subscriptionId = typeof session.subscription === "string" ? session.subscription : null;
      if (subscriptionId) {
        const subscription = await stripeApi(`/subscriptions/${subscriptionId}`, "GET");
        const subStatus = String(subscription?.status || "");
        // Trial checkouts collect no upfront payment, so gate on the
        // subscription's status instead of the session's payment_status.
        if (subStatus === "active" || subStatus === "trialing") {
          const priceId = subscription?.items?.data?.[0]?.price?.id;
          plan = (typeof priceId === "string" && stripeTestPlanByPrice[priceId]) || null;
          const periodEnd = typeof subscription.current_period_end === "number" ? new Date(subscription.current_period_end * 1000) : null;
          renewsAt = periodEnd ? periodEnd.toISOString() : null;
          const values = {
            stripeCustomerId: String(subscription.customer),
            stripeSubscriptionId: subscriptionId,
            plan,
            status: String(subscription.status || "unknown"),
            currentPeriodEnd: periodEnd,
            cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
            updatedAt: new Date(),
          };
          const existing = (await db.select().from(schema.stripeSubscriptions).where(eq(schema.stripeSubscriptions.accountId, account.id)).limit(1))[0];
          if (existing) await db.update(schema.stripeSubscriptions).set(values).where(eq(schema.stripeSubscriptions.id, existing.id));
          else await db.insert(schema.stripeSubscriptions).values({ accountId: account.id, ...values });
        }
      }
      return { hasPro: await accountHasProAccess(ctx, account), plan, renewsAt };
    },
  }),

  createBillingPortalSession: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema }),
    response: z.object({ url: z.string().url() }),
    async handler(ctx, args) {
      const account = await requireAccount(ctx, args.sessionToken);
      const row = (await ctx.db<typeof schema>().select().from(schema.stripeSubscriptions).where(eq(schema.stripeSubscriptions.accountId, account.id)).limit(1))[0];
      if (!row?.stripeCustomerId) throw new Error("No billing account found yet.");
      const portal = await stripeApi("/billing_portal/sessions", "POST", {
        customer: row.stripeCustomerId,
        return_url: "https://rigrevenue.onrender.com/",
      });
      if (!portal.url) throw new Error("Stripe did not return a billing portal URL.");
      return { url: portal.url };
    },
  }),
} satisfies ActionsModule;
