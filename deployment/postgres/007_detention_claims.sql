CREATE TABLE IF NOT EXISTS detention_claims (
  id SERIAL PRIMARY KEY,
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  facility_type TEXT NOT NULL CHECK (facility_type IN ('shipper', 'receiver')),
  facility_name TEXT NOT NULL,
  broker_name TEXT,
  broker_email TEXT,
  load_reference TEXT,
  free_minutes INTEGER NOT NULL DEFAULT 120,
  hourly_rate_cents INTEGER NOT NULL,
  arrival_at TIMESTAMPTZ NOT NULL,
  arrival_lat_e6 INTEGER NOT NULL,
  arrival_lng_e6 INTEGER NOT NULL,
  arrival_accuracy_meters INTEGER,
  departure_at TIMESTAMPTZ,
  departure_lat_e6 INTEGER,
  departure_lng_e6 INTEGER,
  departure_accuracy_meters INTEGER,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'sent', 'paid')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS detention_claims_account_created_idx ON detention_claims (account_id, created_at);
