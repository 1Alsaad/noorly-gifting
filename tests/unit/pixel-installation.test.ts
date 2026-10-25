import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { saveConsent } from "@/lib/analytics/consent";
import type { Cart } from "@/types/commerce";

const requests = () =>
  vi.mocked(fetch).mock.calls.map((call) => JSON.parse(String(call[1]?.body)));
function locationAt(
  path = "/sv/products/candle-sand?email=private@example.com#private",
) {
  vi.stubGlobal("location", new URL(`https://noorlynordic.com${path}`));
}
beforeEach(() => {
  vi.resetModules();
  localStorage.clear();
  delete window.fbq;
  delete window._fbq;
  document.querySelector("script[data-noorly-meta]")?.remove();
  vi.stubEnv("NEXT_PUBLIC_META_PIXEL_ID", "511816900240916");
  vi.stubEnv("NEXT_PUBLIC_COMMERCE_PROVIDER", "shopify");
  vi.stubEnv("NEXT_PUBLIC_PRODUCT_TEST_MODE", "false");
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockImplementation(() =>
        Promise.resolve(new Response("", { status: 200 })),
      ),
  );
  locationAt();
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("consented Shopify storefront analytics", () => {
  it("sends nothing and stores no tracking identity until analytics consent", async () => {
    const analytics = await import("@/lib/analytics/shopify");
    saveConsent({ analytics: false, marketing: true });
    expect(analytics.trackShopifyPageView("/sv/products/candle-sand")).toBe(
      false,
    );
    expect(fetch).not.toHaveBeenCalled();
    expect(localStorage.getItem("noorly-shopify-analytics-v1")).toBeNull();
  });
  it("uses the verified shop, sanitizes URLs, separates page/product events and suppresses duplicate page notifications", async () => {
    const analytics = await import("@/lib/analytics/shopify");
    saveConsent({ analytics: true, marketing: false });
    expect(analytics.trackShopifyPageView("/sv/products/candle-sand")).toBe(
      true,
    );
    expect(analytics.trackShopifyPageView("/sv/products/candle-sand")).toBe(
      false,
    );
    expect(
      analytics.trackShopifyProductView(
        "gid://shopify/Product/11382623273302",
        "candle-sand",
        349,
      ),
    ).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(2);
    const events = requests().flatMap((batch) => batch.events);
    expect(
      events.map((event) => event.payload.event_name).filter(Boolean),
    ).toEqual(["page_rendered", "product_page_rendered"]);
    for (const event of events)
      expect(event.payload.shop_id ?? event.payload.shopId).toBe(107353178454);
    expect(JSON.stringify(events)).not.toMatch(
      /private@example|#private|email=/,
    );
    expect(events.at(-1).payload).toMatchObject({
      total_value: 349,
      analytics_allowed: true,
      marketing_allowed: false,
      sale_of_data_allowed: false,
    });
    expect(document.cookie).not.toMatch(/_shopify_/);
  });
  it("revokes and deletes only its own IDs; never replays refused visits", async () => {
    const analytics = await import("@/lib/analytics/shopify");
    saveConsent({ analytics: true, marketing: false });
    analytics.trackShopifyPageView("/sv/products/candle-sand");
    const first = localStorage.getItem("noorly-shopify-analytics-v1");
    saveConsent({ analytics: false, marketing: false });
    analytics.updateShopifyAnalyticsConsent();
    expect(localStorage.getItem("noorly-shopify-analytics-v1")).toBeNull();
    locationAt("/sv/shop");
    expect(analytics.trackShopifyPageView("/sv/shop")).toBe(false);
    saveConsent({ analytics: true, marketing: false });
    locationAt("/sv");
    expect(analytics.trackShopifyPageView("/sv")).toBe(true);
    expect(localStorage.getItem("noorly-shopify-analytics-v1")).not.toBe(first);
    expect(JSON.stringify(requests())).not.toContain(
      "https://noorlynordic.com/sv/shop",
    );
  });
  it("excludes previews, admin and mock products and tolerates transport errors", async () => {
    const analytics = await import("@/lib/analytics/shopify");
    saveConsent({ analytics: true, marketing: true });
    expect(analytics.trackShopifyPageView("/admin-preview")).toBe(false);
    expect(
      analytics.trackShopifyProductView("mock-id", "candle-sand", 349),
    ).toBe(false);
    vi.stubEnv("NEXT_PUBLIC_COMMERCE_PROVIDER", "mock");
    expect(analytics.trackShopifyPageView("/sv/products/candle-sand")).toBe(
      false,
    );
    vi.stubEnv("NEXT_PUBLIC_COMMERCE_PROVIDER", "shopify");
    vi.mocked(fetch).mockRejectedValue(new Error("offline"));
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() =>
      analytics.trackShopifyPageView("/sv/products/candle-sand"),
    ).not.toThrow();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
});

const id = "gid://shopify/ProductVariant/55883112120662";
const cart = {
  id: "public-hashed-cart",
  attributes: [{ key: "note", value: "PRIVATE" }],
  total: { amount: 998, currencyCode: "SEK" },
  totalQuantity: 3,
  lines: [
    {
      id: "line",
      merchandiseId: id,
      quantity: 2,
      attributes: [],
      product: {
        id: "gid://shopify/Product/11382623273302",
        handle: "candle-sand",
      },
      variant: { id, price: { amount: 449, currencyCode: "SEK" } },
    },
  ],
} as unknown as Cart;

describe("Meta successful cart additions", () => {
  it("reports only added units and their real SEK value, never cart/order/checkout secrets", async () => {
    const { trackMetaAddToCart } = await import("@/lib/analytics/meta-cart");
    const input = [{ merchandiseId: id, quantity: 2 }];
    expect(trackMetaAddToCart(cart, input)).toBe(false);
    saveConsent({ analytics: false, marketing: true });
    expect(trackMetaAddToCart(cart, input)).toBe(true);
    const event = window.fbq!.queue.find((call) => call[2] === "AddToCart");
    expect(event?.[3]).toMatchObject({
      value: 898,
      currency: "SEK",
      num_items: 2,
      contents: [{ id: "candle-sand", quantity: 2, item_price: 449 }],
    });
    expect(JSON.stringify(event)).not.toMatch(
      /PRIVATE|public-hashed-cart|Purchase/,
    );
  });
  it("does not count failed, adjusted, unknown or zero additions or revoked consent", async () => {
    const { trackMetaAddToCart } = await import("@/lib/analytics/meta-cart");
    saveConsent({ analytics: true, marketing: true });
    expect(
      trackMetaAddToCart(undefined, [{ merchandiseId: id, quantity: 1 }]),
    ).toBe(false);
    expect(
      trackMetaAddToCart(
        { ...cart, warnings: [{ code: "adjusted", message: "stock" }] },
        [{ merchandiseId: id, quantity: 1 }],
      ),
    ).toBe(false);
    expect(trackMetaAddToCart(cart, [{ merchandiseId: id, quantity: 0 }])).toBe(
      false,
    );
    expect(
      trackMetaAddToCart(cart, [{ merchandiseId: "mock", quantity: 1 }]),
    ).toBe(false);
    expect(trackMetaAddToCart(cart, [{ merchandiseId: id, quantity: 3 }])).toBe(
      false,
    );
    saveConsent({ analytics: true, marketing: false });
    expect(trackMetaAddToCart(cart, [{ merchandiseId: id, quantity: 1 }])).toBe(
      false,
    );
    expect(window.fbq).toBeUndefined();
  });
});
