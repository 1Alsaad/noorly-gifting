import { useState } from "react";
import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HotspotButton } from "@/components/cinematic/hotspot-button";
import { ProductDrawer } from "@/components/cinematic/product-drawer";
import { winterScenes } from "@/features/seasonal-experience/winter-scenes";
import type { Product } from "@/types/commerce";

const { addLines, trackEvent } = vi.hoisted(() => ({
  addLines: vi.fn(),
  trackEvent: vi.fn(),
}));
vi.mock("@/features/cart/cart-provider", () => ({
  useCart: () => ({ addLines, loading: false }),
}));
vi.mock("@/lib/analytics/client", () => ({ trackEvent }));

const product: Product = {
  id: "candle",
  handle: "winter-candle",
  title: { sv: "Vinterljus", en: "Winter candle" },
  description: { sv: "Ett stilla sken.", en: "A quiet glow." },
  price: { amount: 290, currencyCode: "SEK" },
  images: [],
  available: true,
  category: "signature",
  seasons: ["winter"],
  boxEligible: true,
  variants: [
    {
      id: "small",
      title: "Small",
      available: true,
      price: { amount: 290, currencyCode: "SEK" },
    },
    {
      id: "large",
      title: "Large",
      available: true,
      price: { amount: 390, currencyCode: "SEK" },
    },
    {
      id: "sold",
      title: "Sold out",
      available: false,
      price: { amount: 490, currencyCode: "SEK" },
    },
  ],
};

describe("cinematic shopping accessibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    addLines.mockResolvedValue(undefined);
  });

  it("removes inactive hotspots from the accessibility tree and opens active ones by keyboard", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const hotspot = winterScenes[1].hotspots[0];
    const { rerender } = render(
      <HotspotButton
        hotspot={hotspot}
        product={product}
        locale="en"
        progress={0.1}
        onSelect={onSelect}
      />,
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    rerender(
      <HotspotButton
        hotspot={hotspot}
        product={product}
        locale="en"
        progress={0.4}
        onSelect={onSelect}
      />,
    );
    const button = screen.getByRole("button", {
      name: "Discover the winter candle",
    });
    await user.tab();
    expect(button).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalledWith(product, button, hotspot);
    rerender(
      <HotspotButton
        hotspot={hotspot}
        product={product}
        locale="en"
        progress={0.5}
        onSelect={onSelect}
      />,
    );
    expect(trackEvent).toHaveBeenCalledTimes(1);
    rerender(
      <HotspotButton
        hotspot={hotspot}
        product={product}
        locale="en"
        progress={0.9}
        onSelect={onSelect}
      />,
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("traps dialog focus, closes with Escape, and restores the opener", async () => {
    const user = userEvent.setup();
    function Harness() {
      const [open, setOpen] = useState(false);
      const [trigger, setTrigger] = useState<HTMLButtonElement | null>(null);
      return (
        <>
          <button
            onClick={(event) => {
              setTrigger(event.currentTarget);
              setOpen(true);
            }}
          >
            View candle
          </button>
          <ProductDrawer
            product={product}
            locale="en"
            open={open}
            onOpenChange={setOpen}
            trigger={trigger}
          />
        </>
      );
    }
    render(<Harness />);
    const opener = screen.getByRole("button", { name: "View candle" });
    await user.click(opener);
    const dialog = screen.getByRole("dialog", { name: "Winter candle" });
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
    await user.keyboard("{Shift>}{Tab}{/Shift}");
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(opener).toHaveFocus();
  });

  it("adds the selected variant and blocks unavailable variants", async () => {
    const user = userEvent.setup();
    render(
      <ProductDrawer
        product={product}
        locale="en"
        open
        trigger={null}
        onOpenChange={vi.fn()}
      />,
    );
    await user.selectOptions(screen.getByLabelText("Variant"), "large");
    await user.click(screen.getByRole("button", { name: "Add to cart" }));
    expect(addLines).toHaveBeenCalledWith([
      { merchandiseId: "large", quantity: 1 },
    ]);
    expect(
      await screen.findByRole("button", { name: "Added to cart" }),
    ).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Variant"), "sold");
    expect(screen.getByRole("button", { name: "Add to cart" })).toBeDisabled();
    expect(screen.getByText("Temporarily sold out")).toBeInTheDocument();
  });

  it("shows a retryable error when the commerce adapter fails", async () => {
    addLines.mockRejectedValueOnce(new Error("Unavailable"));
    render(
      <ProductDrawer
        product={product}
        locale="en"
        open
        trigger={null}
        onOpenChange={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Add to cart" }));
    expect(await screen.findByRole("status")).toHaveTextContent(
      "The product could not be added. Please try again.",
    );
    expect(screen.getByRole("button", { name: "Add to cart" })).toBeEnabled();
    expect(
      screen.getByRole("link", { name: /Add to your gift box/ }),
    ).toHaveAttribute("href", "/en/build-a-box?product=winter-candle");
  });
});
