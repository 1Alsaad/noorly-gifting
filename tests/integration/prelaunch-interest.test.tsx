import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { PlannedBundleDetails } from "@/components/product/planned-bundle";

afterEach(cleanup);

describe("Noorly prelaunch expression of interest", () => {
  it("offers a Swedish contact link without accepting a purchase", () => {
    render(<PlannedBundleDetails locale="sv" />);
    const link = screen.getByRole("link", {
      name: /Skicka intresseanmälan/,
    });
    expect(link.getAttribute("href")).toMatch(
      /^mailto:support@noorlynordic\.com\?/,
    );
    expect(screen.getByText(/ingen vara reserveras/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /betala|köp/i })).toBeNull();
  });

  it("labels the English page as a nonbinding inquiry", () => {
    render(<PlannedBundleDetails locale="en" />);
    expect(
      screen.getByRole("link", { name: /Send an expression of interest/ }),
    ).toBeInTheDocument();
    expect(screen.getByText(/No payment, no order/i)).toBeInTheDocument();
  });
});
