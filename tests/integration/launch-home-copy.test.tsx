import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Home from "@/app/[locale]/page";
import { ShoppingOverlay } from "@/components/cinematic/shopping-overlay";
import { getDictionary } from "@/content/translations";
import { launchProductDefinitions } from "@/content/launch-catalog";
import { isPublicTestPreview } from "@/lib/commerce/launch";
import type { Locale, Product } from "@/types/commerce";

const { getProductByHandle } = vi.hoisted(() => ({
  getProductByHandle: vi.fn(),
}));
vi.mock("@/lib/commerce", () => ({
  getCommerceProvider: () => ({ name: "shopify", getProductByHandle }),
}));
vi.mock("@/features/cart/cart-provider", () => ({
  useCart: () => ({ addLines: vi.fn(), loading: false }),
}));
vi.mock("@/lib/analytics/client", () => ({ trackEvent: vi.fn() }));
vi.mock("@/components/ui/structured-data", () => ({
  StructuredData: () => null,
}));
vi.mock("@/components/cinematic/cinematic-experience", () => ({
  // The real shopping overlay is tested without the unrelated video/timing hooks.
  CinematicExperience: ({
    locale,
    products,
  }: {
    locale: Locale;
    products: Product[];
  }) => (
    <ShoppingOverlay
      product={products[0]}
      locale={locale}
      visible
      onDetails={() => {}}
      onSkip={() => {}}
    />
  ),
}));

const products: Product[] = launchProductDefinitions.map(
  (definition, index) => ({
    ...definition.preview,
    id: definition.id,
    previewOnly: false,
    available: true,
    variants: [
      {
        id: `gid://shopify/ProductVariant/${index ? "56138148118870" : "55883112087894"}`,
        sku: index ? "TeakB-37" : "CSand-11",
        title: index ? "Default Title" : "Vit · Doftfri",
        available: true,
        price: definition.preview.price,
      },
    ],
  }),
);

describe("launch copy through the homepage and real release gates", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_COMMERCE_PROVIDER", "shopify");
    vi.stubEnv("NOORLY_STOREFRONT_OPEN", "true");
    vi.stubEnv("NEXT_PUBLIC_PRODUCT_TEST_MODE", "false");
    // A retained preview flag must not revive preparation copy after opening.
    vi.stubEnv("NOORLY_PUBLIC_PREVIEW", "true");
    getProductByHandle
      .mockReset()
      .mockImplementation(
        async (handle: string) =>
          products.find((product) => product.handle === handle) ?? null,
      );
  });
  afterEach(() => vi.unstubAllEnvs());

  it.each(["sv", "en"] as const)(
    "shows the live offer consistently in %s without preparation or unknown-content notices",
    async (locale) => {
      const { container } = render(
        await Home({ params: Promise.resolve({ locale }) }),
      );
      const purchaseLabel =
        locale === "sv" ? "Välj färg & doft" : "Choose colour & scent";
      expect(
        screen.getAllByRole("link", { name: new RegExp(purchaseLabel) }),
      ).toHaveLength(2);
      expect(screen.getAllByText(/199/).length).toBeGreaterThan(0);
      expect(screen.getByText(/550/)).toBeInTheDocument();
      expect(
        container.querySelectorAll(".launch-catalog-grid article"),
      ).toHaveLength(2);
      expect(container).toHaveTextContent("300 g");
      expect(container.textContent).not.toMatch(
        /planned set price|planerat setpris|ordering (?:is currently unavailable|and payment are not yet open)|beställning (?:är inte tillgänglig|och betalning är ännu inte öppna)|contents will be confirmed|exakta set|förbeställ|preorders/i,
      );
      expect(isPublicTestPreview()).toBe(false);

      const shared = getDictionary(locale);
      expect(shared.deliveryText).toMatch(
        locale === "sv" ? /så snart som möjligt/ : /as soon as possible/,
      );
      expect(shared.deliveryText).not.toMatch(
        /estimated delivery window|beräknad leveransperiod/i,
      );
      expect(shared.home.curatedText).toContain("300 g");
      expect(shared.faqs[1].a).toContain("300 g");
      expect(shared.faqs[1].a).toMatch(
        locale === "sv" ? /fyra bomullsvekar/ : /four cotton wicks/,
      );
    },
  );

  it("retains an honest closed preview with confirmed contents when the release gates are off", async () => {
    vi.stubEnv("NOORLY_STOREFRONT_OPEN", "false");
    vi.stubEnv("NEXT_PUBLIC_PRODUCT_TEST_MODE", "true");
    const { container } = render(
      await Home({ params: Promise.resolve({ locale: "en" }) }),
    );
    expect(isPublicTestPreview()).toBe(true);
    expect(screen.queryByRole("button", { name: /Add to bag/ })).toBeNull();
    expect(screen.getAllByText("Ordering is not open")[0]).toBeInTheDocument();
    expect(container).toHaveTextContent("300 g");
    expect(container.textContent).not.toMatch(
      /contents will be confirmed|finalising the set contents/i,
    );
    const shared = getDictionary("en");
    expect(shared.home.reviewsText).toContain(
      "Candle sand and decorative teak bowls",
    );
    expect(shared.home.reviewsText).toContain(
      "Ordering and payment are not yet open in this preview",
    );
    expect(shared.faqs[0].a).toContain("preview");
  });
});
