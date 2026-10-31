import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ProductDetail from "@/app/[locale]/products/[handle]/page";
import { ProductPresentation } from "@/components/product/product-presentation";
import { candleSand } from "@/content/candle-sand";
import { colourStory } from "@/content/colour-story";

const {
  addLines,
  getProductByHandle,
  getProducts,
  getLaunchProducts,
  provider,
} = vi.hoisted(() => ({
  addLines: vi.fn(),
  getProductByHandle: vi.fn(),
  getProducts: vi.fn(),
  getLaunchProducts: vi.fn(),
  provider: { name: "mock" },
}));
vi.mock("@/lib/commerce", () => ({
  getCommerceProvider: () => ({
    name: provider.name,
    getProductByHandle,
    getProducts,
  }),
}));
vi.mock("@/lib/commerce/launch-product", () => ({ getLaunchProducts }));
vi.mock("@/features/cart/cart-provider", () => ({
  useCart: () => ({ addLines, loading: false }),
}));
vi.mock("@/components/analytics/track-view", () => ({ TrackView: () => null }));
vi.mock("@/components/ui/structured-data", () => ({
  StructuredData: () => null,
}));
vi.mock("@/lib/analytics/client", () => ({ trackEvent: vi.fn() }));

const route = (colour?: string | string[]) =>
  ProductDetail({
    params: Promise.resolve({ locale: "en", handle: candleSand.handle }),
    searchParams: Promise.resolve({ colour }),
  });

describe("product colour links", () => {
  beforeEach(() => {
    provider.name = "mock";
    vi.stubEnv("NOORLY_PUBLIC_PREVIEW", "false");
    vi.stubEnv("NEXT_PUBLIC_PRODUCT_TEST_MODE", "false");
    addLines.mockReset().mockResolvedValue(undefined);
    getProductByHandle.mockReset().mockResolvedValue(candleSand);
    getProducts.mockReset().mockResolvedValue([]);
    getLaunchProducts.mockReset().mockResolvedValue([
      {
        product: candleSand,
        source: "preparation",
        salesOpen: false,
        purchasable: false,
      },
    ]);
  });
  afterEach(() => vi.unstubAllEnvs());

  it("selects the requested actual SKU, its photo and palette, and adds its exact ID", async () => {
    const user = userEvent.setup();
    const { container } = render(await route("CSand-07"));
    expect(
      screen.getByRole("radio", { name: "Dusty Rose · Maison de Roses" }),
    ).toBeChecked();
    expect(
      screen.getByRole("link", { name: /Open full-size image/ }),
    ).toHaveAttribute("href", "/media/products/candle-sand/csand-07-0.webp");
    const presentation =
      container.querySelector<HTMLElement>(".product-shopping")!;
    expect(presentation.style.getPropertyValue("--product-gallery-tone")).toBe(
      colourStory("CSand-07")!.background,
    );
    await user.click(screen.getByRole("button", { name: "Add to bag" }));
    expect(addLines).toHaveBeenCalledWith([
      { merchandiseId: "candle-sand-07", quantity: 1 },
    ]);

    await user.click(
      screen.getByRole("radio", { name: "Warm Honey · Blush Bloom" }),
    );
    expect(presentation.style.getPropertyValue("--product-gallery-tone")).toBe(
      colourStory("CSand-08")!.background,
    );
    expect(
      screen.getByRole("link", { name: /Open full-size image/ }),
    ).toHaveAttribute("href", "/media/products/candle-sand/csand-08-0.webp");
  });

  it.each<{ colour?: string | string[] }>([
    {},
    { colour: "" },
    { colour: "not-a-sku" },
    { colour: "TeakB-37" },
    { colour: ["CSand-07", "CSand-11"] },
  ])(
    "defaults an absent, ambiguous or unknown colour to the first actual variant: $colour",
    async ({ colour }) => {
      render(await route(colour));
      expect(
        screen.getByRole("radio", { name: "White · Unscented" }),
      ).toBeChecked();
      expect(screen.getAllByRole("radio")).toHaveLength(
        candleSand.variants.length,
      );
    },
  );

  it.each(["mock", "shopify"])(
    "reinitializes the %s product when a new colour query arrives on the same route",
    async (name) => {
      provider.name = name;
      const { rerender } = render(await route("CSand-07"));
      expect(
        screen.getByRole("radio", { name: "Dusty Rose · Maison de Roses" }),
      ).toBeChecked();
      rerender(await route("CSand-08"));
      expect(
        screen.getByRole("radio", { name: "Warm Honey · Blush Bloom" }),
      ).toBeChecked();
      rerender(await route("not-a-sku"));
      expect(
        screen.getByRole("radio", { name: "White · Unscented" }),
      ).toBeChecked();
    },
  );

  it("does not match a missing SKU or use an unvalidated colour as CSS", () => {
    const first = candleSand.variants[0];
    const second = candleSand.variants[1];
    const product = {
      ...candleSand,
      variants: [
        {
          ...first,
          sku: "custom-colour",
          color: { ...first.color!, hex: "url(https://invalid.example/image)" },
        },
        { ...second, sku: undefined },
      ],
    };
    const { container } = render(
      <ProductPresentation product={product} locale="en">
        Details
      </ProductPresentation>,
    );
    expect(
      screen.getByRole("radio", { name: "White · Unscented" }),
    ).toBeChecked();
    expect(
      container
        .querySelector<HTMLElement>(".product-shopping")!
        .style.getPropertyValue("--product-gallery-tone"),
    ).toBe("#ede6d4");
  });

  it("does not invent a variant just because its SKU has a colour story", () => {
    render(
      <ProductPresentation
        product={{ ...candleSand, variants: candleSand.variants.slice(0, 2) }}
        initialVariantSku="CSand-07"
        locale="en"
      >
        Details
      </ProductPresentation>,
    );
    expect(
      screen.getByRole("radio", { name: "White · Unscented" }),
    ).toBeChecked();
    expect(screen.getAllByRole("radio")).toHaveLength(2);
  });
});
