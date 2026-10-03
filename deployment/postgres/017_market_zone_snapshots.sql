CREATE TABLE market_zone_snapshots (
  id SERIAL PRIMARY KEY,
  payload_json TEXT NOT NULL,
  week_ending TEXT,
  fetched_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX market_zone_snapshots_fetched_at_idx ON market_zone_snapshots (fetched_at);
