import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "@/app/api/cart/route";
import { launchProductDefinitions } from "@/content/launch-catalog";
import type { Cart, Product } from "@/types/commerce";

const { jar, provider } = vi.hoisted(() => ({
  jar: new Map<string, string>(),
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
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (key: string) => (jar.has(key) ? { value: jar.get(key)! } : undefined),
  }),
}));

const sand: Product = {
  ...launchProductDefinitions[0].preview,
  id: "gid://shopify/Product/11382623273302",
  price: { amount: 249, currencyCode: "SEK" },
  available: true,
  previewOnly: false,
  variants: [
    {
      id: "gid://shopify/ProductVariant/55883112317270",
      title: "Gammalrosa · Maison de Roses",
      sku: "CSand-07",
      price: { amount: 249, currencyCode: "SEK" },
      available: true,
      requiresComponents: false,
    },
  ],
};
const bowl: Product = {
  ...launchProductDefinitions[1].preview,
  id: "gid://shopify/Product/11401864216918",
  price: { amount: 550, currencyCode: "SEK" },
  available: true,
  previewOnly: false,
  variants: [
    {
      id: "gid://shopify/ProductVariant/56138148118870",
      title: "Default Title",
      sku: "TeakB-37",
      price: { amount: 550, currencyCode: "SEK" },
      available: true,
      requiresComponents: false,
    },
  ],
};
function cartFor(items: { product: Product; quantity: number }[]): Cart {
  return {
    id: "gid://shopify/Cart/standalone-check?key=local-test-only",
    attributes: [],
    lines: items.map(({ product, quantity }) => ({
      id: `line-${product.handle}`,
      merchandiseId: product.variants[0].id,
      product,
      variant: product.variants[0],
      quantity,
      attributes: [],
    })),
    totalQuantity: items.reduce((sum, { quantity }) => sum + quantity, 0),
    total: {
      amount: items.reduce(
        (sum, { product, quantity }) => sum + product.price.amount * quantity,
        0,
      ),
      currencyCode: "SEK",
    },
  };
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
  const cookie = response.headers.get("set-cookie");
  if (response.ok && cookie)
    jar.set(
      "stilla_cart",
      decodeURIComponent(cookie.split(";")[0].slice("stilla_cart=".length)),
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
  vi.stubEnv("SHOPIFY_STORE_DOMAIN", "standalone-test.myshopify.com");
  vi.stubEnv("SHOPIFY_STOREFRONT_ACCESS_TOKEN", "local-mocked-provider");
  vi.stubEnv(
    "CART_COOKIE_SECRET",
    "standalone-cart-test-secret-more-than-32-characters",
  );
  provider.createCart.mockResolvedValue(cartFor([]));
  provider.getProducts.mockResolvedValue([sand, bowl]);
  provider.validateAvailability.mockResolvedValue({
    available: true,
    unavailableVariantIds: [],
  });
});
afterEach(() => vi.unstubAllEnvs());

describe("independent candle-sand and bowl checkout", () => {
  it("keeps the chosen colour and bowl as separate priced lines through checkout", async () => {
    const cart = cartFor([
      { product: sand, quantity: 2 },
      { product: bowl, quantity: 1 },
    ]);
    const lines = [
      { merchandiseId: sand.variants[0].id, quantity: 2 },
      { merchandiseId: bowl.variants[0].id, quantity: 1 },
    ];
    provider.addCartLines.mockResolvedValue(cart);
    const added = await post({ action: "add", lines });
    expect(added.response.status).toBe(200);
    expect(provider.addCartLines).toHaveBeenCalledWith(cart.id, lines);
    expect(added.data.cart.total.amount).toBe(1048);
    expect(
      added.data.cart.lines.map((line: Cart["lines"][number]) => [
        line.variant.sku,
        line.quantity,
        line.variant.price.amount,
        line.attributes,
      ]),
    ).toEqual([
      ["CSand-07", 2, 249, []],
      ["TeakB-37", 1, 550, []],
    ]);
    expect(added.data.cart.checkoutUrl).toBeUndefined();
    provider.getCart.mockResolvedValue(cart);
    provider.updateCartAttributes.mockResolvedValue(cart);
    provider.getCheckoutUrl.mockResolvedValue(
      "https://checkout.noorlynordic.com/checkouts/local-test",
    );
    const checkout = await post({ action: "checkout", locale: "sv" });
    expect(checkout.response.status).toBe(200);
    expect(checkout.data.url).toBe(
      "https://checkout.noorlynordic.com/checkouts/local-test",
    );
    expect(checkout.data.cart.lines).toHaveLength(2);
    expect(provider.getCheckoutUrl).toHaveBeenCalledWith(cart.id, "sv");
  });

  it("removes the bowl without removing or changing the selected sand", async () => {
    const both = cartFor([
      { product: sand, quantity: 2 },
      { product: bowl, quantity: 1 },
    ]);
    provider.addCartLines.mockResolvedValue(both);
    await post({
      action: "add",
      lines: both.lines.map(({ merchandiseId, quantity }) => ({
        merchandiseId,
        quantity,
      })),
    });
    provider.getCart.mockResolvedValue(both);
    provider.removeCartLines.mockResolvedValue(
      cartFor([{ product: sand, quantity: 2 }]),
    );
    const removed = await post({
      action: "remove",
      lineIds: [`line-${bowl.handle}`],
    });
    expect(removed.response.status).toBe(200);
    expect(provider.removeCartLines).toHaveBeenCalledWith(both.id, [
      `line-${bowl.handle}`,
    ]);
    expect(removed.data.cart.lines).toHaveLength(1);
    expect(removed.data.cart.lines[0].variant.sku).toBe("CSand-07");
    expect(removed.data.cart.total.amount).toBe(498);
  });

  it("rejects the retired combined set even when Shopify still publishes it", async () => {
    const retired = {
      ...bowl,
      id: "gid://shopify/Product/11401864249686",
      handle: "noorly-ljusstund-teakskal-och-ljussand",
      variants: [
        {
          ...bowl.variants[0],
          id: "gid://shopify/ProductVariant/56138148413782",
        },
      ],
    };
    provider.getProducts.mockResolvedValue([sand, bowl, retired]);
    const result = await post({
      action: "add",
      lines: [{ merchandiseId: retired.variants[0].id, quantity: 1 }],
    });
    expect(result.response.status).toBe(400);
    expect(result.data.error).toBe("UNAVAILABLE_PRODUCT");
    expect(provider.addCartLines).not.toHaveBeenCalled();
    expect(provider.getCheckoutUrl).not.toHaveBeenCalled();
  });

  it("checks actual availability before adding a separately sold item", async () => {
    provider.validateAvailability.mockResolvedValue({
      available: false,
      unavailableVariantIds: [sand.variants[0].id],
    });
    const result = await post({
      action: "add",
      lines: [{ merchandiseId: sand.variants[0].id, quantity: 2 }],
    });
    expect(result.response.status).toBe(409);
    expect(result.data.error).toBe("UNAVAILABLE_PRODUCT");
    expect(provider.addCartLines).not.toHaveBeenCalled();
    expect(await (await GET()).json()).toEqual({ cart: null });
  });
});
