import { describe, expect, it, vi } from "vitest";
import {
  mapShopifyCart,
  mapShopifyProduct,
} from "@/lib/commerce/providers/shopify/mapping";
import { ShopifyCommerceProvider } from "@/lib/commerce/providers/shopify";
import { validateCart, validateIncomingLines } from "@/lib/commerce/validation";
import { supportsStandardPurchase } from "@/lib/commerce/purchase-options";

const rawProduct = {
  id: "gid://shopify/Product/1",
  handle: "candle-sand",
  title: "Ljussand",
  description: "F�rberedelse",
  availableForSale: true,
  productType: "signature",
  tags: [],
  requiresSellingPlan: false,
  sellingPlanGroups: { nodes: [] as { id: string }[] },
  priceRange: { minVariantPrice: { amount: "249", currencyCode: "SEK" } },
  images: { nodes: [] },
  variants: {
    nodes: Array.from({ length: 11 }, (_, i) => ({
      id: `gid://shopify/ProductVariant/${i + 1}`,
      title: `Variant ${i + 1}`,
      sku: `CSand-${String(i + 1).padStart(2, "0")}`,
      availableForSale: true,
      price: { amount: i === 10 ? "199" : "249", currencyCode: "SEK" },
      image: {
        url: `https://cdn.shopify.com/variant-${i + 1}.jpg`,
        altText: `P�se ${i + 1}`,
      },
      selectedOptions: [{ name: "F�rg & doft", value: `Variant ${i + 1}` }],
    })),
  },
};
function rawCart(plan: string | null = null) {
  return {
    id: "cart",
    checkoutUrl: "https://example.myshopify.com/checkouts/test",
    totalQuantity: 2,
    attributes: [],
    cost: { subtotalAmount: { amount: "498", currencyCode: "SEK" } },
    lines: {
      nodes: rawProduct.variants.nodes.slice(0, 2).map((variant, i) => ({
        id: `line-${i}`,
        quantity: 1,
        attributes: [],
        sellingPlanAllocation: plan ? { sellingPlan: { id: plan } } : null,
        merchandise: { ...variant, product: rawProduct },
      })),
    },
  };
}
function provider(fetcher: typeof fetch) {
  return new ShopifyCommerceProvider(
    {
      domain: "example.myshopify.com",
      token: "test-token",
      apiVersion: "2026-07",
    },
    fetcher,
  );
}
describe("purchase readiness", () => {
  it("keeps all eleven variant SKUs, images and selected options, and both mixed-pair components", () => {
    const product = mapShopifyProduct(rawProduct);
    expect(product.variants).toHaveLength(11);
    product.variants.forEach((variant, i) => {
      expect(variant.sku).toBe(rawProduct.variants.nodes[i].sku);
      expect(variant.image?.url).toBe(rawProduct.variants.nodes[i].image.url);
      expect(variant.selectedOptions).toEqual(
        rawProduct.variants.nodes[i].selectedOptions,
      );
    });
    const cart = mapShopifyCart(rawCart());
    expect(cart.lines.map((line) => line.variant.sku)).toEqual([
      "CSand-01",
      "CSand-02",
    ]);
    expect(cart.lines.map((line) => line.quantity)).toEqual([1, 1]);
  });
  it.each([true, false])(
    "blocks both mandatory and optional selling plans (mandatory=%s)",
    (requiresSellingPlan) => {
      const product = mapShopifyProduct({
        ...rawProduct,
        requiresSellingPlan,
        sellingPlanGroups: { nodes: [{ id: "plan-group" }] },
      });
      expect(supportsStandardPurchase(product)).toBe(false);
      const cart = mapShopifyCart(rawCart());
      cart.lines[0].product = product;
      expect(() => validateCart(cart, [product])).toThrow(
        "purchase_option_not_ready",
      );
    },
  );
  it("preserves an existing plan identity and refuses checkout even if the product's current plans are gone", async () => {
    const cart = mapShopifyCart(rawCart("gid://shopify/SellingPlan/42"));
    expect(cart.lines[0].sellingPlanId).toBe("gid://shopify/SellingPlan/42");
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: { cart: rawCart("gid://shopify/SellingPlan/42") },
        }),
      ),
    );
    await expect(provider(fetcher).getCheckoutUrl("cart")).rejects.toThrow(
      "purchase_option_not_ready",
    );
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("rejects a new planned item before sending a cart mutation", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: {
            nodes: [
              {
                id: rawProduct.variants.nodes[0].id,
                availableForSale: true,
                quantityAvailable: 100,
                product: {
                  requiresSellingPlan: false,
                  sellingPlanGroups: { nodes: [{ id: "plan-group" }] },
                },
              },
            ],
          },
        }),
      ),
    );
    await expect(
      provider(fetcher).addCartLines("cart", [
        { merchandiseId: rawProduct.variants.nodes[0].id, quantity: 1 },
      ]),
    ).rejects.toThrow("purchase_option_not_ready");
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(
      JSON.parse(fetcher.mock.calls[0][1]!.body as string).query,
    ).not.toContain("mutation");
  });
  it("fails closed on missing purchase-option metadata and rejects a client-supplied plan instead of dropping it", () => {
    expect(() =>
      mapShopifyProduct({ ...rawProduct, requiresSellingPlan: undefined }),
    ).toThrow("invalid_provider_response");
    expect(() =>
      validateIncomingLines([
        {
          merchandiseId: "variant",
          quantity: 1,
          sellingPlanId: "plan",
        } as never,
      ]),
    ).toThrow("invalid_lines");
  });
});
