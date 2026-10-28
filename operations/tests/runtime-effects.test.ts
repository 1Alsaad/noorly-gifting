import test from "node:test";
import assert from "node:assert/strict";
import { MemoryRecords } from "../src/records.js";
import { fingerprint, runEffect } from "../src/effects.js";

test("effect identity survives PostgreSQL jsonb object key reordering", () => {
  assert.equal(
    fingerprint({ b: [{ z: 2, a: 1 }], a: 3 }),
    fingerprint({ a: 3, b: [{ a: 1, z: 2 }] }),
  );
  assert.notEqual(fingerprint({ a: [1, 2] }), fingerprint({ a: [2, 1] }));
});
test("concurrent attempts submit an external action only once", async () => {
  const records = new MemoryRecords();
  let submissions = 0;
  await Promise.all(
    Array.from({ length: 20 }, () =>
      runEffect(records, "shared", "write", { sku: "A" }, async () => {
        submissions++;
        return { status: "succeeded", externalId: "confirmed" };
      }),
    ),
  );
  assert.equal(submissions, 1);
  const replay = await runEffect(
    records,
    "shared",
    "write",
    { sku: "A" },
    async () => {
      throw Error("Must not resubmit");
    },
  );
  assert.equal(replay.externalId, "confirmed");
});
test("interrupted and pending submissions survive restart without another write", async () => {
  const records = new MemoryRecords();
  let submits = 0;
  assert.equal(
    (
      await runEffect(records, "lost", "write", { a: 1, b: 2 }, async () => {
        submits++;
        throw Error("Connection lost");
      })
    ).status,
    "unknown",
  );
  // A new caller sees persisted records, including JSONB's reordered payload.
  assert.equal(
    (
      await runEffect(
        records,
        "lost",
        "write",
        { b: 2, a: 1 },
        async () => {
          submits++;
          return { status: "succeeded" };
        },
        async () => {
          throw Error("Read unavailable");
        },
      )
    ).status,
    "unknown",
  );
  const recovered = await runEffect(
    records,
    "lost",
    "write",
    { a: 1, b: 2 },
    async () => {
      submits++;
      return { status: "succeeded" };
    },
    async () => ({ status: "succeeded", externalId: "existing" }),
  );
  assert.equal(recovered.externalId, "existing");
  assert.equal(submits, 1);
  await records.claimEffect(
    "crash-before-send",
    "write",
    fingerprint({ a: 1 }),
  );
  assert.equal(
    (
      await runEffect(
        records,
        "crash-before-send",
        "write",
        { a: 1 },
        async () => {
          throw Error("Unexpected write");
        },
      )
    ).status,
    "unknown",
  );
});
test("changed payload cannot reuse an external action key", async () => {
  const records = new MemoryRecords();
  await runEffect(records, "same", "write", { sku: "A" }, async () => ({
    status: "succeeded",
  }));
  await assert.rejects(
    () =>
      runEffect(records, "same", "write", { sku: "B" }, async () => ({
        status: "succeeded",
      })),
    /different payload/,
  );
});
test("record lock prevents competing owners and releases after failure", async () => {
  const records = new MemoryRecords();
  let release!: () => void;
  const holding = records.withLock(
    "queue",
    () =>
      new Promise<void>((resolve) => {
        release = resolve;
      }),
  );
  assert.equal((await records.withLock("queue", async () => {})).locked, false);
  release();
  await holding;
  await assert.rejects(() =>
    records.withLock("queue", async () => {
      throw Error("failure");
    }),
  );
  assert.equal((await records.withLock("queue", async () => 42)).result, 42);
});
