import test from "node:test";
import assert from "node:assert/strict";
import {
  createFulfillmentCoordinator,
  assessRefundEligibility,
  type SupplierFulfillmentPort,
  type SupplierSubmission,
} from "../src/fulfillment-coordinator.js";
import type { ReconciledOrder } from "../src/order-reconciliation.js";
import { MemoryOpsStore } from "../src/core/memory.js";
import { MemoryRecords } from "../src/records.js";
import { LIMITS } from "../src/core/policy.js";
import type { PaidOrderObligation } from "../src/core/types.js";

async function fixture() {
  let now = new Date("2026-10-25T10:00:00Z");
  const store = new MemoryOpsStore({ clock: () => now });
  await store.initialize();
  for (const check of [
    "connectors",
    "budget_reconciliation",
    "webhook_deduplication",
    "recovery",
  ] as const)
    await store.recordReadiness(check, "pass", "fixture");
  await store.recordHeartbeat();
  for (let elapsed = 0; elapsed < LIMITS.observationMs; elapsed += 300000) {
    now = new Date(now.getTime() + 300000);
    await store.recordHeartbeat();
  }
  for (const check of [
    "connectors",
    "budget_reconciliation",
    "webhook_deduplication",
    "recovery",
    "supplier",
    "checkout",
    "tracking_consent",
  ] as const)
    await store.recordReadiness(check, "pass", "fixture");
  await store.setMode("live", "trusted_fixture");
  const orderId = "gid://shopify/Order/1",
    at = now.toISOString();
  const obligation: PaidOrderObligation = {
    orderId,
    productId: "gid://shopify/Product/1",
    paidAt: at,
    amountPaidOre: 20000,
    refundedOre: 0,
    source: "shopify_paid_order",
    sourceRef: "shopify:fixture",
    supplierProductId: "AW-1",
    supplierVariantId: "AW-V1",
    importedAt: at,
    sourceUpdatedAt: at,
    lines: [
      {
        lineItemId: "gid://shopify/LineItem/1",
        productId: "gid://shopify/Product/1",
        variantId: "gid://shopify/ProductVariant/1",
        quantity: 2,
        supplierProductId: "AW-1",
        supplierVariantId: "AW-V1",
      },
    ],
  };
  await store.recordPaidOrder(obligation);
  const facts: ReconciledOrder = {
    orderId,
    sourceUpdatedAt: at,
    observedAt: at,
    sourceRefs: ["shopify:fixture"],
    currency: "SEK",
    receivedOre: 20000,
    refundedOre: 0,
    capturedOre: 20000,
    successfulRefundOre: 0,
    pendingRefundOre: 0,
    state: "eligible",
    holdReasons: [],
    lineCount: 1,
    obligation,
  };
  const records = new MemoryRecords();
  let mode: "native-shopify" | "manual-api" = "manual-api",
    amount = 5000,
    loseResponse = false,
    visible = true,
    submitted: SupplierSubmission | undefined;
  let submits = 0;
  const supplier: SupplierFulfillmentPort = {
    readiness: () => ({
      provider: "fixture",
      mode,
      orderSubmission: "verified",
    }),
    quote: async (input) => ({
      status: "succeeded",
      data: {
        id: "quote-1",
        sourceRef: "supplier:quote-1",
        requestFingerprint: input.requestFingerprint,
        currency: "SEK",
        amountOre: amount,
        shippingCountry: "SE",
        expiresAt: new Date(now.getTime() + 3600000).toISOString(),
      },
    }),
    submit: async (input) => {
      submits++;
      assert.equal(
        (await store.snapshot()).budgets.supplier.usedOre,
        amount,
        "money must be reserved before dispatch",
      );
      submitted = {
        id: "supplier-1",
        orderId,
        actionKey: input.actionKey,
        requestFingerprint: input.quote.requestFingerprint,
        state: "paid",
        chargedOre: amount,
        receiptId: "supplier-receipt-1",
        sourceRef: "supplier:1",
      };
      return loseResponse
        ? { status: "unknown", reason: "Lost acknowledgement" }
        : { status: "succeeded", data: submitted };
    },
    reconcile: async () => ({
      status: "succeeded",
      data: visible ? (submitted ?? null) : null,
    }),
    readTracking: async (externalId) => ({
      status: "succeeded",
      data: {
        externalId,
        state: "shipped",
        observedAt: at,
        sourceRef: "supplier:tracking-1",
        tracking: [{ company: "Carrier", number: "TRACK-1" }],
      },
    }),
  };
  const reconcileOrder = async () => ({
    status: "succeeded" as const,
    data: facts,
  });
  const deps = {
    store,
    records,
    supplier,
    reconcileOrder,
    now: () => now,
    isDemo: () => false,
  };
  const service = createFulfillmentCoordinator(deps);
  return {
    service,
    deps,
    store,
    records,
    facts,
    orderId,
    submits: () => submits,
    setNative: () => {
      mode = "native-shopify";
    },
    setAmount: (n: number) => {
      amount = n;
    },
    lose: () => {
      loseResponse = true;
      visible = false;
    },
    show: () => {
      visible = true;
    },
  };
}

test("supplier cost is reserved before submit and confirmed receipt settles it exactly once", async () => {
  const f = await fixture();
  assert.equal((await f.service.fulfill(f.orderId)).status, "succeeded");
  assert.equal(f.submits(), 1);
  const reservations = Object.values((await f.store.snapshot()).reservations);
  assert.equal(reservations.length, 1);
  assert.equal(reservations[0]!.status, "settled");
  assert.equal((await f.service.fulfill(f.orderId)).status, "succeeded");
  assert.equal(f.submits(), 1);
  assert.equal((await f.service.tracking(f.orderId)).data?.state, "shipped");
  assert.equal(
    (await f.store.snapshot()).orders[f.orderId],
    undefined,
    "tracking cannot infer verified profit",
  );
});

test("unknown supplier response retains capacity and read reconciliation prevents duplicate orders", async () => {
  const f = await fixture();
  f.lose();
  assert.equal((await f.service.fulfill(f.orderId)).status, "unknown");
  assert.equal(
    Object.values((await f.store.snapshot()).reservations)[0]!.status,
    "reserved",
  );
  assert.equal((await f.service.fulfill(f.orderId)).status, "unknown");
  assert.equal(f.submits(), 1);
  f.show();
  assert.equal((await f.service.fulfill(f.orderId)).status, "succeeded");
  assert.equal(f.submits(), 1);
  assert.equal(
    Object.values((await f.store.snapshot()).reservations)[0]!.status,
    "settled",
  );
});

test("native Shopify ownership and insufficient supplier capacity block submission", async () => {
  const native = await fixture();
  native.setNative();
  assert.equal(
    (await native.service.fulfill(native.orderId)).status,
    "rejected",
  );
  assert.equal(native.submits(), 0);
  const capped = await fixture();
  capped.setAmount(200001);
  assert.equal(
    (await capped.service.fulfill(capped.orderId)).status,
    "rejected",
  );
  assert.equal(capped.submits(), 0);
  assert.equal((await capped.store.snapshot()).budgets.supplier.usedOre, 0);
});

test("refund eligibility requires exact authority, remaining captured funds, and no pending refund", async () => {
  const f = await fixture();
  const input = { orderId: f.orderId, requestId: "return-1", amountOre: 5000 };
  assert.equal(
    (await assessRefundEligibility(input, f.deps)).status,
    "rejected",
  );
  await f.records.put("refund-authority", "return-1", {
    ...input,
    sourceUpdatedAt: f.facts.sourceUpdatedAt,
    reason: "approved-return",
    sourceRefs: ["return:1", "supplier:1"],
    supplierResolutionRef: "supplier:1",
    checkedAt: f.deps.now().toISOString(),
  });
  assert.equal(
    (await assessRefundEligibility(input, f.deps)).data?.eligible,
    true,
  );
  f.facts.pendingRefundOre = 1000;
  assert.equal(
    (await assessRefundEligibility(input, f.deps)).status,
    "rejected",
  );
  assert.equal(f.submits(), 0);
});
