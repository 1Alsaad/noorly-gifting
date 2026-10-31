import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CartView } from "@/features/cart/cart-view";
import { LaunchCatalogGrid } from "@/components/product/launch-catalog";
import { ProductGallery } from "@/components/product/product-gallery";
import { mockProducts } from "@/content/products";
import { launchProductDefinitions } from "@/content/launch-catalog";
import { launchBundlePhotos } from "@/content/launch-bundle";
import type { Cart } from "@/types/commerce";

const state = vi.hoisted(() => ({
  cart: null as Cart | null,
  loading: false,
  error: null,
  updateLine: vi.fn(),
  removeLines: vi.fn(),
  checkout: vi.fn(),
}));
vi.mock("@/features/cart/cart-provider", () => ({ useCart: () => state }));

function expectDecorativeVector(control: HTMLElement) {
  const icon = control.querySelector("svg");
  expect(icon).toBeInTheDocument();
  expect(icon).toHaveAttribute("aria-hidden", "true");
  expect(icon?.querySelector("path, polyline, line")).not.toBeNull();
  // Text arrows can switch to coloured emoji glyphs depending on the browser.
  expect(control.textContent).not.toMatch(/[↗↖→←⇢➜]/);
}

describe("checkout copy and browser-independent decorative arrows", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_PRODUCT_TEST_MODE", "false");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("names the Swedish cart action Fortsätt till kassa with a hidden vector arrow", () => {
    const product = mockProducts.find(
      ({ handle }) => handle === "winter-candle",
    )!;
    state.cart = {
      id: "cart",
      total: product.variants[0].price,
      totalQuantity: 1,
      attributes: [],
      lines: [
        {
          id: "line-1",
          merchandiseId: product.variants[0].id,
          product,
          variant: product.variants[0],
          attributes: [],
          quantity: 1,
        },
      ],
    };
    render(<CartView locale="sv" />);
    const checkout = screen.getByRole("button", {
      name: "Fortsätt till kassa",
    });
    expect(checkout).toBeEnabled();
    expect(checkout).toHaveTextContent(/^Fortsätt till kassa$/);
    expectDecorativeVector(checkout);
  });

  it("keeps collection link names free of decorative arrow characters", () => {
    render(
      <LaunchCatalogGrid
        locale="sv"
        launches={launchProductDefinitions.map(({ preview }) => ({
          product: preview,
          source: "preparation",
          salesOpen: false,
          purchasable: false,
        }))}
      />,
    );
    for (const name of ["Välj färg & doft", "Se teakskålen", "Se paketet"]) {
      const link = screen.getByRole("link", { name });
      expect(link).toHaveAttribute(
        "href",
        expect.stringMatching(/^\/sv\/products\//),
      );
      expectDecorativeVector(link);
    }
  });

  it("uses named SVG gallery controls while keeping image navigation functional", async () => {
    const user = userEvent.setup();
    const images = launchBundlePhotos.map((photo) => ({
      url: photo.url,
      alt: photo.alt.sv,
    }));
    render(<ProductGallery images={images} locale="sv" title="Teakskål" />);
    await user.click(
      screen.getByRole("link", { name: "Öppna stor bild: Teakskål" }),
    );
    const dialog = within(screen.getByRole("dialog"));
    const next = dialog.getByRole("button", { name: "Nästa bild" });
    const previous = dialog.getByRole("button", { name: "Föregående bild" });
    expectDecorativeVector(next);
    expectDecorativeVector(previous);
    await user.click(next);
    expect(dialog.getByRole("img")).toHaveAttribute("alt", images[1].alt);
    await user.click(previous);
    expect(dialog.getByRole("img")).toHaveAttribute("alt", images[0].alt);
  });
});
