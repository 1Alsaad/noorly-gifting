import test from "node:test";
import assert from "node:assert/strict";
import { MemoryOpsStore } from "../src/core/memory.js";
import {
  evaluateLaunch,
  LIMITS,
  PolicyError,
  stockholmMonth,
} from "../src/core/policy.js";
import type { ProductEvidence, VerifiedOrder } from "../src/core/types.js";

function fixture() {
  let now = new Date("2026-10-28T10:00:00Z");
  const store = new MemoryOpsStore({ clock: () => now });
  return {
    store,
    now: () => now,
    advance: (ms: number) => {
      now = new Date(now.getTime() + ms);
    },
    setTime: (s: string) => {
      now = new Date(s);
    },
  };
}
function evidence(now: Date): ProductEvidence {
  return {
    id: "product-1",
    title: "Test product",
    search: {
      country: "SE",
      monthlySearches: 200,
      method: "absolute_volume",
      sourceUrl: "https://ads.google.com/keywords",
      observedAt: now.toISOString(),
      period: "2026-10",
    },
    trends: {
      country: "SE",
      sourceUrl: "https://trends.google.com/trends/",
      observedAt: now.toISOString(),
      seasonalWindow: "Sweden Oct–Dec, 2024–2026",
    },
    marketplace: {
      country: "DE",
      sourceUrl: "https://example.com/product/reviews",
      rating: 4.5,
      reviewCount: 250,
      observedAt: now.toISOString(),
    },
    supplier: {
      productId: "supplier-product",
      variantId: "variant-1",
      quoteId: "quote-1",
      integration: "shopify_direct",
      shippingCountry: "SE",
      sourceUrl: "https://example.com/quote/1",
      observedAt: now.toISOString(),
      deliveryDaysMax: 7,
    },
    pricing: {
      sellingPriceOre: 49900,
      productCostOre: 14000,
      shippingCostOre: 7000,
      paymentFeeOre: 1500,
      adCostAllowanceOre: 7000,
      returnsReprintsAllowanceOre: 2000,
      personalizationLabourOre: 0,
    },
    provenance: {
      actor: "trusted_supplier_connector",
      evidenceRefs: ["quote-1", "keyword-api-record-1", "reviews-1"],
    },
  };
}
async function enable(f: ReturnType<typeof fixture>, commerce = true) {
  for (const check of [
    "connectors",
    "budget_reconciliation",
    "webhook_deduplication",
    "recovery",
    "social",
  ] as const)
    await f.store.recordReadiness(check, "pass", `test:${check}`);
  if (commerce)
    for (const check of ["supplier", "checkout", "tracking_consent"] as const)
      await f.store.recordReadiness(check, "pass", `test:${check}`);
  await observe(f);
  await f.store.recordEvidence(evidence(f.now()));
  await f.store.setMode("live", "trusted_scheduler");
  await f.store.recordPaidOrder({
    orderId: "paid-1",
    productId: "product-1",
    paidAt: f.now().toISOString(),
    amountPaidOre: 250000,
    refundedOre: 0,
    source: "shopify_paid_order",
    sourceRef: "shopify:paid-1",
    supplierProductId: "supplier-product",
    supplierVariantId: "variant-1",
    importedAt: f.now().toISOString(),
  });
}
async function observe(f: ReturnType<typeof fixture>) {
  await f.store.recordHeartbeat();
  for (
    let elapsed = 0;
    elapsed < LIMITS.observationMs;
    elapsed += LIMITS.heartbeatGapMs
  ) {
    f.advance(LIMITS.heartbeatGapMs);
    await f.store.recordHeartbeat();
  }
}
function order(now: Date): VerifiedOrder {
  return {
    id: "order-1",
    source: "shopify_supplier_payment",
    sourceRefs: ["shopify:1", "supplier:1", "payment:1"],
    paidAt: now.toISOString(),
    fulfilledAt: now.toISOString(),
    payoutReceivedAt: now.toISOString(),
    revenueOre: 49900,
    productCostOre: 14000,
    shippingCostOre: 7000,
    paymentFeeOre: 1500,
    adCostOre: 7000,
    refundsOre: 0,
    returnsReprintsOre: 2000,
    personalizationLabourOre: 0,
    verifiedAt: now.toISOString(),
  };
}
const hasCode = (code: string) => (error: unknown) =>
  error instanceof PolicyError && error.code === code;

test("idle observation cannot qualify; passing refreshes preserve continuity while readiness failures restart it", async () => {
  const f = fixture();
  await observe(f);
  for (const check of [
    "connectors",
    "budget_reconciliation",
    "webhook_deduplication",
    "recovery",
  ] as const)
    await f.store.recordReadiness(check, "pass", `test:${check}`);
  await assert.rejects(
    f.store.setMode("live", "trusted_scheduler"),
    hasCode("NOT_READY"),
  );
  await observe(f);
  await f.store.setMode("live", "trusted_scheduler");
  const ready = await f.store.getControl();
  f.advance(1000);
  await f.store.recordReadiness("connectors", "pass", "test:connectors");
  assert.deepEqual(
    await f.store.getControl(),
    ready,
    "Identical evidence import preserves the original verified timestamp and continuity",
  );
  await f.store.recordReadiness(
    "connectors",
    "pass",
    "test:refreshed-successful-proof",
  );
  const refreshed = await f.store.getControl();
  assert.equal(refreshed.mode, "live");
  assert.equal(refreshed.observationStartedAt, ready.observationStartedAt);
  assert.equal(refreshed.lastHeartbeatAt, ready.lastHeartbeatAt);
  assert.equal(
    refreshed.readiness.connectors?.checkedAt,
    ready.readiness.connectors?.checkedAt,
  );
  assert.equal(
    refreshed.readiness.connectors?.evidenceRef,
    "test:refreshed-successful-proof",
  );
  await f.store.recordReadiness(
    "connectors",
    "fail",
    "test:integration-configuration-changed",
  );
  const changed = await f.store.getControl();
  assert.equal(changed.mode, "observe");
  assert.equal(changed.observationStartedAt, f.now().toISOString());
  assert.equal(changed.lastHeartbeatAt, undefined);
  await assert.rejects(
    f.store.setMode("live", "trusted_scheduler"),
    hasCode("NOT_READY"),
  );
  f.advance(1000);
  await f.store.recordReadiness(
    "connectors",
    "pass",
    "test:replacement-credentials-qualified",
  );
  assert.equal(
    (await f.store.getControl()).observationStartedAt,
    f.now().toISOString(),
  );
  await assert.rejects(
    f.store.setMode("live", "trusted_scheduler"),
    hasCode("NOT_READY"),
  );
});

test("50 concurrent reservations cannot exceed the hard monthly software cap", async () => {
  const { store } = fixture();
  const attempts = await Promise.allSettled(
    Array.from({ length: 50 }, (_, i) =>
      store.reserveSpend({
        idempotencyKey: `cash-${i}`,
        category: "software",
        amountOre: 10000,
        purpose: "bounded AI work",
      }),
    ),
  );
  assert.equal(attempts.filter((x) => x.status === "fulfilled").length, 10);
  assert.equal((await store.snapshot()).budgets.software.usedOre, 100000);
  assert.equal(
    (await store.readAudit()).filter((a) => a.event === "spend.reserved")
      .length,
    10,
  );
});
test("concurrent idempotent retry reserves once and rejects altered amounts", async () => {
  const { store } = fixture();
  const request = {
    idempotencyKey: "retry-1",
    category: "software" as const,
    amountOre: 30000,
    purpose: "model request",
  };
  const reservations = await Promise.all(
    Array.from({ length: 20 }, () => store.reserveSpend(request)),
  );
  assert.equal(new Set(reservations.map((r) => r.id)).size, 1);
  assert.equal((await store.snapshot()).budgets.software.usedOre, 30000);
  await assert.rejects(
    store.reserveSpend({ ...request, amountOre: 1 }),
    hasCode("IDEMPOTENCY_CONFLICT"),
  );
});
test("prepaid topup counts cash once and concurrent consumption cannot overdraw", async () => {
  const f = fixture();
  const { store } = f;
  const topup = await store.reserveSpend({
    idempotencyKey: "topup-1",
    category: "software",
    amountOre: 100000,
    purpose: "prepay model",
    kind: "prepaid_topup",
    prepaidAccount: "openai",
  });
  await assert.rejects(
    store.reserveSpend({
      idempotencyKey: "usage-before-payment",
      category: "software",
      amountOre: 1,
      purpose: "AI",
      funding: "prepaid",
      prepaidAccount: "openai",
    }),
    hasCode("PREPAID_EXHAUSTED"),
  );
  await store.settleSpend(topup.id, {
    actualOre: 100000,
    receiptId: "cash-receipt-1",
  });
  const requests = await Promise.allSettled(
    [1, 2].map((i) =>
      store.reserveSpend({
        idempotencyKey: `usage-${i}`,
        category: "software",
        amountOre: 60000,
        purpose: "AI",
        funding: "prepaid",
        prepaidAccount: "openai",
      }),
    ),
  );
  assert.equal(requests.filter((r) => r.status === "fulfilled").length, 1);
  const usage = requests.find((r) => r.status === "fulfilled")!;
  assert.equal(usage.status, "fulfilled");
  if (usage.status === "fulfilled")
    await store.settleSpend(usage.value.id, {
      actualOre: 50000,
      receiptId: "usage-receipt-1",
    });
  assert.equal((await store.snapshot()).prepaidBalances.openai, 50000);
  assert.equal((await store.snapshot()).budgets.software.usedOre, 100000);
  await store.settleSpend(topup.id, {
    actualOre: 100000,
    receiptId: "cash-receipt-1",
  });
  assert.equal((await store.snapshot()).prepaidBalances.openai, 50000);
  f.setTime("2026-11-01T00:00:00Z");
  assert.equal((await store.snapshot()).budgets.software.usedOre, 0);
  await store.reserveSpend({
    idempotencyKey: "november-credit",
    category: "software",
    amountOre: 50000,
    purpose: "AI",
    funding: "prepaid",
    prepaidAccount: "openai",
  });
  assert.equal((await store.snapshot()).budgets.software.usedOre, 0);
});
test("Stockholm month and pending carryover prevent midnight cap bypass", async () => {
  assert.equal(stockholmMonth(new Date("2026-10-31T22:59:59Z")), "2026-10");
  assert.equal(stockholmMonth(new Date("2026-10-31T23:00:00Z")), "2026-11");
  const f = fixture();
  f.setTime("2026-10-31T22:59:00Z");
  const pending = await f.store.reserveSpend({
    idempotencyKey: "late",
    category: "software",
    amountOre: 90000,
    purpose: "running research",
  });
  f.setTime("2026-10-31T23:01:00Z");
  await assert.rejects(
    f.store.reserveSpend({
      idempotencyKey: "new-month",
      category: "software",
      amountOre: 20000,
      purpose: "new work",
    }),
    hasCode("BUDGET_EXCEEDED"),
  );
  await f.store.settleSpend(pending.id, {
    actualOre: 80000,
    receiptId: "late-receipt",
  });
  assert.equal((await f.store.snapshot()).budgets.software.usedOre, 80000);
});
test("settlement cannot exceed reservation or reuse a payment receipt", async () => {
  const { store } = fixture();
  const a = await store.reserveSpend({
    idempotencyKey: "a",
    category: "software",
    amountOre: 100,
    purpose: "AI",
  });
  const b = await store.reserveSpend({
    idempotencyKey: "b",
    category: "software",
    amountOre: 100,
    purpose: "AI",
  });
  await assert.rejects(
    store.settleSpend(a.id, { actualOre: 101, receiptId: "a" }),
    hasCode("RESERVATION_EXCEEDED"),
  );
  await store.settleSpend(a.id, { actualOre: 50, receiptId: "a" });
  await assert.rejects(
    store.settleSpend(b.id, { actualOre: 50, receiptId: "a" }),
    hasCode("DUPLICATE_RECEIPT"),
  );
  await assert.rejects(
    store.releaseSpend(a.id, "cannot undo cash"),
    hasCode("RESERVATION_CLOSED"),
  );
});
test("observation, readiness and explicit runtime promotion are independent gates", async () => {
  const f = fixture();
  await assert.rejects(
    f.store.setMode("live", "trusted_scheduler"),
    hasCode("NOT_READY"),
  );
  f.advance(LIMITS.observationMs + 1);
  assert.equal(
    (await f.store.authorizeAction("publish_social")).allowed,
    false,
  );
  await assert.rejects(
    f.store.setMode("live", "trusted_scheduler"),
    hasCode("NOT_READY"),
  );
  await enable(f, false);
  assert.equal((await f.store.authorizeAction("publish_social")).allowed, true);
  assert.equal(
    (await f.store.authorizeAction("activate_ads", { productId: "product-1" }))
      .allowed,
    false,
  );
  await f.store.recordReadiness("social", "fail", "provider token revoked");
  assert.equal(
    (await f.store.authorizeAction("publish_social")).allowed,
    false,
  );
  await f.store.setMode("paused", "owner");
  assert.equal((await f.store.authorizeAction("research")).allowed, false);
});
test("extra ads require trusted fulfilled paid profitable orders and never exceed maximum", async () => {
  const f = fixture();
  await enable(f);
  await f.store.reserveSpend({
    idempotencyKey: "ads-initial",
    category: "ads",
    amountOre: 50000,
    purpose: "test campaign",
    productId: "product-1",
  });
  await assert.rejects(
    f.store.reserveSpend({
      idempotencyKey: "ads-extra",
      category: "ads",
      amountOre: 1,
      purpose: "scale",
      productId: "product-1",
    }),
    hasCode("BUDGET_EXCEEDED"),
  );
  const unfulfilled = order(f.now());
  delete unfulfilled.fulfilledAt;
  await f.store.recordVerifiedOrder(unfulfilled);
  assert.equal((await f.store.snapshot()).budgets.ads.limitOre, 50000);
  await f.store.recordVerifiedOrder(order(f.now()));
  // A positive single-order margin does not hide 500 SEK spent on all experiments.
  assert.equal((await f.store.snapshot()).budgets.ads.profitQualified, false);
  await f.store.recordVerifiedOrder({ ...order(f.now()), revenueOre: 150000 });
  await f.store.reserveSpend({
    idempotencyKey: "ads-scale",
    category: "ads",
    amountOre: 50000,
    purpose: "scale",
    productId: "product-1",
  });
  await assert.rejects(
    f.store.reserveSpend({
      idempotencyKey: "ads-over",
      category: "ads",
      amountOre: 1,
      purpose: "scale",
      productId: "product-1",
    }),
    hasCode("BUDGET_EXCEEDED"),
  );
  await f.store.recordVerifiedOrder({ ...order(f.now()), refundsOre: 49900 });
  assert.equal((await f.store.snapshot()).budgets.ads.profitQualified, false);
});
test("observation measures healthy heartbeat continuity rather than elapsed calendar time", async () => {
  const f = fixture();
  await f.store.recordHeartbeat();
  f.advance(LIMITS.observationMs);
  for (const check of [
    "connectors",
    "budget_reconciliation",
    "webhook_deduplication",
    "recovery",
  ] as const)
    await f.store.recordReadiness(check, "pass", `test:${check}`);
  await assert.rejects(
    f.store.setMode("live", "trusted_scheduler"),
    hasCode("NOT_READY"),
  );
  const restarted = await f.store.recordHeartbeat();
  assert.equal(restarted.observationStartedAt, f.now().toISOString());
  await assert.rejects(
    f.store.setMode("live", "trusted_scheduler"),
    hasCode("NOT_READY"),
  );
  await observe(f);
  await f.store.setMode("live", "trusted_scheduler");
  f.advance(LIMITS.heartbeatGapMs + 1);
  assert.equal((await f.store.authorizeAction("send_support")).allowed, false);
  assert.equal((await f.store.recordHeartbeat()).mode, "observe");
  await assert.rejects(
    f.store.setMode("live", "trusted_scheduler"),
    hasCode("NOT_READY"),
  );
  await observe(f);
  await f.store.setMode("live", "trusted_scheduler");
  await f.store.setMode("paused", "owner");
  await assert.rejects(
    f.store.setMode("live", "trusted_scheduler"),
    hasCode("NOT_READY"),
  );
  await f.store.setMode("observe", "owner");
  await assert.rejects(
    f.store.setMode("live", "trusted_scheduler"),
    hasCode("NOT_READY"),
  );
});
test("supplier float revolves only after confirmed recovery, not fulfillment or month rollover", async () => {
  const f = fixture();
  await enable(f);
  const r = await f.store.reserveSpend({
    idempotencyKey: "supplier-1",
    category: "supplier",
    amountOre: 200000,
    purpose: "customer orders",
    productId: "product-1",
    orderId: "paid-1",
  });
  await assert.rejects(
    f.store.recoverSupplierFloat({ receiptId: "premature", amountOre: 1 }),
    hasCode("RECOVERY_EXCEEDED"),
  );
  await f.store.settleSpend(r.id, {
    actualOre: 150000,
    receiptId: "supplier-charge",
  });
  await f.store.recoverSupplierFloat({
    receiptId: "received-payout",
    amountOre: 50000,
  });
  await f.store.recoverSupplierFloat({
    receiptId: "received-payout",
    amountOre: 50000,
  });
  assert.equal((await f.store.snapshot()).budgets.supplier.usedOre, 100000);
  await assert.rejects(
    f.store.recoverSupplierFloat({ receiptId: "excess", amountOre: 100001 }),
    hasCode("RECOVERY_EXCEEDED"),
  );
  f.setTime("2026-11-01T10:00:00Z");
  assert.equal((await f.store.snapshot()).budgets.supplier.usedOre, 100000);
});
test("paid order fulfillment survives missing research and routine invoice-proof refresh", async () => {
  const f = fixture();
  await enable(f, false);
  await f.store.recordReadiness(
    "supplier",
    "pass",
    "supplier-current-api-check",
  );
  await f.store.recordPaidOrder({
    orderId: "existing-order",
    productId: "existing-product-no-research",
    paidAt: f.now().toISOString(),
    amountPaidOre: 100000,
    refundedOre: 0,
    source: "shopify_paid_order",
    sourceRef: "shopify:existing-order",
    supplierProductId: "supplier-product",
    supplierVariantId: "variant-1",
    importedAt: f.now().toISOString(),
  });
  const qualifiedStart = (await f.store.getControl()).observationStartedAt;
  await f.store.recordReadiness(
    "budget_reconciliation",
    "pass",
    "provider:new-final-invoice-proof",
  );
  assert.equal(
    (await f.store.getControl()).observationStartedAt,
    qualifiedStart,
  );
  assert.equal((await f.store.getControl()).mode, "live");
  assert.equal(
    (
      await f.store.authorizeAction("fulfill_order", {
        productId: "existing-product-no-research",
        orderId: "existing-order",
      })
    ).allowed,
    true,
  );
  const reserved = await f.store.reserveSpend({
    idempotencyKey: "fulfill-existing",
    category: "supplier",
    amountOre: 20000,
    purpose: "existing paid order",
    productId: "existing-product-no-research",
    orderId: "existing-order",
  });
  assert.equal(reserved.status, "reserved");
  assert.equal(
    (
      await f.store.authorizeAction("fulfill_order", {
        orderId: "invented-order",
      })
    ).allowed,
    false,
  );
  assert.equal(
    (
      await f.store.authorizeAction("fulfill_order", {
        productId: "wrong-product",
        orderId: "existing-order",
      })
    ).allowed,
    false,
  );
  await f.store.recordReadiness("supplier", "fail", "supplier-outage");
  assert.equal(
    (
      await f.store.authorizeAction("fulfill_order", {
        orderId: "existing-order",
      })
    ).allowed,
    false,
  );
});
test("launch requires absolute Sweden demand, exact supplier costs and sourced evidence", () => {
  const now = new Date("2026-10-28T10:00:00Z");
  const valid = evidence(now);
  assert.equal(evaluateLaunch(valid, now).allowed, true);
  assert.equal(
    evaluateLaunch(
      { ...valid, search: { ...valid.search, method: "relative_trends" } },
      now,
    ).allowed,
    false,
  );
  assert.equal(
    evaluateLaunch(
      { ...valid, search: { ...valid.search, country: "US" } },
      now,
    ).allowed,
    false,
  );
  assert.equal(
    evaluateLaunch(
      { ...valid, supplier: { ...valid.supplier, shippingCountry: "DE" } },
      now,
    ).allowed,
    false,
  );
  assert.equal(
    evaluateLaunch(
      { ...valid, pricing: { ...valid.pricing, shippingCostOre: 99999 } },
      now,
    ).allowed,
    false,
  );
  assert.equal(
    evaluateLaunch(
      { ...valid, marketplace: { ...valid.marketplace, rating: NaN } },
      now,
    ).allowed,
    false,
  );
  const missingCost = structuredClone(valid) as unknown as {
    pricing: Record<string, number>;
  };
  delete missingCost.pricing.paymentFeeOre;
  missingCost.pricing.unrelated = 0;
  assert.equal(
    evaluateLaunch(missingCost as unknown as ProductEvidence, now).allowed,
    false,
  );
  assert.equal(
    evaluateLaunch(valid, new Date("2026-11-10T10:00:00Z")).allowed,
    false,
  );
});
test("multi-line paid orders require complete mappings and newer imports cannot reopen completed orders", async () => {
  const f = fixture();
  await enable(f);
  const original = (await f.store.snapshot()).obligations["paid-1"];
  const lines = [
    {
      lineItemId: "line-1",
      productId: "product-1",
      variantId: "variant-1",
      quantity: 2,
      supplierProductId: "supplier-1",
      supplierVariantId: "supplier-variant-1",
    },
    {
      lineItemId: "line-2",
      productId: "product-2",
      variantId: "variant-2",
      quantity: 1,
      supplierProductId: "supplier-2",
      supplierVariantId: "supplier-variant-2",
    },
  ];
  await f.store.recordPaidOrder({
    ...original,
    lines,
    sourceUpdatedAt: f.now().toISOString(),
  });
  assert.equal(
    (
      await f.store.authorizeAction("fulfill_order", {
        orderId: original.orderId,
        productId: "product-2",
      })
    ).allowed,
    true,
  );
  assert.equal(
    (
      await f.store.authorizeAction("fulfill_order", {
        orderId: original.orderId,
        productId: "unknown-product",
      })
    ).allowed,
    false,
  );
  const oldVersion = f.now().toISOString();
  f.advance(1000);
  await f.store.recordPaidOrder({
    ...original,
    lines: lines.map((line) => ({ ...line, supplierVariantId: "" })),
    sourceUpdatedAt: f.now().toISOString(),
    holdReason: "Supplier variant mapping changed",
  });
  assert.equal(
    (
      await f.store.authorizeAction("fulfill_order", {
        orderId: original.orderId,
      })
    ).allowed,
    false,
  );
  await f.store.recordPaidOrder({
    ...original,
    lines,
    sourceUpdatedAt: oldVersion,
  });
  assert.equal(
    (
      await f.store.authorizeAction("fulfill_order", {
        orderId: original.orderId,
      })
    ).allowed,
    false,
  );
  f.advance(1000);
  await f.store.recordPaidOrder({
    ...original,
    lines,
    sourceUpdatedAt: f.now().toISOString(),
    fulfilledAt: f.now().toISOString(),
  });
  f.advance(1000);
  await f.store.recordPaidOrder({
    ...original,
    lines,
    sourceUpdatedAt: f.now().toISOString(),
  });
  assert.equal(
    (
      await f.store.authorizeAction("fulfill_order", {
        orderId: original.orderId,
      })
    ).allowed,
    false,
  );
  await assert.rejects(
    f.store.recordPaidOrder({ ...original, lines: [lines[0], lines[0]] }),
    hasCode("INVALID_ORDER_LINES"),
  );
});
test("job deduplication, single-owner leases, retry and stale worker fencing", async () => {
  const f = fixture();
  const [a, b] = await Promise.all(
    [1, 2].map(() =>
      f.store.enqueueJob({
        dedupKey: "webhook-1",
        type: "order.sync",
        payload: { id: 1 },
        maxAttempts: 2,
      }),
    ),
  );
  assert.equal(a.id, b.id);
  const leases = await Promise.all(
    ["worker-a", "worker-b"].map((w) => f.store.leaseJob(w, 1000)),
  );
  assert.equal(leases.filter(Boolean).length, 1);
  const first = leases.find(Boolean)!;
  f.advance(1001);
  const second = await f.store.leaseJob("worker-c", 1000);
  assert.ok(second);
  assert.notEqual(first.leaseToken, second.leaseToken);
  await assert.rejects(
    f.store.completeJob(first.id, first.leaseToken!, { ok: true }),
    hasCode("STALE_LEASE"),
  );
  await f.store.failJob(
    second.id,
    second.leaseToken!,
    "temporary upstream failure",
    1000,
  );
  assert.equal((await f.store.snapshot()).jobs[a.id].state, "dead");
  assert.equal(await f.store.leaseJob("worker-d", 1000), null);
});
test("retry waits until available and completion is fenced by heartbeat ownership", async () => {
  const f = fixture();
  const job = await f.store.enqueueJob({
    dedupKey: "job",
    type: "sync",
    payload: {},
  });
  const leased = (await f.store.leaseJob("worker", 1000))!;
  await f.store.failJob(job.id, leased.leaseToken!, "retry", 5000);
  assert.equal(await f.store.leaseJob("worker", 1000), null);
  f.advance(5000);
  const retry = (await f.store.leaseJob("worker", 1000))!;
  await f.store.heartbeatJob(retry.id, retry.leaseToken!, 10000);
  f.advance(5000);
  await f.store.completeJob(retry.id, retry.leaseToken!, { completed: true });
  assert.equal((await f.store.snapshot()).jobs[job.id].state, "completed");
});
