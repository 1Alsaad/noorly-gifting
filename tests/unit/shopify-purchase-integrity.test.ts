import { describe, expect, it, vi } from "vitest";
import { ShopifyCommerceProvider } from "@/lib/commerce/providers/shopify";
import { validateCart } from "@/lib/commerce/validation";
import { mockProducts } from "@/content/products";
import type { Cart } from "@/types/commerce";

const config = {
  domain: "tzwngp-h1.myshopify.com",
  token: "test-token",
  apiVersion: "2026-07",
};
const product = mockProducts[0];
const variant = product.variants[0];
const ordinaryVariant = {
  id: variant.id,
  availableForSale: true,
  quantityAvailable: 2,
  requiresComponents: false,
  components: { nodes: [], pageInfo: { hasNextPage: false } },
  product: { requiresSellingPlan: false, sellingPlanGroups: { nodes: [] } },
};
function providerWithVariant(value: unknown) {
  const fetcher = vi
    .fn<typeof fetch>()
    .mockResolvedValue(
      new Response(JSON.stringify({ data: { nodes: [value] } })),
    );
  return new ShopifyCommerceProvider(config, fetcher);
}
function cartWithPlan(): Cart {
  return {
    id: "cart",
    total: variant.price,
    totalQuantity: 1,
    attributes: [],
    checkoutUrl: "https://checkout.noorlynordic.com/checkouts/test",
    lines: [
      {
        id: "line",
        merchandiseId: variant.id,
        quantity: 1,
        attributes: [],
        product,
        variant,
        sellingPlanId: "gid://shopify/SellingPlan/1",
      },
    ],
  };
}

describe("Shopify purchase integrity", () => {
  it("keeps stock limits across repeated lines and blocks zero stock", async () => {
    const provider = providerWithVariant(ordinaryVariant);
    expect(
      (
        await provider.validateAvailability([
          { merchandiseId: variant.id, quantity: 2 },
        ])
      ).available,
    ).toBe(true);
    expect(
      (
        await providerWithVariant(ordinaryVariant).validateAvailability([
          { merchandiseId: variant.id, quantity: 2 },
          { merchandiseId: variant.id, quantity: 1 },
        ])
      ).available,
    ).toBe(false);
    expect(
      (
        await providerWithVariant({
          ...ordinaryVariant,
          quantityAvailable: 0,
        }).validateAvailability([{ merchandiseId: variant.id, quantity: 1 }])
      ).available,
    ).toBe(false);
  });

  it.each([
    { requiresSellingPlan: true, sellingPlanGroups: { nodes: [] } },
    {
      requiresSellingPlan: false,
      sellingPlanGroups: { nodes: [{ name: "Pre-order" }] },
    },
    undefined,
  ])(
    "does not permit an ordinary purchase when plan eligibility is unsupported or missing",
    async (planProduct) => {
      const provider = providerWithVariant({
        ...ordinaryVariant,
        product: planProduct,
      });
      expect(
        await provider.validateAvailability([
          { merchandiseId: variant.id, quantity: 1 },
        ]),
      ).toEqual({
        available: false,
        unavailableVariantIds: [variant.id],
      });
    },
  );

  it("preserves a cart plan restriction even if the current product no longer advertises it", async () => {
    const cart = cartWithPlan();
    const provider = providerWithVariant(ordinaryVariant);
    expect((await provider.validateAvailability(cart.lines)).available).toBe(
      false,
    );
    vi.spyOn(provider, "getCart").mockResolvedValue(cart);
    await expect(provider.getCheckoutUrl(cart.id)).rejects.toMatchObject({
      code: "unsupported_purchase_option",
      status: 409,
    });
    expect(() => validateCart(cart, [product])).toThrow(
      "unsupported_purchase_option",
    );
    expect(() =>
      validateCart(cart, [product], { allowUnsupportedPurchaseOptions: true }),
    ).not.toThrow();
  });
});
