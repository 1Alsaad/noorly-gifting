import { randomUUID } from "node:crypto";
import type { Pool } from "pg";

export const RECORDS_SQL = `
CREATE TABLE IF NOT EXISTS noorly_ops_records (
  kind text NOT NULL, key text NOT NULL, document jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(kind,key)
);
CREATE TABLE IF NOT EXISTS noorly_ops_effects (
  key text PRIMARY KEY, action text NOT NULL, fingerprint text NOT NULL,
  state text NOT NULL CHECK(state IN ('pending','succeeded','rejected','unknown')),
  result jsonb, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);`;
export interface RecordStore {
  put(kind: string, key: string, document: unknown): Promise<void>;
  get<T>(kind: string, key: string): Promise<T | undefined>;
  list<T>(
    kind: string,
    limit?: number,
  ): Promise<Array<{ key: string; document: T }>>;
  claimEffect(
    key: string,
    action: string,
    fingerprint: string,
  ): Promise<{ claimed: boolean; state: string; result?: unknown }>;
  finishEffect(
    key: string,
    state: "succeeded" | "rejected" | "unknown",
    result: unknown,
  ): Promise<void>;
  withLock<T>(
    name: string,
    run: () => Promise<T>,
  ): Promise<{ locked: boolean; result?: T }>;
}
export class PostgresRecords implements RecordStore {
  constructor(private pool: Pool) {}
  async initialize() {
    await this.pool.query(RECORDS_SQL);
  }
  async withLock<T>(name: string, run: () => Promise<T>) {
    const client = await this.pool.connect();
    let locked = false;
    try {
      locked =
        (
          await client.query(
            "SELECT pg_try_advisory_lock(hashtextextended($1,0)) AS locked",
            [name],
          )
        ).rows[0].locked === true;
      return locked ? { locked: true, result: await run() } : { locked: false };
    } finally {
      let destroy = false;
      if (locked)
        await client
          .query("SELECT pg_advisory_unlock(hashtextextended($1,0))", [name])
          .catch(() => {
            destroy = true;
          });
      client.release(destroy);
    }
  }
  async put(kind: string, key: string, document: unknown) {
    await this.pool.query(
      "INSERT INTO noorly_ops_records(kind,key,document) VALUES($1,$2,$3::jsonb) ON CONFLICT(kind,key) DO UPDATE SET document=EXCLUDED.document,updated_at=now()",
      [kind, key, JSON.stringify(document)],
    );
  }
  async get<T>(kind: string, key: string): Promise<T | undefined> {
    const r = await this.pool.query(
      "SELECT document FROM noorly_ops_records WHERE kind=$1 AND key=$2",
      [kind, key],
    );
    return r.rows[0]?.document;
  }
  async list<T>(
    kind: string,
    limit = 100,
  ): Promise<Array<{ key: string; document: T }>> {
    return (
      await this.pool.query(
        "SELECT key,document FROM noorly_ops_records WHERE kind=$1 ORDER BY updated_at DESC LIMIT $2",
        [kind, Math.min(500, Math.max(1, limit))],
      )
    ).rows;
  }
  async claimEffect(key: string, action: string, fingerprint: string) {
    const result = await this.pool.query(
      "INSERT INTO noorly_ops_effects(key,action,fingerprint,state) VALUES($1,$2,$3,'pending') ON CONFLICT DO NOTHING RETURNING key",
      [key, action, fingerprint],
    );
    if (result.rowCount === 1) return { claimed: true, state: "pending" };
    const existing = (
      await this.pool.query(
        "SELECT action,fingerprint,state,result FROM noorly_ops_effects WHERE key=$1",
        [key],
      )
    ).rows[0];
    if (existing.action !== action || existing.fingerprint !== fingerprint)
      throw new Error("Effect key reused with different payload");
    return { claimed: false, state: existing.state, result: existing.result };
  }
  async finishEffect(
    key: string,
    state: "succeeded" | "rejected" | "unknown",
    result: unknown,
  ) {
    await this.pool.query(
      "UPDATE noorly_ops_effects SET state=$2,result=$3::jsonb,updated_at=now() WHERE key=$1 AND state IN ('pending','unknown')",
      [key, state, JSON.stringify(result)],
    );
  }
}
export class MemoryRecords implements RecordStore {
  private locks = new Set<string>();
  async withLock<T>(name: string, run: () => Promise<T>) {
    if (this.locks.has(name)) return { locked: false };
    this.locks.add(name);
    try {
      return { locked: true, result: await run() };
    } finally {
      this.locks.delete(name);
    }
  }
  private records = new Map<string, unknown>();
  private effects = new Map<
    string,
    { action: string; fingerprint: string; state: string; result?: unknown }
  >();
  async put(kind: string, key: string, document: unknown) {
    this.records.delete(`${kind}:${key}`);
    this.records.set(`${kind}:${key}`, structuredClone(document));
  }
  async get<T>(kind: string, key: string) {
    return structuredClone(this.records.get(`${kind}:${key}`)) as T | undefined;
  }
  async list<T>(kind: string, limit = 100) {
    return [...this.records.entries()]
      .reverse()
      .filter(([key]) => key.startsWith(`${kind}:`))
      .slice(0, Math.min(500, Math.max(1, limit)))
      .map(([key, document]) => ({
        key: key.slice(kind.length + 1),
        document: structuredClone(document) as T,
      }));
  }
  async claimEffect(key: string, action: string, fingerprint: string) {
    const found = this.effects.get(key);
    if (found) {
      if (found.action !== action || found.fingerprint !== fingerprint)
        throw new Error("Effect key reused with different payload");
      return { claimed: false, state: found.state, result: found.result };
    }
    this.effects.set(key, { action, fingerprint, state: "pending" });
    return { claimed: true, state: "pending" };
  }
  async finishEffect(
    key: string,
    state: "succeeded" | "rejected" | "unknown",
    result: unknown,
  ) {
    const existing = this.effects.get(key);
    if (!existing) throw new Error("Unknown effect");
    if (existing.state === "pending" || existing.state === "unknown")
      this.effects.set(key, {
        ...existing,
        state,
        result: structuredClone(result),
      });
  }
}
export const recordId = () => randomUUID();
