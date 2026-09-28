import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const accounts = sqliteTable("accounts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  viewerFbid: text("viewer_fbid").notNull(),
  displayName: text("display_name").notNull(),
  email: text("email"),
  authProvider: text("auth_provider", { enum: ["google", "apple", "muse", "email"] }).notNull().default("muse"),
  passwordHash: text("password_hash"),
  passwordSalt: text("password_salt"),
  role: text("role", { enum: ["standard", "creator", "tester"] }).notNull().default("standard"),
  accessLabel: text("access_label"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
}, (table) => [
  uniqueIndex("accounts_viewer_fbid_unique").on(table.viewerFbid),
  uniqueIndex("accounts_email_unique").on(table.email),
]);

export const accountSessions = sqliteTable("account_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: integer("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
  sessionTokenHash: text("session_token_hash").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  lastUsedAt: integer("last_used_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
}, (table) => [uniqueIndex("account_sessions_token_hash_unique").on(table.sessionTokenHash)]);

export const driverPosts = sqliteTable("driver_posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: integer("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
}, (table) => [index("driver_posts_created_at_idx").on(table.createdAt)]);

export const driverReplies = sqliteTable("driver_replies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  postId: integer("post_id").notNull().references(() => driverPosts.id, { onDelete: "cascade" }),
  accountId: integer("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
}, (table) => [index("driver_replies_post_created_idx").on(table.postId, table.createdAt)]);

export const driverPostLikes = sqliteTable("driver_post_likes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  postId: integer("post_id").notNull().references(() => driverPosts.id, { onDelete: "cascade" }),
  accountId: integer("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
}, (table) => [uniqueIndex("driver_post_likes_post_account_unique").on(table.postId, table.accountId)]);

export const truckProfiles = sqliteTable("truck_profiles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: integer("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
  truckName: text("truck_name").notNull(),
  currentOdometerTenths: integer("current_odometer_tenths").notNull(),
  lastPmOdometerTenths: integer("last_pm_odometer_tenths").notNull(),
  pmIntervalTenths: integer("pm_interval_tenths").notNull(),
  heightInches: integer("height_inches").notNull().default(162),
  weightPounds: integer("weight_pounds").notNull().default(80000),
  lengthFeet: integer("length_feet").notNull().default(75),
  widthInches: integer("width_inches").notNull().default(102),
  hasPrePass: integer("has_prepass", { mode: "boolean" }).notNull().default(false),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
}, (table) => [uniqueIndex("truck_profiles_account_id_unique").on(table.accountId)]);

export const loads = sqliteTable("loads", {
  id: integer("id").primaryKey({ autoIncrement: true }),
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
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const paySettings = sqliteTable("pay_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
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
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const workShifts = sqliteTable("work_shifts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: integer("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
  workDate: text("work_date").notNull(),
  clockInAt: integer("clock_in_at", { mode: "timestamp_ms" }).notNull(),
  clockOutAt: integer("clock_out_at", { mode: "timestamp_ms" }),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});

export const subscriptionAccess = sqliteTable("subscription_access", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clientId: text("client_id").notNull(),
  role: text("role", { enum: ["creator", "tester"] }).notNull(),
  label: text("label"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
}, (table) => [uniqueIndex("subscription_access_client_id_unique").on(table.clientId)]);

export const compInvites = sqliteTable("comp_invites", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  codeHash: text("code_hash").notNull(),
  codeHint: text("code_hint").notNull(),
  label: text("label").notNull(),
  createdByClientId: text("created_by_client_id").notNull(),
  redeemedByClientId: text("redeemed_by_client_id"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  redeemedAt: integer("redeemed_at", { mode: "timestamp_ms" }),
}, (table) => [uniqueIndex("comp_invites_code_hash_unique").on(table.codeHash)]);

export const expenses = sqliteTable("expenses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: integer("account_id").references(() => accounts.id, { onDelete: "cascade" }),
  category: text("category", {
    enum: ["fuel", "tolls", "maintenance", "insurance", "truck_payment", "other"],
  }).notNull(),
  description: text("description"),
  expenseDate: text("expense_date").notNull(),
  amountCents: integer("amount_cents").notNull(),
  gallonsThousandths: integer("gallons_thousandths"),
  fuelState: text("fuel_state"),
  receiptBlobKey: text("receipt_blob_key"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});


export const iftaEntries = sqliteTable("ifta_entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: integer("account_id").references(() => accounts.id, { onDelete: "cascade" }),
  loadId: integer("load_id").references(() => loads.id, { onDelete: "cascade" }),
  stateCode: text("state_code").notNull(),
  milesTenths: integer("miles_tenths").notNull().default(0),
  gallonsThousandths: integer("gallons_thousandths").notNull().default(0),
  source: text("source", { enum: ["load", "gps", "manual", "fuel"] }).notNull(),
  entryDate: text("entry_date").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});

export const invoices = sqliteTable("invoices", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: integer("account_id").references(() => accounts.id, { onDelete: "cascade" }),
  loadId: integer("load_id").notNull().references(() => loads.id, { onDelete: "cascade" }),
  invoiceNumber: text("invoice_number").notNull(),
  recipientEmail: text("recipient_email"),
  dueDate: text("due_date").notNull(),
  status: text("status", { enum: ["draft", "sent", "paid"] }).notNull().default("draft"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  sentAt: integer("sent_at", { mode: "timestamp_ms" }),
}, (table) => [uniqueIndex("invoices_invoice_number_unique").on(table.invoiceNumber)]);

export const documents = sqliteTable("documents", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: integer("account_id").references(() => accounts.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  category: text("category", { enum: ["bol", "insurance", "registration", "other"] }).notNull(),
  expiresOn: text("expires_on"),
  blobKey: text("blob_key").notNull(),
  mimeType: text("mime_type").notNull(),
  filename: text("filename").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});

export const companyProfile = sqliteTable("company_profile", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: integer("account_id").references(() => accounts.id, { onDelete: "cascade" }),
  companyName: text("company_name").notNull(),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  ein: text("ein"),
  mcNumber: text("mc_number"),
  dotNumber: text("dot_number"),
  logoBlobKey: text("logo_blob_key"),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});
