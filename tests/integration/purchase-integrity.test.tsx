import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AddToCart } from "@/components/commerce/add-to-cart";
import { ProductCard } from "@/components/product/product-card";
import { ProductGallery } from "@/components/product/product-gallery";
import { mockProducts } from "@/content/products";

const { addLines } = vi.hoisted(() => ({ addLines: vi.fn() }));
vi.mock("@/features/cart/cart-provider", () => ({
  useCart: () => ({ addLines, loading: false }),
}));

describe("accurate purchase controls", () => {
  beforeEach(() => addLines.mockReset().mockResolvedValue(undefined));
  it("refuses an unknown explicit variant instead of substituting the first", () => {
    render(
      <AddToCart
        product={mockProducts[0]}
        locale="en"
        variantId="not-the-selected-variant"
      />,
    );
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(addLines).not.toHaveBeenCalled();
  });
  it.each(["requiresSellingPlan", "hasSellingPlans"] as const)(
    "blocks ordinary purchase for %s",
    (flag) => {
      render(
        <AddToCart
          product={{ ...mockProducts[0], [flag]: true }}
          locale="en"
        />,
      );
      expect(screen.getByRole("button")).toBeDisabled();
    },
  );
  it("uses a truthful missing-image state in a product card and gallery", () => {
    const product = { ...mockProducts[0], images: [] };
    const { container } = render(
      <>
        <ProductCard product={product} locale="en" />
        <ProductGallery images={[]} locale="en" title={product.title.en} />
      </>,
    );
    expect(screen.getAllByText("Product image unavailable")).toHaveLength(2);
    expect(container.querySelector("img")).toBeNull();
  });
});
