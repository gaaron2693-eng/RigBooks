CREATE TABLE IF NOT EXISTS hos_event_annotations (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES hos_status_events(id) ON DELETE CASCADE,
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS hos_event_annotations_event_idx ON hos_event_annotations (event_id, created_at);
CREATE TABLE IF NOT EXISTS hos_event_edits (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES hos_status_events(id) ON DELETE CASCADE,
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  original_status TEXT NOT NULL,
  new_status TEXT NOT NULL,
  original_started_at TIMESTAMPTZ NOT NULL,
  new_started_at TIMESTAMPTZ NOT NULL,
  reason TEXT NOT NULL,
  edited_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS hos_event_edits_event_idx ON hos_event_edits (event_id, created_at);
CREATE TABLE IF NOT EXISTS hos_daily_certifications (
  id SERIAL PRIMARY KEY,
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  log_date TEXT NOT NULL,
  signed_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS hos_daily_certifications_account_date_unique ON hos_daily_certifications (account_id, log_date);
CREATE TABLE IF NOT EXISTS dvir_reports (
  id SERIAL PRIMARY KEY,
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL,
  odometer_tenths INTEGER NOT NULL,
  signed_by TEXT NOT NULL,
  no_defects BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS dvir_reports_account_created_idx ON dvir_reports (account_id, created_at);
CREATE TABLE IF NOT EXISTS dvir_defects (
  id SERIAL PRIMARY KEY,
  report_id INTEGER NOT NULL REFERENCES dvir_reports(id) ON DELETE CASCADE,
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  component TEXT NOT NULL,
  note TEXT,
  photo_blob_key TEXT,
  repair_required BOOLEAN NOT NULL DEFAULT FALSE,
  repaired_at TIMESTAMPTZ,
  repair_signed_by TEXT,
  repair_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS dvir_defects_account_repair_idx ON dvir_defects (account_id, repaired_at);
