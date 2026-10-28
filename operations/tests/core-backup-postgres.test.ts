import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, readdir, rm, stat } from "node:fs/promises";
import { basename, delimiter, dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { Pool } from "pg";
import { PostgresOpsStore } from "../src/core/postgres.js";
import { PostgresRecords } from "../src/records.js";
import { fingerprint, runEffect } from "../src/effects.js";
import {
  createShopifyAdapter,
  type ProductCopyUpdate,
  type ShopifyProductCopy,
} from "../src/adapters/shopify.js";

const executeFile = promisify(execFile);
const clientsDirectory = process.env.OPS_TEST_PG_BIN;
const tool = (name: string) =>
  clientsDirectory
    ? join(
        clientsDirectory,
        `${name}${process.platform === "win32" ? ".exe" : ""}`,
      )
    : name;
function databaseUrl(base: string, database: string): string {
  const url = new URL(base);
  url.pathname = `/${database}`;
  return url.toString();
}
function pgEnvironment(connection: string): NodeJS.ProcessEnv {
  const url = new URL(connection);
  return {
    ...process.env,
    PGHOST: url.hostname,
    PGPORT: url.port || "5432",
    PGUSER: decodeURIComponent(url.username),
    PGPASSWORD: decodeURIComponent(url.password),
    PGDATABASE: decodeURIComponent(url.pathname.slice(1)),
    PGCONNECT_TIMEOUT: "10",
    ...(url.searchParams.get("sslmode")
      ? { PGSSLMODE: url.searchParams.get("sslmode")! }
      : {}),
  };
}
const json = (value: unknown) =>
  new Response(JSON.stringify(value), {
    headers: { "Content-Type": "application/json" },
  });

// This proves real PostgreSQL dump/restore plus deterministic provider-fixture
// reconciliation. It does NOT certify recovery against a real Shopify account.
// OPS_TEST_DATABASE_URL must identify a disposable test server with CREATEDB.
// OPS_TEST_PG_BIN optionally selects matching pg_dump/pg_restore binaries.
test(
  "real backup restores ledger, records and effects; Shopify fixture reconciliation never repeats an accepted write",
  { skip: !process.env.OPS_TEST_DATABASE_URL, timeout: 90_000 },
  async () => {
    const base = process.env.OPS_TEST_DATABASE_URL!;
    const suffix = randomUUID().replaceAll("-", "");
    const sourceName = `ops_restore_source_${suffix}`;
    const restoredName = `ops_restore_target_${suffix}`;
    const admin = new Pool({
      connectionString: base,
      connectionTimeoutMillis: 10_000,
    });
    const created: string[] = [];
    const pools: Pool[] = [];
    const backupDirectory = await mkdtemp(
      join(tmpdir(), "noorly-restore-test-"),
    );
    const poolFor = (name: string) => {
      const pool = new Pool({
        connectionString: databaseUrl(base, name),
        connectionTimeoutMillis: 10_000,
      });
      pools.push(pool);
      return pool;
    };
    try {
      await executeFile(tool("pg_dump"), ["--version"], {
        windowsHide: true,
        timeout: 10_000,
      });
      await executeFile(tool("pg_restore"), ["--version"], {
        windowsHide: true,
        timeout: 10_000,
      });
      for (const name of [sourceName, restoredName]) {
        await admin.query(`CREATE DATABASE "${name}"`);
        created.push(name);
      }
      const sourcePool = poolFor(sourceName);
      const originalTime = new Date("2026-10-28T10:00:00Z");
      const source = new PostgresOpsStore(sourcePool, {
        clock: () => originalTime,
      });
      const records = new PostgresRecords(sourcePool);
      await source.initialize();
      await records.initialize();
      await source.recordHeartbeat();
      const settled = await source.reserveSpend({
        idempotencyKey: "backup:settled",
        category: "software",
        amountOre: 10_000,
        purpose: "Fixture provider charge",
      });
      await source.settleSpend(settled.id, {
        actualOre: 4_000,
        receiptId: "fixture:provider-receipt",
      });
      const pending = await source.reserveSpend({
        idempotencyKey: "backup:unknown",
        category: "software",
        amountOre: 2_000,
        purpose: "Uncertain fixture charge",
      });
      const job = await source.enqueueJob({
        dedupKey: "fixture:webhook:order-7",
        type: "reconcile",
        payload: { orderId: "gid://shopify/Order/7" },
      });
      const originalLease = (await source.leaseJob(
        "worker-before-backup",
        1000,
      ))!;
      await records.put("shopify-order", "gid://shopify/Order/7", {
        id: "gid://shopify/Order/7",
        amount: "499.00",
        currency: "SEK",
        verifiedFixture: true,
      });
      await records.put("sync", "shopify", {
        at: originalTime.toISOString(),
        cursor: "fixture-cursor",
      });

      const products = new Map<string, ShopifyProductCopy>(
        [1, 2].map((id) => [
          `gid://shopify/Product/${id}`,
          {
            id: `gid://shopify/Product/${id}`,
            title: "Original title",
            descriptionHtml: "<p>Original</p>",
            updatedAt: originalTime.toISOString(),
            status: "ACTIVE",
          },
        ]),
      );
      const mutations = new Map<string, number>();
      let readsAfterRestore = 0;
      let restoring = false;
      const fixtureFetch: typeof fetch = async (_url, init) => {
        const body = JSON.parse(String(init?.body));
        if (body.query.includes("mutation")) {
          const update = body.variables.product as {
            id: string;
            title: string;
          };
          const updated = {
            ...products.get(update.id)!,
            title: update.title,
            updatedAt: "2026-10-28T10:00:01Z",
          };
          mutations.set(update.id, (mutations.get(update.id) ?? 0) + 1);
          products.set(update.id, updated);
          return json({
            data: { productUpdate: { product: updated, userErrors: [] } },
          });
        }
        if (restoring) readsAfterRestore++;
        return json({ data: { product: products.get(body.variables.id) } });
      };
      const shopify = createShopifyAdapter(
        {
          shopDomain: "fixture.myshopify.com",
          adminAccessToken: "fixture-not-a-secret",
        },
        { fetch: fixtureFetch },
      );
      const completedInput: ProductCopyUpdate = {
        actionKey: "restore:copy:1",
        id: "gid://shopify/Product/1",
        expectedUpdatedAt: originalTime.toISOString(),
        title: "Verified fixture title 1",
      };
      const interruptedInput: ProductCopyUpdate = {
        actionKey: "restore:copy:2",
        id: "gid://shopify/Product/2",
        expectedUpdatedAt: originalTime.toISOString(),
        title: "Verified fixture title 2",
      };
      const completeResult = await runEffect(
        records,
        completedInput.actionKey,
        "product-copy",
        completedInput,
        () => shopify.updateProductCopy(completedInput),
      );
      assert.equal(completeResult.status, "succeeded");
      assert.equal(
        (
          await records.claimEffect(
            interruptedInput.actionKey,
            "product-copy",
            fingerprint(interruptedInput),
          )
        ).claimed,
        true,
      );
      assert.equal(
        (await shopify.updateProductCopy(interruptedInput)).status,
        "succeeded",
      );
      // Simulated crash after provider accepted write, before finishEffect persisted it.
      const before = await source.snapshot();
      const auditCount = (await source.readAudit(1000)).length;

      // Exercise the actual application backup command, passing credentials only in env.
      const pathKey =
        Object.keys(process.env).find((key) => key.toLowerCase() === "path") ??
        "PATH";
      const backupEnv = {
        ...process.env,
        DATABASE_URL: databaseUrl(base, sourceName),
        OPS_BACKUP_DIRECTORY: backupDirectory,
        [pathKey]: clientsDirectory
          ? `${clientsDirectory}${delimiter}${process.env[pathKey] ?? ""}`
          : process.env[pathKey],
      };
      await executeFile(
        process.execPath,
        ["--import", "tsx", "scripts/backup.ts"],
        {
          cwd: process.cwd(),
          env: backupEnv,
          windowsHide: true,
          timeout: 30_000,
        },
      );
      const dumps = (await readdir(backupDirectory)).filter((name) =>
        name.endsWith(".dump"),
      );
      assert.equal(dumps.length, 1);
      const dump = join(backupDirectory, dumps[0]);
      assert.ok((await stat(dump)).size > 0);
      await executeFile(
        tool("pg_restore"),
        [
          "--exit-on-error",
          "--no-owner",
          "--no-privileges",
          `--dbname=${restoredName}`,
          dump,
        ],
        {
          env: pgEnvironment(databaseUrl(base, restoredName)),
          windowsHide: true,
          timeout: 30_000,
        },
      );

      const restoredPool = poolFor(restoredName);
      const restored = new PostgresOpsStore(restoredPool, {
        clock: () => originalTime,
      });
      const restoredRecords = new PostgresRecords(restoredPool);
      await restored.initialize();
      await restoredRecords.initialize();
      assert.deepEqual(await restored.snapshot(), before);
      assert.equal((await restored.readAudit(1000)).length, auditCount);
      assert.equal(
        (await restored.snapshot()).reservations[pending.id].status,
        "reserved",
      );
      assert.deepEqual(
        await restoredRecords.get("shopify-order", "gid://shopify/Order/7"),
        await records.get("shopify-order", "gid://shopify/Order/7"),
      );
      assert.deepEqual(
        await restoredRecords.get("sync", "shopify"),
        await records.get("sync", "shopify"),
      );
      assert.deepEqual(
        await restoredRecords.claimEffect(
          completedInput.actionKey,
          "product-copy",
          fingerprint(completedInput),
        ),
        { claimed: false, state: "succeeded", result: completeResult },
      );
      assert.equal(
        (
          await restoredRecords.claimEffect(
            interruptedInput.actionKey,
            "product-copy",
            fingerprint(interruptedInput),
          )
        ).state,
        "pending",
      );

      restoring = true;
      const neverExecute = async (): Promise<never> => {
        assert.fail("Restored effect repeated a provider mutation");
      };
      const reconcile = async () => {
        const current = await shopify.getProduct(interruptedInput.id);
        return current.status === "succeeded" &&
          current.data?.title === interruptedInput.title
          ? current
          : { status: "unknown" as const };
      };
      const replayed = await Promise.all(
        Array.from({ length: 8 }, () =>
          runEffect(
            restoredRecords,
            completedInput.actionKey,
            "product-copy",
            JSON.parse(JSON.stringify(completedInput)),
            neverExecute,
          ),
        ),
      );
      assert.ok(replayed.every((result) => result.status === "succeeded"));
      assert.equal(
        (
          await runEffect(
            restoredRecords,
            interruptedInput.actionKey,
            "product-copy",
            interruptedInput,
            neverExecute,
            reconcile,
          )
        ).status,
        "succeeded",
      );
      assert.ok(
        readsAfterRestore > 0,
        "Interrupted write must be reconciled by provider read",
      );
      assert.deepEqual(
        [...mutations.values()],
        [1, 1],
        "Each fixture effect was submitted exactly once across backup and restore",
      );
      assert.equal(
        (
          await restoredRecords.claimEffect(
            interruptedInput.actionKey,
            "product-copy",
            fingerprint(interruptedInput),
          )
        ).state,
        "succeeded",
      );
      assert.equal(
        (
          await restored.enqueueJob({
            dedupKey: "fixture:webhook:order-7",
            type: "reconcile",
            payload: { orderId: "gid://shopify/Order/7" },
          })
        ).id,
        job.id,
      );
      const recovered = new PostgresOpsStore(restoredPool, {
        clock: () => new Date(originalTime.getTime() + 2000),
      });
      const newLease = (await recovered.leaseJob(
        "worker-after-restore",
        10_000,
      ))!;
      assert.equal(newLease.id, originalLease.id);
      assert.notEqual(newLease.leaseToken, originalLease.leaseToken);
      await assert.rejects(
        recovered.completeJob(job.id, originalLease.leaseToken!, {}),
        /stale/i,
      );
      await recovered.completeJob(job.id, newLease.leaseToken!, {
        reconciledAgainst: "deterministic-shopify-fixture",
      });
      assert.equal(
        (await recovered.snapshot()).reservations[pending.id].status,
        "reserved",
        "Restore/reconciliation cannot release uncertain financial charges",
      );
    } finally {
      await Promise.all(pools.map((pool) => pool.end()));
      try {
        for (const name of created.reverse()) {
          assert.match(name, /^ops_restore_(source|target)_[a-f0-9]{32}$/);
          await admin.query(`DROP DATABASE "${name}"`);
        }
      } finally {
        await admin.end();
        const resolved = resolve(backupDirectory);
        assert.equal(dirname(resolved), resolve(tmpdir()));
        assert.ok(basename(resolved).startsWith("noorly-restore-test-"));
        await rm(resolved, { recursive: true, force: true });
      }
    }
  },
);
