import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  PlannedBundleCard,
  PlannedBundleDetails,
} from "@/components/product/planned-bundle";
import {
  launchBundleHandle,
  launchBundlePhotos,
} from "@/content/launch-bundle";
import type { LaunchProductState } from "@/lib/commerce/launch-product";

const { addLines } = vi.hoisted(() => ({ addLines: vi.fn() }));
vi.mock("@/features/cart/cart-provider", () => ({
  useCart: () => ({ addLines, loading: false }),
}));
vi.mock("@/lib/analytics/client", () => ({ trackEvent: vi.fn() }));

const launch: LaunchProductState = {
  source: "shopify",
  salesOpen: true,
  purchasable: true,
  product: {
    id: "gid://shopify/Product/11401864249686",
    handle: launchBundleHandle,
    title: { sv: "Noorly Ljusstund", en: "Noorly Ljusstund" },
    description: {
      sv: "Bekräftat innehåll från Shopify.",
      en: "Confirmed contents from Shopify.",
    },
    price: { amount: 749, currencyCode: "SEK" },
    images: [
      { url: "https://cdn.shopify.com/current-kit.jpg", alt: "Ljusstund" },
    ],
    variants: [
      {
        id: "gid://shopify/ProductVariant/56138148413782",
        title: "Presentset",
        price: { amount: 749, currencyCode: "SEK" },
        available: true,
      },
    ],
    available: true,
    category: "box",
    seasons: ["winter"],
    boxEligible: false,
  },
};

describe("the connected launch presentation", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_PRODUCT_TEST_MODE", "false");
    addLines.mockReset().mockResolvedValue(undefined);
  });
  afterEach(() => vi.unstubAllEnvs());

  it("shows the bowl photos in order and distinguishes them from the complete kit", async () => {
    const user = userEvent.setup();
    render(<PlannedBundleDetails locale="en" />);
    const fullSize = screen.getByRole("link", { name: /Open full-size image/ });
    expect(fullSize).toHaveAttribute("href", launchBundlePhotos[0].url);
    expect(
      screen.getByText(/Each teak bowl has its own shape and grain/),
    ).toHaveTextContent(
      "fruit in the photograph is styling and is not included",
    );
    expect(
      screen.getByText(/complete Ljusstund set has not yet been photographed/),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^Image 2:/ }));
    expect(fullSize).toHaveAttribute("href", launchBundlePhotos[1].url);
    await user.click(screen.getByRole("button", { name: /^Image 3:/ }));
    expect(fullSize).toHaveAttribute("href", launchBundlePhotos[2].url);
    expect(
      screen.getByRole("img", { name: /styled with citrus fruit/ }),
    ).toBeInTheDocument();
  });

  it("shows the real gallery and adds the exact merchandise variant from the Swedish product page", async () => {
    const user = userEvent.setup();
    render(<PlannedBundleDetails locale="sv" launch={launch} />);
    expect(
      screen.getByRole("link", { name: /Öppna stor bild/ }),
    ).toHaveAttribute("href", "https://cdn.shopify.com/current-kit.jpg");
    expect(screen.getByText(/749\s*kr/)).toBeInTheDocument();
    expect(screen.queryByText(/planerat setpris/i)).toBeNull();
    expect(
      screen.queryByRole("link", { name: /Skicka intresseanmälan/ }),
    ).toBeNull();
    await user.click(screen.getByRole("button", { name: "Lägg i påsen" }));
    expect(addLines).toHaveBeenCalledWith([
      {
        merchandiseId: "gid://shopify/ProductVariant/56138148413782",
        quantity: 1,
      },
    ]);
  });

  it("uses clean product copy for the processed image URL returned by the live product", () => {
    render(
      <PlannedBundleDetails
        locale="en"
        launch={{
          ...launch,
          product: {
            ...launch.product,
            images: [
              {
                url: "https://cdn.shopify.com/s/files/1/1073/5317/8454/files/noorly-teakb37-supplier-bowl-01_d446de8c-20a6-41cc-a742-0439f61c73e6.jpg?v=1792875850",
                alt: "TeakB-37",
              },
            ],
          },
        }}
      />,
    );
    expect(
      screen.getByText(/Each teak bowl has its own shape and grain/),
    ).toHaveTextContent("complete Ljusstund set has not yet been photographed");
    expect(
      screen.getByRole("img", {
        name: /Decorative teak bowl with natural grain/,
      }),
    ).toBeInTheDocument();
  });

  it("shows a customer purchase link and actual price instead of the planned offer on collection cards", () => {
    render(<PlannedBundleCard locale="en" launch={launch} />);
    expect(
      screen.getByRole("link", { name: /View details and buy/ }),
    ).toHaveAttribute("href", `/en/products/${launchBundleHandle}`);
    expect(screen.queryByText(/not yet open/i)).toBeNull();
    expect(screen.queryByText(/799/)).toBeNull();
  });

  it("keeps a kit's selected sand photo, bowl photos, price and Shopify merchandise ID together", async () => {
    const user = userEvent.setup();
    render(
      <PlannedBundleDetails
        locale="en"
        launch={{
          ...launch,
          product: {
            ...launch.product,
            images: launchBundlePhotos.map((photo) => ({
              url: photo.url,
              alt: "TeakB-37",
            })),
            variants: [
              {
                ...launch.product.variants[0],
                sku: "NOORLY-LJUSSTUND-CSand-11",
                title: "Vit · Doftfri",
              },
              {
                ...launch.product.variants[0],
                id: "gid://shopify/ProductVariant/56138148643158",
                sku: "NOORLY-LJUSSTUND-CSand-07",
                title: "Gammalrosa · Maison de Roses",
                price: { amount: 799, currencyCode: "SEK" },
                images: [
                  {
                    url: "https://cdn.shopify.com/s/files/1/1073/5317/8454/files/csand-07-0.jpg?v=1792429313",
                    alt: "Ljussand",
                  },
                ],
              },
            ],
          },
        }}
      />,
    );
    expect(
      screen.getByRole("radio", { name: "White · Unscented" }),
    ).toBeChecked();
    expect(screen.getByText("White · unscented")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Open full-size image/ }),
    ).toHaveAttribute(
      "href",
      "https://cdn.shopify.com/s/files/1/1073/5317/8454/files/csand-11-0.jpg?v=1792429599",
    );
    await user.click(
      screen.getByRole("radio", { name: "Dusty Rose · Maison de Roses" }),
    );
    expect(
      screen.getByRole("link", { name: /Open full-size image/ }),
    ).toHaveAttribute(
      "href",
      "https://cdn.shopify.com/s/files/1/1073/5317/8454/files/csand-07-0.jpg?v=1792429313",
    );
    expect(screen.getByText(/799/)).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /^Image \d:/ })).toHaveLength(
      4,
    );
    await user.click(screen.getByRole("button", { name: /^Image 2:/ }));
    expect(
      screen.getByRole("link", { name: /Open full-size image/ }),
    ).toHaveAttribute("href", launchBundlePhotos[0].url);
    expect(
      screen.getByText(/One 300 g pouch and four cotton wicks/),
    ).toHaveTextContent("complete Ljusstund set has not yet been photographed");
    expect(
      screen.getByText(/dispatch your order as soon as.*in stock/),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/will be confirmed|photos.*will follow/i),
    ).toBeNull();
    await user.click(screen.getByRole("button", { name: "Add to bag" }));
    expect(addLines).toHaveBeenCalledWith([
      {
        merchandiseId: "gid://shopify/ProductVariant/56138148643158",
        quantity: 1,
      },
    ]);
  });

  it("does not guess a candle-sand choice from a colour alone or alter an unavailable variant", () => {
    render(
      <PlannedBundleDetails
        locale="en"
        launch={{
          ...launch,
          product: {
            ...launch.product,
            variants: [
              {
                ...launch.product.variants[0],
                title: "White",
                available: false,
              },
            ],
          },
        }}
      />,
    );
    expect(screen.queryByRole("radio")).toBeNull();
    expect(
      screen.getByRole("link", { name: /Open full-size image/ }),
    ).toHaveAttribute("href", "https://cdn.shopify.com/current-kit.jpg");
    expect(
      screen.getByRole("button", { name: /Sold out|Unavailable/i }),
    ).toBeDisabled();
  });

  it("keeps unavailable published stock visible without a purchase button or fictitious quantities", () => {
    render(
      <PlannedBundleDetails
        locale="en"
        launch={{ ...launch, purchasable: false }}
      />,
    );
    expect(
      screen.getByText(/currently unavailable to order/),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Add to bag/ })).toBeNull();
    expect(
      screen.getByRole("link", { name: /Ask us about Ljusstund/ }),
    ).toBeInTheDocument();
  });
});
