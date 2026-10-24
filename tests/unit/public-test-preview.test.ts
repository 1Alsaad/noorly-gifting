import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isPublicTestPreview, isStorefrontOpen } from "@/lib/commerce/launch";
import { GET, POST } from "@/app/api/cart/route";

describe("read-only public test preview", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NOORLY_PUBLIC_PREVIEW", "true");
    vi.stubEnv("NOORLY_STOREFRONT_OPEN", "false");
    vi.stubEnv("NEXT_PUBLIC_PRODUCT_TEST_MODE", "true");
    vi.stubEnv("NEXT_PUBLIC_COMMERCE_PROVIDER", "shopify");
  });
  afterEach(() => vi.unstubAllEnvs());

  it("allows the public preview only with every explicit closed-store safeguard", () => {
    expect(isStorefrontOpen()).toBe(false);
    expect(isPublicTestPreview()).toBe(true);
    vi.stubEnv("NEXT_PUBLIC_PRODUCT_TEST_MODE", "false");
    expect(isPublicTestPreview()).toBe(false);
    vi.stubEnv("NEXT_PUBLIC_PRODUCT_TEST_MODE", "true");
    vi.stubEnv("NOORLY_STOREFRONT_OPEN", "true");
    expect(isPublicTestPreview()).toBe(false);
    vi.stubEnv("NOORLY_STOREFRONT_OPEN", "false");
    vi.stubEnv("NOORLY_PUBLIC_PREVIEW", "false");
    expect(isPublicTestPreview()).toBe(false);
  });

  it("still refuses a cart and checkout even when browsing is enabled", async () => {
    expect(isPublicTestPreview()).toBe(true);
    const read = await GET();
    expect(read.status).toBe(200);
    expect(await read.json()).toEqual({ cart: null, storeClosed: true });

    const response = await POST(
      new Request("https://noorlynordic.com/api/cart", {
        method: "POST",
        headers: {
          origin: "https://noorlynordic.com",
          "content-type": "application/json",
        },
        body: JSON.stringify({ action: "checkout", locale: "sv" }),
      }),
    );
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "STOREFRONT_CLOSED" });
  });
});
