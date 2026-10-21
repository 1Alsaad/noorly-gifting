import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Product } from "@/types/commerce";
import { ProductPurchase } from "@/components/product/product-purchase";
import { AddToCart } from "@/components/commerce/add-to-cart";

const { addLines } = vi.hoisted(() => ({ addLines: vi.fn() }));
vi.mock("@/features/cart/cart-provider", () => ({
  useCart: () => ({ addLines, loading: false }),
}));
vi.mock("@/lib/analytics/client", () => ({ trackEvent: vi.fn() }));
vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    <span role="img" aria-label={alt} data-src={src} />
  ),
}));
const product: Product = {
  id: "candle-sand",
  handle: "candle-sand",
  title: { sv: "Ljussand", en: "Candle sand" },
  description: { sv: "", en: "" },
  price: { amount: 249, currencyCode: "SEK" },
  images: [],
  available: true,
  category: "signature",
  seasons: [],
  boxEligible: false,
  variants: Array.from({ length: 11 }, (_, i) => ({
    id: `variant-${i}`,
    title: `Variant ${i + 1}`,
    sku: `SKU-${i + 1}`,
    available: true,
    price: { amount: i === 10 ? 199 : 249, currencyCode: "SEK" },
    image: { url: `https://cdn.shopify.com/${i}.jpg`, alt: `Påse ${i + 1}` },
  })),
};
describe("exact variant selection", () => {
  beforeEach(() => {
    addLines.mockReset().mockResolvedValue(undefined);
  });
  it("updates the image and sends the selected variant for every one of eleven options", async () => {
    render(<ProductPurchase product={product} locale="sv" />);
    const select = screen.getByRole("combobox");
    for (const variant of product.variants) {
      fireEvent.change(select, { target: { value: variant.id } });
      expect(screen.getByRole("img")).toHaveAttribute(
        "data-src",
        variant.image!.url,
      );
      expect(screen.getByRole("img")).toHaveAccessibleName(variant.image!.alt);
      fireEvent.click(screen.getByRole("button"));
      expect(addLines).toHaveBeenLastCalledWith([
        { merchandiseId: variant.id, quantity: 1 },
      ]);
      await Promise.resolve();
    }
  });
  it("does not silently substitute the first variant when an explicit ID is unknown", () => {
    render(<AddToCart product={product} locale="sv" variantId="missing" />);
    expect(screen.getByRole("button")).toBeDisabled();
    fireEvent.click(screen.getByRole("button"));
    expect(addLines).not.toHaveBeenCalled();
  });
  it("shows Swedish closed-purchase copy and disables planned products", () => {
    render(
      <ProductPurchase
        product={{
          ...product,
          purchaseOptions: {
            requiresSellingPlan: false,
            hasSellingPlans: true,
          },
        }}
        locale="sv"
      />,
    );
    expect(screen.getByRole("button")).toBeDisabled();
    expect(screen.getByRole("button")).toHaveTextContent(
      "Köp är inte öppet ännu.",
    );
  });
});
