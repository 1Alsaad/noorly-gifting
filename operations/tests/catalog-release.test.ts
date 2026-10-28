import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { verifyAssetBytes } from "../src/assets.js";
import {
  createCatalogReleaseService,
  type CatalogRelease,
} from "../src/catalog-release.js";
import {
  createShopifyCatalogAdapter,
  type CatalogProduct,
} from "../src/adapters/shopify-catalog.js";
import { MemoryRecords } from "../src/records.js";
import { MemoryOpsStore } from "../src/core/memory.js";
import { fingerprint } from "../src/effects.js";
import type { ProductEvidence } from "../src/core/types.js";

async function fixture(live = true) {
  let current = new Date("2026-10-25T10:00:00Z");
  const store = new MemoryOpsStore({ clock: () => current });
  await store.initialize();
  for (const check of [
    "connectors",
    "budget_reconciliation",
    "webhook_deduplication",
    "recovery",
  ] as const)
    await store.recordReadiness(check, "pass", "fixture");
  await store.recordHeartbeat();
  for (let elapsed = 0; elapsed < 72 * 3600000; elapsed += 300000) {
    current = new Date(current.getTime() + 300000);
    await store.recordHeartbeat();
  }
  current = new Date("2026-10-28T10:01:00Z");
  const at = current.toISOString();
  await store.recordHeartbeat();
  const id = "gid://shopify/Product/1",
    variantId = "gid://shopify/ProductVariant/2",
    oldId = "gid://shopify/Product/9";
  const evidence: ProductEvidence = {
    id,
    title: "Ljussand",
    search: {
      country: "SE",
      monthlySearches: 200,
      method: "absolute_volume",
      sourceUrl: "https://ads.google.com/",
      observedAt: at,
      period: "2026-10",
    },
    trends: {
      country: "SE",
      sourceUrl: "https://trends.google.com/",
      observedAt: at,
      seasonalWindow: "Oct-Dec",
    },
    marketplace: {
      country: "DE",
      sourceUrl: "https://example.com/reviews",
      rating: 4.5,
      reviewCount: 200,
      observedAt: at,
    },
    supplier: {
      productId: "AW-1",
      variantId: "AW-V1",
      quoteId: "quote-1",
      integration: "shopify_direct",
      shippingCountry: "SE",
      sourceUrl: "https://example.com/quote",
      observedAt: at,
      deliveryDaysMax: 7,
    },
    pricing: {
      sellingPriceOre: 49900,
      productCostOre: 10000,
      shippingCostOre: 5000,
      paymentFeeOre: 1000,
      adCostAllowanceOre: 5000,
      returnsReprintsAllowanceOre: 1000,
      personalizationLabourOre: 0,
    },
    provenance: { actor: "fixture-verifier", evidenceRefs: ["fixture"] },
  };
  await store.recordEvidence(evidence);
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
  if (live) await store.setMode("live", "trusted_test");
  const tr = { sv: "Verifierad text", en: "Verified text" };
  const input: CatalogRelease = {
    releaseId: "release-1",
    expectedVersion: 0,
    catalog: {
      schemaVersion: 1,
      version: 1,
      publishedAt: at,
      products: [
        {
          id,
          handle: "ljussand",
          title: tr,
          description: tr,
          included: tr,
          delivery: tr,
          availability: "in_stock",
          category: "signature",
          variants: [{ id: variantId, sku: "AW-V1" }],
        },
      ],
    },
    publicationId: "gid://shopify/Publication/7",
    products: [
      {
        productId: id,
        expectedUpdatedAt: at,
        variants: [{ id: variantId, expectedPrice: "399.00", price: "499.00" }],
      },
    ],
    retireProductIds: [oldId],
  };
  input.expectedVersion = 1;
  input.catalog.version = 2;
  const imageBytes = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6ZQAAAABJRU5ErkJggg==",
    "base64",
  );
  const records = new MemoryRecords(),
    hash = createHash("sha256").update(imageBytes).digest("hex"),
    url = "https://cdn.shopify.com/s/files/1/0000/fixture-candle.png?v=1";
  assert.equal(
    url.includes(hash),
    false,
    "ordinary Shopify URLs do not need a hash in the filename",
  );
  await records.put("catalog", "active", {
    ...input.catalog,
    version: 1,
    products: [{ ...input.catalog.products[0], id: oldId, handle: "old" }],
  });
  await records.put("catalog-qualification", fingerprint(input), {
    releaseHash: fingerprint(input),
    checkedAt: at,
    policyEvidenceRef: "fixture",
    policyHash: "policy-v1",
  });
  await records.put("storefront-policy", "current", {
    hash: "policy-v1",
    checkedAt: at,
    shippingCountry: "SE",
    deliveryClaimsVerified: true,
    returnsPublished: true,
    privacyConsentVerified: true,
    checkoutVerified: true,
    evidenceRefs: ["fixture"],
  });
  await records.put("supplier-binding", id, {
    checkedAt: at,
    evidenceRef: "fixture",
    variants: [
      {
        variantId,
        evidenceId: id,
        inventoryItemId: "gid://shopify/InventoryItem/3",
        locationId: "gid://shopify/Location/4",
        sku: "AW-V1",
        supplierProductId: "AW-1",
        supplierVariantId: "AW-V1",
      },
    ],
  });
  await records.put("catalog-assets", id, {
    checkedAt: at,
    evidenceRef: "fixture",
    shopifyMediaIds: ["gid://shopify/MediaImage/8"],
    urls: [url],
  });
  await records.put("asset-review", fingerprint(url), {
    sha256: hash,
    reviewedAt: at,
    authorizedPhotography: true,
    factualClaims: true,
  });
  const products: Record<string, CatalogProduct> = {
    [id]: {
      id,
      handle: "ljussand",
      title: "Ljussand",
      descriptionHtml: "<p>Text</p>",
      status: "DRAFT",
      updatedAt: at,
      tags: [],
      variants: [
        {
          id: variantId,
          price: "399.00",
          inventoryItemId: "gid://shopify/InventoryItem/3",
          sku: "AW-V1",
          inventoryTracked: true,
        },
      ],
    },
    [oldId]: {
      id: oldId,
      handle: "old",
      title: "Old",
      descriptionHtml: "<p>Old</p>",
      status: "ACTIVE",
      updatedAt: at,
      tags: [],
      variants: [],
    },
  };
  let published = false,
    uncertain = false;
  let media = [
    {
      id: "gid://shopify/MediaImage/8",
      mediaContentType: "IMAGE",
      status: "READY",
      imageUrl: url,
    },
  ];
  let assetMatches = true;
  const writes: string[] = [];
  const adapter = {
    ...createShopifyCatalogAdapter({}),
    readMedia: async () => ({
      status: "succeeded" as const,
      data: structuredClone(media),
    }),
    readProduct: async (identifier: { id: string } | { handle: string }) => ({
      status: "succeeded" as const,
      data: structuredClone(
        "id" in identifier ? (products[identifier.id] ?? null) : null,
      ),
    }),
    readStock: async () => ({
      status: "succeeded" as const,
      data: {
        inventoryItemId: "gid://shopify/InventoryItem/3",
        locationId: "gid://shopify/Location/4",
        sku: "AW-V1",
        tracked: true,
        available: 10,
        updatedAt: at,
        observedAt: at,
      },
    }),
    updatePrices: async () => {
      writes.push("prices");
      products[id]!.variants[0]!.price = "499.00";
      return {
        status: "succeeded" as const,
        data: structuredClone(products[id]!),
      };
    },
    setStatus: async (p: {
      productId: string;
      status: "DRAFT" | "ACTIVE" | "ARCHIVED";
    }) => {
      writes.push(p.status);
      products[p.productId]!.status = p.status;
      return {
        status: "succeeded" as const,
        data: structuredClone(products[p.productId]!),
      };
    },
    readPublication: async () => ({
      status: "succeeded" as const,
      data: { productId: id, status: products[id]!.status, published },
    }),
    publish: async () => {
      writes.push("publish");
      if (uncertain)
        return { status: "unknown" as const, reason: "Lost acknowledgement" };
      published = true;
      return {
        status: "succeeded" as const,
        data: { productId: id, status: "ACTIVE", published: true },
      };
    },
  };
  const service = createCatalogReleaseService({
    store,
    records,
    adapter,
    now: () => current,
    isDemo: () => false,
    signingSecret: "test-signing-key".repeat(4),
    verifyAsset: (actualUrl, actualHash) =>
      verifyAssetBytes(actualUrl, actualHash, {
        fetch: async () =>
          new Response(
            assetMatches ? imageBytes : Buffer.from("changed image bytes"),
            { headers: { "content-type": "image/png" } },
          ),
      }),
  });
  return {
    service,
    store,
    records,
    input,
    writes,
    products,
    id,
    oldId,
    wrongImage: () => {
      media[0]!.imageUrl = "https://assets.example.com/other.jpg";
    },
    extraImage: () => {
      media.push({
        id: "gid://shopify/MediaImage/99",
        mediaContentType: "IMAGE",
        status: "READY",
        imageUrl: "https://assets.example.com/unreviewed.jpg",
      });
    },
    wrongImageBytes: () => {
      assetMatches = false;
    },
    setUncertain: () => {
      uncertain = true;
    },
  };
}

test("wrong current image, unreviewed extra image, and changed image bytes block release before writes", async () => {
  for (const scenario of [
    "wrongImage",
    "extraImage",
    "wrongImageBytes",
  ] as const) {
    const f = await fixture();
    await f.service.queue(f.input);
    f[scenario]();
    const result = await f.service.execute(f.input.releaseId);
    assert.equal(result.status, "unknown");
    assert.equal(result.data?.state, "held");
    assert.equal(f.writes.length, 0);
    assert.equal(
      (await f.records.get<{ version: number }>("catalog", "active"))?.version,
      1,
    );
  }
});

test("qualified catalog publishes once and archives old product only after manifest promotion", async () => {
  const f = await fixture();
  assert.equal((await f.service.queue(f.input)).status, "succeeded");
  assert.equal(
    (await f.service.execute(f.input.releaseId)).status,
    "succeeded",
  );
  assert.equal(
    (await f.records.get<{ version: number }>("catalog", "active"))?.version,
    2,
  );
  assert.deepEqual(f.writes, ["prices", "ACTIVE", "publish", "ARCHIVED"]);
  assert.equal(f.products[f.oldId]!.status, "ARCHIVED");
  assert.equal(
    (await f.service.execute(f.input.releaseId)).status,
    "succeeded",
  );
  assert.equal(f.writes.length, 4);
});

test("uncertain publication keeps the old manifest and never repeats mutation", async () => {
  const f = await fixture();
  f.setUncertain();
  await f.service.queue(f.input);
  assert.equal((await f.service.execute(f.input.releaseId)).status, "unknown");
  assert.equal(
    (await f.records.get<{ version: number }>("catalog", "active"))?.version,
    1,
  );
  assert.equal(f.products[f.oldId]!.status, "ACTIVE");
  assert.equal((await f.service.execute(f.input.releaseId)).status, "unknown");
  assert.equal(f.writes.filter((w) => w === "publish").length, 1);
  assert.equal(
    (
      await f.records.get<{ state: string }>(
        "catalog-release",
        f.input.releaseId,
      )
    )?.state,
    "held",
  );
});

test("queued catalog cannot bypass observation mode or exact trusted qualification", async () => {
  const f = await fixture(false);
  await f.service.queue(f.input);
  assert.equal((await f.service.execute(f.input.releaseId)).status, "rejected");
  assert.equal(f.writes.length, 0);
  const altered = structuredClone(f.input);
  altered.products[0]!.variants[0]!.price = "599.00";
  altered.releaseId = "changed";
  assert.equal((await f.service.queue(altered)).status, "rejected");
  assert.equal(f.writes.length, 0);
});
