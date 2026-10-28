import { createHmac } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  applyManagedProduct,
  fetchManagedCatalog,
  managedCatalogSchema,
  verifyManagedCatalog,
} from "@/lib/commerce/managed-catalog";
import { getStorefrontCatalogue } from "@/lib/commerce/launch-product";
import { presentCatalogProduct } from "@/content/launch-catalog";
import {
  managedCatalogFixture,
  managedShopifyFixture,
} from "../fixtures/managed-catalog";

const secret = "test-catalog-signing-secret-32-characters";
const now = Date.parse("2026-10-28T12:01:00Z");
const timestamp = String(Math.floor(now / 1000));
const sign = (body: string, time = timestamp) =>
  createHmac("sha256", secret).update(`${time}.${body}`).digest("hex");

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("authenticated managed catalog", () => {
  it("accepts one signed version with the exact product and variant identity", () => {
    const body = JSON.stringify(managedCatalogFixture());
    expect(
      verifyManagedCatalog(body, timestamp, sign(body), secret, now).version,
    ).toBe(2);
  });

  it("rejects changed content, expired signatures, invalid JSON and unknown financial fields", () => {
    const body = JSON.stringify(managedCatalogFixture());
    expect(() =>
      verifyManagedCatalog(
        body.replace("wool-scarf", "other-scarf"),
        timestamp,
        sign(body),
        secret,
        now,
      ),
    ).toThrow("managed_catalog_invalid");
    expect(() =>
      verifyManagedCatalog(body, timestamp, sign(body), secret, now + 301_000),
    ).toThrow("managed_catalog_invalid");
    expect(() =>
      verifyManagedCatalog("{", timestamp, sign("{"), secret, now),
    ).toThrow("managed_catalog_invalid");
    const extra = JSON.stringify({ ...managedCatalogFixture(), price: 1 });
    expect(() =>
      verifyManagedCatalog(extra, timestamp, sign(extra), secret, now),
    ).toThrow("managed_catalog_invalid");
  });

  it("rejects duplicate product handles and cross-product variant ownership", () => {
    const catalog = managedCatalogFixture();
    catalog.products.push({
      ...catalog.products[0],
      id: "gid://shopify/Product/9002",
    });
    expect(managedCatalogSchema.safeParse(catalog).success).toBe(false);
    catalog.products[1].handle = "another-product";
    expect(managedCatalogSchema.safeParse(catalog).success).toBe(false);
  });

  it("never fetches when disabled and never falls back when a configured service fails", async () => {
    vi.stubEnv("NOORLY_CATALOG_URL", "");
    const fetcher = vi.fn();
    expect(await fetchManagedCatalog(fetcher)).toBeNull();
    expect(fetcher).not.toHaveBeenCalled();
    vi.stubEnv("NOORLY_CATALOG_URL", "https://operations.example/api/catalog");
    vi.stubEnv("NOORLY_CATALOG_TOKEN", secret);
    vi.stubEnv("NOORLY_CATALOG_SIGNING_SECRET", secret);
    fetcher.mockRejectedValue(new Error("network unavailable"));
    await expect(fetchManagedCatalog(fetcher)).rejects.toThrow(
      "managed_catalog_unavailable",
    );
    expect(fetcher.mock.calls[0][1]).toMatchObject({
      cache: "no-store",
      redirect: "error",
      headers: { Authorization: `Bearer ${secret}` },
    });
  });

  it("rejects insecure production endpoints before disclosing authorization", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NOORLY_CATALOG_URL", "http://operations.example/api/catalog");
    vi.stubEnv("NOORLY_CATALOG_TOKEN", secret);
    vi.stubEnv("NOORLY_CATALOG_SIGNING_SECRET", secret);
    const fetcher = vi.fn();
    await expect(fetchManagedCatalog(fetcher)).rejects.toThrow();
    expect(fetcher).not.toHaveBeenCalled();
  });
});

describe("managed product integrity", () => {
  it("uses live approved variant price and inventory while replacing copy", () => {
    const catalog = managedCatalogFixture();
    const shopify = managedShopifyFixture();
    shopify.price.amount = 1; // An unapproved cheaper variant must not define the card price.
    shopify.variants.push({
      ...shopify.variants[0],
      id: "gid://shopify/ProductVariant/90012",
      sku: "UNAPPROVED",
      price: { amount: 1, currencyCode: "SEK" },
    });
    const result = applyManagedProduct(shopify, catalog.products[0], 2, true);
    expect(result.title.sv).toBe("Ullhalsduk");
    expect(result.price.amount).toBe(329);
    expect(result.variants.map((item) => item.sku)).toEqual(["SCARF-GREY"]);
    expect(result.available).toBe(true);
    expect(presentCatalogProduct(result, "sv")).toEqual(result);
    shopify.variants[0].available = false;
    expect(
      applyManagedProduct(shopify, catalog.products[0], 2, true).available,
    ).toBe(false);
  });

  it("rejects reused handles and blocks SKU substitutions, plans and missing authentic images", () => {
    const definition = managedCatalogFixture().products[0];
    const shopify = managedShopifyFixture();
    expect(() =>
      applyManagedProduct(
        { ...shopify, id: "gid://shopify/Product/9999" },
        definition,
        2,
        true,
      ),
    ).toThrow("invalid_managed_product");
    shopify.variants[0].sku = "SUBSTITUTED";
    expect(applyManagedProduct(shopify, definition, 2, true).available).toBe(
      false,
    );
    expect(
      applyManagedProduct(
        { ...managedShopifyFixture(), hasSellingPlans: true },
        definition,
        2,
        true,
      ).available,
    ).toBe(false);
    expect(
      applyManagedProduct(
        {
          ...managedShopifyFixture(),
          images: [{ url: "/old-candle.jpg", alt: "Old candle" }],
        },
        definition,
        2,
        true,
      ).available,
    ).toBe(false);
  });

  it("validates every declared bundle component and quantity", () => {
    const definition = managedCatalogFixture().products[0];
    definition.variants[0].components = [
      {
        productId: "gid://shopify/Product/8001",
        productHandle: "wool-gloves",
        variantId: "gid://shopify/ProductVariant/80011",
        sku: "GLOVES",
        quantity: 1,
      },
    ];
    const shopify = managedShopifyFixture();
    shopify.variants[0].requiresComponents = true;
    shopify.variants[0].components = [
      {
        quantity: 1,
        product: {
          id: "gid://shopify/Product/8001",
          handle: "wool-gloves",
          title: { sv: "Handskar", en: "Gloves" },
          requiresSellingPlan: false,
          hasSellingPlans: false,
        },
        variant: {
          id: "gid://shopify/ProductVariant/80011",
          sku: "GLOVES",
          title: "Grey",
          price: { amount: 100, currencyCode: "SEK" },
          available: true,
          requiresComponents: false,
        },
      },
    ];
    expect(applyManagedProduct(shopify, definition, 2, true).available).toBe(
      true,
    );
    shopify.variants[0].components[0].quantity = 2;
    expect(applyManagedProduct(shopify, definition, 2, true).available).toBe(
      false,
    );
  });

  it("atomically replaces the cart catalog, excluding retired products", async () => {
    vi.stubEnv("NOORLY_CATALOG_URL", "https://operations.example/api/catalog");
    vi.stubEnv("NOORLY_CATALOG_TOKEN", secret);
    vi.stubEnv("NOORLY_CATALOG_SIGNING_SECRET", secret);
    vi.stubEnv("NOORLY_STOREFRONT_OPEN", "true");
    vi.stubEnv("NEXT_PUBLIC_COMMERCE_PROVIDER", "shopify");
    vi.stubEnv("NEXT_PUBLIC_PRODUCT_TEST_MODE", "false");
    const body = JSON.stringify({
      ...managedCatalogFixture(),
      publishedAt: new Date().toISOString(),
    });
    const currentTime = String(Math.floor(Date.now() / 1000));
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(body, {
          headers: {
            "x-noorly-timestamp": currentTime,
            "x-noorly-signature": sign(body, currentTime),
          },
        }),
      ),
    );
    const shopify = managedShopifyFixture();
    const products = await getStorefrontCatalogue({
      name: "shopify",
      getProducts: async () => [
        shopify,
        { ...shopify, id: "gid://shopify/Product/1", handle: "old-candle" },
      ],
    });
    expect(products.map((product) => product.handle)).toEqual(["wool-scarf"]);
    expect(products[0].variants[0].price.amount).toBe(329);
  });
});
