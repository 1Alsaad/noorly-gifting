import { describe, expect, it, vi } from "vitest";
import { mockProducts } from "@/content/products";
import { ShopifyCommerceProvider } from "@/lib/commerce/providers/shopify";
import type { Cart } from "@/types/commerce";

function availableCheckout(checkoutUrl: string) {
  const product = mockProducts[0];
  const variant = product.variants[0];
  const cart: Cart = {
    id: "cart",
    lines: [
      {
        id: "line",
        merchandiseId: variant.id,
        product,
        variant,
        quantity: 1,
        attributes: [],
      },
    ],
    total: variant.price,
    totalQuantity: 1,
    attributes: [],
    checkoutUrl,
  };
  const provider = new ShopifyCommerceProvider({
    domain: "tzwngp-h1.myshopify.com",
    token: "test-token",
    apiVersion: "2026-07",
  });
  vi.spyOn(provider, "getCart").mockResolvedValue(cart);
  const availability = vi
    .spyOn(provider, "validateAvailability")
    .mockResolvedValue({ available: true, unavailableVariantIds: [] });
  return { provider, availability };
}

describe("Shopify checkout destinations", () => {
  it.each([
    "https://tzwngp-h1.myshopify.com",
    "https://checkout.shopify.com",
    "https://other.myshopify.com",
    "https://checkout.noorlynordic.com",
  ])(
    "preserves a valid checkout at %s and applies the chosen locale",
    async (origin) => {
      const { provider, availability } = availableCheckout(
        origin + "/checkouts/test?key=opaque&locale=sv",
      );
      const result = new URL(await provider.getCheckoutUrl("cart", "en"));
      expect(result.origin).toBe(origin);
      expect(result.pathname).toBe("/checkouts/test");
      expect(result.searchParams.get("key")).toBe("opaque");
      expect(result.searchParams.get("locale")).toBe("en");
      expect(availability).toHaveBeenCalledOnce();
    },
  );

  it.each([
    "https://checkout.noorly.se/checkouts/test",
    "https://erinra.com/checkouts/test",
    "https://www.erinra.com/checkouts/test",
    "https://erinra.eu/checkouts/test",
    "https://www.erinra.eu/checkouts/test",
    "http://checkout.noorly.se/checkouts/test",
    "https://checkout.noorly.se:8443/checkouts/test",
    "https://checkout.noorly.se.evil.test/checkouts/test",
    "https://checkout-noorly.se/checkouts/test",
    "https://other.noorly.se/checkouts/test",
    "https://noorly.se/checkouts/test",
    "https://checkout.noorly.se@evil.test/checkouts/test",
    "https://user:password@checkout.noorly.se/checkouts/test",
    "http://checkout.noorlynordic.com/checkouts/test",
    "https://checkout.noorlynordic.com:8443/checkouts/test",
    "https://checkout.noorlynordic.com.evil.test/checkouts/test",
    "https://checkout-noorlynordic.com/checkouts/test",
    "https://other.noorlynordic.com/checkouts/test",
    "https://noorlynordic.com/checkouts/test",
    "https://checkout.noorlynordic.com@evil.test/checkouts/test",
    "https://user:password@checkout.noorlynordic.com/checkouts/test",
    "https://user@checkout.noorlynordic.com/checkouts/test",
  ])("rejects an unapproved checkout destination: %s", async (url) => {
    const { provider } = availableCheckout(url);
    await expect(provider.getCheckoutUrl("cart")).rejects.toMatchObject({
      code: "invalid_checkout_url",
      status: 502,
    });
  });

  it.each(["https://checkout.noorlynordic.com"])(
    "does not bypass availability for the custom checkout at %s",
    async (origin) => {
      const { provider, availability } = availableCheckout(
        origin + "/checkouts/test",
      );
      availability.mockResolvedValue({
        available: false,
        unavailableVariantIds: ["unavailable"],
      });
      await expect(provider.getCheckoutUrl("cart")).rejects.toMatchObject({
        code: "unavailable_product",
        status: 409,
      });
    },
  );
});
