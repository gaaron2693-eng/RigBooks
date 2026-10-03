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
  profileImageBlobKey: text("profile_image_blob_key"),
  backgroundImageBlobKey: text("background_image_blob_key"),
  backgroundOpacity: integer("background_opacity").notNull().default(18),
  language: text("language").notNull().default("en"),
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
  imageBlobKey: text("image_blob_key"),
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
  hazmat: boolean("hazmat").notNull().default(false),
  truckBrand: text("truck_brand"),
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
  equipment: text("equipment", { enum: ["reefer", "dryvan", "flatbed", "intermodal", "oversized", "boxtruck", "hotshot"] }),
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
  fuelCostPerMileCents: integer("fuel_cost_per_mile_cents").notNull().default(0),
  maintenanceCostPerMileCents: integer("maintenance_cost_per_mile_cents").notNull().default(0),
  insuranceCostPerMileCents: integer("insurance_cost_per_mile_cents").notNull().default(0),
  truckCostPerMileCents: integer("truck_cost_per_mile_cents").notNull().default(0),
  otherCostPerMileCents: integer("other_cost_per_mile_cents").notNull().default(0),
  factoringFeeBasisPoints: integer("factoring_fee_basis_points").notNull().default(0),
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

export const detentionClaims = pgTable("detention_claims", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
  facilityType: text("facility_type", { enum: ["shipper", "receiver"] }).notNull(),
  facilityName: text("facility_name").notNull(),
  brokerName: text("broker_name"),
  brokerEmail: text("broker_email"),
  loadReference: text("load_reference"),
  freeMinutes: integer("free_minutes").notNull().default(120),
  hourlyRateCents: integer("hourly_rate_cents").notNull(),
  arrivalAt: timestamp("arrival_at", { mode: "date", withTimezone: true }).notNull(),
  arrivalLatE6: integer("arrival_lat_e6").notNull(),
  arrivalLngE6: integer("arrival_lng_e6").notNull(),
  arrivalAccuracyMeters: integer("arrival_accuracy_meters"),
  departureAt: timestamp("departure_at", { mode: "date", withTimezone: true }),
  departureLatE6: integer("departure_lat_e6"),
  departureLngE6: integer("departure_lng_e6"),
  departureAccuracyMeters: integer("departure_accuracy_meters"),
  status: text("status", { enum: ["active", "pending", "sent", "paid"] }).notNull().default("active"),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true }).notNull().$defaultFn(() => new Date()),
}, (table) => [
  index("detention_claims_account_created_idx").on(table.accountId, table.createdAt),
]);

export const communityRatings = pgTable("community_ratings", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
  entityType: text("entity_type", { enum: ["broker", "shipper", "receiver"] }).notNull(),
  entityName: text("entity_name").notNull(),
  normalizedName: text("normalized_name").notNull(),
  detentionScore: integer("detention_score"),
  paymentScore: integer("payment_score"),
  honestyScore: integer("honesty_score"),
  waitScore: integer("wait_score"),
  treatmentScore: integer("treatment_score"),
  comment: text("comment"),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true }).notNull().$defaultFn(() => new Date()),
}, (table) => [
  uniqueIndex("community_ratings_account_entity_unique").on(table.accountId, table.entityType, table.normalizedName),
  index("community_ratings_entity_lookup_idx").on(table.entityType, table.normalizedName),
  index("community_ratings_updated_at_idx").on(table.updatedAt),
]);

export const yardModerationLogs = pgTable("yard_moderation_logs", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").references(() => accounts.id, { onDelete: "set null" }),
  driverName: text("driver_name").notNull(),
  postBody: text("post_body").notNull(),
  hadImage: boolean("had_image").notNull().default(false),
  category: text("category", { enum: ["hate_speech", "explicit_sexual", "spam"] }).notNull(),
  reason: text("reason").notNull(),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().$defaultFn(() => new Date()),
}, (table) => [index("yard_moderation_logs_created_at_idx").on(table.createdAt)]);

export const walletDocuments = pgTable("wallet_documents", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
  category: text("category", { enum: ["cdl", "medical_card", "vehicle_registration", "insurance_card", "ifta_license", "other"] }).notNull(),
  name: text("name").notNull(),
  issuingAuthority: text("issuing_authority"),
  issueDate: text("issue_date"),
  expiryDate: text("expiry_date"),
  notes: text("notes"),
  frontPhotoKey: text("front_photo_key").notNull(),
  frontMimeType: text("front_mime_type").notNull(),
  backPhotoKey: text("back_photo_key"),
  backMimeType: text("back_mime_type"),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true }).notNull().$defaultFn(() => new Date()),
}, (table) => [
  index("wallet_documents_account_expiry_idx").on(table.accountId, table.expiryDate),
]);

export const marketZoneSnapshots = pgTable("market_zone_snapshots", {
  id: serial("id").primaryKey(),
  payloadJson: text("payload_json").notNull(),
  weekEnding: text("week_ending"),
  fetchedAt: timestamp("fetched_at", { mode: "date", withTimezone: true }).notNull(),
}, (table) => [
  index("market_zone_snapshots_fetched_at_idx").on(table.fetchedAt),
]);

export const appFeedback = pgTable("app_feedback", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").references(() => accounts.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().$defaultFn(() => new Date()),
}, (table) => [
  index("app_feedback_created_at_idx").on(table.createdAt),
]);
