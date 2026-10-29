import test from "node:test";
import assert from "node:assert/strict";
import {
  createOrderReconciler,
  type OrderLifecycle,
} from "../src/order-reconciliation.js";
import type { OrderAccounting } from "../src/adapters/shopify-catalog.js";
import { MemoryOpsStore } from "../src/core/memory.js";
import { MemoryRecords } from "../src/records.js";

async function fixture() {
  const now = new Date("2026-10-28T12:00:00Z"),
    at = now.toISOString(),
    orderId = "gid://shopify/Order/1";
  const store = new MemoryOpsStore({ clock: () => now }),
    records = new MemoryRecords();
  await store.initialize();
  const amount = (value: string) => ({ amount: value, currency: "SEK" });
  const accounting: OrderAccounting = {
    id: orderId,
    name: "#1001",
    test: false,
    updatedAt: at,
    financialStatus: "PAID",
    totalReceived: amount("600.00"),
    totalRefunded: amount("0.00"),
    transactions: [
      {
        id: "gid://shopify/OrderTransaction/1",
        kind: "SALE",
        status: "SUCCESS",
        test: false,
        processedAt: at,
        amount: amount("600.00"),
      },
    ],
    refunds: [],
    lineItems: [
      {
        id: "gid://shopify/LineItem/1",
        productId: "gid://shopify/Product/1",
        variantId: "gid://shopify/ProductVariant/1",
        quantity: 2,
        discountedTotal: amount("400.00"),
      },
      {
        id: "gid://shopify/LineItem/2",
        productId: "gid://shopify/Product/2",
        variantId: "gid://shopify/ProductVariant/2",
        quantity: 1,
        discountedTotal: amount("200.00"),
      },
    ],
  };
  const lifecycle: OrderLifecycle = {
    id: orderId,
    test: false,
    updatedAt: at,
    cancelledAt: null,
    fulfillmentStatus: "UNFULFILLED",
    currentTotal: amount("600.00"),
    shippingCountry: "SE",
    lines: accounting.lineItems.map((l) => ({
      id: l.id,
      currentQuantity: l.quantity,
      unfulfilledQuantity: l.quantity,
      requiresShipping: true,
    })),
    fulfillments: [],
  };
  for (const index of [1, 2])
    await records.put("supplier-binding", `gid://shopify/Product/${index}`, {
      checkedAt: at,
      evidenceRef: `supplier:${index}`,
      variants: [
        {
          variantId: `gid://shopify/ProductVariant/${index}`,
          evidenceId: `gid://shopify/Product/${index}`,
          inventoryItemId: `gid://shopify/InventoryItem/${index}`,
          locationId: "gid://shopify/Location/1",
          sku: `AW-${index}`,
          supplierProductId: `AW-${index}`,
          supplierVariantId: `AW-V${index}`,
        },
      ],
    });
  let unavailable = false;
  const service = createOrderReconciler({
    store,
    records,
    now: () => now,
    readAccounting: async () =>
      unavailable
        ? { status: "unknown", reason: "Lost connection" }
        : { status: "succeeded", data: structuredClone(accounting) },
    readLifecycle: async () => ({
      status: "succeeded",
      data: structuredClone(lifecycle),
    }),
  });
  return {
    now,
    store,
    records,
    accounting,
    lifecycle,
    service,
    orderId,
    failReads: () => {
      unavailable = true;
    },
  };
}

test("a multi-product order imports every exact line and counts the order money once", async () => {
  const f = await fixture();
  const result = await f.service.reconcileOrder(f.orderId);
  assert.equal(result.status, "succeeded");
  assert.equal(result.data?.state, "eligible");
  const state = await f.store.snapshot(),
    obligation = state.obligations[f.orderId]!;
  assert.equal(Object.keys(state.obligations).length, 1);
  assert.equal(obligation.amountPaidOre, 60000);
  assert.equal(obligation.lines?.length, 2);
  assert.equal(obligation.lines?.[0]?.quantity, 2);
  assert.equal(obligation.lines?.[1]?.supplierVariantId, "AW-V2");
  await f.service.reconcileOrder(f.orderId);
  assert.equal(Object.keys((await f.store.snapshot()).jobs).length, 1);
});

test("missing second product supplier mapping holds the entire order", async () => {
  const f = await fixture();
  await f.records.put("supplier-binding", "gid://shopify/Product/2", null);
  const result = await f.service.reconcileOrder(f.orderId);
  assert.equal(result.data?.state, "held");
  assert.match(result.data!.obligation!.holdReason!, /mapping missing/);
  assert.equal(Object.keys((await f.store.snapshot()).jobs).length, 0);
});

test("pending refund and cancellation override a previously eligible obligation", async () => {
  const f = await fixture();
  await f.service.reconcileOrder(f.orderId);
  f.accounting.transactions.push({
    id: "gid://shopify/OrderTransaction/2",
    kind: "REFUND",
    status: "PENDING",
    test: false,
    processedAt: f.now.toISOString(),
    amount: { amount: "100.00", currency: "SEK" },
  });
  const refund = await f.service.reconcileOrder(f.orderId);
  assert.equal(refund.data?.state, "held");
  assert.match(
    (await f.store.snapshot()).obligations[f.orderId]!.holdReason!,
    /Refund activity/,
  );
  f.lifecycle.cancelledAt = f.now.toISOString();
  await f.service.reconcileOrder(f.orderId);
  assert.equal(
    (await f.store.snapshot()).obligations[f.orderId]?.cancelledAt,
    f.now.toISOString(),
  );
});

test("fulfilled or partly fulfilled lines never create a fresh whole-order supplier purchase", async () => {
  const f = await fixture();
  f.lifecycle.fulfillmentStatus = "PARTIALLY_FULFILLED";
  f.lifecycle.lines[0]!.unfulfilledQuantity = 1;
  assert.equal((await f.service.reconcileOrder(f.orderId)).data?.state, "held");
  assert.equal(Object.keys((await f.store.snapshot()).jobs).length, 0);
});

test("test orders, unpaid authorizations, and foreign currency do not become purchase authority", async () => {
  const f = await fixture();
  f.accounting.test = true;
  f.lifecycle.test = true;
  assert.equal(
    (await f.service.reconcileOrder(f.orderId)).data?.state,
    "ignored",
  );
  assert.equal(Object.keys((await f.store.snapshot()).obligations).length, 0);
  f.accounting.test = false;
  f.lifecycle.test = false;
  f.accounting.transactions[0]!.kind = "AUTHORIZATION";
  f.accounting.financialStatus = "AUTHORIZED";
  assert.equal(
    (await f.service.reconcileOrder(f.orderId)).data?.state,
    "ignored",
  );
  f.accounting.totalReceived.currency = "EUR";
  assert.equal((await f.service.reconcileOrder(f.orderId)).status, "unknown");
});

test("inconsistent or failed reads hold an existing obligation instead of leaving stale eligibility", async () => {
  const f = await fixture();
  await f.service.reconcileOrder(f.orderId);
  f.lifecycle.updatedAt = "2026-10-28T11:59:59Z";
  assert.equal((await f.service.reconcileOrder(f.orderId)).status, "unknown");
  assert.match(
    (await f.store.snapshot()).obligations[f.orderId]!.holdReason!,
    /changed between reads/,
  );
  f.lifecycle.updatedAt = f.accounting.updatedAt;
  await f.service.reconcileOrder(f.orderId);
  f.failReads();
  assert.equal((await f.service.reconcileOrder(f.orderId)).status, "unknown");
  assert.match(
    (await f.store.snapshot()).obligations[f.orderId]!.holdReason!,
    /both be read/,
  );
});
