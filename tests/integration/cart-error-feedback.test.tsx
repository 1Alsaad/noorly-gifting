import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AddToCart } from "@/components/commerce/add-to-cart";
import { mockProducts } from "@/content/products";
import { CartProvider, useCart } from "@/features/cart/cart-provider";
import { CartView } from "@/features/cart/cart-view";
import type { Cart, Locale } from "@/types/commerce";

vi.mock("@/lib/analytics/client", () => ({
  trackEvent: vi.fn(),
  getAnalyticsCheckoutAttributes: () => ({}),
}));
vi.mock("@/lib/analytics/meta", () => ({
  getMetaCheckoutAttributes: () => ({}),
  trackMetaInitiateCheckout: vi.fn(),
}));
vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => <span role="img" aria-label={alt} />,
}));

const product = mockProducts.find((item) => item.handle === "winter-candle")!;
const cart: Cart = {
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

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function CartQuantity() {
  const { cart } = useCart();
  return <output aria-label="Cart quantity">{cart?.totalQuantity ?? 0}</output>;
}

describe("actionable cart error feedback", () => {
  beforeEach(() => vi.restoreAllMocks());

  it.each([
    ["UNAVAILABLE_PRODUCT", "sv", /valda antalet.*inte längre tillgängligt/i],
    ["UNAVAILABLE_PRODUCT", "en", /requested quantity is no longer available/i],
    ["CART_LIMIT", "sv", /Minska antalet i påsen/i],
    ["RATE_LIMITED", "en", /Wait a minute and try again/i],
  ] as const)(
    "explains %s in %s without retrying the mutation",
    async (code, locale, message) => {
      const fetcher = vi
        .spyOn(globalThis, "fetch")
        .mockImplementation((_input, init) =>
          Promise.resolve(
            init?.method === "POST"
              ? json({ error: code }, 409)
              : json({ cart: null }),
          ),
        );
      render(
        <CartProvider>
          <AddToCart product={product} locale={locale as Locale} />
        </CartProvider>,
      );
      fireEvent.click(
        screen.getByRole("button", {
          name: locale === "sv" ? "Lägg i påsen" : "Add to bag",
        }),
      );
      await waitFor(() =>
        expect(screen.getByRole("status")).toHaveTextContent(message),
      );
      expect(screen.getByRole("status")).not.toHaveTextContent(code);
      expect(
        fetcher.mock.calls.filter(([, init]) => init?.method === "POST"),
      ).toHaveLength(1);
      if (code === "UNAVAILABLE_PRODUCT" || code === "CART_LIMIT")
        expect(screen.getByRole("link")).toHaveAttribute(
          "href",
          `/${locale}/cart`,
        );
    },
  );

  it("offers the configured canonical shop for a rejected origin", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation((_input, init) =>
      Promise.resolve(
        init?.method === "POST"
          ? json(
              {
                error: "INVALID_ORIGIN",
                redirect: "https://untrusted.example",
              },
              403,
            )
          : json({ cart: null }),
      ),
    );
    render(
      <CartProvider>
        <AddToCart product={product} locale="sv" />
      </CartProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Lägg i påsen" }));
    const link = await screen.findByRole("link", { name: /Öppna butiken/ });
    expect(link).toHaveAttribute("href", "https://noorlynordic.com/sv/shop");
    expect(screen.getByRole("status")).toHaveTextContent("ordinarie adress");
    expect(document.body).not.toHaveTextContent("untrusted.example");
  });

  it.each(["provider-secret-detail", "__proto__"])(
    "keeps unknown error %s private",
    async (error) => {
      vi.spyOn(globalThis, "fetch").mockImplementation((_input, init) =>
        Promise.resolve(
          init?.method === "POST" ? json({ error }, 502) : json({ cart: null }),
        ),
      );
      render(
        <CartProvider>
          <AddToCart product={product} locale="sv" />
        </CartProvider>,
      );
      fireEvent.click(screen.getByRole("button", { name: "Lägg i påsen" }));
      await waitFor(() =>
        expect(screen.getByRole("status")).toHaveTextContent(
          "Något gick fel. Försök igen.",
        ),
      );
      expect(document.body).not.toHaveTextContent(error);
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
    },
  );

  it("keeps the adjusted cart and directs customers to review it after a stock warning", async () => {
    const adjusted = {
      ...cart,
      warnings: [{ code: "MERCHANDISE_NOT_ENOUGH_STOCK", message: "Adjusted" }],
    };
    vi.spyOn(globalThis, "fetch").mockImplementation((_input, init) =>
      Promise.resolve(
        json({ cart: init?.method === "POST" ? adjusted : null }),
      ),
    );
    render(
      <CartProvider>
        <AddToCart product={product} locale="sv" />
        <CartQuantity />
      </CartProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Lägg i påsen" }));
    await waitFor(() =>
      expect(screen.getByRole("status", { name: "" })).toHaveTextContent(
        "Kontrollera innehåll och antal",
      ),
    );
    expect(screen.getByLabelText("Cart quantity")).toHaveTextContent("1");
    expect(
      screen.getByRole("link", { name: /Kontrollera din påse/ }),
    ).toHaveAttribute("href", "/sv/cart");
    expect(screen.getByRole("button", { name: "Lägg i påsen" })).toBeEnabled();
  });

  it("shows the same safe origin recovery in the cart checkout summary", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation((_input, init) =>
      Promise.resolve(
        init?.method === "POST"
          ? json({ error: "INVALID_ORIGIN" }, 403)
          : json({ cart }),
      ),
    );
    render(
      <CartProvider>
        <CartView locale="en" />
      </CartProvider>,
    );
    const checkout = screen.getByRole("button", {
      name: "Continue to secure checkout",
    });
    await waitFor(() => expect(checkout).toBeEnabled());
    fireEvent.click(checkout);
    expect(await screen.findByRole("alert")).toHaveTextContent("main address");
    expect(screen.getByRole("link", { name: /Open the shop/ })).toHaveAttribute(
      "href",
      "https://noorlynordic.com/en/shop",
    );
    expect(
      screen.getByRole("button", { name: "Remove: Winter Candle" }),
    ).toBeEnabled();
  });
});
