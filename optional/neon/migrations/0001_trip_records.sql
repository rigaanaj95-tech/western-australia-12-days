CREATE TABLE IF NOT EXISTS trip_records (
  trip_id TEXT NOT NULL CHECK (
    char_length(trip_id) BETWEEN 1 AND 160
    AND trip_id ~ '^[A-Za-z0-9][A-Za-z0-9._:-]*$'
  ),
  collection TEXT NOT NULL CHECK (collection IN ('bills', 'travelers', 'todos', 'tickets')),
  record_id TEXT NOT NULL CHECK (
    char_length(record_id) BETWEEN 1 AND 160
    AND record_id ~ '^[A-Za-z0-9][A-Za-z0-9._:-]*$'
  ),
  value JSONB NOT NULL CHECK (jsonb_typeof(value) = 'object'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (trip_id, collection, record_id)
);

CREATE INDEX IF NOT EXISTS idx_trip_records_trip_collection
  ON trip_records (trip_id, collection, created_at, record_id);
