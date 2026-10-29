-- The service initializes the singleton state without resetting existing observation time.
-- Keep this schema in sync with MIGRATION_SQL in src/core/postgres.ts.
CREATE TABLE IF NOT EXISTS noorly_ops_state (
  id smallint PRIMARY KEY CHECK (id = 1),
  document jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS noorly_ops_audit (
  id uuid PRIMARY KEY,
  occurred_at timestamptz NOT NULL,
  actor text NOT NULL,
  event text NOT NULL,
  data jsonb NOT NULL
);
CREATE INDEX IF NOT EXISTS noorly_ops_audit_occurred_at_idx ON noorly_ops_audit (occurred_at DESC);
