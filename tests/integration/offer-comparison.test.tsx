import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OfferComparison } from "@/components/product/offer-comparison";

afterEach(() => vi.unstubAllEnvs());

describe("proposed candle-sand formats", () => {
  it("preserves the selected variant and every pouch in the interest handoff", () => {
    vi.stubEnv("NEXT_PUBLIC_PRODUCT_TEST_MODE", "true");
    render(
      <OfferComparison
        locale="sv"
        productHandle="candle-sand"
        variantId="candle-sand-07"
      />,
    );
    const links = screen.getAllByRole("link", { name: /Utforska formatet/ });
    expect(links).toHaveLength(3);
    links.forEach((link, index) => {
      const url = new URL(link.getAttribute("href")!, "https://example.com");
      expect(url.pathname).toBe("/sv/interest");
      expect(url.searchParams.get("variant")).toBe("candle-sand-07");
      expect(url.searchParams.get("box")?.split(",")).toEqual(
        Array(index + 1).fill("candle-sand"),
      );
    });
    expect(screen.getAllByText("Pris ej fastställt")).toHaveLength(3);
    expect(
      screen.getByText(/Kärl, presentask och presentinslagning ingår inte/),
    ).toBeVisible();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("does not show proposed bundle offers during a commerce launch", () => {
    vi.stubEnv("NEXT_PUBLIC_PRODUCT_TEST_MODE", "false");
    const { container } = render(
      <OfferComparison
        locale="en"
        productHandle="candle-sand"
        variantId="real-variant"
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("does not invent multipacks for another product", () => {
    vi.stubEnv("NEXT_PUBLIC_PRODUCT_TEST_MODE", "true");
    const { container } = render(
      <OfferComparison
        locale="en"
        productHandle="notebook-with-strap"
        variantId="pnb-01"
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
