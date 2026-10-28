import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cache } from "react";
import { z } from "zod";
import { CommerceError } from "./errors";
import type { Product, ProductVariant } from "@/types/commerce";

const text = z.string().trim().min(1).max(4000);
const localized = z.object({ sv: text, en: text }).strict();
const productId = z.string().regex(/^gid:\/\/shopify\/Product\/[1-9]\d*$/);
const variantId = z
  .string()
  .regex(/^gid:\/\/shopify\/ProductVariant\/[1-9]\d*$/);
const handle = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  .max(200);
const component = z
  .object({
    productId,
    productHandle: handle,
    variantId,
    sku: z.string().trim().min(1).max(200),
    quantity: z.number().int().positive().max(100),
  })
  .strict();

export const managedProductSchema = z
  .object({
    id: productId,
    handle,
    title: localized,
    description: localized,
    included: localized,
    delivery: localized,
    availability: z.enum(["in_stock", "preorder"]),
    care: localized.optional(),
    highlights: z.array(localized).max(10).optional(),
    category: z.enum(["box", "signature", "extra", "card", "packaging"]),
    variants: z
      .array(
        z
          .object({
            id: variantId,
            sku: z.string().trim().min(1).max(200),
            components: z.array(component).min(1).max(20).optional(),
          })
          .strict(),
      )
      .min(1)
      .max(100),
  })
  .strict();

export const managedCatalogSchema = z
  .object({
    schemaVersion: z.literal(1),
    version: z.number().int().positive(),
    publishedAt: z.iso.datetime(),
    products: z.array(managedProductSchema).max(100),
  })
  .strict()
  .superRefine((catalog, ctx) => {
    const ids = new Set<string>();
    const handles = new Set<string>();
    const variants = new Set<string>();
    for (const product of catalog.products) {
      if (ids.has(product.id) || handles.has(product.handle))
        ctx.addIssue({ code: "custom", message: "Duplicate product identity" });
      ids.add(product.id);
      handles.add(product.handle);
      for (const variant of product.variants) {
        if (variants.has(variant.id))
          ctx.addIssue({
            code: "custom",
            message: "Duplicate variant identity",
          });
        variants.add(variant.id);
        const componentIds =
          variant.components?.map((item) => item.variantId) ?? [];
        if (new Set(componentIds).size !== componentIds.length)
          ctx.addIssue({
            code: "custom",
            message: "Duplicate component identity",
          });
      }
    }
  });

export type ManagedCatalog = z.infer<typeof managedCatalogSchema>;
export type ManagedProduct = z.infer<typeof managedProductSchema>;

export function isManagedCatalogConfigured() {
  return Boolean(process.env.NOORLY_CATALOG_URL);
}

/** Authenticate the whole immutable snapshot, including its publication version. */
export function verifyManagedCatalog(
  body: string,
  timestamp: string | null,
  signature: string | null,
  secret: string,
  now = Date.now(),
): ManagedCatalog {
  if (
    secret.length < 32 ||
    !timestamp ||
    !/^\d{10}$/.test(timestamp) ||
    Math.abs(now / 1000 - Number(timestamp)) > 300 ||
    !signature ||
    !/^[a-f0-9]{64}$/.test(signature) ||
    Buffer.byteLength(body, "utf8") > 1_048_576
  )
    throw new CommerceError("managed_catalog_invalid", 503);
  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${body}`)
    .digest();
  if (!timingSafeEqual(expected, Buffer.from(signature, "hex")))
    throw new CommerceError("managed_catalog_invalid", 503);
  try {
    const catalog = managedCatalogSchema.parse(JSON.parse(body));
    if (Date.parse(catalog.publishedAt) > now + 300_000)
      throw new Error("Future publication");
    return catalog;
  } catch {
    throw new CommerceError("managed_catalog_invalid", 503);
  }
}

export async function fetchManagedCatalog(
  fetcher: typeof fetch = fetch,
): Promise<ManagedCatalog | null> {
  if (!isManagedCatalogConfigured()) return null;
  const endpoint = process.env.NOORLY_CATALOG_URL!;
  const token = process.env.NOORLY_CATALOG_TOKEN;
  const secret = process.env.NOORLY_CATALOG_SIGNING_SECRET;
  try {
    const url = new URL(endpoint);
    const local =
      process.env.NODE_ENV !== "production" &&
      ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    if (
      (!local && url.protocol !== "https:") ||
      url.username ||
      url.password ||
      !token ||
      token.length < 32 ||
      !secret ||
      secret.length < 32
    )
      throw new Error("Invalid catalog configuration");
    const response = await fetcher(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(5000),
    });
    if (
      !response.ok ||
      Number(response.headers.get("content-length") ?? 0) > 1_048_576
    )
      throw new Error("Catalog unavailable");
    // A streamed limit bounds memory even when Content-Length is absent or false.
    if (!response.body) throw new Error("Empty catalog");
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let length = 0;
    while (true) {
      const result = await reader.read();
      if (result.done) break;
      length += result.value.length;
      if (length > 1_048_576) {
        await reader.cancel();
        throw new Error("Catalog too large");
      }
      chunks.push(result.value);
    }
    return verifyManagedCatalog(
      Buffer.concat(chunks).toString("utf8"),
      response.headers.get("x-noorly-timestamp"),
      response.headers.get("x-noorly-signature"),
      secret,
    );
  } catch (error) {
    if (error instanceof CommerceError) throw error;
    throw new CommerceError("managed_catalog_unavailable", 503);
  }
}

// Request-local only: never retain an old sellable catalog after an operations outage.
export const getManagedCatalog = cache(fetchManagedCatalog);

function supportedImage(image: { url: string }) {
  try {
    const url = new URL(image.url);
    return (
      url.protocol === "https:" &&
      url.hostname === "cdn.shopify.com" &&
      !url.username &&
      !url.password &&
      !url.port
    );
  } catch {
    return false;
  }
}

function supportedVariant(
  variant: ProductVariant,
  expected: ManagedProduct["variants"][number],
) {
  if (
    variant.id !== expected.id ||
    variant.sku !== expected.sku ||
    !variant.available ||
    variant.price.currencyCode !== "SEK" ||
    !Number.isFinite(variant.price.amount) ||
    variant.price.amount <= 0
  )
    return false;
  const actual = variant.components ?? [];
  if (!expected.components)
    return variant.requiresComponents !== true && actual.length === 0;
  if (
    variant.requiresComponents !== true ||
    actual.length !== expected.components.length
  )
    return false;
  return expected.components.every((wanted) =>
    actual.some(
      (item) =>
        item.product.id === wanted.productId &&
        item.product.handle === wanted.productHandle &&
        item.variant.id === wanted.variantId &&
        item.variant.sku === wanted.sku &&
        item.quantity === wanted.quantity &&
        item.variant.available &&
        item.variant.requiresComponents !== true &&
        !item.variant.components?.length &&
        !item.product.requiresSellingPlan &&
        !item.product.hasSellingPlans &&
        item.variant.price.currencyCode === "SEK" &&
        Number.isFinite(item.variant.price.amount) &&
        item.variant.price.amount > 0,
    ),
  );
}

/** Operations approves identity and copy; current Shopify prices and stock win. */
export function applyManagedProduct(
  found: Product,
  definition: ManagedProduct,
  version: number,
  salesOpen: boolean,
): Product {
  if (found.id !== definition.id || found.handle !== definition.handle)
    throw new CommerceError("invalid_managed_product", 503);
  const images = found.images.filter(supportedImage);
  const variants = definition.variants.flatMap((expected) => {
    const actual = found.variants.find((variant) => variant.id === expected.id);
    return actual
      ? [
          {
            ...actual,
            images: actual.images?.filter(supportedImage),
            available: supportedVariant(actual, expected),
          },
        ]
      : [];
  });
  const available =
    salesOpen &&
    found.available &&
    !found.previewOnly &&
    !found.requiresSellingPlan &&
    !found.hasSellingPlans &&
    images.length > 0 &&
    variants.some((variant) => variant.available);
  // The range price must describe approved variants, not a hidden Shopify variant.
  const prices = variants
    .map((variant) => variant.price.amount)
    .filter((amount) => Number.isFinite(amount) && amount > 0);
  return {
    ...found,
    title: definition.title,
    description: definition.description,
    included: definition.included,
    care: definition.care,
    highlights: definition.highlights,
    category: definition.category,
    boxEligible: false,
    images,
    price: {
      amount: prices.length ? Math.min(...prices) : found.price.amount,
      currencyCode: "SEK",
    },
    variants: variants.map((variant) => ({
      ...variant,
      available: available && variant.available,
    })),
    available,
    previewOnly: false,
    managedCatalog: {
      version,
      availability: definition.availability,
      delivery: definition.delivery,
    },
  };
}
