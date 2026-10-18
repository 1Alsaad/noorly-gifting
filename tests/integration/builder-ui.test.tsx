import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockProducts } from "@/content/products";
import {
  buildBoxCartLines,
  type BoxSelection,
} from "@/features/box-builder/validation";
import type { Cart, CartLineInput } from "@/types/commerce";

const state = vi.hoisted(() => ({
  cart: null as Cart | null,
  loading: false,
  addLines: vi.fn<(lines: CartLineInput[]) => Promise<void>>(),
  replaceBundle: vi.fn<(id: string, lines: CartLineInput[]) => Promise<void>>(),
}));
vi.mock("@/features/cart/cart-provider", () => ({ useCart: () => state }));
vi.mock("@/lib/analytics/client", () => ({ trackEvent: vi.fn() }));
vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => <span role="img" aria-label={alt} />,
}));
import { BoxBuilder } from "@/features/box-builder/box-builder";
import { trackEvent } from "@/lib/analytics/client";

const key = "stilla-box-builder-v1";
const valid: BoxSelection = {
  baseHandle: "small-box",
  signatureHandle: "winter-candle",
  extraHandles: ["forest-tea", "dark-chocolate"],
  giftMessage: "A private note",
};
function bundledCart(bundleId: string): Cart {
  const lines = buildBoxCartLines(valid, mockProducts, bundleId);
  return {
    id: "cart-public-id",
    total: { amount: 580, currencyCode: "SEK" },
    totalQuantity: lines.length,
    attributes: [],
    lines: lines.map((line, index) => {
      const product = mockProducts.find((product) =>
        product.variants.some((variant) => variant.id === line.merchandiseId),
      )!;
      return {
        ...line,
        id: `line-${index}`,
        product,
        variant: product.variants[0],
        attributes: line.attributes ?? [],
      };
    }),
  };
}
async function restoredBuilder(props: { editBundleId?: string } = {}) {
  render(<BoxBuilder products={mockProducts} locale="en" {...props} />);
  await act(async () => {
    await Promise.resolve();
  });
}
async function goToReview() {
  for (let step = 0; step < 5; step++)
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
}
describe("guided gift-box interaction", () => {
  beforeEach(() => {
    localStorage.clear();
    state.cart = null;
    state.loading = false;
    state.addLines.mockReset().mockResolvedValue(undefined);
    state.replaceBundle.mockReset().mockResolvedValue(undefined);
    vi.mocked(trackEvent).mockClear();
  });
  it("blocks incomplete extras, accepts a personal message and submits one sanitized bundle", async () => {
    await restoredBuilder();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(
      screen.getByText(
        "Please complete this step. Select available products and the required number of extras.",
      ),
    ).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: /Forest Tea/ }));
    fireEvent.click(screen.getByRole("button", { name: /Dark Chocolate/ }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.change(
      screen.getByRole("textbox", { name: "Your personal message" }),
      { target: { value: "<b>A private note</b>" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText("A private note")).toBeVisible();
    const add = screen.getByRole("button", {
      name: "Add your gift box to bag",
    });
    fireEvent.click(add);
    fireEvent.click(add);
    await waitFor(() => expect(state.addLines).toHaveBeenCalledTimes(1));
    const lines = state.addLines.mock.calls[0][0];
    const ids = lines.map(
      (line) => line.attributes?.find(({ key }) => key === "bundle_id")?.value,
    );
    expect(new Set(ids).size).toBe(1);
    expect(lines[0].attributes).toContainEqual({
      key: "gift_message",
      value: "A private note",
    });
    expect(JSON.stringify(vi.mocked(trackEvent).mock.calls)).not.toContain(
      "A private note",
    );
    expect(
      await screen.findByText("Your personal gift box is in the bag."),
    ).toBeVisible();
    expect(localStorage.getItem(key)).toBeNull();
  });
  it("restores a validated draft after refresh", async () => {
    localStorage.setItem(key, JSON.stringify(valid));
    await restoredBuilder();
    await goToReview();
    expect(screen.getByText("A private note")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Add your gift box to bag" }),
    ).toBeEnabled();
  });
  it("discards corrupt local progress without blocking the builder", async () => {
    localStorage.setItem(key, "{bad-json");
    await restoredBuilder();
    expect(
      screen.getByRole("heading", { name: "Start with the right box." }),
    ).toBeVisible();
    await waitFor(() =>
      expect(JSON.parse(localStorage.getItem(key)!)).toMatchObject({
        baseHandle: "small-box",
        extraHandles: [],
      }),
    );
  });
  it("retains a draft and permits retry when a cart mutation fails", async () => {
    localStorage.setItem(key, JSON.stringify(valid));
    state.addLines
      .mockRejectedValueOnce(new Error("provider_unavailable"))
      .mockResolvedValue(undefined);
    await restoredBuilder();
    await goToReview();
    fireEvent.click(
      screen.getByRole("button", { name: "Add your gift box to bag" }),
    );
    await waitFor(() =>
      expect(screen.getByText(/Please complete this step/)).toBeVisible(),
    );
    expect(localStorage.getItem(key)).not.toBeNull();
    fireEvent.click(
      screen.getByRole("button", { name: "Add your gift box to bag" }),
    );
    expect(
      await screen.findByText("Your personal gift box is in the bag."),
    ).toBeVisible();
    expect(state.addLines).toHaveBeenCalledTimes(2);
  });
  it("preserves the existing bundle identity when editing its cart lines", async () => {
    const bundleId = "bundle_edit_12345";
    state.cart = bundledCart(bundleId);
    await restoredBuilder({ editBundleId: bundleId });
    await goToReview();
    fireEvent.click(
      screen.getByRole("button", { name: "Add your gift box to bag" }),
    );
    await waitFor(() => expect(state.replaceBundle).toHaveBeenCalledOnce());
    const [target, lines] = state.replaceBundle.mock.calls[0];
    expect(target).toBe(bundleId);
    expect(
      lines.every((line) =>
        line.attributes?.some(
          ({ key, value }) => key === "bundle_id" && value === bundleId,
        ),
      ),
    ).toBe(true);
    expect(state.addLines).not.toHaveBeenCalled();
  });
});
