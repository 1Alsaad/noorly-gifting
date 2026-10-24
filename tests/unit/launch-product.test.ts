import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { launchBundleHandle } from "@/content/launch-bundle";
import { resolveLaunchProduct } from "@/lib/commerce/launch-product";
import type { Product } from "@/types/commerce";

const product: Product = {
  id: "gid://shopify/Product/11401864249686",
  handle: launchBundleHandle,
  title: { sv: "Ljusstund från Shopify", en: "Ljusstund from Shopify" },
  description: { sv: "Bekräftat innehåll.", en: "Confirmed contents." },
  price: { amount: 749, currencyCode: "SEK" },
  images: [{ url: "https://cdn.shopify.com/real-kit.jpg", alt: "The kit" }],
  variants: [
    {
      id: "gid://shopify/ProductVariant/56138148413782",
      title: "Presentset",
      price: { amount: 749, currencyCode: "SEK" },
      available: true,
    },
  ],
  available: true,
  category: "box",
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
    expect(shop.getProductByHandle).toHaveBeenCalledWith(launchBundleHandle);
    expect(resolved.purchasable).toBe(true);
    expect(resolved.product.price.amount).toBe(749);
    expect(resolved.product.images).toEqual(product.images);
    expect(resolved.product.variants[0].id).toBe(product.variants[0].id);
    expect(resolved.product.previewOnly).toBe(false);
  });

  it.each([
    ["NOORLY_STOREFRONT_OPEN", "false"],
    ["NEXT_PUBLIC_PRODUCT_TEST_MODE", "true"],
  ])(
    "preserves real photographs but disables every variant when %s=%s",
    async (key, value) => {
      vi.stubEnv(key, value);
      const resolved = await resolveLaunchProduct(provider());
      expect(resolved.purchasable).toBe(false);
      expect(resolved.product.images).toEqual(product.images);
      expect(resolved.product.available).toBe(false);
      expect(
        resolved.product.variants.every((variant) => !variant.available),
      ).toBe(true);
    },
  );

  it.each([
    { available: false },
    { images: [] },
    { images: [{ url: "https://unapproved.example/kit.jpg", alt: "Unknown" }] },
    { requiresSellingPlan: true },
    { hasSellingPlans: true },
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
});
