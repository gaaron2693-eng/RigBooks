CREATE TABLE IF NOT EXISTS community_ratings (
  id SERIAL PRIMARY KEY,
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('broker', 'shipper', 'receiver')),
  entity_name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  detention_score INTEGER CHECK (detention_score IS NULL OR detention_score BETWEEN 1 AND 5),
  payment_score INTEGER CHECK (payment_score IS NULL OR payment_score BETWEEN 1 AND 5),
  honesty_score INTEGER CHECK (honesty_score IS NULL OR honesty_score BETWEEN 1 AND 5),
  wait_score INTEGER CHECK (wait_score IS NULL OR wait_score BETWEEN 1 AND 5),
  treatment_score INTEGER CHECK (treatment_score IS NULL OR treatment_score BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS community_ratings_account_entity_unique ON community_ratings (account_id, entity_type, normalized_name);
CREATE INDEX IF NOT EXISTS community_ratings_entity_lookup_idx ON community_ratings (entity_type, normalized_name);
CREATE INDEX IF NOT EXISTS community_ratings_updated_at_idx ON community_ratings (updated_at);
