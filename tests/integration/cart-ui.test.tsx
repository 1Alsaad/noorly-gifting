import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockProducts } from "@/content/products";
import type { Cart } from "@/types/commerce";
import { CartProvider, useCart } from "@/features/cart/cart-provider";

vi.mock("@/lib/analytics/client", () => ({
  trackEvent: vi.fn(),
  getAnalyticsCheckoutAttributes: () => ({
    _stilla_analytics_consent: "denied",
    _stilla_analytics_session: "",
  }),
}));
const product = mockProducts.find(
  (product) => product.handle === "winter-candle",
)!;
const fullCart: Cart = {
  id: "public-cart",
  attributes: [],
  total: { amount: 295, currencyCode: "SEK" },
  totalQuantity: 1,
  lines: [
    {
      id: "line-1",
      merchandiseId: product.variants[0].id,
      product,
      variant: product.variants[0],
      quantity: 1,
      attributes: [],
    },
  ],
};
function Consumer() {
  const cart = useCart();
  return (
    <>
      <output aria-label="cart quantity">
        {cart.cart?.totalQuantity ?? 0}
      </output>
      <button
        onClick={() =>
          void cart
            .addLines([{ merchandiseId: product.variants[0].id, quantity: 1 }])
            .catch(() => undefined)
        }
      >
        Add
      </button>
      <button onClick={() => void cart.checkout("en").catch(() => undefined)}>
        Checkout
      </button>
      <span role="status" aria-label="request status">
        {cart.loading ? "Busy" : "Idle"}
      </span>
      {cart.error && <p role="alert">{cart.error}</p>}
    </>
  );
}
function response(cart: Cart | null, status = 200) {
  return new Response(JSON.stringify({ cart }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
describe("cart state and mutation safety", () => {
  beforeEach(() => vi.restoreAllMocks());
  it("hydrates the cart from its server cookie after a fresh render", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(response(fullCart));
    render(
      <CartProvider>
        <Consumer />
      </CartProvider>,
    );
    await waitFor(() =>
      expect(screen.getByLabelText("cart quantity")).toHaveTextContent("1"),
    );
  });
  it("keeps the latest successful mutation when a stale initial load arrives later", async () => {
    let finishInitial!: (value: Response) => void;
    vi.spyOn(globalThis, "fetch").mockImplementation((_input, init) =>
      !init?.method
        ? new Promise((resolve) => {
            finishInitial = resolve;
          })
        : Promise.resolve(response(fullCart)),
    );
    render(
      <CartProvider>
        <Consumer />
      </CartProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    await waitFor(() =>
      expect(screen.getByLabelText("cart quantity")).toHaveTextContent("1"),
    );
    await act(async () => {
      finishInitial(response(null));
      await Promise.resolve();
    });
    expect(screen.getByLabelText("cart quantity")).toHaveTextContent("1");
  });
  it("locks duplicate mutations and recovers with an accessible error on failure", async () => {
    let finishMutation!: (value: Response) => void;
    const fetcher = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation((_input, init) =>
        !init?.method
          ? Promise.resolve(response(null))
          : new Promise((resolve) => {
              finishMutation = resolve;
            }),
      );
    render(
      <CartProvider>
        <Consumer />
      </CartProvider>,
    );
    await act(async () => {
      await Promise.resolve();
    });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(
      fetcher.mock.calls.filter((call) => call[1]?.method === "POST"),
    ).toHaveLength(1);
    expect(
      screen.getByRole("status", { name: "request status" }),
    ).toHaveTextContent("Busy");
    await act(async () => {
      finishMutation(response(null, 503));
      await Promise.resolve();
    });
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "cart_update_failed",
    );
    expect(
      screen.getByRole("status", { name: "request status" }),
    ).toHaveTextContent("Idle");
  });
  it("includes necessary-only consent when beginning hosted checkout", async () => {
    const fetcher = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation((_input, init) =>
        !init?.method
          ? Promise.resolve(response(fullCart))
          : Promise.resolve(
              new Response(
                JSON.stringify({ cart: fullCart, url: "/en/mock-checkout" }),
              ),
            ),
      );
    render(
      <CartProvider>
        <Consumer />
      </CartProvider>,
    );
    await waitFor(() =>
      expect(screen.getByLabelText("cart quantity")).toHaveTextContent("1"),
    );
    fireEvent.click(screen.getByRole("button", { name: "Checkout" }));
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));
    const action = JSON.parse(fetcher.mock.calls[1][1]!.body as string);
    expect(action).toMatchObject({
      type: "checkout",
      locale: "en",
      attributes: [
        { key: "_stilla_analytics_consent", value: "denied" },
        { key: "_stilla_analytics_session", value: "" },
      ],
    });
  });
});
