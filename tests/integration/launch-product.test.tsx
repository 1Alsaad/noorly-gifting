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
    id: "gid://shopify/Product/11395078259030",
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
        id: "gid://shopify/ProductVariant/56006367281494",
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

  it("shows the authenticated supplier bowl photos in order and distinguishes them from the complete kit", async () => {
    const user = userEvent.setup();
    render(<PlannedBundleDetails locale="en" />);
    const fullSize = screen.getByRole("link", { name: /Open full-size image/ });
    expect(fullSize).toHaveAttribute("href", launchBundlePhotos[0].url);
    expect(
      screen.getByText(/supplier photographs show model TeakB-37/),
    ).toHaveTextContent("fruit is styling and is not included");
    expect(
      screen.getByText(/complete Ljusstund set will follow/),
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
        merchandiseId: "gid://shopify/ProductVariant/56006367281494",
        quantity: 1,
      },
    ]);
  });

  it("shows a customer purchase link and actual price instead of the planned offer on collection cards", () => {
    render(<PlannedBundleCard locale="en" launch={launch} />);
    expect(
      screen.getByRole("link", { name: /View details and buy/ }),
    ).toHaveAttribute("href", `/en/products/${launchBundleHandle}`);
    expect(screen.queryByText(/not yet open/i)).toBeNull();
    expect(screen.queryByText(/799/)).toBeNull();
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
