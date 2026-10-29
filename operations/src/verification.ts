import { z } from "zod";
import { getStore, getRecords, demoMode } from "./database.js";
import {
  catalogReleaseService,
  catalogReleaseSchema,
} from "./catalog-release.js";
import { fingerprint } from "./effects.js";

const text = z.string().min(1).max(2048),
  date = z.iso.datetime(),
  money = z.number().int().nonnegative(),
  url = z.url().refine((u) => new URL(u).protocol === "https:");
export const productEvidenceSchema = z
  .object({
    id: text,
    title: text,
    search: z
      .object({
        country: z.literal("SE"),
        monthlySearches: z.number().nonnegative(),
        method: z.enum(["absolute_volume", "relative_trends"]),
        sourceUrl: url,
        observedAt: date,
        period: text,
      })
      .strict(),
    trends: z
      .object({
        country: z.literal("SE"),
        sourceUrl: url,
        observedAt: date,
        seasonalWindow: text,
      })
      .strict(),
    marketplace: z
      .object({
        country: text,
        sourceUrl: url,
        rating: z.number().min(0).max(5),
        reviewCount: z.number().int().nonnegative(),
        recentPurchaseEstimate: z.number().nonnegative().optional(),
        observedAt: date,
      })
      .strict(),
    supplier: z
      .object({
        productId: text,
        variantId: text,
        quoteId: text,
        integration: z.enum(["shopify_direct", "unverified"]),
        shippingCountry: z.literal("SE"),
        sourceUrl: url,
        observedAt: date,
        deliveryDaysMax: z.number().int().positive(),
      })
      .strict(),
    pricing: z
      .object({
        sellingPriceOre: money,
        productCostOre: money,
        shippingCostOre: money,
        paymentFeeOre: money,
        adCostAllowanceOre: money,
        returnsReprintsAllowanceOre: money,
        personalizationLabourOre: money,
      })
      .strict(),
    provenance: z
      .object({ actor: text, evidenceRefs: z.array(text).min(1).max(30) })
      .strict(),
  })
  .strict();
const verifiedOrderSchema = z
  .object({
    id: text,
    source: z.literal("shopify_supplier_payment"),
    sourceRefs: z.array(text).min(3),
    paidAt: date.optional(),
    fulfilledAt: date.optional(),
    payoutReceivedAt: date.optional(),
    revenueOre: money,
    productCostOre: money,
    shippingCostOre: money,
    paymentFeeOre: money,
    adCostOre: money,
    refundsOre: money,
    returnsReprintsOre: money,
    personalizationLabourOre: money,
    verifiedAt: date,
  })
  .strict();
export const trustedImportSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("social-copy-review"),
      key: z.string().regex(/^[a-f0-9]{64}$/),
      value: z
        .object({
          reviewedAt: date,
          factualClaims: z.literal(true),
          swedishText: z.literal(true),
          productId: z.string().regex(/^gid:\/\/shopify\/Product\/[0-9]+$/),
          reviewer: text,
          evidenceRef: text,
        })
        .strict(),
    })
    .strict(),
  z
    .object({
      kind: z.literal("product-evidence"),
      value: productEvidenceSchema,
    })
    .strict(),
  z
    .object({ kind: z.literal("verified-order"), value: verifiedOrderSchema })
    .strict(),
  z
    .object({
      kind: z.literal("supplier-binding"),
      key: text,
      value: z
        .object({
          checkedAt: date,
          evidenceRef: text,
          variants: z
            .array(
              z
                .object({
                  variantId: text,
                  evidenceId: text,
                  inventoryItemId: text,
                  locationId: text,
                  sku: text,
                  supplierProductId: text,
                  supplierVariantId: text,
                })
                .strict(),
            )
            .min(1)
            .max(100),
        })
        .strict(),
    })
    .strict(),
  z
    .object({
      kind: z.literal("storefront-policy"),
      value: z
        .object({
          hash: text,
          checkedAt: date,
          shippingCountry: z.literal("SE"),
          deliveryClaimsVerified: z.boolean(),
          returnsPublished: z.boolean(),
          privacyConsentVerified: z.boolean(),
          checkoutVerified: z.boolean(),
          evidenceRefs: z.array(text).min(1),
        })
        .strict(),
    })
    .strict(),
  z
    .object({
      kind: z.literal("catalog-assets"),
      key: text,
      value: z
        .object({
          checkedAt: date,
          evidenceRef: text,
          shopifyMediaIds: z.array(text).min(1),
          urls: z.array(url).min(1),
        })
        .strict(),
    })
    .strict(),
  z
    .object({
      kind: z.literal("catalog-qualification"),
      value: z
        .object({
          releaseHash: text,
          checkedAt: date,
          policyEvidenceRef: text,
          policyHash: text,
        })
        .strict(),
    })
    .strict(),
  z
    .object({
      kind: z.literal("tiktok-handoff"),
      value: z
        .object({
          verified: z.literal(true),
          oldSchedulerDisabled: z.literal(true),
          importedPostIds: z.array(text),
          evidenceRef: text,
          verifiedAt: date,
        })
        .strict(),
    })
    .strict(),
  z
    .object({ kind: z.literal("catalog-release"), value: catalogReleaseSchema })
    .strict(),
  z
    .object({
      kind: z.literal("supplier-recovery"),
      value: z.object({ receiptId: text, amountOre: money }).strict(),
    })
    .strict(),
  z
    .object({
      kind: z.literal("spend-receipt"),
      value: z
        .object({ reservationId: text, actualOre: money, receiptId: text })
        .strict(),
    })
    .strict(),
]);
/** Called only after OPS_SERVICE_TOKEN authentication. Never expose this as an agent tool. */
export async function importVerified(input: unknown) {
  const value = trustedImportSchema.parse(input);
  if (demoMode())
    throw new Error("Demo cannot import production verification.");
  const [store, records] = await Promise.all([getStore(), getRecords()]);
  switch (value.kind) {
    case "product-evidence":
      await store.recordEvidence(value.value);
      break;
    case "verified-order":
      await store.recordVerifiedOrder(value.value);
      break;
    case "supplier-recovery":
      await store.recoverSupplierFloat(value.value);
      break;
    case "spend-receipt":
      await store.settleSpend(value.value.reservationId, {
        actualOre: value.value.actualOre,
        receiptId: value.value.receiptId,
      });
      break;
    case "supplier-binding":
    case "catalog-assets":
      await records.put(value.kind, value.key, value.value);
      break;
    case "social-copy-review":
      await records.put(value.kind, value.key, value.value);
      await store.enqueueJob({
        dedupKey: `reviewed-social:${value.key}`,
        type: "social",
        payload: { draftKey: value.key },
        maxAttempts: 20,
      });
      break;
    case "storefront-policy":
      await records.put(value.kind, "current", value.value);
      break;
    case "catalog-qualification":
      await records.put(value.kind, value.value.releaseHash, value.value);
      break;
    case "tiktok-handoff":
      await records.put("handoff", "tiktok", value.value);
      break;
    case "catalog-release": {
      const result = await (await catalogReleaseService()).queue(value.value);
      if (result.status === "succeeded")
        await store.enqueueJob({
          dedupKey: `catalog:${value.value.releaseId}`,
          type: "catalog-release",
          payload: { releaseId: value.value.releaseId },
        });
      return result;
    }
  }
  await store.appendAudit(
    "verification.imported",
    { kind: value.kind, hash: fingerprint(value) },
    "trusted_verifier",
  );
  return { recorded: true, kind: value.kind };
}
