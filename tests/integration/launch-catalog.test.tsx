import { render, screen } from "@testing-library/react";
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
import { launchSandChoices, launchBundlePhotos } from "@/content/launch-bundle";
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
        amount: choice.sku === "CSand-11" ? 199 : 249,
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

describe("separate merchant product pages", () => {
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
    expect(screen.getByText(/199/)).toBeInTheDocument();
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
    expect(screen.getByText(/249/)).toBeInTheDocument();
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

  it("lists two distinct purchase paths with their separate prices", () => {
    const { container } = render(
      <LaunchCatalogGrid launches={[sand, bowl]} locale="en" />,
    );
    expect(container.querySelectorAll("article")).toHaveLength(2);
    expect(
      screen.getByRole("link", { name: /Choose colour & scent/ }),
    ).toHaveAttribute("href", "/en/products/candle-sand");
    expect(
      screen.getByRole("link", { name: /Discover the teak bowl/ }),
    ).toHaveAttribute("href", "/en/products/teakb-37-dekorativ-teakskal");
    expect(screen.getByText(/From.*199/)).toBeVisible();
    expect(screen.getByText(/550/)).toBeVisible();
    expect(container.textContent).not.toMatch(/799|Ljusstund|complete set/);
  });
});
