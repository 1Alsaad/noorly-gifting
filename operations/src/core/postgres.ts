import { randomUUID } from "node:crypto";
import type { Pool } from "pg";
import { initialState, StateOpsStore } from "./store.js";
import type { AuditRecord, OpsState, StoreOptions } from "./types.js";

export const MIGRATION_SQL = `
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
`;

/** One locked row serializes the small initial business ledger, including cross-process races.
 * Transactions never contain network calls. Audit and state commit together.
 * If scale requires partitioning, preserve serializable budget/credit/lease invariants.
 */
export class PostgresOpsStore extends StateOpsStore {
  constructor(
    private readonly pool: Pool,
    options: StoreOptions = {},
  ) {
    super(options);
  }
  async initialize(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      // Also serialize concurrent first-start DDL, not just subsequent ledger changes.
      await client.query("SELECT pg_advisory_xact_lock(71490321)");
      await client.query(MIGRATION_SQL);
      await client.query(
        "INSERT INTO noorly_ops_state (id, document) VALUES (1, $1::jsonb) ON CONFLICT (id) DO NOTHING",
        [JSON.stringify(initialState(this.clock()))],
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
  protected transact = async <T>(
    operation: (
      state: OpsState,
      audit: (
        event: string,
        data: Record<string, unknown>,
        actor?: string,
      ) => void,
      now: Date,
    ) => T,
  ): Promise<T> => {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SET LOCAL lock_timeout = '10s'");
      const row = await client.query<{ document: OpsState }>(
        "SELECT document FROM noorly_ops_state WHERE id = 1 FOR UPDATE",
      );
      if (!row.rows[0]) throw new Error("Operations store is not initialized");
      const state = row.rows[0].document;
      if (state.version !== 1)
        throw new Error("Unsupported operations state version");
      state.obligations ??= {};
      const now = this.clock();
      const events: AuditRecord[] = [];
      const result = operation(
        state,
        (event, data, actor = "runtime") =>
          events.push({
            id: randomUUID(),
            at: now.toISOString(),
            actor,
            event,
            data: structuredClone(data),
          }),
        now,
      );
      await client.query(
        "UPDATE noorly_ops_state SET document = $1::jsonb, updated_at = $2 WHERE id = 1",
        [JSON.stringify(state), now.toISOString()],
      );
      for (const entry of events)
        await client.query(
          "INSERT INTO noorly_ops_audit (id, occurred_at, actor, event, data) VALUES ($1, $2, $3, $4, $5::jsonb)",
          [
            entry.id,
            entry.at,
            entry.actor,
            entry.event,
            JSON.stringify(entry.data),
          ],
        );
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  };
  async readAudit(limit = 100): Promise<AuditRecord[]> {
    const result = await this.pool.query<{
      id: string;
      occurred_at: Date | string;
      actor: string;
      event: string;
      data: Record<string, unknown>;
    }>(
      "SELECT id, occurred_at, actor, event, data FROM noorly_ops_audit ORDER BY occurred_at DESC, id DESC LIMIT $1",
      [Math.min(Math.max(Number.isSafeInteger(limit) ? limit : 100, 1), 1000)],
    );
    return result.rows.map((r) => ({
      id: r.id,
      at: new Date(r.occurred_at).toISOString(),
      actor: r.actor,
      event: r.event,
      data: r.data,
    }));
  }
}
