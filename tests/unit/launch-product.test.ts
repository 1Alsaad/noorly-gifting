import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  candleSandHandle,
  teakBowlHandle,
  launchProductDefinitions,
} from "@/content/launch-catalog";
import {
  getStorefrontCatalogue,
  resolveLaunchProduct,
} from "@/lib/commerce/launch-product";
import type { Product } from "@/types/commerce";

const product: Product = {
  id: "gid://shopify/Product/11382623273302",
  handle: candleSandHandle,
  title: { sv: "Ljussand från Shopify", en: "Candle sand from Shopify" },
  description: { sv: "Bekräftat innehåll.", en: "Confirmed contents." },
  price: { amount: 249, currencyCode: "SEK" },
  images: [
    { url: "https://cdn.shopify.com/real-sand.jpg", alt: "Candle sand" },
  ],
  variants: [
    {
      id: "gid://shopify/ProductVariant/55883112317270",
      title: "Gammalrosa · Maison de Roses",
      price: { amount: 249, currencyCode: "SEK" },
      available: true,
    },
  ],
  available: true,
  category: "signature",
  seasons: ["winter"],
  boxEligible: false,
};

function provider(value: Product | null = product) {
  return {
    name: "shopify" as const,
    getProductByHandle: vi.fn().mockResolvedValue(value),
  };
}

describe("the real launch product", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_COMMERCE_PROVIDER", "shopify");
    vi.stubEnv("NOORLY_STOREFRONT_OPEN", "true");
    vi.stubEnv("NEXT_PUBLIC_PRODUCT_TEST_MODE", "false");
  });
  afterEach(() => vi.unstubAllEnvs());

  it("uses the exact Shopify identity, media and current price when selling is open", async () => {
    const shop = provider();
    const resolved = await resolveLaunchProduct(shop);
    expect(shop.getProductByHandle).toHaveBeenCalledWith(candleSandHandle);
    expect(resolved.purchasable).toBe(true);
    expect(resolved.product.price.amount).toBe(249);
    expect(resolved.product.images).toEqual(product.images);
    expect(resolved.product.variants[0].id).toBe(product.variants[0].id);
    expect(resolved.product.previewOnly).toBe(false);
  });

  it("resolves the bowl independently using its own product and variant identity", async () => {
    const bowl = {
      ...product,
      id: "gid://shopify/Product/11401864216918",
      handle: teakBowlHandle,
      price: { amount: 550, currencyCode: "SEK" as const },
      variants: [
        {
          ...product.variants[0],
          id: "gid://shopify/ProductVariant/56138148118870",
          price: { amount: 550, currencyCode: "SEK" as const },
        },
      ],
    };
    const shop = provider(bowl);
    const resolved = await resolveLaunchProduct(shop, teakBowlHandle);
    expect(shop.getProductByHandle).toHaveBeenCalledWith(teakBowlHandle);
    expect(resolved.purchasable).toBe(true);
    expect(resolved.product.price.amount).toBe(550);
    expect(resolved.product.variants[0].id).toBe(bowl.variants[0].id);
    await expect(resolveLaunchProduct(shop)).rejects.toThrow(
      "invalid_launch_product",
    );
  });

  it.each([
    ["NOORLY_STOREFRONT_OPEN", "false"],
    ["NEXT_PUBLIC_PRODUCT_TEST_MODE", "true"],
  ])(
    "shows verified component photographs without querying stock when %s=%s",
    async (key, value) => {
      vi.stubEnv(key, value);
      const shop = provider();
      shop.getProductByHandle.mockRejectedValue(
        new Error("provider_unavailable"),
      );
      const resolved = await resolveLaunchProduct(shop);
      expect(shop.getProductByHandle).not.toHaveBeenCalled();
      expect(resolved.purchasable).toBe(false);
      expect(resolved.source).toBe("preparation");
      expect(resolved.product.images).toEqual(
        launchProductDefinitions[0].preview.images,
      );
      expect(resolved.product.available).toBe(false);
      expect(resolved.product.variants).toHaveLength(0);
    },
  );

  it.each([
    { available: false },
    { images: [] },
    { images: [{ url: "https://unapproved.example/kit.jpg", alt: "Unknown" }] },
    { requiresSellingPlan: true },
    { hasSellingPlans: true },
    { variants: [{ ...product.variants[0], requiresComponents: true }] },
    {
      variants: [
        {
          ...product.variants[0],
          price: { amount: 0, currencyCode: "SEK" as const },
        },
      ],
    },
  ])(
    "cannot sell incomplete, sold-out or selling-plan stock: %j",
    async (changes) => {
      const resolved = await resolveLaunchProduct(
        provider({ ...product, ...changes }),
      );
      expect(resolved.purchasable).toBe(false);
      expect(resolved.product.previewOnly).toBe(true);
    },
  );

  it("keeps a missing product and a mock provider non-purchasable without inventing stock", async () => {
    expect((await resolveLaunchProduct(provider(null))).source).toBe(
      "preparation",
    );
    const mock = { ...provider(), name: "mock" as const };
    const resolved = await resolveLaunchProduct(mock);
    expect(mock.getProductByHandle).not.toHaveBeenCalled();
    expect(resolved.product.variants).toHaveLength(0);
    expect(resolved.purchasable).toBe(false);
  });

  it("rejects product substitution and does not hide provider outages behind preparation copy", async () => {
    await expect(
      resolveLaunchProduct(
        provider({ ...product, id: "gid://shopify/Product/11395078259030" }),
      ),
    ).rejects.toThrow("invalid_launch_product");
    const failed = provider();
    failed.getProductByHandle.mockRejectedValue(
      new Error("provider_unavailable"),
    );
    await expect(resolveLaunchProduct(failed)).rejects.toThrow(
      "provider_unavailable",
    );
  });

  it("rejects the previous combined set and unknown product handles", async () => {
    const shop = provider();
    for (const handle of [
      "noorly-ljusstund-teakskal-och-ljussand",
      "unknown-product",
    ]) {
      await expect(resolveLaunchProduct(shop, handle)).rejects.toThrow(
        "invalid_launch_product",
      );
    }
    expect(shop.getProductByHandle).not.toHaveBeenCalled();
  });

  it("limits the public Shopify cart catalogue to exact separate-product identities", async () => {
    vi.stubEnv("NOORLY_PUBLIC_PREVIEW", "true");
    const bowl = {
      ...product,
      id: "gid://shopify/Product/11401864216918",
      handle: teakBowlHandle,
    };
    const retiredKit = {
      ...product,
      id: "gid://shopify/Product/11401864249686",
      handle: "noorly-ljusstund-teakskal-och-ljussand",
    };
    const shop = {
      ...provider(),
      getProducts: vi.fn().mockResolvedValue([product, bowl, retiredKit]),
    };
    // The helper needs only these catalogue methods; no cart mutation is used.
    const catalogue = await getStorefrontCatalogue(shop);
    expect(catalogue.map(({ id }) => id)).toEqual([product.id, bowl.id]);
  });
});
