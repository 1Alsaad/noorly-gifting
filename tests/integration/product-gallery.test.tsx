import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProductPresentation } from "@/components/product/product-presentation";
import { candleSand } from "@/content/candle-sand";

const { addLines } = vi.hoisted(() => ({ addLines: vi.fn() }));
vi.mock("@/features/cart/cart-provider", () => ({
  useCart: () => ({ addLines, loading: false }),
}));
vi.mock("@/lib/analytics/client", () => ({ trackEvent: vi.fn() }));

describe("candle sand selection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    addLines.mockResolvedValue(undefined);
  });

  it("keeps gallery, variant ID and persistent cart confirmation in sync", async () => {
    const user = userEvent.setup();
    render(
      <ProductPresentation product={candleSand} locale="en">
        Delivery details
      </ProductPresentation>,
    );
    expect(screen.getAllByRole("radio")).toHaveLength(11);
    await user.click(
      screen.getByRole("radio", { name: "Dusty Rose · Maison de Roses" }),
    );
    expect(
      screen.getByRole("link", { name: /Open full-size image/ }),
    ).toHaveAttribute("href", "/media/products/candle-sand/csand-07-0.webp");
    await user.click(screen.getByRole("button", { name: /^Image 2:/ }));
    expect(
      screen.getByRole("link", { name: /Open full-size image/ }),
    ).toHaveAttribute("href", "/media/products/candle-sand/csand-07-2.webp");
    await user.click(screen.getByRole("button", { name: "Add to bag" }));
    expect(addLines).toHaveBeenCalledWith([
      { merchandiseId: "candle-sand-07", quantity: 1 },
    ]);
    expect(screen.getByRole("link", { name: /Your bag/ })).toHaveAttribute(
      "href",
      "/en/cart",
    );
    await user.click(screen.getByRole("radio", { name: "Black · Spirited" }));
    expect(screen.getByRole("button", { name: "Add to bag" })).toBeEnabled();
    expect(
      screen.getByRole("link", { name: /Open full-size image/ }),
    ).toHaveAttribute("href", "/media/products/candle-sand/csand-09-0.webp");
  });

  it("distinguishes the two white options in Swedish and supports keyboard selection", async () => {
    const user = userEvent.setup();
    render(
      <ProductPresentation product={candleSand} locale="sv">
        Leverans
      </ProductPresentation>,
    );
    const unscented = screen.getByRole("radio", { name: "Vit · Doftfri" });
    expect(unscented).toBeChecked();
    expect(
      screen.getByRole("radio", { name: "Vit · Starlight Elixir" }),
    ).not.toBeChecked();
    unscented.focus();
    await user.keyboard("{ArrowRight}");
    expect(
      screen.getByRole("radio", { name: "Mockabrun · Crimson Crystal" }),
    ).toBeChecked();
    expect(screen.getByText("Demopris · ej till försäljning")).toBeVisible();
  });
});
