-- Document wallet: store trucker documents (CDL, medical card, registration, insurance, IFTA)
CREATE TABLE IF NOT EXISTS wallet_documents (
  id SERIAL PRIMARY KEY,
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('cdl', 'medical_card', 'vehicle_registration', 'insurance_card', 'ifta_license', 'other')),
  name TEXT NOT NULL,
  issuing_authority TEXT,
  issue_date TEXT,
  expiry_date TEXT,
  notes TEXT,
  front_photo_key TEXT NOT NULL,
  front_mime_type TEXT NOT NULL,
  back_photo_key TEXT,
  back_mime_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS wallet_documents_account_expiry_idx ON wallet_documents (account_id, expiry_date);
