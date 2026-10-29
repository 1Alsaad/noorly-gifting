import { MemoryOpsStore } from "../src/core/memory.js";
import { MemoryRecords } from "../src/records.js";
import { BASE_READINESS, LIMITS } from "../src/core/policy.js";
import type { ProductEvidence } from "../src/core/types.js";
import type { RuntimeDependencies } from "../src/runtime.js";

export function runtimeFixture(start = "2026-10-28T10:00:00Z") {
  let now = new Date(start);
  const store = new MemoryOpsStore({ clock: () => now });
  const records = new MemoryRecords();
  const deps: RuntimeDependencies = {
    store,
    records,
    env: {},
    isDemo: false,
    reconcileOrder: async () => ({ status: "succeeded" }),
  };
  return {
    store,
    records,
    deps,
    now: () => now,
    advance: (ms: number) => {
      now = new Date(now.getTime() + ms);
    },
    set: (at: string) => {
      now = new Date(at);
    },
  };
}
export async function observe(f: ReturnType<typeof runtimeFixture>) {
  for (const check of [
    ...BASE_READINESS,
    "social",
    "supplier",
    "checkout",
    "tracking_consent",
  ] as const)
    await f.store.recordReadiness(check, "pass", `verified:${check}`);
  await f.store.recordHeartbeat();
  for (let elapsed = 0; elapsed < LIMITS.observationMs; elapsed += 900000) {
    f.advance(900000);
    await f.store.recordHeartbeat();
  }
}
export function productEvidence(now: Date): ProductEvidence {
  const at = now.toISOString();
  return {
    id: "gid://shopify/Product/1",
    title: "Verified product",
    search: {
      country: "SE",
      method: "absolute_volume",
      monthlySearches: 200,
      period: "2026-10",
      sourceUrl: "https://example.com/keywords",
      observedAt: at,
    },
    trends: {
      country: "SE",
      sourceUrl: "https://trends.google.com/",
      observedAt: at,
      seasonalWindow: "Sweden October 2024–2026",
    },
    marketplace: {
      country: "SE",
      sourceUrl: "https://example.com/reviews",
      rating: 4.5,
      reviewCount: 200,
      observedAt: at,
    },
    supplier: {
      productId: "s1",
      variantId: "v1",
      quoteId: "q1",
      integration: "shopify_direct",
      shippingCountry: "SE",
      sourceUrl: "https://example.com/quote",
      observedAt: at,
      deliveryDaysMax: 7,
    },
    pricing: {
      sellingPriceOre: 39900,
      productCostOre: 10000,
      shippingCostOre: 5000,
      paymentFeeOre: 1000,
      adCostAllowanceOre: 5000,
      returnsReprintsAllowanceOre: 1000,
      personalizationLabourOre: 0,
    },
    provenance: {
      actor: "trusted-test-verifier",
      evidenceRefs: ["verified:source"],
    },
  };
}
