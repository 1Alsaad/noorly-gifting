import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ColourStudio } from "@/components/home/colour-studio";
import { colourStories } from "@/content/colour-story";
import { launchSandChoices } from "@/content/launch-bundle";
import { launchProductDefinitions } from "@/content/launch-catalog";
import type { Product } from "@/types/commerce";

// Distinct fixture prices catch substituting the product's starting price for
// the exact selected Shopify variant. These are test data, not customer prices.
const prices = [449, 479, 459, 349];
const product: Product = {
  ...launchProductDefinitions[0].preview,
  id: launchProductDefinitions[0].id,
  available: true,
  previewOnly: false,
  variants: colourStories.map(({ sku }, index) => {
    const choice = launchSandChoices.find((item) => item.sku === sku)!;
    return {
      id: `gid://shopify/ProductVariant/${55883112087894 + index * 32768}`,
      sku,
      title: choice.label.en,
      label: choice.label,
      color: choice.color,
      scent: choice.scent,
      price: { amount: prices[index], currencyCode: "SEK" },
      available: true,
      images: [{ url: choice.photo.url, alt: choice.photo.alt.en }],
    };
  }),
};

function originalImageSource(image: HTMLElement) {
  const source = image.getAttribute("src")!;
  return new URL(source, "http://localhost").searchParams.get("url") ?? source;
}

describe("the interactive colour studio", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_PRODUCT_TEST_MODE", "false");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it.each(["sv", "en"] as const)(
    "keeps each selected colour, supplier photo, exact price and product link together in %s",
    async (locale) => {
      const user = userEvent.setup();
      render(<ColourStudio locale={locale} product={product} />);
      for (const [index, { sku }] of colourStories.entries()) {
        const choice = launchSandChoices.find((item) => item.sku === sku)!;
        const name = choice.color.name[locale];
        const button = screen.getByRole("button", { name });
        await user.click(button);
        expect(button).toHaveAttribute("aria-pressed", "true");
        expect(screen.getAllByRole("button", { pressed: true })).toHaveLength(
          1,
        );
        const image = screen.getByRole("img", {
          name: choice.photo.alt[locale],
        });
        expect(originalImageSource(image)).toBe(choice.photo.url);
        expect(
          screen.getByText(new RegExp(String(prices[index]))),
        ).toBeVisible();
        expect(
          screen.getByRole("link", {
            name: `${locale === "sv" ? "Upptäck" : "Discover"} ${name}`,
          }),
        ).toHaveAttribute(
          "href",
          `/${locale}/products/candle-sand?colour=${sku}`,
        );
      }
    },
  );

  it("does not advertise a different variant's price when the selected SKU is missing", async () => {
    const user = userEvent.setup();
    render(
      <ColourStudio
        locale="en"
        product={{
          ...product,
          variants: product.variants.filter(({ sku }) => sku !== "CSand-07"),
        }}
      />,
    );
    const rose = screen.getByRole("button", { name: "Dusty Rose" });
    await user.click(rose);
    expect(rose).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByText(/349|449|459|479/)).toBeNull();
    expect(screen.getByText("Currently unavailable")).toBeVisible();
    expect(
      screen.getByRole("link", { name: "See available colours" }),
    ).toHaveAttribute("href", "/en/products/candle-sand");
    expect(
      screen.queryByRole("link", { name: "Discover Dusty Rose" }),
    ).toBeNull();
    await user.click(screen.getByRole("button", { name: "White" }));
    expect(screen.getByText(/349/)).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Discover White" }),
    ).toHaveAttribute("href", "/en/products/candle-sand?colour=CSand-11");
  });
});
