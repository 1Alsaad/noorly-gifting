import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { PostgresOpsStore } from "../src/core/postgres.js";

// Requires an explicitly provided disposable PostgreSQL test database. pg-mem cannot
// demonstrate PostgreSQL's FOR UPDATE behavior, so do not substitute it for this test.
test(
  "PostgreSQL serializes independent connections and retains state after runtime restart",
  { skip: !process.env.OPS_TEST_DATABASE_URL },
  async () => {
    const schema = `ops_test_${randomUUID().replaceAll("-", "")}`;
    const admin = new Pool({
      connectionString: process.env.OPS_TEST_DATABASE_URL,
    });
    const pool = new Pool({
      connectionString: process.env.OPS_TEST_DATABASE_URL,
      max: 12,
      options: `-c search_path=${schema}`,
    });
    try {
      await admin.query(`CREATE SCHEMA "${schema}"`);
      const a = new PostgresOpsStore(pool);
      const b = new PostgresOpsStore(pool);
      await Promise.all([a.initialize(), b.initialize()]);
      const started = (await a.getControl()).observationStartedAt;
      const results = await Promise.allSettled(
        Array.from({ length: 40 }, (_, i) =>
          (i % 2 ? a : b).reserveSpend({
            idempotencyKey: `request-${i}`,
            category: "software",
            amountOre: 10000,
            purpose: "concurrency proof",
          }),
        ),
      );
      assert.equal(results.filter((r) => r.status === "fulfilled").length, 10);
      assert.equal((await a.snapshot()).budgets.software.usedOre, 100000);
      const c = new PostgresOpsStore(pool);
      await c.initialize();
      assert.equal((await c.getControl()).observationStartedAt, started);
      assert.equal((await c.snapshot()).budgets.software.usedOre, 100000);
      const job = await a.enqueueJob({
        dedupKey: "webhook-1",
        type: "sync",
        payload: {},
      });
      const leases = await Promise.all([
        a.leaseJob("a", 10000),
        b.leaseJob("b", 10000),
      ]);
      assert.equal(leases.filter(Boolean).length, 1);
      assert.equal(leases.find(Boolean)!.id, job.id);
      assert.equal(
        (await c.readAudit(1000)).filter((r) => r.event === "spend.reserved")
          .length,
        10,
      );
    } finally {
      await pool.end();
      await admin.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
      await admin.end();
    }
  },
);
