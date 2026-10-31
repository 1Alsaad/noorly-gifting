import { render, screen, within, waitFor } from "@testing-library/react";
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

const { addLines, checkout } = vi.hoisted(() => ({
  addLines: vi.fn(),
  checkout: vi.fn(),
}));
vi.mock("@/features/cart/cart-provider", () => ({
  useCart: () => ({ addLines, checkout, loading: false }),
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
        amount: choice.sku === "CSand-11" ? 349 : 449,
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
    checkout.mockReset().mockRejectedValue(new Error("checkout_unavailable"));
  });
  afterEach(() => vi.unstubAllEnvs());

  it("carries the selected colour into the inline native bundle and retries without duplicating it", async () => {
    const user = userEvent.setup();
    render(
      <LaunchProductDetails
        launch={sand}
        offers={[sand, bowl, bundle]}
        locale="en"
      />,
    );
    await user.click(
      screen.getByRole("radio", { name: "Dusty Rose · Maison de Roses" }),
    );
    const offers = within(
      screen.getByRole("region", { name: "Your moment, your choice." }),
    );
    expect(offers.getByLabelText("Candle sand colour & scent")).toHaveValue(
      sand.product.variants[7].id,
    );
    expect(offers.getByText(/Bundle price · Save.*250/)).toBeVisible();
    expect(offers.getByText(/Separately today:.*999/)).toBeVisible();
    const button = offers.getByRole("button", {
      name: "Checkout with Luma + Alva",
    });
    await user.click(button);
    await offers.findByRole("alert");
    expect(addLines).toHaveBeenCalledWith([
      { merchandiseId: bundle.product.variants[7].id, quantity: 1 },
    ]);
    await user.click(button);
    await waitFor(() => expect(checkout).toHaveBeenCalledTimes(2));
    expect(addLines).toHaveBeenCalledTimes(1);
  });

  it("lets the customer compare and buy the bowl without leaving the sand page", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <LaunchProductDetails
        launch={sand}
        offers={[sand, bowl, bundle]}
        locale="en"
      />,
    );
    const offers = within(
      screen.getByRole("region", { name: "Your moment, your choice." }),
    );
    await user.selectOptions(
      offers.getByLabelText("Candle sand colour & scent"),
      sand.product.variants[2].id,
    );
    expect(
      screen.getByRole("radio", { name: "Latte Beige · Pure Serenity" }),
    ).toBeChecked();
    expect(container.querySelector(".product-price")).toHaveTextContent("449");
    await user.click(offers.getByRole("radio", { name: /^Alva / }));
    await user.click(
      offers.getByRole("button", { name: "Checkout with Alva" }),
    );
    await offers.findByRole("alert");
    expect(addLines).toHaveBeenCalledWith([
      { merchandiseId: bowl.product.variants[0].id, quantity: 1 },
    ]);
  });

  it("disables a bundle when the exact matching colour is unavailable", async () => {
    const user = userEvent.setup();
    const unavailable = structuredClone(bundle);
    unavailable.product.variants[2].available = false;
    render(
      <LaunchProductDetails
        launch={sand}
        offers={[sand, bowl, unavailable]}
        locale="en"
      />,
    );
    await user.click(
      screen.getByRole("radio", { name: "Latte Beige · Pure Serenity" }),
    );
    const offers = within(
      screen.getByRole("region", { name: "Your moment, your choice." }),
    );
    expect(
      offers.getByRole("button", { name: "Checkout with Luma + Alva" }),
    ).toBeDisabled();
    expect(offers.getByRole("radio", { name: /Luma \+ Alva/ })).toBeDisabled();
    expect(addLines).not.toHaveBeenCalled();
  });

  it("keeps the selected colour, photo, standalone price and merchandise ID together", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <LaunchProductDetails launch={sand} locale="en" />,
    );
    expect(container.querySelector(".purchase-contents")).toHaveTextContent(
      "300 g candle sand + four cotton wicks",
    );
    expect(screen.getByRole("button", { name: "Checkout" })).toBeVisible();
    expect(screen.getAllByRole("radio")).toHaveLength(11);
    expect(screen.getByText(/349/)).toBeInTheDocument();
    expect(container.querySelector(".stock-label")).toHaveTextContent(
      "Pre-order",
    );
    expect(
      container.querySelectorAll(".gallery-thumbnails button"),
    ).toHaveLength(9);
    await user.click(screen.getByRole("button", { name: /^Image 2:/ }));
    expect(
      screen.getByRole("link", { name: /Open full-size image/ }),
    ).toHaveAttribute(
      "href",
      "/media/products/candle-sand/csand-11-supplier-5ghn.jpg",
    );
    await user.click(
      screen.getByRole("radio", { name: "Dusty Rose · Maison de Roses" }),
    );
    expect(
      screen.getByRole("link", { name: /Open full-size image/ }),
    ).toHaveAttribute("href", launchSandChoices[7].photo.url);
    expect(screen.getByText(/449/)).toBeInTheDocument();
    expect(
      container.querySelectorAll(".gallery-thumbnails button"),
    ).toHaveLength(5);
    expect(screen.getByText(/A candle vessel is not included/)).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Add to bag" }));
    expect(addLines).toHaveBeenCalledWith([
      { merchandiseId: sand.product.variants[7].id, quantity: 1 },
    ]);
  });

  it("switches every colour to its own supplier gallery, including both whites", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <LaunchProductDetails launch={sand} locale="en" />,
    );
    for (const choice of launchSandChoices) {
      await user.click(screen.getByRole("radio", { name: choice.label.en }));
      const gallery = screen.getByRole("link", {
        name: /Open full-size image/,
      });
      expect(gallery).toHaveAttribute("href", choice.photo.url);
      expect(
        container.querySelectorAll(".gallery-thumbnails button"),
      ).toHaveLength(choice.sku === "CSand-11" ? 9 : 5);
      await user.click(screen.getByRole("button", { name: /^Image 2:/ }));
      expect(gallery.getAttribute("href")).toContain(
        `${choice.sku.toLowerCase()}-supplier-`,
      );
      expect(screen.getByRole("button", { name: /^Image 2:/ })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
    }
  });

  it("leads with the styled bowl image, retains supplier detail photos and adds one separate bowl", async () => {
    const user = userEvent.setup();
    render(<LaunchProductDetails launch={bowl} locale="sv" />);
    expect(screen.queryByRole("radio")).toBeNull();
    expect(screen.getAllByRole("button", { name: /^Bild \d:/ })).toHaveLength(
      4,
    );
    const gallery = screen.getByRole("link", { name: /Öppna stor bild/ });
    expect(gallery).toHaveAttribute(
      "href",
      "/media/products/alva/noorly-alva-studio.webp",
    );
    expect(
      screen.getByText(
        "Stylad produktbild. Se fler bilder för skålens detaljer.",
        { exact: true },
      ),
    ).toBeVisible();
    for (const [index, photo] of launchBundlePhotos.entries()) {
      await user.click(
        screen.getByRole("button", {
          name: `Bild ${index + 2}: ${photo.alt.sv}`,
        }),
      );
      expect(gallery).toHaveAttribute("href", photo.url);
    }
    expect(screen.getByText(/550/)).toBeInTheDocument();
    await user.click(screen.getByText("Produkt & användning", { exact: true }));
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
        name: "Luma + Alva · Candle sand & teak bowl",
      }),
    ).toBeVisible();
    expect(screen.getAllByRole("radio")).toHaveLength(11);
    expect(container.querySelector(".product-price")).toHaveTextContent("699");
    expect(container.querySelector(".bundle-value")).toHaveTextContent("200");
    expect(container.querySelector(".stock-label")).toHaveTextContent(
      "Pre-order",
    );
    expect(
      screen.getByRole("link", { name: /Open full-size image/ }),
    ).toHaveAttribute("href", launchSandChoices[0].photo.url);
    expect(screen.getAllByRole("button", { name: /^Image \d+:/ })).toHaveLength(
      12,
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
    expect(container.querySelector(".bundle-value")).toHaveTextContent("250");
    expect(
      screen.getByRole("link", { name: /Open full-size image/ }),
    ).toHaveAttribute("href", launchSandChoices[7].photo.url);
    expect(screen.getAllByRole("button", { name: /^Image \d:/ })).toHaveLength(
      8,
    );
    for (const [index, photo] of launchBundlePhotos.entries())
      expect(
        screen.getByRole("button", {
          name: `Image ${index + 2}: ${photo.alt.en}`,
        }),
      ).toBeVisible();
    expect(container.querySelector(".purchase-contents")).toHaveTextContent(
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
      screen.getByRole("link", { name: /View the teak bowl/ }),
    ).toHaveAttribute("href", "/en/products/teakb-37-dekorativ-teakskal");
    expect(
      screen.getByRole("link", { name: /View the bundle/ }),
    ).toHaveAttribute("href", `/en/products/${launchBundleHandle}`);
    expect(screen.getByText(/From.*349/)).toBeVisible();
    expect(screen.getByText(/550/)).toBeVisible();
    expect(screen.getByText(/From.*699/)).toBeVisible();
    const bundleCard = screen
      .getByRole("heading", { name: "Luma + Alva · Candle sand & teak bowl" })
      .closest("article")!;
    expect(within(bundleCard).getAllByRole("img")).toHaveLength(2);
    expect(
      within(bundleCard).getByRole("img", {
        name: launchSandChoices[0].photo.alt.en,
      }),
    ).toBeVisible();
    expect(
      within(bundleCard).getByRole("img", {
        name: "Alva decorative teak bowl – styled studio image with natural grain and an undulating rim",
      }),
    ).toBeVisible();
  });
});
