import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockProducts } from "@/content/products";
import {
  buildBoxCartLines,
  type BoxSelection,
} from "@/features/box-builder/validation";
import { GET, POST } from "@/app/api/cart/route";

const jar = vi.hoisted(() => new Map<string, string>());
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (key: string) => (jar.has(key) ? { value: jar.get(key)! } : undefined),
  }),
}));
async function post(payload: unknown, origin = "http://localhost:3000") {
  const response = await POST(
    new Request("http://localhost:3000/api/cart", {
      method: "POST",
      headers: { origin, "content-type": "application/json" },
      body: JSON.stringify(payload),
    }),
  );
  const setCookie = response.headers.get("set-cookie");
  if (response.ok && setCookie)
    jar.set(
      "stilla_cart",
      decodeURIComponent(setCookie.split(";")[0].slice("stilla_cart=".length)),
    );
  return { response, data: await response.json() };
}
const selection: BoxSelection = {
  baseHandle: "large-box",
  signatureHandle: "winter-candle",
  extraHandles: ["forest-tea", "dark-chocolate"],
  giftMessage: "Warm wishes",
};
beforeEach(() => {
  jar.clear();
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");
  vi.stubEnv("NEXT_PUBLIC_COMMERCE_PROVIDER", "mock");
  vi.stubEnv("CART_COOKIE_SECRET", "test-secret-more-than-32-characters");
});
describe("cart API integration", () => {
  it("returns no cart until mutation and persists additions through the signed cookie", async () => {
    expect(await (await GET()).json()).toEqual({ cart: null });
    const { response, data } = await post({
      type: "add",
      lines: [{ merchandiseId: "winter-candle-default", quantity: 1 }],
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    expect(response.headers.get("set-cookie")).toContain("SameSite=lax");
    expect(data.cart.total.amount).toBe(295);
    expect(data.cart.checkoutUrl).toBeUndefined();
    expect(data.cart.id).toMatch(/^[a-f0-9]{32}$/);
    const restored = await (await GET()).json();
    expect(restored.cart.lines[0].merchandiseId).toBe("winter-candle-default");
  });
  it("rejects forged origins, oversized input, unavailable stock and incomplete bundles", async () => {
    expect(
      (
        await post(
          {
            action: "add",
            lines: [{ merchandiseId: "winter-candle-default", quantity: 1 }],
          },
          "https://untrusted.example",
        )
      ).response.status,
    ).toBe(403);
    expect(
      (
        await post({
          action: "add",
          lines: [{ merchandiseId: "winter-candle-large", quantity: 1 }],
        })
      ).response.status,
    ).toBe(400);
    expect(
      (
        await post({
          action: "add",
          lines: buildBoxCartLines(
            selection,
            mockProducts,
            "bundle_123456",
          ).slice(0, 2),
        })
      ).response.status,
    ).toBe(400);
    expect(
      (
        await post({
          action: "add",
          lines: [
            {
              merchandiseId: "winter-candle-default",
              quantity: 1,
              attributes: [{ key: "gift_message", value: "x".repeat(17000) }],
            },
          ],
        })
      ).response.status,
    ).toBe(413);
    expect(jar.size).toBe(0);
  });
  it("validates a replacement before switching carts and preserves the old box on failure", async () => {
    const bundleId = "bundle_123456";
    const added = await post({
      action: "add",
      lines: buildBoxCartLines(selection, mockProducts, bundleId),
    });
    expect(added.response.status).toBe(200);
    const original = jar.get("stilla_cart");
    const failed = await post({
      action: "replace_bundle",
      bundleId,
      lines: buildBoxCartLines(selection, mockProducts, bundleId).slice(0, 2),
    });
    expect(failed.response.status).toBe(400);
    expect(jar.get("stilla_cart")).toBe(original);
    const edited = await post({
      action: "replace_bundle",
      bundleId,
      lines: buildBoxCartLines(
        { ...selection, cardHandle: "greeting-card", giftMessage: "New words" },
        mockProducts,
        bundleId,
      ),
    });
    expect(edited.response.status).toBe(200);
    expect(edited.data.cart.lines).toHaveLength(5);
    expect(edited.data.cart.lines[0].attributes).toContainEqual({
      key: "gift_message",
      value: "New words",
    });
    expect(edited.data.cart.id).not.toBe(added.data.cart.id);
  });
  it("checks out with explicit consent attributes and clears stale consent when omitted", async () => {
    await post({
      action: "add",
      lines: [{ merchandiseId: "winter-candle-default", quantity: 1 }],
    });
    const checkout = await post({
      action: "checkout",
      locale: "en",
      attributes: [
        { key: "_stilla_analytics_consent", value: "granted" },
        {
          key: "_stilla_analytics_session",
          value: "ff9007c8-90aa-456f-a41b-d295517b53da",
        },
      ],
    });
    expect(checkout.response.status).toBe(200);
    expect(checkout.data.url).toBe("/en/mock-checkout");
    expect(checkout.data.cart.attributes).toContainEqual({
      key: "_stilla_analytics_consent",
      value: "granted",
    });
    const denied = await post({ action: "checkout", locale: "sv" });
    expect(denied.data.cart.attributes).toContainEqual({
      key: "_stilla_analytics_consent",
      value: "denied",
    });
    expect(denied.data.cart.attributes).toContainEqual({
      key: "_stilla_analytics_session",
      value: "",
    });
  });
  it("rejects oversized cookie state without replacing the current cart", async () => {
    await post({
      action: "add",
      lines: [{ merchandiseId: "winter-candle-default", quantity: 1 }],
    });
    const original = jar.get("stilla_cart");
    const lines = Array.from({ length: 7 }, (_, index) => ({
      merchandiseId: "forest-tea-default",
      quantity: 1,
      attributes: [
        { key: "gift_message", value: `${index}${"x".repeat(279)}` },
      ],
    }));
    const result = await post({ action: "add", lines });
    expect(result.response.status).toBe(400);
    expect(result.data.error).toBe("CART_STORAGE_LIMIT");
    expect(jar.get("stilla_cart")).toBe(original);
    expect((await (await GET()).json()).cart.lines).toHaveLength(1);
  });
});
