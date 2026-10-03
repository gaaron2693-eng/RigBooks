CREATE TABLE IF NOT EXISTS yard_moderation_logs (
  id SERIAL PRIMARY KEY,
  account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
  driver_name TEXT NOT NULL,
  post_body TEXT NOT NULL,
  had_image BOOLEAN NOT NULL DEFAULT FALSE,
  category TEXT NOT NULL CHECK (category IN ('hate_speech', 'explicit_sexual', 'spam')),
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS yard_moderation_logs_created_at_idx ON yard_moderation_logs(created_at);
