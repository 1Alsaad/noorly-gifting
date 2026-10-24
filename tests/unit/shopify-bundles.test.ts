import { describe, expect, it, vi } from "vitest";
import { ShopifyCommerceProvider } from "@/lib/commerce/providers/shopify";
import {
  mapShopifyCart,
  mapShopifyProduct,
} from "@/lib/commerce/providers/shopify/mapping";
import { validateCart } from "@/lib/commerce/validation";
import { nativeBundleFixture } from "../fixtures/shopify-native-bundle";

function providerWithData(data: unknown) {
  const fetcher = vi
    .fn<typeof fetch>()
    .mockImplementation(async () => new Response(JSON.stringify({ data })));
  return new ShopifyCommerceProvider(
    {
      domain: "tzwngp-h1.myshopify.com",
      token: "test-token",
      apiVersion: "2026-07",
    },
    fetcher,
  );
}

describe("Shopify native fixed bundles", () => {
  it("fails closed with a safe category when a required bundle definition is missing", () => {
    const fixture = nativeBundleFixture();
    fixture.product.variants.nodes[0].components.nodes = [];
    expect(() => mapShopifyProduct(fixture.product)).toThrow(
      "bundle_components_unavailable",
    );
  });

  it("normalizes an invalid translated product without leaking provider fields", () => {
    const fixture = nativeBundleFixture();
    expect(() =>
      mapShopifyProduct(fixture.product, { private: "provider-detail" }),
    ).toThrow("invalid_provider_response");
  });

  it("preserves the selected component SKU, options and real photograph", () => {
    const fixture = nativeBundleFixture();
    const product = mapShopifyProduct(fixture.product);
    expect(product.variants[0]).toMatchObject({
      requiresComponents: true,
      sku: "NOORLY-LJUSSTUND-CSand-07",
      price: { amount: 799, currencyCode: "SEK" },
      components: [
        { quantity: 1, variant: { id: fixture.bowl.id, sku: "TeakB-37" } },
        {
          quantity: 1,
          product: { id: fixture.sand.product.id },
          variant: {
            id: fixture.sand.id,
            sku: "CSand-07",
            selectedOptions: fixture.sand.selectedOptions,
            images: [
              { url: fixture.sand.image.url, alt: fixture.sand.image.altText },
            ],
          },
        },
      ],
    });
  });

  it("keeps one priced parent and the allocated components without counting them twice", () => {
    const fixture = nativeBundleFixture(2);
    const cart = mapShopifyCart(fixture.cart);
    expect(cart.lines).toHaveLength(1);
    expect(cart.total).toEqual({ amount: 1598, currencyCode: "SEK" });
    expect(cart.lines[0].cost?.totalAmount.amount).toBe(1598);
    expect(
      cart.lines[0].components?.map((component) => [
        component.merchandiseId,
        component.quantity,
        component.cost.totalAmount.amount,
      ]),
    ).toEqual([
      [fixture.bowl.id, 2, 1100],
      [fixture.sand.id, 2, 498],
    ]);
    expect(() =>
      validateCart(cart, [mapShopifyProduct(fixture.product)]),
    ).not.toThrow();
    cart.lines[0].components![1].merchandiseId =
      "gid://shopify/ProductVariant/wrong-sand";
    expect(() =>
      validateCart(cart, [mapShopifyProduct(fixture.product)]),
    ).toThrow("unavailable_product");
  });

  it("refuses to turn a bundle cart response without its components into an ordinary line", () => {
    const fixture = nativeBundleFixture();
    fixture.cart.lines.nodes[0].lineComponents = [];
    expect(() => mapShopifyCart(fixture.cart)).toThrow(
      "invalid_provider_response",
    );
  });

  it("caps all eleven sand choices at the one shared bowl stock", async () => {
    const fixture = nativeBundleFixture();
    const variants = Array.from({ length: 11 }, (_, index) => ({
      ...fixture.variant,
      id: `gid://shopify/ProductVariant/kit-${index}`,
      components: {
        ...fixture.variant.components,
        nodes: [
          { quantity: 1, productVariant: fixture.bowl },
          {
            quantity: 1,
            productVariant: {
              ...fixture.sand,
              id: `gid://shopify/ProductVariant/sand-${index}`,
            },
          },
        ],
      },
    }));
    const lines = variants.map(({ id }) => ({
      merchandiseId: id,
      quantity: 2,
    }));
    expect(
      await providerWithData({ nodes: variants }).validateAvailability(
        lines.slice(0, 10),
      ),
    ).toEqual({ available: true, unavailableVariantIds: [] });
    expect(
      await providerWithData({ nodes: variants }).validateAvailability(lines),
    ).toEqual({
      available: false,
      unavailableVariantIds: variants.map(({ id }) => id),
    });
  });

  it("shares stock with standalone component purchases and uses component multiplicities", async () => {
    const fixture = nativeBundleFixture();
    const standaloneSand = {
      ...fixture.sand,
      components: { nodes: [], pageInfo: { hasNextPage: false } },
    };
    const variant = {
      ...fixture.variant,
      components: {
        ...fixture.variant.components,
        nodes: [
          { quantity: 1, productVariant: fixture.bowl },
          { quantity: 2, productVariant: fixture.sand },
        ],
      },
    };
    const result = await providerWithData({
      nodes: [variant, standaloneSand],
    }).validateAvailability([
      { merchandiseId: variant.id, quantity: 10 },
      { merchandiseId: fixture.sand.id, quantity: 1 },
    ]);
    expect(result).toEqual({
      available: false,
      unavailableVariantIds: [variant.id, fixture.sand.id],
    });
  });

  it.each([
    "zero-stock",
    "untracked-stock",
    "selling-plan",
    "nested-bundle",
    "truncated-components",
  ])(
    "blocks a native kit with %s instead of substituting stock",
    async (reason) => {
      const fixture = nativeBundleFixture();
      if (reason === "zero-stock") fixture.bowl.quantityAvailable = 0;
      if (reason === "untracked-stock") fixture.bowl.quantityAvailable = null;
      if (reason === "selling-plan")
        fixture.sand.product.sellingPlanGroups.nodes.push({
          name: "Subscription",
        });
      if (reason === "nested-bundle") fixture.bowl.requiresComponents = true;
      if (reason === "truncated-components")
        fixture.variant.components.pageInfo.hasNextPage = true;
      expect(
        await providerWithData({
          nodes: [fixture.variant],
        }).validateAvailability([
          { merchandiseId: fixture.variant.id, quantity: 1 },
        ]),
      ).toEqual({
        available: false,
        unavailableVariantIds: [fixture.variant.id],
      });
    },
  );

  it("keeps an existing component selling-plan restriction at checkout", async () => {
    const fixture = nativeBundleFixture();
    const cart = mapShopifyCart(fixture.cart);
    cart.lines[0].components![1].sellingPlanId = "gid://shopify/SellingPlan/1";
    const provider = providerWithData({ nodes: [fixture.variant] });
    vi.spyOn(provider, "getCart").mockResolvedValue(cart);
    await expect(provider.getCheckoutUrl(cart.id)).rejects.toMatchObject({
      code: "unsupported_purchase_option",
    });
    expect(() =>
      validateCart(cart, [mapShopifyProduct(fixture.product)]),
    ).toThrow("unsupported_purchase_option");
  });

  it("preserves successful mutation stock warnings and the actual adjusted quantity", async () => {
    const fixture = nativeBundleFixture(1);
    const warning = {
      code: "MERCHANDISE_NOT_ENOUGH_STOCK",
      message: "Only one complete kit remains.",
      target: fixture.cart.lines.nodes[0].id,
    };
    const provider = providerWithData({
      cartLinesAdd: { cart: fixture.cart, userErrors: [], warnings: [warning] },
    });
    const cart = await provider.addCartLines(fixture.cart.id, [
      { merchandiseId: fixture.variant.id, quantity: 2 },
    ]);
    expect(cart.lines[0].quantity).toBe(1);
    expect(cart.warnings).toEqual([warning]);
  });
});
