import { describe, expect, it, vi } from "vitest";
import { mockProducts } from "@/content/products";
import {
  buildBoxCartLines,
  type BoxSelection,
} from "@/features/box-builder/validation";
import { MockCommerceProvider } from "@/lib/commerce/providers/mock";
import {
  decodeMockCart,
  encodeMockCart,
} from "@/lib/commerce/providers/mock/cookie";
import {
  mapShopifyCart,
  mapShopifyProduct,
} from "@/lib/commerce/providers/shopify/mapping";
import { ShopifyCommerceProvider } from "@/lib/commerce/providers/shopify";
import {
  signCartReference,
  verifyCartReference,
} from "@/lib/commerce/cart-cookie";
import { formatMoney, sumMoney } from "@/lib/utils/money";
import { enrichCartProducts } from "@/lib/commerce/cart-presentation";
const secret = "test-secret-longer-than-thirty-two-characters";
const box: BoxSelection = {
  baseHandle: "large-box",
  signatureHandle: "winter-candle",
  extraHandles: ["forest-tea", "dark-chocolate"],
  giftMessage: "A winter hello",
};
const rawProduct = {
  id: "gid://shopify/Product/1",
  handle: "winter-candle",
  title: "Vinterljus",
  description: "Ett vinterljus.",
  availableForSale: true,
  productType: "signature",
  tags: ["season:winter", "box-eligible"],
  priceRange: { minVariantPrice: { amount: "295.00", currencyCode: "SEK" } },
  compareAtPriceRange: {
    minVariantPrice: { amount: "0.00", currencyCode: "SEK" },
  },
  images: {
    nodes: [{ url: "https://cdn.shopify.com/test.jpg", altText: "Candle" }],
  },
  variants: {
    nodes: [
      {
        id: "gid://shopify/ProductVariant/1",
        title: "Standard",
        availableForSale: true,
        price: { amount: "295.00", currencyCode: "SEK" },
      },
    ],
  },
};
describe("money", () => {
  it("formats SEK for both supported languages", () => {
    expect(formatMoney({ amount: 295, currencyCode: "SEK" }, "sv")).toMatch(
      /295\s*kr/,
    );
    expect(formatMoney({ amount: 295, currencyCode: "SEK" }, "en")).toMatch(
      /295\s*(kr|SEK)/,
    );
  });
  it("adds fractional prices in integer minor units", () => {
    expect(
      sumMoney([
        { amount: 0.1, currencyCode: "SEK" },
        { amount: 0.2, currencyCode: "SEK" },
      ]).amount,
    ).toBe(0.3);
  });
});
describe("mock commerce", () => {
  it("persists a complete cart across fresh provider instances and recalculates price", async () => {
    const first = new MockCommerceProvider(secret);
    const empty = await first.createCart();
    const cart = await first.addCartLines(empty.id, [
      { merchandiseId: "winter-candle-default", quantity: 2 },
    ]);
    const cookie = encodeMockCart(cart, secret);
    expect(cookie.length).toBeLessThan(3801);
    const fresh = new MockCommerceProvider(secret);
    const restored = await fresh.getCart(cookie);
    expect(restored?.total.amount).toBe(590);
    expect(restored?.lines[0].quantity).toBe(2);
    expect(await fresh.getCheckoutUrl(restored!.id, "en")).toBe(
      "/en/mock-checkout",
    );
  });
  it("rejects unavailable variants and quantities that exceed limits", async () => {
    const provider = new MockCommerceProvider(secret);
    const cart = await provider.createCart();
    await expect(
      provider.addCartLines(cart.id, [
        { merchandiseId: "winter-candle-large", quantity: 1 },
      ]),
    ).rejects.toThrow("unavailable_product");
    await expect(
      provider.addCartLines(cart.id, [
        { merchandiseId: "winter-candle-default", quantity: 11 },
      ]),
    ).rejects.toThrow("invalid_lines");
  });
  it("updates and removes a complete bundle when any member changes", async () => {
    const provider = new MockCommerceProvider(secret);
    const empty = await provider.createCart();
    const cart = await provider.addCartLines(
      empty.id,
      buildBoxCartLines(box, mockProducts, "bundle_test_123"),
    );
    const doubled = await provider.updateCartLines(cart.id, [
      { id: cart.lines[1].id, quantity: 2 },
    ]);
    expect(doubled.lines.every((line) => line.quantity === 2)).toBe(true);
    expect(
      (await provider.removeCartLines(cart.id, [cart.lines[0].id])).lines,
    ).toHaveLength(0);
  });
  it("rejects partial bundles submitted outside the builder", async () => {
    const provider = new MockCommerceProvider(secret);
    const cart = await provider.createCart();
    const lines = buildBoxCartLines(box, mockProducts, "bundle_test_123");
    await expect(
      provider.addCartLines(cart.id, lines.slice(0, 2)),
    ).rejects.toThrow("invalid_bundle");
  });
  it("rejects empty checkout", async () => {
    const provider = new MockCommerceProvider(secret);
    const cart = await provider.createCart();
    await expect(provider.getCheckoutUrl(cart.id)).rejects.toThrow(
      "empty_cart",
    );
  });
});
describe("cart cookies", () => {
  it("rejects tampering, expiration, oversized and malformed cookies", async () => {
    const provider = new MockCommerceProvider(secret);
    const cart = await provider.createCart();
    const token = encodeMockCart(cart, secret, 0);
    expect(decodeMockCart(token, secret, 1)).not.toBeNull();
    expect(decodeMockCart(token, secret, 604801000)).toBeNull();
    expect(decodeMockCart(token, "other-secret", 1)).toBeNull();
    expect(decodeMockCart(`${token}x`, secret, 1)).toBeNull();
    expect(decodeMockCart("a".repeat(3801), secret)).toBeNull();
    expect(decodeMockCart("abc.def.extra", secret)).toBeNull();
  });
  it("signs Shopify references without accepting a changed key", () => {
    const token = signCartReference(
      "gid://shopify/Cart/example?key=private",
      secret,
    );
    expect(verifyCartReference(token, secret)).toContain("gid://shopify/Cart");
    expect(verifyCartReference(token, "wrong")).toBeNull();
  });
});
describe("Shopify mapping", () => {
  it("maps currency, inventory, categories, tags and translated copy", () => {
    const product = mapShopifyProduct(rawProduct, {
      ...rawProduct,
      title: "Winter Candle",
      description: "A winter candle.",
    });
    expect(product.title).toEqual({ sv: "Vinterljus", en: "Winter Candle" });
    expect(product.price.amount).toBe(295);
    expect(product.category).toBe("signature");
    expect(product.boxEligible).toBe(true);
    expect(product.seasons).toEqual(["winter"]);
    expect(product.compareAtPrice).toBeUndefined();
  });
  it("rejects unsupported currencies instead of mislabelling them SEK", () => {
    expect(() =>
      mapShopifyProduct({
        ...rawProduct,
        priceRange: {
          minVariantPrice: { amount: "10.00", currencyCode: "EUR" },
        },
      }),
    ).toThrow();
  });
  it("maps hosted checkout and complete cart lines", () => {
    const cart = mapShopifyCart({
      id: "cart",
      checkoutUrl: "https://test.myshopify.com/checkouts/test",
      totalQuantity: 1,
      attributes: [],
      cost: { subtotalAmount: { amount: "295", currencyCode: "SEK" } },
      lines: {
        nodes: [
          {
            id: "line",
            quantity: 1,
            attributes: [{ key: "gift_message", value: "Plain text" }],
            merchandise: {
              ...rawProduct.variants.nodes[0],
              product: rawProduct,
            },
          },
        ],
      },
    });
    expect(cart.total.amount).toBe(295);
    expect(cart.lines[0].product.handle).toBe("winter-candle");
    expect(cart.lines[0].attributes[0].value).toBe("Plain text");
    const translated = mapShopifyProduct(rawProduct, {
      ...rawProduct,
      title: "Winter Candle",
    });
    expect(
      enrichCartProducts(cart, [translated]).lines[0].product.title.en,
    ).toBe("Winter Candle");
    expect(enrichCartProducts(cart, []).lines[0].variant.available).toBe(false);
  });
  it("sends real GraphQL operations with server credentials and fails on provider errors", async () => {
    const fetcher = vi.fn<typeof fetch>().mockImplementation(
      async () =>
        new Response(
          JSON.stringify({
            data: {
              products: {
                nodes: [rawProduct],
                pageInfo: { hasNextPage: false, endCursor: null },
              },
            },
          }),
        ),
    );
    const provider = new ShopifyCommerceProvider(
      {
        domain: "example.myshopify.com",
        token: "test-token",
        apiVersion: "2026-07",
      },
      fetcher,
    );
    expect((await provider.getProducts())[0].handle).toBe("winter-candle");
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher.mock.calls[0][0]).toBe(
      "https://example.myshopify.com/api/2026-07/graphql.json",
    );
    const options = fetcher.mock.calls[0][1]!;
    expect(JSON.parse(options.body as string).query).toContain(
      "query Products",
    );
    expect(options.cache).toBe("no-store");
    fetcher.mockImplementation(
      async () =>
        new Response(
          JSON.stringify({ errors: [{ message: "private provider detail" }] }),
        ),
    );
    await expect(provider.getProducts()).rejects.toThrow(
      "provider_request_failed",
    );
  });
});
