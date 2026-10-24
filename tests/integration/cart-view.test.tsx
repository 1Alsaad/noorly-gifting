import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockProducts } from "@/content/products";
import type { Cart } from "@/types/commerce";
const state = vi.hoisted(() => ({
  cart: null as Cart | null,
  loading: false,
  error: null as string | null,
  updateLine: vi.fn(),
  removeLines: vi.fn(),
  checkout: vi.fn(),
}));
vi.mock("@/features/cart/cart-provider", () => ({ useCart: () => state }));
vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => <span role="img" aria-label={alt} />,
}));
import { CartView } from "@/features/cart/cart-view";
const product = mockProducts.find(
  (product) => product.handle === "winter-candle",
)!;
const cart: Cart = {
  id: "cart",
  total: { amount: 590, currencyCode: "SEK" },
  totalQuantity: 2,
  attributes: [],
  lines: [
    {
      id: "line-1",
      merchandiseId: product.variants[0].id,
      product,
      variant: product.variants[0],
      attributes: [],
      quantity: 2,
    },
  ],
};
describe("cart controls and announcements", () => {
  beforeEach(() => {
    state.cart = structuredClone(cart);
    state.loading = false;
    state.error = null;
    state.updateLine.mockReset().mockResolvedValue(undefined);
    state.removeLines.mockReset().mockResolvedValue(undefined);
    state.checkout.mockReset().mockResolvedValue("/en/mock-checkout");
  });
  it("offers a conventional shopping link and disables checkout for an empty bag", () => {
    state.cart = null;
    render(<CartView locale="en" />);
    expect(
      screen.getByRole("link", { name: "Discover the gifts" }),
    ).toHaveAttribute("href", "/en/shop");
    expect(
      screen.getByRole("button", { name: "Continue to secure checkout" }),
    ).toBeDisabled();
  });
  it("changes individual quantities and exposes a live cart update summary", () => {
    render(<CartView locale="en" />);
    fireEvent.click(
      screen.getByRole("button", { name: "Add to bag: Winter Candle" }),
    );
    expect(state.updateLine).toHaveBeenCalledWith("line-1", 3);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Your bag has been updated: 2",
    );
  });
  it("groups a bundle, shows its note as text and removes all related lines", () => {
    state.cart!.lines[0].attributes = [
      { key: "bundle_id", value: "bundle_12345" },
      { key: "gift_message", value: "<b>A private note</b>" },
    ];
    state.cart!.lines.push({
      ...state.cart!.lines[0],
      id: "line-2",
      attributes: [{ key: "bundle_id", value: "bundle_12345" }],
    });
    render(<CartView locale="en" />);
    expect(screen.getByRole("link", { name: "Edit your box" })).toHaveAttribute(
      "href",
      "/en/build-a-box?edit=bundle_12345",
    );
    expect(screen.getByText("<b>A private note</b>")).toBeVisible();
    expect(document.querySelector("blockquote b")).toBeNull();
    fireEvent.click(
      screen.getByRole("button", { name: "Remove: Your own gift box" }),
    );
    expect(state.removeLines).toHaveBeenCalledWith(["line-1", "line-2"]);
  });
  it("announces request errors and prevents controls during mutation", () => {
    state.loading = true;
    state.error = "cart_update_failed";
    render(<CartView locale="en" />);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Something went wrong. Please try again.",
    );
    expect(
      screen.getByRole("button", { name: "Preparing checkout…" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Add to bag: Winter Candle" }),
    ).toBeDisabled();
  });
  it("renders a cart without photographs without inventing a product image", () => {
    state.cart!.lines[0].product.images = [];
    state.cart!.lines[0].variant.images = [];
    render(<CartView locale="en" />);
    expect(screen.getByText("Image unavailable")).toBeVisible();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Continue to secure checkout" }),
    ).toBeEnabled();
  });
  it("blocks unsupported plan checkout while keeping removal available", () => {
    state.cart!.lines[0].sellingPlanId = "gid://shopify/SellingPlan/1";
    render(<CartView locale="en" />);
    expect(
      screen.getByRole("button", { name: "Continue to secure checkout" }),
    ).toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent("purchase option");
    fireEvent.click(
      screen.getByRole("button", { name: "Remove: Winter Candle" }),
    );
    expect(state.removeLines).toHaveBeenCalledWith(["line-1"]);
  });
});
