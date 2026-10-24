import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/cart/route";
import { signCartReference } from "@/lib/commerce/cart-cookie";
import {
  mapShopifyCart,
  mapShopifyProduct,
} from "@/lib/commerce/providers/shopify/mapping";
import type { Cart } from "@/types/commerce";
import { nativeBundleFixture } from "../fixtures/shopify-native-bundle";

const { jar, provider } = vi.hoisted(() => ({
  jar: new Map<string, string>(),
  provider: {
    name: "shopify",
    getCart: vi.fn(),
    getProducts: vi.fn(),
    addCartLines: vi.fn(),
    updateCartLines: vi.fn(),
    removeCartLines: vi.fn(),
    updateCartAttributes: vi.fn(),
    getCheckoutUrl: vi.fn(),
    validateAvailability: vi.fn(),
  },
}));
vi.mock("@/lib/commerce", () => ({ getCommerceProvider: () => provider }));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (key: string) => (jar.has(key) ? { value: jar.get(key)! } : undefined),
  }),
}));
const secret = "native-cart-test-secret-more-than-32-characters";
const warning = {
  code: "MERCHANDISE_NOT_ENOUGH_STOCK",
  message: "The kit quantity was adjusted.",
  target: "gid://shopify/CartLine/kit",
};
function cartAt(quantity: number): Cart {
  return mapShopifyCart(nativeBundleFixture(quantity).cart);
}
async function post(payload: unknown) {
  const response = await POST(
    new Request("http://localhost:3000/api/cart", {
      method: "POST",
      headers: {
        origin: "http://localhost:3000",
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    }),
  );
  return { response, data: await response.json() };
}
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("NOORLY_STOREFRONT_OPEN", "true");
  vi.stubEnv("NEXT_PUBLIC_PRODUCT_TEST_MODE", "false");
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");
  vi.stubEnv("NEXT_PUBLIC_COMMERCE_PROVIDER", "shopify");
  vi.stubEnv("SHOPIFY_STORE_DOMAIN", "native-test.myshopify.com");
  vi.stubEnv("SHOPIFY_STOREFRONT_ACCESS_TOKEN", "local-mocked-provider");
  vi.stubEnv("CART_COOKIE_SECRET", secret);
  jar.clear();
  const cart = cartAt(1);
  jar.set("stilla_cart", signCartReference(cart.id, secret));
  provider.getCart.mockResolvedValue(cart);
  provider.getProducts.mockResolvedValue([
    mapShopifyProduct(nativeBundleFixture().product),
  ]);
  provider.validateAvailability.mockResolvedValue({
    available: true,
    unavailableVariantIds: [],
  });
  provider.updateCartAttributes.mockResolvedValue(cart);
  provider.getCheckoutUrl.mockResolvedValue(
    "https://checkout.noorlynordic.com/checkouts/test",
  );
});
describe("native bundle cart API", () => {
  it("updates only the parent and waits for Shopify's scaled component quantities", async () => {
    provider.updateCartLines.mockResolvedValue(cartAt(2));
    const { response, data } = await post({
      action: "update",
      lineId: "gid://shopify/CartLine/kit",
      quantity: 2,
    });
    expect(response.status).toBe(200);
    expect(provider.updateCartLines).toHaveBeenCalledWith(cartAt(1).id, [
      { id: "gid://shopify/CartLine/kit", quantity: 2 },
    ]);
    expect(
      data.cart.lines[0].components.map(
        (line: { quantity: number }) => line.quantity,
      ),
    ).toEqual([2, 2]);
    expect(data.cart.total.amount).toBe(1598);
  });

  it("returns the authoritative zero-stock warning cart but refuses its checkout", async () => {
    const adjusted = { ...cartAt(0), warnings: [warning] };
    provider.addCartLines.mockResolvedValue(adjusted);
    const added = await post({
      action: "add",
      lines: [{ merchandiseId: nativeBundleFixture().variant.id, quantity: 1 }],
    });
    expect(added.response.status).toBe(200);
    expect(added.data.cart.warnings).toEqual([warning]);
    expect(added.data.cart.lines[0].quantity).toBe(0);
    expect(added.data.cart.checkoutUrl).toBeUndefined();
    provider.getCart.mockResolvedValue(cartAt(0));
    const checkout = await post({ action: "checkout", locale: "en" });
    expect(checkout.response.status).toBe(400);
    expect(checkout.data.error).toBe("UNAVAILABLE_PRODUCT");
    expect(provider.getCheckoutUrl).not.toHaveBeenCalled();
  });

  it("requires review when a checkout mutation changes stock and permits a later clean checkout", async () => {
    provider.getCart.mockResolvedValue(cartAt(2));
    provider.updateCartAttributes.mockResolvedValue({
      ...cartAt(1),
      warnings: [warning],
    });
    const changed = await post({ action: "checkout", locale: "en" });
    expect(changed.response.status).toBe(200);
    expect(changed.data.reviewRequired).toBe(true);
    expect(changed.data.url).toBeUndefined();
    expect(changed.data.cart.lines[0].quantity).toBe(1);
    expect(provider.getCheckoutUrl).not.toHaveBeenCalled();
    provider.getCart.mockResolvedValue(cartAt(1));
    provider.updateCartAttributes.mockResolvedValue(cartAt(1));
    const reviewed = await post({ action: "checkout", locale: "en" });
    expect(reviewed.response.status).toBe(200);
    expect(reviewed.data.url).toBe(
      "https://checkout.noorlynordic.com/checkouts/test",
    );
    expect(provider.getCheckoutUrl).toHaveBeenCalledOnce();
  });

  it("does not allow removing an individual component from a complete kit", async () => {
    const result = await post({
      action: "remove",
      lineIds: ["gid://shopify/CartLine/sand"],
    });
    expect(result.response.status).toBe(400);
    expect(result.data.error).toBe("LINE_NOT_FOUND");
    expect(provider.removeCartLines).not.toHaveBeenCalled();
  });
});
