import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  LaunchCatalogGrid,
  LaunchProductDetails,
} from "@/components/product/launch-catalog";
import { Header } from "@/components/layout/header";
import { getCustomerPolicy } from "@/content/customer-policies";
import { applyManagedProduct } from "@/lib/commerce/managed-catalog";
import {
  managedCatalogFixture,
  managedShopifyFixture,
} from "../fixtures/managed-catalog";
import type { LaunchProductState } from "@/lib/commerce/launch-product";

const { addLines, checkout } = vi.hoisted(() => ({
  addLines: vi.fn(),
  checkout: vi.fn(),
}));
vi.mock("@/features/cart/cart-provider", () => ({
  useCart: () => ({ addLines, checkout, loading: false, cart: null }),
}));
vi.mock("@/lib/analytics/client", () => ({ trackEvent: vi.fn() }));
vi.mock("next/navigation", () => ({
  usePathname: () => "/sv/shop",
  useSearchParams: () => new URLSearchParams(),
}));

function launch(): LaunchProductState {
  const catalog = managedCatalogFixture();
  return {
    source: "shopify",
    salesOpen: true,
    purchasable: true,
    product: applyManagedProduct(
      managedShopifyFixture(),
      catalog.products[0],
      catalog.version,
      true,
    ),
  };
}
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("NEXT_PUBLIC_PRODUCT_TEST_MODE", "false");
  addLines.mockResolvedValue(undefined);
  checkout.mockRejectedValue(new Error("CHECKOUT_UNAVAILABLE"));
});
afterEach(() => vi.unstubAllEnvs());

describe("managed customer presentation", () => {
  it("renders replacement product, authentic image and delivery without old candle claims", async () => {
    const item = launch();
    render(<LaunchProductDetails launch={item} locale="sv" />);
    expect(
      screen.getByRole("heading", { name: "Ullhalsduk", level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByText("En halsduk.")).toBeInTheDocument();
    expect(
      screen.getByText(/Leverans inom 5–7 arbetsdagar/),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/teakskål|ljussand|Förbeställning/i),
    ).not.toBeInTheDocument();
    expect(document.querySelector("img")?.getAttribute("src")).toContain(
      "scarf.jpg",
    );
    await userEvent.click(screen.getByRole("button", { name: "Till kassan" }));
    await waitFor(() => expect(checkout).toHaveBeenCalledWith("sv"));
    expect(addLines).toHaveBeenCalledWith([
      { merchandiseId: item.product.variants[0].id, quantity: 1 },
    ]);
  });

  it("links the catalog to the replacement product with generic navigation", () => {
    render(
      <>
        <Header locale="sv" managed />
        <LaunchCatalogGrid launches={[launch()]} locale="sv" />
      </>,
    );
    expect(screen.getByRole("link", { name: /Se produkten/ })).toHaveAttribute(
      "href",
      "/sv/products/wool-scarf",
    );
    expect(screen.queryByText("Handgjorda teakskålar")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Paket" }),
    ).not.toBeInTheDocument();
  });

  it("preserves consumer policies without stale product prices or blanket shipping claims", () => {
    const policy = getCustomerPolicy("en", "terms", true)!;
    const text = JSON.stringify(policy);
    expect(text).not.toMatch(
      /SEK 349|candle sand|teak bowl|delivery within Sweden is included/i,
    );
    expect(text).toContain("14 days");
    expect(text).toContain("complete checkout total");
  });
});
