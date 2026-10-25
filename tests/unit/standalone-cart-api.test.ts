import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "@/app/api/cart/route";
import { launchProductDefinitions } from "@/content/launch-catalog";
import { signCartReference } from "@/lib/commerce/cart-cookie";
import { CommerceError } from "@/lib/commerce/errors";
import { mapShopifyCart } from "@/lib/commerce/providers/shopify/mapping";
import type { Cart, Product } from "@/types/commerce";
import { nativeBundleFixture } from "../fixtures/shopify-native-bundle";

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
const secret = "standalone-cart-test-secret-more-than-32-characters";
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
function cartWithRetiredBundle(
  items: { product: Product; quantity: number }[] = [],
): Cart {
  const saved = mapShopifyCart(nativeBundleFixture().cart);
  const current = cartFor(items);
  return {
    ...saved,
    lines: [...saved.lines, ...current.lines],
    totalQuantity: saved.totalQuantity + current.totalQuantity,
    total: {
      amount: saved.total.amount + current.total.amount,
      currencyCode: "SEK",
    },
  };
}
function restoreCart(cart: Cart) {
  jar.set("stilla_cart", signCartReference(cart.id, secret));
  provider.getCart.mockResolvedValue(cart);
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
  vi.stubEnv("CART_COOKIE_SECRET", secret);
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

  it("rejects a combined set missing its native component definition", async () => {
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

  it.each([sand, bowl])(
    "adds $handle to a saved retired bundle and requires its removal before checkout",
    async (product) => {
      const saved = cartWithRetiredBundle();
      const combined = cartWithRetiredBundle([{ product, quantity: 1 }]);
      const retired = saved.lines[0];
      restoreCart(saved);
      provider.addCartLines.mockResolvedValue(combined);

      const lines = [{ merchandiseId: product.variants[0].id, quantity: 1 }];
      const added = await post({ action: "add", lines });

      expect(added.response.status).toBe(200);
      expect(provider.createCart).not.toHaveBeenCalled();
      expect(provider.addCartLines).toHaveBeenCalledWith(saved.id, lines);
      expect(provider.validateAvailability).toHaveBeenCalledWith([
        expect.objectContaining({
          merchandiseId: product.variants[0].id,
          quantity: 1,
        }),
      ]);
      expect(added.data.cart.lines).toHaveLength(2);
      expect(added.data.cart.lines[0]).toEqual({
        ...retired,
        variant: { ...retired.variant, available: false },
      });
      expect(added.data.cart.lines[1].merchandiseId).toBe(
        product.variants[0].id,
      );
      expect(added.data.cart.checkoutUrl).toBeUndefined();

      provider.getCart.mockResolvedValue(combined);
      const blocked = await post({ action: "checkout", locale: "sv" });
      expect(blocked.response.status).toBe(400);
      expect(blocked.data.error).toBe("UNAVAILABLE_PRODUCT");
      expect(provider.updateCartAttributes).not.toHaveBeenCalled();
      expect(provider.getCheckoutUrl).not.toHaveBeenCalled();

      const current = {
        ...cartFor([{ product, quantity: 1 }]),
        id: saved.id,
      };
      provider.removeCartLines.mockResolvedValue(current);
      const removed = await post({
        action: "remove",
        lineIds: [retired.id],
      });
      expect(removed.response.status).toBe(200);
      expect(provider.removeCartLines).toHaveBeenCalledWith(saved.id, [
        retired.id,
      ]);
      expect(removed.data.cart.lines).toHaveLength(1);
      expect(removed.data.cart.lines[0].merchandiseId).toBe(
        product.variants[0].id,
      );

      provider.getCart.mockResolvedValue(current);
      provider.updateCartAttributes.mockResolvedValue(current);
      provider.getCheckoutUrl.mockResolvedValue(
        "https://checkout.noorlynordic.com/checkouts/local-test",
      );
      const checkout = await post({ action: "checkout", locale: "sv" });
      expect(checkout.response.status).toBe(200);
      expect(checkout.data.url).toBe(
        "https://checkout.noorlynordic.com/checkouts/local-test",
      );
      expect(provider.getCheckoutUrl).toHaveBeenCalledWith(saved.id, "sv");
    },
  );

  it.each([false, true])(
    "checks combined variant stock with a retired bundle (distinct attributes: %s)",
    async (distinctAttributes) => {
      const saved = cartWithRetiredBundle([{ product: sand, quantity: 2 }]);
      if (distinctAttributes)
        saved.lines[1].attributes = [{ key: "gift_message", value: "A gift" }];
      restoreCart(saved);
      provider.validateAvailability.mockImplementation(
        async (lines: Cart["lines"]) => ({
          available:
            lines
              .filter((line) => line.merchandiseId === sand.variants[0].id)
              .reduce((sum, line) => sum + line.quantity, 0) <= 3,
          unavailableVariantIds: [sand.variants[0].id],
        }),
      );

      const result = await post({
        action: "add",
        lines: [{ merchandiseId: sand.variants[0].id, quantity: 2 }],
      });

      expect(result.response.status).toBe(409);
      expect(result.data.error).toBe("UNAVAILABLE_PRODUCT");
      const checked: Cart["lines"] =
        provider.validateAvailability.mock.calls[0][0];
      expect(checked).toHaveLength(distinctAttributes ? 2 : 1);
      expect(
        checked.every((line) => line.merchandiseId === sand.variants[0].id),
      ).toBe(true);
      expect(checked.reduce((sum, line) => sum + line.quantity, 0)).toBe(4);
      expect(provider.addCartLines).not.toHaveBeenCalled();
      expect(provider.createCart).not.toHaveBeenCalled();
    },
  );

  it("still enforces the per-line quantity limit when retaining an old bundle", async () => {
    restoreCart(cartWithRetiredBundle([{ product: sand, quantity: 10 }]));

    const result = await post({
      action: "add",
      lines: [{ merchandiseId: sand.variants[0].id, quantity: 1 }],
    });

    expect(result.response.status).toBe(400);
    expect(result.data.error).toBe("UNAVAILABLE_PRODUCT");
    expect(provider.validateAvailability).not.toHaveBeenCalled();
    expect(provider.addCartLines).not.toHaveBeenCalled();
  });

  it("does not exempt an unavailable existing variant when more of it is requested", async () => {
    const soldOutSand = {
      ...sand,
      available: false,
      variants: sand.variants.map((variant) => ({
        ...variant,
        available: false,
      })),
    };
    restoreCart(cartWithRetiredBundle([{ product: soldOutSand, quantity: 1 }]));
    provider.getProducts.mockResolvedValue([soldOutSand, bowl]);

    const result = await post({
      action: "add",
      lines: [
        {
          merchandiseId: sand.variants[0].id,
          quantity: 1,
          attributes: [{ key: "gift_message", value: "Another gift" }],
        },
      ],
    });

    expect(result.response.status).toBe(400);
    expect(result.data.error).toBe("UNAVAILABLE_PRODUCT");
    expect(provider.validateAvailability).not.toHaveBeenCalled();
    expect(provider.addCartLines).not.toHaveBeenCalled();
  });

  it("does not accept a newly invalid returned line under an old line's exemption", async () => {
    restoreCart(cartWithRetiredBundle());
    provider.addCartLines.mockResolvedValue(
      cartWithRetiredBundle([{ product: sand, quantity: 0 }]),
    );

    const result = await post({
      action: "add",
      lines: [{ merchandiseId: sand.variants[0].id, quantity: 1 }],
    });

    expect(result.response.status).toBe(400);
    expect(result.data.error).toBe("UNAVAILABLE_PRODUCT");
    expect(result.response.headers.get("set-cookie")).toBeNull();
    expect(provider.createCart).not.toHaveBeenCalled();
  });

  it.each([
    ["getCart", "invalid_provider_response", 502],
    ["addCartLines", "invalid_provider_response", 502],
    ["getCart", "provider_unavailable", 503],
    ["addCartLines", "provider_unavailable", 503],
  ] as const)(
    "preserves %s failures (%s) without replacing the customer's cart",
    async (method, code, status) => {
      const saved = cartWithRetiredBundle();
      restoreCart(saved);
      const originalCookie = jar.get("stilla_cart");
      provider[method].mockRejectedValue(new CommerceError(code, status));

      const result = await post({
        action: "add",
        lines: [{ merchandiseId: sand.variants[0].id, quantity: 1 }],
      });

      expect(result.response.status).toBe(status);
      expect(result.data.error).toBe(code.toUpperCase());
      expect(result.response.headers.get("set-cookie")).toBeNull();
      expect(jar.get("stilla_cart")).toBe(originalCookie);
      expect(provider.createCart).not.toHaveBeenCalled();
      expect(provider.removeCartLines).not.toHaveBeenCalled();
      expect(provider.getCheckoutUrl).not.toHaveBeenCalled();
    },
  );
});
