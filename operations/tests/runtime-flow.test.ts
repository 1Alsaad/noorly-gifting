import test from "node:test";
import assert from "node:assert/strict";
import { tick, issue } from "../src/runtime.js";
import { BASE_READINESS, LIMITS } from "../src/core/policy.js";
import { runtimeFixture, observe } from "./runtime-fixtures.js";
import { createShopifyAdapter } from "../src/adapters/shopify.js";

test("elapsed idle time with readiness passes cannot auto-enable live mode", async () => {
  const f = runtimeFixture();
  for (const check of BASE_READINESS)
    await f.store.recordReadiness(check, "pass", `test:${check}`);
  f.advance(LIMITS.observationMs);
  await tick(undefined, f.now(), f.deps);
  assert.equal((await f.store.getControl()).mode, "observe");
  assert.equal(
    (await f.store.getControl()).observationStartedAt,
    f.now().toISOString(),
  );
});
test("actual continuous heartbeat plus all baseline checks auto-promotes; demo does not", async () => {
  const f = runtimeFixture();
  await observe(f);
  await tick(undefined, f.now(), f.deps);
  assert.equal((await f.store.getControl()).mode, "live");
  const demo = runtimeFixture();
  await observe(demo);
  await tick(undefined, demo.now(), { ...demo.deps, isDemo: true });
  assert.equal((await demo.store.getControl()).mode, "observe");
});
test("missing baseline verification, pause and missed heartbeats prevent promotion", async () => {
  const f = runtimeFixture();
  await observe(f);
  await f.store.recordReadiness("recovery", "fail", "test:recovery-failed");
  await tick(undefined, f.now(), f.deps);
  assert.equal((await f.store.getControl()).mode, "observe");
  await f.store.recordReadiness("recovery", "pass", "test:recovery");
  f.advance(LIMITS.heartbeatGapMs + 1);
  await tick(undefined, f.now(), f.deps);
  assert.equal((await f.store.getControl()).mode, "observe");
  await f.store.setMode("paused", "owner");
  const previous = (await f.store.getControl()).lastHeartbeatAt;
  f.advance(900000);
  assert.equal((await tick(undefined, f.now(), f.deps)).status, "paused");
  assert.equal((await f.store.getControl()).lastHeartbeatAt, previous);
});
test("durable department handoff is recorded as acceptance and never submitted twice", async () => {
  const f = runtimeFixture();
  let calls = 0;
  const deps = { ...f.deps, env: { AI_GATEWAY_API_KEY: "test-key" } };
  const dispatch = async () => {
    calls++;
    return { id: "durable-delivery" };
  };
  await tick(dispatch, f.now(), deps);
  await tick(dispatch, f.now(), deps);
  assert.equal(calls, 1);
  const job = Object.values((await f.store.snapshot()).jobs).find(
    (j) => j.type === "department",
  )!;
  assert.equal(job.state, "completed");
  assert.deepEqual(job.result, {
    status: "succeeded",
    data: { status: "accepted", receipt: { id: "durable-delivery" } },
  });
});
test("lost department acknowledgement is held for reconciliation after restart", async () => {
  const f = runtimeFixture();
  let calls = 0;
  const deps = { ...f.deps, env: { AI_GATEWAY_API_KEY: "test-key" } };
  const dispatch = async () => {
    calls++;
    throw Error("Lost acknowledgement");
  };
  await tick(dispatch, f.now(), deps);
  f.advance(3600000);
  await tick(dispatch, f.now(), { ...deps });
  assert.equal(calls, 1);
  const job = Object.values((await f.store.snapshot()).jobs).find(
    (j) => j.type === "department",
  )!;
  assert.equal(job.state, "queued");
  assert.equal((await f.records.list("issue")).length > 0, true);
});
test("blocked work stays retryable and issue details cannot retain deployment secrets", async () => {
  const f = runtimeFixture();
  await tick(undefined, f.now(), f.deps);
  const jobs = Object.values((await f.store.snapshot()).jobs);
  assert(jobs.every((j) => j.state === "queued"));
  const secret = "sensitive-test-key-value";
  await issue("problem", `Provider ${secret} unavailable`, {
    ...f.deps,
    env: { API_TOKEN: secret },
  });
  assert(!JSON.stringify(await f.records.list("issue")).includes(secret));
  assert(!JSON.stringify(await f.store.readAudit()).includes(secret));
});
test("webhook reconciliation fetches exact refunded order rather than only paid orders", async () => {
  const f = runtimeFixture();
  let exact = "";
  let scans = 0;
  const shopify = {
    ...createShopifyAdapter({}),
    readiness: () => ({ ready: true, missing: [], limitations: [] }),
    listPaidOrders: async () => {
      scans++;
      return {
        status: "succeeded" as const,
        data: { items: [], hasNextPage: false, endCursor: null },
      };
    },
  };
  await f.store.enqueueJob({
    dedupKey: "refund:1",
    type: "reconcile",
    payload: { orderId: "gid://shopify/Order/123" },
  });
  await tick(undefined, f.now(), {
    ...f.deps,
    shopify,
    reconcileOrder: async (id) => {
      exact = id;
      return { status: "succeeded" };
    },
  });
  assert.equal(exact, "gid://shopify/Order/123");
  assert.equal(scans, 1); // separate routine sync
});
test("concurrent scheduler calls leave one worker owning the tick", async () => {
  const f = runtimeFixture();
  let release!: () => void;
  const held = f.records.withLock(
    "runtime:tick",
    () =>
      new Promise<void>((resolve) => {
        release = resolve;
      }),
  );
  assert.equal((await tick(undefined, f.now(), f.deps)).status, "busy");
  release();
  await held;
});
