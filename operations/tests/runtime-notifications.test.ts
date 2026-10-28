import test from "node:test";
import assert from "node:assert/strict";
import { MemoryRecords } from "../src/records.js";
import { notifyOwner, OWNER_DAILY_EMAIL_CAP } from "../src/notifications.js";
import { safeText, redactOperationalData } from "../src/redaction.js";

const env = {
  RESEND_API_KEY: "resend-test-key",
  RESEND_FROM_EMAIL: "Noorly <ops@example.com>",
  OPS_OWNER_EMAIL: "owner@example.com",
  RESEND_FREE_PLAN_CONFIRMED: "true",
};
const notice = {
  key: "one-change",
  subject: "Noorly needs attention",
  text: "An order requires supplier reconciliation.",
};
test("missing credentials, unconfirmed free plan and demo never send email", async () => {
  const records = new MemoryRecords();
  let calls = 0;
  const send = async () => {
    calls++;
    return { status: "succeeded" as const, data: { id: "sent" } };
  };
  assert.equal(
    (await notifyOwner(records, notice, { env: {}, send })).status,
    "disabled",
  );
  assert.equal(
    (
      await notifyOwner(records, notice, {
        env: { ...env, RESEND_FREE_PLAN_CONFIRMED: "false" },
        send,
      })
    ).status,
    "disabled",
  );
  assert.equal(
    (await notifyOwner(records, notice, { env, isDemo: true, send })).status,
    "disabled",
  );
  assert.equal(calls, 0);
});
test("owner notifications deduplicate across callers and never retry unknown sends", async () => {
  const records = new MemoryRecords();
  let calls = 0;
  const send = async () => {
    calls++;
    return { status: "unknown" as const };
  };
  await Promise.all(
    Array.from({ length: 10 }, () =>
      notifyOwner(records, notice, { env, send }),
    ),
  );
  assert.equal(calls, 1);
  assert.equal(
    (await notifyOwner(records, notice, { env, send })).status,
    "unknown",
  );
  assert.equal(calls, 1);
});
test("attempts consume the five-per-Stockholm-day cap and reset on the next date", async () => {
  const records = new MemoryRecords();
  let calls = 0;
  const send = async () => {
    calls++;
    return {
      status: "succeeded" as const,
      externalId: `mail-${calls}`,
      data: { id: `mail-${calls}` },
    };
  };
  const now = new Date("2026-10-28T10:00:00Z");
  for (let i = 0; i < OWNER_DAILY_EMAIL_CAP; i++)
    assert.equal(
      (
        await notifyOwner(
          records,
          { ...notice, key: `change-${i}` },
          { env, now, send },
        )
      ).status,
      "succeeded",
    );
  assert.equal(
    (
      await notifyOwner(
        records,
        { ...notice, key: "later" },
        { env, now, send },
      )
    ).status,
    "daily_cap",
  );
  assert.equal(
    (
      await notifyOwner(
        records,
        { ...notice, key: "later" },
        { env, now: new Date("2026-10-28T23:01:00Z"), send },
      )
    ).status,
    "succeeded",
  );
  assert.equal(calls, OWNER_DAILY_EMAIL_CAP + 1);
});
test("notification body and operational output remove known keys and URL credentials", async () => {
  const records = new MemoryRecords();
  let sent = "";
  await notifyOwner(
    records,
    {
      ...notice,
      text: `Failed: ${env.RESEND_API_KEY} https://user:pass@example.com/path?token=secret#private`,
    },
    {
      env,
      send: async (message) => {
        sent = message.text;
        return { status: "succeeded", data: { id: "mail" } };
      },
    },
  );
  assert(!sent.includes(env.RESEND_API_KEY));
  assert(!sent.includes("user:pass"));
  assert(!sent.includes("token=secret"));
  assert.equal(
    redactOperationalData({
      apiKey: "hidden",
      nested: { leaseToken: "hidden" },
    }).apiKey,
    "[redacted]",
  );
  assert(
    !safeText("postgres://username:password@host/db").includes("password"),
  );
});
