import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  candleSandHandle,
  teakBowlHandle,
  launchProductDefinitions,
} from "@/content/launch-catalog";
import { launchBundleHandle } from "@/content/launch-bundle";
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

function bundleProduct(): Product {
  return {
    ...product,
    id: "gid://shopify/Product/11401864249686",
    handle: launchBundleHandle,
    title: { sv: "Noorly Ljusstund", en: "Noorly Ljusstund" },
    price: { amount: 749, currencyCode: "SEK" },
    category: "box",
    requiresSellingPlan: false,
    hasSellingPlans: false,
    variants: [
      {
        ...product.variants[0],
        id: "gid://shopify/ProductVariant/56138148643158",
        sku: "NOORLY-LJUSSTUND-CSand-07",
        price: { amount: 749, currencyCode: "SEK" },
        requiresComponents: true,
        components: [
          {
            quantity: 1,
            product: {
              id: product.id,
              handle: candleSandHandle,
              title: product.title,
              requiresSellingPlan: false,
              hasSellingPlans: false,
            },
            variant: {
              ...product.variants[0],
              sku: "CSand-07",
              price: { amount: 269, currencyCode: "SEK" },
              requiresComponents: false,
            },
          },
          {
            quantity: 1,
            product: {
              id: "gid://shopify/Product/11401864216918",
              handle: teakBowlHandle,
              title: { sv: "Dekorativ teakskål", en: "Decorative teak bowl" },
              requiresSellingPlan: false,
              hasSellingPlans: false,
            },
            variant: {
              id: "gid://shopify/ProductVariant/56138148118870",
              title: "Default Title",
              sku: "TeakB-37",
              price: { amount: 550, currencyCode: "SEK" },
              available: true,
              requiresComponents: false,
            },
          },
        ],
      },
    ],
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

  it("rejects retired and unknown product handles", async () => {
    const shop = provider();
    for (const handle of [
      "noorly-ljusstund-presentset-med-glasskal-och-tva-dofter",
      "unknown-product",
    ]) {
      await expect(resolveLaunchProduct(shop, handle)).rejects.toThrow(
        "invalid_launch_product",
      );
    }
    expect(shop.getProductByHandle).not.toHaveBeenCalled();
  });

  it("limits the public cart catalogue to verified identities and disables malformed sets", async () => {
    vi.stubEnv("NOORLY_PUBLIC_PREVIEW", "true");
    const bowl = {
      ...product,
      id: "gid://shopify/Product/11401864216918",
      handle: teakBowlHandle,
    };
    const malformedKit = {
      ...product,
      id: "gid://shopify/Product/11401864249686",
      handle: launchBundleHandle,
    };
    const shop = {
      ...provider(),
      getProducts: vi
        .fn()
        .mockResolvedValue([
          product,
          bowl,
          malformedKit,
          { ...product, id: "unapproved", handle: "unapproved" },
        ]),
    };
    // The helper needs only these catalogue methods; no cart mutation is used.
    const catalogue = await getStorefrontCatalogue(shop);
    expect(catalogue.map(({ id }) => id)).toEqual([
      product.id,
      bowl.id,
      malformedKit.id,
    ]);
    expect(catalogue[2].available).toBe(false);
    expect(catalogue[2].variants[0].available).toBe(false);
  });

  it("sells the existing native set at its authoritative price with the chosen components", async () => {
    const bundle = bundleProduct();
    const original = structuredClone(bundle);
    const resolved = await resolveLaunchProduct(
      provider(bundle),
      launchBundleHandle,
    );
    expect(resolved.purchasable).toBe(true);
    expect(resolved.product.price.amount).toBe(749);
    expect(resolved.product.variants[0].components).toEqual(
      original.variants[0].components,
    );
    expect(bundle).toEqual(original);

    vi.stubEnv("NOORLY_PUBLIC_PREVIEW", "true");
    const catalogue = await getStorefrontCatalogue({
      name: "shopify",
      getProducts: vi.fn().mockResolvedValue([bundle]),
    });
    expect(catalogue[0].available).toBe(true);
    expect(catalogue[0].variants[0].id).toBe(bundle.variants[0].id);
  });

  it("supports the real unscented set while preserving its different price", async () => {
    const bundle = bundleProduct();
    bundle.price.amount = 699;
    const variant = bundle.variants[0];
    variant.id = "gid://shopify/ProductVariant/56138148413782";
    variant.sku = "NOORLY-LJUSSTUND-CSand-11";
    variant.price.amount = 699;
    variant.components![0].variant = {
      ...variant.components![0].variant,
      id: "gid://shopify/ProductVariant/55883112087894",
      sku: "CSand-11",
      price: { amount: 219, currencyCode: "SEK" },
    };
    const resolved = await resolveLaunchProduct(
      provider(bundle),
      launchBundleHandle,
    );
    expect(resolved.purchasable).toBe(true);
    expect(resolved.product.variants[0].price.amount).toBe(699);
    expect(resolved.product.variants[0].components![0].variant.sku).toBe(
      "CSand-11",
    );
  });

  it.each([
    "missing-bowl",
    "extra-component",
    "wrong-component-quantity",
    "wrong-sand-colour",
    "wrong-sand-sku",
    "wrong-bowl",
    "wrong-component-product",
    "unknown-parent-variant",
    "standalone-parent",
    "nested-component",
    "selling-plan-component",
    "unavailable-component",
    "invalid-component-price",
  ])(
    "blocks a set with %s on both the page and cart catalogue",
    async (failure) => {
      const bundle = bundleProduct();
      const variant = bundle.variants[0];
      const components = variant.components!;
      if (failure === "missing-bowl") components.pop();
      if (failure === "extra-component") components.push(components[0]);
      if (failure === "wrong-component-quantity") components[0].quantity = 2;
      if (failure === "wrong-sand-colour")
        components[0].variant.id =
          "gid://shopify/ProductVariant/55883112087894";
      if (failure === "wrong-sand-sku") components[0].variant.sku = "CSand-11";
      if (failure === "wrong-bowl")
        components[1].variant.id = "gid://shopify/ProductVariant/999";
      if (failure === "wrong-component-product")
        components[0].product.id = "gid://shopify/Product/999";
      if (failure === "unknown-parent-variant")
        variant.id = "gid://shopify/ProductVariant/999";
      if (failure === "standalone-parent") variant.requiresComponents = false;
      if (failure === "nested-component")
        components[0].variant.requiresComponents = true;
      if (failure === "selling-plan-component")
        components[0].product.hasSellingPlans = true;
      if (failure === "unavailable-component")
        components[1].variant.available = false;
      if (failure === "invalid-component-price")
        components[0].variant.price.amount = Number.NaN;

      const resolved = await resolveLaunchProduct(
        provider(bundle),
        launchBundleHandle,
      );
      expect(resolved.purchasable).toBe(false);
      vi.stubEnv("NOORLY_PUBLIC_PREVIEW", "true");
      const catalogue = await getStorefrontCatalogue({
        name: "shopify",
        getProducts: vi.fn().mockResolvedValue([bundle]),
      });
      expect(catalogue[0].available).toBe(false);
      expect(catalogue[0].variants[0].available).toBe(false);
    },
  );
});
