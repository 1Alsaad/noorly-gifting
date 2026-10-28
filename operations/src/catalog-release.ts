import { z } from "zod";
import { createHash } from "node:crypto";
import { getStore, getRecords, demoMode } from "./database.js";
import { catalogSchema, type Catalog } from "./schemas.js";
import { fingerprint, runEffect } from "./effects.js";
import { evaluateLaunch } from "./core/policy.js";
import type { OpsStore } from "./core/types.js";
import type { RecordStore } from "./records.js";
import {
  createShopifyCatalogAdapter,
  type CatalogProduct,
  type DraftProductInput,
} from "./adapters/shopify-catalog.js";
import { shopifyConfigFromEnv } from "./adapters/shopify.js";
import type { ExternalResult } from "./adapters/types.js";
import { verifyAssetBytes } from "./assets.js";

const gid = (kind: string) =>
  z.string().regex(new RegExp(`^gid://shopify/${kind}/[0-9]+$`));
const money = z.string().regex(/^\d+(?:\.\d{1,2})?$/);
export const catalogReleaseSchema = z
  .object({
    releaseId: z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/),
    expectedVersion: z.number().int().nonnegative(),
    catalog: catalogSchema,
    publicationId: gid("Publication"),
    products: z
      .array(
        z
          .object({
            productId: gid("Product"),
            expectedUpdatedAt: z.iso.datetime(),
            variants: z
              .array(
                z
                  .object({
                    id: gid("ProductVariant"),
                    expectedPrice: money,
                    price: money,
                  })
                  .strict(),
              )
              .min(1)
              .max(100),
          })
          .strict(),
      )
      .min(1)
      .max(200),
    retireProductIds: z.array(gid("Product")).max(200),
  })
  .strict();
export type CatalogRelease = z.infer<typeof catalogReleaseSchema>;
/** These records are imported ONLY by the authenticated integration verifier, never agent tools. */
export type CatalogQualification = {
  releaseHash: string;
  checkedAt: string;
  policyEvidenceRef: string;
  policyHash: string;
};
export type StorefrontPolicyVerification = {
  hash: string;
  checkedAt: string;
  shippingCountry: "SE";
  deliveryClaimsVerified: boolean;
  returnsPublished: boolean;
  privacyConsentVerified: boolean;
  checkoutVerified: boolean;
  evidenceRefs: string[];
};
export type SupplierBinding = {
  checkedAt: string;
  evidenceRef: string;
  variants: {
    variantId: string;
    evidenceId: string;
    inventoryItemId: string;
    locationId: string;
    sku: string;
    supplierProductId: string;
    supplierVariantId: string;
  }[];
};
export type CatalogAssets = {
  checkedAt: string;
  evidenceRef: string;
  /** Each ID corresponds to the URL at the same array index. */
  shopifyMediaIds: string[];
  urls: string[];
};
export type ReleaseState = {
  input: CatalogRelease;
  hash: string;
  state: "queued" | "preparing" | "held" | "promoted" | "completed";
  reason?: string;
  snapshots: Record<string, CatalogProduct>;
  previousCatalog?: Catalog;
  manifestPromoted: boolean;
  updatedAt: string;
};
type Adapter = ReturnType<typeof createShopifyCatalogAdapter>;
export type CatalogReleaseDependencies = {
  store: OpsStore;
  records: RecordStore;
  adapter: Adapter;
  now: () => Date;
  isDemo: () => boolean;
  signingSecret?: string;
  verifyAsset?: (url: string, sha256: string) => Promise<boolean>;
};
const fresh = (timestamp: string, now: Date, hours = 24) =>
  Number.isFinite(Date.parse(timestamp)) &&
  Date.parse(timestamp) <= now.getTime() &&
  now.getTime() - Date.parse(timestamp) <= hours * 3600000;
const ore = (value: string) => Math.round(Number(value) * 100);
const unknown = (reason: string): ExternalResult<never> => ({
  status: "unknown",
  reason,
});

export function createCatalogReleaseService(deps: CatalogReleaseDependencies) {
  const { store, records, adapter, now, isDemo } = deps;
  const verifyAsset = deps.verifyAsset ?? verifyAssetBytes;
  async function guarded<T>(
    productId: string,
    run: () => Promise<ExternalResult<T>>,
  ): Promise<ExternalResult<T>> {
    const decision = await store.authorizeAction("publish_product", {
      productId,
    });
    return decision.allowed
      ? run()
      : { status: "rejected", reason: decision.reasons.join(" ") };
  }
  async function qualify(
    input: CatalogRelease,
    live: boolean,
  ): Promise<string[]> {
    const reasons: string[] = [];
    const hash = fingerprint(input);
    if (input.catalog.version !== input.expectedVersion + 1)
      reasons.push("Catalog version must advance by exactly one.");
    const ids = input.catalog.products.map((p) => p.id),
      changed = input.products.map((p) => p.productId);
    if (
      new Set(ids).size !== ids.length ||
      new Set(changed).size !== changed.length ||
      new Set(input.retireProductIds).size !== input.retireProductIds.length
    )
      reasons.push("Duplicate catalog product IDs.");
    if (
      changed.some((id) => !ids.includes(id)) ||
      input.retireProductIds.some((id) => ids.includes(id))
    )
      reasons.push(
        "Changed products must be in the manifest and retired products must be absent.",
      );
    for (const change of input.products) {
      const expected =
        input.catalog.products
          .find((p) => p.id === change.productId)
          ?.variants.map((v) => v.id) ?? [];
      if (
        new Set(change.variants.map((v) => v.id)).size !==
          change.variants.length ||
        change.variants.length !== expected.length ||
        change.variants.some((v) => !expected.includes(v.id))
      )
        reasons.push(
          "Price updates must exactly cover the released product variants.",
        );
    }
    const qualification = await records.get<CatalogQualification>(
      "catalog-qualification",
      hash,
    );
    const policy = await records.get<StorefrontPolicyVerification>(
      "storefront-policy",
      "current",
    );
    if (
      !qualification ||
      qualification.releaseHash !== hash ||
      !fresh(qualification.checkedAt, now()) ||
      !qualification.policyEvidenceRef
    )
      reasons.push(
        "Exact catalog release has no current trusted qualification.",
      );
    if (
      !policy ||
      !qualification ||
      qualification.policyHash !== policy.hash ||
      !fresh(policy.checkedAt, now()) ||
      policy.shippingCountry !== "SE" ||
      !policy.deliveryClaimsVerified ||
      !policy.returnsPublished ||
      !policy.privacyConsentVerified ||
      !policy.checkoutVerified ||
      !policy.evidenceRefs.length
    )
      reasons.push(
        "Current Sweden delivery, returns, consent and checkout verification is required.",
      );
    const snapshot = await store.snapshot();
    for (const product of input.catalog.products) {
      const evidence = snapshot.products[product.id];
      if (!evidence || !evaluateLaunch(evidence, now()).allowed)
        reasons.push(
          `Product ${product.id} lacks qualified demand and supplier evidence.`,
        );
      if (live) {
        const decision = await store.authorizeAction("publish_product", {
          productId: product.id,
        });
        reasons.push(...decision.reasons);
      }
      const binding = await records.get<SupplierBinding>(
        "supplier-binding",
        product.id,
      );
      const assets = await records.get<CatalogAssets>(
        "catalog-assets",
        product.id,
      );
      if (
        !binding ||
        !fresh(binding.checkedAt, now()) ||
        !binding.evidenceRef ||
        new Set(binding.variants.map((v) => v.variantId)).size !==
          binding.variants.length
      )
        reasons.push(`Current supplier bindings missing for ${product.id}.`);
      for (const variant of product.variants) {
        const mapped = binding?.variants.find(
          (v) => v.variantId === variant.id,
        );
        const variantEvidence = mapped
          ? snapshot.products[mapped.evidenceId]
          : undefined;
        if (
          !mapped ||
          mapped.sku !== variant.sku ||
          !variantEvidence ||
          !evaluateLaunch(variantEvidence, now()).allowed ||
          mapped.supplierProductId !== variantEvidence.supplier.productId ||
          mapped.supplierVariantId !== variantEvidence.supplier.variantId
        )
          reasons.push(
            `Exact verified supplier variant missing for ${variant.id}.`,
          );
        const change = input.products
          .find((p) => p.productId === product.id)
          ?.variants.find((v) => v.id === variant.id);
        if (
          change &&
          variantEvidence &&
          ore(change.price) !== variantEvidence.pricing.sellingPriceOre
        )
          reasons.push(
            `Variant ${variant.id} price differs from qualified margin evidence.`,
          );
      }
      if (
        !assets ||
        !fresh(assets.checkedAt, now()) ||
        !assets.evidenceRef ||
        !assets.shopifyMediaIds.length ||
        !assets.urls.length
      )
        reasons.push(
          `Existing reviewed Shopify media missing for ${product.id}.`,
        );
      for (const url of assets?.urls ?? []) {
        const review = await records.get<{
          sha256: string;
          reviewedAt: string;
          authorizedPhotography: boolean;
          factualClaims: boolean;
        }>("asset-review", fingerprint(url));
        if (
          !review ||
          !fresh(review.reviewedAt, now(), 24 * 30) ||
          !review.authorizedPhotography ||
          !review.factualClaims ||
          !/^[a-f0-9]{64}$/.test(review.sha256) ||
          !/^https:/.test(url)
        )
          reasons.push(`Product media review missing for ${product.id}.`);
      }
    }
    return [...new Set(reasons)];
  }
  async function hold(
    state: ReleaseState,
    reason: string,
  ): Promise<ExternalResult<ReleaseState>> {
    state.state = "held";
    state.reason = reason;
    state.updatedAt = now().toISOString();
    await records.put("catalog-release", state.input.releaseId, state);
    await records.put("catalog-release-hold", "active", {
      releaseId: state.input.releaseId,
      reason,
      at: state.updatedAt,
    });
    await store.appendAudit(
      "catalog.release.held",
      {
        releaseId: state.input.releaseId,
        reason,
        manifestPromoted: state.manifestPromoted,
      },
      "trusted_catalog_service",
    );
    return { status: "unknown", data: state, reason };
  }
  async function verifyRemote(
    input: CatalogRelease,
  ): Promise<ExternalResult<Record<string, CatalogProduct>>> {
    const products: Record<string, CatalogProduct> = {};
    const evidence = (await store.snapshot()).products;
    for (const entry of input.catalog.products) {
      const media = await verifyCurrentMedia(entry.id);
      if (media.status !== "succeeded")
        return { status: media.status, reason: media.reason };
      const current = await adapter.readProduct({ id: entry.id });
      if (current.status !== "succeeded" || !current.data)
        return unknown(
          `Cannot read complete Shopify catalog product ${entry.id}.`,
        );
      if (current.data.handle !== entry.handle)
        return {
          status: "rejected",
          reason: `Product handle mismatch for ${entry.id}.`,
        };
      if (
        current.data.variants.length !== entry.variants.length ||
        current.data.variants.some(
          (v) => !entry.variants.some((m) => m.id === v.id),
        )
      )
        return {
          status: "rejected",
          reason:
            "All Shopify variants of a released product must be present and qualified in the manifest.",
        };
      const binding = await records.get<SupplierBinding>(
        "supplier-binding",
        entry.id,
      );
      for (const variant of entry.variants) {
        const mapped = binding?.variants.find(
            (v) => v.variantId === variant.id,
          ),
          actual = current.data.variants.find((v) => v.id === variant.id);
        if (
          !mapped ||
          !actual ||
          !actual.inventoryTracked ||
          actual.inventoryItemId !== mapped.inventoryItemId ||
          actual.sku !== mapped.sku
        )
          return {
            status: "rejected",
            reason: `Shopify variant ${variant.id} does not match verified supplier inventory.`,
          };
        if (
          !input.products.some((p) => p.productId === entry.id) &&
          ore(actual.price) !==
            evidence[mapped.evidenceId]?.pricing.sellingPriceOre
        )
          return {
            status: "rejected",
            reason: `Unchanged product price no longer matches qualified margins for ${variant.id}.`,
          };
        const stock = await adapter.readStock({
          inventoryItemId: mapped.inventoryItemId,
          locationId: mapped.locationId,
        });
        if (
          stock.status !== "succeeded" ||
          !stock.data ||
          !stock.data.tracked ||
          stock.data.sku !== mapped.sku ||
          stock.data.available < 1
        )
          return unknown(
            `Supplier location stock is unverified or unavailable for ${variant.id}.`,
          );
      }
      products[entry.id] = current.data;
    }
    return { status: "succeeded", data: products };
  }
  async function verifyCurrentMedia(
    productId: string,
  ): Promise<ExternalResult<true>> {
    const trusted = await records.get<CatalogAssets>(
      "catalog-assets",
      productId,
    );
    if (
      !trusted ||
      !trusted.urls.length ||
      trusted.urls.length !== trusted.shopifyMediaIds.length ||
      new Set(trusted.urls).size !== trusted.urls.length ||
      new Set(trusted.shopifyMediaIds).size !== trusted.shopifyMediaIds.length
    )
      return {
        status: "rejected",
        reason:
          "Trusted Shopify media IDs and reviewed URLs must form unique matching pairs.",
      };
    const current = await adapter.readMedia(productId);
    if (current.status !== "succeeded" || !current.data)
      return unknown(
        `Complete Shopify media could not be read for ${productId}.`,
      );
    if (current.data.length !== trusted.shopifyMediaIds.length)
      return {
        status: "rejected",
        reason: `Shopify has missing or unreviewed extra media for ${productId}.`,
      };
    for (const media of current.data) {
      const index = trusted.shopifyMediaIds.indexOf(media.id);
      if (
        index < 0 ||
        media.mediaContentType !== "IMAGE" ||
        media.status !== "READY" ||
        media.imageUrl !== trusted.urls[index]
      )
        return {
          status: "rejected",
          reason: `Current Shopify media does not match the reviewed image for ${productId}.`,
        };
      const review = await records.get<{
        sha256: string;
        reviewedAt: string;
        authorizedPhotography: boolean;
        factualClaims: boolean;
      }>("asset-review", fingerprint(media.imageUrl));
      if (
        !review ||
        !fresh(review.reviewedAt, now(), 24 * 30) ||
        !review.authorizedPhotography ||
        !review.factualClaims ||
        !(await verifyAsset(media.imageUrl, review.sha256))
      )
        return {
          status: "rejected",
          reason: `Current Shopify image bytes do not match the approved review for ${productId}.`,
        };
    }
    return { status: "succeeded", data: true };
  }
  async function queue(
    inputUnknown: unknown,
  ): Promise<ExternalResult<ReleaseState>> {
    const input = catalogReleaseSchema.parse(inputUnknown),
      hash = fingerprint(input);
    const allowed = await store.authorizeAction("draft");
    if (!allowed.allowed)
      return { status: "rejected", reason: allowed.reasons.join(" ") };
    const reasons = await qualify(input, false);
    if (reasons.length)
      return { status: "rejected", reason: reasons.join(" ") };
    const previous = await records.get<ReleaseState>(
      "catalog-release",
      input.releaseId,
    );
    if (previous)
      return previous.hash === hash
        ? { status: "succeeded", data: previous }
        : {
            status: "rejected",
            reason: "Release ID already belongs to another manifest.",
          };
    const state: ReleaseState = {
      input,
      hash,
      state: "queued",
      snapshots: {},
      manifestPromoted: false,
      updatedAt: now().toISOString(),
    };
    await records.put("catalog-release", input.releaseId, state);
    await store.appendAudit(
      "catalog.release.queued",
      { releaseId: input.releaseId, hash },
      "trusted_catalog_service",
    );
    return { status: "succeeded", data: state };
  }
  async function execute(
    releaseId: string,
  ): Promise<ExternalResult<ReleaseState>> {
    if (isDemo())
      return {
        status: "rejected",
        reason: "Demo does not change Shopify or publish catalogs.",
      };
    if (!deps.signingSecret || deps.signingSecret.length < 32)
      return {
        status: "rejected",
        reason:
          "Catalog signing key must be configured before any release writes.",
      };
    const locked = await records.withLock(
      "catalog:release",
      async (): Promise<ExternalResult<ReleaseState>> => {
        const state = await records.get<ReleaseState>(
          "catalog-release",
          releaseId,
        );
        if (!state)
          return { status: "rejected", reason: "Unknown qualified release." };
        if (state.state === "completed")
          return { status: "succeeded", data: state };
        const globalHold = await records.get<{ releaseId: string }>(
          "catalog-release-hold",
          "active",
        );
        if (globalHold && globalHold.releaseId !== releaseId)
          return {
            status: "rejected",
            reason: "Another catalog release requires reconciliation.",
          };
        const input = catalogReleaseSchema.parse(state.input);
        if (fingerprint(input) !== state.hash)
          return hold(
            state,
            "Persisted release content changed; verification no longer applies.",
          );
        const reasons = await qualify(input, true);
        if (reasons.length)
          return { status: "rejected", reason: reasons.join(" ") };
        const active = await records.get<Catalog>("catalog", "active");
        // A process may have committed the manifest before saving its checkpoint.
        if (active && fingerprint(active) === fingerprint(input.catalog))
          state.manifestPromoted = true;
        if (
          state.manifestPromoted &&
          (!active || fingerprint(active) !== fingerprint(input.catalog))
        )
          return {
            status: "rejected",
            reason:
              "A different catalog is active; retirement requires a new reviewed release.",
          };
        if (
          !state.manifestPromoted &&
          (active?.version ?? 0) !== input.expectedVersion
        )
          return {
            status: "rejected",
            reason: "Active catalog version changed; requalify the release.",
          };
        if (!state.manifestPromoted) {
          const removed = (active?.products ?? [])
            .map((p) => p.id)
            .filter((id) => !input.catalog.products.some((p) => p.id === id));
          if (
            removed.length !== input.retireProductIds.length ||
            input.retireProductIds.some((id) => !removed.includes(id))
          )
            return {
              status: "rejected",
              reason:
                "Retirement must exactly match products removed from the current catalog.",
            };
          const remote = await verifyRemote(input);
          if (remote.status !== "succeeded" || !remote.data)
            return hold(state, remote.reason ?? "Remote preflight failed.");
          if (!Object.keys(state.snapshots).length) {
            state.snapshots = remote.data;
            state.previousCatalog = active;
            state.state = "preparing";
            state.updatedAt = now().toISOString();
            await records.put("catalog-release", releaseId, state);
          }
          for (const change of input.products) {
            const original = state.snapshots[change.productId];
            if (!original || original.updatedAt !== change.expectedUpdatedAt)
              return hold(
                state,
                "Approved product snapshot does not match the captured release snapshot.",
              );
            const pricePayload = {
              actionKey: `catalog:${releaseId}:price:${change.productId}`,
              productId: change.productId,
              expectedUpdatedAt: original.updatedAt,
              variants: change.variants,
            };
            const prices = await runEffect(
              records,
              pricePayload.actionKey,
              "catalog_price",
              pricePayload,
              () =>
                guarded(change.productId, () =>
                  adapter.updatePrices(pricePayload),
                ),
              async () => {
                const read = await adapter.readProduct({
                  id: change.productId,
                });
                return read.status === "succeeded" &&
                  read.data &&
                  change.variants.every((v) =>
                    read.data!.variants.some(
                      (a) => a.id === v.id && ore(a.price) === ore(v.price),
                    ),
                  )
                  ? {
                      status: "succeeded",
                      externalId: read.data.id,
                      data: read.data,
                    }
                  : unknown("Prices remain unconfirmed.");
              },
            );
            if (prices.status !== "succeeded" || !prices.data)
              return hold(
                state,
                prices.reason ??
                  "Price write incomplete; old manifest retained.",
              );
            const statusPayload = {
              actionKey: `catalog:${releaseId}:activate:${change.productId}`,
              productId: change.productId,
              expectedUpdatedAt: prices.data.updatedAt,
              status: "ACTIVE" as const,
            };
            const activated = await runEffect(
              records,
              statusPayload.actionKey,
              "catalog_activate",
              statusPayload,
              () =>
                guarded(change.productId, () =>
                  adapter.setStatus(statusPayload),
                ),
              async () => {
                const r = await adapter.readProduct({ id: change.productId });
                return r.status === "succeeded" && r.data?.status === "ACTIVE"
                  ? { status: "succeeded", externalId: r.data.id, data: r.data }
                  : unknown("Activation remains unconfirmed.");
              },
            );
            if (activated.status !== "succeeded")
              return hold(
                state,
                activated.reason ??
                  "Activation incomplete; old manifest retained.",
              );
            const publishPayload = {
              actionKey: `catalog:${releaseId}:publish:${change.productId}`,
              productId: change.productId,
              publicationId: input.publicationId,
            };
            const publication = await runEffect(
              records,
              publishPayload.actionKey,
              "catalog_publish",
              publishPayload,
              () =>
                guarded(change.productId, () =>
                  adapter.publish(publishPayload),
                ),
              async () => {
                const r = await adapter.readPublication(
                  change.productId,
                  input.publicationId,
                );
                return r.status === "succeeded" &&
                  r.data?.published &&
                  r.data.status === "ACTIVE"
                  ? r
                  : unknown("Publication remains unconfirmed.");
              },
            );
            if (publication.status !== "succeeded")
              return hold(
                state,
                publication.reason ??
                  "Publication incomplete; old manifest retained.",
              );
          }
          // Unchanged products are also verified before the signed manifest becomes available.
          for (const product of input.catalog.products) {
            const media = await verifyCurrentMedia(product.id);
            if (media.status !== "succeeded")
              return hold(
                state,
                media.reason ??
                  "Current product images failed verification before manifest promotion.",
              );
            const published = await adapter.readPublication(
              product.id,
              input.publicationId,
            );
            if (
              published.status !== "succeeded" ||
              !published.data?.published ||
              published.data.status !== "ACTIVE"
            )
              return hold(
                state,
                "Every manifest product must be confirmed active and published.",
              );
          }
          for (const product of input.catalog.products) {
            const decision = await store.authorizeAction("publish_product", {
              productId: product.id,
            });
            if (!decision.allowed)
              return hold(state, decision.reasons.join(" "));
          }
          await records.put(
            "catalog-history",
            String(input.catalog.version),
            input.catalog,
          );
          await records.put("catalog", "active", input.catalog);
          state.manifestPromoted = true;
          state.state = "promoted";
          await records.put("catalog-release", releaseId, state);
        }
        // Retire only after removing products from the manifest. ARCHIVED preserves order references.
        for (const id of input.retireProductIds) {
          const read = await adapter.readProduct({ id });
          if (read.status !== "succeeded" || !read.data)
            return hold(
              state,
              "Retired product cannot be read; manifest promoted but retirement held.",
            );
          const retirementKey = `catalog:${releaseId}:retire:${id}`;
          // Stable payload excludes mutable updatedAt; retries reconcile rather than re-submit.
          const result = await runEffect(
            records,
            retirementKey,
            "catalog_retire",
            { id, status: "ARCHIVED" },
            () =>
              guarded(input.products[0]!.productId, () =>
                adapter.setStatus({
                  actionKey: retirementKey,
                  productId: id,
                  expectedUpdatedAt: read.data!.updatedAt,
                  status: "ARCHIVED",
                }),
              ),
            async () => {
              const r = await adapter.readProduct({ id });
              return r.status === "succeeded" && r.data?.status === "ARCHIVED"
                ? { status: "succeeded", externalId: id, data: r.data }
                : unknown("Retirement remains unconfirmed.");
            },
          );
          if (result.status !== "succeeded")
            return hold(
              state,
              result.reason ?? "Retirement requires reconciliation.",
            );
        }
        state.state = "completed";
        state.reason = undefined;
        state.updatedAt = now().toISOString();
        await records.put("catalog-release", releaseId, state);
        await records.put("catalog-release-hold", "active", null);
        await store.appendAudit(
          "catalog.release.completed",
          { releaseId, version: input.catalog.version },
          "trusted_catalog_service",
        );
        return { status: "succeeded", data: state };
      },
    );
    return locked.locked && locked.result
      ? locked.result
      : {
          status: "rejected",
          reason: "Another catalog worker holds the release lock.",
        };
  }
  async function prepareDraft(
    input: DraftProductInput,
    evidenceId: string,
  ): Promise<ExternalResult<CatalogProduct>> {
    if (isDemo())
      return {
        status: "rejected",
        reason: "Demo does not create Shopify products.",
      };
    const allowed = await store.authorizeAction("draft");
    if (!allowed.allowed)
      return { status: "rejected", reason: allowed.reasons.join(" ") };
    const evidence = (await store.snapshot()).products[evidenceId];
    if (!evidence || !evaluateLaunch(evidence, now()).allowed)
      return {
        status: "rejected",
        reason:
          "Trusted supplier and Swedish demand evidence required before draft creation.",
      };
    const locked = await records.withLock(`catalog:draft:${input.handle}`, () =>
      runEffect(
        records,
        `catalog-draft:${input.actionKey}`,
        "catalog_create_draft",
        input,
        () => adapter.createDraft(input),
        async () => {
          const previous = await adapter.readProduct({ handle: input.handle });
          // An uncertain create is not repeated. A completed record is recovered by the adapter's ownership marker only.
          const ownership = `noorly-op-${createHash("sha256").update(input.actionKey).digest("hex").slice(0, 24)}`;
          return previous.status === "succeeded" &&
            previous.data &&
            previous.data.tags.includes(ownership) &&
            previous.data.title === input.title &&
            previous.data.descriptionHtml === input.descriptionHtml &&
            previous.data.status === "DRAFT"
            ? {
                status: "succeeded",
                externalId: previous.data.id,
                data: previous.data,
              }
            : unknown("Draft ownership must be reconciled before retrying.");
        },
      ),
    );
    const result =
      locked.locked && locked.result
        ? locked.result
        : {
            status: "rejected" as const,
            reason: "Draft preparation lock is held.",
          };
    if (result.status === "succeeded" && result.data)
      await records.put("catalog-draft", input.actionKey, {
        productId: result.data.id,
        evidenceId,
        at: now().toISOString(),
      });
    return result;
  }
  return { queue, execute, prepareDraft };
}
export async function catalogReleaseService() {
  return createCatalogReleaseService({
    store: await getStore(),
    records: await getRecords(),
    adapter: createShopifyCatalogAdapter(shopifyConfigFromEnv()),
    now: () => new Date(),
    isDemo: demoMode,
    signingSecret: process.env.NOORLY_CATALOG_SIGNING_SECRET,
  });
}
