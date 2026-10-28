import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "@/app/api/cart/route";
import { signCartReference } from "@/lib/commerce/cart-cookie";
import { CommerceError } from "@/lib/commerce/errors";
import {
  managedCatalogFixture,
  managedShopifyFixture,
} from "../fixtures/managed-catalog";
import type { Cart, Product } from "@/types/commerce";

const { jar, provider, manifest } = vi.hoisted(() => ({
  jar: new Map<string, string>(),
  manifest: vi.fn(),
  provider: {
    name: "shopify",
    getCart: vi.fn(),
    createCart: vi.fn(),
    getProducts: vi.fn(),
    addCartLines: vi.fn(),
    removeCartLines: vi.fn(),
    updateCartAttributes: vi.fn(),
    getCheckoutUrl: vi.fn(),
    validateAvailability: vi.fn(),
  },
}));
vi.mock("@/lib/commerce", () => ({ getCommerceProvider: () => provider }));
vi.mock("@/lib/commerce/managed-catalog", async (load) => ({
  ...(await load<typeof import("@/lib/commerce/managed-catalog")>()),
  getManagedCatalog: manifest,
}));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (key: string) => (jar.has(key) ? { value: jar.get(key) } : undefined),
  }),
}));

const secret = "managed-cart-test-secret-longer-than-thirty-two";
function cartFor(product?: Product): Cart {
  return {
    id: "gid://shopify/Cart/test-managed?key=not-a-real-key",
    attributes: [],
    lines: product
      ? [
          {
            id: "line-1",
            merchandiseId: product.variants[0].id,
            product,
            variant: product.variants[0],
            quantity: 1,
            attributes: [],
          },
        ]
      : [],
    totalQuantity: product ? 1 : 0,
    total: { amount: product?.price.amount ?? 0, currencyCode: "SEK" },
  };
}
function restore(cart: Cart) {
  jar.set("stilla_cart", signCartReference(cart.id, secret));
  provider.getCart.mockResolvedValue(cart);
}
async function post(body: unknown) {
  const response = await POST(
    new Request("http://localhost:3000/api/cart", {
      method: "POST",
      headers: {
        origin: "http://localhost:3000",
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    }),
  );
  return { response, data: await response.json() };
}

beforeEach(() => {
  vi.resetAllMocks();
  jar.clear();
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("NOORLY_STOREFRONT_OPEN", "true");
  vi.stubEnv("NOORLY_PUBLIC_PREVIEW", "true");
  vi.stubEnv("NEXT_PUBLIC_PRODUCT_TEST_MODE", "false");
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");
  vi.stubEnv("NEXT_PUBLIC_COMMERCE_PROVIDER", "shopify");
  vi.stubEnv("SHOPIFY_STORE_DOMAIN", "managed-test.myshopify.com");
  vi.stubEnv("SHOPIFY_STOREFRONT_ACCESS_TOKEN", "mocked-token");
  vi.stubEnv("CART_COOKIE_SECRET", secret);
  manifest.mockResolvedValue(managedCatalogFixture());
  provider.getProducts.mockResolvedValue([managedShopifyFixture()]);
  provider.createCart.mockResolvedValue(cartFor());
  provider.validateAvailability.mockResolvedValue({
    available: true,
    unavailableVariantIds: [],
  });
});
afterEach(() => vi.unstubAllEnvs());

describe("managed product replacement through cart and checkout", () => {
  it("adds and checks out the approved variant at Shopify's current price", async () => {
    const product = managedShopifyFixture();
    product.price.amount = 379;
    product.variants[0].price.amount = 379;
    const cart = cartFor(product);
    provider.getProducts.mockResolvedValue([product]);
    provider.addCartLines.mockResolvedValue(cart);
    const added = await post({
      action: "add",
      lines: [{ merchandiseId: product.variants[0].id, quantity: 1 }],
    });
    expect(added.response.status).toBe(200);
    expect(added.data.cart.lines[0].product.title.sv).toBe("Ullhalsduk");
    expect(added.data.cart.lines[0].variant.price.amount).toBe(379);
    expect(provider.addCartLines).toHaveBeenCalledWith(cart.id, [
      { merchandiseId: product.variants[0].id, quantity: 1 },
    ]);
    restore(cart);
    provider.updateCartAttributes.mockResolvedValue(cart);
    provider.getCheckoutUrl.mockResolvedValue(
      "https://checkout.noorlynordic.com/checkouts/test",
    );
    const checkout = await post({ action: "checkout", locale: "sv" });
    expect(checkout.response.status).toBe(200);
    expect(checkout.data.cart.lines[0].merchandiseId).toBe(
      product.variants[0].id,
    );
    expect(checkout.data.cart.total.amount).toBe(379);
  });

  it("keeps a retired cart line visible but prevents its checkout after a catalog change", async () => {
    const product = managedShopifyFixture();
    const cart = cartFor(product);
    restore(cart);
    manifest.mockResolvedValue({
      ...managedCatalogFixture(),
      version: 3,
      products: [],
    });
    const read = await GET();
    const body = await read.json();
    expect(body.cart.lines).toHaveLength(1);
    expect(body.cart.lines[0].variant.available).toBe(false);
    const checkout = await post({ action: "checkout", locale: "sv" });
    expect(checkout.response.ok).toBe(false);
    expect(provider.getCheckoutUrl).not.toHaveBeenCalled();
    provider.removeCartLines.mockResolvedValue(cartFor());
    const removed = await post({ action: "remove", lineIds: ["line-1"] });
    expect(removed.response.status).toBe(200);
    expect(removed.data.cart.lines).toEqual([]);
  });

  it("rejects changed SKU identity or out-of-stock variants before adding", async () => {
    const product = managedShopifyFixture();
    product.variants[0].sku = "DIFFERENT-SKU";
    provider.getProducts.mockResolvedValue([product]);
    const result = await post({
      action: "add",
      lines: [{ merchandiseId: product.variants[0].id, quantity: 1 }],
    });
    expect(result.response.ok).toBe(false);
    expect(provider.addCartLines).not.toHaveBeenCalled();
  });

  it("does not issue a checkout URL when operations cannot authenticate the catalog", async () => {
    restore(cartFor(managedShopifyFixture()));
    manifest.mockRejectedValue(
      new CommerceError("managed_catalog_invalid", 503),
    );
    const result = await post({ action: "checkout", locale: "sv" });
    expect(result.response.status).toBe(503);
    expect(provider.updateCartAttributes).not.toHaveBeenCalled();
    expect(provider.getCheckoutUrl).not.toHaveBeenCalled();
  });
});
