// @bun
var __defProp = Object.defineProperty;
var __returnValue = (v) => v;
function __exportSetter(name, newValue) {
  this[name] = __returnValue.bind(null, newValue);
}
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {
      get: all[name],
      enumerable: true,
      configurable: true,
      set: __exportSetter.bind(all, name)
    });
};

// src/server.ts
import { readFile } from "fs/promises";
import { extname, join, normalize } from "path";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { z as z2 } from "zod";

// src/runtime.ts
import { z } from "zod";
function defineAction(spec) {
  return spec;
}

// src/actions.ts
import { and, asc, desc, eq, gte, inArray, isNull, lte } from "drizzle-orm";

// src/schema.ts
var exports_schema = {};
__export(exports_schema, {
  accountSessions: () => accountSessions,
  accounts: () => accounts,
  compInvites: () => compInvites,
  companyProfile: () => companyProfile,
  documents: () => documents,
  driverPostLikes: () => driverPostLikes,
  driverPosts: () => driverPosts,
  driverReplies: () => driverReplies,
  expenses: () => expenses,
  iftaEntries: () => iftaEntries,
  invoices: () => invoices,
  loads: () => loads,
  paySettings: () => paySettings,
  subscriptionAccess: () => subscriptionAccess,
  truckProfiles: () => truckProfiles,
  workShifts: () => workShifts
});
import { boolean, index, integer, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
var createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
var updatedAt = () => timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();
var accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  viewerFbid: text("viewer_fbid").notNull(),
  displayName: text("display_name").notNull(),
  email: text("email"),
  authProvider: text("auth_provider", { enum: ["google", "apple", "muse", "email"] }).notNull().default("muse"),
  passwordHash: text("password_hash"),
  passwordSalt: text("password_salt"),
  role: text("role", { enum: ["standard", "creator", "tester"] }).notNull().default("standard"),
  accessLabel: text("access_label"),
  createdAt: createdAt(),
  updatedAt: updatedAt()
}, (table) => [uniqueIndex("accounts_viewer_fbid_unique").on(table.viewerFbid), uniqueIndex("accounts_email_unique").on(table.email)]);
var driverPosts = pgTable("driver_posts", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  createdAt: createdAt()
}, (table) => [index("driver_posts_created_at_idx").on(table.createdAt)]);
var driverReplies = pgTable("driver_replies", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => driverPosts.id, { onDelete: "cascade" }),
  accountId: integer("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  createdAt: createdAt()
}, (table) => [index("driver_replies_post_created_idx").on(table.postId, table.createdAt)]);
var driverPostLikes = pgTable("driver_post_likes", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => driverPosts.id, { onDelete: "cascade" }),
  accountId: integer("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
  createdAt: createdAt()
}, (table) => [uniqueIndex("driver_post_likes_post_account_unique").on(table.postId, table.accountId)]);
var accountSessions = pgTable("account_sessions", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
  sessionTokenHash: text("session_token_hash").notNull(),
  createdAt: createdAt(),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [uniqueIndex("account_sessions_token_hash_unique").on(table.sessionTokenHash)]);
var truckProfiles = pgTable("truck_profiles", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
  truckName: text("truck_name").notNull(),
  currentOdometerTenths: integer("current_odometer_tenths").notNull(),
  lastPmOdometerTenths: integer("last_pm_odometer_tenths").notNull(),
  pmIntervalTenths: integer("pm_interval_tenths").notNull(),
  heightInches: integer("height_inches").notNull().default(162),
  weightPounds: integer("weight_pounds").notNull().default(80000),
  lengthFeet: integer("length_feet").notNull().default(75),
  widthInches: integer("width_inches").notNull().default(102),
  hasPrePass: boolean("has_prepass").notNull().default(false),
  updatedAt: updatedAt()
}, (table) => [uniqueIndex("truck_profiles_account_id_unique").on(table.accountId)]);
var loads = pgTable("loads", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").references(() => accounts.id, { onDelete: "cascade" }),
  reference: text("reference"),
  broker: text("broker"),
  origin: text("origin").notNull(),
  destination: text("destination").notNull(),
  deliveredOn: text("delivered_on").notNull(),
  loadedMilesTenths: integer("loaded_miles_tenths").notNull(),
  deadheadMilesTenths: integer("deadhead_miles_tenths").notNull().default(0),
  grossPayCents: integer("gross_pay_cents").notNull(),
  payMode: text("pay_mode", { enum: ["flat", "percentage", "per_mile"] }).notNull().default("flat"),
  loadGrossCents: integer("load_gross_cents"),
  payPercentBasisPoints: integer("pay_percent_basis_points"),
  perMileRateCents: integer("per_mile_rate_cents"),
  notes: text("notes"),
  createdAt: createdAt()
});
var paySettings = pgTable("pay_settings", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").references(() => accounts.id, { onDelete: "cascade" }),
  driverType: text("driver_type", { enum: ["company_driver", "lease_purchase", "owner_operator", "hourly_driver"] }).notNull(),
  vehicleType: text("vehicle_type", { enum: ["dump_truck", "cement_mixer", "straight_truck", "hotshot", "tractor_trailer"] }),
  hourlyRateCents: integer("hourly_rate_cents").notNull().default(0),
  payMode: text("pay_mode", { enum: ["flat", "percentage", "per_mile"] }).notNull(),
  defaultPayPercentBasisPoints: integer("default_pay_percent_basis_points").notNull(),
  defaultPerMileCents: integer("default_per_mile_cents").notNull().default(0),
  weeklyTruckPaymentCents: integer("weekly_truck_payment_cents").notNull().default(0),
  weeklyMaintenanceEscrowCents: integer("weekly_maintenance_escrow_cents").notNull().default(0),
  weeklyInsuranceCents: integer("weekly_insurance_cents").notNull().default(0),
  weeklyOtherDeductionsCents: integer("weekly_other_deductions_cents").notNull().default(0),
  updatedAt: updatedAt()
});
var workShifts = pgTable("work_shifts", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
  workDate: text("work_date").notNull(),
  clockInAt: timestamp("clock_in_at", { withTimezone: true }).notNull(),
  clockOutAt: timestamp("clock_out_at", { withTimezone: true }),
  notes: text("notes"),
  createdAt: createdAt()
});
var subscriptionAccess = pgTable("subscription_access", {
  id: serial("id").primaryKey(),
  clientId: text("client_id").notNull(),
  role: text("role", { enum: ["creator", "tester"] }).notNull(),
  label: text("label"),
  createdAt: createdAt()
}, (table) => [uniqueIndex("subscription_access_client_id_unique").on(table.clientId)]);
var compInvites = pgTable("comp_invites", {
  id: serial("id").primaryKey(),
  codeHash: text("code_hash").notNull(),
  codeHint: text("code_hint").notNull(),
  label: text("label").notNull(),
  createdByClientId: text("created_by_client_id").notNull(),
  redeemedByClientId: text("redeemed_by_client_id"),
  createdAt: createdAt(),
  redeemedAt: timestamp("redeemed_at", { withTimezone: true })
}, (table) => [uniqueIndex("comp_invites_code_hash_unique").on(table.codeHash)]);
var expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").references(() => accounts.id, { onDelete: "cascade" }),
  category: text("category", { enum: ["fuel", "tolls", "maintenance", "insurance", "truck_payment", "other"] }).notNull(),
  description: text("description"),
  expenseDate: text("expense_date").notNull(),
  amountCents: integer("amount_cents").notNull(),
  gallonsThousandths: integer("gallons_thousandths"),
  fuelState: text("fuel_state"),
  receiptBlobKey: text("receipt_blob_key"),
  createdAt: createdAt()
});
var iftaEntries = pgTable("ifta_entries", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").references(() => accounts.id, { onDelete: "cascade" }),
  loadId: integer("load_id").references(() => loads.id, { onDelete: "cascade" }),
  stateCode: text("state_code").notNull(),
  milesTenths: integer("miles_tenths").notNull().default(0),
  gallonsThousandths: integer("gallons_thousandths").notNull().default(0),
  source: text("source", { enum: ["load", "gps", "manual", "fuel"] }).notNull(),
  entryDate: text("entry_date").notNull(),
  createdAt: createdAt()
});
var invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").references(() => accounts.id, { onDelete: "cascade" }),
  loadId: integer("load_id").notNull().references(() => loads.id, { onDelete: "cascade" }),
  invoiceNumber: text("invoice_number").notNull(),
  recipientEmail: text("recipient_email"),
  dueDate: text("due_date").notNull(),
  status: text("status", { enum: ["draft", "sent", "paid"] }).notNull().default("draft"),
  notes: text("notes"),
  createdAt: createdAt(),
  sentAt: timestamp("sent_at", { withTimezone: true })
}, (table) => [uniqueIndex("invoices_invoice_number_unique").on(table.invoiceNumber)]);
var documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").references(() => accounts.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  category: text("category", { enum: ["bol", "insurance", "registration", "other"] }).notNull(),
  expiresOn: text("expires_on"),
  blobKey: text("blob_key").notNull(),
  mimeType: text("mime_type").notNull(),
  filename: text("filename").notNull(),
  createdAt: createdAt()
});
var companyProfile = pgTable("company_profile", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").references(() => accounts.id, { onDelete: "cascade" }),
  companyName: text("company_name").notNull(),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  ein: text("ein"),
  mcNumber: text("mc_number"),
  dotNumber: text("dot_number"),
  logoBlobKey: text("logo_blob_key"),
  updatedAt: updatedAt()
});

// src/actions.ts
var driverTypeSchema = z.enum(["company_driver", "lease_purchase", "owner_operator", "hourly_driver"]);
var vehicleTypeSchema = z.enum(["dump_truck", "cement_mixer", "straight_truck", "hotshot", "tractor_trailer"]);
var payModeSchema = z.enum(["flat", "percentage", "per_mile"]);
var accessRoleSchema = z.enum(["standard", "creator", "tester"]);
var authProviderSchema = z.enum(["google", "apple", "muse", "email"]);
var clientIdSchema = z.string().trim().min(16).max(128);
var emailSchema = z.string().trim().email().max(160);
var passwordSchema = z.string().min(10).max(128);
var sessionTokenSchema = z.string().regex(/^[a-f0-9]{64}$/);
var samScopeSchema = z.enum([
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
  "out_of_scope"
]);
var samResponseSchema = z.object({
  reply: z.string(),
  scope: samScopeSchema,
  sources: z.array(z.object({ title: z.string(), url: z.string().url() }))
});
var categorySchema = z.enum([
  "fuel",
  "tolls",
  "maintenance",
  "insurance",
  "truck_payment",
  "other"
]);
var loadSchema = z.object({
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
  createdAt: z.string()
});
var expenseSchema = z.object({
  id: z.number(),
  category: categorySchema,
  description: z.string().nullable(),
  expenseDate: z.string(),
  amount: z.number(),
  gallons: z.number().nullable(),
  fuelState: z.string().nullable(),
  receiptUrl: z.string().nullable(),
  createdAt: z.string()
});
var activitySchema = z.object({
  type: z.enum(["load", "expense", "shift"]),
  id: z.number(),
  date: z.string(),
  title: z.string(),
  detail: z.string(),
  amount: z.number()
});
var shiftSchema = z.object({
  id: z.number(),
  workDate: z.string(),
  clockInAt: z.string(),
  clockOutAt: z.string().nullable(),
  hours: z.number(),
  notes: z.string().nullable()
});
var hourlyDaySchema = z.object({
  date: z.string(),
  hours: z.number(),
  regularHours: z.number(),
  overtimeHours: z.number(),
  grossPay: z.number()
});
var hourlySummarySchema = z.object({
  totalHours: z.number(),
  regularHours: z.number(),
  overtimeHours: z.number(),
  grossPay: z.number(),
  hourlyRate: z.number(),
  openShift: shiftSchema.nullable(),
  days: z.array(hourlyDaySchema)
});
var truckPlaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.enum(["truck_stop", "repair", "rest_area", "cat_scale"]),
  address: z.string().nullable(),
  lat: z.number(),
  lng: z.number(),
  distanceMiles: z.number()
});
var scannedLoadSchema = z.object({
  origin: z.string().nullable(),
  destination: z.string().nullable(),
  loadedMiles: z.number().nullable(),
  grossPay: z.number().nullable(),
  reference: z.string().nullable(),
  broker: z.string().nullable()
});
var truckingNewsItemSchema = z.object({
  title: z.string(),
  summary: z.string(),
  category: z.enum(["regulations", "fuel", "rates", "industry"]),
  source: z.string(),
  sourceUrl: z.string().url(),
  publishedLabel: z.string().nullable()
});
var documentCategorySchema = z.enum(["bol", "insurance", "registration", "other"]);
var invoiceStatusSchema = z.enum(["draft", "sent", "paid"]);
var companyProfileSchema = z.object({
  companyName: z.string(),
  address: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  ein: z.string().nullable(),
  mcNumber: z.string().nullable(),
  dotNumber: z.string().nullable(),
  logoUrl: z.string().nullable()
});
var accountSchema = z.object({
  id: z.number(),
  displayName: z.string(),
  email: z.string().nullable(),
  authProvider: authProviderSchema,
  role: accessRoleSchema,
  accessLabel: z.string().nullable(),
  createdAt: z.string()
});
var driverReplySchema = z.object({
  id: z.number(),
  postId: z.number(),
  driverName: z.string(),
  body: z.string(),
  createdAt: z.string()
});
var driverPostSchema = z.object({
  id: z.number(),
  driverName: z.string(),
  body: z.string(),
  createdAt: z.string(),
  likeCount: z.number(),
  likedByViewer: z.boolean(),
  replies: z.array(driverReplySchema)
});
var roadRouteSchema = z.object({
  originLabel: z.string(),
  destinationLabel: z.string(),
  distanceMiles: z.number(),
  durationMinutes: z.number(),
  shape: z.array(z.object({ lat: z.number(), lng: z.number() })),
  maneuvers: z.array(z.object({ instruction: z.string(), distanceMiles: z.number(), timeMinutes: z.number() })),
  truckStops: z.array(truckPlaceSchema),
  attribution: z.string()
});
async function findAccountForViewer(ctx, viewerFbid) {
  return (await ctx.db().select().from(accounts).where(eq(accounts.viewerFbid, viewerFbid)).limit(1))[0];
}
async function hashSessionToken(token) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return bytesToHex(new Uint8Array(digest));
}
async function issueSession(ctx, accountId) {
  const token = bytesToHex(crypto.getRandomValues(new Uint8Array(32)));
  await ctx.db().insert(accountSessions).values({
    accountId,
    sessionTokenHash: await hashSessionToken(token)
  });
  return token;
}
async function findAccountForToken(ctx, token) {
  if (!token || !sessionTokenSchema.safeParse(token).success)
    return;
  const db = ctx.db();
  const tokenHash = await hashSessionToken(token);
  const session = (await db.select().from(accountSessions).where(eq(accountSessions.sessionTokenHash, tokenHash)).limit(1))[0];
  if (!session)
    return;
  const account = (await db.select().from(accounts).where(eq(accounts.id, session.accountId)).limit(1))[0];
  if (account)
    await db.update(accountSessions).set({ lastUsedAt: new Date }).where(eq(accountSessions.id, session.id));
  return account;
}
async function requireAccount(ctx, sessionToken) {
  const row = await findAccountForToken(ctx, sessionToken);
  if (!row)
    throw new Error("Your RigBooks session has ended. Sign in again.");
  return row;
}
async function ensurePrePassColumn(_ctx) {}
function bytesToHex(bytes) {
  return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
}
async function derivePasswordHash(password, saltHex) {
  const saltPairs = saltHex.match(/.{1,2}/g) ?? [];
  const salt = new Uint8Array(saltPairs.map((pair) => Number.parseInt(pair, 16)));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: 310000 }, key, 256);
  return bytesToHex(new Uint8Array(bits));
}
function safeEqualHex(left, right) {
  if (left.length !== right.length)
    return false;
  let mismatch = 0;
  for (let index = 0;index < left.length; index += 1)
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return mismatch === 0;
}
async function moveUnownedLedgerToAccount(ctx, accountId) {
  const db = ctx.db();
  await db.batch([
    db.update(loads).set({ accountId }).where(isNull(loads.accountId)),
    db.update(expenses).set({ accountId }).where(isNull(expenses.accountId)),
    db.update(paySettings).set({ accountId }).where(isNull(paySettings.accountId)),
    db.update(iftaEntries).set({ accountId }).where(isNull(iftaEntries.accountId)),
    db.update(invoices).set({ accountId }).where(isNull(invoices.accountId)),
    db.update(documents).set({ accountId }).where(isNull(documents.accountId)),
    db.update(companyProfile).set({ accountId }).where(isNull(companyProfile.accountId))
  ]);
}
function distanceMiles(lat1, lng1, lat2, lng2) {
  const radians = (value) => value * Math.PI / 180;
  const dLat = radians(lat2 - lat1);
  const dLng = radians(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(dLng / 2) ** 2;
  return 3958.8 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function cleanOptional(value) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
function stateFromLocation(value) {
  const match = value.toUpperCase().match(/(?:,|\s)\s*([A-Z]{2})(?:\s+\d{5}(?:-\d{4})?)?\s*$/);
  return match?.[1] ?? null;
}
function addDays(dateText, days) {
  const date = new Date(`${dateText}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
async function hashCompCode(code) {
  const normalized = code.trim().toUpperCase();
  const bytes = new TextEncoder().encode(normalized);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, "0")).join("");
}
function decodePolyline6(encoded) {
  const points = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte = 0;
    do {
      const code = encoded.charCodeAt(index);
      index += 1;
      byte = code - 63;
      result |= (byte & 31) << shift;
      shift += 5;
    } while (byte >= 32 && index < encoded.length);
    lat += result & 1 ? ~(result >> 1) : result >> 1;
    shift = 0;
    result = 0;
    do {
      const code = encoded.charCodeAt(index);
      index += 1;
      byte = code - 63;
      result |= (byte & 31) << shift;
      shift += 5;
    } while (byte >= 32 && index < encoded.length);
    lng += result & 1 ? ~(result >> 1) : result >> 1;
    points.push({ lat: lat / 1e6, lng: lng / 1e6 });
  }
  return points;
}
function generateCompCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  const body = Array.from(bytes, (value) => alphabet[value % alphabet.length] ?? "X").join("");
  return `RIG-${body.slice(0, 5)}-${body.slice(5)}`;
}
function toLoad(row) {
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
    createdAt: row.createdAt.toISOString()
  };
}
async function loadCompanyProfile(ctx, sessionToken) {
  const account = await requireAccount(ctx, sessionToken);
  const row = (await ctx.db().select().from(companyProfile).where(eq(companyProfile.accountId, account.id)).limit(1))[0];
  let logoUrl = null;
  if (row?.logoBlobKey) {
    try {
      logoUrl = await ctx.blobs.getUrl(row.logoBlobKey, { expiresInSeconds: 3600 });
    } catch {
      logoUrl = null;
    }
  }
  return {
    companyName: row?.companyName ?? "",
    address: row?.address ?? null,
    phone: row?.phone ?? null,
    email: row?.email ?? null,
    ein: row?.ein ?? null,
    mcNumber: row?.mcNumber ?? null,
    dotNumber: row?.dotNumber ?? null,
    logoUrl
  };
}
async function toExpense(ctx, row) {
  let receiptUrl = null;
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
    createdAt: row.createdAt.toISOString()
  };
}
function toShift(row, now = new Date) {
  const end = row.clockOutAt ?? now;
  const hours = Math.max(0, (end.getTime() - row.clockInAt.getTime()) / 3600000);
  return {
    id: row.id,
    workDate: row.workDate,
    clockInAt: row.clockInAt.toISOString(),
    clockOutAt: row.clockOutAt?.toISOString() ?? null,
    hours,
    notes: row.notes
  };
}
function summarizeHourlyShifts(rows, hourlyRateCents) {
  const now = new Date;
  const completed = rows.filter((row) => row.clockOutAt !== null);
  const openRow = rows.find((row) => row.clockOutAt === null);
  const byDate = new Map;
  for (const row of completed) {
    const hours = Math.max(0, ((row.clockOutAt?.getTime() ?? row.clockInAt.getTime()) - row.clockInAt.getTime()) / 3600000);
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
      grossPay: (regularHours * hourlyRateCents + overtimeHours * hourlyRateCents * 1.5) / 100
    };
  });
  return {
    totalHours: days.reduce((sum, day) => sum + day.hours, 0),
    regularHours: days.reduce((sum, day) => sum + day.regularHours, 0),
    overtimeHours: days.reduce((sum, day) => sum + day.overtimeHours, 0),
    grossPay: days.reduce((sum, day) => sum + day.grossPay, 0),
    hourlyRate: hourlyRateCents / 100,
    openShift: openRow ? toShift(openRow, now) : null,
    days
  };
}
var Actions = {
  getAccountStatus: defineAction({
    request: z.object({ legacyClientId: clientIdSchema, sessionToken: sessionTokenSchema.optional() }),
    response: z.object({
      authenticated: z.boolean(),
      suggestedName: z.string().nullable(),
      account: accountSchema.nullable(),
      legacyRole: accessRoleSchema,
      sessionToken: sessionTokenSchema.nullable()
    }),
    async handler(ctx, args) {
      const viewer = ctx.viewer;
      const db = ctx.db();
      let account = await findAccountForToken(ctx, args.sessionToken);
      let activeToken = account && args.sessionToken ? args.sessionToken : null;
      if (!account && viewer) {
        account = await findAccountForViewer(ctx, viewer.viewerFbid);
        if (account)
          activeToken = await issueSession(ctx, account.id);
      }
      const legacy = (await db.select().from(subscriptionAccess).where(eq(subscriptionAccess.clientId, args.legacyClientId)).limit(1))[0];
      const inheritedRole = viewer?.isOwner ? "creator" : legacy?.role ?? "standard";
      const inheritedLabel = viewer?.isOwner ? "RigBooks creator" : legacy?.label ?? null;
      if (account && account.role === "standard" && inheritedRole !== "standard") {
        await db.update(accounts).set({ role: inheritedRole, accessLabel: inheritedLabel, updatedAt: new Date }).where(eq(accounts.id, account.id));
        account.role = inheritedRole;
        account.accessLabel = inheritedLabel;
        if (inheritedRole === "creator")
          await moveUnownedLedgerToAccount(ctx, account.id);
      }
      return {
        authenticated: Boolean(account),
        suggestedName: viewer?.displayName ?? null,
        account: account ? { id: account.id, displayName: account.displayName, email: account.email, authProvider: account.authProvider, role: account.role, accessLabel: account.accessLabel, createdAt: account.createdAt.toISOString() } : null,
        legacyRole: inheritedRole,
        sessionToken: activeToken
      };
    }
  }),
  createEmailAccount: defineAction({
    request: z.object({
      displayName: z.string().trim().min(2).max(80),
      email: emailSchema,
      password: passwordSchema,
      legacyClientId: clientIdSchema
    }),
    response: z.object({ account: accountSchema, sessionToken: sessionTokenSchema }),
    async handler(ctx, args) {
      const viewer = ctx.viewer;
      const db = ctx.db();
      const normalizedEmail = args.email.trim().toLowerCase();
      const existingEmail = (await db.select({ id: accounts.id }).from(accounts).where(eq(accounts.email, normalizedEmail)).limit(1))[0];
      if (existingEmail)
        throw new Error("An account already uses that email. Sign in instead.");
      const currentAccount = viewer ? await findAccountForViewer(ctx, viewer.viewerFbid) : undefined;
      if (currentAccount)
        throw new Error("You are already signed in.");
      const legacy = (await db.select().from(subscriptionAccess).where(eq(subscriptionAccess.clientId, args.legacyClientId)).limit(1))[0];
      const role = viewer?.isOwner ? "creator" : legacy?.role ?? "standard";
      const accessLabel = viewer?.isOwner ? "RigBooks creator" : legacy?.label ?? null;
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const passwordSalt = bytesToHex(salt);
      const passwordHash = await derivePasswordHash(args.password, passwordSalt);
      const result = await db.insert(accounts).values({
        viewerFbid: `email:${crypto.randomUUID()}`,
        displayName: args.displayName.trim(),
        email: normalizedEmail,
        authProvider: "email",
        passwordHash,
        passwordSalt,
        role,
        accessLabel
      }).returning();
      const account = result[0];
      if (!account)
        throw new Error("Could not create your RigBooks account.");
      const sessionToken = await issueSession(ctx, account.id);
      if (role === "creator")
        await moveUnownedLedgerToAccount(ctx, account.id);
      ctx.invalidateQueries();
      return { account: { id: account.id, displayName: account.displayName, email: account.email, authProvider: account.authProvider, role: account.role, accessLabel: account.accessLabel, createdAt: account.createdAt.toISOString() }, sessionToken };
    }
  }),
  signInWithEmail: defineAction({
    request: z.object({ email: emailSchema, password: passwordSchema }),
    response: z.object({ account: accountSchema, sessionToken: sessionTokenSchema }),
    async handler(ctx, args) {
      const db = ctx.db();
      const normalizedEmail = args.email.trim().toLowerCase();
      const account = (await db.select().from(accounts).where(eq(accounts.email, normalizedEmail)).limit(1))[0];
      if (!account?.passwordHash || !account.passwordSalt)
        throw new Error("Email or password is incorrect.");
      const suppliedHash = await derivePasswordHash(args.password, account.passwordSalt);
      if (!safeEqualHex(account.passwordHash, suppliedHash))
        throw new Error("Email or password is incorrect.");
      const sessionToken = await issueSession(ctx, account.id);
      ctx.invalidateQueries();
      return { account: { id: account.id, displayName: account.displayName, email: account.email, authProvider: account.authProvider, role: account.role, accessLabel: account.accessLabel, createdAt: account.createdAt.toISOString() }, sessionToken };
    }
  }),
  signOut: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema.optional() }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args) {
      if (args.sessionToken) {
        const tokenHash = await hashSessionToken(args.sessionToken);
        await ctx.db().delete(accountSessions).where(eq(accountSessions.sessionTokenHash, tokenHash));
      }
      ctx.invalidateQueries();
      return { ok: true };
    }
  }),
  createAccount: defineAction({
    request: z.object({
      displayName: z.string().trim().min(2).max(80),
      email: z.string().trim().email().max(160),
      authProvider: z.enum(["google", "apple"]),
      legacyClientId: clientIdSchema
    }),
    response: accountSchema,
    async handler(ctx, args) {
      const viewer = ctx.viewer;
      if (!viewer)
        throw new Error("Sign in to Muse before creating a RigBooks account.");
      const db = ctx.db();
      const existing = (await db.select().from(accounts).where(eq(accounts.viewerFbid, viewer.viewerFbid)).limit(1))[0];
      if (existing)
        return { id: existing.id, displayName: existing.displayName, email: existing.email, authProvider: existing.authProvider, role: existing.role, accessLabel: existing.accessLabel, createdAt: existing.createdAt.toISOString() };
      const legacy = (await db.select().from(subscriptionAccess).where(eq(subscriptionAccess.clientId, args.legacyClientId)).limit(1))[0];
      const role = viewer.isOwner ? "creator" : legacy?.role ?? "standard";
      const accessLabel = viewer.isOwner ? "RigBooks creator" : legacy?.label ?? null;
      const result = await db.insert(accounts).values({
        viewerFbid: viewer.viewerFbid,
        displayName: args.displayName.trim(),
        email: args.email.trim().toLowerCase(),
        authProvider: args.authProvider,
        role,
        accessLabel
      }).returning();
      const account = result[0];
      if (!account)
        throw new Error("Could not create your RigBooks account.");
      if (role === "creator")
        await moveUnownedLedgerToAccount(ctx, account.id);
      ctx.invalidateQueries();
      return { id: account.id, displayName: account.displayName, email: account.email, authProvider: account.authProvider, role: account.role, accessLabel: account.accessLabel, createdAt: account.createdAt.toISOString() };
    }
  }),
  updateAccount: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema, displayName: z.string().trim().min(2).max(80), email: z.string().trim().email().max(160) }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args) {
      const account = await requireAccount(ctx, args.sessionToken);
      await ctx.db().update(accounts).set({ displayName: args.displayName.trim(), email: args.email.trim().toLowerCase(), updatedAt: new Date }).where(eq(accounts.id, account.id));
      ctx.invalidateQueries();
      return { ok: true };
    }
  }),
  getSubscriptionAccess: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema, clientId: clientIdSchema }),
    response: z.object({
      role: accessRoleSchema,
      label: z.string().nullable(),
      lifetimePro: z.boolean(),
      proUnlocked: z.boolean(),
      creatorClaimed: z.boolean(),
      earlyAccess: z.boolean()
    }),
    async handler(ctx, args) {
      const db = ctx.db();
      const account = await requireAccount(ctx, args.sessionToken);
      const creatorRows = await db.select({ id: accounts.id }).from(accounts).where(eq(accounts.role, "creator")).limit(1);
      return {
        role: account.role,
        label: account.accessLabel,
        lifetimePro: account.role !== "standard",
        proUnlocked: true,
        creatorClaimed: Boolean(creatorRows[0]),
        earlyAccess: account.role === "standard"
      };
    }
  }),
  claimCreatorAccess: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema, clientId: clientIdSchema }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args) {
      const db = ctx.db();
      const account = await requireAccount(ctx, args.sessionToken);
      const creatorRows = await db.select({ id: accounts.id }).from(accounts).where(eq(accounts.role, "creator")).limit(1);
      const existingCreator = creatorRows[0];
      if (existingCreator && existingCreator.id !== account.id)
        throw new Error("Creator access has already been claimed.");
      await db.update(accounts).set({ role: "creator", accessLabel: "RigBooks creator", updatedAt: new Date }).where(eq(accounts.id, account.id));
      const legacyRows = await db.select({ id: subscriptionAccess.id }).from(subscriptionAccess).where(eq(subscriptionAccess.clientId, args.clientId)).limit(1);
      if (!legacyRows[0])
        await db.insert(subscriptionAccess).values({ clientId: args.clientId, role: "creator", label: "RigBooks creator" });
      await db.batch([
        db.update(loads).set({ accountId: account.id }).where(isNull(loads.accountId)),
        db.update(expenses).set({ accountId: account.id }).where(isNull(expenses.accountId)),
        db.update(paySettings).set({ accountId: account.id }).where(isNull(paySettings.accountId)),
        db.update(iftaEntries).set({ accountId: account.id }).where(isNull(iftaEntries.accountId)),
        db.update(invoices).set({ accountId: account.id }).where(isNull(invoices.accountId)),
        db.update(documents).set({ accountId: account.id }).where(isNull(documents.accountId)),
        db.update(companyProfile).set({ accountId: account.id }).where(isNull(companyProfile.accountId))
      ]);
      ctx.invalidateQueries();
      return { ok: true };
    }
  }),
  createCompInvite: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema, clientId: clientIdSchema, label: z.string().trim().min(1).max(80) }),
    response: z.object({ code: z.string(), label: z.string() }),
    async handler(ctx, args) {
      const db = ctx.db();
      const account = await requireAccount(ctx, args.sessionToken);
      if (account.role !== "creator")
        throw new Error("Only the creator can issue lifetime tester access.");
      const code = generateCompCode();
      const codeHash = await hashCompCode(code);
      await db.insert(compInvites).values({
        codeHash,
        codeHint: code.slice(-5),
        label: args.label.trim(),
        createdByClientId: args.clientId
      });
      return { code, label: args.label.trim() };
    }
  }),
  redeemCompInvite: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema, clientId: clientIdSchema, code: z.string().trim().min(8).max(40) }),
    response: z.object({ ok: z.literal(true), label: z.string() }),
    async handler(ctx, args) {
      const db = ctx.db();
      const account = await requireAccount(ctx, args.sessionToken);
      const codeHash = await hashCompCode(args.code);
      const inviteRows = await db.select().from(compInvites).where(eq(compInvites.codeHash, codeHash)).limit(1);
      const invite = inviteRows[0];
      if (!invite)
        throw new Error("That tester code is not valid.");
      if (invite.redeemedByClientId && invite.redeemedByClientId !== args.clientId)
        throw new Error("That tester code has already been used.");
      await db.update(accounts).set({ role: "tester", accessLabel: invite.label, updatedAt: new Date }).where(eq(accounts.id, account.id));
      const legacyRows = await db.select({ id: subscriptionAccess.id }).from(subscriptionAccess).where(eq(subscriptionAccess.clientId, args.clientId)).limit(1);
      if (!legacyRows[0])
        await db.insert(subscriptionAccess).values({ clientId: args.clientId, role: "tester", label: invite.label });
      await db.update(compInvites).set({ redeemedByClientId: args.clientId, redeemedAt: new Date }).where(eq(compInvites.id, invite.id));
      ctx.invalidateQueries();
      return { ok: true, label: invite.label };
    }
  }),
  getPaySettings: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema }),
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
      configured: z.boolean()
    }),
    async handler(ctx, args) {
      const account = await requireAccount(ctx, args.sessionToken);
      const rows = await ctx.db().select().from(paySettings).where(eq(paySettings.accountId, account.id)).limit(1);
      const settings = rows[0];
      if (!settings) {
        return { driverType: "owner_operator", vehicleType: null, hourlyRate: 0, payMode: "flat", defaultPayPercent: 100, defaultPerMile: 0, weeklyTruckPayment: 0, weeklyMaintenanceEscrow: 0, weeklyInsurance: 0, weeklyOtherDeductions: 0, configured: false };
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
        configured: true
      };
    }
  }),
  savePaySettings: defineAction({
    request: z.object({
      sessionToken: sessionTokenSchema,
      driverType: driverTypeSchema,
      vehicleType: vehicleTypeSchema.nullable(),
      hourlyRate: z.number().finite().min(0).max(1000),
      payMode: payModeSchema,
      defaultPayPercent: z.number().finite().positive().max(100),
      defaultPerMile: z.number().finite().min(0).max(100),
      weeklyTruckPayment: z.number().finite().min(0).max(1e5),
      weeklyMaintenanceEscrow: z.number().finite().min(0).max(1e5),
      weeklyInsurance: z.number().finite().min(0).max(1e5),
      weeklyOtherDeductions: z.number().finite().min(0).max(1e5)
    }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args) {
      const db = ctx.db();
      const account = await requireAccount(ctx, args.sessionToken);
      if (args.driverType === "hourly_driver" && (!args.vehicleType || args.hourlyRate <= 0)) {
        throw new Error("Choose a vehicle type and enter an hourly rate.");
      }
      const existing = await db.select({ id: paySettings.id }).from(paySettings).where(eq(paySettings.accountId, account.id)).limit(1);
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
        updatedAt: new Date
      };
      if (existing[0]) {
        await db.update(paySettings).set(values).where(eq(paySettings.id, existing[0].id));
      } else {
        await db.insert(paySettings).values(values);
      }
      ctx.invalidateQueries();
      return { ok: true };
    }
  }),
  getHourlyWeek: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema, weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }),
    response: z.object({ summary: hourlySummarySchema, shifts: z.array(shiftSchema) }),
    async handler(ctx, args) {
      const account = await requireAccount(ctx, args.sessionToken);
      const db = ctx.db();
      const pay = (await db.select().from(paySettings).where(eq(paySettings.accountId, account.id)).limit(1))[0];
      const weekEnd = addDays(args.weekStart, 6);
      const rows = await db.select().from(workShifts).where(and(eq(workShifts.accountId, account.id), gte(workShifts.workDate, args.weekStart), lte(workShifts.workDate, weekEnd))).orderBy(desc(workShifts.clockInAt));
      return { summary: summarizeHourlyShifts(rows, pay?.hourlyRateCents ?? 0), shifts: rows.map((row) => toShift(row)) };
    }
  }),
  clockIn: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema, workDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), notes: z.string().trim().max(240).optional() }),
    response: z.object({ shift: shiftSchema }),
    async handler(ctx, args) {
      const account = await requireAccount(ctx, args.sessionToken);
      const db = ctx.db();
      const pay = (await db.select().from(paySettings).where(eq(paySettings.accountId, account.id)).limit(1))[0];
      if (pay?.driverType !== "hourly_driver")
        throw new Error("Switch your pay profile to Hourly driver before clocking in.");
      const open = (await db.select().from(workShifts).where(and(eq(workShifts.accountId, account.id), isNull(workShifts.clockOutAt))).limit(1))[0];
      if (open)
        throw new Error("You already have an open shift.");
      const row = (await db.insert(workShifts).values({ accountId: account.id, workDate: args.workDate, clockInAt: new Date, notes: cleanOptional(args.notes) }).returning())[0];
      if (!row)
        throw new Error("Could not start your shift.");
      ctx.invalidateQueries();
      return { shift: toShift(row) };
    }
  }),
  clockOut: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema }),
    response: z.object({ shift: shiftSchema }),
    async handler(ctx, args) {
      const account = await requireAccount(ctx, args.sessionToken);
      const db = ctx.db();
      const open = (await db.select().from(workShifts).where(and(eq(workShifts.accountId, account.id), isNull(workShifts.clockOutAt))).orderBy(desc(workShifts.clockInAt)).limit(1))[0];
      if (!open)
        throw new Error("There is no open shift to end.");
      const endedAt = new Date;
      await db.update(workShifts).set({ clockOutAt: endedAt }).where(eq(workShifts.id, open.id));
      ctx.invalidateQueries();
      return { shift: toShift({ ...open, clockOutAt: endedAt }) };
    }
  }),
  createManualShift: defineAction({
    request: z.object({
      sessionToken: sessionTokenSchema,
      workDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      clockInAt: z.string().datetime(),
      clockOutAt: z.string().datetime(),
      notes: z.string().trim().max(240).optional()
    }),
    response: z.object({ shift: shiftSchema }),
    async handler(ctx, args) {
      const account = await requireAccount(ctx, args.sessionToken);
      const start = new Date(args.clockInAt);
      const end = new Date(args.clockOutAt);
      const hours = (end.getTime() - start.getTime()) / 3600000;
      if (!Number.isFinite(hours) || hours <= 0 || hours > 24)
        throw new Error("Clock-out must be after clock-in and no more than 24 hours later.");
      const row = (await ctx.db().insert(workShifts).values({ accountId: account.id, workDate: args.workDate, clockInAt: start, clockOutAt: end, notes: cleanOptional(args.notes) }).returning())[0];
      if (!row)
        throw new Error("Could not save that shift.");
      ctx.invalidateQueries();
      return { shift: toShift(row) };
    }
  }),
  deleteShift: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema, id: z.number().int().positive() }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args) {
      const account = await requireAccount(ctx, args.sessionToken);
      await ctx.db().delete(workShifts).where(and(eq(workShifts.id, args.id), eq(workShifts.accountId, account.id)));
      ctx.invalidateQueries();
      return { ok: true };
    }
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
      recent: z.array(activitySchema)
    }),
    async handler(ctx, args) {
      const db = ctx.db();
      const account = await requireAccount(ctx, args.sessionToken);
      const loadRows = args.fromDate ? await db.select().from(loads).where(and(eq(loads.accountId, account.id), gte(loads.deliveredOn, args.fromDate))) : await db.select().from(loads).where(eq(loads.accountId, account.id));
      const expenseRows = args.fromDate ? await db.select().from(expenses).where(and(eq(expenses.accountId, account.id), gte(expenses.expenseDate, args.fromDate))) : await db.select().from(expenses).where(eq(expenses.accountId, account.id));
      const payRows = await db.select().from(paySettings).where(eq(paySettings.accountId, account.id)).limit(1);
      const revenueCents = loadRows.reduce((sum, row) => sum + row.grossPayCents, 0);
      const expenseCents = expenseRows.reduce((sum, row) => sum + row.amountCents, 0);
      const totalMilesTenths = loadRows.reduce((sum, row) => sum + row.loadedMilesTenths + row.deadheadMilesTenths, 0);
      const totalMiles = totalMilesTenths / 10;
      const net = (revenueCents - expenseCents) / 100;
      const pay = payRows[0];
      const truckPayment = (pay?.weeklyTruckPaymentCents ?? 0) / 100;
      const maintenanceEscrow = (pay?.weeklyMaintenanceEscrowCents ?? 0) / 100;
      const insurance = (pay?.weeklyInsuranceCents ?? 0) / 100;
      const other = (pay?.weeklyOtherDeductionsCents ?? 0) / 100;
      const deductionTotal = truckPayment + maintenanceEscrow + insurance + other;
      const grossSettlement = revenueCents / 100;
      const recent = [
        ...loadRows.map((row) => ({
          type: "load",
          id: row.id,
          date: row.deliveredOn,
          title: `${row.origin} \u2192 ${row.destination}`,
          detail: row.reference ? `Load ${row.reference}` : `${(row.loadedMilesTenths + row.deadheadMilesTenths) / 10} mi`,
          amount: row.grossPayCents / 100
        })),
        ...expenseRows.map((row) => ({
          type: "expense",
          id: row.id,
          date: row.expenseDate,
          title: row.description || row.category.replace("_", " "),
          detail: row.category.replace("_", " "),
          amount: -(row.amountCents / 100)
        }))
      ].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id).slice(0, 8);
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
        recent
      };
    }
  }),
  listLoads: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema, limit: z.number().int().positive().max(250).default(100) }),
    response: z.object({ loads: z.array(loadSchema) }),
    async handler(ctx, args) {
      const account = await requireAccount(ctx, args.sessionToken);
      const rows = await ctx.db().select().from(loads).where(eq(loads.accountId, account.id)).orderBy(desc(loads.deliveredOn), desc(loads.id)).limit(args.limit);
      return { loads: rows.map(toLoad) };
    }
  }),
  createLoad: defineAction({
    request: z.object({
      sessionToken: sessionTokenSchema,
      reference: z.string().max(80).optional(),
      broker: z.string().max(120).optional(),
      origin: z.string().trim().min(2).max(120),
      destination: z.string().trim().min(2).max(120),
      deliveredOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      loadedMiles: z.number().finite().positive().max(1e5),
      deadheadMiles: z.number().finite().min(0).max(1e5).default(0),
      payMode: payModeSchema.default("flat"),
      grossPay: z.number().finite().positive().max(1e7).optional(),
      loadGross: z.number().finite().positive().max(1e7).optional(),
      payPercent: z.number().finite().positive().max(100).optional(),
      perMileRate: z.number().finite().positive().max(100).optional(),
      notes: z.string().max(1000).optional()
    }),
    response: z.object({ id: z.number() }),
    async handler(ctx, args) {
      const loadGrossCents = args.loadGross == null ? null : Math.round(args.loadGross * 100);
      const payPercentBasisPoints = args.payPercent == null ? null : Math.round(args.payPercent * 100);
      const perMileRateCents = args.perMileRate == null ? null : Math.round(args.perMileRate * 100);
      const grossPayCents = args.payMode === "percentage" ? loadGrossCents != null && payPercentBasisPoints != null ? Math.round(loadGrossCents * payPercentBasisPoints / 1e4) : 0 : args.payMode === "per_mile" ? perMileRateCents != null ? Math.round((args.loadedMiles + args.deadheadMiles) * perMileRateCents) : 0 : Math.round((args.grossPay ?? 0) * 100);
      if (grossPayCents <= 0)
        throw new Error("Enter the load pay details.");
      const db = ctx.db();
      const account = await requireAccount(ctx, args.sessionToken);
      const result = await db.insert(loads).values({
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
        notes: cleanOptional(args.notes)
      }).returning({ id: loads.id });
      const inserted = result[0];
      if (!inserted)
        throw new Error("Could not save the load.");
      const originState = stateFromLocation(args.origin);
      const destinationState = stateFromLocation(args.destination);
      await db.insert(iftaEntries).values({
        accountId: account.id,
        loadId: inserted.id,
        stateCode: originState && originState === destinationState ? originState : "UN",
        milesTenths: Math.round((args.loadedMiles + args.deadheadMiles) * 10),
        gallonsThousandths: 0,
        source: "load",
        entryDate: args.deliveredOn
      });
      ctx.invalidateQueries();
      return { id: inserted.id };
    }
  }),
  listExpenses: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema, limit: z.number().int().positive().max(250).default(100) }),
    response: z.object({ expenses: z.array(expenseSchema) }),
    async handler(ctx, args) {
      const account = await requireAccount(ctx, args.sessionToken);
      const rows = await ctx.db().select().from(expenses).where(eq(expenses.accountId, account.id)).orderBy(desc(expenses.expenseDate), desc(expenses.id)).limit(args.limit);
      return { expenses: await Promise.all(rows.map((row) => toExpense(ctx, row))) };
    }
  }),
  createExpense: defineAction({
    request: z.object({
      sessionToken: sessionTokenSchema,
      category: categorySchema,
      description: z.string().max(160).optional(),
      expenseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      amount: z.number().finite().positive().max(1e7),
      gallons: z.number().finite().positive().max(1e4).optional(),
      fuelState: z.string().trim().regex(/^[A-Za-z]{2}$/).optional(),
      receiptDataBase64: z.string().max(16000000).optional(),
      receiptMimeType: z.enum(["image/jpeg", "image/png", "image/webp"]).optional()
    }),
    response: z.object({ id: z.number() }),
    async handler(ctx, args) {
      let receiptBlobKey = null;
      if (args.receiptDataBase64 && args.receiptMimeType) {
        const bytes = Buffer.from(args.receiptDataBase64, "base64");
        if (bytes.byteLength > 1e7)
          throw new Error("Receipt image is too large.");
        const extension = args.receiptMimeType === "image/png" ? "png" : args.receiptMimeType === "image/webp" ? "webp" : "jpg";
        receiptBlobKey = `receipts/${crypto.randomUUID()}.${extension}`;
        await ctx.blobs.put(receiptBlobKey, bytes, { contentType: args.receiptMimeType });
      }
      const account = await requireAccount(ctx, args.sessionToken);
      const result = await ctx.db().insert(expenses).values({
        accountId: account.id,
        category: args.category,
        description: cleanOptional(args.description),
        expenseDate: args.expenseDate,
        amountCents: Math.round(args.amount * 100),
        gallonsThousandths: args.gallons == null ? null : Math.round(args.gallons * 1000),
        fuelState: args.category === "fuel" ? args.fuelState?.toUpperCase() ?? null : null,
        receiptBlobKey
      }).returning({ id: expenses.id });
      const inserted = result[0];
      if (!inserted) {
        if (receiptBlobKey)
          await ctx.blobs.delete(receiptBlobKey);
        throw new Error("Could not save the expense.");
      }
      if (args.category === "fuel" && args.gallons && args.fuelState) {
        await ctx.db().insert(iftaEntries).values({
          accountId: account.id,
          stateCode: args.fuelState.toUpperCase(),
          milesTenths: 0,
          gallonsThousandths: Math.round(args.gallons * 1000),
          source: "fuel",
          entryDate: args.expenseDate
        });
      }
      ctx.invalidateQueries();
      return { id: inserted.id };
    }
  }),
  deleteLoad: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema, id: z.number().int().positive() }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args) {
      const account = await requireAccount(ctx, args.sessionToken);
      await ctx.db().delete(loads).where(and(eq(loads.id, args.id), eq(loads.accountId, account.id)));
      ctx.invalidateQueries();
      return { ok: true };
    }
  }),
  deleteExpense: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema, id: z.number().int().positive() }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args) {
      const db = ctx.db();
      const account = await requireAccount(ctx, args.sessionToken);
      const rows = await db.select({ receiptBlobKey: expenses.receiptBlobKey }).from(expenses).where(and(eq(expenses.id, args.id), eq(expenses.accountId, account.id))).limit(1);
      const receiptBlobKey = rows[0]?.receiptBlobKey;
      await db.delete(expenses).where(and(eq(expenses.id, args.id), eq(expenses.accountId, account.id)));
      if (receiptBlobKey)
        await ctx.blobs.delete(receiptBlobKey);
      ctx.invalidateQueries();
      return { ok: true };
    }
  }),
  getCompanyProfile: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema }),
    response: companyProfileSchema,
    async handler(ctx, args) {
      return loadCompanyProfile(ctx, args.sessionToken);
    }
  }),
  saveCompanyProfile: defineAction({
    request: z.object({
      sessionToken: sessionTokenSchema,
      companyName: z.string().trim().min(1).max(160),
      address: z.string().max(300).optional(),
      phone: z.string().max(40).optional(),
      email: z.string().email().max(160).optional().or(z.literal("")),
      ein: z.string().max(30).optional(),
      mcNumber: z.string().max(30).optional(),
      dotNumber: z.string().max(30).optional(),
      logoDataBase64: z.string().max(8000000).optional(),
      logoMimeType: z.enum(["image/jpeg", "image/png", "image/webp"]).optional()
    }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args) {
      const db = ctx.db();
      const account = await requireAccount(ctx, args.sessionToken);
      const existing = (await db.select().from(companyProfile).where(eq(companyProfile.accountId, account.id)).limit(1))[0];
      let logoBlobKey = existing?.logoBlobKey ?? null;
      if (args.logoDataBase64 && args.logoMimeType) {
        const bytes = Buffer.from(args.logoDataBase64, "base64");
        if (bytes.byteLength > 5000000)
          throw new Error("Company logo is too large.");
        const ext = args.logoMimeType === "image/png" ? "png" : args.logoMimeType === "image/webp" ? "webp" : "jpg";
        const nextKey = `company/logo-${crypto.randomUUID()}.${ext}`;
        await ctx.blobs.put(nextKey, bytes, { contentType: args.logoMimeType });
        if (logoBlobKey)
          await ctx.blobs.delete(logoBlobKey);
        logoBlobKey = nextKey;
      }
      const values = {
        companyName: args.companyName.trim(),
        address: cleanOptional(args.address),
        phone: cleanOptional(args.phone),
        email: cleanOptional(args.email),
        ein: cleanOptional(args.ein),
        mcNumber: cleanOptional(args.mcNumber),
        dotNumber: cleanOptional(args.dotNumber),
        logoBlobKey,
        updatedAt: new Date
      };
      if (existing)
        await db.update(companyProfile).set(values).where(eq(companyProfile.id, existing.id));
      else
        await db.insert(companyProfile).values({ accountId: account.id, ...values });
      ctx.invalidateQueries();
      return { ok: true };
    }
  }),
  listDocuments: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema }),
    response: z.object({ documents: z.array(z.object({ id: z.number(), title: z.string(), category: documentCategorySchema, expiresOn: z.string().nullable(), fileUrl: z.string(), filename: z.string(), createdAt: z.string() })) }),
    async handler(ctx, args) {
      const account = await requireAccount(ctx, args.sessionToken);
      const rows = await ctx.db().select().from(documents).where(eq(documents.accountId, account.id)).orderBy(desc(documents.createdAt));
      const documents2 = await Promise.all(rows.map(async (row) => ({
        id: row.id,
        title: row.title,
        category: row.category,
        expiresOn: row.expiresOn,
        fileUrl: await ctx.blobs.getUrl(row.blobKey, { expiresInSeconds: 3600 }),
        filename: row.filename,
        createdAt: row.createdAt.toISOString()
      })));
      return { documents: documents2 };
    }
  }),
  uploadDocument: defineAction({
    request: z.object({
      sessionToken: sessionTokenSchema,
      title: z.string().trim().min(1).max(160),
      category: documentCategorySchema,
      expiresOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      fileDataBase64: z.string().max(16000000),
      mimeType: z.enum(["image/jpeg", "image/png", "image/webp", "application/pdf"]),
      filename: z.string().trim().min(1).max(180)
    }),
    response: z.object({ id: z.number() }),
    async handler(ctx, args) {
      const bytes = Buffer.from(args.fileDataBase64, "base64");
      if (bytes.byteLength > 1e7)
        throw new Error("Document is too large.");
      const ext = args.mimeType === "application/pdf" ? "pdf" : args.mimeType === "image/png" ? "png" : args.mimeType === "image/webp" ? "webp" : "jpg";
      const blobKey = `documents/${crypto.randomUUID()}.${ext}`;
      await ctx.blobs.put(blobKey, bytes, { contentType: args.mimeType });
      const account = await requireAccount(ctx, args.sessionToken);
      const result = await ctx.db().insert(documents).values({
        accountId: account.id,
        title: args.title.trim(),
        category: args.category,
        expiresOn: args.expiresOn || null,
        blobKey,
        mimeType: args.mimeType,
        filename: args.filename
      }).returning({ id: documents.id });
      const inserted = result[0];
      if (!inserted) {
        await ctx.blobs.delete(blobKey);
        throw new Error("Could not save the document.");
      }
      ctx.invalidateQueries();
      return { id: inserted.id };
    }
  }),
  deleteDocument: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema, id: z.number().int().positive() }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args) {
      const db = ctx.db();
      const account = await requireAccount(ctx, args.sessionToken);
      const row = (await db.select({ blobKey: documents.blobKey }).from(documents).where(and(eq(documents.id, args.id), eq(documents.accountId, account.id))).limit(1))[0];
      await db.delete(documents).where(and(eq(documents.id, args.id), eq(documents.accountId, account.id)));
      if (row?.blobKey)
        await ctx.blobs.delete(row.blobKey);
      ctx.invalidateQueries();
      return { ok: true };
    }
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
      const all = await ctx.db().select().from(iftaEntries).where(eq(iftaEntries.accountId, account.id));
      const selected = all.filter((row) => row.entryDate >= from && row.entryDate <= until);
      const grouped = new Map;
      selected.forEach((row) => {
        const current = grouped.get(row.stateCode) ?? { milesTenths: 0, gallonsThousandths: 0 };
        current.milesTenths += row.milesTenths;
        current.gallonsThousandths += row.gallonsThousandths;
        grouped.set(row.stateCode, current);
      });
      const rows = Array.from(grouped.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([stateCode, value]) => ({ stateCode, miles: value.milesTenths / 10, gallons: value.gallonsThousandths / 1000 }));
      const company = await loadCompanyProfile(ctx, args.sessionToken);
      return {
        rows,
        totalMiles: selected.reduce((sum, row) => sum + row.milesTenths, 0) / 10,
        totalGallons: selected.reduce((sum, row) => sum + row.gallonsThousandths, 0) / 1000,
        unassignedMiles: selected.filter((row) => row.stateCode === "UN").reduce((sum, row) => sum + row.milesTenths, 0) / 10,
        company
      };
    }
  }),
  addIftaGpsSegment: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema, lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180), miles: z.number().finite().positive().max(500), entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }),
    response: z.object({ stateCode: z.string() }),
    async handler(ctx, args) {
      const url = new URL("https://nominatim.openstreetmap.org/reverse");
      url.searchParams.set("lat", String(args.lat));
      url.searchParams.set("lon", String(args.lng));
      url.searchParams.set("format", "jsonv2");
      const response = await fetch(url, { headers: { "User-Agent": "RigBooks/1.0" } });
      if (!response.ok)
        throw new Error("Could not identify the state for this GPS segment.");
      const data = await response.json();
      const iso = data.address?.["ISO3166-2-lvl4"];
      const stateCode = (iso?.split("-")[1] ?? data.address?.state_code ?? "UN").toUpperCase();
      const account = await requireAccount(ctx, args.sessionToken);
      await ctx.db().insert(iftaEntries).values({ accountId: account.id, stateCode, milesTenths: Math.round(args.miles * 10), gallonsThousandths: 0, source: "gps", entryDate: args.entryDate });
      ctx.invalidateQueries();
      return { stateCode };
    }
  }),
  createInvoice: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema, loadId: z.number().int().positive(), recipientEmail: z.string().email().optional().or(z.literal("")), dueDays: z.number().int().min(0).max(120).default(30), notes: z.string().max(500).optional() }),
    response: z.object({ id: z.number() }),
    async handler(ctx, args) {
      const db = ctx.db();
      const account = await requireAccount(ctx, args.sessionToken);
      const load = (await db.select().from(loads).where(and(eq(loads.id, args.loadId), eq(loads.accountId, account.id))).limit(1))[0];
      if (!load)
        throw new Error("Load not found.");
      const invoiceNumber = `RB-${load.deliveredOn.replaceAll("-", "")}-${load.id}`;
      const existing = (await db.select({ id: invoices.id }).from(invoices).where(eq(invoices.invoiceNumber, invoiceNumber)).limit(1))[0];
      if (existing)
        return { id: existing.id };
      const result = await db.insert(invoices).values({
        accountId: account.id,
        loadId: load.id,
        invoiceNumber,
        recipientEmail: cleanOptional(args.recipientEmail),
        dueDate: addDays(load.deliveredOn, args.dueDays),
        notes: cleanOptional(args.notes)
      }).returning({ id: invoices.id });
      const inserted = result[0];
      if (!inserted)
        throw new Error("Could not create the invoice.");
      ctx.invalidateQueries();
      return { id: inserted.id };
    }
  }),
  listInvoices: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema }),
    response: z.object({ invoices: z.array(z.object({ id: z.number(), invoiceNumber: z.string(), recipientEmail: z.string().nullable(), dueDate: z.string(), status: invoiceStatusSchema, notes: z.string().nullable(), load: loadSchema, company: companyProfileSchema })) }),
    async handler(ctx, args) {
      const db = ctx.db();
      const account = await requireAccount(ctx, args.sessionToken);
      const rows = await db.select().from(invoices).where(eq(invoices.accountId, account.id)).orderBy(desc(invoices.createdAt));
      const company = await loadCompanyProfile(ctx, args.sessionToken);
      const invoices2 = await Promise.all(rows.map(async (invoice) => {
        const load = (await db.select().from(loads).where(eq(loads.id, invoice.loadId)).limit(1))[0];
        if (!load)
          return null;
        return { id: invoice.id, invoiceNumber: invoice.invoiceNumber, recipientEmail: invoice.recipientEmail, dueDate: invoice.dueDate, status: invoice.status, notes: invoice.notes, load: toLoad(load), company };
      }));
      return { invoices: invoices2.filter((value) => value !== null) };
    }
  }),
  markInvoiceStatus: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema, id: z.number().int().positive(), status: invoiceStatusSchema }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args) {
      const account = await requireAccount(ctx, args.sessionToken);
      await ctx.db().update(invoices).set({ status: args.status, sentAt: args.status === "sent" ? new Date : undefined }).where(and(eq(invoices.id, args.id), eq(invoices.accountId, account.id)));
      ctx.invalidateQueries();
      return { ok: true };
    }
  }),
  listDriverFeed: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema, limit: z.number().int().min(1).max(100).default(40) }),
    response: z.object({ posts: z.array(driverPostSchema), memberCount: z.number(), asOf: z.string() }),
    async handler(ctx, args) {
      const account = await requireAccount(ctx, args.sessionToken);
      const db = ctx.db();
      const [postRows, memberRows] = await Promise.all([
        db.select().from(driverPosts).orderBy(desc(driverPosts.createdAt)).limit(args.limit),
        db.select({ id: accounts.id }).from(accounts)
      ]);
      const memberCount = memberRows.length;
      if (postRows.length === 0)
        return { posts: [], memberCount, asOf: new Date().toISOString() };
      const postIds = postRows.map((row) => row.id);
      const [replyRows, likeRows] = await Promise.all([
        db.select().from(driverReplies).where(inArray(driverReplies.postId, postIds)).orderBy(asc(driverReplies.createdAt)),
        db.select().from(driverPostLikes).where(inArray(driverPostLikes.postId, postIds))
      ]);
      const accountIds = Array.from(new Set([...postRows.map((row) => row.accountId), ...replyRows.map((row) => row.accountId)]));
      const accountRows = accountIds.length > 0 ? await db.select({ id: accounts.id, displayName: accounts.displayName }).from(accounts).where(inArray(accounts.id, accountIds)) : [];
      const names = new Map(accountRows.map((row) => [row.id, row.displayName]));
      const posts = postRows.map((post) => {
        const likes = likeRows.filter((like) => like.postId === post.id);
        return {
          id: post.id,
          driverName: names.get(post.accountId) ?? "RigBooks driver",
          body: post.body,
          createdAt: post.createdAt.toISOString(),
          likeCount: likes.length,
          likedByViewer: likes.some((like) => like.accountId === account.id),
          replies: replyRows.filter((reply) => reply.postId === post.id).map((reply) => ({
            id: reply.id,
            postId: reply.postId,
            driverName: names.get(reply.accountId) ?? "RigBooks driver",
            body: reply.body,
            createdAt: reply.createdAt.toISOString()
          }))
        };
      });
      return { posts, memberCount, asOf: new Date().toISOString() };
    }
  }),
  createDriverPost: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema, body: z.string().trim().min(1).max(600) }),
    response: z.object({ id: z.number() }),
    async handler(ctx, args) {
      const account = await requireAccount(ctx, args.sessionToken);
      const rows = await ctx.db().insert(driverPosts).values({ accountId: account.id, body: args.body.trim() }).returning({ id: driverPosts.id });
      const row = rows[0];
      if (!row)
        throw new Error("Could not publish that post.");
      ctx.invalidateQueries();
      return { id: row.id };
    }
  }),
  createDriverReply: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema, postId: z.number().int().positive(), body: z.string().trim().min(1).max(400) }),
    response: z.object({ id: z.number() }),
    async handler(ctx, args) {
      const account = await requireAccount(ctx, args.sessionToken);
      const db = ctx.db();
      const post = (await db.select({ id: driverPosts.id }).from(driverPosts).where(eq(driverPosts.id, args.postId)).limit(1))[0];
      if (!post)
        throw new Error("That post is no longer available.");
      const rows = await db.insert(driverReplies).values({ postId: args.postId, accountId: account.id, body: args.body.trim() }).returning({ id: driverReplies.id });
      const row = rows[0];
      if (!row)
        throw new Error("Could not publish that reply.");
      ctx.invalidateQueries();
      return { id: row.id };
    }
  }),
  toggleDriverPostLike: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema, postId: z.number().int().positive() }),
    response: z.object({ liked: z.boolean() }),
    async handler(ctx, args) {
      const account = await requireAccount(ctx, args.sessionToken);
      const db = ctx.db();
      const post = (await db.select({ id: driverPosts.id }).from(driverPosts).where(eq(driverPosts.id, args.postId)).limit(1))[0];
      if (!post)
        throw new Error("That post is no longer available.");
      const existing = (await db.select({ id: driverPostLikes.id }).from(driverPostLikes).where(and(eq(driverPostLikes.postId, args.postId), eq(driverPostLikes.accountId, account.id))).limit(1))[0];
      if (existing) {
        await db.delete(driverPostLikes).where(eq(driverPostLikes.id, existing.id));
        ctx.invalidateQueries();
        return { liked: false };
      }
      await db.insert(driverPostLikes).values({ postId: args.postId, accountId: account.id });
      ctx.invalidateQueries();
      return { liked: true };
    }
  }),
  getTruckProfile: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema }),
    response: z.object({ configured: z.boolean(), truckName: z.string(), currentOdometer: z.number(), lastPmOdometer: z.number(), pmInterval: z.number(), nextPmDue: z.number(), milesRemaining: z.number(), status: z.enum(["ok", "soon", "due"]), heightInches: z.number(), weightPounds: z.number(), lengthFeet: z.number(), widthInches: z.number(), hasPrePass: z.boolean() }),
    async handler(ctx, args) {
      const account = await requireAccount(ctx, args.sessionToken);
      await ensurePrePassColumn(ctx);
      const row = (await ctx.db().select().from(truckProfiles).where(eq(truckProfiles.accountId, account.id)).limit(1))[0];
      if (!row)
        return { configured: false, truckName: "My truck", currentOdometer: 0, lastPmOdometer: 0, pmInterval: 15000, nextPmDue: 15000, milesRemaining: 15000, status: "ok", heightInches: 162, weightPounds: 80000, lengthFeet: 75, widthInches: 102, hasPrePass: false };
      const currentOdometer = row.currentOdometerTenths / 10;
      const lastPmOdometer = row.lastPmOdometerTenths / 10;
      const pmInterval = row.pmIntervalTenths / 10;
      const nextPmDue = lastPmOdometer + pmInterval;
      const milesRemaining = nextPmDue - currentOdometer;
      return { configured: true, truckName: row.truckName, currentOdometer, lastPmOdometer, pmInterval, nextPmDue, milesRemaining, status: milesRemaining <= 0 ? "due" : milesRemaining <= Math.min(1000, pmInterval * 0.1) ? "soon" : "ok", heightInches: row.heightInches, weightPounds: row.weightPounds, lengthFeet: row.lengthFeet, widthInches: row.widthInches, hasPrePass: row.hasPrePass };
    }
  }),
  saveTruckProfile: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema, truckName: z.string().trim().min(1).max(80), currentOdometer: z.number().finite().min(0).max(1e7), lastPmOdometer: z.number().finite().min(0).max(1e7), pmInterval: z.number().finite().positive().max(1e6), heightInches: z.number().int().min(96).max(180).optional(), weightPounds: z.number().int().min(1e4).max(200000).optional(), lengthFeet: z.number().int().min(20).max(150).optional(), widthInches: z.number().int().min(72).max(144).optional(), hasPrePass: z.boolean().optional() }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args) {
      const account = await requireAccount(ctx, args.sessionToken);
      if (args.lastPmOdometer > args.currentOdometer)
        throw new Error("Last PM reading cannot be higher than the current odometer.");
      await ensurePrePassColumn(ctx);
      const db = ctx.db();
      const row = (await db.select().from(truckProfiles).where(eq(truckProfiles.accountId, account.id)).limit(1))[0];
      const values = { accountId: account.id, truckName: args.truckName.trim(), currentOdometerTenths: Math.round(args.currentOdometer * 10), lastPmOdometerTenths: Math.round(args.lastPmOdometer * 10), pmIntervalTenths: Math.round(args.pmInterval * 10), heightInches: args.heightInches ?? row?.heightInches ?? 162, weightPounds: args.weightPounds ?? row?.weightPounds ?? 80000, lengthFeet: args.lengthFeet ?? row?.lengthFeet ?? 75, widthInches: args.widthInches ?? row?.widthInches ?? 102, hasPrePass: args.hasPrePass ?? row?.hasPrePass ?? false, updatedAt: new Date };
      if (row)
        await db.update(truckProfiles).set(values).where(eq(truckProfiles.id, row.id));
      else
        await db.insert(truckProfiles).values(values);
      ctx.invalidateQueries();
      return { ok: true };
    }
  }),
  saveTruckRouteProfile: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema, truckName: z.string().trim().min(1).max(80), heightInches: z.number().int().min(96).max(180), weightPounds: z.number().int().min(1e4).max(200000), lengthFeet: z.number().int().min(20).max(150), widthInches: z.number().int().min(72).max(144), hasPrePass: z.boolean() }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args) {
      const account = await requireAccount(ctx, args.sessionToken);
      await ensurePrePassColumn(ctx);
      const db = ctx.db();
      const row = (await db.select().from(truckProfiles).where(eq(truckProfiles.accountId, account.id)).limit(1))[0];
      const values = { accountId: account.id, truckName: args.truckName.trim(), heightInches: args.heightInches, weightPounds: args.weightPounds, lengthFeet: args.lengthFeet, widthInches: args.widthInches, hasPrePass: args.hasPrePass, currentOdometerTenths: row?.currentOdometerTenths ?? 0, lastPmOdometerTenths: row?.lastPmOdometerTenths ?? 0, pmIntervalTenths: row?.pmIntervalTenths ?? 150000, updatedAt: new Date };
      if (row)
        await db.update(truckProfiles).set(values).where(eq(truckProfiles.id, row.id));
      else
        await db.insert(truckProfiles).values(values);
      ctx.invalidateQueries();
      return { ok: true };
    }
  }),
  planRoadForTruckers: defineAction({
    request: z.object({ sessionToken: sessionTokenSchema, origin: z.string().trim().min(2).max(180), destination: z.string().trim().min(2).max(180) }),
    response: roadRouteSchema,
    async handler(ctx, args) {
      const account = await requireAccount(ctx, args.sessionToken);
      if (account.role === "standard")
        throw new Error("Road for Truckers requires RigBooks Pro.");
      await ensurePrePassColumn(ctx);
      const truck = (await ctx.db().select().from(truckProfiles).where(eq(truckProfiles.accountId, account.id)).limit(1))[0];
      if (!truck)
        throw new Error("Add your truck profile before planning a route.");
      const geocode = async (query) => {
        const url = new URL("https://nominatim.openstreetmap.org/search");
        url.searchParams.set("q", query);
        url.searchParams.set("format", "jsonv2");
        url.searchParams.set("limit", "1");
        const response = await fetch(url, { headers: { "User-Agent": "RigBooks/1.0" } });
        if (!response.ok)
          throw new Error("A route location could not be found.");
        const rows = await response.json();
        const row = rows[0];
        const lat = Number(row?.lat);
        const lng = Number(row?.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lng))
          throw new Error("A route location could not be found.");
        return { lat, lng, label: row?.display_name ?? query };
      };
      const [origin, destination] = await Promise.all([geocode(args.origin), geocode(args.destination)]);
      const routeResponse = await fetch("https://valhalla1.openstreetmap.de/route", { method: "POST", headers: { "Content-Type": "application/json", "X-Client-Id": "rigbooks", "User-Agent": "RigBooks/1.0" }, body: JSON.stringify({ locations: [{ lat: origin.lat, lon: origin.lng }, { lat: destination.lat, lon: destination.lng }], costing: "truck", costing_options: { truck: { height: truck.heightInches * 0.0254, width: truck.widthInches * 0.0254, length: truck.lengthFeet * 0.3048, weight: truck.weightPounds * 0.000453592, axle_load: Math.min(20, truck.weightPounds * 0.000453592 / 5), hazmat: false } }, units: "miles", language: "en-US" }) });
      if (!routeResponse.ok)
        throw new Error("A truck-safe route could not be calculated right now.");
      const routeData = await routeResponse.json();
      const leg = routeData.trip?.legs?.[0];
      const summary = routeData.trip?.summary;
      if (!leg?.shape || typeof summary?.length !== "number" || typeof summary.time !== "number")
        throw new Error("A truck-safe route could not be calculated right now.");
      const fullShape = decodePolyline6(leg.shape);
      const step = Math.max(1, Math.ceil(fullShape.length / 300));
      const shape = fullShape.filter((_, index) => index % step === 0);
      const midpoint = shape[Math.floor(shape.length / 2)] ?? origin;
      const around = `(around:50000,${midpoint.lat},${midpoint.lng})`;
      const overpassQuery = `[out:json][timeout:20];(nwr["amenity"="truck_stop"]${around};nwr["amenity"="weighbridge"]["brand"~"CAT",i]${around};nwr["amenity"="weighbridge"]["name"~"CAT Scale",i]${around};);out center tags;`;
      let elements = [];
      try {
        const response = await fetch("https://overpass-api.de/api/interpreter", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "RigBooks/1.0" }, body: new URLSearchParams({ data: overpassQuery }) });
        if (response.ok)
          elements = (await response.json()).elements ?? [];
      } catch {
        elements = [];
      }
      const truckStops = elements.flatMap((element) => {
        const lat = element.lat ?? element.center?.lat;
        const lng = element.lon ?? element.center?.lon;
        if (typeof lat !== "number" || typeof lng !== "number")
          return [];
        const nearest = shape.filter((_, index) => index % 10 === 0).reduce((best, point) => Math.min(best, distanceMiles(point.lat, point.lng, lat, lng)), Number.POSITIVE_INFINITY);
        if (nearest > 8)
          return [];
        const tags = element.tags ?? {};
        const isCat = tags.amenity === "weighbridge";
        const category = isCat ? "cat_scale" : "truck_stop";
        const address = [tags["addr:housenumber"], tags["addr:street"], tags["addr:city"], tags["addr:state"]].filter(Boolean).join(" ") || null;
        return [{ id: `${element.type ?? "node"}-${element.id ?? `${lat}-${lng}`}`, name: tags.name || tags.brand || (isCat ? "CAT Scale" : "Truck stop"), category, address, lat, lng, distanceMiles: Math.round(nearest * 10) / 10 }];
      }).sort((a, b) => a.distanceMiles - b.distanceMiles).slice(0, 12);
      return { originLabel: origin.label, destinationLabel: destination.label, distanceMiles: Math.round(summary.length * 10) / 10, durationMinutes: Math.round(summary.time / 60), shape, maneuvers: (leg.maneuvers ?? []).map((item) => ({ instruction: item.instruction ?? "Continue", distanceMiles: Math.round((item.length ?? 0) * 10) / 10, timeMinutes: Math.max(1, Math.round((item.time ?? 0) / 60)) })), truckStops, attribution: "Route and place data \xA9 OpenStreetMap contributors" };
    }
  }),
  askSam: defineAction({
    request: z.object({
      sessionToken: sessionTokenSchema,
      message: z.string().trim().min(1).max(600),
      history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(1000) })).max(8).default([]),
      lat: z.number().min(-90).max(90).optional(),
      lng: z.number().min(-180).max(180).optional()
    }),
    response: samResponseSchema,
    async handler(ctx, args) {
      const account = await requireAccount(ctx, args.sessionToken);
      const courtesyText = args.message.trim().toLowerCase().replace(/[.!?]+$/g, "").trim();
      if (/^(hello|hi|hey)( sam| there)?$/.test(courtesyText)) {
        return { reply: "hi, how are you?", scope: "courtesy", sources: [] };
      }
      if (/^(thanks|thank you|thx)( sam| so much| a lot)?$/.test(courtesyText)) {
        return { reply: "you're welcome.", scope: "courtesy", sources: [] };
      }
      const intent = await ctx.inference.complete(`Classify this question for Sam the Semi, RigBooks' in-app assistant. Choose exactly one scope: app_help (how to use RigBooks), driver_data (the signed-in driver's loads, expenses, earnings, settlements, deductions, or profit), weather (current or forecast road weather), diesel (diesel prices), trip_planning (planning a safe, efficient truck trip or pre-trip readiness), maintenance (truck maintenance, PM timing, inspections, or mechanical care), hos (hours-of-service rules, clocks, breaks, sleeper berth, or logs), trucking_terms (definitions of trucking language, pay terms, or industry shorthand), prayer (a driver asks for a prayer or spiritual encouragement), or out_of_scope. Message: ${args.message}`, { schema: samScopeSchema.exclude(["courtesy"]) });
      if (intent === "out_of_scope")
        return { reply: "I can help with RigBooks, your numbers, trip planning, maintenance, HOS, trucking terms, road weather, diesel prices, and prayers. Pick a topic above or ask me in your own words.", scope: intent, sources: [] };
      let context = "";
      let sources = [];
      let searchBackedAnswer = false;
      if (intent === "app_help") {
        context = `RigBooks guide: Overview shows gross, expenses, net, miles and profit per mile. Loads logs a run manually or from a rate-con photo. Expenses stores fuel and costs with receipt images. Roadside finds truck stops, repair and rest areas. Business is for owner-operators and has load boards, IFTA, invoices, document vault, My Company and news. Driver setup holds account, membership, profile and pay defaults. Lease-purchase supports percentage or per-mile settlement pay plus weekly truck payment, maintenance escrow, insurance and other deductions. Offline entries queue on the device and sync when online.`;
      } else if (intent === "driver_data") {
        const db = ctx.db();
        const [loadRows, expenseRows, payRows] = await Promise.all([
          db.select().from(loads).where(eq(loads.accountId, account.id)).orderBy(desc(loads.deliveredOn)).limit(250),
          db.select().from(expenses).where(eq(expenses.accountId, account.id)).orderBy(desc(expenses.expenseDate)).limit(250),
          db.select().from(paySettings).where(eq(paySettings.accountId, account.id)).limit(1)
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
            url.searchParams.set("lat", String(args.lat));
            url.searchParams.set("lon", String(args.lng));
            url.searchParams.set("format", "jsonv2");
            const response = await fetch(url, { headers: { "User-Agent": "RigBooks/1.0" } });
            const data = response.ok ? await response.json() : null;
            place = data?.display_name ?? `${args.lat}, ${args.lng}`;
          } catch {
            place = `${args.lat}, ${args.lng}`;
          }
        }
        const search = await ctx.tool.web_search(`current cheapest diesel prices truck stops near or along ${place}; driver request: ${args.message}`);
        context = `Current web search results for diesel prices: ${JSON.stringify(search)}`;
      } else if (intent === "trip_planning") {
        context = `Trip-planning guidance: Ask for origin, destination, delivery time, planned fuel range, and any special load limits that are missing. Direct the driver to RigBooks Road for a truck route, route weather, truck stops, repair, rest areas, and CAT scales. Remind the driver to confirm truck dimensions in Driver setup, inspect the truck, check fuel and legal HOS availability, review weather and restrictions, and leave a time buffer. Never invent a route, mileage, restriction, or arrival time.`;
      } else if (intent === "maintenance") {
        await ensurePrePassColumn(ctx);
        const truck = (await ctx.db().select().from(truckProfiles).where(eq(truckProfiles.accountId, account.id)).limit(1))[0];
        context = truck ? `RigBooks truck profile: ${JSON.stringify({ truckName: truck.truckName, currentOdometer: truck.currentOdometerTenths / 10, lastPmOdometer: truck.lastPmOdometerTenths / 10, pmInterval: truck.pmIntervalTenths / 10, nextPmDue: (truck.lastPmOdometerTenths + truck.pmIntervalTenths) / 10 })}. Explain preventive care clearly. Do not diagnose a dangerous mechanical problem remotely; advise stopping safely and using a qualified mechanic when safety may be affected.` : `No truck maintenance profile is saved yet. Explain how to add current odometer, last PM odometer, and PM interval in Driver setup. Give only general preventive-maintenance guidance and do not diagnose a dangerous mechanical problem remotely; advise stopping safely and using a qualified mechanic when safety may be affected.`;
      } else if (intent === "hos") {
        const search = await ctx.tool.web_search(`current official FMCSA hours of service rules property-carrying commercial drivers; driver question: ${args.message}`);
        context = `Current web search results about federal HOS rules: ${JSON.stringify(search)}`;
        searchBackedAnswer = true;
      } else if (intent === "trucking_terms") {
        context = `Explain trucking terminology in plain driver language. Common RigBooks-relevant terms include deadhead (unpaid or non-revenue miles driven without a load), detention (time held beyond an agreed free period), lumper (a third-party loading or unloading service), rate confirmation (the written load terms and agreed carrier pay), gross (money before expenses or deductions), net (money after expenses or deductions), and profit per mile (net divided by all miles). If asked about a term not safely known, say so rather than guessing.`;
      } else if (intent === "prayer") {
        context = `Offer a brief, sincere Christian prayer suitable for a truck driver. Match the requested moment\u2014before a trip, after a safe arrival, for family at home, during stress, or at bedtime. Do not claim guaranteed protection or outcomes. Keep it warm and respectful.`;
      }
      const prompt = `You are Sam the Semi, a friendly, concise, trucker-aware assistant inside RigBooks. Answer only within the selected scope: ${intent}. Use the supplied context only; do not invent values, prices, conditions, routes, rules, or app behavior. For driver data, calculate exactly from the rows and clearly state the date range used. For diesel, include specific stations and prices only when the search context explicitly supports them; otherwise say live prices were not available and suggest trying a route or current location. For weather, emphasize hazards relevant to driving. For HOS, make clear that the answer is general guidance, use the current search context, and tell the driver to verify their operation and exceptions with FMCSA or their carrier. Keep the answer under 140 words. Conversation: ${JSON.stringify(args.history)}. Driver question: ${args.message}. Context: ${context}`;
      if (searchBackedAnswer) {
        const result = await ctx.inference.complete(`${prompt} Return up to three useful source links only when their complete URLs appear verbatim in the search context; otherwise return no sources.`, { schema: z.object({ reply: z.string(), sources: z.array(z.object({ title: z.string(), url: z.string().url() })).max(3) }) });
        return { reply: result.reply, scope: intent, sources: result.sources };
      }
      const answer = await ctx.inference.complete(prompt, { schema: z.string() });
      return { reply: answer, scope: intent, sources };
    }
  }),
  getTruckingNews: defineAction({
    request: z.object({}),
    response: z.object({ items: z.array(truckingNewsItemSchema), asOf: z.string() }),
    async handler(ctx) {
      const result = await ctx.tool.web_search("latest US trucking industry news regulations diesel fuel prices freight rates owner operators September 2026");
      const items = await ctx.inference.complete(`Select up to 10 recent, useful US trucking headlines from these search results. Cover regulations, fuel prices, freight rates, and major industry updates when available. Summaries should be factual and no more than two sentences. Use only a source URL that appears verbatim in the search results. Do not invent publication dates; use null when the search result does not clearly show one.

Search results:
${JSON.stringify(result)}`, { schema: z.array(truckingNewsItemSchema).max(10) });
      return { items, asOf: new Date().toISOString() };
    }
  }),
  scanLoadDocument: defineAction({
    request: z.object({
      imageDataBase64: z.string().max(16000000),
      mimeType: z.enum(["image/jpeg", "image/png"]),
      filename: z.string().max(180).optional()
    }),
    response: scannedLoadSchema,
    async handler(ctx, args) {
      return ctx.inference.complete("Read this trucking rate confirmation or load sheet. Extract the pickup location, delivery location, loaded miles, total carrier/load pay, load/reference number, and broker or customer. Preserve useful city/state or full address text. Use null for anything not visible or uncertain. Money and miles must be numbers without symbols.", {
        schema: scannedLoadSchema,
        images: [{ dataBase64: args.imageDataBase64, mimeType: args.mimeType, filename: args.filename }]
      });
    }
  }),
  calculateDeadhead: defineAction({
    request: z.object({
      currentLat: z.number().min(-90).max(90),
      currentLng: z.number().min(-180).max(180),
      pickup: z.string().trim().min(2).max(180)
    }),
    response: z.object({ miles: z.number(), pickupLabel: z.string() }),
    async handler(_ctx, args) {
      const searchUrl = new URL("https://nominatim.openstreetmap.org/search");
      searchUrl.searchParams.set("q", args.pickup);
      searchUrl.searchParams.set("format", "jsonv2");
      searchUrl.searchParams.set("limit", "1");
      const geocodeResponse = await fetch(searchUrl, { headers: { "User-Agent": "RigBooks/1.0" } });
      if (!geocodeResponse.ok)
        throw new Error("Pickup location could not be found.");
      const candidates = await geocodeResponse.json();
      const pickup = candidates[0];
      const pickupLat = Number(pickup?.lat);
      const pickupLng = Number(pickup?.lon);
      if (!Number.isFinite(pickupLat) || !Number.isFinite(pickupLng))
        throw new Error("Pickup location could not be found.");
      const routeUrl = `https://router.project-osrm.org/route/v1/driving/${args.currentLng},${args.currentLat};${pickupLng},${pickupLat}?overview=false`;
      const routeResponse = await fetch(routeUrl, { headers: { "User-Agent": "RigBooks/1.0" } });
      if (!routeResponse.ok)
        throw new Error("Deadhead route could not be calculated.");
      const routeData = await routeResponse.json();
      const meters = routeData.routes?.[0]?.distance;
      if (routeData.code !== "Ok" || typeof meters !== "number")
        throw new Error("Deadhead route could not be calculated.");
      return { miles: Math.round(meters / 1609.344 * 10) / 10, pickupLabel: pickup?.display_name || args.pickup };
    }
  }),
  findTruckServices: defineAction({
    request: z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
      radiusMiles: z.number().min(5).max(75).default(35)
    }),
    response: z.object({ places: z.array(truckPlaceSchema), asOf: z.string() }),
    async handler(_ctx, args) {
      const radiusMeters = Math.round(args.radiusMiles * 1609.344);
      const around = `(around:${radiusMeters},${args.lat},${args.lng})`;
      const query = `[out:json][timeout:25];(nwr["amenity"="truck_stop"]${around};nwr["highway"="rest_area"]${around};nwr["highway"="services"]${around};nwr["shop"="truck_repair"]${around};nwr["shop"="car_repair"]["hgv"="yes"]${around};nwr["amenity"="weighbridge"]["brand"~"CAT",i]${around};nwr["amenity"="weighbridge"]["name"~"CAT Scale",i]${around};);out center tags;`;
      const endpoints = [
        "https://overpass-api.de/api/interpreter",
        "https://overpass.kumi.systems/api/interpreter",
        "https://overpass.private.coffee/api/interpreter"
      ];
      let payload = null;
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "RigBooks/1.0" },
            body: new URLSearchParams({ data: query })
          });
          if (!response.ok)
            continue;
          const candidate = await response.json();
          if (!candidate.remark) {
            payload = candidate;
            break;
          }
        } catch {}
      }
      if (!payload)
        throw new Error("Truck services are temporarily unavailable.");
      const places = (payload.elements ?? []).flatMap((element) => {
        const lat = element.lat ?? element.center?.lat;
        const lng = element.lon ?? element.center?.lon;
        if (typeof lat !== "number" || typeof lng !== "number")
          return [];
        const tags = element.tags ?? {};
        const category = tags.amenity === "weighbridge" && /CAT/i.test(`${tags.brand ?? ""} ${tags.name ?? ""}`) ? "cat_scale" : tags.amenity === "truck_stop" ? "truck_stop" : tags.shop === "truck_repair" || tags.shop === "car_repair" ? "repair" : "rest_area";
        const defaultName = category === "cat_scale" ? "CAT Scale" : category === "truck_stop" ? "Truck stop" : category === "repair" ? "Truck repair" : "Rest area";
        const address = [tags["addr:housenumber"], tags["addr:street"], tags["addr:city"], tags["addr:state"]].filter(Boolean).join(" ") || null;
        return [{
          id: `${element.type ?? "node"}-${element.id ?? `${lat}-${lng}`}`,
          name: tags.name || tags.brand || defaultName,
          category,
          address,
          lat,
          lng,
          distanceMiles: Math.round(distanceMiles(args.lat, args.lng, lat, lng) * 10) / 10
        }];
      }).sort((a, b) => a.distanceMiles - b.distanceMiles).slice(0, 40);
      return { places, asOf: new Date().toISOString() };
    }
  })
};

// src/server.ts
var databaseUrl = requiredEnv("DATABASE_URL");
var sessionPepper = requiredEnv("SESSION_PEPPER");
var openAiApiKey = process.env.OPENAI_API_KEY?.trim() || null;
var openAiModel = process.env.OPENAI_MODEL || "gpt-4.1-mini";
var port = Number(process.env.PORT || 3000);
var maxUploadBytes = Number(process.env.MAX_UPLOAD_BYTES || 18000000);
var pool = new Pool({ connectionString: databaseUrl, ssl: databaseUrl.includes("localhost") ? false : { rejectUnauthorized: false } });
var drizzleDb = drizzle(pool, { schema: exports_schema });
var db = Object.assign(drizzleDb, { batch: async (queries) => Promise.all(queries) });
var clientRoot = normalize(join(import.meta.dir, "..", "client-dist"));
var migrationNames = ["001_initial.sql", "002_driver_community_feed.sql", "003_prepass.sql"];
var migrationRoot = normalize(join(import.meta.dir, "..", "postgres"));
function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value)
    throw new Error(`Missing required environment variable: ${name}`);
  return value;
}
async function hmac(value) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(sessionPepper), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return Buffer.from(signature).toString("base64url");
}
async function toBytes(data) {
  if (typeof data === "string")
    return new TextEncoder().encode(data);
  if (data instanceof Blob)
    return new Uint8Array(await data.arrayBuffer());
  if (data instanceof ArrayBuffer)
    return new Uint8Array(data);
  return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
}
async function callOpenAI(body) {
  if (!openAiApiKey)
    throw new Error("AI features are not configured yet.");
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${openAiApiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok)
    throw new Error(payload?.error?.message || `AI provider returned ${response.status}.`);
  return payload;
}
function responseText(payload) {
  if (typeof payload?.output_text === "string")
    return payload.output_text;
  const chunks = [];
  for (const item of payload?.output ?? []) {
    for (const content of item?.content ?? [])
      if (typeof content?.text === "string")
        chunks.push(content.text);
  }
  return chunks.join(`
`);
}
function responseSources(payload) {
  const found = new Map;
  for (const item of payload?.output ?? []) {
    for (const content of item?.content ?? []) {
      for (const annotation of content?.annotations ?? []) {
        const url = annotation?.url;
        if (typeof url === "string" && /^https:\/\//.test(url))
          found.set(url, typeof annotation?.title === "string" ? annotation.title : url);
      }
    }
  }
  return Array.from(found, ([url, title]) => ({ title, url }));
}
var inference = {
  async complete(prompt, options) {
    const inputContent = [{ type: "input_text", text: prompt }];
    for (const image of options.images ?? [])
      inputContent.push({ type: "input_image", image_url: `data:${image.mimeType};base64,${image.dataBase64}` });
    const jsonSchema = z2.toJSONSchema(options.schema, { io: "output" });
    const payload = await callOpenAI({
      model: openAiModel,
      input: [{ role: "user", content: inputContent }],
      text: { format: { type: "json_schema", name: "rigbooks_response", schema: jsonSchema, strict: false } }
    });
    const text = responseText(payload).trim();
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error("AI provider returned an unreadable response.");
    }
    return options.schema.parse(parsed);
  }
};
var tools = {
  async web_search(query) {
    const payload = await callOpenAI({ model: openAiModel, tools: [{ type: "web_search" }], input: query });
    return { text: responseText(payload), sources: responseSources(payload) };
  },
  async weather(query, options) {
    const payload = await callOpenAI({ model: openAiModel, tools: [{ type: "web_search" }], input: `Find current road-weather information for this driver request. Query: ${query}. Location context: ${JSON.stringify(options ?? null)}` });
    return { content: { text: responseText(payload), sources: responseSources(payload) } };
  }
};
var blobs = {
  async put(key, data, options) {
    const bytes = await toBytes(data);
    await pool.query(`INSERT INTO file_blobs (blob_key, content_type, data, updated_at) VALUES ($1,$2,$3,NOW()) ON CONFLICT (blob_key) DO UPDATE SET content_type=EXCLUDED.content_type, data=EXCLUDED.data, updated_at=NOW()`, [key, options?.contentType || "application/octet-stream", Buffer.from(bytes)]);
  },
  async getUrl(key, options) {
    const expires = Math.floor(Date.now() / 1000) + Math.min(options?.expiresInSeconds ?? 3600, 86400);
    const sig = await hmac(`${key}:${expires}`);
    return `/files/${encodeURIComponent(key)}?expires=${expires}&sig=${sig}`;
  },
  async delete(key) {
    await pool.query("DELETE FROM file_blobs WHERE blob_key=$1", [key]);
  }
};
var ctx = { db: () => db, viewer: null, blobs, invalidateQueries() {}, inference, tool: tools };
async function migrate() {
  const client = await pool.connect();
  try {
    await client.query("SELECT pg_advisory_lock(hashtext('rigbooks-migrations'))");
    await client.query("CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())");
    for (const name of migrationNames) {
      const exists = await client.query("SELECT 1 FROM schema_migrations WHERE name=$1", [name]);
      if ((exists.rowCount ?? 0) > 0)
        continue;
      const sql = await readFile(join(migrationRoot, name), "utf8");
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query("INSERT INTO schema_migrations(name) VALUES ($1)", [name]);
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }
  } finally {
    await client.query("SELECT pg_advisory_unlock(hashtext('rigbooks-migrations'))").catch(() => {
      return;
    });
    client.release();
  }
}
function json(data, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
}
async function serveBlob(url) {
  const key = decodeURIComponent(url.pathname.slice("/files/".length));
  const expires = Number(url.searchParams.get("expires"));
  const sig = url.searchParams.get("sig") || "";
  if (!key || !Number.isFinite(expires) || expires < Date.now() / 1000 || sig !== await hmac(`${key}:${expires}`))
    return new Response("Not found", { status: 404 });
  const result = await pool.query("SELECT content_type, data FROM file_blobs WHERE blob_key=$1", [key]);
  const row = result.rows[0];
  if (!row)
    return new Response("Not found", { status: 404 });
  return new Response(row.data, { headers: { "Content-Type": row.content_type, "Cache-Control": "private, max-age=300", "X-Content-Type-Options": "nosniff" } });
}
async function serveStatic(pathname) {
  const requested = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const fullPath = normalize(join(clientRoot, requested));
  const safePath = fullPath.startsWith(clientRoot) ? fullPath : join(clientRoot, "index.html");
  let file = Bun.file(safePath);
  if (!await file.exists())
    file = Bun.file(join(clientRoot, "index.html"));
  const mime = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".svg": "image/svg+xml", ".woff2": "font/woff2" };
  return new Response(file, { headers: { "Content-Type": mime[extname(file.name || safePath)] || "application/octet-stream", "Cache-Control": requested === "index.html" ? "no-cache" : "public, max-age=31536000, immutable", "Content-Security-Policy": "default-src 'self'; img-src 'self' data: blob: https://tile.openstreetmap.org; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; script-src 'self'; connect-src 'self' https://api.openai.com https://nominatim.openstreetmap.org https://router.project-osrm.org https://valhalla1.openstreetmap.de https://overpass-api.de https://overpass.kumi.systems https://overpass.private.coffee; font-src 'self' data: https://fonts.gstatic.com; frame-ancestors 'self'" } });
}
await migrate();
var server = Bun.serve({
  port,
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/health") {
      try {
        await pool.query("SELECT 1");
        return json({ ok: true });
      } catch {
        return json({ ok: false }, 503);
      }
    }
    if (url.pathname.startsWith("/files/") && request.method === "GET")
      return serveBlob(url);
    if (url.pathname === "/actions" && request.method === "POST") {
      const declaredLength = Number(request.headers.get("content-length") || 0);
      if (declaredLength > maxUploadBytes)
        return json({ error: "Request is too large." }, 413);
      let body;
      try {
        body = await request.json();
      } catch {
        return json({ error: "Invalid JSON request." }, 400);
      }
      if (typeof body.action !== "string" || !(body.action in Actions))
        return json({ error: "Action not found." }, 404);
      const definition = Actions[body.action];
      const parsed = definition.request.safeParse(body.args ?? {});
      if (!parsed.success)
        return json({ error: "Request validation failed.", details: z2.treeifyError(parsed.error) }, 422);
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
    if (request.method === "GET" || request.method === "HEAD")
      return serveStatic(url.pathname);
    return new Response("Method not allowed", { status: 405 });
  }
});
console.log(`RigBooks listening on ${server.url}`);
