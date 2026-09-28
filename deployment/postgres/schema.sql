CREATE TABLE accounts (
  id SERIAL PRIMARY KEY,
  viewer_fbid TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  email TEXT UNIQUE,
  auth_provider TEXT NOT NULL DEFAULT 'muse' CHECK (auth_provider IN ('google','apple','muse','email')),
  password_hash TEXT,
  password_salt TEXT,
  role TEXT NOT NULL DEFAULT 'standard' CHECK (role IN ('standard','creator','tester')),
  access_label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE driver_posts (
  id SERIAL PRIMARY KEY,
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX driver_posts_created_at_idx ON driver_posts(created_at);

CREATE TABLE driver_replies (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES driver_posts(id) ON DELETE CASCADE,
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX driver_replies_post_created_idx ON driver_replies(post_id, created_at);

CREATE TABLE driver_post_likes (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES driver_posts(id) ON DELETE CASCADE,
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT driver_post_likes_post_account_unique UNIQUE (post_id, account_id)
);
CREATE INDEX driver_post_likes_post_id_idx ON driver_post_likes(post_id);

CREATE TABLE account_sessions (
  id SERIAL PRIMARY KEY,
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  session_token_hash TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX account_sessions_account_id_idx ON account_sessions(account_id);

CREATE TABLE truck_profiles (
  id SERIAL PRIMARY KEY,
  account_id INTEGER NOT NULL UNIQUE REFERENCES accounts(id) ON DELETE CASCADE,
  truck_name TEXT NOT NULL,
  current_odometer_tenths INTEGER NOT NULL,
  last_pm_odometer_tenths INTEGER NOT NULL,
  pm_interval_tenths INTEGER NOT NULL,
  height_inches INTEGER NOT NULL DEFAULT 162,
  weight_pounds INTEGER NOT NULL DEFAULT 80000,
  length_feet INTEGER NOT NULL DEFAULT 75,
  width_inches INTEGER NOT NULL DEFAULT 102,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE loads (
  id SERIAL PRIMARY KEY,
  account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,
  reference TEXT,
  broker TEXT,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  delivered_on TEXT NOT NULL,
  loaded_miles_tenths INTEGER NOT NULL,
  deadhead_miles_tenths INTEGER NOT NULL DEFAULT 0,
  gross_pay_cents INTEGER NOT NULL,
  pay_mode TEXT NOT NULL DEFAULT 'flat' CHECK (pay_mode IN ('flat','percentage','per_mile')),
  load_gross_cents INTEGER,
  pay_percent_basis_points INTEGER,
  per_mile_rate_cents INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX loads_account_id_idx ON loads(account_id);
CREATE INDEX loads_delivered_on_idx ON loads(delivered_on);

CREATE TABLE pay_settings (
  id SERIAL PRIMARY KEY,
  account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,
  driver_type TEXT NOT NULL CHECK (driver_type IN ('company_driver','lease_purchase','owner_operator','hourly_driver')),
  vehicle_type TEXT CHECK (vehicle_type IN ('dump_truck','cement_mixer','straight_truck','hotshot','tractor_trailer')),
  hourly_rate_cents INTEGER NOT NULL DEFAULT 0,
  pay_mode TEXT NOT NULL CHECK (pay_mode IN ('flat','percentage','per_mile')),
  default_pay_percent_basis_points INTEGER NOT NULL,
  default_per_mile_cents INTEGER NOT NULL DEFAULT 0,
  weekly_truck_payment_cents INTEGER NOT NULL DEFAULT 0,
  weekly_maintenance_escrow_cents INTEGER NOT NULL DEFAULT 0,
  weekly_insurance_cents INTEGER NOT NULL DEFAULT 0,
  weekly_other_deductions_cents INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX pay_settings_account_id_idx ON pay_settings(account_id);

CREATE TABLE work_shifts (
  id SERIAL PRIMARY KEY,
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  work_date TEXT NOT NULL,
  clock_in_at TIMESTAMPTZ NOT NULL,
  clock_out_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX work_shifts_account_date_idx ON work_shifts(account_id, work_date);

CREATE TABLE subscription_access (
  id SERIAL PRIMARY KEY,
  client_id TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('creator','tester')),
  label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE comp_invites (
  id SERIAL PRIMARY KEY,
  code_hash TEXT NOT NULL UNIQUE,
  code_hint TEXT NOT NULL,
  label TEXT NOT NULL,
  created_by_client_id TEXT NOT NULL,
  redeemed_by_client_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  redeemed_at TIMESTAMPTZ
);

CREATE TABLE expenses (
  id SERIAL PRIMARY KEY,
  account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('fuel','tolls','maintenance','insurance','truck_payment','other')),
  description TEXT,
  expense_date TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  gallons_thousandths INTEGER,
  fuel_state TEXT,
  receipt_blob_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX expenses_account_id_idx ON expenses(account_id);
CREATE INDEX expenses_expense_date_idx ON expenses(expense_date);

CREATE TABLE ifta_entries (
  id SERIAL PRIMARY KEY,
  account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,
  load_id INTEGER REFERENCES loads(id) ON DELETE CASCADE,
  state_code TEXT NOT NULL,
  miles_tenths INTEGER NOT NULL DEFAULT 0,
  gallons_thousandths INTEGER NOT NULL DEFAULT 0,
  source TEXT NOT NULL CHECK (source IN ('load','gps','manual','fuel')),
  entry_date TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX ifta_entries_account_id_idx ON ifta_entries(account_id);
CREATE INDEX ifta_entries_date_idx ON ifta_entries(entry_date);

CREATE TABLE invoices (
  id SERIAL PRIMARY KEY,
  account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,
  load_id INTEGER NOT NULL REFERENCES loads(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL UNIQUE,
  recipient_email TEXT,
  due_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','paid')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);
CREATE INDEX invoices_account_id_idx ON invoices(account_id);

CREATE TABLE documents (
  id SERIAL PRIMARY KEY,
  account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('bol','insurance','registration','other')),
  expires_on TEXT,
  blob_key TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  filename TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX documents_account_id_idx ON documents(account_id);

CREATE TABLE company_profile (
  id SERIAL PRIMARY KEY,
  account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  ein TEXT,
  mc_number TEXT,
  dot_number TEXT,
  logo_blob_key TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX company_profile_account_id_idx ON company_profile(account_id);

CREATE TABLE file_blobs (
  blob_key TEXT PRIMARY KEY,
  content_type TEXT NOT NULL,
  data BYTEA NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
