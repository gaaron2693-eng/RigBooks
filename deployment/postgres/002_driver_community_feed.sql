CREATE TABLE IF NOT EXISTS driver_posts (
  id SERIAL PRIMARY KEY,
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS driver_posts_created_at_idx ON driver_posts(created_at);

CREATE TABLE IF NOT EXISTS driver_replies (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES driver_posts(id) ON DELETE CASCADE,
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS driver_replies_post_created_idx ON driver_replies(post_id, created_at);

CREATE TABLE IF NOT EXISTS driver_post_likes (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES driver_posts(id) ON DELETE CASCADE,
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT driver_post_likes_post_account_unique UNIQUE (post_id, account_id)
);
CREATE INDEX IF NOT EXISTS driver_post_likes_post_id_idx ON driver_post_likes(post_id);
