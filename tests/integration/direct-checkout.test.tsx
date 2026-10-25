import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProductPurchase } from "@/components/product/product-purchase";
import {
  launchProductDefinitions,
  presentCatalogProduct,
} from "@/content/launch-catalog";
import { launchSandChoices } from "@/content/launch-bundle";

const { addLines, checkout } = vi.hoisted(() => ({
  addLines: vi.fn(),
  checkout: vi.fn(),
}));
vi.mock("@/features/cart/cart-provider", () => ({
  useCart: () => ({ addLines, checkout, loading: false }),
}));
vi.mock("@/lib/analytics/client", () => ({ trackEvent: vi.fn() }));
const product = presentCatalogProduct(
  {
    ...launchProductDefinitions[0].preview,
    available: true,
    previewOnly: false,
    variants: launchSandChoices.slice(0, 3).map((choice, index) => ({
      id: `variant-${index}`,
      sku: choice.sku,
      title: choice.label.en,
      available: true,
      price: { amount: index === 0 ? 349 : 449, currencyCode: "SEK" as const },
    })),
  },
  "en",
);

describe("direct product checkout", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_PRODUCT_TEST_MODE", "false");
    addLines.mockReset().mockResolvedValue(undefined);
    checkout.mockReset().mockRejectedValue(new Error("checkout_unavailable"));
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("checks out the selected variant from the mobile shortcut", async () => {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      bottom: -1,
    } as DOMRect);
    const user = userEvent.setup();
    render(<ProductPurchase product={product} locale="en" />);
    await user.click(
      screen.getByRole("radio", { name: "Latte Beige · Pure Serenity" }),
    );
    fireEvent.scroll(window);
    const shortcut = await screen.findByRole("complementary", {
      name: "Your product selection",
    });
    expect(shortcut).toHaveTextContent("449");
    expect(shortcut).toHaveTextContent("Latte Beige · Pure Serenity");
    await user.click(
      within(shortcut).getByRole("button", { name: "Checkout" }),
    );
    await waitFor(() => expect(checkout).toHaveBeenCalledWith("en"));
    expect(addLines).toHaveBeenCalledWith([
      { merchandiseId: "variant-2", quantity: 1 },
    ]);
  });

  it("uses the chosen variant, then retries checkout without adding a second unit", async () => {
    const user = userEvent.setup();
    render(<ProductPurchase product={product} locale="en" />);
    await user.click(
      screen.getByRole("radio", { name: "Latte Beige · Pure Serenity" }),
    );
    await user.click(screen.getByRole("button", { name: "Checkout" }));
    await screen.findByRole("alert");
    expect(addLines).toHaveBeenCalledWith([
      { merchandiseId: "variant-2", quantity: 1 },
    ]);
    expect(checkout).toHaveBeenCalledWith("en");
    await user.click(screen.getByRole("button", { name: "Checkout" }));
    await waitFor(() => expect(checkout).toHaveBeenCalledTimes(2));
    expect(addLines).toHaveBeenCalledTimes(1);
  });

  it("continues an item already added with the secondary button without duplicating it", async () => {
    const user = userEvent.setup();
    render(<ProductPurchase product={product} locale="en" />);
    await user.click(screen.getByRole("button", { name: "Add to bag" }));
    await user.click(screen.getByRole("button", { name: "Checkout" }));
    await screen.findByRole("alert");
    expect(addLines).toHaveBeenCalledTimes(1);
    expect(checkout).toHaveBeenCalledTimes(1);
  });

  it("locks rapid clicks and option changes while adding, and stops for a cart warning", async () => {
    let rejectAdd!: (error: Error) => void;
    addLines.mockImplementation(
      () =>
        new Promise((_resolve, reject) => {
          rejectAdd = reject;
        }),
    );
    render(<ProductPurchase product={product} locale="en" />);
    const button = screen.getByRole("button", {
      name: "Checkout",
    });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(addLines).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("radio", { name: "White · Unscented" }),
    ).toBeDisabled();
    await act(async () => rejectAdd(new Error("cart_changed")));
    expect(checkout).not.toHaveBeenCalled();
    expect(
      screen.getByRole("link", { name: /Review your bag/ }),
    ).toHaveAttribute("href", "/en/cart");
    expect(screen.getByRole("button", { name: "Checkout" })).toBeDisabled();
  });

  it("keeps unavailable variants and preview-only products out of direct checkout", () => {
    const { rerender } = render(
      <ProductPurchase
        product={{ ...product, available: false }}
        locale="en"
      />,
    );
    expect(
      screen.getByRole("button", {
        name: "Currently unavailable",
      }),
    ).toBeDisabled();
    rerender(
      <ProductPurchase
        product={{ ...product, previewOnly: true }}
        locale="en"
      />,
    );
    expect(screen.queryByRole("button", { name: "Checkout" })).toBeNull();
    expect(addLines).not.toHaveBeenCalled();
  });
});
