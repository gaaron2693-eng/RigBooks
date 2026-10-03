-- Add per-account UI language preference (en = English, es = Spanish)
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'en';
