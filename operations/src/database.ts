import pg from "pg";
import { PostgresOpsStore } from "./core/postgres.js";
import { MemoryOpsStore } from "./core/memory.js";
import type { OpsStore } from "./core/types.js";
import { MemoryRecords, PostgresRecords, type RecordStore } from "./records.js";

let storePromise: Promise<OpsStore> | undefined;
let pool: pg.Pool | undefined;
let recordsPromise: Promise<RecordStore> | undefined;
export function demoMode() {
  return (
    process.env.OPS_DEMO === "true" &&
    !process.env.VERCEL &&
    process.env.NODE_ENV !== "production"
  );
}
export function databasePool(): pg.Pool {
  if (!process.env.DATABASE_URL)
    throw new Error(
      "DATABASE_URL is not configured. Live operations remain disabled.",
    );
  pool ??= new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 4,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
    application_name: "noorly-operations",
  });
  return pool;
}
export function getStore(): Promise<OpsStore> {
  storePromise ??= (async () => {
    const memory = demoMode();
    const store: OpsStore = memory
      ? new MemoryOpsStore()
      : new PostgresOpsStore(databasePool());
    await store.initialize();
    return store;
  })().catch((error) => {
    storePromise = undefined;
    throw error;
  });
  return storePromise;
}
export function getRecords(): Promise<RecordStore> {
  recordsPromise ??= (async () => {
    if (demoMode()) return new MemoryRecords();
    const records = new PostgresRecords(databasePool());
    await records.initialize();
    return records;
  })().catch((error) => {
    recordsPromise = undefined;
    throw error;
  });
  return recordsPromise;
}
export async function closeDatabase(): Promise<void> {
  await pool?.end();
  pool = undefined;
  storePromise = undefined;
  recordsPromise = undefined;
}
