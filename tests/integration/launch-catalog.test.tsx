import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  LaunchProductDetails,
  LaunchCatalogGrid,
} from "@/components/product/launch-catalog";
import {
  launchProductDefinitions,
  presentCatalogProduct,
} from "@/content/launch-catalog";
import {
  launchSandChoices,
  launchBundlePhotos,
  launchBundleHandle,
} from "@/content/launch-bundle";
import type { LaunchProductState } from "@/lib/commerce/launch-product";

const { addLines } = vi.hoisted(() => ({ addLines: vi.fn() }));
vi.mock("@/features/cart/cart-provider", () => ({
  useCart: () => ({ addLines, loading: false }),
}));
vi.mock("@/lib/analytics/client", () => ({ trackEvent: vi.fn() }));

const sand: LaunchProductState = {
  source: "shopify",
  salesOpen: true,
  purchasable: true,
  product: {
    ...launchProductDefinitions[0].preview,
    id: launchProductDefinitions[0].id,
    previewOnly: false,
    available: true,
    variants: launchSandChoices.map((choice, index) => ({
      id: `gid://shopify/ProductVariant/${55883112087894 + index * 32768}`,
      sku: choice.sku,
      title: choice.label.sv,
      available: true,
      price: {
        amount: choice.sku === "CSand-11" ? 219 : 269,
        currencyCode: "SEK" as const,
      },
      // Deliberately mixed product media must not leak into the selected gallery.
      images: [
        ...launchBundlePhotos,
        ...launchSandChoices.map((item) => item.photo),
      ].map((photo) => ({ url: photo.url, alt: photo.alt.en })),
    })),
  },
};
const bowl: LaunchProductState = {
  source: "shopify",
  salesOpen: true,
  purchasable: true,
  product: {
    ...launchProductDefinitions[1].preview,
    id: launchProductDefinitions[1].id,
    previewOnly: false,
    available: true,
    variants: [
      {
        id: "gid://shopify/ProductVariant/56138148118870",
        sku: "TeakB-37",
        title: "Default Title",
        available: true,
        price: { amount: 550, currencyCode: "SEK" },
      },
    ],
  },
};
const bundleVariantIds = [
  "56138148413782",
  "56138148446550",
  "56138148479318",
  "56138148512086",
  "56138148544854",
  "56138148577622",
  "56138148610390",
  "56138148643158",
  "56138148675926",
  "56138148708694",
  "56138148741462",
];
const bundle: LaunchProductState = {
  source: "shopify",
  salesOpen: true,
  purchasable: true,
  product: {
    ...launchProductDefinitions[2].preview,
    id: launchProductDefinitions[2].id,
    previewOnly: false,
    available: true,
    variants: sand.product.variants.map((sandVariant, index) => ({
      id: `gid://shopify/ProductVariant/${bundleVariantIds[index]}`,
      title: sandVariant.title,
      sku: `NOORLY-LJUSSTUND-${sandVariant.sku}`,
      available: true,
      requiresComponents: true,
      price: {
        amount: sandVariant.sku === "CSand-11" ? 699 : 749,
        currencyCode: "SEK" as const,
      },
      components: [
        { quantity: 1, product: sand.product, variant: sandVariant },
        {
          quantity: 1,
          product: bowl.product,
          variant: bowl.product.variants[0],
        },
      ],
    })),
  },
};

describe("separate products and the native bundle", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_PRODUCT_TEST_MODE", "false");
    addLines.mockReset().mockResolvedValue(undefined);
  });
  afterEach(() => vi.unstubAllEnvs());

  it("keeps the selected colour, photo, standalone price and merchandise ID together", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <LaunchProductDetails launch={sand} locale="en" />,
    );
    expect(screen.getAllByRole("radio")).toHaveLength(11);
    expect(screen.getByText(/219/)).toBeInTheDocument();
    expect(container.querySelector(".stock-label")).toHaveTextContent(
      "Pre-order",
    );
    expect(
      container.querySelectorAll(".gallery-thumbnails button"),
    ).toHaveLength(0);
    await user.click(
      screen.getByRole("radio", { name: "Dusty Rose · Maison de Roses" }),
    );
    expect(
      screen.getByRole("link", { name: /Open full-size image/ }),
    ).toHaveAttribute("href", launchSandChoices[7].photo.url);
    expect(screen.getByText(/269/)).toBeInTheDocument();
    expect(
      container.querySelectorAll(".gallery-thumbnails button"),
    ).toHaveLength(0);
    expect(screen.getByText(/A candle vessel is not included/)).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Add to bag" }));
    expect(addLines).toHaveBeenCalledWith([
      { merchandiseId: sand.product.variants[7].id, quantity: 1 },
    ]);
  });

  it("shows only bowl photographs and adds the bowl as one separate line", async () => {
    const user = userEvent.setup();
    render(<LaunchProductDetails launch={bowl} locale="sv" />);
    expect(screen.queryByRole("radio")).toBeNull();
    expect(screen.getAllByRole("button", { name: /^Bild \d:/ })).toHaveLength(
      3,
    );
    expect(screen.getByText(/550/)).toBeInTheDocument();
    expect(
      screen.getByText(/torka försiktigt med en mjuk, torr trasa/),
    ).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Lägg i påsen" }));
    expect(addLines).toHaveBeenCalledWith([
      {
        merchandiseId: "gid://shopify/ProductVariant/56138148118870",
        quantity: 1,
      },
    ]);
  });

  it("does not turn an unknown or unavailable SKU into a different sellable colour", () => {
    const variant = {
      ...sand.product.variants[0],
      sku: "unknown",
      title: "White",
      available: false,
      images: undefined,
    };
    const product = presentCatalogProduct(
      { ...sand.product, variants: [variant] },
      "en",
    );
    expect(product.variants[0]).toEqual(variant);
    expect(product.variants[0].color).toBeUndefined();
    expect(product.variants[0].available).toBe(false);
  });

  it("keeps bundle colour, component photos, price and native parent together", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <LaunchProductDetails launch={bundle} locale="en" />,
    );
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Teak bowl + candle sand",
      }),
    ).toBeVisible();
    expect(screen.getByText("Bundle price")).toBeVisible();
    expect(screen.getAllByRole("radio")).toHaveLength(11);
    expect(container.querySelector(".product-price")).toHaveTextContent("699");
    expect(container.querySelector(".stock-label")).toHaveTextContent(
      "Pre-order",
    );
    expect(
      screen.getByRole("link", { name: /Open full-size image/ }),
    ).toHaveAttribute("href", launchSandChoices[0].photo.url);
    expect(screen.getAllByRole("button", { name: /^Image \d:/ })).toHaveLength(
      4,
    );
    await user.click(screen.getByRole("button", { name: "Add to bag" }));
    expect(addLines).toHaveBeenLastCalledWith([
      {
        merchandiseId: "gid://shopify/ProductVariant/56138148413782",
        quantity: 1,
      },
    ]);

    await user.click(
      screen.getByRole("button", {
        name: `Image 2: ${launchBundlePhotos[0].alt.en}`,
      }),
    );
    expect(
      screen.getByRole("link", { name: /Open full-size image/ }),
    ).toHaveAttribute("href", launchBundlePhotos[0].url);
    await user.click(
      screen.getByRole("radio", { name: "Dusty Rose · Maison de Roses" }),
    );
    expect(container.querySelector(".product-price")).toHaveTextContent("749");
    expect(
      screen.getByRole("link", { name: /Open full-size image/ }),
    ).toHaveAttribute("href", launchSandChoices[7].photo.url);
    expect(screen.getAllByRole("button", { name: /^Image \d:/ })).toHaveLength(
      4,
    );
    for (const [index, photo] of launchBundlePhotos.entries())
      expect(
        screen.getByRole("button", {
          name: `Image ${index + 2}: ${photo.alt.en}`,
        }),
      ).toBeVisible();
    expect(container.querySelector(".gallery-included")).toHaveTextContent(
      "1 decorative teak bowl + 300 g candle sand",
    );
    await user.click(screen.getByRole("button", { name: "Add to bag" }));
    expect(addLines).toHaveBeenLastCalledWith([
      {
        merchandiseId: "gid://shopify/ProductVariant/56138148643158",
        quantity: 1,
      },
    ]);
    expect(addLines).toHaveBeenCalledTimes(2);
    expect(container.textContent).not.toMatch(/CSand-|TeakB-|AWGifts/i);
  });

  it("lists both separate products and a bundle card showing both included products", () => {
    const { container } = render(
      <LaunchCatalogGrid launches={[sand, bowl, bundle]} locale="en" />,
    );
    expect(container.querySelectorAll("article")).toHaveLength(3);
    expect(
      screen.getByRole("link", { name: /Choose colour & scent/ }),
    ).toHaveAttribute("href", "/en/products/candle-sand");
    expect(
      screen.getByRole("link", { name: /Discover the teak bowl/ }),
    ).toHaveAttribute("href", "/en/products/teakb-37-dekorativ-teakskal");
    expect(
      screen.getByRole("link", { name: /Choose your bundle/ }),
    ).toHaveAttribute("href", `/en/products/${launchBundleHandle}`);
    expect(screen.getByText(/From.*219/)).toBeVisible();
    expect(screen.getByText(/550/)).toBeVisible();
    expect(screen.getByText(/From.*699/)).toBeVisible();
    const bundleCard = screen
      .getByRole("heading", { name: "Teak bowl + candle sand" })
      .closest("article")!;
    expect(within(bundleCard).getAllByRole("img")).toHaveLength(2);
    expect(
      within(bundleCard).getByRole("img", {
        name: launchSandChoices[0].photo.alt.en,
      }),
    ).toBeVisible();
    expect(
      within(bundleCard).getByRole("img", {
        name: launchBundlePhotos[0].alt.en,
      }),
    ).toBeVisible();
  });
});
