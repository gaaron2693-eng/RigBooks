CREATE TABLE IF NOT EXISTS hos_status_events (
  id SERIAL PRIMARY KEY,
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS hos_status_events_account_started_idx ON hos_status_events (account_id, started_at);
CREATE TABLE IF NOT EXISTS hos_settings (
  id SERIAL PRIMARY KEY,
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  motion_prompt_minutes INTEGER NOT NULL DEFAULT 5,
  gps_prompts_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS hos_settings_account_id_unique ON hos_settings (account_id);
