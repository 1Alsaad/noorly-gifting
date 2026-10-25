import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BrandProof } from "@/components/layout/brand-proof";
import {
  BundleValue,
  ProductProof,
  PurchaseConfidence,
  PurchaseAnswers,
} from "@/components/product/purchase-confidence";
import { launchProductDefinitions } from "@/content/launch-catalog";
import type { ProductVariant } from "@/types/commerce";
import {
  ProductBadges,
  PaymentBadges,
} from "@/components/product/product-badges";

const variant: ProductVariant = {
  id: "bundle",
  title: "White",
  available: true,
  requiresComponents: true,
  price: { amount: 699, currencyCode: "SEK" },
  components: [349, 550].map((amount, index) => ({
    quantity: 1,
    product: {
      id: String(index),
      handle: String(index),
      title: { sv: "Del", en: "Item" },
    },
    variant: {
      id: String(index),
      title: "Component",
      available: true,
      price: { amount, currencyCode: "SEK" },
    },
  })),
};

describe("purchase confidence without unsupported claims", () => {
  it("uses verified sand claims and the enabled payment methods without applying vegan to the bowl", () => {
    const { rerender, container } = render(
      <>
        <ProductBadges
          product={launchProductDefinitions[0].preview}
          locale="en"
        />
        <PaymentBadges locale="en" />
      </>,
    );
    expect(screen.getByText("Vegan candle sand")).toBeVisible();
    expect(screen.getByText("Founded in Sweden")).toBeVisible();
    for (const method of [
      "Visa",
      "Mastercard",
      "Shop Pay",
      "Apple Pay",
      "Google Pay",
    ])
      expect(screen.getByText(method)).toBeVisible();
    expect(container).not.toHaveTextContent(/Klarna|PayPal|made in Sweden/i);
    rerender(
      <ProductBadges
        product={launchProductDefinitions[1].preview}
        locale="en"
      />,
    );
    expect(screen.getByText("Handmade teak bowl")).toBeVisible();
    expect(container).not.toHaveTextContent(/vegan/i);
  });
  it("scopes handmade to the bowls and does not invent environmental claims", () => {
    const { container } = render(<BrandProof locale="en" />);
    expect(screen.getByText("Founded in Sweden")).toBeVisible();
    expect(screen.getByText("Handmade teak bowls")).toBeVisible();
    expect(container).not.toHaveTextContent(/vegan|recyclable|made in Sweden/i);
  });
  it("uses product-specific facts rather than transferring bowl claims to sand", () => {
    const { rerender, container } = render(
      <ProductProof
        product={launchProductDefinitions[0].preview}
        locale="en"
      />,
    );
    expect(container).toHaveTextContent("4 cotton wicks included");
    expect(container).not.toHaveTextContent(/handmade|vegan|recyclable/i);
    rerender(
      <ProductProof
        product={launchProductDefinitions[1].preview}
        locale="en"
      />,
    );
    expect(screen.getByText("Handmade")).toBeVisible();
    expect(container).not.toHaveTextContent("cotton wicks");
  });
  it("updates the saving when the selected bundle changes", () => {
    const { rerender, container } = render(
      <BundleValue variant={variant} locale="en" />,
    );
    expect(container).toHaveTextContent(/Save.*200/);
    expect(container).toHaveTextContent(/separately today:.*899/);
    const scented = structuredClone(variant);
    scented.price.amount = 749;
    scented.components![0].variant.price.amount = 449;
    rerender(<BundleValue variant={scented} locale="en" />);
    expect(container).toHaveTextContent(/Save.*250/);
    expect(container).toHaveTextContent(/separately today:.*999/);
    expect(container.querySelector("del, s")).toBeNull();
  });
  it("keeps dispatch uncertainty explicit and links the full return terms", () => {
    const { container } = render(
      <>
        <PurchaseConfidence locale="en" />
        <PurchaseAnswers locale="en" />
      </>,
    );
    expect(container).toHaveTextContent("An arrival date is not yet confirmed");
    expect(container).toHaveTextContent("You pay return postage");
    expect(
      screen.getByRole("link", { name: /Return terms/, hidden: true }),
    ).toHaveAttribute("href", "/en/shipping-returns");
    expect(container).not.toHaveTextContent(
      /free returns|24 hours|only.*left/i,
    );
  });
});
