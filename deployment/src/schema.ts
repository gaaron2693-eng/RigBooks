// NOTE: This is the PRODUCTION Postgres schema. It intentionally differs from the
// artifact's sqlite schema (drizzle-orm/sqlite-core): timestamp columns use pg-core
// timestamp() and ids use serial() to match deployment/postgres/001_initial.sql
// (TIMESTAMPTZ columns). Do NOT overwrite this file with the sqlite mirror.

import { boolean, index, integer, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  viewerFbid: text("viewer_fbid").notNull(),
  displayName: text("display_name").notNull(),
  email: text("email"),
  authProvider: text("auth_provider", { enum: ["google", "apple", "muse", "email"] }).notNull().default("muse"),
  passwordHash: text("password_hash"),
  passwordSalt: text("password_salt"),
  role: text("role", { enum: ["standard", "creator", "tester"] }).notNull().default("standard"),
  accessLabel: text("access_label"),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true }).notNull().$defaultFn(() => new Date()),
}, (table) => [
  uniqueIndex("accounts_viewer_fbid_unique").on(table.viewerFbid),
  uniqueIndex("accounts_email_unique").on(table.email),
]);

export const accountSessions = pgTable("account_sessions", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
  sessionTokenHash: text("session_token_hash").notNull(),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().$defaultFn(() => new Date()),
  lastUsedAt: timestamp("last_used_at", { mode: "date", withTimezone: true }).notNull().$defaultFn(() => new Date()),
}, (table) => [uniqueIndex("account_sessions_token_hash_unique").on(table.sessionTokenHash)]);

export const driverPosts = pgTable("driver_posts", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().$defaultFn(() => new Date()),
}, (table) => [index("driver_posts_created_at_idx").on(table.createdAt)]);

export const driverReplies = pgTable("driver_replies", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => driverPosts.id, { onDelete: "cascade" }),
  accountId: integer("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().$defaultFn(() => new Date()),
}, (table) => [index("driver_replies_post_created_idx").on(table.postId, table.createdAt)]);

export const driverPostLikes = pgTable("driver_post_likes", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => driverPosts.id, { onDelete: "cascade" }),
  accountId: integer("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().$defaultFn(() => new Date()),
}, (table) => [uniqueIndex("driver_post_likes_post_account_unique").on(table.postId, table.accountId)]);

export const hosStatusEvents = pgTable("hos_status_events", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
  status: text("status", { enum: ["off_duty", "sleeper", "driving", "on_duty"] }).notNull(),
  startedAt: timestamp("started_at", { mode: "date", withTimezone: true }).notNull().$defaultFn(() => new Date()),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().$defaultFn(() => new Date()),
}, (table) => [index("hos_status_events_account_started_idx").on(table.accountId, table.startedAt)]);

export const hosSettings = pgTable("hos_settings", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
  motionPromptMinutes: integer("motion_prompt_minutes").notNull().default(5),
  gpsPromptsEnabled: boolean("gps_prompts_enabled").notNull().default(true),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true }).notNull().$defaultFn(() => new Date()),
}, (table) => [uniqueIndex("hos_settings_account_id_unique").on(table.accountId)]);

export const hosEventAnnotations = pgTable("hos_event_annotations", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull().references(() => hosStatusEvents.id, { onDelete: "cascade" }),
  accountId: integer("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().$defaultFn(() => new Date()),
}, (table) => [index("hos_event_annotations_event_idx").on(table.eventId, table.createdAt)]);

export const hosEventEdits = pgTable("hos_event_edits", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull().references(() => hosStatusEvents.id, { onDelete: "cascade" }),
  accountId: integer("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
  originalStatus: text("original_status", { enum: ["off_duty", "sleeper", "driving", "on_duty"] }).notNull(),
  newStatus: text("new_status", { enum: ["off_duty", "sleeper", "driving", "on_duty"] }).notNull(),
  originalStartedAt: timestamp("original_started_at", { mode: "date", withTimezone: true }).notNull(),
  newStartedAt: timestamp("new_started_at", { mode: "date", withTimezone: true }).notNull(),
  reason: text("reason").notNull(),
  editedBy: text("edited_by").notNull(),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().$defaultFn(() => new Date()),
}, (table) => [index("hos_event_edits_event_idx").on(table.eventId, table.createdAt)]);

export const hosDailyCertifications = pgTable("hos_daily_certifications", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
  logDate: text("log_date").notNull(),
  signedBy: text("signed_by").notNull(),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().$defaultFn(() => new Date()),
}, (table) => [uniqueIndex("hos_daily_certifications_account_date_unique").on(table.accountId, table.logDate)]);

export const dvirReports = pgTable("dvir_reports", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
  reportType: text("report_type", { enum: ["pre_trip", "post_trip"] }).notNull(),
  odometerTenths: integer("odometer_tenths").notNull(),
  signedBy: text("signed_by").notNull(),
  noDefects: boolean("no_defects").notNull().default(false),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().$defaultFn(() => new Date()),
}, (table) => [index("dvir_reports_account_created_idx").on(table.accountId, table.createdAt)]);

export const dvirDefects = pgTable("dvir_defects", {
  id: serial("id").primaryKey(),
  reportId: integer("report_id").notNull().references(() => dvirReports.id, { onDelete: "cascade" }),
  accountId: integer("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
  component: text("component").notNull(),
  note: text("note"),
  photoBlobKey: text("photo_blob_key"),
  repairRequired: boolean("repair_required").notNull().default(false),
  repairedAt: timestamp("repaired_at", { mode: "date", withTimezone: true }),
  repairSignedBy: text("repair_signed_by"),
  repairNote: text("repair_note"),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().$defaultFn(() => new Date()),
}, (table) => [index("dvir_defects_account_repair_idx").on(table.accountId, table.repairedAt)]);

export const truckProfiles = pgTable("truck_profiles", {
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
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true }).notNull().$defaultFn(() => new Date()),
}, (table) => [uniqueIndex("truck_profiles_account_id_unique").on(table.accountId)]);

export const loads = pgTable("loads", {
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
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const paySettings = pgTable("pay_settings", {
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
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const workShifts = pgTable("work_shifts", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
  workDate: text("work_date").notNull(),
  clockInAt: timestamp("clock_in_at", { mode: "date", withTimezone: true }).notNull(),
  clockOutAt: timestamp("clock_out_at", { mode: "date", withTimezone: true }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().$defaultFn(() => new Date()),
});

export const subscriptionAccess = pgTable("subscription_access", {
  id: serial("id").primaryKey(),
  clientId: text("client_id").notNull(),
  role: text("role", { enum: ["creator", "tester"] }).notNull(),
  label: text("label"),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
    .notNull()
    .$defaultFn(() => new Date()),
}, (table) => [uniqueIndex("subscription_access_client_id_unique").on(table.clientId)]);

export const compInvites = pgTable("comp_invites", {
  id: serial("id").primaryKey(),
  codeHash: text("code_hash").notNull(),
  codeHint: text("code_hint").notNull(),
  label: text("label").notNull(),
  createdByClientId: text("created_by_client_id").notNull(),
  redeemedByClientId: text("redeemed_by_client_id"),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
    .notNull()
    .$defaultFn(() => new Date()),
  redeemedAt: timestamp("redeemed_at", { mode: "date", withTimezone: true }),
}, (table) => [uniqueIndex("comp_invites_code_hash_unique").on(table.codeHash)]);

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
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
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
    .notNull()
    .$defaultFn(() => new Date()),
});


export const iftaEntries = pgTable("ifta_entries", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").references(() => accounts.id, { onDelete: "cascade" }),
  loadId: integer("load_id").references(() => loads.id, { onDelete: "cascade" }),
  stateCode: text("state_code").notNull(),
  milesTenths: integer("miles_tenths").notNull().default(0),
  gallonsThousandths: integer("gallons_thousandths").notNull().default(0),
  source: text("source", { enum: ["load", "gps", "manual", "fuel"] }).notNull(),
  entryDate: text("entry_date").notNull(),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().$defaultFn(() => new Date()),
});

export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").references(() => accounts.id, { onDelete: "cascade" }),
  loadId: integer("load_id").notNull().references(() => loads.id, { onDelete: "cascade" }),
  invoiceNumber: text("invoice_number").notNull(),
  recipientEmail: text("recipient_email"),
  dueDate: text("due_date").notNull(),
  status: text("status", { enum: ["draft", "sent", "paid"] }).notNull().default("draft"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().$defaultFn(() => new Date()),
  sentAt: timestamp("sent_at", { mode: "date", withTimezone: true }),
}, (table) => [uniqueIndex("invoices_invoice_number_unique").on(table.invoiceNumber)]);

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").references(() => accounts.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  category: text("category", { enum: ["bol", "insurance", "registration", "other"] }).notNull(),
  expiresOn: text("expires_on"),
  blobKey: text("blob_key").notNull(),
  mimeType: text("mime_type").notNull(),
  filename: text("filename").notNull(),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().$defaultFn(() => new Date()),
});

export const companyProfile = pgTable("company_profile", {  id: serial("id").primaryKey(),
  accountId: integer("account_id").references(() => accounts.id, { onDelete: "cascade" }),
  companyName: text("company_name").notNull(),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  ein: text("ein"),
  mcNumber: text("mc_number"),
  dotNumber: text("dot_number"),
  logoBlobKey: text("logo_blob_key"),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true }).notNull().$defaultFn(() => new Date()),
});

export const stripeSubscriptions = pgTable("stripe_subscriptions", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
  stripeCustomerId: text("stripe_customer_id").notNull(),
  stripeSubscriptionId: text("stripe_subscription_id"),
  plan: text("plan", { enum: ["weekly", "monthly", "yearly"] }),
  status: text("status").notNull().default("none"),
  currentPeriodEnd: timestamp("current_period_end", { mode: "date", withTimezone: true }),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true }).notNull().$defaultFn(() => new Date()),
}, (table) => [
  uniqueIndex("stripe_subscriptions_account_id_unique").on(table.accountId),
  uniqueIndex("stripe_subscriptions_stripe_subscription_id_unique").on(table.stripeSubscriptionId),
]);
